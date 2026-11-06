/**
 * DailyMed — armazenamento, compatibilidade entre separadores e migração v1 → v2.
 *
 * Regras principais:
 * - Todas as gravações da app passam por DMStore.writeRaw / DMStore.applyV2 / DMStore.setImage.
 * - Com Web Locks, só um separador ("separador de escrita") pode gravar. Os outros ficam só de leitura
 *   e passam a escrever automaticamente quando o separador de escrita fecha.
 * - Sem Web Locks: em modo v1 a app funciona como antes; em modo v2 todos os separadores ficam só de leitura.
 * - Um separador carregado com um estado de versão diferente do atual (por exemplo, v1 enquanto outro migrou)
 *   não grava nada e pede para recarregar. Um estado "migrating" nunca é tratado como migração concluída.
 * - Em modo v2 a app nunca escreve nas chaves de medicação v1 (isolamento).
 * - A migração só começa por ação explícita do utente.
 */
(function (global) {
  'use strict';

  var APP_VERSION = '2.0.0';
  var KEYS = {
    schema: 'dailymed_schema',
    v2: 'dailymed_v2',
    images: 'dailymed_v2_images',
    alerts: 'dailymed_v2_alerts',
    diagnostics: 'dailymed_v2_diagnostics',
    probe: 'dailymed_space_probe',
  };
  var BACKUP_PREFIX = 'dailymed_backup_v1_';
  var V1_MED_KEYS = ['dailymed_medications', 'dailymed_reminders', 'dailymed_medication_history', 'dailymed_medication_alerts'];
  var V1_KEY_LABEL = {
    dailymed_medications: 'medicamentos', dailymed_reminders: 'lembretes',
    dailymed_medication_history: 'histórico de tomas', dailymed_medication_alerts: 'alertas',
  };

  var V2 = global.DailyMedV2;
  var Img = global.DailyMedImages;
  var hasLocks = !!(global.navigator && global.navigator.locks && typeof global.navigator.locks.request === 'function');
  var channel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('dailymed-tabs') : null;
  var tabId = 'tab_' + Math.random().toString(36).slice(2, 10);

  var S = {
    loadedStatus: 'v1', isWriter: false, migrator: false, releaseWriter: null,
    v2cache: null, listeners: [], notices: {}, writerWaiting: false,
  };

  function emit(kind, detail) { S.listeners.forEach(function (fn) { try { fn(kind, detail); } catch (e) { if (global.console) console.error(e); } }); }
  function onChange(fn) { S.listeners.push(fn); }

  // ---------- estado da versão ----------
  function readSchema() {
    try { var raw = localStorage.getItem(KEYS.schema); if (!raw) return { status: 'v1' }; var s = JSON.parse(raw); return s && s.status ? s : { status: 'v1' }; }
    catch (e) { return { status: 'v1', unreadable: true }; }
  }
  function writeSchemaDirect(obj) {
    var txt = JSON.stringify(obj);
    testFail('schema:' + obj.status);
    localStorage.setItem(KEYS.schema, txt);
    if (localStorage.getItem(KEYS.schema) !== txt) throw stepError('schema', 'O marcador de versão não ficou gravado.');
  }
  function mode() { return S.loadedStatus === 'v2' ? 'v2' : 'v1'; }

  // Ganchos de teste (só usados pelos testes no browser para simular falhas).
  function testFail(point) {
    var f = global.__DM_TEST_FAIL;
    if (f && f[point]) { if (f[point] === 'quota') { var e = new Error('Simulado: sem espaço'); e.name = 'QuotaExceededError'; throw e; } throw new Error('Simulado: falha em ' + point); }
  }
  function stepError(step, message, cause) { var e = new Error(message); e.step = step; e.cause = cause; return e; }

  // ---------- permissões de escrita ----------
  function writeBlockReason() {
    var cur = readSchema().status;
    if (cur !== S.loadedStatus) return 'outdated';
    if (cur === 'migrating') return S.migrator ? null : 'migrating';
    if (hasLocks) return S.isWriter ? null : 'other_tab';
    return cur === 'v2' ? 'no_locks' : null; // sem Web Locks: v1 funciona como antes; v2 só leitura
  }
  function canWrite() { return writeBlockReason() === null; }

  function blocked(reason) {
    emit('blocked', reason);
    return false;
  }

  /** Gravação guardada de uma chave "simples" (definições, reciclagem, lista de viagem, alertas, etc.). */
  function writeRaw(key, value) {
    if (mode() === 'v2' && V1_MED_KEYS.indexOf(key) !== -1) {
      // Isolamento: em modo v2 as chaves de medicação v1 nunca são escritas.
      if (global.console) console.warn('DailyMed: gravação ignorada numa chave v1 congelada:', key);
      return false;
    }
    var r = writeBlockReason();
    if (r) return blocked(r);
    try { localStorage.setItem(key, value); return true; }
    catch (e) { emit('storage_error', e.name || 'erro'); return false; }
  }

  // ---------- separador de escrita (Web Locks) ----------
  function electWriter() {
    if (!hasLocks || S.isWriter || S.writerWaiting) return;
    S.writerWaiting = true;
    navigator.locks.request('dailymed-writer', { mode: 'exclusive' }, function () {
      S.writerWaiting = false;
      return new Promise(function (resolve) {
        S.isWriter = true;
        S.releaseWriter = function () { S.isWriter = false; S.releaseWriter = null; resolve(); };
        emit('writer', true);
        onBecameWriter();
      });
    }).catch(function () { S.writerWaiting = false; });
  }
  function requestHandover() { if (channel) channel.postMessage({ type: 'handover', from: tabId }); }
  if (channel) {
    channel.onmessage = function (ev) {
      var msg = ev.data || {};
      if (msg.type === 'handover' && msg.from !== tabId && S.isWriter && !S.migrator && S.releaseWriter) {
        S.releaseWriter();
        emit('writer', false);
        setTimeout(electWriter, 100); // volta à fila
      }
      if (msg.type === 'schema-changed') checkSchemaChange();
    };
  }

  function checkSchemaChange() {
    var cur = readSchema().status;
    if (cur !== S.loadedStatus) { S.notices.outdated = true; emit('outdated', cur); }
  }

  // ---------- estado v2 ----------
  function getV2() {
    if (mode() !== 'v2') return null;
    if (S.v2cache) return S.v2cache;
    try { S.v2cache = JSON.parse(localStorage.getItem(KEYS.v2) || 'null'); } catch (e) { S.v2cache = null; }
    return S.v2cache;
  }
  function localToday() { return V2.localDateStr(new Date()); }
  function timeZone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || null; } catch (e) { return null; } }
  function newOperationId() {
    if (global.crypto && crypto.randomUUID) return 'op_' + crypto.randomUUID();
    return 'op_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  function diagnostics(entry) {
    try {
      var list = JSON.parse(localStorage.getItem(KEYS.diagnostics) || '[]');
      list.push(entry); while (list.length > 50) list.shift();
      localStorage.setItem(KEYS.diagnostics, JSON.stringify(list));
    } catch (e) { /* diagnóstico em melhor esforço */ }
  }

  /** Aplica uma operação v2 e grava-a numa só chamada a setItem. Síncrono: só o separador de escrita chega aqui. */
  function applyV2(op) {
    if (mode() !== 'v2') return { status: 'blocked', reason: 'not_v2' };
    var r = writeBlockReason();
    if (r) { blocked(r); return { status: 'read_only_tab', reason: r }; }
    var st;
    try { st = JSON.parse(localStorage.getItem(KEYS.v2)); } catch (e) { return { status: 'storage_error', reason: 'unreadable' }; }
    if (!st) return { status: 'storage_error', reason: 'missing_state' };
    var out = V2.applyOperation(st, op, { now: new Date().toISOString(), today: localToday(), timeZone: timeZone() });
    if (out.result.status === 'invariant_violation') {
      diagnostics({ at: new Date().toISOString(), type: op.type, operationId: op.operationId, errors: out.result.errors });
      return out.result;
    }
    if (!out.changed) return out.result;
    try { testFail('v2write'); localStorage.setItem(KEYS.v2, JSON.stringify(out.state)); }
    catch (e) { emit('storage_error', e.name || 'erro'); return { status: 'storage_error', reason: e.name || 'erro' }; }
    S.v2cache = out.state;
    emit('data', op.type);
    return out.result;
  }

  // ---------- fotografias (duas chaves: nunca se apresenta como atómico) ----------
  function readImages() { try { return JSON.parse(localStorage.getItem(KEYS.images) || '{}') || {}; } catch (e) { return {}; } }
  function getImage(imageId) {
    if (!imageId) return null;
    var uri = readImages()[imageId];
    return Img && Img.safeImageSrc(uri) ? uri : null;
  }
  /** Passo 1 de uma troca de fotografia: grava a nova com um id novo, sem tocar na anterior. */
  function putImage(dataUrl) {
    if (!Img || !Img.validateImageDataUrl(dataUrl).ok) return null;
    var r = writeBlockReason(); if (r) { blocked(r); return null; }
    var map = readImages();
    var id = 'img_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    map[id] = dataUrl;
    try { testFail('imagewrite'); localStorage.setItem(KEYS.images, JSON.stringify(map)); } catch (e) { emit('storage_error', e.name || 'erro'); return null; }
    return id;
  }
  /** Remove fotografias sem referência (passo final de uma troca, ou restos de uma troca interrompida). */
  function cleanupOrphanImages() {
    var st = getV2(); if (!st || !canWrite()) return 0;
    var used = {}; st.medications.forEach(function (m) { if (m.imageId) used[m.imageId] = true; });
    var map = readImages(), removed = 0;
    Object.keys(map).forEach(function (k) { if (!used[k]) { delete map[k]; removed++; } });
    if (removed) { try { localStorage.setItem(KEYS.images, JSON.stringify(map)); } catch (e) { return 0; } }
    return removed;
  }

  // ---------- impressões digitais (SHA-256) ----------
  function sha256Hex(text) {
    if (!(global.crypto && crypto.subtle)) return Promise.resolve(null);
    var data = new TextEncoder().encode(text);
    return crypto.subtle.digest('SHA-256', data).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }
  function readV1Raw() {
    var raw = {}; V1_MED_KEYS.forEach(function (k) { raw[k] = localStorage.getItem(k); }); return raw;
  }
  function fingerprints(raw) {
    var keys = Object.keys(raw);
    return Promise.all(keys.map(function (k) { return raw[k] == null ? Promise.resolve('absent') : sha256Hex(raw[k]); })).then(function (hs) {
      var out = {}; keys.forEach(function (k, i) { out[k] = hs[i]; }); return out;
    });
  }

  /** Em modo v2: deteta alterações feitas às chaves v1 por um separador antigo. Nunca as aplica. */
  function checkExternalV1() {
    var st = getV2(); if (!st || !st.v1Sync || !st.v1Sync.fingerprints) return Promise.resolve(null);
    var raw = readV1Raw();
    return fingerprints(raw).then(function (fp) {
      var changed = V1_MED_KEYS.filter(function (k) { return fp[k] !== st.v1Sync.fingerprints[k]; });
      if (!changed.length) return null;
      var labels = changed.map(function (k) { return V1_KEY_LABEL[k]; });
      S.notices.external = 'Foram feitas alterações numa versão antiga da DailyMed noutro separador (' + labels.join(', ') +
        '). Não foram aplicadas aqui. Fecha os separadores antigos e repete as alterações nesta versão.';
      var legacy = [];
      var histLen = st.v1Sync.historyLength || 0;
      if (changed.indexOf('dailymed_medication_history') !== -1) {
        try { var hist = JSON.parse(raw.dailymed_medication_history || '[]'); if (Array.isArray(hist)) { legacy = V2.legacyRecordsFromHistory(hist, histLen); histLen = hist.length; } } catch (e) { /* ignora */ }
      }
      emit('external', changed);
      if (canWrite()) applyV2({ operationId: newOperationId(), type: 'v1_change_detected', fingerprints: fp, keys: changed, summary: labels.join(', '), legacyRecords: legacy, historyLength: histLen });
      return changed;
    });
  }

  // ---------- migração ----------
  function allDailymedKeys() {
    var out = [];
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf('dailymed_') === 0) out.push(k); }
    return out.sort();
  }
  function backupKeys() { return allDailymedKeys().filter(function (k) { return k.indexOf(BACKUP_PREFIX) === 0; }); }

  function validateImage(uri) { return Img ? Img.validateImageDataUrl(uri) : { ok: false, reason: 'validador indisponível' }; }

  /** Verificação antes de migrar. Não escreve nada. */
  function preflight() {
    var raw = readV1Raw();
    var built = V2.buildV2FromV1({ medications: raw.dailymed_medications, reminders: raw.dailymed_reminders, history: raw.dailymed_medication_history },
      { validateImage: validateImage, appVersion: APP_VERSION });
    var v2Size = built.state ? JSON.stringify(built.state).length : 0;
    var imgSize = JSON.stringify(built.images || {}).length;
    var v1Size = 0; allDailymedKeys().forEach(function (k) { v1Size += (localStorage.getItem(k) || '').length; });
    return {
      ok: !!built.state, report: built.report, sizes: { v2: v2Size, images: imgSize, backup: v1Size },
      locks: hasLocks, writer: S.isWriter, status: readSchema().status, loadedStatus: S.loadedStatus,
    };
  }

  function makeBackupObject(migrationId, fp) {
    var keys = {};
    allDailymedKeys().forEach(function (k) {
      if (k.indexOf(BACKUP_PREFIX) === 0 || k === KEYS.schema || k === KEYS.v2 || k === KEYS.images || k === KEYS.probe || k.indexOf('dailymed_geo_') === 0) return;
      keys[k] = localStorage.getItem(k);
    });
    return { format: 'dailymed-backup-v1', createdAt: new Date().toISOString(), migrationId: migrationId, fingerprints: fp, keys: keys };
  }

  function spaceProbe(chars) {
    // Verificação real: grava e apaga um bloco do tamanho necessário, sem confiar só em navigator.storage.estimate().
    var block = new Array(Math.max(1, chars) + 1).join('x');
    try { testFail('probe'); localStorage.setItem(KEYS.probe, block); }
    catch (e) { try { localStorage.removeItem(KEYS.probe); } catch (e2) { /* nada */ } throw stepError('space', 'Não há espaço suficiente no browser para a atualização.', e); }
    localStorage.removeItem(KEYS.probe);
  }

  /**
   * Migração explícita. Só no separador de escrita, com o estado em v1.
   * onStep(texto) recebe o progresso. Devolve Promise<{ ok, report }> ou rejeita com Error(step, message).
   */
  function migrate(onStep) {
    onStep = onStep || function () {};
    if (!hasLocks) return Promise.reject(stepError('locks', 'Este browser não permite fazer a atualização com segurança.'));
    if (!S.isWriter) return Promise.reject(stepError('writer', 'A DailyMed está aberta noutro separador. Usa só um separador para atualizar.'));
    if (S.loadedStatus !== 'v1' || readSchema().status !== 'v1') return Promise.reject(stepError('status', 'Os dados não estão na versão 1.'));
    return navigator.locks.request('dailymed-migration', { mode: 'exclusive', ifAvailable: true }, function (lock) {
      if (!lock) throw stepError('busy', 'Já está a decorrer uma atualização.');
      return runMigration(onStep);
    });
  }

  function runMigration(onStep) {
    var migrationId = 'mig_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    var raw1, fp1, built, wroteV2 = false, wroteImages = false, backupKey = null, step = 'inicio';
    function at(s, text) { step = s; onStep(text); }
    return Promise.resolve().then(function () {
      at('fingerprints', 'A ler os dados atuais…');
      raw1 = readV1Raw();
      return fingerprints(raw1);
    }).then(function (fp) {
      fp1 = fp;
      at('validate', 'A validar os dados…');
      built = V2.buildV2FromV1({ medications: raw1.dailymed_medications, reminders: raw1.dailymed_reminders, history: raw1.dailymed_medication_history },
        { validateImage: validateImage, appVersion: APP_VERSION, migrationId: migrationId, fingerprints: fp1, now: new Date().toISOString() });
      if (!built.state) throw stepError('validate', 'Os dados atuais têm problemas e não podem ser atualizados: ' + built.report.errors.join(' '));
      at('schema-pending', 'A marcar a atualização como pendente…');
      writeSchemaDirect({ status: 'migrating', migrationId: migrationId, startedAt: new Date().toISOString(), tabId: tabId });
      S.loadedStatus = 'migrating'; S.migrator = true;
      if (channel) channel.postMessage({ type: 'schema-changed' });
      at('backup', 'A criar a cópia de segurança…');
      var backup = makeBackupObject(migrationId, fp1);
      var txt = JSON.stringify(backup);
      backupKey = BACKUP_PREFIX + migrationId;
      testFail('backup');
      try { localStorage.setItem(backupKey, txt); } catch (e) { throw stepError('backup', 'Não há espaço para a cópia de segurança. Nada foi alterado.', e); }
      if (localStorage.getItem(backupKey) !== txt) throw stepError('backup', 'A cópia de segurança não ficou gravada corretamente.');
      at('space', 'A verificar o espaço disponível…');
      var v2txt = JSON.stringify(built.state), imgTxt = JSON.stringify(built.images);
      spaceProbe(v2txt.length + imgTxt.length);
      at('write', 'A gravar os dados da versão 2…');
      testFail('write-images');
      localStorage.setItem(KEYS.images, imgTxt); wroteImages = true;
      testFail('write-v2');
      localStorage.setItem(KEYS.v2, v2txt); wroteV2 = true;
      at('verify', 'A confirmar o resultado…');
      var back = JSON.parse(localStorage.getItem(KEYS.v2));
      var errs = V2.validateState(back);
      if (errs.length) throw stepError('verify', 'O resultado gravado não passou a verificação: ' + errs.join('; '));
      if (back.medications.length !== built.report.counts.medications || back.doseRecords.length !== built.report.counts.legacy) throw stepError('verify', 'As contagens do resultado não batem certo.');
      if (localStorage.getItem(KEYS.images) !== imgTxt) throw stepError('verify', 'As fotografias não ficaram gravadas corretamente.');
      return fingerprints(readV1Raw());
    }).then(function (fp2) {
      at('recheck', 'A confirmar que os dados antigos não mudaram…');
      var changed = V1_MED_KEYS.filter(function (k) { return fp2[k] !== fp1[k]; });
      if (changed.length) throw stepError('recheck', 'Os dados antigos foram alterados noutro separador durante a atualização. Fecha os outros separadores e tenta de novo.');
      testFail('pause-before-activate');
      if (global.__DM_TEST_PAUSE) return new Promise(function () {}); // testes: simula um separador fechado a meio
      at('activate', 'A ativar a versão 2…');
      writeSchemaDirect({ status: 'v2', migrationId: migrationId, startedAt: readSchema().startedAt || null, completedAt: new Date().toISOString(), backupKey: backupKey, fingerprints: fp1 });
      S.loadedStatus = 'v2'; S.migrator = false; S.v2cache = null;
      if (channel) channel.postMessage({ type: 'schema-changed' });
      emit('migrated', built.report);
      return { ok: true, report: built.report, backupKey: backupKey };
    }).catch(function (err) {
      // Reverter só o que esta migração criou. As chaves v1 nunca foram tocadas; a cópia de segurança fica.
      try { if (wroteV2 || localStorage.getItem(KEYS.v2)) { var cur = JSON.parse(localStorage.getItem(KEYS.v2) || 'null'); if (!cur || !cur.migration || cur.migration.migrationId === migrationId) localStorage.removeItem(KEYS.v2); } } catch (e) { /* nada */ }
      try { if (wroteImages) localStorage.removeItem(KEYS.images); } catch (e) { /* nada */ }
      var info = { at: new Date().toISOString(), step: err.step || step, message: err.message };
      var schemaNow = readSchema();
      if (schemaNow.status === 'migrating' && schemaNow.migrationId === migrationId) {
        try { writeSchemaDirect({ status: 'v1', lastError: info, backupKey: backupKey }); S.loadedStatus = 'v1'; }
        catch (e) { info.schemaRestoreFailed = true; /* fica "migrating": a recuperação no arranque seguinte trata disto */ }
      } else if (schemaNow.status === 'v1') { S.loadedStatus = 'v1'; }
      S.migrator = false;
      if (channel) channel.postMessage({ type: 'schema-changed' });
      var e2 = stepError(info.step, err.message, err); e2.info = info; throw e2;
    });
  }

  /** Recuperação de uma migração interrompida (estado "migrating" sem nenhum separador a migrar). Idempotente. */
  function recoverIfInterrupted() {
    var s = readSchema();
    if (s.status !== 'migrating' || !hasLocks || !S.isWriter) return Promise.resolve(false);
    return navigator.locks.query().then(function (q) {
      var busy = (q.held || []).some(function (l) { return l.name === 'dailymed-migration'; });
      if (busy) return false;
      var cur = readSchema(); if (cur.status !== 'migrating') return false;
      try { var v2 = JSON.parse(localStorage.getItem(KEYS.v2) || 'null'); if (v2) localStorage.removeItem(KEYS.v2); } catch (e) { localStorage.removeItem(KEYS.v2); }
      localStorage.removeItem(KEYS.images);
      localStorage.removeItem(KEYS.probe);
      writeSchemaDirect({ status: 'v1', recoveredAt: new Date().toISOString(), lastError: { step: 'interrompida', message: 'A atualização anterior foi interrompida.' }, backupKey: cur.migrationId ? BACKUP_PREFIX + cur.migrationId : null });
      S.loadedStatus = 'v1';
      S.notices.recovered = true;
      if (channel) channel.postMessage({ type: 'schema-changed' });
      emit('recovered');
      return true;
    });
  }

  function onBecameWriter() {
    recoverIfInterrupted().then(function () {
      if (mode() === 'v2') { cleanupOrphanImages(); return checkExternalV1(); }
    }).catch(function (e) { if (global.console) console.error(e); });
  }

  // ---------- exportação (cópia gerada + transferência iniciada; nunca se afirma que foi guardada) ----------
  function canonical(o) {
    if (o === null || typeof o !== 'object') return JSON.stringify(o);
    if (Array.isArray(o)) return '[' + o.map(canonical).join(',') + ']';
    return '{' + Object.keys(o).sort().map(function (k) { return JSON.stringify(k) + ':' + canonical(o[k]); }).join(',') + '}';
  }
  function buildExport() {
    var keys = {};
    allDailymedKeys().forEach(function (k) { if (k.indexOf('dailymed_geo_') === 0 || k === KEYS.probe || k === KEYS.diagnostics) return; keys[k] = localStorage.getItem(k); });
    var file = { format: 'dailymed-export', exportVersion: 1, exportId: 'exp_' + Date.now().toString(36), exportedAt: new Date().toISOString(),
      appVersion: APP_VERSION, schemaStatus: readSchema().status, keys: keys, checksumAlgorithm: 'SHA-256' };
    return sha256Hex(canonical(file)).then(function (h) {
      if (!h) { file.checksumAlgorithm = 'FNV-1a-32'; h = V2.fnv1a32(canonical(file)); }
      file.checksum = h; return file;
    });
  }
  function downloadExport() {
    return buildExport().then(function (file) {
      var blob = new Blob([JSON.stringify(file, null, 1)], { type: 'application/json' });
      var a = document.createElement('a');
      var stamp = file.exportedAt.slice(0, 16).replace(/[:T]/g, '-');
      a.href = URL.createObjectURL(blob);
      a.download = 'dailymed-copia-' + stamp + '-' + file.checksum.slice(0, 8) + '.json';
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      return { exportId: file.exportId, exportedAt: file.exportedAt, checksum: file.checksum, fileName: a.download, status: 'transferencia_iniciada' };
    });
  }

  // ---------- arranque ----------
  function init() {
    var s = readSchema();
    S.loadedStatus = s.status === 'v2' ? 'v2' : (s.status === 'migrating' ? 'migrating' : 'v1');
    if (S.loadedStatus === 'v2' && !localStorage.getItem(KEYS.v2)) {
      // Estado incoerente: marcador v2 sem dados. Não se trata como migração concluída.
      S.loadedStatus = 'invalid';
      S.notices.invalid = true;
    }
    global.addEventListener('storage', function (ev) {
      if (ev.storageArea && ev.storageArea !== localStorage) return;
      if (ev.key === KEYS.schema || ev.key === null) checkSchemaChange();
      if (ev.key === KEYS.v2 || ev.key === null) { S.v2cache = null; emit('data', 'external'); }
      if (mode() === 'v2' && V1_MED_KEYS.indexOf(ev.key) !== -1) checkExternalV1();
    });
    electWriter();
  }

  function status() {
    return { loadedStatus: S.loadedStatus, persisted: readSchema(), mode: mode(), isWriter: S.isWriter, hasLocks: hasLocks,
      blockReason: writeBlockReason(), notices: S.notices, tabId: tabId };
  }
  function dismissNotice(name) { delete S.notices[name]; emit('notice', name); }

  global.DMStore = {
    APP_VERSION: APP_VERSION, KEYS: KEYS, V1_MED_KEYS: V1_MED_KEYS,
    init: init, mode: mode, status: status, canWrite: canWrite, writeBlockReason: writeBlockReason, onChange: onChange,
    writeRaw: writeRaw, getV2: getV2, applyV2: applyV2, newOperationId: newOperationId,
    getImage: getImage, putImage: putImage, cleanupOrphanImages: cleanupOrphanImages,
    preflight: preflight, migrate: migrate, recoverIfInterrupted: recoverIfInterrupted, checkExternalV1: checkExternalV1,
    requestHandover: requestHandover, downloadExport: downloadExport, buildExport: buildExport, dismissNotice: dismissNotice,
    backupKeys: backupKeys, readSchema: readSchema,
  };
})(typeof window !== 'undefined' ? window : globalThis);
