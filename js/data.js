/**
 * DailyMed - INFOMED list and drug interactions
 * Sem servidor: usa window.LISTA_INFOMED se existir (lista_infomed_data.js).
 */

let infomedList = [];
let infomedLoadPromise = null;

if (typeof window !== 'undefined' && window.LISTA_INFOMED && Array.isArray(window.LISTA_INFOMED)) {
  infomedList = window.LISTA_INFOMED;
}

function isFileProtocol() {
  return typeof window !== 'undefined' && window.location && window.location.protocol === 'file:';
}

function loadInfomed() {
  if (infomedLoadPromise) return infomedLoadPromise;
  if (infomedList.length > 0) {
    infomedLoadPromise = Promise.resolve(infomedList);
    return infomedLoadPromise;
  }
  if (typeof window !== 'undefined' && window.LISTA_INFOMED && Array.isArray(window.LISTA_INFOMED)) {
    infomedList = window.LISTA_INFOMED;
    infomedLoadPromise = Promise.resolve(infomedList);
    return infomedLoadPromise;
  }
  if (isFileProtocol()) {
    infomedLoadPromise = Promise.resolve([]);
    return infomedLoadPromise;
  }
  infomedLoadPromise = fetch('lista_infomed.json')
    .then(function (r) {
      if (!r.ok) throw new Error('Falha ao carregar lista');
      return r.json();
    })
    .then(function (arr) {
      infomedList = Array.isArray(arr) ? arr : [];
      return infomedList;
    })
    .catch(function (err) {
      console.warn('DailyMed: erro a carregar lista_infomed.json', err);
      infomedList = [];
      infomedLoadPromise = null;
      return [];
    });
  return infomedLoadPromise;
}

function getInfomedReady() {
  if (infomedList.length > 0) return Promise.resolve(infomedList);
  return loadInfomed();
}

function getSubstanceKey(item) {
  if (!item) return null;
  var k = Object.keys(item).find(function (key) { return key.includes('Substância') && key.includes('Ativa'); });
  return k || 'Substância Ativa/DCI';
}

function getItemDisplay(item) {
  if (!item) return { name: '', dosage: '', substance: '', titular: '' };
  var name = item['Nome do Medicamento'] || '';
  var dosage = item['Dosagem'] || '';
  var substanceKey = getSubstanceKey(item);
  var substance = item[substanceKey] || '';
  var titular = item['Titular de AIM'] || '';
  return { name: name, dosage: dosage, substance: substance, titular: titular };
}

function searchInfomed(query, limit) {
  if (limit === undefined) limit = 10;
  var q = (query || '').trim().toLowerCase();
  if (q.length < 2) return [];
  if (infomedList.length === 0) return [];
  var nameKey = 'Nome do Medicamento';
  var results = [];
  for (var i = 0; i < infomedList.length && results.length < limit; i++) {
    var item = infomedList[i];
    var name = (item[nameKey] || '').toLowerCase();
    var substanceKey = getSubstanceKey(item);
    var substance = (item[substanceKey] || '').toLowerCase();
    if (name.includes(q) || substance.includes(q)) {
      results.push(item);
    }
  }
  return results;
}

var KNOWN_INTERACTIONS = [
  { id: 'sildenafil-brufen', severity: 'grave', color: '#D32F2F', drug1: ['sildenafil'], drug2: ['brufen', 'ibuprofeno'], combination: 'Sildenafil + Brufen/Ibuprofeno', mechanism: 'A associação de nitroglicerina (antianginoso) e sildenafil (disfunção erétil) pode aumentar o risco de hipotensão grave (efeito aditivo). Não devem ser coadministrados.' },
  { id: 'lisinopril-brufen', severity: 'ligeira', color: '#F9A825', drug1: ['lisinopril'], drug2: ['brufen', 'ibuprofeno'], combination: 'Lisinopril + Brufen/Ibuprofeno', mechanism: 'O uso crónico de ibuprofeno pode reduzir o efeito antihipertensor e hemodinâmico favorável do lisinopril por inibição das prostaglandinas vasodilatadoras. Aumento do risco de hipercaliemia.' },
  { id: 'xarelto-brufen', severity: 'moderada', color: '#2E7D32', drug1: ['xarelto', 'rivaroxabano'], drug2: ['brufen', 'ibuprofeno'], combination: 'Xarelto/Rivaroxabano + Brufen/Ibuprofeno', mechanism: 'O ibuprofeno (AINE) pode induzir erosão gástrica e inibição plaquetária. A associação com rivaroxabano (anticoagulante) aumenta o risco de hemorragias.' }
];

function getSearchableText(med) {
  var name = (med.name || '').toLowerCase();
  var substance = (med.substance || '').toLowerCase();
  return (name + ' ' + substance).trim();
}

function textContainsAnyKeywords(text, keywords) {
  return keywords.some(function (k) { return text.includes(k); });
}

function detectInteractions(medications) {
  var list = Array.isArray(medications) ? medications : getMedications();
  var detected = [];
  for (var i = 0; i < KNOWN_INTERACTIONS.length; i++) {
    var interaction = KNOWN_INTERACTIONS[i];
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

function getKnownInteractions() {
  return KNOWN_INTERACTIONS;
}
