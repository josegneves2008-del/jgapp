/**
 * Testes no browser (Chromium real, via Playwright) da sprint 2 da DailyMed.
 * localStorage, Web Locks e BroadcastChannel reais — nada de armazenamento em memória.
 * Dados 100% fictícios.
 *
 * Uso:  node tests/browser/sprint2.e2e.js            (arranca um servidor local próprio)
 *       node tests/browser/sprint2.e2e.js http://127.0.0.1:8765/index.html
 * Requer: npm i -D playwright  (ou o Playwright já instalado) e o Chromium do Playwright.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const SHOTS = process.env.DM_SHOTS || null;
let BASE = process.argv[2] || null;

const results = [];
let current = '';
function chk(name, cond, extra) {
  const ok = !!cond;
  results.push({ group: current, name, ok });
  console.log((ok ? 'OK   ' : 'FAIL ') + '[' + current + '] ' + name + (ok || extra === undefined ? '' : '  → ' + JSON.stringify(extra)));
}

function serve() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const p = decodeURIComponent(req.url.split('?')[0]);
      const file = path.join(ROOT, p === '/' ? 'index.html' : p);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

const PNG_1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const SVG_URI = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="window.__xss=1"></svg>').toString('base64');

function v1Data(extra = {}) {
  return Object.assign({
    dailymed_onboarding_done: 'true',
    dailymed_medications: JSON.stringify([
      { id: 'm1', name: 'Medicamento DEMO A', dosage: '1 un', quantity: 10, isActive: true, category: 'Outros', expiryDate: '2027-01-01', imageUri: PNG_1x1 },
      { id: 'm2', name: 'Medicamento DEMO B', dosage: '5 ml', quantity: 3, isActive: true, category: 'Outros', expiryDate: '2027-01-01', imageUri: SVG_URI },
    ]),
    dailymed_reminders: JSON.stringify([
      { id: 'r1', medicationId: 'm1', times: ['08:00', '14:00', '20:00'], time: '08:00', startDate: '2026-01-01', endDate: null, isActive: true, lastTakenDate: null },
      { id: 'r9', medicationId: 'm_nao_existe', times: ['09:00'], time: '09:00', startDate: '2026-01-01', isActive: true },
    ]),
    dailymed_medication_history: JSON.stringify([
      { medicationName: 'Medicamento DEMO A', dosage: '1 un', dateTime: '04/11/2026, 08:05:12', notes: '' },
      { medicationName: 'Medicamento DEMO A', dosage: '1 un', dateTime: '03/11/2026, 08:01:00', notes: '' },
    ]),
    dailymed_settings: JSON.stringify({ notifications: false, theme: 'light' }),
    dailymed_recycling_deliveries: JSON.stringify([{ id: 'rc1', volume: 'pequeno', date: '2026-10-01' }]),
  }, extra);
}

async function newPage(ctx, errors) {
  const p = await ctx.newPage();
  p.on('pageerror', (e) => { if (!/tailwind/i.test(e.message)) errors.push(e.message); });
  p.on('dialog', (d) => d.accept());
  return p;
}
async function seed(page, data) {
  await page.goto(BASE + '#home');
  await page.evaluate((d) => { localStorage.clear(); for (const k in d) localStorage.setItem(k, d[k]); }, data);
}
async function ready(page) { await page.waitForFunction(() => window.DMStore && document.getElementById('app') && document.getElementById('app').innerHTML.length > 0); await page.waitForTimeout(250); }
async function go(page, hash) { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForTimeout(250); }
async function status(page) { return page.evaluate(() => { const s = DMStore.status(); return { mode: s.mode, writer: s.isWriter, block: s.blockReason, persisted: s.persisted.status, loaded: s.loadedStatus, notices: s.notices }; }); }
async function waitWriter(page, ms = 5000) { await page.waitForFunction(() => DMStore.status().isWriter, null, { timeout: ms }); }
async function snapshot(page) { return page.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; }); }
async function toast(page) { return page.evaluate(() => { const t = document.getElementById('toast-reminder'); return t ? t.textContent : ''; }); }
async function v2(page) { return page.evaluate(() => JSON.parse(localStorage.getItem('dailymed_v2'))); }
async function shot(page, name) { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: true }); }

/** Migra pela interface (Definições → Atualizar). Devolve o texto do resultado. */
async function migrateViaUi(page) {
  await go(page, '#atualizar-dados');
  await page.click('#btn-migrate');
  await page.waitForSelector('#migration-ok, #migration-error', { timeout: 10000 });
  return page.textContent('#migration-ok, #migration-error');
}

async function main() {
  let srv = null;
  if (!BASE) { srv = await serve(); BASE = 'http://127.0.0.1:' + srv.address().port + '/index.html'; }
  const browser = await chromium.launch();
  const errors = [];
  // Todos os contextos correm explicitamente em Europe/Lisbon (a app usa o fuso do dispositivo).
  const fresh = async (opts = {}) => browser.newContext(Object.assign({ viewport: { width: 390, height: 844 }, acceptDownloads: true, timezoneId: 'Europe/Lisbon', locale: 'pt-PT' }, opts));

  // ------------------------------------------------------------------
  current = 'migração';
  {
    const ctx = await fresh(); const p = await newPage(ctx, errors);
    await seed(p, v1Data()); await p.reload(); await ready(p);
    const before = await snapshot(p);
    let s = await status(p);
    chk('arranque não migra sozinho (continua v1)', s.mode === 'v1' && s.persisted === 'v1' && !before.dailymed_v2, s);
    chk('cartão de atualização visível na página inicial', await p.locator('#card-migrate').count() === 1);
    await go(p, '#definicoes');
    chk('Definições: secção de dados com ligação para atualizar', await p.locator('#data-section #link-migrate').count() === 1);
    await go(p, '#atualizar-dados');
    const pre = await p.textContent('#preflight-counts');
    chk('verificação prévia conta 2 medicamentos, 2 lembretes, 2 registos, 1 foto válida', /2 medicamentos · 2 lembretes · 2 registos de histórico · 1 fotografias válidas/.test(pre), pre);
    const warns = await p.textContent('#preflight-warnings');
    chk('aviso: fotografia SVG não será copiada', /Medicamento DEMO B/.test(warns) && /não copiada/.test(warns), warns);
    chk('aviso: lembrete órfão', /r9/.test(warns), warns);
    // cancelar
    await p.click('#btn-migrate-cancel'); await p.waitForTimeout(200);
    chk('cancelar não grava nada', JSON.stringify(await snapshot(p)) === JSON.stringify(before));
    // recusar o diálogo de confirmação
    await go(p, '#atualizar-dados');
    p.removeAllListeners('dialog'); p.once('dialog', (d) => d.dismiss());
    await p.click('#btn-migrate'); await p.waitForTimeout(300);
    p.on('dialog', (d) => d.accept());
    chk('recusar a confirmação não grava nada', JSON.stringify(await snapshot(p)) === JSON.stringify(before));
    // migrar
    const txt = await migrateViaUi(p);
    chk('migração concluída pela interface', /Atualização concluída/.test(txt), txt);
    chk('relatório refere a fotografia inválida', /1 fotografia\(s\) inválida/.test(txt), txt);
    const after = await snapshot(p);
    const v1Same = ['dailymed_medications', 'dailymed_reminders', 'dailymed_medication_history', 'dailymed_settings', 'dailymed_recycling_deliveries'].every((k) => after[k] === before[k]);
    chk('dados antigos preservados (sem alterações)', v1Same);
    const bk = Object.keys(after).filter((k) => k.startsWith('dailymed_backup_v1_'));
    chk('cópia de segurança criada', bk.length === 1);
    const backup = JSON.parse(after[bk[0]]);
    chk('cópia de segurança contém as chaves v1 exatas', backup.keys.dailymed_medications === before.dailymed_medications && backup.keys.dailymed_medication_history === before.dailymed_medication_history);
    const schema = JSON.parse(after.dailymed_schema);
    chk('marcador de versão = v2 com backupKey', schema.status === 'v2' && schema.backupKey === bk[0], schema);
    const st = JSON.parse(after.dailymed_v2);
    chk('v2: 2 medicamentos, 2 lembretes, 2 registos antigos', st.medications.length === 2 && st.reminders.length === 2 && st.doseRecords.length === 2);
    chk('v2: lembrete órfão desativado', st.reminders.find((r) => r.id === 'r9').isActive === false);
    chk('v2: só a fotografia PNG foi copiada', Object.values(JSON.parse(after.dailymed_v2_images)).length === 1 && st.medications.find((m) => m.id === 'm2').imageId === null);
    chk('sem bloco de teste de espaço deixado', !('dailymed_space_probe' in after));
    await p.reload(); await ready(p);
    s = await status(p);
    chk('depois de recarregar: modo v2 e separador de escrita', s.mode === 'v2' && s.writer && s.block === null, s);
    await go(p, '#medicacao-historico');
    chk('histórico: registos antigos marcados como não confirmados', (await p.locator('.history-row[data-status="legacy_unverified"]').count()) === 2 &&
      (await p.textContent('#app')).includes('Registo importado da versão anterior — estado não confirmado'));
    await shot(p, 'historico-importado');
    // segunda migração impossível
    const again = await p.evaluate(() => DMStore.migrate().then(() => 'ok', (e) => e.message));
    chk('não é possível migrar duas vezes', again !== 'ok', again);
    await ctx.close();
  }

  current = 'migração: dados corrompidos';
  {
    const ctx = await fresh(); const p = await newPage(ctx, errors);
    await seed(p, v1Data({ dailymed_medications: '[{"id":"m1","name":"DEMO"' })); await p.reload(); await ready(p);
    await go(p, '#atualizar-dados');
    chk('erro de dados corrompidos mostrado', /corrompidos/.test(await p.textContent('#preflight-errors')));
    chk('botão de atualizar desativado', await p.locator('#btn-migrate').isDisabled());
    const r = await p.evaluate(() => DMStore.migrate().then(() => 'ok', (e) => e.step));
    const snap = await snapshot(p);
    chk('migração recusada na validação, sem alterar nada', r === 'validate' && !snap.dailymed_v2 && !Object.keys(snap).some((k) => k.startsWith('dailymed_backup_v1_')) && !snap.dailymed_schema, { r, keys: Object.keys(snap) });
    // IDs repetidos
    await seed(p, v1Data({ dailymed_medications: JSON.stringify([{ id: 'x', name: 'A' }, { id: 'x', name: 'B' }]) })); await p.reload(); await ready(p);
    await go(p, '#atualizar-dados');
    chk('IDs repetidos bloqueiam', /repetido/.test(await p.textContent('#preflight-errors')) && await p.locator('#btn-migrate').isDisabled());
    await ctx.close();
  }

  current = 'migração: falhas simuladas';
  for (const [point, val, expectStep] of [['probe', 'quota', 'space'], ['backup', 'quota', 'backup'], ['write-v2', 'quota', null], ['schema:v2', true, 'activate'], ['schema:migrating', true, null]]) {
    const ctx = await fresh(); const p = await newPage(ctx, errors);
    await seed(p, v1Data()); await p.reload(); await ready(p); await waitWriter(p);
    const before = await snapshot(p);
    const r = await p.evaluate(([pt, v]) => { window.__DM_TEST_FAIL = { [pt]: v }; return DMStore.migrate().then(() => ({ ok: true }), (e) => ({ ok: false, step: e.step, msg: e.message })); }, [point, val]);
    const after = await snapshot(p);
    const sc = after.dailymed_schema ? JSON.parse(after.dailymed_schema).status : 'v1';
    const v1Same = ['dailymed_medications', 'dailymed_reminders', 'dailymed_medication_history'].every((k) => after[k] === before[k]);
    chk('falha em ' + point + ': recusada' + (expectStep ? ' no passo ' + expectStep : ''), !r.ok && (!expectStep || r.step === expectStep), r);
    chk('falha em ' + point + ': estado volta a v1, sem dados v2 nem fotos', sc === 'v1' && !after.dailymed_v2 && !after.dailymed_v2_images, { sc, keys: Object.keys(after) });
    chk('falha em ' + point + ': dados antigos intactos', v1Same);
    const s = await status(p);
    chk('falha em ' + point + ': separador continua a poder gravar em v1', s.mode === 'v1' && s.block === null, s);
    if (point === 'schema:v2') {
      await go(p, '#atualizar-dados');
      chk('falha em ' + point + ': interface mostra erro e tentar de novo funciona', true);
      await p.evaluate(() => { window.__DM_TEST_FAIL = null; });
      const txt = await migrateViaUi(p);
      chk('nova tentativa depois da falha conclui', /Atualização concluída/.test(txt), txt);
    }
    await ctx.close();
  }

  current = 'migração: marcador não reposto + recuperação';
  {
    const ctx = await fresh(); const p = await newPage(ctx, errors);
    await seed(p, v1Data()); await p.reload(); await ready(p); await waitWriter(p);
    const r = await p.evaluate(() => { window.__DM_TEST_FAIL = { 'schema:v2': true, 'schema:v1': true }; return DMStore.migrate().then(() => 'ok', (e) => e.info); });
    let sc = JSON.parse(await p.evaluate(() => localStorage.getItem('dailymed_schema')));
    chk('se nem o regresso a v1 grava, fica "migrating" (nunca v2)', sc.status === 'migrating' && r.schemaRestoreFailed === true, { sc, r });
    const s = await status(p);
    chk('"migrating" não é tratado como concluído: modo v1, sem escrita', s.mode === 'v1' && s.block !== null, s);
    await p.evaluate(() => { window.__DM_TEST_FAIL = null; });
    await p.reload(); await ready(p); await waitWriter(p); await p.waitForTimeout(400);
    sc = JSON.parse(await p.evaluate(() => localStorage.getItem('dailymed_schema')));
    const snap = await snapshot(p);
    chk('recuperação no arranque: volta a v1 e remove dados derivados', sc.status === 'v1' && !snap.dailymed_v2 && !snap.dailymed_v2_images, { sc, keys: Object.keys(snap) });
    chk('recuperação mantém a cópia de segurança', Object.keys(snap).some((k) => k.startsWith('dailymed_backup_v1_')));
    chk('aviso de atualização interrompida', (await p.textContent('#dm-banners')).includes('interrompida'));
    await ctx.close();
  }

  current = 'migração: separador fechado a meio';
  {
    const ctx = await fresh(); const a = await newPage(ctx, errors);
    await seed(a, v1Data()); await a.reload(); await ready(a); await waitWriter(a);
    const b = await newPage(ctx, errors); await b.goto(BASE + '#home'); await ready(b);
    await a.evaluate(() => { window.__DM_TEST_PAUSE = true; DMStore.migrate(); });
    await a.waitForFunction(() => JSON.parse(localStorage.getItem('dailymed_schema') || '{}').status === 'migrating');
    await b.waitForTimeout(300);
    let sb = await status(b);
    chk('outro separador vê "a atualizar": só leitura', sb.block !== null && sb.mode === 'v1', sb);
    chk('outro separador mostra aviso', (await b.locator('#dm-banners .dm-banner').count()) >= 1);
    const wrote = await b.evaluate(() => setSettings({ theme: 'dark' }));
    chk('outro separador não consegue gravar definições durante a atualização', wrote === false);
    await a.close(); // fecha a meio
    await waitWriter(b); await b.waitForTimeout(500);
    const sc = JSON.parse(await b.evaluate(() => localStorage.getItem('dailymed_schema')));
    const snap = await snapshot(b);
    chk('o separador que fica recupera: v1, sem dados v2', sc.status === 'v1' && !snap.dailymed_v2, sc);
    chk('dados antigos intactos depois da interrupção', snap.dailymed_medications === v1Data().dailymed_medications);
    await ctx.close();
  }

  current = 'migração: alterações v1 durante a migração';
  {
    const ctx = await fresh(); const p = await newPage(ctx, errors);
    await seed(p, v1Data()); await p.reload(); await ready(p); await waitWriter(p);
    const r = await p.evaluate(() => {
      // Simula um separador antigo (sem a proteção nova) a gravar a meio da migração.
      const orig = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) { orig.call(this, k, v); if (k === 'dailymed_v2') { Storage.prototype.setItem = orig; orig.call(localStorage, 'dailymed_medication_history', '[{"medicationName":"Outro separador","dateTime":"05/11/2026, 09:00:00"}]'); } };
      return DMStore.migrate().then(() => 'ok', (e) => e.step);
    });
    const snap = await snapshot(p);
    chk('alteração v1 durante a migração é detetada e a migração recusada', r === 'recheck', r);
    chk('estado continua v1 e sem dados v2', JSON.parse(snap.dailymed_schema).status === 'v1' && !snap.dailymed_v2);
    await ctx.close();
  }

  // ------------------------------------------------------------------
  current = 'interface + stock';
  let ctxMain, pm;
  {
    ctxMain = await fresh(); pm = await newPage(ctxMain, errors);
    await seed(pm, { dailymed_onboarding_done: 'true' }); await pm.reload(); await ready(pm);
    const t = await migrateViaUi(pm);
    chk('migração com dados vazios', /Atualização concluída: 0 medicamentos/.test(t), t);
    await pm.reload(); await ready(pm);
    // 1. adicionar medicamento com stock
    await go(pm, '#medicacao-adicionar');
    await pm.fill('#form-add-med input[name="name"]', 'Medicamento DEMO Teste');
    await pm.fill('#form-add-med input[name="dosage"]', '10 mg');
    await pm.fill('#form-add-med input[name="expiryDate"]', '2027-06-30');
    await pm.selectOption('#form-add-med select[name="category"]', { index: 1 });
    await pm.selectOption('#form-add-med select[name="stockUnit"]', 'comprimido');
    await pm.fill('#form-add-med input[name="amountPerDose"]', '1');
    await pm.fill('#form-add-med input[name="quantity"]', '7');
    await pm.click('#form-add-med button[type="submit"]'); await pm.waitForTimeout(400);
    let st = await v2(pm);
    const med = st.medications[0];
    chk('medicamento criado em dailymed_v2', st.medications.length === 1 && med.name === 'Medicamento DEMO Teste');
    chk('stock configurado: 7 comprimidos', st.stockMovements.length === 1 && st.stockMovements[0].type === 'initial' && st.stockMovements[0].countedQuantity === 7);
    chk('chave v1 de medicamentos não foi escrita', await pm.evaluate(() => localStorage.getItem('dailymed_medications')) === null);
    // 2. lembrete com 2 horários
    await go(pm, '#lembretes-novo');
    await pm.click('#rem-medication-list .med-option');
    const times = await pm.$$eval('#rem-time-grid [data-time]', (els) => els.map((e) => e.dataset.time));
    await pm.click('#rem-time-grid [data-time="' + times[0] + '"]');
    await pm.click('#rem-time-grid [data-time="' + times[1] + '"]');
    await pm.click('#form-new-reminder button[type="submit"]'); await pm.waitForTimeout(400);
    st = await v2(pm);
    chk('lembrete criado com 2 horários', st.reminders.length === 1 && st.reminders[0].times.length === 2, st.reminders);
    // 3. registar toma
    await go(pm, '#home');
    chk('página inicial: 0 de 2 tomas', (await pm.textContent('#progress-today')).trim() === '0 de 2 tomas registadas');
    await shot(pm, 'home-v2');
    await pm.click('#slots-today .slot-row:nth-child(1) [data-action="dose-taken"]'); await pm.waitForTimeout(300);
    chk('toast de toma registada', /Toma registada/.test(await toast(pm)));
    chk('página inicial: 1 de 2 tomas', (await pm.textContent('#progress-today')).trim() === '1 de 2 tomas registadas');
    chk('o outro horário continua por registar', (await pm.locator('#slots-today .slot-row:nth-child(2) [data-action="dose-taken"]').count()) === 1);
    // 4. stock desce
    await go(pm, '#medicacao-stock?id=' + med.id);
    chk('stock desceu para 6', (await pm.textContent('#stock-balance')).trim() === '6');
    chk('movimento de toma no histórico de movimentos', (await pm.locator('#movements .mov-row[data-type="consumption"]').count()) === 1);
    // 5. histórico
    await go(pm, '#medicacao-historico');
    chk('histórico mostra a toma como Tomada', (await pm.locator('.history-row[data-status="taken"]').count()) === 1);
    // 6. corrigir para não tomada → reversão
    await go(pm, '#home');
    await pm.click('#slots-today [data-action="dose-change"][data-to="not_taken"]'); await pm.waitForTimeout(300);
    chk('toast de correção', /corrigido/.test(await toast(pm)));
    await go(pm, '#medicacao-stock?id=' + med.id);
    chk('stock volta a 7 depois da correção', (await pm.textContent('#stock-balance')).trim() === '7');
    chk('há um movimento de reversão', (await pm.locator('#movements .mov-row[data-type="reversal"]').count()) === 1);
    await shot(pm, 'stock-reversao');
    // 7. corrigir de novo para tomada: desconta uma vez
    await go(pm, '#home');
    await pm.click('#slots-today [data-action="dose-change"][data-to="taken"]'); await pm.waitForTimeout(300);
    st = await v2(pm);
    const open = st.stockMovements.filter((m) => m.type === 'consumption' && !st.stockMovements.some((r) => r.reversesMovementId === m.id));
    chk('voltar a tomada: um único consumo aberto, saldo 6', open.length === 1 && (await pm.evaluate((id) => DailyMedV2.stockBalance(DMStore.getV2(), id), med.id)) === 6);
    // duplo clique / botão antigo: o botão do estado anterior já não existe; repetir a operação pelo mesmo id
    const dup = await pm.evaluate(() => { const s = DMStore.getV2(); const op = s.operations[s.operations.length - 1]; return DMStore.applyV2({ operationId: op.operationId, type: 'change_status', doseRecordId: op.doseRecordId, to: 'taken' }).status; });
    chk('repetir a mesma operação é ignorado (idempotente)', dup === 'duplicate_ignored');
    // revisão antiga (ecrã desatualizado)
    const stale = await pm.evaluate(() => { const s = DMStore.getV2(); const r = s.doseRecords[0]; return DMStore.applyV2({ operationId: DMStore.newOperationId(), type: 'change_status', doseRecordId: r.id, to: 'not_taken', expectedRevision: 1 }).reason; });
    chk('correção feita sobre um ecrã desatualizado é recusada', stale === 'stale_record');
    // 8. entrada, saída, ajuste, contagem, confirmação, reverter
    await go(pm, '#medicacao-stock?id=' + med.id);
    async function stockForm(kind, field, value) {
      await pm.click('form.stock-form[data-kind="' + kind + '"] >> xpath=..//summary');
      await pm.fill('form.stock-form[data-kind="' + kind + '"] input[name="' + field + '"]', String(value));
      if (kind === 'count') await pm.check('form.stock-form[data-kind="count"] input[name="confirmed"]');
      await pm.click('form.stock-form[data-kind="' + kind + '"] button[type="submit"]'); await pm.waitForTimeout(300);
      return (await pm.textContent('#stock-balance')).trim();
    }
    chk('entrada de 20 → 26', await stockForm('entry', 'quantity', 20) === '26');
    chk('saída de 4 → 22', await stockForm('exit', 'quantity', 4) === '22');
    const before = await v2(pm);
    const bal = await stockForm('exit', 'quantity', 100);
    const tx = await toast(pm); chk('saída maior que o stock é recusada (fica 22)', bal === '22' && /negativo/.test(tx), { bal, tx });
    chk('saída recusada não cria movimento', (await v2(pm)).stockMovements.length === before.stockMovements.length);
    chk('ajuste para 18', await stockForm('adjustment', 'newQuantity', 18) === '18');
    chk('contagem física 17', await stockForm('count', 'countedQuantity', 17) === '17');
    await pm.click('[data-action="stock-confirm"]'); await pm.waitForTimeout(300);
    chk('confirmação do saldo registada', (await pm.locator('#movements .mov-row[data-type="confirmation"]').count()) === 1);
    // reverter uma entrada depois de uma contagem: sem efeito no saldo
    await pm.click('#movements .mov-row[data-type="entry"] [data-action="stock-revert"]'); await pm.waitForTimeout(300);
    chk('reverter entrada depois de contagem: saldo mantém-se 17', (await pm.textContent('#stock-balance')).trim() === '17');
    chk('entrada fica marcada como revertida (sem botão)', (await pm.locator('#movements .mov-row[data-type="entry"] [data-action="stock-revert"]').count()) === 0);
    // nova entrada e reverter: volta ao valor
    await stockForm('entry', 'quantity', 3);
    await pm.click('#movements .mov-row[data-type="entry"] [data-action="stock-revert"]'); await pm.waitForTimeout(300);
    chk('reverter entrada recente: 20 → 17', (await pm.textContent('#stock-balance')).trim() === '17');
    // stock baixo
    await stockForm('adjustment', 'newQuantity', 4);
    await go(pm, '#home');
    chk('alerta de stock baixo na página inicial', (await pm.textContent('#low-stock-count')).trim() === '1');
    // stock insuficiente: ajusta para 0 e regista a outra toma
    await go(pm, '#medicacao-stock?id=' + med.id);
    await stockForm('adjustment', 'newQuantity', 0);
    await go(pm, '#home');
    await pm.click('#slots-today [data-action="dose-taken"]'); await pm.waitForTimeout(300);
    st = await v2(pm);
    chk('toma com stock insuficiente: registada, nada descontado, saldo 0', st.doseRecords.filter((r) => !r.voidedAt).length === 2 && (await pm.evaluate((id) => DailyMedV2.stockBalance(DMStore.getV2(), id), med.id)) === 0);
    chk('aviso de stock insuficiente', /nada foi descontado/.test(await toast(pm)) || (await pm.textContent('#slots-today')).includes('Stock insuficiente'));
    await go(pm, '#medicacao-stock?id=' + med.id);
    chk('stock por confirmar mostrado', await pm.locator('#stock-review').count() === 1);
    // anular registo
    await go(pm, '#home');
    await pm.click('#slots-today .slot-row:nth-child(1) [data-action="dose-void"]'); await pm.waitForTimeout(300);
    chk('anular registo: horário volta a ter "Tomei"', (await pm.locator('#slots-today .slot-row:nth-child(1) [data-action="dose-taken"]').count()) === 1);
    // não tomada com motivo
    await pm.selectOption('#slots-today .slot-row:nth-child(1) .slot-reason', 'esqueci');
    await pm.click('#slots-today .slot-row:nth-child(1) [data-action="dose-not-taken"]'); await pm.waitForTimeout(300);
    st = await v2(pm);
    chk('não tomada com motivo gravado', st.doseRecords.some((r) => !r.voidedAt && r.status === 'not_taken' && r.notTakenReason === 'esqueci'));
    // invariantes e persistência
    chk('estado final passa todas as verificações', (await pm.evaluate(() => DailyMedV2.validateState(DMStore.getV2()))).length === 0);
    const stBefore = await pm.evaluate(() => localStorage.getItem('dailymed_v2'));
    await pm.reload(); await ready(pm);
    chk('persistência depois de recarregar', await pm.evaluate(() => localStorage.getItem('dailymed_v2')) === stBefore);
    await go(pm, '#medicacao-stock?id=' + med.id);
    chk('saldo mantém-se depois de recarregar', (await pm.textContent('#stock-balance')).trim() === '0');
    // editar medicamento
    await go(pm, '#medicacao-editar?id=' + med.id);
    if (await pm.locator('#form-edit-med').count()) {
      await pm.fill('#form-edit-med input[name="dosage"]', '20 mg');
      await pm.click('#form-edit-med button[type="submit"]'); await pm.waitForTimeout(300);
      st = await v2(pm);
      chk('editar medicamento grava em v2 sem mexer no stock', st.medications[0].dosage === '20 mg' && (await pm.evaluate((id) => DailyMedV2.stockBalance(DMStore.getV2(), id), med.id)) === 0);
    } else chk('formulário de edição existe', false);
    // remover medicamento (soft) mantém histórico
    const removed = await pm.evaluate((id) => deleteMedication(id).status, med.id);
    st = await v2(pm);
    chk('remover medicamento: marcado como removido, histórico mantido', removed === 'applied' && st.medications[0].removedAt && st.doseRecords.length >= 2);
    await go(pm, '#home');
    chk('removido: sem tomas previstas', (await pm.locator('#slots-today').count()) === 0);
  }

  current = 'fotografias';
  {
    const p = pm;
    // ficheiro SVG pelo formulário
    await go(p, '#medicacao-adicionar');
    await p.fill('#form-add-med input[name="name"]', 'DEMO Foto SVG');
    await p.fill('#form-add-med input[name="dosage"]', '1');
    await p.fill('#form-add-med input[name="expiryDate"]', '2027-06-30');
    await p.selectOption('#form-add-med select[name="category"]', { index: 1 });
    await p.setInputFiles('#form-add-med input[name="image"]', { name: 'foto.png', mimeType: 'image/png', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="window.__xss=1"/>') });
    await p.click('#form-add-med button[type="submit"]'); await p.waitForTimeout(500);
    chk('SVG disfarçado de PNG é recusado', /Formato não permitido/.test(await toast(p)));
    chk('medicamento com foto inválida não foi gravado', !(await v2(p)).medications.some((m) => m.name === 'DEMO Foto SVG'));
    // PNG real
    const png = Buffer.from(PNG_1x1.split(',')[1], 'base64');
    await p.setInputFiles('#form-add-med input[name="image"]', { name: 'foto.png', mimeType: 'image/png', buffer: png });
    await p.click('#form-add-med button[type="submit"]'); await p.waitForTimeout(800);
    const st = await v2(p);
    const m = st.medications.find((x) => x.name === 'DEMO Foto SVG');
    const imgs = await p.evaluate(() => JSON.parse(localStorage.getItem('dailymed_v2_images') || '{}'));
    chk('PNG real aceite e reconvertido para JPEG', m && m.imageId && /^data:image\/jpeg;base64,/.test(imgs[m.imageId]));
    await go(p, '#medicacao-detalhes?id=' + m.id);
    chk('detalhes mostram a fotografia', await p.locator('img[src^="data:image/jpeg"]').count() >= 1);
    // fotografia adulterada no armazenamento → placeholder ao apresentar
    await p.evaluate((id) => { const map = JSON.parse(localStorage.getItem('dailymed_v2_images')); map[id] = 'data:image/jpeg;base64,' + btoa('<html><script>window.__xss=2</script></html>'); localStorage.setItem('dailymed_v2_images', JSON.stringify(map)); }, m.imageId);
    await go(p, '#medicacao'); await go(p, '#medicacao-detalhes?id=' + m.id);
    chk('fotografia adulterada: placeholder em vez da imagem', await p.locator('[data-image-placeholder="invalid"]').count() === 1 && await p.locator('img[src^="data:image/jpeg"]').count() === 0);
    chk('nenhum código injetado foi executado', await p.evaluate(() => window.__xss === undefined));
  }

  // ------------------------------------------------------------------
  current = 'separadores';
  {
    const a = pm; // separador de escrita
    await go(a, '#home');
    const b = await newPage(ctxMain, errors); await b.goto(BASE + '#home'); await ready(b);
    let sa = await status(a), sb = await status(b);
    chk('só um separador de escrita', sa.writer && !sb.writer && sb.block === 'other_tab', { sa, sb });
    chk('separador só de leitura mostra aviso', (await b.textContent('#dm-banners')).includes('só de leitura'));
    // preparar um lembrete ativo para tomas
    await a.evaluate(() => {
      DMStore.applyV2({ operationId: DMStore.newOperationId(), type: 'medication_upsert', medication: { id: 'mc', name: 'DEMO Concorrência', dosage: '1' } });
      DMStore.applyV2({ operationId: DMStore.newOperationId(), type: 'reminder_upsert', reminder: { id: 'rc', medicationId: 'mc', times: ['07:00'], isActive: true } });
      DMStore.applyV2({ operationId: DMStore.newOperationId(), type: 'stock_config', medicationId: 'mc', unit: 'comprimido', amountPerDose: 1, initialQuantity: 10 });
    });
    await b.waitForTimeout(400);
    chk('o outro separador atualiza sozinho', (await b.locator('[data-slot-row^="rc|"]').count()) === 1);
    const before = await a.evaluate(() => localStorage.getItem('dailymed_v2'));
    await b.click('[data-slot-row^="rc|"] [data-action="dose-taken"]'); await b.waitForTimeout(300);
    chk('clicar "Tomei" no separador de leitura não grava', await a.evaluate(() => localStorage.getItem('dailymed_v2')) === before && /só de leitura/.test(await toast(b)));
    chk('definições também bloqueadas no separador de leitura', await b.evaluate(() => setSettings({ theme: 'dark' })) === false);
    // operações simultâneas
    const today = await a.evaluate(() => DailyMedV2.localDateStr(new Date()));
    const op = (id) => ({ operationId: id, type: 'record_dose', reminderId: 'rc', date: today, time: '07:00', status: 'taken' });
    const [ra, rb] = await Promise.all([a.evaluate((o) => DMStore.applyV2(o), op('op_sim_a')), b.evaluate((o) => DMStore.applyV2(o), op('op_sim_b'))]);
    chk('operações simultâneas: só o separador de escrita grava', ra.status === 'applied' && rb.status === 'read_only_tab', { ra, rb });
    // passagem de escrita
    await b.click('#dm-banners [data-action="handover"]');
    await waitWriter(b); await a.waitForTimeout(300);
    sa = await status(a); sb = await status(b);
    chk('"Usar este separador" passa a escrita', sb.writer && sb.block === null && !sa.writer && sa.block === 'other_tab', { sa, sb });
    // mesma toma a partir do outro separador
    const rb2 = await b.evaluate((o) => DMStore.applyV2(o), op('op_sim_b2'));
    chk('mesma toma noutro separador: recusada como já registada', rb2.status === 'rejected' && rb2.reason === 'already_recorded', rb2);
    chk('stock descontado uma única vez (9)', await b.evaluate(() => DailyMedV2.stockBalance(DMStore.getV2(), 'mc')) === 9);
    // recarregar o separador de escrita com outro aberto
    await b.reload(); await ready(b); await a.waitForTimeout(500);
    sa = await status(a); sb = await status(b);
    chk('recarregar o separador de escrita: a escrita passa para o outro', sa.writer && !sb.writer, { sa, sb });
    // fechar: o que fica passa a escrever
    await a.close(); await waitWriter(b);
    chk('fechar o separador de escrita: o outro passa a gravar', (await status(b)).block === null);
    pm = b;
  }

  current = 'separador antigo (v1) depois da atualização';
  {
    const ctx = await fresh(); const a = await newPage(ctx, errors);
    await seed(a, v1Data()); await a.reload(); await ready(a); await waitWriter(a);
    const old = await newPage(ctx, errors); await old.goto(BASE + '#home'); await ready(old);
    chk('separador v1 carregado antes da atualização', (await status(old)).mode === 'v1');
    const t = await migrateViaUi(a);
    chk('atualização feita no separador de escrita', /concluída/.test(t));
    await old.waitForTimeout(400);
    const so = await status(old);
    chk('separador antigo é marcado como desatualizado', so.block === 'outdated' && so.notices.outdated === true, so);
    chk('separador antigo mostra "Recarregar"', (await old.locator('#dm-banners [data-action="reload"]').count()) === 1);
    const snap = await snapshot(old);
    const tries = await old.evaluate(() => [
      setSettings({ theme: 'dark' }),
      setMedications([]),
      addRecyclingDelivery({ id: 'x' }),
      setTravelChecklistItem('a', true),
      addMedicationHistory({ medicationName: 'x' }),
      saveReminder({ id: 'r1', medicationId: 'm1', times: ['10:00'], isActive: true }),
      DMStore.writeRaw('dailymed_onboarding_done', 'false'),
    ]);
    chk('separador antigo: nenhuma gravação é aceite', tries.every((x) => x === false), tries);
    chk('separador antigo: localStorage inalterado', JSON.stringify(await snapshot(old)) === JSON.stringify(snap));
    // o separador antigo fica sozinho: mesmo com a escrita, continua desatualizado
    await a.close(); await waitWriter(old);
    chk('mesmo como único separador, continua sem gravar até recarregar', (await status(old)).block === 'outdated');
    await old.reload(); await ready(old);
    chk('depois de recarregar abre em v2 e grava', (await status(old)).mode === 'v2' && (await status(old)).block === null);
    // alteração por uma versão antiga da app (código antigo em cache, sem proteção)
    const v2Before = await old.evaluate(() => localStorage.getItem('dailymed_v2'));
    const other = await newPage(ctx, errors); await other.goto(BASE + '#home'); await ready(other);
    await other.evaluate(() => localStorage.setItem('dailymed_medications', '[{"id":"m1","name":"Alterado por versão antiga"}]'));
    await old.waitForTimeout(600);
    chk('alteração de uma versão antiga é detetada e avisada', (await old.textContent('#dm-banners')).includes('versão antiga'));
    const v2After = JSON.parse(await old.evaluate(() => localStorage.getItem('dailymed_v2')));
    chk('alteração antiga não é aplicada aos medicamentos v2', v2After.medications.find((m) => m.id === 'm1').name === 'Medicamento DEMO A' && JSON.parse(v2Before).medications.length === v2After.medications.length);
    chk('fica registada para diagnóstico', (v2After.v1Sync.externalChanges || []).length === 1);
    await ctx.close();
  }

  current = 'proteção dos dados v2';
  {
    // Prepara uma instalação v2 real com dados (migração + uma toma + stock), e guarda o estado.
    const ctx0 = await fresh(); const q = await newPage(ctx0, errors);
    await seed(q, v1Data()); await q.reload(); await ready(q); await migrateViaUi(q); await q.reload(); await ready(q); await waitWriter(q);
    await q.evaluate(() => {
      DMStore.applyV2({ operationId: 'prep1', type: 'stock_config', medicationId: 'm1', unit: 'comprimido', amountPerDose: 1, initialQuantity: 10 });
      DMStore.applyV2({ operationId: 'prep2', type: 'record_dose', reminderId: 'r1', date: DailyMedV2.localDateStr(new Date()), time: '08:00', status: 'taken' });
    });
    const V2DATA = await snapshot(q); await ctx0.close();
    const v2raw = V2DATA.dailymed_v2;

    async function scenario(name, mutate, expectReason, opts = {}) {
      const ctx = await fresh(); const p = await newPage(ctx, errors);
      const data = Object.assign({}, V2DATA); mutate(data);
      await seed(p, data); await p.reload(); await ready(p); await waitWriter(p).catch(() => {}); await p.waitForTimeout(300);
      const s = await status(p);
      chk(name + ': fica em recuperação (' + expectReason + ')', s.loaded === 'damaged' && s.notices.damaged === expectReason && s.block === 'damaged', s);
      chk(name + ': aviso claro no topo', (await p.textContent('#dm-banners')).includes('só de leitura') && await p.locator('#link-recovery').count() === 1);
      const tries = await p.evaluate(() => [
        DMStore.applyV2({ operationId: 'x_' + Math.random(), type: 'stock_confirm', medicationId: 'm1' }).status,
        setSettings({ theme: 'dark' }),
        DMStore.writeRaw('dailymed_recycling_deliveries', '[]'),
      ]);
      chk(name + ': nenhuma gravação aceite', tries[0] === 'read_only_tab' && tries[1] === false && tries[2] === false, tries);
      const mig = await p.evaluate(() => DMStore.migrate().then(() => 'ok', (e) => e.step));
      chk(name + ': migração recusada', mig !== 'ok', mig);
      await go(p, '#home');
      chk(name + ': sem cartão "Nova versão dos dados"', await p.locator('#card-migrate').count() === 0);
      await go(p, '#definicoes');
      chk(name + ': sem ligação "Atualizar"', await p.locator('#link-migrate').count() === 0 && await p.locator('#link-recovery-settings').count() === 1);
      await go(p, '#atualizar-dados');
      chk(name + ': ecrã de recuperação (sem botão de migrar)', await p.locator('#recovery').count() === 1 && await p.locator('#btn-migrate').count() === 0);
      const after = await snapshot(p);
      chk(name + ': dailymed_v2 intacto (byte a byte)', after.dailymed_v2 === data.dailymed_v2);
      const allSame = Object.keys(data).every((k) => after[k] === data[k]);
      chk(name + ': nenhuma chave alterada ou apagada', allSame && Object.keys(after).filter((k) => !(k in data)).every((k) => k === 'dailymed_v2_diagnostics'), Object.keys(after).filter((k) => after[k] !== data[k]));
      if (opts.after) await opts.after(p, ctx, data);
      await ctx.close();
    }

    await scenario('v2 sem marcador', (d) => { delete d.dailymed_schema; }, 'schema_missing_with_v2', {
      after: async (p) => {
        chk('v2 sem marcador: dados v2 mostrados (só leitura)', (await status(p)).mode === 'v2' && (await p.textContent('#recovery-v2')).includes('2 medicamentos'));
        await Promise.all([p.waitForEvent('load'), p.click('#btn-repair-v2')]); await ready(p); await waitWriter(p);
        const s = await status(p);
        const sc = JSON.parse(await p.evaluate(() => localStorage.getItem('dailymed_schema')));
        chk('reparar (pedido pelo utente): volta a v2 com os mesmos dados', s.mode === 'v2' && s.loaded === 'v2' && s.block === null && (await p.evaluate(() => localStorage.getItem('dailymed_v2'))) === v2raw, s);
        chk('reparação regista o marcador anterior', sc.status === 'v2' && sc.repairedFrom === 'schema_missing_with_v2' && sc.previousMarker === null);
        chk('depois da reparação o stock e as tomas continuam', (await p.evaluate(() => DailyMedV2.stockBalance(DMStore.getV2(), 'm1'))) === 9);
      },
    });
    await scenario('marcador corrompido (JSON inválido)', (d) => { d.dailymed_schema = '{"status":"v2",'; }, 'schema_corrupt_with_v2', {
      after: async (p) => {
        await Promise.all([p.waitForEvent('load'), p.click('#btn-repair-v2')]); await ready(p);
        const sc = JSON.parse(await p.evaluate(() => localStorage.getItem('dailymed_schema')));
        chk('marcador corrompido: reparação guarda o texto antigo', sc.previousMarker === '{"status":"v2",' && sc.status === 'v2');
      },
    });
    await scenario('marcador com estado desconhecido', (d) => { d.dailymed_schema = JSON.stringify({ status: 'v9' }); }, 'schema_corrupt_with_v2');
    await scenario('marcador "v1" com dados v2', (d) => { d.dailymed_schema = JSON.stringify({ status: 'v1' }); }, 'v1_with_v2_data');
    await scenario('marcador v2 com dados v2 corrompidos', (d) => { d.dailymed_v2 = d.dailymed_v2.slice(0, 200); }, 'v2_corrupt', {
      after: async (p) => {
        chk('dados v2 corrompidos: não se mostram nem se reativam', (await status(p)).mode === 'v1' && await p.locator('#btn-repair-v2').count() === 0 && await p.locator('#btn-repair-v1').count() === 0);
        const r = await p.evaluate(() => DMStore.repairMarker('reactivate_v2').then(() => 'ok', (e) => e.step));
        const r2 = await p.evaluate(() => DMStore.repairMarker('mark_v1').then(() => 'ok', (e) => e.step));
        chk('dados v2 corrompidos: reparação recusada (nas duas opções)', r === 'v2_invalid' && r2 === 'v2_exists', { r, r2 });
      },
    });
    await scenario('migração interrompida com dados v2 que não são dela', (d) => { d.dailymed_schema = JSON.stringify({ status: 'migrating', migrationId: 'mig_outra' }); }, 'migrating_with_foreign_v2');

    // marcador v2 sem dados v2 (nada a proteger): recuperação permite voltar a v1
    {
      const ctx = await fresh(); const p = await newPage(ctx, errors);
      await seed(p, v1Data({ dailymed_schema: JSON.stringify({ status: 'v2' }) })); await p.reload(); await ready(p); await waitWriter(p);
      const s = await status(p);
      chk('marcador v2 sem dados: recuperação, não v2', s.mode === 'v1' && s.loaded === 'damaged' && s.notices.damaged === 'v2_without_data', s);
      await go(p, '#atualizar-dados');
      chk('marcador v2 sem dados: só oferece "continuar com a versão 1"', await p.locator('#btn-repair-v1').count() === 1 && await p.locator('#btn-repair-v2').count() === 0);
      const before = await snapshot(p);
      await Promise.all([p.waitForEvent('load'), p.click('#btn-repair-v1')]); await ready(p); await waitWriter(p);
      const after = await snapshot(p);
      chk('voltar a v1: grava só o marcador', (await status(p)).loaded === 'v1' && Object.keys(before).every((k) => k === 'dailymed_schema' || k === 'dailymed_v2_diagnostics' || after[k] === before[k]));
      const t = await migrateViaUi(p);
      chk('depois disso a migração normal funciona', /Atualização concluída/.test(t), t);
      await ctx.close();
    }

    // dados v2 aparecem a meio de uma migração (outro separador antigo / restauro): nada é substituído
    {
      const ctx = await fresh(); const p = await newPage(ctx, errors);
      await seed(p, v1Data()); await p.reload(); await ready(p); await waitWriter(p);
      const r = await p.evaluate((raw) => {
        const orig = Storage.prototype.setItem;
        Storage.prototype.setItem = function (k, v) { if (k === 'dailymed_v2_images') { Storage.prototype.setItem = orig; orig.call(localStorage, 'dailymed_v2', raw); } orig.call(this, k, v); };
        return DMStore.migrate().then(() => 'ok', (e) => e.step);
      }, v2raw);
      const after = await snapshot(p);
      chk('dados v2 que aparecem durante a migração não são substituídos', r === 'v2_exists' && after.dailymed_v2 === v2raw, r);
      await ctx.close();
    }
  }

  current = 'stock: unidade e quantidade por toma (interface)';
  {
    const ctx = await fresh(); const p = await newPage(ctx, errors);
    await seed(p, { dailymed_onboarding_done: 'true' }); await p.reload(); await ready(p); await migrateViaUi(p); await p.reload(); await ready(p); await waitWriter(p);
    await p.evaluate(() => {
      DMStore.applyV2({ operationId: 'u1', type: 'medication_upsert', medication: { id: 'mu', name: 'DEMO Unidade', dosage: '1' } });
      DMStore.applyV2({ operationId: 'u2', type: 'stock_config', medicationId: 'mu', unit: 'comprimido', amountPerDose: 1, initialQuantity: 10 });
      DMStore.applyV2({ operationId: 'u3', type: 'stock_exit', medicationId: 'mu', quantity: 1 });
      DMStore.applyV2({ operationId: 'u4', type: 'stock_exit', medicationId: 'mu', quantity: 1 });
    });
    await go(p, '#medicacao-stock?id=mu');
    chk('saldo 8 comprimidos', (await p.textContent('#stock-balance')).trim() === '8');
    chk('unidade não editável, com explicação', await p.locator('form[data-kind="settings"] select[name="unit"]').count() === 0 && /não pode ser alterada/.test(await p.textContent('#stock-unit-locked')));
    const forced = await p.evaluate(() => DMStore.applyV2({ operationId: 'u5', type: 'stock_config', medicationId: 'mu', unit: 'unidade', amountPerDose: 1, confirmAmountChange: true }).reason);
    chk('mudar a unidade por código também é recusado', forced === 'unit_locked');
    await p.click('form.stock-form[data-kind="settings"] >> xpath=..//summary');
    await p.fill('form.stock-form[data-kind="settings"] input[name="amountPerDose"]', '2');
    await p.click('form.stock-form[data-kind="settings"] button[type="submit"]'); await p.waitForTimeout(300);
    chk('quantidade por toma sem confirmação: recusada com explicação', /Confirma a nova quantidade/.test(await toast(p)) && (await v2(p)).stockConfig.mu.amountPerDose === 1);
    await p.click('form.stock-form[data-kind="settings"] >> xpath=..//summary');
    await p.fill('form.stock-form[data-kind="settings"] input[name="amountPerDose"]', '2');
    await p.check('form.stock-form[data-kind="settings"] input[name="confirmAmountChange"]');
    await p.click('form.stock-form[data-kind="settings"] button[type="submit"]'); await p.waitForTimeout(300);
    const st = await v2(p);
    chk('quantidade por toma confirmada: muda e fica registada; saldo e movimentos intactos',
      st.stockConfig.mu.amountPerDose === 2 && st.stockConfig.mu.changes.length === 1 && st.stockConfig.mu.unit === 'comprimido' &&
      (await p.textContent('#stock-balance')).trim() === '8' && st.stockMovements.filter((m) => m.medicationId === 'mu').length === 3);
    chk('tomas restantes recalculadas (8 / 2 = 4)', (await p.textContent('#stock-doses')).trim() === '4');
    chk('alteração visível no ecrã', (await p.locator('#stock-config-changes li').count()) === 1);
    await ctx.close();
  }

  current = 'datas e mudança de hora (browser)';
  {
    const ctx = await fresh(); const p = await newPage(ctx, errors);
    await seed(p, { dailymed_onboarding_done: 'true' }); await p.reload(); await ready(p); await migrateViaUi(p); await p.reload(); await ready(p); await waitWriter(p);
    const r = await p.evaluate(() => {
      DMStore.applyV2({ operationId: 'd1', type: 'medication_upsert', medication: { id: 'md', name: 'DEMO Datas' } });
      DMStore.applyV2({ operationId: 'd2', type: 'reminder_upsert', reminder: { id: 'rd', medicationId: 'md', times: ['08:00'], isActive: true } });
      const out = {};
      for (const d of ['2026-02-31', '2026-13-01', '2026-04-31', '2027-02-29']) out[d] = DMStore.applyV2({ operationId: 'dx_' + d, type: 'record_dose', reminderId: 'rd', date: d, time: '08:00', status: 'taken' }).reason;
      out.records = DMStore.getV2().doseRecords.length;
      out.tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      out.gap = DailyMedV2.classifySlot('2026-03-29', '01:30').kind;
      const rep = DailyMedV2.classifySlot('2026-10-25', '01:30');
      out.rep = [rep.kind, new Date(rep.instant).toISOString(), new Date(rep.second).toISOString()];
      out.leap = DailyMedV2.isValidDateStr('2028-02-29');
      return out;
    });
    chk('browser em Europe/Lisbon', r.tz === 'Europe/Lisbon', r.tz);
    chk('datas impossíveis recusadas no browser, nada gravado', ['2026-02-31', '2026-13-01', '2026-04-31', '2027-02-29'].every((d) => r[d] === 'invalid_date') && r.records === 0, r);
    chk('2028-02-29 é uma data válida', r.leap === true);
    chk('29/03/2026 01:30 inexistente', r.gap === 'inexistente');
    chk('25/10/2026 01:30 repetida: primeira 00:30Z, segunda 01:30Z', r.rep[0] === 'repetido' && r.rep[1] === '2026-10-25T00:30:00.000Z' && r.rep[2] === '2026-10-25T01:30:00.000Z', r.rep);
    await ctx.close();
    // Comportamento documentado: a app segue o fuso do dispositivo. Noutro fuso, as mudanças de hora são as desse fuso.
    const ctxNY = await fresh({ timezoneId: 'America/New_York' }); const n = await newPage(ctxNY, errors);
    await n.goto(BASE + '#home'); await ready(n);
    const ny = await n.evaluate(() => [DailyMedV2.classifySlot('2026-03-29', '01:30').kind, DailyMedV2.classifySlot('2026-03-08', '02:30').kind]);
    chk('fuso do dispositivo (Nova Iorque): 29/03 normal, 08/03 02:30 inexistente', ny[0] === 'normal' && ny[1] === 'inexistente', ny);
    await ctxNY.close();
  }

  current = 'alterações externas por chave';
  {
    const ctx = await fresh(); const a = await newPage(ctx, errors);
    await seed(a, v1Data()); await a.reload(); await ready(a); await migrateViaUi(a); await a.reload(); await ready(a); await waitWriter(a);
    const old = await newPage(ctx, errors); await old.goto(BASE + '#home'); await ready(old); // separador "antigo": escreve diretamente
    const banner = async () => (await a.textContent('#dm-banners'));
    const clear = async () => { await a.evaluate(() => { DMStore.dismissNotice('external'); DMStore.dismissNotice('sharedExternal'); }); };
    // C: sem impacto → sem avisos
    for (const [k, v] of [['dailymed_medication_alerts', '{"dismissed":["x"]}'], ['dailymed_last_dica', 'dica_3'], ['dailymed_geo_Rua%20Teste', '{"lat":1,"lon":2}'], ['dailymed_onboarding_done', 'true']]) {
      await old.evaluate(([k1, v1]) => localStorage.setItem(k1, v1), [k, v]); await a.waitForTimeout(400);
      chk('chave sem impacto (' + k + '): sem aviso', !(await banner()).includes('versão antiga'));
    }
    // B: partilhadas → aviso de conflito, a alteração fica
    for (const k of ['dailymed_settings', 'dailymed_recycling_deliveries', 'dailymed_travel_checklist']) {
      await clear();
      await old.evaluate((k1) => localStorage.setItem(k1, k1 === 'dailymed_settings' ? '{"notifications":true,"theme":"light"}' : (k1 === 'dailymed_travel_checklist' ? '{"t1":true}' : '[{"id":"rc9"}]')), k); await a.waitForTimeout(400);
      const b = await banner();
      chk('chave partilhada (' + k + '): aviso de alteração por versão antiga', b.includes('versão antiga') && b.includes('partilhados'), b);
    }
    // gravações da própria v2 noutra aba não dão aviso falso
    chk('avisos do separador de escrita chegam ao outro separador v2', (await old.textContent('#dm-banners')).includes('versão antiga'));
    await clear(); await old.evaluate(() => { DMStore.dismissNotice('external'); DMStore.dismissNotice('sharedExternal'); });
    await a.evaluate(() => { setSettings({ theme: 'light', notifications: false }); addRecyclingDelivery({ id: 'rc10', volume: 'pequeno', date: '2026-11-01' }); setTravelChecklistItem('t2', true); });
    await old.waitForTimeout(400);
    chk('gravações da v2 não geram aviso no outro separador v2', !(await old.textContent('#dm-banners')).includes('versão antiga'));
    // A: medicação → aviso, não aplicada
    for (const [k, v, label] of [['dailymed_reminders', '[{"id":"r1","medicationId":"m1","times":["10:00"],"isActive":true}]', 'lembretes'],
      ['dailymed_medication_history', JSON.stringify([{ medicationName: 'Medicamento DEMO A', dateTime: '05/11/2026, 09:00:00' }].concat(JSON.parse(v1Data().dailymed_medication_history))), 'histórico de tomas'],
      ['dailymed_medications', '[{"id":"m1","name":"Alterado"}]', 'medicamentos']]) {
      await clear();
      await old.evaluate(([k1, v1]) => localStorage.setItem(k1, v1), [k, v]); await a.waitForTimeout(600);
      const b = await banner();
      chk('chave de medicação (' + k + '): aviso com "' + label + '"', b.includes('versão antiga') && b.includes(label), b);
    }
    const st = await v2(a);
    chk('alterações antigas de medicação não aplicadas', st.reminders.find((r) => r.id === 'r1').times.length === 3 && st.medications.find((m) => m.id === 'm1').name === 'Medicamento DEMO A');
    chk('nova entrada do histórico antigo guardada como "não confirmado"', st.doseRecords.filter((r) => r.status === 'legacy_unverified').length === 3);
    // deteção no arranque (sem separador v2 aberto na altura da alteração)
    await a.close(); await old.close();
    const lone = await newPage(ctx, errors); await lone.goto(BASE + '#home'); await ready(lone);
    await lone.evaluate(() => localStorage.setItem('dailymed_settings', '{"notifications":true,"theme":"dark"}')); // ninguém a ouvir esta alteração em v2? (este separador é v2 e é o próprio a escrever: não recebe evento)
    await lone.reload(); await ready(lone); await waitWriter(lone); await lone.waitForTimeout(400);
    chk('alteração partilhada feita sem separador v2 a ouvir: detetada no arranque', (await lone.textContent('#dm-banners')).includes('definições'));
    await ctx.close();
  }

  current = 'exportação';
  {
    const ctx = await fresh(); const p = await newPage(ctx, errors);
    await seed(p, v1Data()); await p.reload(); await ready(p); await migrateViaUi(p); await p.reload(); await ready(p); await waitWriter(p);
    const before = await snapshot(p);
    const dl = p.waitForEvent('download', { timeout: 5000 });
    await go(p, '#definicoes'); await p.click('#data-section [data-action="export"]');
    const d = await dl;
    const file = JSON.parse(fs.readFileSync(await d.path(), 'utf8'));
    const after = await snapshot(p);
    chk('exportação não altera o localStorage', JSON.stringify(before) === JSON.stringify(after));
    chk('exportação é JSON com formato e chaves esperadas', file.format === 'dailymed-export' && file.schemaStatus === 'v2' && file.keys.dailymed_v2 === before.dailymed_v2 && file.keys.dailymed_medications === before.dailymed_medications);
    // recalcula o SHA-256 fora do browser (Node crypto), com a mesma serialização canónica
    const canon = (o) => (o === null || typeof o !== 'object') ? JSON.stringify(o) : Array.isArray(o) ? '[' + o.map(canon).join(',') + ']' : '{' + Object.keys(o).sort().map((k) => JSON.stringify(k) + ':' + canon(o[k])).join(',') + '}';
    const copy = Object.assign({}, file); delete copy.checksum;
    const h = require('crypto').createHash('sha256').update(canon(copy), 'utf8').digest('hex');
    chk('SHA-256 confirmado independentemente', h === file.checksum, { h, c: file.checksum });
    const tampered = JSON.parse(JSON.stringify(copy)); tampered.keys.dailymed_v2 = tampered.keys.dailymed_v2.replace('Medicamento DEMO A', 'Medicamento DEMO X');
    chk('ficheiro alterado deixa de bater com o SHA-256', require('crypto').createHash('sha256').update(canon(tampered), 'utf8').digest('hex') !== file.checksum);
    chk('nome do ficheiro inclui o início do checksum', d.suggestedFilename().includes(file.checksum.slice(0, 8)));
    await ctx.close();
  }

  current = 'chaves partilhadas sem recarregar';
  for (const [key, val, label] of [
    ['dailymed_settings', '{"notifications":true,"theme":"dark"}', 'definições'],
    ['dailymed_recycling_deliveries', '[{"id":"rc_antigo","volume":"grande","date":"2026-11-02"}]', 'entregas de reciclagem'],
    ['dailymed_travel_checklist', '{"item_antigo":true}', 'lista de viagem'],
  ]) {
    const ctx = await fresh(); const a = await newPage(ctx, errors);
    await seed(a, v1Data()); await a.reload(); await ready(a); await waitWriter(a);
    const old = await newPage(ctx, errors); await old.goto(BASE + '#home'); await ready(old); // separador da versão antiga
    const t = await migrateViaUi(a); // sem recarregar a página depois
    const ref = JSON.parse(await a.evaluate(() => localStorage.getItem('dailymed_v2_shared')));
    chk(key + ': referência criada pela própria migração', t.includes('concluída') && ref && ref[key] !== undefined, ref);
    chk(key + ': separador migrado está em v2 sem recarregar', (await status(a)).mode === 'v2');
    const v2tab = await newPage(ctx, errors); await v2tab.goto(BASE + '#home'); await ready(v2tab); await v2tab.waitForTimeout(300);
    chk(key + ': sem avisos antes de qualquer alteração', !(await a.textContent('#dm-banners')).includes('versão antiga') && !(await v2tab.textContent('#dm-banners')).includes('versão antiga'));
    // 1) O separador antigo (código sem DMStore) grava diretamente — ANTES de qualquer gravação da v2
    await old.evaluate(([k, v]) => localStorage.setItem(k, v), [key, val]); await a.waitForTimeout(500);
    const b = await a.textContent('#dm-banners');
    chk(key + ': aviso de conflito no separador migrado, sem recarregar', b.includes('versão antiga') && b.includes(label), b);
    chk(key + ': aviso também no outro separador v2', (await v2tab.textContent('#dm-banners')).includes(label));
    chk(key + ': a alteração (partilhada) foi preservada', await a.evaluate((k) => localStorage.getItem(k), key) === val);
    // 2) Gravações da própria v2 depois: não podem dar novos avisos (nem no próprio nem no outro separador v2)
    await a.evaluate(() => DMStore.dismissNotice('sharedExternal')); await v2tab.evaluate(() => DMStore.dismissNotice('sharedExternal'));
    const own = await a.evaluate(() => [setSettings({ theme: 'light' }), addRecyclingDelivery({ id: 'rc_v2', volume: 'pequeno', date: '2026-11-03' }), setTravelChecklistItem('item_v2', true)]);
    await v2tab.waitForTimeout(500);
    const ba = await a.textContent('#dm-banners'), bb = await v2tab.textContent('#dm-banners');
    chk(key + ': gravações da v2 não dão aviso', own.every((x) => x !== false) && !ba.includes('versão antiga') && !bb.includes('versão antiga'), { own, ba, bb });
    await ctx.close();
  }
  {
    // Alteração antiga DURANTE a migração (depois da referência e antes da ativação): avisada logo após ativar.
    const ctx = await fresh(); const a = await newPage(ctx, errors);
    await seed(a, v1Data()); await a.reload(); await ready(a); await waitWriter(a);
    await a.evaluate(() => {
      const orig = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) { orig.call(this, k, v); if (k === 'dailymed_v2') { Storage.prototype.setItem = orig; orig.call(localStorage, 'dailymed_settings', '{"notifications":true,"theme":"dark","mudado":"durante"}'); } };
    });
    await migrateViaUi(a); await a.waitForTimeout(300);
    chk('alteração partilhada durante a migração: avisada logo após a ativação', (await a.textContent('#dm-banners')).includes('definições'));
    await ctx.close();
  }

  {
    // Instalação migrada por uma versão anterior desta app (sem dailymed_v2_shared): referência reconstruída da cópia de segurança.
    const ctx = await fresh(); const a = await newPage(ctx, errors);
    await seed(a, v1Data()); await a.reload(); await ready(a); await waitWriter(a); await migrateViaUi(a);
    await a.evaluate(() => { localStorage.removeItem('dailymed_v2_shared'); localStorage.setItem('dailymed_recycling_deliveries', '[{"id":"rc_entretanto"}]'); });
    await a.reload(); await ready(a); await waitWriter(a); await a.waitForTimeout(400);
    chk('sem referência: alteração desde a migração detetada pela cópia de segurança', (await a.textContent('#dm-banners')).includes('entregas de reciclagem'));
    // gravação da v2 sem referência: não cria uma referência parcial que esconda outras chaves
    await a.evaluate(() => { localStorage.removeItem('dailymed_v2_shared'); DMStore.dismissNotice('sharedExternal'); setSettings({ theme: 'light' }); });
    const ref = JSON.parse(await a.evaluate(() => localStorage.getItem('dailymed_v2_shared')));
    chk('gravação da v2 sem referência: referência completa (3 chaves)', ref && Object.keys(ref).length === 3, ref);
    await ctx.close();
  }

  {
    // Regressão de uma condição de corrida: gravações da v2 em sequência, vistas por outro separador v2 (10 repetições).
    let falsos = 0;
    for (let i = 0; i < 10; i++) {
      const ctx = await fresh(); const a = await newPage(ctx, errors);
      await seed(a, v1Data()); await a.reload(); await ready(a); await waitWriter(a); await migrateViaUi(a);
      const r = await newPage(ctx, errors); await r.goto(BASE + '#home'); await ready(r);
      await a.evaluate(() => { setSettings({ theme: 'light' }); addRecyclingDelivery({ id: 'x' + Math.random() }); setTravelChecklistItem('t' + Math.random(), true); setSettings({ notifications: true }); });
      await r.waitForTimeout(350);
      if (await r.evaluate(() => !!DMStore.status().notices.sharedExternal) || await a.evaluate(() => !!DMStore.status().notices.sharedExternal)) falsos++;
      await ctx.close();
    }
    chk('gravações da v2 em sequência: 0 falsos avisos em 10 repetições', falsos === 0, falsos);
  }

  current = 'recuperação: propriedade das imagens';
  {
    const PRE_IMAGES = JSON.stringify({ img_pre_1: PNG_1x1 });
    const FOREIGN_IMAGES = JSON.stringify({ img_outra_operacao: PNG_1x1, extra: PNG_1x1 });
    const IGNORE = (k) => k === 'dailymed_schema' || k.startsWith('dailymed_backup_v1_') || k === 'dailymed_v2_diagnostics';
    function sameExceptOwn(before, after) {
      const diff = [];
      for (const k of new Set(Object.keys(before).concat(Object.keys(after)))) { if (IGNORE(k)) continue; if (before[k] !== after[k]) diff.push(k); }
      return diff;
    }
    async function interrupted(name, { pre, pause, tamper, failRecovery }) {
      const ctx = await fresh();
      // Hook de falha na recuperação, ativo só enquanto existir a chave de teste (fora do prefixo dailymed_)
      await ctx.addInitScript(() => { try { const f = localStorage.getItem('__dm_test_fail'); if (f) window.__DM_TEST_FAIL = JSON.parse(f); } catch (e) { /* */ } });
      const a = await newPage(ctx, errors);
      await seed(a, v1Data(pre ? { dailymed_v2_images: PRE_IMAGES } : {})); await a.reload(); await ready(a); await waitWriter(a);
      const before = await snapshot(a);
      await a.evaluate((p) => { window.__DM_TEST_PAUSE = p; DMStore.migrate(); }, pause);
      await a.waitForFunction(() => { const s = JSON.parse(localStorage.getItem('dailymed_schema') || '{}'); return s.status === 'migrating' && s.journal && s.journal.keys.dailymed_v2_images.intent; });
      await a.waitForTimeout(200);
      const mid = await snapshot(a);
      const marker = JSON.parse(mid.dailymed_schema);
      if (pause === 'after-images') chk(name + ': imagens da migração escritas antes da interrupção', mid.dailymed_v2_images !== (pre ? PRE_IMAGES : undefined));
      if (pause === 'before-images') chk(name + ': interrompida antes de escrever imagens', mid.dailymed_v2_images === (pre ? PRE_IMAGES : undefined));
      chk(name + ': diário persistente no marcador (pre/intent)', marker.journal.keys.dailymed_v2_images.pre === (pre ? marker.journal.keys.dailymed_v2_images.pre : 'absent') && /^sha256:/.test(marker.journal.keys.dailymed_v2_images.intent));
      if (tamper) await a.evaluate((v) => localStorage.setItem('dailymed_v2_images', v), tamper);
      if (failRecovery) await a.evaluate((f) => localStorage.setItem('__dm_test_fail', JSON.stringify(f)), failRecovery);
      await a.close(); // encerramento inesperado: o estado em memória perde-se
      const b = await newPage(ctx, errors); await b.goto(BASE + '#home'); await ready(b); await waitWriter(b); await b.waitForTimeout(600);
      let after = await snapshot(b);
      let sc = JSON.parse(after.dailymed_schema);
      if (failRecovery) {
        chk(name + ': falha na recuperação deixa o marcador em "migrating"', sc.status === 'migrating', sc.status);
        chk(name + ': falha na recuperação não perde as imagens anteriores (estão no conteúdo atual ou na cópia)',
          pre ? (after.dailymed_v2_images === PRE_IMAGES || JSON.parse(after[marker.backupKey]).keys.dailymed_v2_images === PRE_IMAGES) : true);
        chk(name + ': falha registada no diagnóstico', JSON.parse(after.dailymed_v2_diagnostics || '[]').some((d) => d.type === 'recovery_failed'));
        chk(name + ': aviso claro de recuperação por terminar', (await b.textContent('#dm-banners')).includes('não terminou'));
        await b.evaluate(() => localStorage.removeItem('__dm_test_fail'));
        await b.reload(); await ready(b); await waitWriter(b); await b.waitForTimeout(600);
        after = await snapshot(b); sc = JSON.parse(after.dailymed_schema);
      }
      chk(name + ': recuperação volta a v1', sc.status === 'v1' && (await status(b)).mode === 'v1', sc.status);
      const expectImages = tamper ? tamper : (pre ? PRE_IMAGES : undefined);
      chk(name + ': dailymed_v2_images = ' + (tamper ? 'conteúdo da outra operação (preservado)' : pre ? 'conteúdo anterior (reposto/intacto)' : 'ausente, como antes'), after.dailymed_v2_images === expectImages);
      const diff = sameExceptOwn(Object.assign({}, before, tamper ? { dailymed_v2_images: tamper } : {}), after).filter((k) => k !== '__dm_test_fail');
      chk(name + ': nenhuma outra chave alterada ou apagada (v1 incluídas)', diff.length === 0, diff);
      chk(name + ': sem dados v2 nem referência partilhada deixados pela migração', !('dailymed_v2' in after) && !('dailymed_v2_shared' in after));
      chk(name + ': cópia de segurança mantida', Object.keys(after).some((k) => k.startsWith('dailymed_backup_v1_')));
      if (tamper) chk(name + ': conteúdo de outra operação ficou registado como preservado', (sc.recovery && sc.recovery.preserved.includes('dailymed_v2_images')));
      // recuperação repetida: nada muda
      const again = await b.evaluate(() => DMStore.recoverIfInterrupted());
      const after2 = await snapshot(b);
      chk(name + ': recuperação repetida não faz nada', again === false && JSON.stringify(after2) === JSON.stringify(after));
      // mesmo que o marcador "migrating" antigo voltasse (ex.: gravação do marcador perdida), recuperar outra vez não perde nada
      await b.evaluate((m) => localStorage.setItem('dailymed_schema', m), mid.dailymed_schema);
      await b.reload(); await ready(b); await waitWriter(b); await b.waitForTimeout(600);
      const after3 = await snapshot(b);
      chk(name + ': segunda recuperação com o mesmo diário: conteúdo igual', after3.dailymed_v2_images === after.dailymed_v2_images && sameExceptOwn(after, after3).length === 0 && JSON.parse(after3.dailymed_schema).status === 'v1');
      await ctx.close();
    }
    await interrupted('antes das imagens, sem imagens anteriores', { pre: false, pause: 'before-images' });
    await interrupted('antes das imagens, com imagens anteriores', { pre: true, pause: 'before-images' });
    await interrupted('depois das imagens, sem imagens anteriores', { pre: false, pause: 'after-images' });
    await interrupted('depois das imagens, com imagens anteriores', { pre: true, pause: 'after-images' });
    await interrupted('imagens de outra operação', { pre: true, pause: 'after-images', tamper: FOREIGN_IMAGES });
    await interrupted('falha ao repor imagens anteriores', { pre: true, pause: 'after-images', failRecovery: { 'recover-restore': true } });
    await interrupted('falha ao remover imagens da migração', { pre: false, pause: 'after-images', failRecovery: { 'recover-remove': true } });

    // Falha normal (sem espaço ao gravar dailymed_v2) com imagens anteriores: a reversão imediata repõe-nas
    const ctx = await fresh(); const p = await newPage(ctx, errors);
    await seed(p, v1Data({ dailymed_v2_images: PRE_IMAGES })); await p.reload(); await ready(p); await waitWriter(p);
    const before = await snapshot(p);
    const r = await p.evaluate(() => { window.__DM_TEST_FAIL = { 'write-v2': 'quota' }; return DMStore.migrate().then(() => 'ok', (e) => e.info.rollback); });
    const after = await snapshot(p);
    chk('falha ao gravar v2 com imagens anteriores: imagens repostas da cópia', after.dailymed_v2_images === PRE_IMAGES && r.restored.includes('dailymed_v2_images'), r);
    chk('falha ao gravar v2: nenhuma outra chave alterada', sameExceptOwn(before, after).length === 0, sameExceptOwn(before, after));
    chk('cópia de segurança inclui as imagens anteriores', JSON.parse(after[Object.keys(after).find((k) => k.startsWith('dailymed_backup_v1_'))]).keys.dailymed_v2_images === PRE_IMAGES);
    await ctx.close();
  }

  current = 'sem Web Locks';
  {
    const ctx = await fresh(); await ctx.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'locks', { get: () => undefined, configurable: true }); } catch (e) { /* */ } });
    const p = await newPage(ctx, errors);
    await seed(p, v1Data()); await p.reload(); await ready(p);
    let s = await status(p);
    chk('v1 sem Web Locks: grava como antes', s.mode === 'v1' && s.block === null && (await p.evaluate(() => setSettings({ theme: 'light' }))) === true, s);
    await go(p, '#atualizar-dados');
    chk('v1 sem Web Locks: atualização indisponível', await p.locator('#btn-migrate').isDisabled() && (await p.textContent('#app')).includes('Web Locks'));
    // dados já em v2 (vindos de outro browser/sessão): só leitura
    const ctx2 = await fresh(); const q = await newPage(ctx2, errors);
    await seed(q, v1Data()); await q.reload(); await ready(q); await migrateViaUi(q);
    const data = await snapshot(q); await ctx2.close();
    await seed(p, data); await p.reload(); await ready(p);
    s = await status(p);
    chk('v2 sem Web Locks: só leitura, com aviso', s.mode === 'v2' && s.block === 'no_locks' && (await p.textContent('#dm-banners')).includes('não permite registar'), s);
    chk('v2 sem Web Locks: consulta funciona', (await p.locator('#slots-today .slot-row').count()) === 3);
    const r = await p.evaluate(() => DMStore.applyV2({ operationId: 'x1', type: 'stock_confirm', medicationId: 'm1' }).status);
    chk('v2 sem Web Locks: operações recusadas', r === 'read_only_tab');
    const dl = p.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await go(p, '#definicoes'); await p.click('#data-section [data-action="export"]');
    const d = await dl;
    chk('v2 sem Web Locks: exportação continua disponível', !!d && /^dailymed-copia-.*\.json$/.test(d.suggestedFilename()));
    if (d) {
      const file = JSON.parse(fs.readFileSync(await d.path(), 'utf8'));
      chk('exportação tem checksum SHA-256 e as chaves v1 e v2', file.checksumAlgorithm === 'SHA-256' && /^[0-9a-f]{64}$/.test(file.checksum) && 'dailymed_v2' in file.keys && 'dailymed_medications' in file.keys);
    }
    await ctx.close();
  }

  await ctxMain.close();
  await browser.close();
  if (srv) srv.close();

  current = 'geral';
  chk('sem erros JavaScript da app', errors.length === 0, errors);
  const fails = results.filter((r) => !r.ok);
  console.log('\n' + (results.length - fails.length) + ' de ' + results.length + ' verificações passaram.');
  if (fails.length) { console.log('FALHAS:'); fails.forEach((f) => console.log(' - [' + f.group + '] ' + f.name)); process.exit(1); }
}

main().catch((e) => { console.error(e); process.exit(2); });
