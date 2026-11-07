/**
 * DailyMed v2 — regras puras (sem localStorage nem DOM).
 * Stock por movimentos, registo de tomas por horário, correções, horários com mudança de hora,
 * verificação de invariantes e construção do estado v2 a partir dos dados v1.
 * Funciona no browser (window.DailyMedV2) e em Node (module.exports) para os testes.
 */
(function (global) {
  'use strict';

  var SCHEMA_VERSION = 2;
  var CORRECTION_WINDOW_DAYS = 7;
  var LOW_STOCK_DOSES = 5;
  var REFERENCE_TYPES = { initial: true, count: true, confirmation: true };
  var REVERTIBLE_TYPES = { entry: true, exit: true, adjustment: true };
  var NOT_TAKEN_REASONS = ['esqueci', 'sem_medicamento', 'decidi_nao_tomar', 'outro_ou_nao_indicar'];
  var UNITS = ['comprimido', 'cápsula', 'ml', 'gota', 'saqueta', 'aplicação', 'unidade'];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  // Contas em centésimas inteiras para evitar erros como 0,1 + 0,2.
  function toCents(x) { return Math.round(Number(x) * 100); }
  function fromCents(c) { return Math.round(c) / 100; }
  function isPositiveAmount(x) { var n = Number(x); return isFinite(n) && n > 0 && Math.abs(toCents(n) - n * 100) < 1e-6; }
  function isNonNegativeAmount(x) { var n = Number(x); return isFinite(n) && n >= 0 && Math.abs(toCents(n) - n * 100) < 1e-6; }

  function emptyState(appVersion) {
    return {
      schemaVersion: SCHEMA_VERSION,
      appVersion: appVersion || '2.0.0',
      writeVersion: 0,
      nextSeq: 1, // próximo número de ordem livre para um movimento de stock
      medications: [],
      reminders: [],
      doseRecords: [],
      operations: [],
      stockMovements: [],
      stockConfig: {},
      snoozes: [],
      v1Sync: {},
      migration: null,
    };
  }

  // ---------- datas ----------
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function localDateStr(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function daysBetween(dateA, dateB) {
    var a = Date.UTC(+dateA.slice(0, 4), +dateA.slice(5, 7) - 1, +dateA.slice(8, 10));
    var b = Date.UTC(+dateB.slice(0, 4), +dateB.slice(5, 7) - 1, +dateB.slice(8, 10));
    return Math.round((b - a) / 864e5);
  }

  /** Data de calendário real no formato AAAA-MM-DD (ano 2000–2100, meses 1–12, dias do mês certos, anos bissextos). */
  function isValidDateStr(str) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str == null ? '' : str));
    if (!m) return false;
    var y = +m[1], mo = +m[2], d = +m[3];
    if (y < 2000 || y > 2100 || mo < 1 || mo > 12 || d < 1) return false;
    var leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    var dim = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mo - 1];
    return d <= dim;
  }
  function isValidTimeStr(str) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(str == null ? '' : str)); }

  /**
   * Classifica um horário num dia, em hora LOCAL do dispositivo: normal, inexistente (salto de hora) ou repetido.
   * A app usa deliberadamente o fuso horário do dispositivo (os lembretes seguem o relógio do utente).
   * Data ou hora impossíveis → 'invalida' (nunca confundidas com mudança de hora).
   * Na hora repetida, 'instant' é a PRIMEIRA ocorrência e 'second' a segunda.
   */
  function classifySlot(dateStr, hhmm) {
    if (!isValidDateStr(dateStr) || !isValidTimeStr(hhmm)) return { kind: 'invalida', instant: null };
    var y = +dateStr.slice(0, 4), mo = +dateStr.slice(5, 7), d = +dateStr.slice(8, 10);
    var parts = String(hhmm).split(':');
    var h = +parts[0], mi = +parts[1];
    var t = new Date(y, mo - 1, d, h, mi, 0, 0);
    if (t.getHours() !== h || t.getMinutes() !== mi || t.getDate() !== d) return { kind: 'inexistente', instant: null };
    var same = function (x) { return x.getHours() === h && x.getMinutes() === mi && x.getDate() === d; };
    var before = new Date(t.getTime() - 3600e3), after = new Date(t.getTime() + 3600e3);
    if (same(before)) return { kind: 'repetido', instant: before.getTime(), second: t.getTime() };
    if (same(after)) return { kind: 'repetido', instant: t.getTime(), second: after.getTime() };
    return { kind: 'normal', instant: t.getTime() };
  }

  // ---------- consultas ----------
  function findMed(st, id) { for (var i = 0; i < st.medications.length; i++) if (st.medications[i].id === id) return st.medications[i]; return null; }
  function findReminder(st, id) { for (var i = 0; i < st.reminders.length; i++) if (st.reminders[i].id === id) return st.reminders[i]; return null; }
  function findRecord(st, id) { for (var i = 0; i < st.doseRecords.length; i++) if (st.doseRecords[i].id === id) return st.doseRecords[i]; return null; }
  function findMovement(st, id) { for (var i = 0; i < st.stockMovements.length; i++) if (st.stockMovements[i].id === id) return st.stockMovements[i]; return null; }
  function movementsFor(st, medId) {
    return st.stockMovements.filter(function (m) { return m.medicationId === medId; }).sort(function (a, b) { return a.seq - b.seq; });
  }
  function isConfigured(st, medId) {
    return !!(st.stockConfig[medId] && st.stockMovements.some(function (m) { return m.medicationId === medId && m.type === 'initial'; }));
  }
  /** Saldo em centésimas: última referência (initial, count, confirmation) + deltas seguintes. null se não configurado. */
  function balanceCents(st, medId) {
    if (!isConfigured(st, medId)) return null;
    var mv = movementsFor(st, medId), base = 0, start = 0;
    for (var i = mv.length - 1; i >= 0; i--) {
      if (REFERENCE_TYPES[mv[i].type]) { base = toCents(mv[i].countedQuantity); start = i + 1; break; }
    }
    for (var j = start; j < mv.length; j++) base += toCents(mv[j].delta);
    return base;
  }
  function stockBalance(st, medId) { var c = balanceCents(st, medId); return c === null ? null : fromCents(c); }
  function lastReferenceSeq(st, medId) {
    var s = 0; st.stockMovements.forEach(function (m) { if (m.medicationId === medId && REFERENCE_TYPES[m.type] && m.seq > s) s = m.seq; }); return s;
  }
  function openIssues(st, medId) {
    var ref = lastReferenceSeq(st, medId);
    return movementsFor(st, medId).filter(function (m) { return m.type === 'issue' && m.seq > ref; });
  }
  function dosesRemaining(st, medId) {
    var cfg = st.stockConfig[medId]; var bal = balanceCents(st, medId);
    if (!cfg || bal === null || !(cfg.amountPerDose > 0)) return null;
    return Math.floor(bal / toCents(cfg.amountPerDose));
  }
  function isLowStock(st, medId) { var d = dosesRemaining(st, medId); return d !== null && d <= LOW_STOCK_DOSES; }
  /** Um registo está coberto se existir uma referência do mesmo medicamento com seq >= stockAnchorSeq. */
  function isCovered(st, rec) {
    if (rec.stockAnchorSeq == null || !rec.medicationId) return false;
    return st.stockMovements.some(function (m) { return m.medicationId === rec.medicationId && REFERENCE_TYPES[m.type] && m.seq >= rec.stockAnchorSeq; });
  }
  function reversalOf(st, movementId) {
    for (var i = 0; i < st.stockMovements.length; i++) if (st.stockMovements[i].type === 'reversal' && st.stockMovements[i].reversesMovementId === movementId) return st.stockMovements[i];
    return null;
  }
  function openConsumption(st, rec) {
    var list = st.stockMovements.filter(function (m) { return m.type === 'consumption' && m.doseRecordId === rec.id && !reversalOf(st, m.id); });
    return list.length ? list[0] : null;
  }

  // ---------- movimentos ----------
  function addMovement(st, op, fields) {
    var seq = st.nextSeq;
    st.nextSeq = seq + 1;
    var m = {
      id: 'mov_' + seq + '_' + String(op.operationId).replace(/[^a-zA-Z0-9]/g, '').slice(-6),
      seq: seq,
      medicationId: fields.medicationId,
      type: fields.type,
      delta: fields.delta || 0,
      countedQuantity: fields.countedQuantity == null ? null : fields.countedQuantity,
      balanceAfter: null,
      unit: (st.stockConfig[fields.medicationId] || {}).unit || fields.unit || null,
      doseRecordId: fields.doseRecordId || null,
      operationId: op.operationId,
      reversesMovementId: fields.reversesMovementId || null,
      reason: fields.reason || null,
      note: fields.note || '',
      createdAt: op._now,
    };
    st.stockMovements.push(m);
    var bal = balanceCents(st, m.medicationId);
    m.balanceAfter = bal === null ? null : fromCents(bal);
    return m;
  }

  function tryConsume(st, op, rec) {
    var cfg = st.stockConfig[rec.medicationId];
    if (!isConfigured(st, rec.medicationId)) { rec.stock = { status: 'not_deducted', reason: 'stock_not_configured', openConsumptionId: null }; rec.dose = null; return []; }
    rec.dose = { amount: cfg.amountPerDose, unit: cfg.unit };
    if (openConsumption(st, rec)) return [];
    if (isCovered(st, rec)) { rec.stock = { status: 'not_deducted', reason: 'covered_by_reference', openConsumptionId: null }; return []; }
    var bal = balanceCents(st, rec.medicationId), need = toCents(cfg.amountPerDose);
    if (bal < need) {
      var issue = addMovement(st, op, { medicationId: rec.medicationId, type: 'issue', doseRecordId: rec.id, reason: 'insufficient_stock' });
      rec.stock = { status: 'not_deducted', reason: 'insufficient_stock', availableAtRecord: fromCents(bal), openConsumptionId: null };
      return [issue.id];
    }
    var c = addMovement(st, op, { medicationId: rec.medicationId, type: 'consumption', delta: -fromCents(need), doseRecordId: rec.id, reason: 'toma' });
    rec.stock = { status: 'deducted', reason: null, openConsumptionId: c.id };
    return [c.id];
  }

  function reverseConsumption(st, op, rec) {
    var open = openConsumption(st, rec);
    if (!open) { if (rec.stock && rec.stock.status === 'deducted') rec.stock = { status: 'not_deducted', reason: 'reverted', openConsumptionId: null }; return []; }
    var covered = isCovered(st, rec);
    var r = addMovement(st, op, {
      medicationId: rec.medicationId, type: 'reversal', delta: covered ? 0 : -open.delta, doseRecordId: rec.id,
      reversesMovementId: open.id, reason: covered ? 'sem_efeito_apos_contagem' : 'correcao_toma',
    });
    rec.stock = { status: 'not_deducted', reason: covered ? 'covered_by_reference' : 'reverted', openConsumptionId: null };
    return [r.id];
  }

  // ---------- operações ----------
  function reject(reason, extra) { var r = { status: 'rejected', reason: reason }; if (extra) for (var k in extra) r[k] = extra[k]; return r; }
  function activeRecordForSlot(st, slotKey) {
    for (var i = 0; i < st.doseRecords.length; i++) { var r = st.doseRecords[i]; if (r.slotKey === slotKey && !r.voidedAt) return r; }
    return null;
  }

  var HANDLERS = {
    medication_upsert: function (st, op) {
      var med = op.medication || {};
      if (!med.id || typeof med.id !== 'string') return reject('invalid_medication');
      if (!med.name || !String(med.name).trim()) return reject('invalid_medication');
      var existing = findMed(st, med.id);
      var clean = clone(med);
      delete clean.quantity; delete clean.imageUri;
      if (existing) {
        if (existing.removedAt) return reject('medication_removed');
        for (var k in clean) if (k !== 'removedAt' && k !== 'id') existing[k] = clean[k];
        existing.updatedAt = op._now;
      } else {
        clean.removedAt = null; clean.createdAt = op._now; clean.updatedAt = op._now;
        if (clean.legacyQuantity === undefined) clean.legacyQuantity = null;
        st.medications.push(clean);
      }
      return { status: 'applied', medicationId: med.id };
    },
    medication_remove: function (st, op) {
      var m = findMed(st, op.medicationId);
      if (!m) return reject('unknown_medication');
      if (m.removedAt) return reject('medication_removed');
      m.removedAt = op._now;
      st.reminders.forEach(function (r) {
        if (r.medicationId === m.id && r.isActive) { r.isActive = false; r.deactivatedReason = 'medication_removed'; r.updatedAt = op._now; }
      });
      return { status: 'applied' };
    },
    medication_restore: function (st, op) {
      var m = findMed(st, op.medicationId);
      if (!m) return reject('unknown_medication');
      if (!m.removedAt) return reject('not_removed');
      m.removedAt = null; m.updatedAt = op._now; // os lembretes ficam desativados até o utente os reativar
      return { status: 'applied' };
    },
    reminder_upsert: function (st, op) {
      var r = op.reminder || {};
      if (!r.id || !r.medicationId) return reject('invalid_reminder');
      var med = findMed(st, r.medicationId);
      if (!med) return reject('unknown_medication');
      if (med.removedAt && r.isActive) return reject('medication_removed');
      var times = Array.isArray(r.times) ? r.times.filter(function (t) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(t); }) : [];
      var existing = findReminder(st, r.id);
      var clean = clone(r); clean.times = times; delete clean.lastTakenDate;
      if (existing) { for (var k in clean) if (k !== 'id') existing[k] = clean[k]; existing.updatedAt = op._now; }
      else { clean.createdAt = op._now; clean.updatedAt = op._now; st.reminders.push(clean); }
      return { status: 'applied' };
    },
    stock_config: function (st, op) {
      var medId = op.medicationId;
      var med = findMed(st, medId);
      if (!med || med.removedAt) return reject('unknown_medication');
      if (UNITS.indexOf(op.unit) === -1) return reject('invalid_unit');
      if (!isPositiveAmount(op.amountPerDose)) return reject('invalid_amount');
      if (isConfigured(st, medId)) {
        var cfg = st.stockConfig[medId];
        // A unidade não muda depois de haver movimentos: o saldo e todos os movimentos estão nessa unidade
        // (10 comprimidos não passam a ser 10 caixas). Não há conversão automática.
        if (op.unit !== cfg.unit) return reject('unit_locked');
        var newApd = Number(op.amountPerDose);
        if (toCents(newApd) === toCents(cfg.amountPerDose)) return reject('no_change');
        // A quantidade por toma só afeta tomas futuras e a estimativa de tomas restantes; os consumos já registados
        // mantêm o valor original (e as reversões usam esse valor). Exige confirmação explícita e fica registada.
        if (op.confirmAmountChange !== true) return reject('amount_change_needs_confirmation');
        cfg.changes = cfg.changes || [];
        cfg.changes.push({ field: 'amountPerDose', from: cfg.amountPerDose, to: newApd, at: op._now, operationId: op.operationId });
        cfg.amountPerDose = newApd;
        cfg.updatedAt = op._now;
        return { status: 'applied', movementIds: [] };
      }
      if (!isNonNegativeAmount(op.initialQuantity)) return reject('invalid_amount');
      st.stockConfig[medId] = { unit: op.unit, amountPerDose: Number(op.amountPerDose), configuredAt: op._now, operationId: op.operationId };
      var m = addMovement(st, op, { medicationId: medId, type: 'initial', delta: Number(op.initialQuantity), countedQuantity: Number(op.initialQuantity), reason: 'stock_inicial' });
      return { status: 'applied', movementIds: [m.id] };
    },
    stock_entry: function (st, op) { return stockDelta(st, op, 'entry', +1); },
    stock_exit: function (st, op) { return stockDelta(st, op, 'exit', -1); },
    stock_adjustment: function (st, op) {
      if (!isConfigured(st, op.medicationId)) return reject('stock_not_configured');
      if (!isNonNegativeAmount(op.newQuantity)) return reject('invalid_amount');
      var delta = toCents(op.newQuantity) - balanceCents(st, op.medicationId);
      if (delta === 0) return reject('no_change');
      var m = addMovement(st, op, { medicationId: op.medicationId, type: 'adjustment', delta: fromCents(delta), reason: 'ajuste_manual', note: op.note });
      return { status: 'applied', movementIds: [m.id] };
    },
    stock_count: function (st, op) {
      if (!isConfigured(st, op.medicationId)) return reject('stock_not_configured');
      if (!isNonNegativeAmount(op.countedQuantity)) return reject('invalid_amount');
      var delta = toCents(op.countedQuantity) - balanceCents(st, op.medicationId);
      var m = addMovement(st, op, { medicationId: op.medicationId, type: 'count', delta: fromCents(delta), countedQuantity: Number(op.countedQuantity), reason: 'contagem_fisica', note: op.note });
      return { status: 'applied', movementIds: [m.id] };
    },
    stock_confirm: function (st, op) {
      if (!isConfigured(st, op.medicationId)) return reject('stock_not_configured');
      var bal = fromCents(balanceCents(st, op.medicationId));
      var m = addMovement(st, op, { medicationId: op.medicationId, type: 'confirmation', delta: 0, countedQuantity: bal, reason: 'confirmacao' });
      return { status: 'applied', movementIds: [m.id] };
    },
    stock_revert: function (st, op) {
      var mv = findMovement(st, op.movementId);
      if (!mv) return reject('unknown_movement');
      if (!REVERTIBLE_TYPES[mv.type]) return reject('not_revertible');
      if (reversalOf(st, mv.id)) return reject('already_reverted');
      var covered = st.stockMovements.some(function (x) { return x.medicationId === mv.medicationId && REFERENCE_TYPES[x.type] && x.seq > mv.seq; });
      var delta = covered ? 0 : -toCents(mv.delta);
      if (balanceCents(st, mv.medicationId) + delta < 0) return reject('would_be_negative');
      var r = addMovement(st, op, { medicationId: mv.medicationId, type: 'reversal', delta: fromCents(delta), reversesMovementId: mv.id, reason: covered ? 'sem_efeito_apos_contagem' : 'anulacao_movimento' });
      return { status: 'applied', movementIds: [r.id] };
    },
    record_dose: function (st, op) {
      var rem = findReminder(st, op.reminderId);
      if (!rem) return reject('unknown_reminder');
      var med = findMed(st, rem.medicationId);
      if (!med || med.removedAt) return reject('medication_removed');
      if (!rem.isActive) return reject('reminder_inactive');
      if (!isValidDateStr(op.date)) return reject('invalid_date');
      if ((rem.times || []).indexOf(op.time) === -1) return reject('unknown_time');
      if (op.status !== 'taken' && op.status !== 'not_taken') return reject('invalid_status');
      if (op.reason != null && NOT_TAKEN_REASONS.indexOf(op.reason) === -1) return reject('invalid_reason');
      if (daysBetween(op.date, op._today) > CORRECTION_WINDOW_DAYS || daysBetween(op._today, op.date) > 0) return reject('correction_window_closed');
      var slotKey = rem.id + '|' + op.date + '|' + op.time;
      if (activeRecordForSlot(st, slotKey)) return reject('already_recorded');
      var cls = classifySlot(op.date, op.time);
      var rec = {
        id: 'dose_' + String(op.operationId).replace(/[^a-zA-Z0-9]/g, '').slice(-12),
        slotKey: slotKey, medicationId: med.id, reminderId: rem.id, scheduledDate: op.date, scheduledTime: op.time,
        scheduleNote: cls.kind === 'inexistente' ? 'dst_gap' : null, timeZone: op._timeZone || null,
        status: op.status, notTakenReason: op.status === 'not_taken' ? (op.reason || null) : null,
        recordedAt: op._now, takenAt: null,
        medicationSnapshot: { name: med.name || '', dosage: med.dosage || '' },
        dose: null, stock: { status: 'not_deducted', reason: op.status === 'not_taken' ? 'not_taken' : null, openConsumptionId: null },
        stockAnchorSeq: st.nextSeq,
        revisions: [{ operationId: op.operationId, at: op._now, from: null, to: op.status, reason: op.reason || null }],
        source: 'user', voidedAt: null, legacy: null,
      };
      if (findRecord(st, rec.id)) rec.id += '_' + st.doseRecords.length;
      st.doseRecords.push(rec);
      var mids = op.status === 'taken' ? tryConsume(st, op, rec) : [];
      st.snoozes = st.snoozes.filter(function (s) { return s.slotKey !== slotKey; });
      return { status: 'applied', doseRecordId: rec.id, movementIds: mids, stock: rec.stock };
    },
    change_status: function (st, op) {
      var rec = findRecord(st, op.doseRecordId);
      if (!rec) return reject('unknown_record');
      if (rec.status === 'legacy_unverified') return reject('legacy_read_only');
      if (rec.voidedAt) return reject('record_voided');
      if (daysBetween(rec.scheduledDate, op._today) > CORRECTION_WINDOW_DAYS) return reject('correction_window_closed');
      if (op.expectedRevision != null && op.expectedRevision !== rec.revisions.length) return reject('stale_record');
      if (op.to !== 'taken' && op.to !== 'not_taken') return reject('invalid_status');
      if (op.to === rec.status) return reject('no_change');
      if (op.reason != null && NOT_TAKEN_REASONS.indexOf(op.reason) === -1) return reject('invalid_reason');
      var from = rec.status, mids;
      if (op.to === 'not_taken') { mids = reverseConsumption(st, op, rec); rec.notTakenReason = op.reason || null; if (!rec.stock || rec.stock.status !== 'deducted') rec.stock.reason = rec.stock.reason || 'not_taken'; }
      else { rec.notTakenReason = null; mids = tryConsume(st, op, rec); }
      rec.status = op.to;
      rec.revisions.push({ operationId: op.operationId, at: op._now, from: from, to: op.to, reason: op.reason || null });
      return { status: 'applied', doseRecordId: rec.id, movementIds: mids, stock: rec.stock };
    },
    void_record: function (st, op) {
      var rec = findRecord(st, op.doseRecordId);
      if (!rec) return reject('unknown_record');
      if (rec.status === 'legacy_unverified') return reject('legacy_read_only');
      if (rec.voidedAt) return reject('record_voided');
      if (daysBetween(rec.scheduledDate, op._today) > CORRECTION_WINDOW_DAYS) return reject('correction_window_closed');
      if (op.expectedRevision != null && op.expectedRevision !== rec.revisions.length) return reject('stale_record');
      var mids = reverseConsumption(st, op, rec);
      rec.voidedAt = op._now;
      rec.revisions.push({ operationId: op.operationId, at: op._now, from: rec.status, to: 'voided', reason: null });
      return { status: 'applied', doseRecordId: rec.id, movementIds: mids };
    },
    snooze: function (st, op) {
      var minutes = Number(op.minutes);
      if ([15, 30, 60].indexOf(minutes) === -1) return reject('invalid_snooze');
      var sk = String(op.slotKey || '').split('|');
      if (sk.length !== 3 || !findReminder(st, sk[0])) return reject('unknown_reminder');
      if (!isValidDateStr(sk[1])) return reject('invalid_date');
      if (!isValidTimeStr(sk[2])) return reject('unknown_time');
      if (activeRecordForSlot(st, op.slotKey)) return reject('already_recorded');
      st.snoozes = st.snoozes.filter(function (s) { return s.slotKey !== op.slotKey; });
      st.snoozes.push({ slotKey: op.slotKey, until: new Date(Date.parse(op._now) + minutes * 60000).toISOString(), operationId: op.operationId });
      return { status: 'applied' };
    },
    v1_change_detected: function (st, op) {
      st.v1Sync = st.v1Sync || {};
      st.v1Sync.fingerprints = op.fingerprints;
      st.v1Sync.lastCheckedAt = op._now;
      st.v1Sync.externalChanges = (st.v1Sync.externalChanges || []).concat([{ at: op._now, keys: op.keys, summary: op.summary || '' }]).slice(-20);
      (op.legacyRecords || []).forEach(function (r) { if (!findRecord(st, r.id)) st.doseRecords.push(r); });
      if (op.historyLength != null) st.v1Sync.historyLength = op.historyLength;
      return { status: 'applied' };
    },
  };

  function stockDelta(st, op, type, sign) {
    if (!isConfigured(st, op.medicationId)) return reject('stock_not_configured');
    if (!isPositiveAmount(op.quantity)) return reject('invalid_amount');
    var delta = sign * toCents(op.quantity);
    if (balanceCents(st, op.medicationId) + delta < 0) return reject('would_be_negative');
    var m = addMovement(st, op, { medicationId: op.medicationId, type: type, delta: fromCents(delta), reason: op.reason || (type === 'entry' ? 'nova_embalagem' : 'saida'), note: op.note });
    return { status: 'applied', movementIds: [m.id] };
  }

  // Rejeições por regra funcional que ficam gravadas em operations[] (dentro do bloqueio, estado válido).
  var PERSISTED_REJECTIONS = { already_recorded: true, stale_record: true, correction_window_closed: true, legacy_read_only: true, record_voided: true, would_be_negative: true };

  /**
   * Aplica uma operação. Nunca altera o estado recebido.
   * Devolve { state, result, changed }. changed=false significa que nada deve ser gravado.
   */
  function applyOperation(state, op, ctx) {
    ctx = ctx || {};
    if (!op || !op.operationId || !op.type) return { state: state, result: reject('invalid_operation'), changed: false };
    for (var i = 0; i < state.operations.length; i++) {
      if (state.operations[i].operationId === op.operationId) {
        return { state: state, result: { status: 'duplicate_ignored', previous: state.operations[i].result, reason: state.operations[i].rejectReason }, changed: false };
      }
    }
    var handler = HANDLERS[op.type];
    if (!handler) return { state: state, result: reject('unknown_operation'), changed: false };
    var st = clone(state);
    var o = clone(op);
    o._now = ctx.now || new Date().toISOString();
    o._today = ctx.today || localDateStr(new Date(o._now));
    o._timeZone = ctx.timeZone || null;
    var result = handler(st, o);
    var entry = { operationId: op.operationId, type: op.type, at: o._now, medicationId: op.medicationId || (op.medication && op.medication.id) || null,
      doseRecordId: result.doseRecordId || op.doseRecordId || null, result: result.status, rejectReason: result.status === 'rejected' ? result.reason : null,
      movementIds: result.movementIds || [] };
    if (result.status === 'rejected') {
      if (!PERSISTED_REJECTIONS[result.reason]) return { state: state, result: result, changed: false };
      st = clone(state); // a rejeição não altera registos nem movimentos
    }
    st.operations.push(entry);
    st.writeVersion = (st.writeVersion || 0) + 1;
    var errors = validateState(st);
    if (errors.length) return { state: state, result: { status: 'invariant_violation', errors: errors }, changed: false };
    return { state: st, result: result, changed: true };
  }

  // ---------- invariantes ----------
  function validateState(st) {
    var errors = [];
    function uniq(list, label) {
      var seen = {}; list.forEach(function (x) { if (seen[x]) errors.push(label + ' duplicado: ' + x); seen[x] = true; });
    }
    if (!st || st.schemaVersion !== SCHEMA_VERSION) { errors.push('schemaVersion inválida'); return errors; }
    ['medications', 'reminders', 'doseRecords', 'operations', 'stockMovements', 'snoozes'].forEach(function (k) { if (!Array.isArray(st[k])) errors.push(k + ' não é uma lista'); });
    if (errors.length) return errors;
    if (!(st.nextSeq >= 1)) errors.push('nextSeq inválido');
    uniq(st.medications.map(function (m) { return m.id; }), 'medicamento');
    uniq(st.reminders.map(function (r) { return r.id; }), 'lembrete');
    uniq(st.doseRecords.map(function (r) { return r.id; }), 'registo');
    uniq(st.operations.map(function (o) { return o.operationId; }), 'operação');
    uniq(st.stockMovements.map(function (m) { return m.id; }), 'movimento');
    uniq(st.stockMovements.map(function (m) { return String(m.seq); }), 'seq');
    st.stockMovements.forEach(function (m) {
      if (!(m.seq >= 1 && m.seq < st.nextSeq)) errors.push('seq fora do intervalo: ' + m.id);
      if (m.type === 'reversal') {
        var orig = findMovement(st, m.reversesMovementId);
        if (!orig) errors.push('reversão sem movimento original: ' + m.id);
      }
    });
    var revCount = {};
    st.stockMovements.forEach(function (m) { if (m.type === 'reversal') revCount[m.reversesMovementId] = (revCount[m.reversesMovementId] || 0) + 1; });
    Object.keys(revCount).forEach(function (k) { if (revCount[k] > 1) errors.push('movimento revertido mais do que uma vez: ' + k); });
    var activeSlots = {};
    st.doseRecords.forEach(function (r) {
      if (r.status === 'legacy_unverified') return;
      if (!r.voidedAt) { if (activeSlots[r.slotKey]) errors.push('slotKey duplicado: ' + r.slotKey); activeSlots[r.slotKey] = true; }
      var open = st.stockMovements.filter(function (m) { return m.type === 'consumption' && m.doseRecordId === r.id && !revCount[m.id]; });
      if (open.length > 1) errors.push('mais de um consumo aberto: ' + r.id);
      var deducted = r.stock && r.stock.status === 'deducted';
      if (deducted !== (open.length === 1)) errors.push('estado do stock incoerente: ' + r.id);
      if (r.stockAnchorSeq != null && r.stockAnchorSeq > st.nextSeq) errors.push('stockAnchorSeq inválido: ' + r.id);
    });
    // saldo nunca negativo em nenhum ponto
    Object.keys(st.stockConfig || {}).forEach(function (medId) {
      var bal = 0;
      movementsFor(st, medId).forEach(function (m) {
        bal = REFERENCE_TYPES[m.type] ? toCents(m.countedQuantity) : bal + toCents(m.delta);
        if (bal < 0) errors.push('saldo negativo: ' + medId + ' em ' + m.id);
      });
    });
    return errors;
  }

  // ---------- horários do dia ----------
  function slotsForDay(st, dateStr, nowMs) {
    var out = [];
    st.reminders.forEach(function (rem) {
      if (!rem.isActive) return;
      if (rem.startDate && dateStr < rem.startDate) return;
      if (rem.endDate && dateStr > rem.endDate) return;
      var med = findMed(st, rem.medicationId);
      if (!med || med.removedAt || med.isActive === false) return;
      (rem.times || []).forEach(function (t) {
        var slotKey = rem.id + '|' + dateStr + '|' + t;
        var cls = classifySlot(dateStr, t);
        var rec = activeRecordForSlot(st, slotKey);
        var snooze = null;
        st.snoozes.forEach(function (s) { if (s.slotKey === slotKey && Date.parse(s.until) > nowMs) snooze = s; });
        var status;
        if (rec) status = rec.status;
        else if (cls.kind === 'inexistente') status = 'inexistente';
        else if (snooze) status = 'adiada';
        else status = nowMs >= cls.instant ? 'por_registar' : 'pendente';
        out.push({ slotKey: slotKey, reminderId: rem.id, medicationId: med.id, medicationName: med.name || '', dosage: med.dosage || '',
          date: dateStr, time: t, kind: cls.kind, instant: cls.instant, status: status, record: rec, snoozedUntil: snooze ? snooze.until : null });
      });
    });
    out.sort(function (a, b) { return a.time < b.time ? -1 : a.time > b.time ? 1 : 0; });
    return out;
  }

  function historyEntries(st, opts) {
    opts = opts || {};
    return st.doseRecords.filter(function (r) {
      if (r.voidedAt) return false;
      if (opts.medicationId && r.medicationId !== opts.medicationId) return false;
      return true;
    }).sort(function (a, b) {
      var ka = a.recordedAt || a.legacyLocalDateTime || '', kb = b.recordedAt || b.legacyLocalDateTime || '';
      return ka < kb ? 1 : ka > kb ? -1 : 0;
    });
  }

  // ---------- migração v1 → v2 ----------
  function fnv1a32(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  }
  function parseLegacyDate(text) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4}),? (\d{2}):(\d{2}):(\d{2})$/.exec(String(text || '').trim());
    if (!m) return null;
    return m[3] + '-' + m[2] + '-' + m[1] + 'T' + m[4] + ':' + m[5] + ':' + m[6];
  }
  /** Converte o histórico v1 (mais recente primeiro) em registos não confirmados. IDs estáveis: posição a contar da mais antiga. */
  function legacyRecordsFromHistory(history, startPosition) {
    var list = Array.isArray(history) ? history.slice().reverse() : []; // mais antiga primeiro
    var out = [];
    for (var i = (startPosition || 0); i < list.length; i++) {
      var h = list[i] || {};
      var key = [h.medicationName, h.dosage, h.dateTime, h.notes].map(function (x) { return x == null ? '' : String(x); }).join('|');
      out.push({
        id: 'legacy_' + (i + 1) + '_' + fnv1a32(key), slotKey: null, medicationId: null, reminderId: null, scheduledDate: null, scheduledTime: null,
        scheduleNote: null, timeZone: null, status: 'legacy_unverified', notTakenReason: null, recordedAt: null,
        legacyLocalDateTime: parseLegacyDate(h.dateTime), takenAt: null,
        medicationSnapshot: { name: h.medicationName == null ? '' : String(h.medicationName), dosage: h.dosage == null ? '' : String(h.dosage) },
        dose: null, stock: { status: 'not_deducted', reason: 'legacy', openConsumptionId: null }, stockAnchorSeq: null, revisions: [],
        source: 'migracao_v1', voidedAt: null, legacy: clone(h),
      });
    }
    return out;
  }

  /**
   * Constrói o estado v2 a partir do texto bruto das chaves v1. Não escreve nada.
   * raw: { medications, reminders, history } (texto do localStorage ou null)
   * opts.validateImage(uri) -> { ok, reason }
   */
  function buildV2FromV1(raw, opts) {
    opts = opts || {};
    var report = { errors: [], warnings: [], counts: { medications: 0, reminders: 0, legacy: 0, images: 0, imagesRejected: 0, orphanReminders: 0 } };
    function parse(name, text) {
      if (text == null || text === '') return [];
      try { var v = JSON.parse(text); if (!Array.isArray(v)) { report.errors.push(name + ': o conteúdo não é uma lista.'); return null; } return v; }
      catch (e) { report.errors.push(name + ': dados corrompidos (JSON inválido).'); return null; }
    }
    var meds = parse('Medicamentos', raw.medications), rems = parse('Lembretes', raw.reminders), hist = parse('Histórico', raw.history);
    if (report.errors.length) return { state: null, images: {}, report: report };
    var st = emptyState(opts.appVersion);
    var images = {}, seenMed = {}, seenRem = {};
    meds.forEach(function (m, idx) {
      if (!m || typeof m !== 'object' || !m.id || typeof m.id !== 'string') { report.errors.push('Medicamento na posição ' + (idx + 1) + ' sem identificador válido.'); return; }
      if (seenMed[m.id]) { report.errors.push('Identificador de medicamento repetido: ' + m.id + '.'); return; }
      seenMed[m.id] = true;
      var c = clone(m);
      var q = Number(m.quantity);
      c.legacyQuantity = isFinite(q) && m.quantity !== '' && m.quantity != null ? q : null;
      delete c.quantity; delete c.imageUri; delete c.reminderTimes;
      c.imageId = null;
      if (m.imageUri) {
        var check = opts.validateImage ? opts.validateImage(m.imageUri) : { ok: false, reason: 'sem validador' };
        if (check.ok) { var imgId = 'img_' + m.id; images[imgId] = m.imageUri; c.imageId = imgId; report.counts.images++; }
        else { report.counts.imagesRejected++; report.warnings.push('Fotografia de "' + (m.name || m.id) + '" não copiada: ' + check.reason + '.'); }
      }
      c.removedAt = null; c.source = 'migracao_v1'; c.createdAt = opts.now || null; c.updatedAt = null;
      st.medications.push(c); report.counts.medications++;
    });
    rems.forEach(function (r, idx) {
      if (!r || typeof r !== 'object' || !r.id || typeof r.id !== 'string') { report.errors.push('Lembrete na posição ' + (idx + 1) + ' sem identificador válido.'); return; }
      if (seenRem[r.id]) { report.errors.push('Identificador de lembrete repetido: ' + r.id + '.'); return; }
      seenRem[r.id] = true;
      var times = (Array.isArray(r.times) && r.times.length ? r.times : (r.time ? [r.time] : [])).filter(function (t) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(t); });
      var c = { id: r.id, medicationId: r.medicationId || null, times: times, startDate: r.startDate || null, endDate: r.endDate || null,
        isActive: !!r.isActive, source: 'migracao_v1', createdAt: opts.now || null, updatedAt: null, legacyLastTakenDate: r.lastTakenDate || null };
      if (!seenMed[r.medicationId]) {
        c.isActive = false; c.orphan = true; report.counts.orphanReminders++;
        report.warnings.push('Lembrete ' + r.id + ' aponta para um medicamento que não existe; fica desativado.');
      }
      st.reminders.push(c); report.counts.reminders++;
    });
    if (report.errors.length) return { state: null, images: {}, report: report };
    var legacy = legacyRecordsFromHistory(hist, 0);
    st.doseRecords = legacy; report.counts.legacy = legacy.length;
    st.migration = { completedAt: null, migrationId: opts.migrationId || null, importedLegacy: legacy.length, copiedMedications: st.medications.length, copiedReminders: st.reminders.length };
    st.v1Sync = { historyLength: hist.length, fingerprints: opts.fingerprints || null, externalChanges: [] };
    var errs = validateState(st);
    if (errs.length) report.errors = report.errors.concat(errs);
    return { state: report.errors.length ? null : st, images: images, report: report };
  }

  var api = {
    SCHEMA_VERSION: SCHEMA_VERSION, CORRECTION_WINDOW_DAYS: CORRECTION_WINDOW_DAYS, LOW_STOCK_DOSES: LOW_STOCK_DOSES,
    NOT_TAKEN_REASONS: NOT_TAKEN_REASONS, UNITS: UNITS,
    emptyState: emptyState, applyOperation: applyOperation, validateState: validateState,
    classifySlot: classifySlot, slotsForDay: slotsForDay, historyEntries: historyEntries,
    stockBalance: stockBalance, isConfigured: isConfigured, openIssues: openIssues, dosesRemaining: dosesRemaining, isLowStock: isLowStock,
    isCovered: isCovered, openConsumption: openConsumption, movementsFor: movementsFor, reversalOf: reversalOf,
    findMed: findMed, findReminder: findReminder, findRecord: findRecord,
    buildV2FromV1: buildV2FromV1, legacyRecordsFromHistory: legacyRecordsFromHistory, parseLegacyDate: parseLegacyDate, fnv1a32: fnv1a32,
    localDateStr: localDateStr, daysBetween: daysBetween, toCents: toCents, isValidDateStr: isValidDateStr, isValidTimeStr: isValidTimeStr,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.DailyMedV2 = api;
})(typeof window !== 'undefined' ? window : globalThis);
