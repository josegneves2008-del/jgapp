// Testes das regras da v2 (js/v2-core.js) e da validação de fotografias (js/image-safety.js).
// Dados fictícios. As regras de stock são contas, não regras clínicas.
process.env.TZ = 'Europe/Lisbon';
import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const V2 = require('../js/v2-core.js');
const IMG = require('../js/image-safety.js');

const TODAY = '2026-11-06';
const CTX = { now: '2026-11-06T10:00:00.000Z', today: TODAY, timeZone: 'Europe/Lisbon' };
let n = 0;
const opId = () => 'op_test_' + (++n);

function apply(st, op, ctx = CTX) {
  const out = V2.applyOperation(st, Object.assign({ operationId: opId() }, op), ctx);
  return out;
}
function must(st, op, ctx) {
  const out = apply(st, op, ctx);
  expect(out.result.status, JSON.stringify(out.result)).toBe('applied');
  expect(V2.validateState(out.state)).toEqual([]);
  return out.state;
}
/** Medicamento fictício com lembrete às 08:00 e 20:00 e stock de 10 comprimidos (1 por toma). */
function base(initial = 10) {
  let st = V2.emptyState();
  st = must(st, { type: 'medication_upsert', medication: { id: 'med_a', name: 'Medicamento Teste A', dosage: '10 mg' } });
  st = must(st, { type: 'reminder_upsert', reminder: { id: 'rem_a', medicationId: 'med_a', times: ['08:00', '20:00'], isActive: true } });
  st = must(st, { type: 'stock_config', medicationId: 'med_a', unit: 'comprimido', amountPerDose: 1, initialQuantity: initial });
  return st;
}

describe('stock: movimentos', () => {
  it('configuração cria um movimento initial e saldo', () => {
    const st = base(10);
    expect(V2.stockBalance(st, 'med_a')).toBe(10);
    const mv = V2.movementsFor(st, 'med_a');
    expect(mv.map((m) => m.type)).toEqual(['initial']);
    expect(mv[0].seq).toBe(1);
    expect(st.nextSeq).toBe(2);
  });

  it('entrada, saída, ajuste e contagem', () => {
    let st = base(10);
    st = must(st, { type: 'stock_entry', medicationId: 'med_a', quantity: 20 });
    expect(V2.stockBalance(st, 'med_a')).toBe(30);
    st = must(st, { type: 'stock_exit', medicationId: 'med_a', quantity: 5 });
    expect(V2.stockBalance(st, 'med_a')).toBe(25);
    st = must(st, { type: 'stock_adjustment', medicationId: 'med_a', newQuantity: 22 });
    expect(V2.stockBalance(st, 'med_a')).toBe(22);
    st = must(st, { type: 'stock_count', medicationId: 'med_a', countedQuantity: 21 });
    expect(V2.stockBalance(st, 'med_a')).toBe(21);
    const last = V2.movementsFor(st, 'med_a').pop();
    expect(last.type).toBe('count');
    expect(last.balanceAfter).toBe(21);
  });

  it('frações sem erros de arredondamento (0,1 + 0,2)', () => {
    let st = V2.emptyState();
    st = must(st, { type: 'medication_upsert', medication: { id: 'med_x', name: 'Xarope Teste' } });
    st = must(st, { type: 'stock_config', medicationId: 'med_x', unit: 'ml', amountPerDose: 2.5, initialQuantity: 0.1 });
    st = must(st, { type: 'stock_entry', medicationId: 'med_x', quantity: 0.2 });
    expect(V2.stockBalance(st, 'med_x')).toBe(0.3);
  });

  it('saída superior ao saldo é rejeitada e o saldo nunca fica negativo', () => {
    const st = base(3);
    const out = apply(st, { type: 'stock_exit', medicationId: 'med_a', quantity: 4 });
    expect(out.result).toMatchObject({ status: 'rejected', reason: 'would_be_negative' });
    expect(V2.stockBalance(out.state, 'med_a')).toBe(3);
    expect(V2.movementsFor(out.state, 'med_a').length).toBe(1);
    // a rejeição fica registada (rejeição funcional persistida)
    expect(out.changed).toBe(true);
    expect(out.state.operations.pop().rejectReason).toBe('would_be_negative');
  });

  it('valores inválidos são rejeitados sem gravar', () => {
    const st = base(3);
    for (const q of [0, -1, 'abc', 1.234, NaN]) {
      const out = apply(st, { type: 'stock_entry', medicationId: 'med_a', quantity: q });
      expect(out.result.status).toBe('rejected');
      expect(out.changed).toBe(false);
    }
    expect(apply(st, { type: 'stock_config', medicationId: 'med_a', unit: 'kg', amountPerDose: 1, initialQuantity: 1 }).result.reason).toBe('invalid_unit');
    expect(apply(st, { type: 'stock_entry', medicationId: 'nao_existe', quantity: 1 }).result.reason).toBe('stock_not_configured');
  });

  it('unidade bloqueada depois de haver movimentos (10 comprimidos, 2 saídas, não passam a 8 caixas)', () => {
    let st = base(10);
    st = must(st, { type: 'stock_exit', medicationId: 'med_a', quantity: 1 });
    st = must(st, { type: 'stock_exit', medicationId: 'med_a', quantity: 1 });
    const before = JSON.stringify(st.stockMovements);
    // 'caixa' nem sequer é uma unidade aceite; a mudança para outra unidade válida ('unidade') também é bloqueada.
    expect(apply(st, { type: 'stock_config', medicationId: 'med_a', unit: 'caixa', amountPerDose: 1 }).result.reason).toBe('invalid_unit');
    const out = apply(st, { type: 'stock_config', medicationId: 'med_a', unit: 'unidade', amountPerDose: 1, confirmAmountChange: true });
    expect(out.result).toMatchObject({ status: 'rejected', reason: 'unit_locked' });
    expect(out.changed).toBe(false);
    expect(out.state.stockConfig.med_a.unit).toBe('comprimido');
    expect(V2.stockBalance(out.state, 'med_a')).toBe(8);
    expect(JSON.stringify(out.state.stockMovements)).toBe(before);
  });

  it('unidade bloqueada logo após a configuração (o stock inicial já é um movimento)', () => {
    const st = base(10);
    expect(apply(st, { type: 'stock_config', medicationId: 'med_a', unit: 'ml', amountPerDose: 1 }).result.reason).toBe('unit_locked');
  });

  it('reconfigurar com a mesma unidade e a mesma dose não faz nada; não altera o saldo', () => {
    const st = base(10);
    const out = apply(st, { type: 'stock_config', medicationId: 'med_a', unit: 'comprimido', amountPerDose: 1, initialQuantity: 999 });
    expect(out.result.reason).toBe('no_change');
    expect(V2.stockBalance(out.state, 'med_a')).toBe(10);
  });

  it('quantidade por toma: exige confirmação e fica registada', () => {
    let st = base(10);
    const noConfirm = apply(st, { type: 'stock_config', medicationId: 'med_a', unit: 'comprimido', amountPerDose: 2 });
    expect(noConfirm.result.reason).toBe('amount_change_needs_confirmation');
    expect(noConfirm.state.stockConfig.med_a.amountPerDose).toBe(1);
    st = must(st, { type: 'stock_config', medicationId: 'med_a', unit: 'comprimido', amountPerDose: 2, confirmAmountChange: true, initialQuantity: 999 });
    const cfg = st.stockConfig.med_a;
    expect(cfg.amountPerDose).toBe(2);
    expect(cfg.changes).toHaveLength(1);
    expect(cfg.changes[0]).toMatchObject({ field: 'amountPerDose', from: 1, to: 2 });
    expect(V2.stockBalance(st, 'med_a')).toBe(10); // saldo intacto, sem movimento novo
    expect(V2.movementsFor(st, 'med_a')).toHaveLength(1);
    expect(V2.dosesRemaining(st, 'med_a')).toBe(5);
  });

  it('mudar a quantidade por toma não reescreve consumos antigos; a reversão usa o valor original', () => {
    let st = base(10);
    const out = apply(st, { type: 'record_dose', reminderId: 'rem_a', date: TODAY, time: '08:00', status: 'taken' });
    st = out.state; const id = out.result.doseRecordId;
    expect(V2.stockBalance(st, 'med_a')).toBe(9);
    st = must(st, { type: 'stock_config', medicationId: 'med_a', unit: 'comprimido', amountPerDose: 2, confirmAmountChange: true });
    const cons = V2.movementsFor(st, 'med_a').find((m) => m.type === 'consumption');
    expect(cons.delta).toBe(-1);
    expect(V2.findRecord(st, id).dose.amount).toBe(1);
    st = must(st, { type: 'change_status', doseRecordId: id, to: 'not_taken' });
    expect(V2.stockBalance(st, 'med_a')).toBe(10); // devolve 1, o valor que foi descontado
    // nova toma usa a nova quantidade
    st = must(st, { type: 'record_dose', reminderId: 'rem_a', date: TODAY, time: '20:00', status: 'taken' });
    expect(V2.stockBalance(st, 'med_a')).toBe(8);
  });

  it('quantidade por toma inválida é rejeitada', () => {
    const st = base(10);
    for (const v of [0, -1, 'x', 1.234]) expect(apply(st, { type: 'stock_config', medicationId: 'med_a', unit: 'comprimido', amountPerDose: v, confirmAmountChange: true }).result.reason).toBe('invalid_amount');
  });

  it('reverter uma entrada: uma só vez, sem duplicar', () => {
    let st = base(10);
    st = must(st, { type: 'stock_entry', medicationId: 'med_a', quantity: 20 });
    const entry = V2.movementsFor(st, 'med_a').find((m) => m.type === 'entry');
    st = must(st, { type: 'stock_revert', movementId: entry.id });
    expect(V2.stockBalance(st, 'med_a')).toBe(10);
    const again = apply(st, { type: 'stock_revert', movementId: entry.id });
    expect(again.result.reason).toBe('already_reverted');
    expect(V2.stockBalance(again.state, 'med_a')).toBe(10);
    const initial = V2.movementsFor(st, 'med_a')[0];
    expect(apply(st, { type: 'stock_revert', movementId: initial.id }).result.reason).toBe('not_revertible');
  });

  it('reverter uma entrada que já foi gasta seria negativo: rejeitado', () => {
    let st = base(0);
    st = must(st, { type: 'stock_entry', medicationId: 'med_a', quantity: 5 });
    const entry = V2.movementsFor(st, 'med_a').find((m) => m.type === 'entry');
    st = must(st, { type: 'stock_exit', medicationId: 'med_a', quantity: 4 });
    expect(apply(st, { type: 'stock_revert', movementId: entry.id }).result.reason).toBe('would_be_negative');
  });

  it('reverter depois de uma contagem não mexe no saldo (delta 0)', () => {
    let st = base(10);
    st = must(st, { type: 'stock_entry', medicationId: 'med_a', quantity: 20 });
    const entry = V2.movementsFor(st, 'med_a').find((m) => m.type === 'entry');
    st = must(st, { type: 'stock_count', medicationId: 'med_a', countedQuantity: 28 });
    st = must(st, { type: 'stock_revert', movementId: entry.id });
    expect(V2.stockBalance(st, 'med_a')).toBe(28);
    expect(V2.movementsFor(st, 'med_a').pop().delta).toBe(0);
  });

  it('stock baixo: 5 tomas ou menos', () => {
    expect(V2.isLowStock(base(6), 'med_a')).toBe(false);
    expect(V2.isLowStock(base(5), 'med_a')).toBe(true);
  });
});

describe('tomas', () => {
  it('registar toma desconta exatamente uma vez', () => {
    let st = base(10);
    const out = apply(st, { type: 'record_dose', reminderId: 'rem_a', date: TODAY, time: '08:00', status: 'taken' });
    expect(out.result.status).toBe('applied');
    st = out.state;
    expect(V2.stockBalance(st, 'med_a')).toBe(9);
    const rec = V2.findRecord(st, out.result.doseRecordId);
    expect(rec.stock.status).toBe('deducted');
    // mesmo horário outra vez: já registado, sem novo desconto
    const dup = apply(st, { type: 'record_dose', reminderId: 'rem_a', date: TODAY, time: '08:00', status: 'taken' });
    expect(dup.result.reason).toBe('already_recorded');
    expect(V2.stockBalance(dup.state, 'med_a')).toBe(9);
  });

  it('o mesmo operationId repetido é ignorado', () => {
    const st = base(10);
    const op = { operationId: 'op_fixo_1', type: 'record_dose', reminderId: 'rem_a', date: TODAY, time: '08:00', status: 'taken' };
    const a = V2.applyOperation(st, op, CTX);
    const b = V2.applyOperation(a.state, op, CTX);
    expect(b.result.status).toBe('duplicate_ignored');
    expect(b.changed).toBe(false);
    expect(V2.stockBalance(b.state, 'med_a')).toBe(9);
  });

  it('stock insuficiente: não desconta nada e regista um problema', () => {
    let st = V2.emptyState();
    st = must(st, { type: 'medication_upsert', medication: { id: 'med_b', name: 'Teste B' } });
    st = must(st, { type: 'reminder_upsert', reminder: { id: 'rem_b', medicationId: 'med_b', times: ['08:00'], isActive: true } });
    st = must(st, { type: 'stock_config', medicationId: 'med_b', unit: 'comprimido', amountPerDose: 2, initialQuantity: 1 });
    const out = apply(st, { type: 'record_dose', reminderId: 'rem_b', date: TODAY, time: '08:00', status: 'taken' });
    expect(out.result.status).toBe('applied');
    expect(out.result.stock.reason).toBe('insufficient_stock');
    expect(V2.stockBalance(out.state, 'med_b')).toBe(1);
    expect(V2.openIssues(out.state, 'med_b').length).toBe(1);
    expect(V2.validateState(out.state)).toEqual([]);
  });

  it('sem stock configurado: regista a toma sem descontar', () => {
    let st = V2.emptyState();
    st = must(st, { type: 'medication_upsert', medication: { id: 'med_c', name: 'Teste C' } });
    st = must(st, { type: 'reminder_upsert', reminder: { id: 'rem_c', medicationId: 'med_c', times: ['09:00'], isActive: true } });
    const out = apply(st, { type: 'record_dose', reminderId: 'rem_c', date: TODAY, time: '09:00', status: 'taken' });
    expect(out.result.stock.reason).toBe('stock_not_configured');
    expect(V2.stockBalance(out.state, 'med_c')).toBe(null);
  });

  it('corrigir tomada → não tomada devolve o stock; voltar a tomada desconta outra vez', () => {
    let st = base(10);
    let out = apply(st, { type: 'record_dose', reminderId: 'rem_a', date: TODAY, time: '08:00', status: 'taken' });
    st = out.state; const id = out.result.doseRecordId;
    st = must(st, { type: 'change_status', doseRecordId: id, to: 'not_taken', reason: 'esqueci', expectedRevision: 1 });
    expect(V2.stockBalance(st, 'med_a')).toBe(10);
    expect(V2.findRecord(st, id).notTakenReason).toBe('esqueci');
    st = must(st, { type: 'change_status', doseRecordId: id, to: 'taken', expectedRevision: 2 });
    expect(V2.stockBalance(st, 'med_a')).toBe(9);
    const types = V2.movementsFor(st, 'med_a').map((m) => m.type);
    expect(types).toEqual(['initial', 'consumption', 'reversal', 'consumption']);
    expect(V2.findRecord(st, id).revisions.length).toBe(3);
  });

  it('revisão desatualizada (dois separadores / duplo clique) é rejeitada', () => {
    let st = base(10);
    const out = apply(st, { type: 'record_dose', reminderId: 'rem_a', date: TODAY, time: '08:00', status: 'taken' });
    st = must(out.state, { type: 'change_status', doseRecordId: out.result.doseRecordId, to: 'not_taken', expectedRevision: 1 });
    const stale = apply(st, { type: 'change_status', doseRecordId: out.result.doseRecordId, to: 'not_taken', expectedRevision: 1 });
    expect(stale.result.reason).toBe('stale_record');
    expect(V2.stockBalance(stale.state, 'med_a')).toBe(10);
  });

  it('anular um registo devolve o stock e liberta o horário', () => {
    let st = base(10);
    const out = apply(st, { type: 'record_dose', reminderId: 'rem_a', date: TODAY, time: '08:00', status: 'taken' });
    st = must(out.state, { type: 'void_record', doseRecordId: out.result.doseRecordId, expectedRevision: 1 });
    expect(V2.stockBalance(st, 'med_a')).toBe(10);
    expect(apply(st, { type: 'void_record', doseRecordId: out.result.doseRecordId }).result.reason).toBe('record_voided');
    st = must(st, { type: 'record_dose', reminderId: 'rem_a', date: TODAY, time: '08:00', status: 'taken' });
    expect(V2.stockBalance(st, 'med_a')).toBe(9);
  });

  it('correção depois de uma contagem não altera o saldo contado (cobertura seq >=)', () => {
    let st = base(10);
    const out = apply(st, { type: 'record_dose', reminderId: 'rem_a', date: TODAY, time: '08:00', status: 'taken' });
    st = out.state; const id = out.result.doseRecordId;
    const rec = V2.findRecord(st, id);
    expect(V2.isCovered(st, rec)).toBe(false);
    st = must(st, { type: 'stock_count', medicationId: 'med_a', countedQuantity: 7 });
    expect(V2.isCovered(st, V2.findRecord(st, id))).toBe(true);
    st = must(st, { type: 'change_status', doseRecordId: id, to: 'not_taken' });
    expect(V2.stockBalance(st, 'med_a')).toBe(7);
  });

  it('limite >=: a referência com seq igual ao stockAnchorSeq cobre o registo', () => {
    let st = base(10);
    // Toma não tomada: stockAnchorSeq = nextSeq (2), nenhum movimento criado.
    const out = apply(st, { type: 'record_dose', reminderId: 'rem_a', date: TODAY, time: '08:00', status: 'not_taken' });
    st = out.state; const id = out.result.doseRecordId;
    expect(V2.findRecord(st, id).stockAnchorSeq).toBe(2);
    st = must(st, { type: 'stock_confirm', medicationId: 'med_a' }); // seq 2
    expect(V2.movementsFor(st, 'med_a').pop().seq).toBe(2);
    expect(V2.isCovered(st, V2.findRecord(st, id))).toBe(true);
    // passar a tomada já não desconta: o stock confirmado depois do registo já o inclui
    st = must(st, { type: 'change_status', doseRecordId: id, to: 'taken' });
    expect(V2.stockBalance(st, 'med_a')).toBe(10);
  });

  it('janela de correção de 7 dias e datas futuras', () => {
    const st = base(10);
    expect(apply(st, { type: 'record_dose', reminderId: 'rem_a', date: '2026-10-30', time: '08:00', status: 'taken' }).result.status).toBe('applied');
    const old = apply(st, { type: 'record_dose', reminderId: 'rem_a', date: '2026-10-29', time: '08:00', status: 'taken' });
    expect(old.result.reason).toBe('correction_window_closed');
    expect(apply(st, { type: 'record_dose', reminderId: 'rem_a', date: '2026-11-07', time: '08:00', status: 'taken' }).result.reason).toBe('correction_window_closed');
    expect(apply(st, { type: 'record_dose', reminderId: 'rem_a', time: '08:00', status: 'taken' }).result.reason).toBe('invalid_date');
    expect(apply(st, { type: 'record_dose', reminderId: 'rem_a', date: TODAY, time: '09:00', status: 'taken' }).result.reason).toBe('unknown_time');
    expect(apply(st, { type: 'record_dose', reminderId: 'rem_a', date: TODAY, time: '08:00', status: 'not_taken', reason: 'inventado' }).result.reason).toBe('invalid_reason');
  });

  it('medicamento removido: lembretes desativados, histórico mantido, restauro possível', () => {
    let st = base(10);
    const out = apply(st, { type: 'record_dose', reminderId: 'rem_a', date: TODAY, time: '08:00', status: 'taken' });
    st = must(out.state, { type: 'medication_remove', medicationId: 'med_a' });
    expect(V2.findMed(st, 'med_a').removedAt).toBeTruthy();
    expect(V2.findReminder(st, 'rem_a').isActive).toBe(false);
    expect(V2.historyEntries(st).length).toBe(1);
    expect(V2.slotsForDay(st, TODAY, Date.parse(CTX.now)).length).toBe(0);
    expect(apply(st, { type: 'record_dose', reminderId: 'rem_a', date: TODAY, time: '20:00', status: 'taken' }).result.reason).toBe('medication_removed');
    st = must(st, { type: 'medication_restore', medicationId: 'med_a' });
    expect(V2.findMed(st, 'med_a').removedAt).toBe(null);
  });

  it('adiar 15/30/60 minutos', () => {
    let st = base(10);
    const slotKey = 'rem_a|' + TODAY + '|20:00';
    st = must(st, { type: 'snooze', slotKey, minutes: 30 });
    const slot = V2.slotsForDay(st, TODAY, Date.parse(CTX.now)).find((s) => s.time === '20:00');
    expect(slot.status).toBe('adiada');
    expect(apply(st, { type: 'snooze', slotKey, minutes: 45 }).result.reason).toBe('invalid_snooze');
  });

  it('applyOperation não altera o estado recebido', () => {
    const st = base(10);
    const before = JSON.stringify(st);
    apply(st, { type: 'record_dose', reminderId: 'rem_a', date: TODAY, time: '08:00', status: 'taken' });
    apply(st, { type: 'stock_exit', medicationId: 'med_a', quantity: 99 });
    expect(JSON.stringify(st)).toBe(before);
  });
});

describe('datas reais', () => {
  it.each([
    ['2026-02-31', false], ['2026-13-01', false], ['2026-04-31', false], ['2028-02-29', true], ['2027-02-29', false],
    ['2026-00-10', false], ['2026-01-00', false], ['2024-02-29', true], ['2100-02-29', false], ['2000-02-29', true],
    ['2026-1-01', false], ['26-01-01', false], ['', false], [null, false], ['2026-11-06', true],
  ])('isValidDateStr(%s) = %s', (d, ok) => { expect(V2.isValidDateStr(d)).toBe(ok); });

  // Registo com data impossível: recusado antes de qualquer outra verificação (incluindo a janela de 7 dias)
  it.each(['2026-02-31', '2026-13-01', '2026-04-31', '2027-02-29'])('record_dose com %s é recusado e nada é gravado', (d) => {
    const st = base(10);
    const out = apply(st, { type: 'record_dose', reminderId: 'rem_a', date: d, time: '08:00', status: 'taken' });
    expect(out.result.reason).toBe('invalid_date');
    expect(out.changed).toBe(false);
    expect(out.state.doseRecords).toHaveLength(0);
    expect(V2.stockBalance(out.state, 'med_a')).toBe(10);
  });

  it('2028-02-29 é aceite (ano bissexto) quando está dentro da janela', () => {
    const st = base(10);
    const ctx = { now: '2028-02-29T12:00:00.000Z', today: '2028-02-29', timeZone: 'Europe/Lisbon' };
    const out = V2.applyOperation(st, { operationId: 'bis1', type: 'record_dose', reminderId: 'rem_a', date: '2028-02-29', time: '08:00', status: 'taken' }, ctx);
    expect(out.result.status).toBe('applied');
    expect(V2.findRecord(out.state, out.result.doseRecordId).scheduledDate).toBe('2028-02-29');
  });

  it('datas impossíveis não são classificadas como mudança de hora', () => {
    for (const d of ['2026-02-31', '2026-13-01', '2026-04-31', '2027-02-29']) expect(V2.classifySlot(d, '08:00').kind).toBe('invalida');
    expect(V2.classifySlot('2026-03-29', '25:00').kind).toBe('invalida');
    expect(V2.classifySlot('2028-02-29', '08:00').kind).toBe('normal');
  });

  it('adiar com data impossível é recusado', () => {
    const st = base(10);
    expect(apply(st, { type: 'snooze', slotKey: 'rem_a|2026-02-31|08:00', minutes: 15 }).result.reason).toBe('invalid_date');
  });
});

describe('mudança de hora (Europe/Lisbon)', () => {
  it('os testes correm mesmo em Europe/Lisbon', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Europe/Lisbon');
    expect(new Date('2026-07-01T12:00:00Z').getTimezoneOffset()).toBe(-60); // WEST
    expect(new Date('2026-01-01T12:00:00Z').getTimezoneOffset()).toBe(0); // WET
  });
  it('a primeira ocorrência da hora repetida é a da hora de verão (00:30 UTC), a segunda é 01:30 UTC', () => {
    const c = V2.classifySlot('2026-10-25', '01:30');
    expect(new Date(c.instant).toISOString()).toBe('2026-10-25T00:30:00.000Z');
    expect(new Date(c.second).toISOString()).toBe('2026-10-25T01:30:00.000Z');
    expect(V2.classifySlot('2026-10-25', '00:59').kind).toBe('normal');
    expect(V2.classifySlot('2026-10-25', '02:00').kind).toBe('normal');
  });
  it('salto de hora: 01:00–01:59 não existem; 00:59 e 02:00 existem', () => {
    expect(V2.classifySlot('2026-03-29', '01:00').kind).toBe('inexistente');
    expect(V2.classifySlot('2026-03-29', '01:59').kind).toBe('inexistente');
    expect(V2.classifySlot('2026-03-29', '00:59').kind).toBe('normal');
    const c = V2.classifySlot('2026-03-29', '02:00');
    expect(c.kind).toBe('normal');
    expect(new Date(c.instant).toISOString()).toBe('2026-03-29T01:00:00.000Z');
  });
  it('29/03/2026: 01:30 não existe', () => {
    expect(V2.classifySlot('2026-03-29', '01:30').kind).toBe('inexistente');
    expect(V2.classifySlot('2026-03-29', '02:30').kind).toBe('normal');
  });
  it('25/10/2026: 01:30 acontece duas vezes', () => {
    const c = V2.classifySlot('2026-10-25', '01:30');
    expect(c.kind).toBe('repetido');
    expect(c.second - c.instant).toBe(3600e3);
  });
  it('dia normal', () => {
    expect(V2.classifySlot('2026-11-06', '08:00').kind).toBe('normal');
  });
  it('horário inexistente aparece como tal e pode ser registado com nota', () => {
    let st = V2.emptyState();
    st = must(st, { type: 'medication_upsert', medication: { id: 'm', name: 'Teste' } });
    st = must(st, { type: 'reminder_upsert', reminder: { id: 'r', medicationId: 'm', times: ['01:30'], isActive: true } });
    const ctx = { now: '2026-03-29T10:00:00.000Z', today: '2026-03-29' };
    expect(V2.slotsForDay(st, '2026-03-29', Date.parse(ctx.now))[0].status).toBe('inexistente');
    const out = V2.applyOperation(st, { operationId: 'dst1', type: 'record_dose', reminderId: 'r', date: '2026-03-29', time: '01:30', status: 'taken' }, ctx);
    expect(V2.findRecord(out.state, out.result.doseRecordId).scheduleNote).toBe('dst_gap');
  });
});

describe('invariantes (validateState)', () => {
  it('estado válido passa', () => { expect(V2.validateState(base(10))).toEqual([]); });
  it('deteta seq duplicado, reversão órfã, saldo negativo e consumo duplicado', () => {
    let st = base(10);
    const out = apply(st, { type: 'record_dose', reminderId: 'rem_a', date: TODAY, time: '08:00', status: 'taken' });
    st = JSON.parse(JSON.stringify(out.state));
    const cons = st.stockMovements.find((m) => m.type === 'consumption');
    st.stockMovements.push(Object.assign({}, cons, { id: 'mov_dup', seq: cons.seq }));
    st.stockMovements.push({ id: 'mov_rev', seq: 99, type: 'reversal', medicationId: 'med_a', delta: 0, reversesMovementId: 'nao_existe' });
    st.stockMovements.push({ id: 'mov_neg', seq: 98, type: 'exit', medicationId: 'med_a', delta: -100 });
    const errs = V2.validateState(st).join(' | ');
    expect(errs).toMatch(/seq duplicado/);
    expect(errs).toMatch(/reversão sem movimento original/);
    expect(errs).toMatch(/saldo negativo/);
    expect(errs).toMatch(/seq fora do intervalo/);
    expect(errs).toMatch(/mais de um consumo aberto/);
  });
  it('estado sem schemaVersion é inválido', () => {
    expect(V2.validateState({}).length).toBeGreaterThan(0);
  });
});

const PNG_1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const JPEG_HEAD = 'data:image/jpeg;base64,' + Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xff, 0xd9]).toString('base64');

describe('migração v1 → v2 (buildV2FromV1)', () => {
  const validate = IMG.validateImageDataUrl;
  const meds = [
    { id: 'm1', name: 'Teste Um', dosage: '5 mg', quantity: 12, imageUri: PNG_1x1 },
    { id: 'm2', name: 'Teste Dois', quantity: '', imageUri: 'data:image/svg+xml;base64,' + Buffer.from('<svg onload="alert(1)"/>').toString('base64') },
  ];
  const rems = [
    { id: 'r1', medicationId: 'm1', times: ['08:00', '25:00'], isActive: true, lastTakenDate: '2026-11-01' },
    { id: 'r2', medicationId: 'm_inexistente', time: '09:00', isActive: true },
  ];
  const hist = [
    { medicationName: 'Teste Um', dosage: '5 mg', dateTime: '02/11/2026, 08:05:00' },
    { medicationName: 'Teste Um', dosage: '5 mg', dateTime: '01/11/2026, 08:01:00' },
  ];
  const raw = { medications: JSON.stringify(meds), reminders: JSON.stringify(rems), history: JSON.stringify(hist) };

  it('copia medicamentos, lembretes e histórico (não confirmado)', () => {
    const out = V2.buildV2FromV1(raw, { validateImage: validate, migrationId: 'mig_t' });
    expect(out.report.errors).toEqual([]);
    expect(out.state.medications.length).toBe(2);
    expect(V2.findMed(out.state, 'm1').legacyQuantity).toBe(12);
    expect(V2.findMed(out.state, 'm2').legacyQuantity).toBe(null);
    expect(V2.findReminder(out.state, 'r1').times).toEqual(['08:00']);
    expect(out.state.doseRecords.every((r) => r.status === 'legacy_unverified')).toBe(true);
    expect(out.state.doseRecords[0].legacyLocalDateTime).toBe('2026-11-01T08:01:00');
    expect(V2.validateState(out.state)).toEqual([]);
  });

  it('fotografia SVG não é copiada; a PNG válida é', () => {
    const out = V2.buildV2FromV1(raw, { validateImage: validate });
    expect(out.report.counts.images).toBe(1);
    expect(out.report.counts.imagesRejected).toBe(1);
    expect(V2.findMed(out.state, 'm2').imageId).toBe(null);
    expect(Object.values(out.images)).toEqual([PNG_1x1]);
  });

  it('lembrete órfão fica desativado com aviso', () => {
    const out = V2.buildV2FromV1(raw, { validateImage: validate });
    const r2 = V2.findReminder(out.state, 'r2');
    expect(r2.isActive).toBe(false);
    expect(r2.orphan).toBe(true);
    expect(r2.times).toEqual(['09:00']);
    expect(out.report.counts.orphanReminders).toBe(1);
  });

  it('JSON corrompido bloqueia a migração', () => {
    const out = V2.buildV2FromV1({ medications: '[{"id":', reminders: null, history: null }, { validateImage: validate });
    expect(out.state).toBe(null);
    expect(out.report.errors[0]).toMatch(/corrompidos/);
  });

  it('conteúdo que não é lista bloqueia a migração', () => {
    const out = V2.buildV2FromV1({ medications: '{"a":1}', reminders: null, history: null }, { validateImage: validate });
    expect(out.state).toBe(null);
  });

  it('IDs repetidos ou em falta bloqueiam a migração', () => {
    const dup = V2.buildV2FromV1({ medications: JSON.stringify([{ id: 'x', name: 'A' }, { id: 'x', name: 'B' }]) }, { validateImage: validate });
    expect(dup.state).toBe(null);
    expect(dup.report.errors[0]).toMatch(/repetido/);
    const noId = V2.buildV2FromV1({ reminders: JSON.stringify([{ medicationId: 'x' }]) }, { validateImage: validate });
    expect(noId.state).toBe(null);
  });

  it('IDs dos registos antigos são estáveis entre execuções', () => {
    const a = V2.legacyRecordsFromHistory(hist).map((r) => r.id);
    const b = V2.legacyRecordsFromHistory(JSON.parse(JSON.stringify(hist))).map((r) => r.id);
    expect(a).toEqual(b);
    // uma entrada nova no topo (mais recente) não muda os IDs anteriores
    const c = V2.legacyRecordsFromHistory([{ medicationName: 'Novo', dateTime: '03/11/2026, 08:00:00' }].concat(hist)).map((r) => r.id);
    expect(c.slice(0, 2)).toEqual(a);
  });

  it('registos antigos são só de leitura', () => {
    const out = V2.buildV2FromV1(raw, { validateImage: validate });
    const id = out.state.doseRecords[0].id;
    const r = V2.applyOperation(out.state, { operationId: 'leg1', type: 'change_status', doseRecordId: id, to: 'taken' }, CTX);
    expect(r.result.reason).toBe('legacy_read_only');
  });

  it('dados vazios: migração válida sem nada', () => {
    const out = V2.buildV2FromV1({ medications: null, reminders: null, history: null }, { validateImage: validate });
    expect(out.report.errors).toEqual([]);
    expect(out.state.medications).toEqual([]);
  });
});

describe('fotografias (image-safety)', () => {
  it('aceita PNG e JPEG reais', () => {
    expect(IMG.validateImageDataUrl(PNG_1x1)).toMatchObject({ ok: true, type: 'png' });
    expect(IMG.validateImageDataUrl(JPEG_HEAD)).toMatchObject({ ok: true, type: 'jpeg' });
    expect(IMG.safeImageSrc(PNG_1x1)).toBe(PNG_1x1);
  });
  it('rejeita SVG, mesmo em base64', () => {
    const svg = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>').toString('base64');
    expect(IMG.validateImageDataUrl(svg).ok).toBe(false);
    expect(IMG.safeImageSrc(svg)).toBe(null);
  });
  it('rejeita HTML disfarçado de PNG', () => {
    const fake = 'data:image/png;base64,' + Buffer.from('<html><body><script>alert(1)</script></body></html>').toString('base64');
    expect(IMG.validateImageDataUrl(fake).ok).toBe(false);
  });
  it('rejeita tipo declarado diferente do conteúdo', () => {
    const lie = PNG_1x1.replace('image/png', 'image/jpeg');
    expect(IMG.validateImageDataUrl(lie)).toMatchObject({ ok: false, reason: 'o conteúdo não corresponde ao tipo declarado' });
  });
  it('rejeita URLs que não são data:, texto, javascript:, vazio e demasiado grande', () => {
    for (const u of ['https://exemplo.pt/a.png', 'javascript:alert(1)', 'data:text/html;base64,PGh0bWw+', '', null, 42,
      'data:image/png;base64,' + 'A'.repeat(IMG.MAX_DATA_URL_CHARS)]) {
      expect(IMG.validateImageDataUrl(u).ok).toBe(false);
    }
  });
  it('sniff reconhece GIF e WebP pelos bytes', () => {
    expect(IMG.sniff(Buffer.from('GIF89a\0\0\0\0\0\0'))).toBe('gif');
    expect(IMG.sniff(Buffer.from('RIFF\0\0\0\0WEBPVP8 '))).toBe('webp');
    expect(IMG.sniff(Buffer.from('<svg></svg>  '))).toBe(null);
  });
});
