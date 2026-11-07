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
    shared: 'dailymed_v2_shared',
  };
  var BACKUP_PREFIX = 'dailymed_backup_v1_';
  var V1_MED_KEYS = ['dailymed_medications', 'dailymed_reminders', 'dailymed_medication_history', 'dailymed_medication_alerts'];
  var V1_KEY_LABEL = {
    dailymed_medications: 'medicamentos', dailymed_reminders: 'lembretes',
    dailymed_medication_history: 'histórico de tomas', dailymed_medication_alerts: 'alertas',
  };
  /*
   * Chaves que a versão antiga da app (v1, sem DMStore) pode gravar, e o que cada uma significa para a v2
   * (levantamento feito em js/storage.js e js/app.js das branches main e etapa-1-correcoes-urgentes):
   *  A. Dados de medicação — a v2 tem cópia própria em dailymed_v2; alterações antigas NÃO são aplicadas → aviso:
   *     dailymed_medications, dailymed_reminders, dailymed_medication_history          (EXTERNAL_MED_KEYS)
   *  B. Partilhadas — a v2 usa exatamente a mesma chave e formato; a alteração antiga fica em vigor → aviso de conflito:
   *     dailymed_settings, dailymed_recycling_deliveries, dailymed_travel_checklist  (SHARED_KEYS)
   *  C. Sem impacto nos dados da v2 → ignoradas (sem avisos falsos):
   *     dailymed_medication_alerts (a v2 usa dailymed_v2_alerts), dailymed_last_dica (rotação de dicas),
   *     dailymed_geo_* (cache de mapas), dailymed_onboarding_done (só passa a "true").
   */
  var EXTERNAL_MED_KEYS = ['dailymed_medications', 'dailymed_reminders', 'dailymed_medication_history'];
  var SHARED_KEYS = ['dailymed_settings', 'dailymed_recycling_deliveries', 'dailymed_travel_checklist'];
  var SHARED_LABEL = { dailymed_settings: 'definições', dailymed_recycling_deliveries: 'entregas de reciclagem', dailymed_travel_checklist: 'lista de viagem' };
  var SHARED_FP_KEY = 'dailymed_v2_shared';

  var V2 = global.DailyMedV2;
  var Img = global.DailyMedImages;
  var hasLocks = !!(global.navigator && global.navigator.locks && typeof global.navigator.locks.request === 'function');
  var channel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('dailymed-tabs') : null;
  var tabId = 'tab_' + Math.random().toString(36).slice(2, 10);

  var S = {
    loadedStatus: 'v1', isWriter: false, migrator: false, releaseWriter: null,
    v2cache: null, listeners: [], notices: {}, writerWaiting: false, damagedReadable: false,
  };

  function emit(kind, detail) { S.listeners.forEach(function (fn) { try { fn(kind, detail); } catch (e) { if (global.console) console.error(e); } }); }
  function onChange(fn) { S.listeners.push(fn); }

  // ---------- estado da versão ----------
  var VALID_STATUS = ['v1', 'migrating', 'v2'];
  /**
   * Marcador tal como está gravado. Ausente → { status: 'v1', absent: true }.
   * Ilegível ou com estado desconhecido → { status: 'corrupt' } (nunca é tratado como v1).
   */
  function readSchema() {
    var raw;
    try { raw = localStorage.getItem(KEYS.schema); } catch (e) { return { status: 'corrupt', reason: 'unreadable' }; }
    if (raw === null) return { status: 'v1', absent: true };
    try {
      var s = JSON.parse(raw);
      if (s && typeof s === 'object' && VALID_STATUS.indexOf(s.status) !== -1) return s;
      return { status: 'corrupt', reason: 'unknown_status', raw: raw.slice(0, 200) };
    } catch (e) { return { status: 'corrupt', reason: 'invalid_json', raw: raw.slice(0, 200) }; }
  }
  function hasV2Data() { try { return localStorage.getItem(KEYS.v2) !== null; } catch (e) { return true; } }

  /**
   * Estado efetivo da instalação, combinando o marcador com a presença de dados v2.
   * Regra de segurança: se existem dados em dailymed_v2, a instalação NUNCA é tratada como v1 —
   * seja qual for o marcador (ausente, ilegível, desconhecido ou "v1"). Fica em recuperação ("damaged").
   * Versão rápida: usada em cada verificação de escrita (não valida o conteúdo).
   */
  function effectiveStatus() {
    var sc = readSchema();
    var v2 = hasV2Data();
    if (sc.status === 'corrupt') return 'damaged';
    if (sc.status === 'migrating') return 'migrating';
    if (sc.status === 'v2') return v2 ? 'v2' : 'damaged';
    return v2 ? 'damaged' : 'v1';
  }

  /** Diagnóstico completo (arranque e ecrã de recuperação). Não escreve nada. */
  function assessInstallation() {
    var sc = readSchema(), raw = null, st = null, parseOk = false, errors = [];
    try { raw = localStorage.getItem(KEYS.v2); } catch (e) { raw = null; }
    if (raw !== null) {
      try { st = JSON.parse(raw); parseOk = !!st && typeof st === 'object'; } catch (e) { parseOk = false; }
      if (parseOk) errors = V2.validateState(st); else errors = ['dailymed_v2 não é JSON válido'];
    }
    var hasV2 = raw !== null, v2Valid = hasV2 && parseOk && errors.length === 0;
    var res = { schema: sc, hasV2: hasV2, v2Valid: v2Valid, v2Errors: errors.slice(0, 5), status: 'v1', reason: null, counts: null, lastActivity: null };
    if (v2Valid) {
      res.counts = { medications: st.medications.length, reminders: st.reminders.length, doseRecords: st.doseRecords.length, stockMovements: st.stockMovements.length };
      var last = st.operations.length ? st.operations[st.operations.length - 1].at : (st.migration && st.migration.completedAt) || null;
      res.lastActivity = last;
      res.migrationId = st.migration ? st.migration.migrationId : null;
    }
    if (sc.status === 'corrupt') { res.status = 'damaged'; res.reason = hasV2 ? 'schema_corrupt_with_v2' : 'schema_corrupt'; }
    else if (sc.status === 'migrating') { res.status = 'migrating'; }
    else if (sc.status === 'v2') {
      if (!hasV2) { res.status = 'damaged'; res.reason = 'v2_without_data'; }
      else if (!v2Valid) { res.status = 'damaged'; res.reason = 'v2_corrupt'; }
      else res.status = 'v2';
    } else if (hasV2) { res.status = 'damaged'; res.reason = sc.absent ? 'schema_missing_with_v2' : 'v1_with_v2_data'; }
    return res;
  }
  function writeSchemaDirect(obj) {
    var txt = JSON.stringify(obj);
    testFail('schema:' + obj.status);
    localStorage.setItem(KEYS.schema, txt);
    if (localStorage.getItem(KEYS.schema) !== txt) throw stepError('schema', 'O marcador de versão não ficou gravado.');
  }
  // Em recuperação com dados v2 válidos, mostramos esses dados (só leitura) em vez dos dados v1.
  function mode() { return S.loadedStatus === 'v2' || (S.loadedStatus === 'damaged' && S.damagedReadable) ? 'v2' : 'v1'; }

  // Ganchos de teste (só usados pelos testes no browser para simular falhas).
  function testFail(point) {
    var f = global.__DM_TEST_FAIL;
    if (f && f[point]) { if (f[point] === 'quota') { var e = new Error('Simulado: sem espaço'); e.name = 'QuotaExceededError'; throw e; } throw new Error('Simulado: falha em ' + point); }
  }
  function stepError(step, message, cause) { var e = new Error(message); e.step = step; e.cause = cause; return e; }

  // ---------- permissões de escrita ----------
  function writeBlockReason() {
    if (S.loadedStatus === 'damaged') return 'damaged';
    var cur = effectiveStatus();
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
    try {
      // Em v2, regista primeiro a impressão do valor: assim os outros separadores reconhecem a gravação como da v2.
      if (mode() === 'v2' && SHARED_KEYS.indexOf(key) !== -1) setSharedFp(key, value);
      localStorage.setItem(key, value); return true;
    }
    catch (e) { emit('storage_error', e.name || 'erro'); return false; }
  }
  function sharedFp(value) { return value == null ? 'absent' : V2.fnv1a32(value); }
  function readSharedFps() { try { return JSON.parse(localStorage.getItem(SHARED_FP_KEY) || 'null'); } catch (e) { return null; } }
  function setSharedFp(key, value) {
    var map = ensureSharedBaseline();
    map[key] = sharedFp(value);
    localStorage.setItem(SHARED_FP_KEY, JSON.stringify(map));
  }
  /**
   * Em v2: deteta gravações feitas às chaves partilhadas (B) por uma versão antiga. Não as desfaz (o formato é o mesmo),
   * mas avisa, porque há risco de gravações em conflito. Sem referência guardada → cria-a sem avisar.
   */
  /**
   * Referência das chaves partilhadas. Normalmente criada pela migração. Se faltar (instalação migrada por uma versão
   * anterior desta app), é reconstruída a partir da cópia de segurança da migração — nunca a partir do conteúdo atual,
   * que pode já incluir alterações de uma versão antiga.
   */
  function ensureSharedBaseline() {
    var map = readSharedFps();
    if (map) return map;
    var cur = {}; SHARED_KEYS.forEach(function (k) { cur[k] = sharedFp(localStorage.getItem(k)); });
    {
      // Sem referência (instalação migrada por uma versão anterior desta app): usa o conteúdo da cópia de segurança
      // da migração, para não aceitar em silêncio alterações feitas depois dela.
      var sc = readSchema(), bk = sc.backupKey ? readBackup(sc.backupKey) : null;
      if (bk && bk.keys) map = sharedBaselineFrom(function (k) { return bk.keys[k] === undefined ? null : bk.keys[k]; });
      else {
        map = cur; // sem nenhuma referência possível: a partir de agora
        if (canWrite()) diagnostics({ at: new Date().toISOString(), type: 'shared_baseline_without_reference' });
      }
      if (canWrite()) { try { localStorage.setItem(SHARED_FP_KEY, JSON.stringify(map)); } catch (e) { /* nada */ } }
    }
    return map;
  }
  /*
   * Quem decide se uma gravação numa chave partilhada veio de uma versão antiga:
   * - Com Web Locks, só o separador de escrita grava, e um separador nunca recebe eventos das suas próprias gravações.
   *   Logo, um evento de chave partilhada recebido pelo separador de escrita só pode vir de código antigo (sem DMStore).
   *   É ele que compara e avisa os outros separadores pelo BroadcastChannel.
   * - Os separadores só de leitura NÃO comparam: recebem as gravações da v2 em duas chaves (referência e valor), uma a uma,
   *   e comparar a meio dessa sequência dava falsos avisos (condição de corrida observada nos testes).
   * - Sem Web Locks, a v2 não grava em nenhum separador: qualquer evento de chave partilhada vem de código antigo.
   */
  function onSharedKeyEvent() {
    if (mode() !== 'v2') return;
    if (S.isWriter || !hasLocks) checkSharedKeys();
  }
  function checkSharedKeys() {
    if (mode() !== 'v2') return [];
    var map = ensureSharedBaseline();
    var cur = {}; SHARED_KEYS.forEach(function (k) { cur[k] = sharedFp(localStorage.getItem(k)); });
    var changed = SHARED_KEYS.filter(function (k) { return map[k] !== undefined && map[k] !== cur[k]; });
    var missing = SHARED_KEYS.filter(function (k) { return map[k] === undefined; });
    if ((changed.length || missing.length) && canWrite()) {
      var next = {}; SHARED_KEYS.forEach(function (k) { next[k] = cur[k]; });
      try { localStorage.setItem(SHARED_FP_KEY, JSON.stringify(next)); } catch (e) { /* nada */ }
    }
    if (!changed.length) return [];
    var labels = changed.map(function (k) { return SHARED_LABEL[k]; });
    S.notices.sharedExternal = 'Uma versão antiga da DailyMed aberta noutro separador alterou: ' + labels.join(', ') +
      '. Estes dados são partilhados pelas duas versões, por isso a alteração ficou. Fecha os separadores antigos para evitar gravações em conflito.';
    if (canWrite()) diagnostics({ at: new Date().toISOString(), type: 'shared_external_change', keys: changed });
    if (channel && S.isWriter) channel.postMessage({ type: 'shared-external', from: tabId, text: S.notices.sharedExternal, keys: changed });
    emit('external', changed);
    return changed;
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
      if (msg.type === 'shared-external' && msg.from !== tabId && mode() === 'v2' && typeof msg.text === 'string') {
        S.notices.sharedExternal = msg.text; emit('external', msg.keys || []);
      }
    };
  }

  function checkSchemaChange() {
    var cur = effectiveStatus();
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
    if (S.loadedStatus === 'damaged') { blocked('damaged'); return { status: 'read_only_tab', reason: 'damaged' }; }
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
      // Só as chaves de medicação (A). dailymed_medication_alerts não é usada pela v2: ignorada para não dar avisos falsos.
      var changed = EXTERNAL_MED_KEYS.filter(function (k) { return fp[k] !== st.v1Sync.fingerprints[k]; });
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
      locks: hasLocks, writer: S.isWriter, status: effectiveStatus(), loadedStatus: S.loadedStatus, hasV2Data: hasV2Data(),
    };
  }

  function makeBackupObject(migrationId, fp) {
    var keys = {};
    allDailymedKeys().forEach(function (k) {
      // dailymed_v2_images entra na cópia: se existir sem dailymed_v2 (resto de uma tentativa anterior), fica guardado antes de ser substituído.
      if (k.indexOf(BACKUP_PREFIX) === 0 || k === KEYS.schema || k === KEYS.v2 || k === KEYS.probe || k.indexOf('dailymed_geo_') === 0) return;
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
    if (hasV2Data()) return Promise.reject(stepError('v2_exists', 'Já existem dados da versão 2 neste browser. A atualização não pode ser feita por cima deles.'));
    if (S.loadedStatus !== 'v1' || effectiveStatus() !== 'v1') return Promise.reject(stepError('status', 'Os dados não estão na versão 1.'));
    return navigator.locks.request('dailymed-migration', { mode: 'exclusive', ifAvailable: true }, function (lock) {
      if (!lock) throw stepError('busy', 'Já está a decorrer uma atualização.');
      return runMigration(onStep);
    });
  }

  /*
   * Propriedade dos dados criados pela migração (diário persistente).
   * As chaves derivadas (DERIVED_KEYS) só são escritas depois de o marcador "migrating" guardar, para cada uma:
   *   pre    — identificador do conteúdo que existia antes ('absent' se não existia);
   *   intent — identificador do conteúdo exato que a migração vai escrever.
   * O identificador é SHA-256 do texto (ou FNV-1a + comprimento, se o browser não tiver crypto.subtle).
   * Na reversão/recuperação, uma chave só é considerada "da migração" se o conteúdo atual for exatamente o intent.
   * Nesse caso volta ao conteúdo anterior (apagada se não existia; reposta a partir da cópia de segurança se existia).
   * Conteúdo que não corresponde nem ao pre nem ao intent não pertence à migração: fica intacto.
   * O diário vive em dailymed_schema, por isso sobrevive ao fecho do separador ou do browser.
   */
  var DERIVED_KEYS = [KEYS.images, KEYS.shared, KEYS.v2];
  function contentId(text) {
    if (text === null || text === undefined) return Promise.resolve('absent');
    return sha256Hex(text).then(function (h) { return h ? 'sha256:' + h : 'fnv:' + V2.fnv1a32(text) + ':' + text.length; });
  }
  function readBackup(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; } }
  function sharedBaselineFrom(getter) { var m = {}; SHARED_KEYS.forEach(function (k) { m[k] = sharedFp(getter(k)); }); return m; }
  function pausePoint(name) {
    var p = global.__DM_TEST_PAUSE; // testes: simula o fecho do separador neste ponto
    return p === name || (p === true && name === 'before-activate');
  }

  /**
   * Volta as chaves derivadas ao estado anterior à migração descrita pelo marcador. Idempotente:
   * uma chave que já está no estado anterior não é tocada. Devolve um relatório; nunca apaga conteúdo cuja origem não prova.
   */
  function rollbackDerived(marker) {
    var report = { removed: [], restored: [], preserved: [], unchanged: [], foreignV2: false };
    var keys = (marker.journal && marker.journal.keys) || null;
    var chain = Promise.resolve();
    DERIVED_KEYS.forEach(function (k) {
      chain = chain.then(function () {
        var cur = localStorage.getItem(k);
        var entry = keys ? keys[k] : null;
        if (!entry) {
          // Sem diário para esta chave (passo não alcançado, ou marcador de uma versão anterior da app).
          if (cur === null) { report.unchanged.push(k); return; }
          if (k === KEYS.v2) {
            // Compatibilidade: marcador sem diário — só se aceita como da migração se o migrationId interno coincidir.
            var v2 = null; try { v2 = JSON.parse(cur); } catch (e) { v2 = null; }
            if (!keys && v2 && v2.migration && marker.migrationId && v2.migration.migrationId === marker.migrationId) {
              testFail('recover-remove'); localStorage.removeItem(k); report.removed.push(k); return;
            }
            report.foreignV2 = true;
          }
          report.preserved.push(k); return;
        }
        return contentId(cur).then(function (curId) {
          if (curId === entry.pre) { report.unchanged.push(k); return; }
          if (!entry.intent || curId !== entry.intent) { report.preserved.push(k); if (k === KEYS.v2) report.foreignV2 = true; return; }
          if (entry.pre === 'absent') { testFail('recover-remove'); localStorage.removeItem(k); report.removed.push(k); return; }
          // Existia conteúdo antes: repõe-se a partir da cópia de segurança, só se a cópia tiver exatamente esse conteúdo.
          var backup = readBackup(marker.backupKey);
          var prev = backup && backup.keys ? backup.keys[k] : undefined;
          return contentId(prev === undefined ? null : prev).then(function (prevId) {
            if (prev === undefined || prevId !== entry.pre) { report.preserved.push(k); report.restoreFailed = (report.restoreFailed || []).concat(k); return; }
            testFail('recover-restore');
            localStorage.setItem(k, prev);
            if (localStorage.getItem(k) !== prev) throw stepError('recover', 'Não foi possível repor ' + k + '.');
            report.restored.push(k);
          });
        });
      });
    });
    return chain.then(function () { try { localStorage.removeItem(KEYS.probe); } catch (e) { /* bloco temporário, nome reservado */ } return report; });
  }

  function runMigration(onStep) {
    var migrationId = 'mig_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    var raw1, fp1, built, backupKey = BACKUP_PREFIX + migrationId, step = 'inicio', marker = null, texts = null;
    function at(s, text) { step = s; onStep(text); }
    function never() { return new Promise(function () {}); }
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
      if (hasV2Data() || effectiveStatus() !== 'v1') throw stepError('v2_exists', 'Já existem dados da versão 2 neste browser. A atualização foi cancelada.');
      // Diário: estado anterior de cada chave derivada.
      return Promise.all(DERIVED_KEYS.map(function (k) { return contentId(localStorage.getItem(k)); }));
    }).then(function (preIds) {
      var keys = {}; DERIVED_KEYS.forEach(function (k, i) { keys[k] = { pre: preIds[i], intent: null }; });
      at('schema-pending', 'A marcar a atualização como pendente…');
      marker = { status: 'migrating', migrationId: migrationId, startedAt: new Date().toISOString(), tabId: tabId, backupKey: backupKey, journal: { version: 1, keys: keys } };
      writeSchemaDirect(marker);
      S.loadedStatus = 'migrating'; S.migrator = true;
      if (channel) channel.postMessage({ type: 'schema-changed' });
      at('backup', 'A criar a cópia de segurança…');
      var backup = makeBackupObject(migrationId, fp1);
      var txt = JSON.stringify(backup);
      testFail('backup');
      try { localStorage.setItem(backupKey, txt); } catch (e) { throw stepError('backup', 'Não há espaço para a cópia de segurança. Nada foi alterado.', e); }
      if (localStorage.getItem(backupKey) !== txt) throw stepError('backup', 'A cópia de segurança não ficou gravada corretamente.');
      // Conteúdo exato a escrever. A referência das chaves partilhadas é criada aqui, com o conteúdo que a v1 tem agora:
      // qualquer alteração posterior por uma versão antiga é detetada depois da ativação, mesmo sem recarregar.
      texts = {};
      texts[KEYS.images] = JSON.stringify(built.images);
      texts[KEYS.shared] = JSON.stringify(sharedBaselineFrom(function (k) { return localStorage.getItem(k); }));
      texts[KEYS.v2] = JSON.stringify(built.state);
      at('space', 'A verificar o espaço disponível…');
      spaceProbe(texts[KEYS.v2].length + texts[KEYS.images].length + texts[KEYS.shared].length);
      return Promise.all(DERIVED_KEYS.map(function (k) { return contentId(texts[k]); }));
    }).then(function (intentIds) {
      DERIVED_KEYS.forEach(function (k, i) { marker.journal.keys[k].intent = intentIds[i]; });
      writeSchemaDirect(marker); // o diário fica gravado ANTES de qualquer escrita nas chaves derivadas
      if (pausePoint('before-images')) return never();
      at('write', 'A gravar os dados da versão 2…');
      testFail('write-images');
      localStorage.setItem(KEYS.images, texts[KEYS.images]);
      if (pausePoint('after-images')) return never();
      testFail('write-shared');
      localStorage.setItem(KEYS.shared, texts[KEYS.shared]);
      testFail('write-v2');
      // Última verificação antes de gravar: nunca escrever por cima de dados v2 que tenham aparecido entretanto.
      if (hasV2Data()) throw stepError('v2_exists', 'Apareceram dados da versão 2 durante a atualização. Nada foi substituído.');
      localStorage.setItem(KEYS.v2, texts[KEYS.v2]);
      at('verify', 'A confirmar o resultado…');
      var back = JSON.parse(localStorage.getItem(KEYS.v2));
      var errs = V2.validateState(back);
      if (errs.length) throw stepError('verify', 'O resultado gravado não passou a verificação: ' + errs.join('; '));
      if (back.medications.length !== built.report.counts.medications || back.doseRecords.length !== built.report.counts.legacy) throw stepError('verify', 'As contagens do resultado não batem certo.');
      if (localStorage.getItem(KEYS.images) !== texts[KEYS.images]) throw stepError('verify', 'As fotografias não ficaram gravadas corretamente.');
      if (localStorage.getItem(KEYS.shared) !== texts[KEYS.shared]) throw stepError('verify', 'A referência das chaves partilhadas não ficou gravada corretamente.');
      return fingerprints(readV1Raw());
    }).then(function (fp2) {
      at('recheck', 'A confirmar que os dados antigos não mudaram…');
      var changed = V1_MED_KEYS.filter(function (k) { return fp2[k] !== fp1[k]; });
      if (changed.length) throw stepError('recheck', 'Os dados antigos foram alterados noutro separador durante a atualização. Fecha os outros separadores e tenta de novo.');
      testFail('pause-before-activate');
      if (pausePoint('before-activate')) return never();
      at('activate', 'A ativar a versão 2…');
      writeSchemaDirect({ status: 'v2', migrationId: migrationId, startedAt: marker.startedAt, completedAt: new Date().toISOString(), backupKey: backupKey, fingerprints: fp1 });
      S.loadedStatus = 'v2'; S.migrator = false; S.v2cache = null;
      if (channel) channel.postMessage({ type: 'schema-changed' });
      emit('migrated', built.report);
      checkSharedKeys(); // alterações antigas feitas durante a migração (depois da referência) são avisadas já, sem recarregar
      return { ok: true, report: built.report, backupKey: backupKey };
    }).catch(function (err) {
      // Reverter só o que esta migração criou (diário). As chaves v1 nunca foram tocadas; a cópia de segurança fica.
      var info = { at: new Date().toISOString(), step: err.step || step, message: err.message };
      var schemaNow = readSchema();
      var ours = schemaNow.status === 'migrating' && schemaNow.migrationId === migrationId;
      return (ours ? rollbackDerived(schemaNow) : Promise.resolve(null)).then(function (rb) {
        info.rollback = rb;
        if (ours) {
          if (rb && rb.foreignV2) {
            // Há dados v2 que não são desta migração: fica "migrating" e a recuperação no arranque põe em "damaged", sem apagar.
            info.schemaRestoreFailed = true;
          } else {
            try { writeSchemaDirect({ status: 'v1', lastError: info, backupKey: backupKey }); S.loadedStatus = 'v1'; }
            catch (e) { info.schemaRestoreFailed = true; /* fica "migrating": a recuperação no arranque seguinte trata disto */ }
          }
        } else if (schemaNow.status === 'v1') { S.loadedStatus = 'v1'; }
      }, function (rbErr) { info.rollbackError = rbErr.message; info.schemaRestoreFailed = true; }).then(function () {
        S.migrator = false;
        if (channel) channel.postMessage({ type: 'schema-changed' });
        var e2 = stepError(info.step, err.message, err); e2.info = info; throw e2;
      });
    });
  }

  /**
   * Recuperação de uma migração interrompida (estado "migrating" sem nenhum separador a migrar).
   * Usa o diário do marcador: só reverte o que a migração comprovadamente escreveu. Idempotente.
   * Se encontrar dados v2 que não são da migração, não toca em nada e fica em recuperação ("damaged").
   * Se a reversão falhar a meio, o marcador continua "migrating" e a próxima execução retoma sem perdas.
   */
  function recoverIfInterrupted() {
    var s = readSchema();
    if (s.status !== 'migrating' || !hasLocks || !S.isWriter) return Promise.resolve(false);
    return navigator.locks.request('dailymed-migration', { mode: 'exclusive', ifAvailable: true }, function (lock) {
      if (!lock) return false; // outro separador está mesmo a migrar
      var cur = readSchema(); if (cur.status !== 'migrating') return false;
      return rollbackDerived(cur).then(function (rb) {
        if (rb.foreignV2) {
          S.loadedStatus = 'damaged'; S.damagedReadable = false; S.notices.damaged = 'migrating_with_foreign_v2';
          diagnostics({ at: new Date().toISOString(), type: 'recovery_refused', reason: 'migrating_with_foreign_v2', migrationId: cur.migrationId || null, rollback: rb });
          emit('damaged', 'migrating_with_foreign_v2');
          return false;
        }
        writeSchemaDirect({ status: 'v1', recoveredAt: new Date().toISOString(), lastError: { step: 'interrompida', message: 'A atualização anterior foi interrompida.' },
          backupKey: cur.backupKey || (cur.migrationId ? BACKUP_PREFIX + cur.migrationId : null), recovery: rb });
        if (rb.preserved.length) diagnostics({ at: new Date().toISOString(), type: 'recovery_preserved', keys: rb.preserved, migrationId: cur.migrationId || null });
        S.loadedStatus = 'v1';
        S.notices.recovered = true;
        if (channel) channel.postMessage({ type: 'schema-changed' });
        emit('recovered', rb);
        return true;
      });
    }).catch(function (e) {
      diagnostics({ at: new Date().toISOString(), type: 'recovery_failed', message: e.message });
      S.notices.recoveryFailed = true; emit('notice', 'recoveryFailed');
      if (global.console) console.warn('DailyMed: recuperação não concluída; será retomada no próximo arranque.', e);
      return false;
    });
  }

  /**
   * Reparação explícita do marcador, pedida pelo utente no ecrã de recuperação. Nunca apaga nem altera dados:
   * só regrava dailymed_schema (guardando o marcador anterior em previousMarker).
   *  - 'reactivate_v2': só se dailymed_v2 existe e passa todas as verificações.
   *  - 'mark_v1': só se NÃO existem dados v2 (marcador ilegível ou "v2 sem dados").
   */
  function repairMarker(action) {
    if (!hasLocks) return Promise.reject(stepError('locks', 'Este browser não permite fazer a reparação com segurança.'));
    if (!S.isWriter) return Promise.reject(stepError('writer', 'A DailyMed está aberta noutro separador. Usa só um separador.'));
    return navigator.locks.request('dailymed-migration', { mode: 'exclusive', ifAvailable: true }, function (lock) {
      if (!lock) throw stepError('busy', 'Está a decorrer outra operação de dados.');
      var a = assessInstallation();
      if (a.status !== 'damaged') throw stepError('not_damaged', 'Os dados não estão em recuperação.');
      var prevRaw = null; try { prevRaw = localStorage.getItem(KEYS.schema); } catch (e) { prevRaw = null; }
      var base = { repairedAt: new Date().toISOString(), repairedFrom: a.reason, previousMarker: prevRaw };
      if (action === 'reactivate_v2') {
        if (!a.v2Valid) throw stepError('v2_invalid', 'Os dados da versão 2 não passaram a verificação. Não é possível reativá-los.');
        var st = JSON.parse(localStorage.getItem(KEYS.v2));
        base.status = 'v2'; base.migrationId = st.migration ? st.migration.migrationId : null;
      } else if (action === 'mark_v1') {
        if (a.hasV2) throw stepError('v2_exists', 'Existem dados da versão 2: não é possível voltar à versão 1 sem os perder.');
        base.status = 'v1';
      } else throw stepError('action', 'Ação desconhecida.');
      writeSchemaDirect(base);
      diagnostics({ at: base.repairedAt, type: 'marker_repaired', action: action, from: a.reason });
      if (channel) channel.postMessage({ type: 'schema-changed' });
      return { ok: true, status: base.status };
    });
  }

  function onBecameWriter() {
    recoverIfInterrupted().then(function () {
      if (mode() === 'v2' && S.loadedStatus === 'v2') { cleanupOrphanImages(); checkSharedKeys(); return checkExternalV1(); }
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
    var a = assessInstallation();
    S.loadedStatus = a.status;
    if (a.status === 'damaged') {
      // Recuperação: nada é gravado, nada é migrado. Se os dados v2 estiverem legíveis e válidos, são mostrados (só leitura).
      S.damagedReadable = a.v2Valid;
      S.notices.damaged = a.reason;
    }
    global.addEventListener('storage', function (ev) {
      if (ev.storageArea && ev.storageArea !== localStorage) return;
      if (ev.key === KEYS.schema || ev.key === null) checkSchemaChange();
      if (ev.key === KEYS.v2 || ev.key === null) { S.v2cache = null; emit('data', 'external'); }
      if (mode() === 'v2' && EXTERNAL_MED_KEYS.indexOf(ev.key) !== -1) checkExternalV1();
      if (mode() === 'v2' && (SHARED_KEYS.indexOf(ev.key) !== -1 || ev.key === null)) onSharedKeyEvent();
    });
    electWriter();
  }

  function status() {
    return { loadedStatus: S.loadedStatus, persisted: readSchema(), effective: effectiveStatus(), mode: mode(), isWriter: S.isWriter, hasLocks: hasLocks,
      blockReason: writeBlockReason(), notices: S.notices, tabId: tabId };
  }
  function dismissNotice(name) { delete S.notices[name]; emit('notice', name); }

  global.DMStore = {
    APP_VERSION: APP_VERSION, KEYS: KEYS, V1_MED_KEYS: V1_MED_KEYS, EXTERNAL_MED_KEYS: EXTERNAL_MED_KEYS, SHARED_KEYS: SHARED_KEYS, checkSharedKeys: checkSharedKeys,
    init: init, mode: mode, status: status, canWrite: canWrite, writeBlockReason: writeBlockReason, onChange: onChange,
    writeRaw: writeRaw, getV2: getV2, applyV2: applyV2, newOperationId: newOperationId,
    getImage: getImage, putImage: putImage, cleanupOrphanImages: cleanupOrphanImages,
    preflight: preflight, migrate: migrate, recoverIfInterrupted: recoverIfInterrupted, checkExternalV1: checkExternalV1,
    requestHandover: requestHandover, downloadExport: downloadExport, buildExport: buildExport, dismissNotice: dismissNotice,
    backupKeys: backupKeys, readSchema: readSchema, assessInstallation: assessInstallation, effectiveStatus: effectiveStatus, repairMarker: repairMarker,
  };
})(typeof window !== 'undefined' ? window : globalThis);
