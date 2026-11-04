/*
 * DailyMed - Core utilities (browser + tests)
 */

(function (global) {
  'use strict';

  function todayStr(date) {
    var d = date instanceof Date ? date : new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function parseYMDToLocal(dateStr) {
    if (!dateStr) return null;
    var parts = String(dateStr).split('-');
    if (parts.length !== 3) return null;
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    var d = parseInt(parts[2], 10);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  function formatDateYMD(dateStr) {
    if (!dateStr) return '';
    var d = String(dateStr).split('-');
    if (d.length !== 3) return dateStr;
    return d[2] + '/' + d[1] + '/' + d[0];
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function cleanNotesFromLegacy(notes) {
    if (!notes || typeof notes !== 'string') return notes || '';
    return notes
      .replace(/\s*Posologia:\s*---\.?\s*Indicação:\s*---\.?\s*/gi, '')
      .replace(/\s*Indicação:\s*---\.?\s*/gi, '')
      .replace(/\s*Posologia:\s*---\.?\s*/gi, '')
      .trim();
  }

  function getValidityStatus(expiryDate, todayDate) {
    if (!expiryDate) return { label: 'Válido', type: 'ok' };
    var today = todayDate instanceof Date ? new Date(todayDate) : new Date();
    today.setHours(0, 0, 0, 0);
    var exp = parseYMDToLocal(expiryDate);
    if (!exp) return { label: 'Válido', type: 'ok' };
    exp.setHours(0, 0, 0, 0);
    if (exp < today) return { label: 'Expirado', type: 'expired' };
    var days = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    if (days <= 30) return { label: 'Expira em breve', type: 'soon' };
    return { label: 'Válido', type: 'ok' };
  }

  function parseHash(hashStr) {
    var raw = typeof hashStr === 'string'
      ? hashStr
      : (typeof window !== 'undefined' && window.location && window.location.hash) || '#home';
    var hash = (raw || '#home').replace(/^#/, '');
    var parts = hash.split('?');
    var path = parts[0] || 'home';
    var params = {};
    if (parts[1]) {
      parts[1].split('&').forEach(function (p) {
        var kv = p.split('=');
        params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
      });
    }
    return { path: path, params: params };
  }

  function timeToMinutes(t) {
    var parts = (t || '').split(':');
    var h = parseInt(parts[0] || '0', 10);
    var m = parseInt(parts[1] || '0', 10);
    return h * 60 + m;
  }

  function minutesToTime(min) {
    var h = Math.floor(min / 60);
    var m = min % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }

  function buildTimeGrid(start, end, step) {
    var startMin = timeToMinutes(start);
    var endMin = timeToMinutes(end);
    var s = step || 30;
    var out = [];
    for (var m = startMin; m <= endMin; m += s) out.push(minutesToTime(m));
    return out;
  }

  function toggleTimeSelection(selectedTimes, time, max) {
    var maxCount = max || 3;
    var next = Array.isArray(selectedTimes) ? selectedTimes.slice() : [];
    var idx = next.indexOf(time);
    if (idx !== -1) {
      next.splice(idx, 1);
      return { times: next, exceeded: false };
    }
    if (next.length >= maxCount) return { times: next, exceeded: true };
    next.push(time);
    return { times: next, exceeded: false };
  }

  function pickPeriodId(initialTimes, periods) {
    var list = Array.isArray(periods) ? periods : [];
    if (initialTimes && initialTimes.length) {
      var t0 = initialTimes[0];
      var baseMin = timeToMinutes(t0);
      for (var i = 0; i < list.length; i++) {
        var p = list[i];
        if (!p.start || !p.end) continue;
        var s = timeToMinutes(p.start);
        var e = timeToMinutes(p.end);
        if (baseMin >= s && baseMin <= e) return p.id;
      }
    }
    return list[0] ? list[0].id : null;
  }

  function getSearchableText(med) {
    var name = (med && med.name ? med.name : '').toLowerCase();
    var substance = (med && med.substance ? med.substance : '').toLowerCase();
    return (name + ' ' + substance).trim();
  }

  function textContainsAnyKeywords(text, keywords) {
    return Array.isArray(keywords) && keywords.some(function (k) { return text.includes(k); });
  }

  /**
   * Textos do ecrã de interações. A lista de regras é limitada, por isso
   * uma lista vazia nunca é apresentada como garantia de segurança.
   */
  function interactionCheckTexts(knownCount) {
    var n = Number(knownCount) || 0;
    var regras = n === 1 ? '1 combinação' : n + ' combinações';
    return {
      limitNotice: 'Verificação limitada: a app só conhece ' + regras + ' de medicamentos. ' +
        'Não encontrar uma interação aqui não significa que ela não exista. ' +
        'Antes de juntares medicamentos, fala com o teu farmacêutico ou médico.',
      emptyMessage: 'Nenhuma das ' + regras + ' que a app conhece foi encontrada no teu armário.',
    };
  }

  /** Estado de revisão de uma regra de interação (ex.: texto retirado por estar incorreto). */
  function interactionReviewInfo(interaction) {
    if (interaction && interaction.reviewStatus === 'em_revisao') {
      return {
        inReview: true,
        label: 'Em revisão',
        severityLabel: 'Gravidade por confirmar',
        note: interaction.reviewNote || 'Esta regra está a aguardar validação por um farmacêutico.',
      };
    }
    return { inReview: false, label: '', severityLabel: '', note: '' };
  }

  // Cores definidas aqui, nunca lidas dos dados: o campo "color" das regras é ignorado.
  // Uma regra em revisão fica sempre a cinzento, para não sugerir uma gravidade confirmada.
  var INTERACTION_TONES = {
    grave: '#B3261E',
    moderada: '#E65100',
    ligeira: '#F9A825',
    revisao: '#757575',
    desconhecida: '#757575',
  };

  /**
   * Como apresentar uma regra de interação.
   * Estados: 'em_revisao' (texto retirado, gravidade por confirmar),
   * 'validada' (revista por um farmacêutico) e 'por_validar' (por omissão: tem texto, mas ninguém o validou).
   */
  function interactionDisplay(interaction) {
    var i = interaction || {};
    var rev = interactionReviewInfo(i);
    if (rev.inReview) {
      return {
        status: 'em_revisao', statusLabel: rev.label, severityLabel: rev.severityLabel,
        color: INTERACTION_TONES.revisao, showMechanism: false, note: rev.note,
      };
    }
    var sev = Object.prototype.hasOwnProperty.call(INTERACTION_TONES, i.severity) && i.severity !== 'revisao' ? i.severity : 'desconhecida';
    var validated = i.reviewStatus === 'validada';
    return {
      status: validated ? 'validada' : 'por_validar',
      statusLabel: validated ? 'Validada por farmacêutico' : 'Texto por validar',
      severityLabel: sev === 'desconhecida' ? 'Gravidade não indicada' : 'Gravidade indicada: ' + sev,
      color: INTERACTION_TONES[sev],
      showMechanism: !!i.mechanism,
      note: validated ? '' : 'Esta descrição ainda não foi revista por um farmacêutico.',
    };
  }

  /** Separa as combinações encontradas: com descrição vs. regras em revisão (gravidade por confirmar). */
  function groupDetectedInteractions(detected) {
    var list = Array.isArray(detected) ? detected : [];
    var described = [], inReview = [];
    for (var k = 0; k < list.length; k++) {
      if (interactionReviewInfo(list[k]).inReview) inReview.push(list[k]); else described.push(list[k]);
    }
    return { described: described, inReview: inReview };
  }

  /** HTML de um cartão de regra. Todo o texto passa por escapeHtml; a cor vem de INTERACTION_TONES. */
  function renderInteractionItem(interaction, variant) {
    var i = interaction || {};
    var d = interactionDisplay(i);
    var cls = variant === 'compact' ? 'p-2 rounded border border-outline' : 'p-3 rounded-xl border border-outline';
    var badge = d.status === 'em_revisao'
      ? '<span class="material-icons text-base align-middle" aria-hidden="true">pending</span> '
      : '';
    return '<li class="' + cls + '" style="border-left-width:4px;border-left-style:solid;border-left-color:' + d.color + '"' +
      ' data-interaction="' + escapeHtml(i.id) + '" data-status="' + d.status + '"' +
      (d.status === 'em_revisao' ? ' data-review="em_revisao"' : '') + '>' +
      '<p class="font-medium">' + escapeHtml(i.combination) + '</p>' +
      '<p class="interaction-status text-sm font-semibold mt-1">' + badge + escapeHtml(d.statusLabel) + '</p>' +
      '<p class="interaction-severity text-sm">' + escapeHtml(d.severityLabel) + '</p>' +
      (d.showMechanism ? '<p class="text-sm mt-1">' + escapeHtml(i.mechanism) + '</p>' : '') +
      (d.note ? '<p class="interaction-note text-sm mt-1">' + escapeHtml(d.note) + '</p>' : '') +
      '</li>';
  }

  var REVIEW_MATCH_TEXT = 'Encontrámos no teu armário uma combinação cuja regra a app ainda está a rever. ' +
    'Isto não confirma nem exclui uma interação. Fala com o teu farmacêutico antes de tomares estes medicamentos juntos.';

  function detectInteractions(medications, knownInteractions) {
    var list = Array.isArray(medications) ? medications : [];
    var interactions = Array.isArray(knownInteractions) ? knownInteractions : [];
    var detected = [];
    for (var i = 0; i < interactions.length; i++) {
      var interaction = interactions[i];
      var has1 = false, has2 = false;
      for (var j = 0; j < list.length; j++) {
        var text = getSearchableText(list[j]);
        if (textContainsAnyKeywords(text, interaction.drug1)) has1 = true;
        if (textContainsAnyKeywords(text, interaction.drug2)) has2 = true;
      }
      if (has1 && has2) detected.push(interaction);
    }
    return detected;
  }

  var core = {
    todayStr: todayStr,
    formatDateYMD: formatDateYMD,
    escapeHtml: escapeHtml,
    cleanNotesFromLegacy: cleanNotesFromLegacy,
    getValidityStatus: getValidityStatus,
    parseHash: parseHash,
    timeToMinutes: timeToMinutes,
    minutesToTime: minutesToTime,
    buildTimeGrid: buildTimeGrid,
    toggleTimeSelection: toggleTimeSelection,
    pickPeriodId: pickPeriodId,
    getSearchableText: getSearchableText,
    textContainsAnyKeywords: textContainsAnyKeywords,
    detectInteractions: detectInteractions,
    interactionCheckTexts: interactionCheckTexts,
    interactionReviewInfo: interactionReviewInfo,
    interactionDisplay: interactionDisplay,
    groupDetectedInteractions: groupDetectedInteractions,
    renderInteractionItem: renderInteractionItem,
    INTERACTION_TONES: INTERACTION_TONES,
    REVIEW_MATCH_TEXT: REVIEW_MATCH_TEXT,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = core;
  if (global) global.DailyMedCore = core;
})(typeof window !== 'undefined' ? window : globalThis);
