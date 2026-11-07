/**
 * DailyMed — interface da versão 2 (tomas por horário, stock por movimentos, histórico, atualização dos dados)
 * e avisos de compatibilidade entre separadores. Usa as funções de apresentação do app.js (escapeHtml, pageHeader, …).
 * Carregado antes do app.js; as funções só são chamadas depois de o app.js estar carregado.
 */
var V2UI = (function () {
  'use strict';

  var REASONS = {
    esqueci: 'Esqueci-me',
    sem_medicamento: 'Não tinha o medicamento disponível',
    decidi_nao_tomar: 'Decidi não tomar',
    outro_ou_nao_indicar: 'Outro / prefiro não indicar',
  };
  var MOV_LABEL = {
    initial: 'Stock inicial', consumption: 'Toma', entry: 'Entrada', exit: 'Saída', adjustment: 'Ajuste manual',
    count: 'Contagem física', confirmation: 'Confirmação do saldo', reversal: 'Reversão', issue: 'Inconsistência',
  };
  var MOV_REASON = {
    nova_embalagem: 'nova embalagem', saida: 'saída', ajuste_manual: 'ajuste manual', contagem_fisica: 'contagem física',
    confirmacao: 'saldo confirmado', stock_inicial: 'stock inicial', toma: 'toma registada', correcao_toma: 'correção de toma',
    anulacao_movimento: 'anulação de movimento', sem_efeito_apos_contagem: 'sem efeito: houve contagem depois',
    insufficient_stock: 'stock insuficiente para a dose',
  };
  var RESULT_MSG = {
    already_recorded: 'Esta toma já estava registada (talvez noutro separador).',
    stale_record: 'Este registo mudou entretanto. Mostramos o estado atual.',
    correction_window_closed: 'Só é possível registar ou corrigir tomas dos últimos 7 dias.',
    legacy_read_only: 'Os registos importados da versão anterior não se podem corrigir.',
    record_voided: 'Este registo foi anulado.',
    would_be_negative: 'Operação recusada: o stock não pode ficar negativo.',
    invalid_amount: 'Quantidade inválida. Usa um número igual ou maior que 0, com até 2 casas decimais.',
    invalid_unit: 'Escolhe a unidade.',
    stock_not_configured: 'Configura primeiro o stock deste medicamento.',
    medication_removed: 'Este medicamento foi removido.',
    no_change: 'Não há nada para alterar.',
    already_reverted: 'Este movimento já foi revertido.',
    not_revertible: 'Este tipo de movimento não se reverte aqui.',
    reminder_inactive: 'Este lembrete está desativado.',
    unknown_time: 'Este horário já não existe no lembrete.',
    invalid_medication: 'Preenche pelo menos o nome do medicamento.',
    image_not_saved: 'Não foi possível guardar a fotografia.',
    unit_locked: 'A unidade não pode ser alterada depois de haver movimentos de stock (a app não converte unidades).',
    amount_change_needs_confirmation: 'Confirma a nova quantidade por toma (só vale para as tomas a partir de agora).',
    invalid_date: 'Data inválida.',
  };

  function isV2() { return DMStore.mode() === 'v2'; }
  function st() { return DMStore.getV2(); }
  function oid() { return DMStore.newOperationId(); }
  function num(n) { return n == null ? '—' : (Math.round(n * 100) / 100).toLocaleString('pt-PT'); }
  function esc(s) { return escapeHtml(s == null ? '' : String(s)); }
  function fmtDateTime(iso) { if (!iso) return ''; var d = new Date(iso); return d.toLocaleDateString('pt-PT') + ' ' + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }); }
  function today() { return DailyMedV2.localDateStr(new Date()); }

  /** true se a operação foi aplicada; mostra a mensagem certa em qualquer caso. */
  function report(res, okMsg) {
    if (!res) { showToast('Não foi possível guardar.', 'error'); return false; }
    if (res === true || res.status === 'applied') { if (okMsg) showToast(okMsg, 'check_circle'); return true; }
    if (res.status === 'duplicate_ignored') { showToast('Esta operação já tinha sido registada.', 'info'); return false; }
    if (res.status === 'read_only_tab') { showToast('Este separador está só de leitura. Vê o aviso no topo.', 'lock'); return false; }
    if (res.status === 'storage_error') { showToast('Não foi possível guardar (armazenamento do browser). Nada foi alterado.', 'error'); return false; }
    if (res.status === 'invariant_violation') { showToast('Operação recusada para proteger os dados.', 'error'); return false; }
    showToast(RESULT_MSG[res.reason] || 'Operação recusada.', 'error');
    return false;
  }

  var DAMAGED_MSG = {
    schema_missing_with_v2: 'O marcador de versão desapareceu, mas existem dados da versão 2.',
    schema_corrupt_with_v2: 'O marcador de versão está danificado e existem dados da versão 2.',
    schema_corrupt: 'O marcador de versão está danificado.',
    v1_with_v2_data: 'O marcador indica a versão 1, mas existem dados da versão 2.',
    v2_without_data: 'O marcador indica a versão 2, mas os dados da versão 2 não existem.',
    v2_corrupt: 'Os dados da versão 2 estão danificados ou incompletos.',
    migrating_with_foreign_v2: 'Uma atualização interrompida encontrou dados da versão 2 que não foram criados por ela.',
    default: 'Os dados estão num estado incoerente.',
  };

  // ---------- avisos de compatibilidade ----------
  function banners() {
    var s = DMStore.status(), out = [];
    function b(cls, text, actions) { out.push('<div class="dm-banner dm-banner--' + cls + '" role="status">' + '<p>' + text + '</p>' + (actions || '') + '</div>'); }
    if (s.blockReason === 'outdated' || s.notices.outdated) {
      b('danger', 'A DailyMed foi atualizada ou alterada noutro separador. Este separador já não pode gravar. Recarrega a página para continuar.',
        '<button type="button" class="dm-banner-btn" data-action="reload">Recarregar</button>');
    } else if (s.blockReason === 'migrating' && s.notices.recoveryFailed) {
      b('danger', 'A recuperação de uma atualização interrompida não terminou. Nada foi apagado: os dados antigos e a cópia de segurança estão guardados. Recarrega a página para tentar de novo.',
        '<button type="button" class="dm-banner-btn" data-action="reload">Recarregar</button>');
    } else if (s.blockReason === 'migrating') {
      b('warning', 'A atualização dos dados está a decorrer noutro separador. Este separador está só de leitura.');
    } else if (s.blockReason === 'other_tab') {
      b('info', 'A DailyMed está aberta noutro separador. Este separador está só de leitura para não haver gravações em conflito.',
        '<button type="button" class="dm-banner-btn" data-action="handover">Usar este separador</button>');
    } else if (s.blockReason === 'no_locks') {
      b('warning', 'Este browser não permite registar com segurança. Podes consultar e exportar os teus dados.');
    }
    if (s.loadedStatus === 'damaged' || s.notices.damaged) {
      b('danger', esc(DAMAGED_MSG[s.notices.damaged] || DAMAGED_MSG.default) + ' Para proteger os teus dados, a app está só de leitura: nada vai ser atualizado, apagado ou substituído.',
        '<a href="#atualizar-dados" class="dm-banner-btn" id="link-recovery">Ver recuperação</a>');
    }
    if (s.notices.recovered) b('warning', 'A atualização anterior foi interrompida. Os teus dados antigos estão intactos e a app continua na versão anterior.',
      '<button type="button" class="dm-banner-btn" data-action="dismiss" data-notice="recovered">Fechar</button>');
    if (s.notices.external) b('warning', esc(s.notices.external), '<button type="button" class="dm-banner-btn" data-action="dismiss" data-notice="external">Fechar</button>');
    if (s.notices.sharedExternal) b('warning', esc(s.notices.sharedExternal), '<button type="button" class="dm-banner-btn" data-action="dismiss" data-notice="sharedExternal">Fechar</button>');
    return out.length ? '<div id="dm-banners" class="dm-banners">' + out.join('') + '</div>' : '<div id="dm-banners"></div>';
  }
  function refreshBanners() {
    var el = document.getElementById('dm-banners');
    if (el) el.outerHTML = banners();
  }

  // ---------- tomas ----------
  var STATUS_INFO = {
    pendente: { label: 'Pendente', icon: 'schedule', cls: 'neutral' },
    por_registar: { label: 'Por registar', icon: 'pending_actions', cls: 'amber' },
    adiada: { label: 'Adiada', icon: 'snooze', cls: 'neutral' },
    inexistente: { label: 'Este horário não existe hoje (mudança de hora)', icon: 'update', cls: 'neutral' },
    taken: { label: 'Tomada', icon: 'check_circle', cls: 'ok' },
    not_taken: { label: 'Não tomada', icon: 'cancel', cls: 'muted' },
  };

  function slotRow(slot) {
    var info = STATUS_INFO[slot.status] || STATUS_INFO.pendente;
    var rec = slot.record;
    var sub = esc(slot.dosage);
    if (rec && rec.status === 'taken') sub += ' · registada às ' + new Date(rec.recordedAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    if (rec && rec.status === 'not_taken' && rec.notTakenReason) sub += ' · ' + esc(REASONS[rec.notTakenReason]);
    if (slot.status === 'adiada') sub += ' · lembrar às ' + new Date(slot.snoozedUntil).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    if (slot.kind === 'repetido' && !rec) sub += ' · esta hora repete-se hoje; conta a primeira vez';
    var stockNote = '';
    if (rec && rec.stock) {
      if (rec.stock.reason === 'insufficient_stock') stockNote = '<p class="slot-note slot-note--warn">Stock insuficiente: não foi descontado. Confirma o stock.</p>';
      else if (rec.stock.reason === 'stock_not_configured' && rec.status === 'taken') stockNote = '<p class="slot-note">Stock não configurado: nada foi descontado.</p>';
      else if (rec.stock.reason === 'covered_by_reference') stockNote = '<p class="slot-note">O stock não mudou: já houve uma contagem depois desta toma.</p>';
    }
    var data = ' data-slot="' + esc(slot.slotKey) + '" data-reminder="' + esc(slot.reminderId) + '" data-date="' + esc(slot.date) + '" data-time="' + esc(slot.time) + '"';
    var actions = '';
    if (!rec) {
      actions = '<button type="button" class="slot-btn slot-btn--primary" data-action="dose-taken" data-op="' + oid() + '"' + data + '>Tomei</button>' +
        '<select class="slot-reason" aria-label="Motivo (opcional)" data-reason-for="' + esc(slot.slotKey) + '"><option value="">Motivo (opcional)</option>' +
        Object.keys(REASONS).map(function (k) { return '<option value="' + k + '">' + esc(REASONS[k]) + '</option>'; }).join('') + '</select>' +
        '<button type="button" class="slot-btn" data-action="dose-not-taken" data-op="' + oid() + '"' + data + '>Não tomei</button>' +
        (slot.status !== 'inexistente' ? '<button type="button" class="slot-btn slot-btn--ghost" data-action="dose-snooze" data-op="' + oid() + '"' + data + '>Adiar 15 min</button>' : '');
    } else if (rec.status === 'taken' || rec.status === 'not_taken') {
      var other = rec.status === 'taken' ? 'not_taken' : 'taken';
      var rdata = ' data-record="' + esc(rec.id) + '" data-rev="' + rec.revisions.length + '"';
      actions = '<button type="button" class="slot-btn" data-action="dose-change" data-to="' + other + '" data-op="' + oid() + '"' + rdata + '>' + (other === 'taken' ? 'Corrigir: tomei' : 'Corrigir: não tomei') + '</button>' +
        '<button type="button" class="slot-btn slot-btn--ghost" data-action="dose-void" data-op="' + oid() + '"' + rdata + '>Anular registo</button>';
    }
    return '<li class="slot-row slot-row--' + info.cls + '" data-slot-row="' + esc(slot.slotKey) + '" data-status="' + slot.status + '">' +
      '<div class="slot-time">' + esc(slot.time) + '</div>' +
      '<div class="slot-main"><p class="slot-name">' + esc(slot.medicationName) + '</p><p class="slot-sub">' + sub + '</p>' +
      '<p class="slot-status"><span class="material-icons text-base align-middle" aria-hidden="true">' + info.icon + '</span> ' + esc(info.label) + '</p>' + stockNote +
      '<div class="slot-actions">' + actions + '</div></div></li>';
  }

  function todaySlots() { var s = st(); return s ? DailyMedV2.slotsForDay(s, today(), Date.now()) : []; }

  function viewHomeV2() {
    var s = st();
    var slots = todaySlots();
    var taken = slots.filter(function (x) { return x.status === 'taken'; }).length;
    var meds = getMedications();
    var low = meds.filter(function (m) { return DailyMedV2.isLowStock(s, m.id) || DailyMedV2.openIssues(s, m.id).length; }).length;
    var expiring = meds.filter(function (m) { return getValidityStatus(m.expiryDate).type === 'soon'; }).length;
    var list = slots.length ? '<ul class="slot-list" id="slots-today">' + slots.map(slotRow).join('') + '</ul>'
      : '<div class="empty-state"><p>Não há tomas previstas para hoje.</p><a href="#lembretes-novo" class="inline-flex mt-3 px-4 py-2 btn-primary">Criar lembrete</a></div>';
    return '<header class="relative px-4 flex items-center justify-center gap-3 bg-white">' +
      '<img src="logo.png" alt="DailyMed" class="app-logo object-contain" />' +
      '<a href="#definicoes" class="header-action" aria-label="Definições"><span class="material-icons">settings</span></a></header>' +
      '<main class="app-main space-y-5 bg-white">' +
      '<section class="next-step-card" aria-live="polite"><p class="next-step-label">Hoje</p>' +
      '<p class="next-step-text" id="progress-today">' + taken + ' de ' + slots.length + ' tomas registadas</p>' +
      '<div class="progress-bar" aria-hidden="true"><span style="width:' + (slots.length ? Math.round(100 * taken / slots.length) : 0) + '%"></span></div></section>' +
      '<section class="space-y-2"><p class="section-label">Tomas de hoje</p>' + list + '</section>' +
      '<section class="space-y-2"><p class="section-label">Atenção</p><div class="space-y-3">' +
      '<a href="#medicacao-armario?filter=baixo" class="summary-card summary-card--danger"><div><p class="summary-title">Stock baixo ou por confirmar</p><p class="summary-sub">Medicamentos</p></div><div class="summary-value text-red-600" id="low-stock-count">' + low + '</div></a>' +
      '<div class="summary-card summary-card--warning"><div><p class="summary-title">Expira em breve</p><p class="summary-sub">Medicamentos</p></div><div class="summary-value text-yellow-600">' + expiring + '</div></div>' +
      '</div></section>' +
      '<section class="grid grid-cols-2 gap-2">' +
      '<a href="#medicacao" class="home-shortcut home-shortcut--secondary home-shortcut--compact"><span class="material-icons text-2xl">medication</span><span>Armário</span></a>' +
      '<a href="#medicacao-historico" class="home-shortcut home-shortcut--secondary home-shortcut--compact"><span class="material-icons text-2xl">history</span><span>Histórico</span></a>' +
      '</section></main>';
  }

  function viewLembretesV2() {
    var s = st();
    var slots = todaySlots();
    var rems = s.reminders.filter(function (r) { return r.isActive; });
    var html = rems.map(function (r) {
      var med = DailyMedV2.findMed(s, r.medicationId);
      var mySlots = slots.filter(function (x) { return x.reminderId === r.id; });
      return '<li class="p-4 app-card card-round"><div class="flex justify-between items-start gap-3"><div>' +
        '<p class="font-medium">' + esc(med ? med.name : 'Medicamento') + '</p><p class="text-sm text-on-surface-variant">' + esc(med ? med.dosage : '') + '</p>' +
        '<p class="text-xs text-on-surface-variant mt-1">Horários: ' + esc((r.times || []).join(' · ')) + '</p></div>' +
        '<div class="flex gap-2"><a href="#lembretes-editar?id=' + encodeURIComponent(r.id) + '" class="btn-link btn-link--primary">Editar</a>' +
        '<button type="button" class="btn-link btn-link--danger deactivate-reminder-btn" data-id="' + esc(r.id) + '">Desativar</button></div></div>' +
        (mySlots.length ? '<ul class="slot-list mt-3">' + mySlots.map(slotRow).join('') + '</ul>' : '<p class="text-xs mt-2 text-on-surface-variant">Sem tomas previstas para hoje.</p>') +
        '</li>';
    }).join('');
    if (!rems.length) html = '<div class="empty-state"><p>Ainda não tens lembretes. Cria o primeiro para começares.</p><a href="#lembretes-novo" class="inline-flex mt-3 px-4 py-2 btn-primary">Criar lembrete</a></div>';
    else html = '<ul class="space-y-3">' + html + '</ul>';
    return pageHeader('Lembretes', null) +
      '<main class="app-main space-y-4 bg-white"><a href="#lembretes-novo" class="flex items-center gap-3 w-full py-3 px-4 rounded-xl btn-primary font-medium"><span class="material-icons">add_circle_outline</span><span>Adicionar lembrete</span></a>' + html + '</main>';
  }

  // ---------- stock ----------
  function stockSummary(medId) {
    var s = st(); var cfg = s.stockConfig[medId];
    if (!DailyMedV2.isConfigured(s, medId)) {
      return '<section class="med-detail-card" id="stock-card"><h4 class="med-detail-title">Stock</h4><p class="text-sm">O stock ainda não está configurado: as tomas são registadas, mas nada é descontado.</p>' +
        '<a href="#medicacao-stock?id=' + encodeURIComponent(medId) + '" class="btn-primary w-full mt-3">Configurar stock</a></section>';
    }
    var bal = DailyMedV2.stockBalance(s, medId), doses = DailyMedV2.dosesRemaining(s, medId), issues = DailyMedV2.openIssues(s, medId);
    var low = DailyMedV2.isLowStock(s, medId);
    return '<section class="med-detail-card" id="stock-card"><h4 class="med-detail-title">Stock</h4>' +
      '<p class="stock-balance"><span id="stock-balance">' + num(bal) + '</span> ' + esc(cfg.unit) + (bal === 1 ? '' : '(s)') + '</p>' +
      '<p class="text-sm">' + num(cfg.amountPerDose) + ' ' + esc(cfg.unit) + ' por toma · cerca de ' + doses + ' tomas restantes</p>' +
      (issues.length ? '<p class="stock-flag stock-flag--warn">Stock por confirmar: faz uma contagem ou confirma o saldo.</p>' : (low ? '<p class="stock-flag stock-flag--low">Stock baixo: restam cerca de ' + doses + ' tomas.</p>' : '')) +
      '<a href="#medicacao-stock?id=' + encodeURIComponent(medId) + '" class="btn-outline w-full mt-3">Gerir stock e ver movimentos</a></section>';
  }

  function viewStock(params) {
    var s = st(); var med = s && DailyMedV2.findMed(s, params.id);
    if (!med || med.removedAt) return pageHeader('Stock', '#medicacao') + '<main class="app-main"><p>Medicamento não encontrado.</p></main>';
    var medId = med.id, configured = DailyMedV2.isConfigured(s, medId), cfg = s.stockConfig[medId];
    var body = '';
    if (!configured) {
      var unitOpts = DailyMedV2.UNITS.map(function (u) { return '<option value="' + u + '">' + u + '</option>'; }).join('');
      body = '<form class="stock-form med-detail-card" id="form-stock-config" data-med="' + esc(medId) + '" data-op="' + oid() + '">' +
        '<h4 class="med-detail-title">Configurar stock</h4>' +
        '<p class="text-sm mb-2">Indica a unidade e quanto gastas em cada toma. A DailyMed só desconta o que configurares aqui; não deduz nada da posologia.</p>' +
        '<label class="med-form-label">Unidade</label><select name="unit" required class="w-full px-4 py-2.5 input-outline"><option value="">Escolher…</option>' + unitOpts + '</select>' +
        '<label class="med-form-label mt-2">Quantidade por toma</label><input name="amountPerDose" type="number" step="0.01" min="0.01" required class="w-full px-4 py-2.5 input-outline" />' +
        '<label class="med-form-label mt-2">Quantidade que tens agora (contagem inicial)</label><input name="initialQuantity" type="number" step="0.01" min="0" required class="w-full px-4 py-2.5 input-outline" value="' + (med.legacyQuantity != null ? esc(med.legacyQuantity) : '') + '" />' +
        '<button type="submit" class="btn-primary w-full mt-3">Guardar configuração</button></form>';
    } else {
      var bal = DailyMedV2.stockBalance(s, medId), doses = DailyMedV2.dosesRemaining(s, medId), issues = DailyMedV2.openIssues(s, medId);
      var form = function (kind, title, field, label, extra) {
        return '<details class="stock-op"><summary>' + title + '</summary><form class="stock-form" data-kind="' + kind + '" data-med="' + esc(medId) + '" data-op="' + oid() + '">' +
          (field ? '<label class="med-form-label">' + label + '</label><input name="' + field + '" type="number" step="0.01" min="0" required class="w-full px-4 py-2.5 input-outline" />' : '') +
          (extra || '') + '<button type="submit" class="btn-primary w-full mt-2">Guardar</button></form></details>';
      };
      body = '<section class="med-detail-card"><h4 class="med-detail-title">Saldo</h4>' +
        '<p class="stock-balance"><span id="stock-balance">' + num(bal) + '</span> ' + esc(cfg.unit) + '(s)</p>' +
        '<p class="text-sm">' + num(cfg.amountPerDose) + ' por toma · cerca de <span id="stock-doses">' + doses + '</span> tomas restantes</p>' +
        (issues.length ? '<div class="stock-flag stock-flag--warn" id="stock-review"><p><strong>Stock por confirmar.</strong></p>' + issues.map(function (i) {
          var rec = DailyMedV2.findRecord(s, i.doseRecordId);
          return '<p class="text-sm">Em ' + fmtDateTime(i.createdAt) + ' registaste uma toma (' + (rec && rec.dose ? num(rec.dose.amount) : '?') + ') quando o stock indicava ' + num(rec && rec.stock ? rec.stock.availableAtRecord : null) + '.</p>';
        }).join('') + '<p class="text-sm">Só uma contagem física ou a confirmação do saldo resolvem isto.</p></div>' : '') +
        (DailyMedV2.isLowStock(s, medId) ? '<p class="stock-flag stock-flag--low">Stock baixo: restam cerca de ' + doses + ' tomas.</p>' : '') +
        '</section>' +
        '<section class="space-y-2" id="stock-ops">' +
        form('entry', 'Nova embalagem (entrada)', 'quantity', 'Quantidade que entrou') +
        form('exit', 'Saída (deitei fora, perdi, dei)', 'quantity', 'Quantidade que saiu') +
        form('adjustment', 'Corrigir o valor (sem contar)', 'newQuantity', 'Novo valor do stock') +
        form('count', 'Contagem física', 'countedQuantity', 'Quantidade que contaste agora', '<label class="flex items-center gap-2 mt-2 text-sm"><input type="checkbox" name="confirmed" required /> Confirmo que contei agora todas as unidades.</label>') +
        '<button type="button" class="btn-outline w-full" data-action="stock-confirm" data-med="' + esc(medId) + '" data-op="' + oid() + '">O saldo está certo (confirmar)</button>' +
        '<details class="stock-op"><summary>Unidade e quantidade por toma</summary><form class="stock-form" data-kind="settings" data-med="' + esc(medId) + '" data-op="' + oid() + '">' +
        '<label class="med-form-label">Unidade</label><input type="hidden" name="unit" value="' + esc(cfg.unit) + '" />' +
        '<p class="text-sm" id="stock-unit-locked"><strong>' + esc(cfg.unit) + '</strong> — a unidade não pode ser alterada: o saldo e todos os movimentos já registados estão em ' + esc(cfg.unit) + ' e a app não converte unidades. Se passares a contar noutra unidade, regista uma contagem física na unidade atual.</p>' +
        '<label class="med-form-label mt-2">Quantidade por toma (' + esc(cfg.unit) + ')</label><input name="amountPerDose" type="number" step="0.01" min="0.01" required value="' + esc(cfg.amountPerDose) + '" class="w-full px-4 py-2.5 input-outline" />' +
        '<p class="text-sm mt-1">Mudar a quantidade por toma só vale para as tomas registadas a partir de agora. As tomas já registadas e os movimentos antigos ficam com os valores originais, e a alteração fica registada.</p>' +
        '<label class="flex items-center gap-2 mt-2 text-sm"><input type="checkbox" name="confirmAmountChange" /> Confirmo a nova quantidade por toma.</label>' +
        (cfg.changes && cfg.changes.length ? '<ul class="text-sm mt-2" id="stock-config-changes">' + cfg.changes.map(function (ch) { return '<li>' + esc(fmtDateTime(ch.at)) + ': quantidade por toma ' + num(ch.from) + ' → ' + num(ch.to) + '</li>'; }).join('') + '</ul>' : '') +
        '<button type="submit" class="btn-primary w-full mt-2">Guardar</button></form></details>' +
        '</section>';
    }
    var movs = DailyMedV2.movementsFor(s, medId).slice().reverse();
    var movHtml = movs.length ? '<ul class="mov-list" id="movements">' + movs.map(function (m) {
      var reverted = DailyMedV2.reversalOf(s, m.id);
      var canRevert = (m.type === 'entry' || m.type === 'exit' || m.type === 'adjustment') && !reverted;
      var deltaTxt = m.type === 'issue' || m.type === 'confirmation' ? '' : (m.delta > 0 ? '+' : '') + num(m.delta);
      return '<li class="mov-row" data-mov="' + esc(m.id) + '" data-type="' + m.type + '"><div><p class="mov-title">' + esc(MOV_LABEL[m.type] || m.type) + (deltaTxt ? ' <span class="mov-delta">' + deltaTxt + '</span>' : '') + '</p>' +
        '<p class="mov-sub">' + fmtDateTime(m.createdAt) + ' · ' + esc(MOV_REASON[m.reason] || m.reason || '') + (m.reversesMovementId ? ' · reverte ' + esc(m.reversesMovementId) : '') + (reverted ? ' · revertido' : '') + '</p></div>' +
        '<div class="mov-right"><p class="mov-balance">' + (m.balanceAfter != null ? num(m.balanceAfter) : '') + '</p>' +
        (canRevert ? '<button type="button" class="slot-btn slot-btn--ghost" data-action="stock-revert" data-mov="' + esc(m.id) + '" data-op="' + oid() + '">Reverter</button>' : '') + '</div></li>';
    }).join('') + '</ul>' : '<p class="text-sm text-on-surface-variant">Ainda não há movimentos.</p>';
    return pageHeader('Stock · ' + (med.name || ''), '#medicacao-detalhes?id=' + encodeURIComponent(medId)) +
      '<main class="app-main space-y-4 bg-white">' + body + '<section class="space-y-2"><h4 class="med-detail-title">Movimentos</h4>' + movHtml + '</section></main>';
  }

  // ---------- histórico ----------
  function viewHistoryV2(params) {
    var s = st();
    var medId = params && params.med ? params.med : null;
    var entries = DailyMedV2.historyEntries(s, medId ? { medicationId: medId } : {});
    var meds = s.medications;
    var filter = '<select id="history-filter" class="w-full px-4 py-2.5 input-outline"><option value="">Todos os medicamentos</option>' +
      meds.map(function (m) { return '<option value="' + esc(m.id) + '"' + (m.id === medId ? ' selected' : '') + '>' + esc(m.name) + (m.removedAt ? ' (removido)' : '') + '</option>'; }).join('') + '</select>';
    var groups = {}, order = [];
    entries.forEach(function (r) {
      var day = r.scheduledDate || (r.legacyLocalDateTime ? r.legacyLocalDateTime.slice(0, 10) : 'sem data');
      if (r.status === 'legacy_unverified') day = 'importados';
      if (!groups[day]) { groups[day] = []; order.push(day); }
      groups[day].push(r);
    });
    var html = order.map(function (day) {
      var title = day === 'importados' ? 'Registos importados da versão anterior' : (day === 'sem data' ? 'Sem data' : new Date(day + 'T12:00:00').toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' }));
      return '<section class="space-y-2"><h4 class="section-label">' + esc(title) + '</h4><ul class="space-y-2">' + groups[day].map(function (r) {
        var line;
        if (r.status === 'legacy_unverified') line = '<p class="text-sm">Registo importado da versão anterior — estado não confirmado</p><p class="text-xs text-on-surface-variant">' + esc(r.legacy ? r.legacy.dateTime : '') + '</p>';
        else {
          var st2 = r.status === 'taken' ? 'Tomada' : 'Não tomada' + (r.notTakenReason ? ' · ' + REASONS[r.notTakenReason] : '');
          line = '<p class="text-sm">' + esc(st2) + ' · previsto ' + esc(r.scheduledTime) + ' · registado ' + fmtDateTime(r.recordedAt) + '</p>' +
            (r.revisions.length > 1 ? '<p class="text-xs text-on-surface-variant">Corrigido ' + (r.revisions.length - 1) + ' vez(es)</p>' : '');
        }
        return '<li class="history-row" data-record="' + esc(r.id) + '" data-status="' + r.status + '"><p class="font-medium">' + esc(r.medicationSnapshot.name) + ' <span class="text-xs">' + esc(r.medicationSnapshot.dosage) + '</span></p>' + line + '</li>';
      }).join('') + '</ul></section>';
    }).join('');
    if (!entries.length) html = '<p class="text-on-surface-variant">Ainda não há tomas registadas.</p>';
    return pageHeader('Histórico de tomas', '#home') + '<main class="app-main space-y-4 bg-white">' + filter + html + '</main>';
  }

  // ---------- atualização dos dados (migração explícita) ----------
  var migrationUi = { running: false, log: [], result: null, error: null };
  function viewRecovery(s) {
    var a = DMStore.assessInstallation();
    var c = a.counts;
    var canAct = s.hasLocks && s.isWriter;
    var reason = s.notices.damaged || a.reason;
    return pageHeader('Recuperação dos dados', '#definicoes') + '<main class="app-main space-y-4 bg-white" id="recovery">' +
      '<section class="med-detail-card"><h4 class="med-detail-title">O que se passa</h4>' +
      '<p class="text-sm" id="recovery-reason" data-reason="' + esc(reason) + '">' + esc(DAMAGED_MSG[reason] || DAMAGED_MSG.default) + '</p>' +
      '<p class="text-sm mt-2">A app não vai fazer a atualização nem gravar nada enquanto isto não for resolvido. Os dados antigos e os dados da versão 2 continuam guardados.</p></section>' +
      '<section class="med-detail-card"><h4 class="med-detail-title">Dados da versão 2 encontrados</h4>' +
      (a.hasV2 ? (a.v2Valid ? '<p class="text-sm" id="recovery-v2">' + c.medications + ' medicamentos · ' + c.reminders + ' lembretes · ' + c.doseRecords + ' registos de toma · ' + c.stockMovements + ' movimentos de stock' + (a.lastActivity ? ' · última alteração em ' + esc(fmtDateTime(a.lastActivity)) : '') + '. Passam todas as verificações.</p>'
        : '<p class="text-sm" id="recovery-v2">Existem, mas não passam as verificações (' + esc(a.v2Errors.join('; ')) + '). Não podem ser reativados automaticamente.</p>')
        : '<p class="text-sm" id="recovery-v2">Nenhum.</p>') + '</section>' +
      '<button type="button" class="btn-outline w-full" data-action="export">1. Descarregar cópia de tudo (recomendado)</button>' +
      (!canAct ? '<p class="dm-banner dm-banner--warning">' + (s.hasLocks ? 'Fecha os outros separadores da DailyMed (ou toca em "Usar este separador") para poderes reparar.' : 'Este browser não permite reparar com segurança. Exporta a cópia e abre a DailyMed num browser atualizado.') + '</p>' : '') +
      (a.v2Valid ? '<button type="button" class="btn-primary w-full" id="btn-repair-v2" data-action="repair" data-repair="reactivate_v2"' + (canAct ? '' : ' disabled') + '>2. Continuar com estes dados da versão 2</button>' +
        '<p class="text-sm">Só regrava o marcador de versão. Não apaga nem altera nenhum dado. Se usaste uma versão antiga da app depois desta data, essas alterações não estão nestes dados.</p>' : '') +
      (!a.hasV2 ? '<button type="button" class="btn-primary w-full" id="btn-repair-v1" data-action="repair" data-repair="mark_v1"' + (canAct ? '' : ' disabled') + '>2. Continuar com os dados da versão 1</button>' +
        '<p class="text-sm">Não existem dados da versão 2 para proteger. Só regrava o marcador de versão; os dados antigos ficam como estão.</p>' : '') +
      (a.hasV2 && !a.v2Valid ? '<p class="text-sm">Guarda a cópia e pede ajuda. Não tentes atualizar outra vez: a app não vai substituir estes dados.</p>' : '') +
      (recoveryUi.error ? '<p class="dm-banner dm-banner--danger" id="repair-error">' + esc(recoveryUi.error) + '</p>' : '') +
      '</main>';
  }
  var recoveryUi = { error: null };
  function runRepairFromUi(action) {
    var txt = action === 'reactivate_v2' ? 'Vamos continuar com os dados da versão 2 que estão neste browser. Nada é apagado. Continuar?'
      : 'Vamos continuar com os dados da versão 1. Nada é apagado. Continuar?';
    if (!confirm(txt)) return;
    DMStore.repairMarker(action).then(function () { location.reload(); })
      .catch(function (e) { recoveryUi.error = e.message; runRoute(); });
  }

  function viewMigration() {
    var s = DMStore.status();
    if (s.loadedStatus === 'damaged') return viewRecovery(s);
    if (s.mode === 'v2' && migrationUi.result) {
      var cc = migrationUi.result.report.counts;
      return pageHeader('Atualizar os dados', '#home') + '<main class="app-main space-y-4 bg-white"><div class="dm-banner dm-banner--ok" id="migration-ok"><p>Atualização concluída: ' + cc.medications + ' medicamentos, ' + cc.reminders + ' lembretes e ' + cc.legacy + ' registos antigos (não confirmados). ' + (cc.imagesRejected ? cc.imagesRejected + ' fotografia(s) inválida(s) não foram copiadas. ' : '') + 'Os dados antigos ficaram guardados.</p><button type="button" class="dm-banner-btn" data-action="reload">Abrir a nova versão</button></div></main>';
    }
    if (s.mode === 'v2') return pageHeader('Dados', '#definicoes') + '<main class="app-main"><p>Os teus dados já estão na versão 2.</p></main>';
    var pre = DMStore.preflight();
    var c = pre.report.counts;
    var warn = pre.report.warnings.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('');
    var err = pre.report.errors.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('');
    var can = pre.ok && pre.locks && s.isWriter && !s.blockReason;
    var blockedMsg = !pre.locks ? 'Este browser não suporta Web Locks: a atualização não pode ser feita com segurança aqui. Atualiza o browser.'
      : (!s.isWriter ? 'A DailyMed está aberta noutro separador. Fecha os outros separadores (ou toca em "Usar este separador") antes de atualizar.' : '');
    var progress = migrationUi.log.length ? '<ol class="migration-log" id="migration-log">' + migrationUi.log.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ol>' : '';
    var outcome = '';
    if (migrationUi.result) outcome = '<div class="dm-banner dm-banner--ok" id="migration-ok"><p>Atualização concluída. ' + migrationUi.result.report.counts.medications + ' medicamentos, ' + migrationUi.result.report.counts.reminders + ' lembretes e ' + migrationUi.result.report.counts.legacy + ' registos antigos (não confirmados).</p><button type="button" class="dm-banner-btn" data-action="reload">Abrir a nova versão</button></div>';
    if (migrationUi.error) outcome = '<div class="dm-banner dm-banner--danger" id="migration-error"><p>A atualização não foi feita: ' + esc(migrationUi.error) + ' Os teus dados antigos estão intactos.</p></div>';
    return pageHeader('Atualizar os dados', '#definicoes') +
      '<main class="app-main space-y-4 bg-white">' +
      '<section class="med-detail-card"><h4 class="med-detail-title">O que muda</h4><ul class="text-sm list-disc pl-5 space-y-1">' +
      '<li>Cada horário de cada lembrete passa a ter o seu registo: "Tomei" às 08:00 não marca as 14:00.</li>' +
      '<li>O stock passa a ser um registo de movimentos (entradas, saídas, contagens, tomas). Só é descontado nos medicamentos em que configurares a quantidade por toma.</li>' +
      '<li>O histórico antigo fica guardado como "não confirmado", porque a versão anterior não apagava as tomas desfeitas.</li>' +
      '<li>Os dados antigos não são apagados nem alterados. É feita uma cópia de segurança antes de começar.</li></ul></section>' +
      '<section class="med-detail-card"><h4 class="med-detail-title">Verificação dos teus dados</h4>' +
      '<p class="text-sm" id="preflight-counts">' + c.medications + ' medicamentos · ' + c.reminders + ' lembretes · ' + c.legacy + ' registos de histórico · ' + c.images + ' fotografias válidas</p>' +
      (err ? '<p class="text-sm font-semibold mt-2">Problemas que impedem a atualização:</p><ul class="text-sm list-disc pl-5" id="preflight-errors">' + err + '</ul>' : '') +
      (warn ? '<p class="text-sm font-semibold mt-2">Avisos:</p><ul class="text-sm list-disc pl-5" id="preflight-warnings">' + warn + '</ul>' : '') + '</section>' +
      (blockedMsg ? '<p class="dm-banner dm-banner--warning">' + esc(blockedMsg) + '</p>' : '') +
      '<button type="button" class="btn-outline w-full" data-action="export">Descarregar cópia dos meus dados (recomendado)</button>' +
      (migrationUi.result ? '' : '<button type="button" class="btn-primary w-full" id="btn-migrate" data-action="migrate"' + (can && !migrationUi.running ? '' : ' disabled') + '>Começar a atualização</button>' +
      '<a href="#definicoes" class="btn-ghost w-full" id="btn-migrate-cancel">Cancelar</a>') +
      progress + outcome + '</main>';
  }

  function runMigrationFromUi() {
    if (migrationUi.running) return;
    if (!confirm('Vamos criar uma cópia de segurança e atualizar os dados para a versão 2. Os dados antigos ficam guardados. Continuar?')) return;
    migrationUi = { running: true, log: [], result: null, error: null };
    runRoute();
    DMStore.migrate(function (text) { migrationUi.log.push(text); var el = document.getElementById('migration-log'); if (el) el.insertAdjacentHTML('beforeend', '<li>' + esc(text) + '</li>'); else runRoute(); })
      .then(function (res) { migrationUi.running = false; migrationUi.result = res; runRoute(); })
      .catch(function (e) { migrationUi.running = false; migrationUi.error = e.message; runRoute(); });
  }

  function dataSection() {
    var s = DMStore.status();
    var modeTxt = s.loadedStatus === 'damaged' ? 'Em recuperação (só leitura)' : (s.mode === 'v2' ? 'Versão 2 (tomas por horário e stock por movimentos)' : 'Versão 1');
    var writer = s.blockReason ? 'Só de leitura' : 'Pode gravar';
    return '<section class="p-4 rounded-xl border border-gray-200 space-y-2" id="data-section"><p class="font-medium text-black">Dados</p>' +
      '<p class="text-sm" id="data-mode">' + esc(modeTxt) + '</p><p class="text-sm" id="data-writer">Este separador: ' + esc(writer) + '</p>' +
      '<button type="button" class="btn-outline w-full" data-action="export">Descarregar cópia dos dados</button>' +
      (s.loadedStatus === 'damaged' ? '<a href="#atualizar-dados" class="btn-primary w-full" id="link-recovery-settings">Recuperação dos dados</a>'
        : (s.mode === 'v1' ? '<a href="#atualizar-dados" class="btn-primary w-full" id="link-migrate">Atualizar para a versão 2</a>' : '')) + '</section>';
  }

  // ---------- ações ----------
  function slotOp(el, extra) {
    var op = { operationId: el.dataset.op, reminderId: el.dataset.reminder, date: el.dataset.date, time: el.dataset.time };
    for (var k in extra) op[k] = extra[k];
    return op;
  }
  function afterDose(res) {
    if (res && res.status === 'applied' && res.stock && res.stock.reason === 'insufficient_stock') {
      showToast('Toma registada. O stock (' + num(res.stock.availableAtRecord) + ') é menor do que a dose: nada foi descontado. Confirma o stock.', 'warning');
      return true;
    }
    return false;
  }

  function handleAction(el, ev) {
    var a = el.dataset.action;
    if (a === 'reload') { location.reload(); return; }
    if (a === 'handover') { DMStore.requestHandover(); showToast('A pedir ao outro separador para libertar a escrita…', 'sync'); return; }
    if (a === 'dismiss') { DMStore.dismissNotice(el.dataset.notice); refreshBanners(); return; }
    if (a === 'export') {
      DMStore.downloadExport().then(function (r) { showToast('Cópia gerada e transferência iniciada (' + r.fileName + '). Confirma no teu dispositivo que o ficheiro ficou guardado.', 'download'); })
        .catch(function () { showToast('Não foi possível gerar a cópia.', 'error'); });
      return;
    }
    if (a === 'migrate') { runMigrationFromUi(); return; }
    if (a === 'repair') { runRepairFromUi(el.dataset.repair); return; }
    if (!isV2()) return;
    el.disabled = true;
    var res;
    if (a === 'dose-taken') {
      res = DMStore.applyV2(slotOp(el, { type: 'record_dose', status: 'taken' }));
      if (!afterDose(res)) report(res, 'Toma registada.'); else { /* já mostrou */ }
      if (res && res.status === 'applied') playSuccessChime();
    } else if (a === 'dose-not-taken') {
      var sel = document.querySelector('[data-reason-for="' + CSS.escape(el.dataset.slot) + '"]');
      res = DMStore.applyV2(slotOp(el, { type: 'record_dose', status: 'not_taken', reason: sel && sel.value ? sel.value : null }));
      report(res, 'Registado: não tomada.');
    } else if (a === 'dose-snooze') {
      res = DMStore.applyV2({ operationId: el.dataset.op, type: 'snooze', slotKey: el.dataset.slot, minutes: 15 });
      report(res, 'Adiado 15 minutos.');
    } else if (a === 'dose-change') {
      res = DMStore.applyV2({ operationId: el.dataset.op, type: 'change_status', doseRecordId: el.dataset.record, to: el.dataset.to, expectedRevision: +el.dataset.rev });
      if (!afterDose(res)) report(res, 'Registo corrigido.');
    } else if (a === 'dose-void') {
      if (!confirm('Anular este registo? Se tinha descontado stock, o stock é reposto (exceto se já fizeste uma contagem depois).')) { el.disabled = false; return; }
      res = DMStore.applyV2({ operationId: el.dataset.op, type: 'void_record', doseRecordId: el.dataset.record, expectedRevision: +el.dataset.rev });
      report(res, 'Registo anulado.');
    } else if (a === 'stock-confirm') {
      if (!confirm('Confirmas que o saldo indicado é o que tens agora?')) { el.disabled = false; return; }
      res = DMStore.applyV2({ operationId: el.dataset.op, type: 'stock_confirm', medicationId: el.dataset.med });
      report(res, 'Saldo confirmado.');
    } else if (a === 'stock-revert') {
      if (!confirm('Reverter este movimento? Fica registado um movimento de reversão.')) { el.disabled = false; return; }
      res = DMStore.applyV2({ operationId: el.dataset.op, type: 'stock_revert', movementId: el.dataset.mov });
      report(res, 'Movimento revertido.');
    } else { el.disabled = false; return; }
    checkMedicationAlerts();
    runRoute();
  }

  function handleSubmit(form) {
    if (!isV2()) return false;
    var fd = new FormData(form);
    var med = form.dataset.med, opId = form.dataset.op, res, msg;
    if (form.id === 'form-stock-config') {
      res = DMStore.applyV2({ operationId: opId, type: 'stock_config', medicationId: med, unit: fd.get('unit'), amountPerDose: Number(fd.get('amountPerDose')), initialQuantity: Number(fd.get('initialQuantity')) });
      msg = 'Stock configurado.';
    } else {
      var kind = form.dataset.kind;
      if (kind === 'entry') { res = DMStore.applyV2({ operationId: opId, type: 'stock_entry', medicationId: med, quantity: Number(fd.get('quantity')) }); msg = 'Entrada registada.'; }
      else if (kind === 'exit') { res = DMStore.applyV2({ operationId: opId, type: 'stock_exit', medicationId: med, quantity: Number(fd.get('quantity')) }); msg = 'Saída registada.'; }
      else if (kind === 'adjustment') {
        if (!confirm('Corrigir o valor sem contar não resolve um "stock por confirmar". Continuar?')) return true;
        res = DMStore.applyV2({ operationId: opId, type: 'stock_adjustment', medicationId: med, newQuantity: Number(fd.get('newQuantity')) }); msg = 'Stock ajustado.';
      }
      else if (kind === 'count') { res = DMStore.applyV2({ operationId: opId, type: 'stock_count', medicationId: med, countedQuantity: Number(fd.get('countedQuantity')) }); msg = 'Contagem registada.'; }
      else if (kind === 'settings') { res = DMStore.applyV2({ operationId: opId, type: 'stock_config', medicationId: med, unit: fd.get('unit'), amountPerDose: Number(fd.get('amountPerDose')), confirmAmountChange: fd.get('confirmAmountChange') === 'on' }); msg = 'Quantidade por toma atualizada.'; }
      else return false;
    }
    report(res, msg);
    checkMedicationAlerts();
    runRoute();
    return true;
  }

  function onStoreEvent(kind, detail) {
    if (kind === 'writer' || kind === 'outdated' || kind === 'notice' || kind === 'external') refreshBanners();
    // O ecrã de atualização/recuperação depende de este separador poder gravar: redesenha quando isso muda.
    if (kind === 'writer' && /^#atualizar-dados/.test(location.hash)) runRoute();
    if (kind === 'recovered' || kind === 'damaged') runRoute();
    if (kind === 'blocked') { var now = Date.now(); if (!onStoreEvent._t || now - onStoreEvent._t > 4000) { onStoreEvent._t = now; showToast('Este separador não pode gravar agora. Vê o aviso no topo.', 'lock'); } refreshBanners(); }
    if (kind === 'storage_error') showToast('Não foi possível guardar: o armazenamento do browser recusou a gravação.', 'error');
    if (kind === 'data' && detail === 'external') {
      var path = (parseHash().path || 'home');
      if (['home', 'lembretes', 'medicacao-armario', 'medicacao-detalhes', 'medicacao-stock', 'medicacao-historico'].indexOf(path) !== -1 && !document.querySelector('.stock-form input:focus, details[open]')) runRoute();
    }
  }

  return {
    isV2: isV2, banners: banners, refreshBanners: refreshBanners, viewHomeV2: viewHomeV2, viewLembretesV2: viewLembretesV2,
    stockSummary: stockSummary, viewStock: viewStock, viewHistoryV2: viewHistoryV2, viewMigration: viewMigration, dataSection: dataSection,
    handleAction: handleAction, handleSubmit: handleSubmit, onStoreEvent: onStoreEvent, report: report, todaySlots: todaySlots,
  };
})();
