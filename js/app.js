/**
 * DailyMed - SPA Router and Views
 */

const CATEGORIAS = [
  'Diarreia', 'Dores de Cabeça', 'Dores Musculares', 'Estômago', 'Febre', 'Garganta',
  'Gripes e Constipações', 'Insónias', 'Irritação Ocular', 'Pele', 'Tosse', 'Vitaminas', 'Vómitos',
];

const PERIODOS = [
  { id: 'pequeno_almoco', label: 'Pequeno-almoço', start: '06:00', end: '10:00', icon: 'free_breakfast' },
  { id: 'almoco', label: 'Almoço', start: '12:00', end: '14:00', icon: 'restaurant' },
  { id: 'lanche', label: 'Lanche', start: '16:00', end: '17:30', icon: 'coffee' },
  { id: 'jantar', label: 'Jantar', start: '19:00', end: '21:00', icon: 'dinner_dining' },
  { id: 'ceia', label: 'Ceia', start: '22:00', end: '23:30', icon: 'nightlight_round' },
];

const RECYCLING_LEVELS = [
  { min: 0, max: 49, name: 'Iniciante' },
  { min: 50, max: 149, name: 'Reciclador' },
  { min: 150, max: 299, name: 'Eco-Consciente' },
  { min: 300, max: 499, name: 'Guardião Verde' },
  { min: 500, max: 999, name: 'Mestre da Reciclagem' },
  { min: 1000, max: 999999, name: 'Lenda Ambiental' },
];

const RECYCLING_MILESTONES = {
  10: 'Com 10 embalagens recicladas já estás a contribuir para a proteção do ambiente.',
  25: 'Com 25 embalagens recicladas já estás a ajudar a proteger a água e o solo.',
  50: 'Com 50 embalagens recicladas estás a ter um impacto real no futuro do planeta.',
  100: 'Com 100 embalagens recicladas és um verdadeiro defensor do ambiente!',
  250: 'Com 250 embalagens recicladas estás a fazer a diferença para as gerações futuras.',
  500: 'Com 500 embalagens recicladas és um herói do ambiente!',
};

const RECYCLING_VOLUMES = {
  pequeno: { boxes: 2, blisters: 3, bottles: 1 },
  medio: { boxes: 5, blisters: 8, bottles: 2 },
  grande: { boxes: 10, blisters: 15, bottles: 5 },
};
const GREEN_UNITS = { box: 2, blister: 1, bottle: 3 };
const POINTS_UNIT = { box: 5, blister: 3, bottle: 7 };

const RECYCLING_POINTS = [
  { name: 'Farmácia Lemos', address: 'Praça Carlos Alberto 31, 4050-157 Porto', distance: '—' },
  { name: 'Farmácia Aliança', address: 'Rua Conceição 10, Porto', distance: '—' },
  { name: 'Farmácia Boavista', address: 'Rua Boavista 601, 4050-109 Porto', distance: '—' },
  { name: 'Farmácia Saúde', address: 'Avenida dos Combatentes da Grande Guerra 689, 4200-190 Porto', distance: '—' },
  { name: 'Farmácia Alves', address: 'Praça do Exército Libertador 62, 4250-204 Porto', distance: '—' },
];

const DICAS_ARTIGOS = [
  { id: 'paracetamol', title: 'Paracetamol: quando o excesso vira risco', category: 'Medicação', publishedAt: '2024-01-15', readTime: 3, image: 'dicas/imagens/paracetamol.jpg', text: 'O paracetamol é um dos medicamentos mais utilizados em todo o mundo, e não é por acaso, pois é eficaz no alívio da dor e na redução da febre, sendo frequentemente a primeira escolha para tratar sintomas como gripe, dores de cabeça ou dores musculares. No entanto, mesmo os medicamentos mais comuns merecem cuidado e utilização responsável.\n\nPara um uso seguro, é essencial respeitar a dose recomendada, sendo que a dose máxima diária para um adulto é, normalmente, de 4 gramas (4000 mg), devendo sempre seguir as indicações do médico ou do farmacêutico. É também importante evitar a duplicação de medicamentos, uma vez que muitos fármacos para a gripe ou constipações já contêm paracetamol na sua composição, o que pode levar à ingestão excessiva sem que a pessoa se aperceba.\n\nOutro aspeto fundamental é o cuidado com o consumo de álcool, pois a sua associação com o paracetamol pode aumentar significativamente o risco de danos no fígado. No caso das crianças, deve ser utilizada sempre a dose correta de acordo com o peso e a idade, preferencialmente com orientação médica.\n\nO paracetamol é seguro quando usado corretamente, mas o seu uso excessivo pode ser perigoso, podendo causar lesões hepáticas graves. Por isso, sempre que existam dúvidas ou os sintomas persistam, é fundamental procurar um profissional de saúde. Pequenas escolhas conscientes fazem toda a diferença, inclusive na forma como cuidamos da nossa saúde.' },
  { id: 'resfriado', title: 'Constipação comum: especialistas alertam para cuidados essenciais durante a recuperação', category: 'Saúde', publishedAt: '2024-01-14', readTime: 5, image: 'dicas/imagens/resfriado.jpg', text: 'Com a mudança de temperatura, o aumento de casos de constipação comum acende um alerta para a importância de cuidados simples que aceleram a recuperação e evitam a transmissão. Diferente da gripe, a constipação costuma apresentar sintomas mais leves, como corrimento nasal, espirros e leve dor de garganta, mas ainda assim exige atenção.\n\nO pilar fundamental para o tratamento é o repouso aliado a uma hidratação constante, pois a ingestão de líquidos ajuda a manter as mucosas hidratadas e facilita a eliminação de secreções. Especialistas recomendam manter uma alimentação equilibrada, rica em vitaminas, para fortalecer o sistema imunitário enquanto o corpo combate o vírus.\n\nNo campo da prevenção, a higiene das mãos continua a ser a regra de ouro: lavar as mãos com frequência ou usar álcool-gel reduz drasticamente as hipóteses de contágio. Além disso, evitar locais fechados e sem ventilação ajuda a conter a propagação do vírus para outras pessoas.\n\nÉ importante lembrar que o uso de medicamentos deve ser feito apenas sob orientação médica, focando no alívio dos sintomas, já que o corpo precisa de tempo para recuperar naturalmente. Caso surjam sintomas mais graves, como febre persistente ou dificuldade em respirar, a recomendação é procurar uma unidade de saúde imediatamente. Cuidar de si durante uma constipação não é apenas uma questão de conforto, mas um gesto de responsabilidade para com a saúde pública.' },
  { id: 'halitose', title: 'O segredo do hálito fresco: pequenos gestos que transformam o teu bem-estar', category: 'Saúde', publishedAt: '2024-01-13', readTime: 4, image: 'dicas/imagens/halitose.png', text: 'O mau hálito, ou halitose, é um problema comum que afeta diretamente a autoestima e as relações sociais, mas a solução pode ser mais simples do que parece. O primeiro passo essencial é manter uma higiene rigorosa, escovando os dentes com pasta de flúor pelo menos duas vezes ao dia por dois minutos e nunca esquecendo o fio dentário para remover restos de comida entre os dentes.\n\nAlém disso, a língua merece atenção especial: a limpeza da parte de trás com um raspador ou escova suave ajuda a eliminar a acumulação de bactérias que causa o mau cheiro. Manter o corpo hidratado também é fundamental, pois a água estimula o fluxo salivar necessário para neutralizar odores desagradáveis.\n\nGestos simples como mastigar pastilhas sem açúcar, evitar o tabaco e o álcool, e manter as próteses limpas fazem toda a diferença. Novas abordagens sugerem ainda que o uso de probióticos pode ajudar a equilibrar a flora oral. Se o problema persistir mesmo com esses cuidados, é importante consultar um profissional, pois a causa pode ser fisiológica ou até emocional. Afinal, cuidar da boca é cuidar de ti e da tua confiança.' },
  { id: 'lactose', title: 'Intolerância à Lactose: o que precisa de saber', category: 'Saúde', publishedAt: '2024-01-12', readTime: 3, image: 'dicas/imagens/lactose.jpg', text: 'Sentir desconforto depois de beber leite pode ser um sinal de intolerância à lactose. Esta condição acontece quando o corpo tem dificuldade em digerir a lactose, o açúcar natural do leite. Quando a lactose não é devidamente digerida, chega intacta ao intestino grosso, onde é fermentada pelas bactérias, provocando sintomas como gases, inchaço, dor abdominal e, por vezes, diarreia. Curiosamente, cerca de 65% da população mundial apresenta algum grau de intolerância à lactose.\n\nApesar disso, é totalmente possível viver bem com esta condição. No dia a dia, pode optar por leite e derivados sem lactose, que já contêm a enzima lactase, experimentar leites vegetais como os de amêndoa, aveia, soja ou arroz, e ler atentamente os rótulos dos alimentos, uma vez que a lactose pode estar presente em produtos inesperados, como molhos ou artigos de padaria. É também importante falar com o médico ou farmacêutico antes de tomar suplementos de lactase ou fazer alterações significativas na dieta.\n\nCada pessoa tem um nível diferente de intolerância, pelo que o segredo está em conhecer o próprio corpo e encontrar o equilíbrio que melhor funciona. Com acompanhamento médico e escolhas informadas, é possível manter uma alimentação saudável, saborosa e sem desconfortos.' },
];

const TRAVEL_SECTIONS = [
  { id: 's1', title: 'Medicamentos essenciais (uso pessoal)', items: ['Medicamentos de uso contínuo (com receita, se necessário)', 'Quantidade extra (para atrasos/imprevistos)', 'Cópia da receita médica (importante para viagens internacionais)', 'Lista dos medicamentos e doses'], checkbox: true },
  { id: 's2', title: 'Dor, febre e inflamação', items: ['Paracetamol ou ibuprofeno', 'Termómetro (opcional, mas útil)'], checkbox: true },
  { id: 's3', title: 'Estômago e intestino', items: ['Antidiarreico', 'Probióticos', 'Medicamento para enjoos/náuseas', 'Antiácido / protetor gástrico', 'Sais de reidratação oral'], checkbox: true },
  { id: 's4', title: 'Gripes, alergias e respiração', items: ['Antialérgico (ex: loratadina, cetirizina)', 'Descongestionante nasal', 'Spray nasal com soro fisiológico', 'Pastilhas para dor de garganta'], checkbox: true },
  { id: 's5', title: 'Pele e primeiros socorros', items: ['Repelente de insetos', 'Protetor solar', 'Pomada para picadas/coceiras', 'Pomada cicatrizante/antisséptica', 'Curativos (pensos rápidos)', 'Gaze + fita adesiva', 'Álcool ou lenços antissépticos'], checkbox: true },
  { id: 's6', title: 'Outros úteis', items: ['Medicamento para dormir (se usas)', 'Colírio', 'Hidratante labial', 'Álcool-gel'], checkbox: true },
  { id: 's7', title: 'Documentação (muito importante)', items: ['Receita médica em inglês (ou idioma do destino)', 'Declaração médica para medicamentos controlados', 'Lista dos medicamentos (nome genérico + dosagem)', 'Cópia digital das receitas'], checkbox: true },
  { id: 's8', title: 'Antes de viajar', items: ['Ver site da embaixada do país de destino', 'Confirmar vacinas obrigatórias', 'Seguro de viagem com cobertura médica'], checkbox: true },
  { id: 's9', title: 'Atenção especial', items: ['Alguns países proíbem certos medicamentos (ex: codeína, tramadol, alguns ansiolíticos)', 'Leva sempre na bagagem de mão', 'Mantém os medicamentos na embalagem original', 'Líquidos acima de 100 ml só com declaração médica'], checkbox: false },
  { id: 's10', title: 'Dicas rápidas', items: ['Leva os medicamentos na bagagem de mão', 'Verifica se algum medicamento é proibido no país de destino', 'Mantém tudo na embalagem original', 'Se vais para um destino exótico, considera falar com um médico antes'], checkbox: false },
];

var Core = (typeof DailyMedCore !== 'undefined') ? DailyMedCore : null;
var todayStr = Core ? Core.todayStr : function () { return new Date().toISOString().slice(0, 10); };
var formatDateYMD = Core ? Core.formatDateYMD : function (dateStr) {
  if (!dateStr) return '';
  var d = dateStr.split('-');
  if (d.length !== 3) return dateStr;
  return d[2] + '/' + d[1] + '/' + d[0];
};
var escapeHtml = Core ? Core.escapeHtml : function (str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
};
var cleanNotesFromLegacy = Core ? Core.cleanNotesFromLegacy : function (notes) {
  if (!notes || typeof notes !== 'string') return notes || '';
  return notes
    .replace(/\s*Posologia:\s*---\.?\s*Indicação:\s*---\.?\s*/gi, '')
    .replace(/\s*Indicação:\s*---\.?\s*/gi, '')
    .replace(/\s*Posologia:\s*---\.?\s*/gi, '')
    .trim();
};
var getValidityStatus = Core ? Core.getValidityStatus : function (expiryDate) {
  if (!expiryDate) return { label: 'Válido', type: 'ok' };
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  if (exp < today) return { label: 'Expirado', type: 'expired' };
  var days = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  if (days <= 30) return { label: 'Expira em breve', type: 'soon' };
  return { label: 'Válido', type: 'ok' };
};
var parseHash = Core ? Core.parseHash : function () {
  var hash = (window.location.hash || '#home').slice(1);
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
};

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function debounce(fn, delay) {
  var t = null;
  return function () {
    var ctx = this;
    var args = arguments;
    clearTimeout(t);
    t = setTimeout(function () { fn.apply(ctx, args); }, delay);
  };
}

function compactParams(obj) {
  var out = {};
  Object.keys(obj || {}).forEach(function (k) {
    var v = obj[k];
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  });
  return out;
}

function getStockStatus(quantity) {
  if (quantity <= 10) return { label: 'Baixo', type: 'low' };
  if (quantity <= 30) return { label: 'Médio', type: 'medium' };
  return { label: 'OK', type: 'ok' };
}


function getRemindersForToday() {
  const today = todayStr();
  return getReminders().filter(function (r) {
    return r.isActive && today >= (r.startDate || '') && today <= (r.endDate || '9999-12-31');
  });
}

function recyclingStats() {
  const deliveries = getRecyclingDeliveries();
  let totalPackages = 0, greenUnits = 0, points = 0;
  deliveries.forEach(function (d) {
    totalPackages += d.totalPackages || 0;
    greenUnits += d.greenUnits || 0;
    points += d.points || 0;
  });
  const level = RECYCLING_LEVELS.find(function (l) { return points >= l.min && points <= l.max; }) || RECYCLING_LEVELS[0];
  const nextLevel = RECYCLING_LEVELS[RECYCLING_LEVELS.indexOf(level) + 1];
  const progress = nextLevel ? ((points - level.min) / (nextLevel.min - level.min)) * 100 : 100;
  const milestoneKeys = [10, 25, 50, 100, 250, 500];
  const lastMilestone = milestoneKeys.filter(function (k) { return totalPackages >= k; }).pop();
  const milestoneText = lastMilestone ? RECYCLING_MILESTONES[lastMilestone] : null;
  return { totalPackages: totalPackages, greenUnits: greenUnits, points: points, level: level, nextLevel: nextLevel, progress: progress, milestoneText: milestoneText };
}

function haversineKm(lat1, lon1, lat2, lon2) {
  var toRad = function (v) { return (v * Math.PI) / 180; };
  var R = 6371;
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

let currentView = '';
let reminderTimers = [];
let medicationAlertTimer = null;
let dailyRescheduleTimer = null;
let reminderSweepTimer = null;

function clearReminderTimers() {
  reminderTimers.forEach(function (t) { clearTimeout(t); });
  reminderTimers = [];
}

function showToast(message, icon) {
  if (!message) return;
  var existing = document.getElementById('toast-reminder');
  if (existing) existing.remove();
  var i = icon || 'notifications';
  var html = '<div id="toast-reminder" class="toast-reminder">' +
    '<span class="material-icons">' + i + '</span>' +
    '<div class="toast-reminder__text">' + escapeHtml(message) + '</div>' +
    '</div>';
  document.body.insertAdjacentHTML('beforeend', html);
  setTimeout(function () {
    var el = document.getElementById('toast-reminder');
    if (el) el.classList.add('toast-reminder--hide');
  }, 3500);
  setTimeout(function () {
    var el = document.getElementById('toast-reminder');
    if (el) el.remove();
  }, 5000);
}

const ALERTS_KEY = 'dailymed_medication_alerts';

function getAlertState() {
  try {
    var raw = localStorage.getItem(ALERTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function setAlertState(state) {
  localStorage.setItem(ALERTS_KEY, JSON.stringify(state));
}

function markAlertNotified(state, medId, type) {
  if (!state[medId]) state[medId] = {};
  state[medId][type] = { date: todayStr() };
}

function wasAlertNotifiedToday(state, medId, type) {
  return !!(state[medId] && state[medId][type] && state[medId][type].date === todayStr());
}

function notifyUser(title, message, icon) {
  showToast(message, icon);
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try { new Notification(title, { body: message }); } catch (e) {}
  }
}

function checkMedicationAlerts() {
  var settings = getSettings();
  if (!settings.notifications) return;
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    try { Notification.requestPermission(); } catch (e) {}
  }
  var meds = getMedications();
  if (!meds.length) return;

  var state = getAlertState();
  var pending = [];

  meds.forEach(function (m) {
    var name = m.name || 'Medicamento';

    var validity = getValidityStatus(m.expiryDate);
    if (validity.type === 'soon' || validity.type === 'expired') {
      var typeKey = validity.type === 'expired' ? 'expiry_expired' : 'expiry_soon';
      if (!wasAlertNotifiedToday(state, m.id, typeKey)) {
        var msg = validity.type === 'expired'
          ? 'O medicamento ' + name + ' está expirado.'
          : 'O medicamento ' + name + ' expira em breve.';
        pending.push({ medId: m.id, type: typeKey, title: 'Alerta DailyMed', message: msg, icon: 'warning' });
      }
    }

    var qty = parseInt(m.quantity || 0, 10) || 0;
    if (qty <= 10) {
      if (!wasAlertNotifiedToday(state, m.id, 'stock_low')) {
        var msgStock = 'Stock baixo de ' + name + ' (' + qty + ' un.).';
        pending.push({ medId: m.id, type: 'stock_low', title: 'Alerta DailyMed', message: msgStock, icon: 'notifications' });
      }
    }
  });

  if (!pending.length) return;

  if (pending.length <= 3) {
    pending.forEach(function (p) {
      notifyUser(p.title, p.message, p.icon);
      markAlertNotified(state, p.medId, p.type);
    });
  } else {
    var expSoon = pending.filter(function (p) { return p.type === 'expiry_soon'; }).length;
    var expExpired = pending.filter(function (p) { return p.type === 'expiry_expired'; }).length;
    var lowStock = pending.filter(function (p) { return p.type === 'stock_low'; }).length;
    var parts = [];
    if (expExpired) parts.push(expExpired + ' expirado(s)');
    if (expSoon) parts.push(expSoon + ' a expirar');
    if (lowStock) parts.push(lowStock + ' com stock baixo');
    notifyUser('Alertas DailyMed', 'Tens ' + parts.join(', ') + '.', 'warning');
    pending.forEach(function (p) { markAlertNotified(state, p.medId, p.type); });
  }

  setAlertState(state);
}

function scheduleMedicationAlertChecks() {
  if (medicationAlertTimer) clearInterval(medicationAlertTimer);
  medicationAlertTimer = setInterval(checkMedicationAlerts, 60 * 60 * 1000);
}

function scheduleReminderNotifications() {
  clearReminderTimers();
  var settings = getSettings();
  var today = todayStr();
  var now = new Date();
  var reminders = getReminders().filter(function (r) { return r.isActive; });
  reminders.forEach(function (r) {
    var startOk = !r.startDate || today >= r.startDate;
    var endOk = !r.endDate || today <= r.endDate;
    if (!startOk || !endOk) return;
    var times = Array.isArray(r.times) && r.times.length ? r.times : (r.time ? [r.time] : []);
    var notifiedTimes = (r.lastNotifiedDate === today && Array.isArray(r.lastNotifiedTimes)) ? r.lastNotifiedTimes : [];
    times.forEach(function (t) {
      if (!t) return;
      if (notifiedTimes.indexOf(t) !== -1) return;
      var parts = t.split(':');
      var hh = parseInt(parts[0] || '0', 10);
      var mm = parseInt(parts[1] || '0', 10);
      var fireAt = new Date();
      fireAt.setHours(hh, mm, 0, 0);
      if (fireAt <= now) return;
      var delay = fireAt.getTime() - now.getTime();
      var timer = setTimeout(function () {
        if (!getSettings().notifications) return;
        var med = getMedicationById(r.medicationId);
        var msg = 'Hora de tomar ' + (med ? med.name : 'o teu medicamento') + '.';
        showToast(msg);
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try { new Notification('Lembrete DailyMed', { body: msg }); } catch (e) {}
        }
        var latest = getReminderById(r.id);
        if (!latest) return;
        latest.lastNotifiedDate = today;
        latest.lastNotifiedTimes = Array.isArray(latest.lastNotifiedTimes) ? latest.lastNotifiedTimes.slice() : [];
        if (latest.lastNotifiedTimes.indexOf(t) === -1) latest.lastNotifiedTimes.push(t);
        saveReminder(latest);
      }, delay);
      reminderTimers.push(timer);
    });
  });
  scheduleDailyReminderReschedule();
  checkDueRemindersNow();
}

function scheduleDailyReminderReschedule() {
  if (dailyRescheduleTimer) clearTimeout(dailyRescheduleTimer);
  var now = new Date();
  var next = new Date(now);
  next.setHours(24, 0, 5, 0);
  var delay = next.getTime() - now.getTime();
  dailyRescheduleTimer = setTimeout(function () {
    scheduleReminderNotifications();
  }, delay);
}

function checkDueRemindersNow() {
  var settings = getSettings();
  if (!settings.notifications) return;
  var today = todayStr();
  var now = new Date();
  var reminders = getReminders().filter(function (r) { return r.isActive; });
  reminders.forEach(function (r) {
    var startOk = !r.startDate || today >= r.startDate;
    var endOk = !r.endDate || today <= r.endDate;
    if (!startOk || !endOk) return;
    var times = Array.isArray(r.times) && r.times.length ? r.times : (r.time ? [r.time] : []);
    if (!times.length) return;
    var notifiedTimes = (r.lastNotifiedDate === today && Array.isArray(r.lastNotifiedTimes)) ? r.lastNotifiedTimes : [];
    var dueTimes = [];
    times.forEach(function (t) {
      if (!t) return;
      if (notifiedTimes.indexOf(t) !== -1) return;
      var parts = t.split(':');
      var hh = parseInt(parts[0] || '0', 10);
      var mm = parseInt(parts[1] || '0', 10);
      var fireAt = new Date();
      fireAt.setHours(hh, mm, 0, 0);
      if (fireAt <= now) dueTimes.push(t);
    });
    if (!dueTimes.length) return;
    var med = getMedicationById(r.medicationId);
    var msg = 'Hora de tomar ' + (med ? med.name : 'o teu medicamento') + '.';
    showToast(msg);
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try { new Notification('Lembrete DailyMed', { body: msg }); } catch (e) {}
    }
    r.lastNotifiedDate = today;
    r.lastNotifiedTimes = Array.isArray(r.lastNotifiedTimes) ? r.lastNotifiedTimes.slice() : [];
    dueTimes.forEach(function (t) {
      if (r.lastNotifiedTimes.indexOf(t) === -1) r.lastNotifiedTimes.push(t);
    });
    saveReminder(r);
  });
}

function startReminderSweep() {
  if (reminderSweepTimer) clearInterval(reminderSweepTimer);
  reminderSweepTimer = setInterval(function () {
    checkDueRemindersNow();
  }, 60 * 1000);
}

function setNavActive(section) {
  document.querySelectorAll('#bottom-nav .nav-link').forEach(function (a) {
    a.classList.remove('text-primary');
    a.classList.add('text-gray-500');
    if ((a.getAttribute('data-route') || '') === section) {
      a.classList.remove('text-gray-500');
      a.classList.add('text-primary');
    }
  });
}

function render(html, showNav) {
  if (showNav === undefined) showNav = true;
  const app = document.getElementById('app');
  app.innerHTML = html;
  const section = (currentView.split('/')[0] || currentView).split('-')[0];
  if (showNav) setNavActive(section);
}

function navigate(path, params) {
  const qs = params && Object.keys(params).length ? '?' + Object.entries(params).map(function (kv) { return kv[0] + '=' + encodeURIComponent(kv[1]); }).join('&') : '';
  window.location.hash = path + qs;
}

function viewHome() {
  const meds = getMedications();
  const activeCount = meds.filter(function (m) { return m.isActive; }).length;
  const remindersToday = getRemindersForToday().length;
  const expiringSoon = meds.filter(function (m) { return getValidityStatus(m.expiryDate).type === 'soon'; }).length;
  const stockLow = meds.filter(function (m) { return (parseInt(m.quantity || 0, 10) || 0) <= 10; }).length;
  return '<header class="relative px-4 flex items-center justify-center gap-3 bg-white">' +
    '<img src="logo.png" alt="DailyMed" class="app-logo object-contain" />' +
    '<a href="#definicoes" class="header-action" aria-label="Definições"><span class="material-icons">settings</span></a>' +
    '</header>' +
    '<main class="app-main space-y-5 bg-white">' +
    '<div class="grid grid-cols-1 gap-3">' +
    '<a href="#lembretes" class="home-shortcut home-shortcut--secondary"><span class="material-icons text-2xl">schedule</span><span>Lembretes</span></a>' +
    '<a href="#medicacao" class="home-shortcut home-shortcut--primary"><span class="material-icons text-2xl">medication</span><span>Armário</span></a>' +
    '<a href="#reciclagem" class="home-shortcut home-shortcut--secondary"><span class="material-icons text-2xl">eco</span><span>Reciclar</span></a>' +
    '<a href="#dicas" class="home-shortcut home-shortcut--primary"><span class="material-icons text-2xl">bookmark</span><span>Dicas</span></a>' +
    '</div>' +
    '<section class="space-y-2">' +
    '<p class="section-label">Hoje</p>' +
    '<div class="summary-card"><div><p class="summary-title">Lembretes do dia</p><p class="summary-sub">Total</p></div><div class="summary-value text-primary">' + remindersToday + '</div></div>' +
    '</section>' +
    '<section class="space-y-2">' +
    '<p class="section-label">Resumo</p>' +
    '<div class="space-y-3">' +
    '<div class="summary-card"><div><p class="summary-title">Medicamentos ativos</p><p class="summary-sub">Total</p></div><div class="summary-value text-primary">' + activeCount + '</div></div>' +
    '<div class="summary-card"><div><p class="summary-title">Medicamentos a expirar</p><p class="summary-sub">Total</p></div><div class="summary-value text-secondary">' + expiringSoon + '</div></div>' +
    '</div>' +
    '</section>' +
    '<section class="space-y-2">' +
    '<p class="section-label">Atenção</p>' +
    '<div class="space-y-3">' +
    '<div class="summary-card summary-card--warning"><div><p class="summary-title">Expira em breve</p><p class="summary-sub">Medicamentos</p></div><div class="summary-value text-yellow-600">' + expiringSoon + '</div></div>' +
    '<div class="summary-card summary-card--danger"><div><p class="summary-title">Stock baixo</p><p class="summary-sub">Medicamentos</p></div><div class="summary-value text-red-600">' + stockLow + '</div></div>' +
    '</div>' +
    '</section>' +
    '</main>';
}

function viewMedicacaoCategorias() {
  let list = '';
  list = '<a href="#medicacao-armario" class="block w-full py-3 px-4 rounded-xl bg-primary-container text-black font-medium text-center shadow-sm">Ver todos</a>';
  CATEGORIAS.forEach(function (c) {
    list += '<a href="#medicacao-armario?cat=' + encodeURIComponent(c) + '" class="block w-full py-3 px-4 rounded-xl bg-primary-container text-black font-medium text-center shadow-sm">' + c + '</a>';
  });
  return pageHeader('Armário de Medicamentos', '#home') +
    '<main class="app-main space-y-3 bg-white">' +
    '<button type="button" id="btn-adicionar-medicamento" class="flex items-center gap-3 w-full py-3 px-4 rounded-xl btn-primary font-medium"><span class="material-icons">add_circle_outline</span><span>Adicionar Medicamento</span></button>' +
    '<h3 class="section-title text-center pt-2">Categorias de Medicamentos</h3>' +
    '<div class="space-y-2">' + list + '</div></main>';
}

function viewMedicacaoArmario(params) {
  const filter = params.filter || 'todos';
  const search = (params.q || '').toLowerCase();
  const category = params.cat || '';
  let list = getMedications();
  if (filter === 'semlembretes') {
    list = list.filter(function (m) {
      if (!m.isActive) return false;
      return !getReminders().some(function (r) { return r.isActive && r.medicationId === m.id; });
    });
  }
  if (category) list = list.filter(function (m) { return m.category === category; });
  if (search) list = list.filter(function (m) { return (m.name || '').toLowerCase().includes(search) || (m.manufacturer || '').toLowerCase().includes(search); });
  if (filter === 'ativos') list = list.filter(function (m) { return m.isActive; });
  if (filter === 'stock') list = list.filter(function (m) { return (parseInt(m.quantity || 0, 10) || 0) > 0; });
  if (filter === 'expirando') list = list.filter(function (m) { return getValidityStatus(m.expiryDate).type === 'soon'; });
  if (filter === 'expirados') list = list.filter(function (m) { return getValidityStatus(m.expiryDate).type === 'expired'; });
  if (filter === 'baixo') list = list.filter(function (m) { return (m.quantity || 0) <= 10; });
  const detected = detectInteractions(list);
  const catQs = category ? '?cat=' + encodeURIComponent(category) : '';
  const filterBase = '#medicacao-armario' + catQs;

  let listHtml = '';
  list.forEach(function (m) {
    const nameEsc = escapeHtml(m.name || '');
    const dosageEsc = escapeHtml(m.dosage || '');
    const titleLine = (nameEsc + ' ' + dosageEsc).trim() || 'Medicamento';
    const qty = m.quantity != null ? m.quantity : '-';
    const validadeStr = formatDateYMD(m.expiryDate) || '-';
    const cardBg = m.isActive ? 'app-card app-card--soft text-gray-800' : 'app-card text-gray-800';
    const dotHtml = m.isActive ? '<span class="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-primary" aria-hidden="true" title="Ativo"></span>' : '';
    const validity = getValidityStatus(m.expiryDate);
    const isLow = (parseInt(m.quantity || 0, 10) || 0) <= 10;
  const badges = [
      validity.type === 'expired' ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-semibold bg-red-100 text-red-700">Expirado</span>' : '',
      validity.type === 'soon' ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-semibold bg-yellow-100 text-yellow-700">Expira em breve</span>' : '',
      isLow ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-semibold bg-rose-100 text-rose-700">Stock baixo</span>' : '',
    ].filter(Boolean).join(' ');
    listHtml += '<div class="p-4 ' + cardBg + ' relative">' +
      dotHtml +
      '<div class="med-card-detail cursor-pointer block focus:outline-none" data-id="' + m.id + '" role="button" tabindex="0">' +
      '<p class="font-bold text-sm leading-tight pr-6">' + titleLine + '</p>' +
      '<p class="text-sm text-gray-600 mt-0.5">' + dosageEsc + '</p>' +
      '<p class="text-sm text-gray-600 mt-0.5">' + qty + ' unidades</p>' +
      '<p class="text-sm text-gray-600 mt-0.5">Validade: ' + validadeStr + '</p>' +
      (badges ? '<div class="mt-2 flex flex-wrap gap-1">' + badges + '</div>' : '') +
      '</div>' +
    '<div class="mt-2 flex gap-2"><a href="#medicacao-editar?id=' + m.id + '" class="btn-link btn-link--primary">Editar</a><button type="button" class="btn-link btn-link--danger delete-med" data-id="' + m.id + '">Remover</button></div>' +
      '</div>';
  });

  const filterOptions = [
    { id: 'todos', label: 'Todos' },
    { id: 'ativos', label: 'Medicamentos ativos' },
    { id: 'stock', label: 'Em stock' },
    { id: 'expirando', label: 'A expirar' },
    { id: 'expirados', label: 'Expirados' },
    { id: 'baixo', label: 'Stock baixo' },
    { id: 'semlembretes', label: 'Sem lembretes' },
  ];
  const filterSelect = '<select id="armario-filter" class="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white">' +
    filterOptions.map(function (opt) {
      return '<option value="' + opt.id + '"' + (filter === opt.id ? ' selected' : '') + '>' + opt.label + '</option>';
    }).join('') +
    '</select>';

  let banner = '';
  if (detected.length > 0) banner = '<a href="#medicacao-interacoes" class="block p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm"><span class="material-icons align-middle text-lg mr-1">warning</span>Atenção: ' + detected.length + ' interação(ões) detetada(s). Toca para ver.</a>';
  const gridOrEmpty = list.length === 0
    ? '<div class="empty-state"><div class="empty-icon"><span class="material-icons">inventory_2</span></div><p>Não existem medicamentos para mostrar.</p><a href="#medicacao-adicionar" class="inline-flex items-center justify-center mt-3 px-4 py-2 btn-primary">Adicionar medicamento</a></div>'
    : '<div class="grid grid-cols-1 gap-3">' + listHtml + '</div><button type="button" id="btn-adicionar-medicamento-fab" class="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg" aria-label="Adicionar medicamento"><span class="material-icons">add</span></button>';

  return pageHeader(category ? category : 'Armário de Medicamentos', '#medicacao') +
    '<main class="app-main space-y-4 bg-white">' +
    '<a href="#medicacao" class="flex items-center justify-center gap-2 w-full btn-ghost font-medium"><span class="material-icons text-lg">arrow_back</span>Voltar às Categorias</a>' +
    '<input type="search" placeholder="Pesquisar nome ou fabricante..." class="w-full px-4 py-2 rounded-xl border border-gray-200" id="armario-search" aria-describedby="armario-help" value="' + escapeHtml(params.q || '') + '" />' +
    '<p class="text-sm text-on-surface-variant" id="armario-help">Pesquisa pelo nome ou fabricante e usa o filtro para reduzir a lista.</p>' +
    '<h3 class="font-bold text-black">Os Meus Medicamentos</h3>' +
    filterSelect +
    '<p class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm bg-gray-100 text-gray-700"><span class="w-2 h-2 rounded-full bg-primary"></span>Medicamentos ativos</p>' +
    (category ? '<p class="text-sm text-on-surface-variant">Categoria: ' + escapeHtml(category) + '</p>' : '') +
    banner +
    gridOrEmpty +
    '</main>';
}

function viewMedicacaoAdicionar(params) {
  const prefilled = params.nome ? { name: params.nome, dosage: params.dosagem, substance: params.substancia } : {};
  const nameVal = escapeHtml(prefilled.name || '');
  const dosageVal = escapeHtml(prefilled.dosage || '');
  const substanceVal = escapeHtml(prefilled.substance || '');
  const manuVal = escapeHtml(params.titular || '---');
  return pageHeader('Adicionar Medicamento', '#medicacao') +
    '<main class="app-main spacious bg-gray-50 min-h-screen"><form id="form-add-med" class="max-w-lg mx-auto">' +
    '<section class="med-form-section">' +
    '<h3 class="med-form-section-title"><span class="material-icons text-lg">medication</span>Identificação</h3>' +
    '<div class="space-y-3">' +
    '<div class="relative"><label class="med-form-label">Nome *</label><input type="text" name="name" required placeholder="Pesquisar ou escrever..." class="w-full px-4 py-2.5 input-outline" id="med-name" value="' + nameVal + '" autocomplete="off" /><ul class="autocomplete-list absolute left-0 right-0 z-10 mt-1 bg-white border border-outline rounded-xl shadow-lg max-h-60 overflow-y-auto hidden" id="autocomplete-list"></ul></div>' +
    '<div><label class="med-form-label">Dosagem *</label><input type="text" name="dosage" required class="w-full px-4 py-2.5 input-outline" value="' + dosageVal + '" /></div>' +
    '<div><label class="med-form-label">Substância ativa</label><input type="text" name="substance" class="w-full px-4 py-2.5 input-outline bg-gray-50" id="med-substance" value="' + substanceVal + '" readonly /></div>' +
    '<div><label class="med-form-label">Fabricante (Titular de AIM)</label><input type="text" name="manufacturer" class="w-full px-4 py-2.5 input-outline" value="' + manuVal + '" placeholder="Preenchido ao pesquisar na lista INFOMED" /></div>' +
    '</div></section>' +
    '<section class="med-form-section">' +
    '<h3 class="med-form-section-title"><span class="material-icons text-lg">description</span>Posologia e indicação</h3>' +
    '<div class="space-y-3">' +
    '<div><label class="med-form-label">Posologia</label><input type="text" name="posology" class="w-full px-4 py-2.5 input-outline" value="---" /></div>' +
    '<div><label class="med-form-label">Indicação Terapêutica</label><input type="text" name="indication" class="w-full px-4 py-2.5 input-outline" value="---" /></div>' +
    '</div></section>' +
    '<section class="med-form-section">' +
    '<h3 class="med-form-section-title"><span class="material-icons text-lg">inventory_2</span>Stock e validade</h3>' +
    '<div class="space-y-3">' +
    '<div><label class="med-form-label">Número de Unidades *</label><input type="number" name="quantity" required min="0" class="w-full px-4 py-2.5 input-outline" value="30" /></div>' +
    '<div><label class="med-form-label">Data de Validade *</label><input type="date" name="expiryDate" required class="w-full px-4 py-2.5 input-outline" /></div>' +
    '<div><label class="med-form-label">Categoria *</label><select name="category" required class="w-full px-4 py-2.5 input-outline"><option value="">Selecionar...</option>' + CATEGORIAS.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('') + '</select></div>' +
    '<div><label class="med-form-label">Estado</label><select name="isActive" class="w-full px-4 py-2.5 input-outline"><option value="true">Ativo</option><option value="false">Não Ativo</option></select></div>' +
    '</div></section>' +
    '<section class="med-form-section">' +
    '<h3 class="med-form-section-title"><span class="material-icons text-lg">note</span>Outros</h3>' +
    '<div class="space-y-3">' +
    '<div><label class="med-form-label">Notas</label><textarea name="notes" rows="2" class="w-full px-4 py-2.5 input-outline resize-none"></textarea></div>' +
    '<div><label class="med-form-label">Foto (opcional)</label><input type="file" name="image" accept="image/*" class="w-full px-4 py-2.5 input-outline text-sm" /></div>' +
    '</div></section>' +
    '<button type="submit" class="med-form-submit"><span class="material-icons">save</span>Guardar medicamento</button></form></main>';
}

function viewMedicacaoDetalhes(params) {
  const m = getMedicationById(params.id);
  if (!m) return viewMedicacaoCategorias();
  const nameEsc = escapeHtml(m.name || 'Medicamento');
  const dosageEsc = escapeHtml(m.dosage || '-');
  const substanceEsc = escapeHtml(m.substance || '-');
  const manufacturerEsc = escapeHtml(m.manufacturer || '-');
  const posologyEsc = escapeHtml(m.posology || '-');
  const indicationEsc = escapeHtml(m.indication || '-');
  const categoryEsc = escapeHtml(m.category || '-');
  const notesEsc = escapeHtml(cleanNotesFromLegacy(m.notes) || '-');
  const validadeStr = formatDateYMD(m.expiryDate) || '-';
  const validity = getValidityStatus(m.expiryDate);
  const validityBadge = validity.type === 'expired'
    ? '<span class="pill pill--danger">Expirado</span>'
    : validity.type === 'soon'
      ? '<span class="pill pill--warning">Expira em breve</span>'
      : '<span class="pill pill--ok">Válido</span>';
  const stockStatus = getStockStatus(parseInt(m.quantity || 0, 10) || 0);
  const stockBadge = stockStatus.type === 'low'
    ? '<span class="pill pill--danger">Stock baixo</span>'
    : stockStatus.type === 'medium'
      ? '<span class="pill pill--warning">Stock médio</span>'
      : '<span class="pill pill--ok">Stock OK</span>';
  const imgBlock = m.imageUri
    ? '<img src="' + m.imageUri + '" alt="" class="w-full max-h-52 object-contain rounded-2xl bg-gray-100 border border-gray-200" />'
    : '<div class="med-hero-placeholder"><span class="material-icons">medication</span></div>';
  return pageHeader(nameEsc, '#medicacao-armario') +
    '<main class="app-main space-y-4 bg-white">' +
    '<section class="med-hero">' +
    imgBlock +
    '<div class="med-hero__info">' +
    '<h3 class="med-hero__title">' + nameEsc + '</h3>' +
    '<p class="med-hero__sub">' + dosageEsc + '</p>' +
    '<div class="med-hero__chips">' + validityBadge + stockBadge + '</div>' +
    '</div>' +
    '</section>' +
    '<section class="med-detail-card">' +
    '<h4 class="med-detail-title">Detalhes</h4>' +
    '<dl class="med-detail-grid">' +
    '<div><dt>Substância ativa</dt><dd>' + substanceEsc + '</dd></div>' +
    '<div><dt>Fabricante</dt><dd>' + manufacturerEsc + '</dd></div>' +
    '<div><dt>Posologia</dt><dd>' + posologyEsc + '</dd></div>' +
    '<div><dt>Indicação Terapêutica</dt><dd>' + indicationEsc + '</dd></div>' +
    '<div><dt>Quantidade</dt><dd>' + (m.quantity ?? '-') + '</dd></div>' +
    '<div><dt>Data de validade</dt><dd>' + validadeStr + '</dd></div>' +
    '<div><dt>Categoria</dt><dd>' + categoryEsc + '</dd></div>' +
    '<div><dt>Estado</dt><dd>' + (m.isActive ? 'Ativo' : 'Inativo') + '</dd></div>' +
    '</dl>' +
    '<div class="med-notes"><dt>Notas</dt><dd>' + notesEsc + '</dd></div>' +
    '</section>' +
    '<section class="med-actions">' +
    '<a href="#medicacao-editar?id=' + m.id + '" class="btn-primary w-full">Editar</a>' +
    '<a href="#medicacao-folheto?id=' + m.id + '" class="btn-outline w-full">Ver folheto</a>' +
    '<a href="#medicacao-interacoes" class="btn-ghost w-full">Ver interações</a>' +
    '<a href="#medicacao-historico" class="btn-ghost w-full">Ver histórico</a>' +
    '</section>' +
    '</main>';
}

function viewMedicacaoEditar(params) {
  const m = getMedicationById(params.id);
  if (!m) return viewMedicacaoCategorias();
  const catOpts = CATEGORIAS.map(function (c) { return '<option value="' + c + '"' + (m.category === c ? ' selected' : '') + '>' + c + '</option>'; }).join('');
  return pageHeader('Editar Medicamento', '#medicacao-detalhes?id=' + m.id) +
    '<main class="app-main spacious bg-gray-50 min-h-screen"><form id="form-edit-med" data-id="' + m.id + '" class="max-w-lg mx-auto">' +
    '<section class="med-form-section">' +
    '<h3 class="med-form-section-title"><span class="material-icons text-lg">medication</span>Identificação</h3>' +
    '<div class="space-y-3">' +
    '<div><label class="med-form-label">Nome *</label><input type="text" name="name" required class="w-full px-4 py-2.5 input-outline" value="' + escapeHtml(m.name || '') + '" /></div>' +
    '<div><label class="med-form-label">Dosagem *</label><input type="text" name="dosage" required class="w-full px-4 py-2.5 input-outline" value="' + escapeHtml(m.dosage || '') + '" /></div>' +
    '<div><label class="med-form-label">Substância ativa</label><input type="text" name="substance" class="w-full px-4 py-2.5 input-outline" value="' + escapeHtml(m.substance || '') + '" /></div>' +
    '<div><label class="med-form-label">Fabricante (Titular de AIM)</label><input type="text" name="manufacturer" class="w-full px-4 py-2.5 input-outline" value="' + escapeHtml(m.manufacturer || '') + '" /></div>' +
    '</div></section>' +
    '<section class="med-form-section">' +
    '<h3 class="med-form-section-title"><span class="material-icons text-lg">description</span>Posologia e indicação</h3>' +
    '<div class="space-y-3">' +
    '<div><label class="med-form-label">Posologia</label><input type="text" name="posology" class="w-full px-4 py-2.5 input-outline" value="' + escapeHtml(m.posology || '') + '" /></div>' +
    '<div><label class="med-form-label">Indicação Terapêutica</label><input type="text" name="indication" class="w-full px-4 py-2.5 input-outline" value="' + escapeHtml(m.indication || '') + '" /></div>' +
    '</div></section>' +
    '<section class="med-form-section">' +
    '<h3 class="med-form-section-title"><span class="material-icons text-lg">inventory_2</span>Stock e validade</h3>' +
    '<div class="space-y-3">' +
    '<div><label class="med-form-label">Número de Unidades *</label><input type="number" name="quantity" required min="1" class="w-full px-4 py-2.5 input-outline" value="' + (m.quantity ?? 0) + '" /></div>' +
    '<div><label class="med-form-label">Data de Validade *</label><input type="date" name="expiryDate" required class="w-full px-4 py-2.5 input-outline" value="' + (m.expiryDate || '') + '" /></div>' +
    '<div><label class="med-form-label">Categoria *</label><select name="category" required class="w-full px-4 py-2.5 input-outline">' + catOpts + '</select></div>' +
    '<div><label class="med-form-label">Estado</label><select name="isActive" class="w-full px-4 py-2.5 input-outline"><option value="true"' + (m.isActive ? ' selected' : '') + '>Ativo</option><option value="false"' + (!m.isActive ? ' selected' : '') + '>Não Ativo</option></select></div>' +
    '</div></section>' +
    '<section class="med-form-section">' +
    '<h3 class="med-form-section-title"><span class="material-icons text-lg">note</span>Notas</h3>' +
    '<div><label class="med-form-label">Notas</label><textarea name="notes" rows="2" class="w-full px-4 py-2.5 input-outline resize-none">' + escapeHtml(cleanNotesFromLegacy(m.notes || '')) + '</textarea></div>' +
    '</section>' +
    '<button type="submit" class="med-form-submit"><span class="material-icons">save</span>Guardar alterações</button></form></main>';
}

function viewMedicacaoPesquisar() {
  return pageHeader('Pesquisar Medicamento', '#medicacao') +
    '<main class="app-main bg-white"><input type="search" placeholder="Nome ou substância (mín. 2 caracteres)..." class="w-full px-4 py-2 rounded-xl border border-gray-200 mb-4" id="pesquisa-infomed" autocomplete="off" /><ul class="space-y-2" id="pesquisa-resultados"></ul></main>';
}

function viewMedicacaoInteracoes() {
  const detected = detectInteractions();
  const known = getKnownInteractions();
  let detHtml = detected.length === 0 ? '<p class="text-on-surface-variant">Nenhuma interação detetada.</p>' : '<ul class="space-y-3">' + detected.map(function (i) { return '<li class="p-3 rounded-xl border-l-4" style="border-color:' + i.color + '"><p class="font-medium">' + i.combination + '</p><p class="text-sm capitalize">' + i.severity + '</p><p class="text-sm mt-1">' + i.mechanism + '</p></li>'; }).join('') + '</ul>';
  let knownHtml = '<ul class="space-y-3">' + known.map(function (i) { return '<li class="p-3 rounded-xl border border-outline" style="border-left-width:4px;border-left-color:' + i.color + '"><p class="font-medium">' + i.combination + '</p><p class="text-sm capitalize">' + i.severity + '</p><p class="text-sm mt-1">' + i.mechanism + '</p></li>'; }).join('') + '</ul>';
  return pageHeader('Interações Medicamentosas', '#medicacao-armario') +
    '<main class="app-main space-y-6 bg-white"><section><h2 class="font-bold text-lg mb-2">Interações detetadas no teu armário</h2>' + detHtml + '</section><section><h2 class="font-bold text-lg mb-2">Interações que a app verifica</h2>' + knownHtml + '</section></main>';
}

function viewMedicacaoHistorico() {
  const history = getMedicationHistory();
  const listHtml = history.length === 0 ? '<p class="text-on-surface-variant">Nenhuma toma registada.</p>' : '<ul class="space-y-3">' + history.map(function (h) { return '<li class="p-3 rounded-xl border border-outline flex items-center gap-3"><span class="material-icons text-primary">event</span><div><p class="font-medium">' + escapeHtml(h.medicationName || '') + '</p><p class="text-sm text-on-surface-variant">' + escapeHtml(h.dateTime || '') + ' · ' + escapeHtml(h.dosage || '') + '</p></div></li>'; }).join('') + '</ul>';
  return pageHeader('Histórico de Medicação', '#medicacao-armario') +
    '<main class="app-main bg-white">' + listHtml + '</main>';
}

function viewMedicacaoFolheto(params) {
  const m = getMedicationById(params.id);
  if (!m) return viewMedicacaoCategorias();
  const nameEsc = escapeHtml(m.name || '');
  const dosageEsc = escapeHtml(m.dosage || '-');
  const substanceEsc = escapeHtml(m.substance || '-');
  const manufacturerEsc = escapeHtml(m.manufacturer || '-');
  const posologyEsc = escapeHtml(m.posology || '-');
  const indicationEsc = escapeHtml(m.indication || '-');
  return pageHeader('Folheto informativo', '#medicacao-detalhes?id=' + params.id) +
    '<main class="app-main bg-white space-y-4">' +
    '<section class="leaflet-hero">' +
    '<div>' +
    '<p class="leaflet-kicker">Folheto</p>' +
    '<h2 class="leaflet-title">' + nameEsc + '</h2>' +
    '<p class="leaflet-sub">' + dosageEsc + '</p>' +
    '</div>' +
    '<span class="material-icons leaflet-icon">description</span>' +
    '</section>' +
    '<section class="leaflet-card">' +
    '<h3>Composição</h3>' +
    '<p><strong>Substância ativa:</strong> ' + substanceEsc + '</p>' +
    '<p><strong>Dosagem:</strong> ' + dosageEsc + '</p>' +
    '</section>' +
    '<section class="leaflet-card">' +
    '<h3>Posologia e indicação</h3>' +
    '<p><strong>Posologia:</strong> ' + posologyEsc + '</p>' +
    '<p><strong>Indicação terapêutica:</strong> ' + indicationEsc + '</p>' +
    '</section>' +
    '<section class="leaflet-card">' +
    '<h3>Fabricante</h3>' +
    '<p>' + manufacturerEsc + '</p>' +
    '</section>' +
    '<section class="leaflet-note">' +
    '<span class="material-icons">info</span>' +
    '<p>Consulta sempre o folheto da embalagem ou o teu médico/farmacêutico para informações completas.</p>' +
    '</section>' +
    '</main>';
}

function viewChecklistViagem() {
  let html = pageHeader('Lista de verificação de viagem', '#medicacao') + '<main class="app-main space-y-6 bg-white"><p class="text-sm text-on-surface-variant text-center -mt-2">Lista para não te esqueceres de nada antes de viajar.</p>';
  const state = getTravelChecklistState();
  TRAVEL_SECTIONS.forEach(function (sec) {
    html += '<section class="card-round border border-outline p-4"><h2 class="font-bold mb-3">' + sec.title + '</h2>';
    if (sec.checkbox) {
      sec.items.forEach(function (item, idx) {
        const itemId = sec.id + '-' + idx;
        const checked = state[itemId];
        html += '<label class="flex items-start gap-2 py-1 cursor-pointer checklist-item ' + (checked ? 'done' : '') + '"><input type="checkbox" class="travel-check mt-1" data-id="' + itemId + '"' + (checked ? ' checked' : '') + ' /><span>' + escapeHtml(item) + '</span></label>';
      });
    } else {
      html += '<ul class="list-disc pl-5 space-y-1">';
      sec.items.forEach(function (item) { html += '<li>' + escapeHtml(item) + '</li>'; });
      html += '</ul>';
    }
    html += '</section>';
  });
  html += '</main>';
  return html;
}

function viewLembretes() {
  const list = getReminders().filter(function (r) { return r.isActive; });
  const meds = getMedications().filter(function (m) { return m.isActive; });
  const today = todayStr();
  let listHtml = list.length === 0 ? '<p class="text-on-surface-variant text-center py-8">Nenhum lembrete ativo.</p>' : '<ul class="space-y-3">' + list.map(function (r) {
    const med = getMedicationById(r.medicationId);
    const hours = (r.times && r.times.length ? r.times.join(' · ') : (r.time || ''));
    const isTakenToday = r.lastTakenDate === today;
    const takenLabel = isTakenToday ? 'Já tomei' : 'Não tomado';
    const takenIcon = isTakenToday ? 'check_circle' : 'close';
    const takenClasses = isTakenToday
      ? 'taken-btn flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium btn-primary'
      : 'taken-btn flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-red-500 text-red-500 bg-transparent';
    return '<li class="p-4 app-card card-round">' +
      '<div class="flex justify-between items-start gap-3">' +
      '<div>' +
      '<p class="font-medium">' + escapeHtml(med ? med.name : 'Medicamento') + '</p>' +
      '<p class="text-sm text-on-surface-variant">' + escapeHtml(med ? med.dosage : '') + '</p>' +
      (hours ? '<p class="text-xs text-on-surface-variant mt-1">Horários: ' + hours + '</p>' : '') +
      '</div>' +
      '<div class="flex flex-col items-stretch gap-2 min-w-[140px]">' +
      '<button type="button" class="' + takenClasses + '" data-id="' + r.id + '">' +
      '<span class="material-icons text-sm">' + takenIcon + '</span><span>' + takenLabel + '</span>' +
      '</button>' +
      '<button type="button" class="postpone-btn flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-secondary text-secondary bg-transparent" data-id="' + r.id + '">' +
      '<span class="material-icons text-sm">schedule</span><span>Adiar 15 min</span>' +
      '</button>' +
      '<div class="flex justify-end gap-2 mt-1">' +
      '<a href="#lembretes-editar?id=' + r.id + '" class="btn-link btn-link--primary">Editar</a>' +
      '<button type="button" class="btn-link btn-link--danger deactivate-reminder-btn" data-id="' + r.id + '">Desativar</button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</li>';
  }).join('') + '</ul>';
  if (list.length === 0) {
    listHtml = '<div class="empty-state"><div class="empty-icon"><span class="material-icons">notifications</span></div><p>Ainda não tens lembretes. Cria o primeiro para começares.</p><a href="#lembretes-novo" class="inline-flex items-center justify-center mt-3 px-4 py-2 btn-primary">Criar lembrete</a></div>';
  }
  return pageHeader('Lembretes', null) +
    '<main class="app-main space-y-4 bg-white"><a href="#lembretes-novo" class="flex items-center gap-3 w-full py-3 px-4 rounded-xl btn-primary font-medium"><span class="material-icons">add_circle_outline</span><span>Adicionar lembrete</span></a>' + listHtml + '</main>';
}

function viewLembretesNovo() {
  const meds = getMedications().filter(function (m) { return m.isActive; });
  const medButtons = meds.length === 0
    ? '<p class="text-xs text-on-surface-variant">Não existem medicamentos ativos. Adiciona primeiro um medicamento.</p>'
    : meds.map(function (m) {
        return '<button type="button" class="med-option flex items-center justify-between w-full px-4 py-3 rounded-xl border border-outline bg-white text-left" data-id="' + m.id + '">' +
          '<span class="flex flex-col"><span class="text-sm font-medium">' + escapeHtml(m.name || '') + '</span><span class="text-xs text-on-surface-variant">' + escapeHtml(m.dosage || '') + '</span></span>' +
          '<span class="material-icons text-primary text-lg med-check opacity-0">check_circle</span>' +
          '</button>';
      }).join('');
  const periodButtons = PERIODOS.map(function (p, idx) {
    const range = (p.start || '') + '–' + (p.end || '');
    return '<button type="button" class="period-option flex items-center justify-between w-full px-4 py-3 rounded-xl border border-outline bg-white text-left' + (idx === 0 ? ' is-active' : '') + '" data-id="' + p.id + '">' +
      '<span class="flex items-center gap-2"><span class="material-icons text-primary text-lg">' + (p.icon || 'schedule') + '</span><span class="text-sm font-medium">' + p.label + '</span></span>' +
      '<span class="text-xs text-on-surface-variant">' + range + '</span>' +
      '</button>';
  }).join('');
  return pageHeader('Novo Lembrete', '#lembretes') +
    '<main class="app-main bg-white"><form id="form-new-reminder" class="space-y-4">' +
    '<div><label class="block text-sm font-medium mb-1">Medicamento ativo *</label><div id="rem-medication-list" class="space-y-2">' + medButtons + '</div><input type="hidden" name="medicationId" id="rem-medication-id" required /></div>' +
    '<div><label class="block text-sm font-medium mb-1">Data de início *</label><input type="date" name="startDate" required value="' + todayStr() + '" class="w-full px-4 py-2 input-outline" /></div>' +
    '<div><label class="block text-sm font-medium mb-1">Data de fim</label><input type="date" name="endDate" class="w-full px-4 py-2 input-outline" /></div>' +
    '<div>' +
    '<label class="block text-sm font-medium mb-1">Seleciona o período</label>' +
    '<div id="rem-period-list" class="space-y-2">' + periodButtons + '</div>' +
    '<div class="mt-4">' +
    '<p class="text-sm font-medium mb-1">Seleciona até 3 horários</p>' +
    '<div id="rem-time-grid" class="grid grid-cols-3 gap-2" aria-describedby="rem-time-help"></div>' +
    '<p class="text-sm text-on-surface-variant mt-1" id="rem-time-help">Os horários são sugeridos de 30 em 30 minutos dentro do período escolhido.</p>' +
    '</div>' +
    '</div>' +
    '<button type="submit" class="w-full py-3 btn-primary font-medium rounded-xl btn-round">Criar lembrete</button></form></main>';
}

function viewLembretesEditar(params) {
  const r = getReminderById(params.id);
  if (!r) return viewLembretes();
  const meds = getMedications().filter(function (m) { return m.isActive; });
  const medButtons = meds.length === 0
    ? '<p class="text-xs text-on-surface-variant">Não existem medicamentos ativos.</p>'
    : meds.map(function (m) {
        const selected = m.id === r.medicationId;
        return '<button type="button" class="med-option flex items-center justify-between w-full px-4 py-3 rounded-xl border ' +
          (selected ? 'border-primary bg-primary-container' : 'border-outline bg-white') +
          ' text-left" data-id="' + m.id + '">' +
          '<span class="flex flex-col"><span class="text-sm font-medium">' + escapeHtml(m.name || '') + '</span><span class="text-xs text-on-surface-variant">' + escapeHtml(m.dosage || '') + '</span></span>' +
          '<span class="material-icons text-primary text-lg med-check ' + (selected ? '' : 'opacity-0') + '">check_circle</span>' +
          '</button>';
      }).join('');
  const periodButtons = PERIODOS.map(function (p, idx) {
    const range = (p.start || '') + '–' + (p.end || '');
    return '<button type="button" class="period-option flex items-center justify-between w-full px-4 py-3 rounded-xl border border-outline bg-white text-left' + (idx === 0 ? ' is-active' : '') + '" data-id="' + p.id + '">' +
      '<span class="flex items-center gap-2"><span class="material-icons text-primary text-lg">' + (p.icon || 'schedule') + '</span><span class="text-sm font-medium">' + p.label + '</span></span>' +
      '<span class="text-xs text-on-surface-variant">' + range + '</span>' +
      '</button>';
  }).join('');
  return pageHeader('Editar Lembrete', '#lembretes') +
    '<main class="app-main bg-white"><form id="form-edit-reminder" data-id="' + r.id + '" class="space-y-4">' +
    '<div><label class="block text-sm font-medium mb-1">Medicamento ativo *</label><div id="rem-medication-list" class="space-y-2">' + medButtons + '</div><input type="hidden" name="medicationId" id="rem-medication-id" value="' + (r.medicationId || '') + '" required /></div>' +
    '<div><label class="block text-sm font-medium mb-1">Data de início *</label><input type="date" name="startDate" required value="' + (r.startDate || '') + '" class="w-full px-4 py-2 input-outline" /></div>' +
    '<div><label class="block text-sm font-medium mb-1">Data de fim</label><input type="date" name="endDate" value="' + (r.endDate || '') + '" class="w-full px-4 py-2 input-outline" /></div>' +
    '<div>' +
    '<label class="block text-sm font-medium mb-1">Seleciona o período</label>' +
    '<div id="rem-period-list" class="space-y-2">' + periodButtons + '</div>' +
    '<div class="mt-4">' +
    '<p class="text-sm font-medium mb-1">Seleciona até 3 horários</p>' +
    '<div id="rem-time-grid" class="grid grid-cols-3 gap-2" aria-describedby="rem-time-help-edit"></div>' +
    '<p class="text-sm text-on-surface-variant mt-1" id="rem-time-help-edit">Os horários são sugeridos de 30 em 30 minutos dentro do período escolhido.</p>' +
    '</div>' +
    '</div>' +
    '<button type="submit" class="w-full py-3 btn-primary font-medium rounded-xl btn-round">Guardar</button></form></main>';
}

function viewReciclagem() {
  const s = recyclingStats();
  const isEmpty = s.totalPackages === 0;
  if (isEmpty) {
    return pageHeader('Reciclagem', null) +
      '<main class="app-main space-y-4 bg-white">' +
      '<div class="empty-state">' +
      '<div class="empty-icon"><span class="material-icons">recycling</span></div>' +
      '<p>Ainda não existem entregas. Regista a tua primeira entrega para começares.</p>' +
      '<a href="#reciclagem-registar" class="inline-flex items-center justify-center mt-3 px-4 py-2 btn-primary">Registar entrega</a>' +
      '</div>' +
      '<a href="#reciclagem-guia" class="flex items-center justify-between w-full py-3 px-4 rounded-xl bg-secondary-container text-secondary font-medium"><span>Guia de Reciclagem</span><span class="material-icons text-gray-500">chevron_right</span></a>' +
      '</main>';
  }
  const progressBar = s.nextLevel ? '<div class="mt-3 h-2.5 bg-gray-200 rounded-full overflow-hidden"><div class="h-full bg-primary rounded-full transition-all" style="width:' + Math.min(100, s.progress) + '%"></div></div><p class="text-xs text-on-surface-variant mt-2">Próximo: ' + s.nextLevel.name + ' (' + s.nextLevel.min + ' pts)</p>' : '';
  const milestoneBlock = s.milestoneText ? '<p class="p-3 rounded-xl bg-green-50 text-green-800 text-sm">' + s.milestoneText + '</p>' : '';
  return pageHeader('Reciclagem', null) +
    '<main class="app-main space-y-4 bg-white">' +
    '<div class="grid grid-cols-2 gap-3">' +
    '<div class="rounded-2xl p-4 bg-primary-container shadow-sm border border-gray-100"><p class="text-sm text-black">Embalagens recicladas</p><p class="text-2xl font-bold text-primary">' + s.totalPackages + '</p></div>' +
    '<div class="rounded-2xl p-4 bg-secondary-container shadow-sm border border-gray-100"><p class="text-sm text-black">Unidades verdes</p><p class="text-2xl font-bold text-secondary">' + s.greenUnits + '</p></div>' +
    '</div>' +
    '<div class="rounded-2xl p-4 border border-gray-200 bg-white shadow-sm">' +
    '<div class="flex items-center justify-between">' +
    '<div><p class="text-sm text-black">Pontos</p><p class="text-2xl font-bold">' + s.points + '</p></div>' +
    '<div class="text-right"><p class="text-xs text-on-surface-variant">Nível atual</p><p class="text-sm font-semibold text-green-700">' + s.level.name + '</p></div>' +
    '</div>' + progressBar + '</div>' +
    '<div class="eco-summary rounded-2xl p-4">' +
    '<div class="flex items-center gap-2"><span class="material-icons text-green-700">eco</span><p class="font-medium text-green-900">Resumo ecológico</p></div>' +
    '<p class="text-sm text-green-800 mt-2">Já evitou o descarte incorreto de <strong>' + s.totalPackages + '</strong> embalagens.</p>' +
    '</div>' +
    milestoneBlock +
    '<div class="space-y-2">' +
    '<a href="#reciclagem-registar" class="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl btn-primary font-medium"><span class="material-icons">add_circle_outline</span><span>Registar Entrega</span></a>' +
    '<a href="#reciclagem-guia" class="flex items-center justify-between w-full py-3 px-4 rounded-xl bg-secondary-container text-secondary font-medium"><span>Guia de Reciclagem</span><span class="material-icons text-gray-500">chevron_right</span></a>' +
    '<a href="#reciclagem-pontos" class="flex items-center justify-between w-full py-3 px-4 rounded-xl bg-secondary-container text-secondary font-medium"><span>Localizador de Pontos</span><span class="material-icons text-gray-500">chevron_right</span></a>' +
    '<a href="#reciclagem-historico" class="flex items-center justify-between w-full py-3 px-4 rounded-xl bg-primary-container text-black font-medium"><span>Histórico</span><span class="material-icons text-gray-500">chevron_right</span></a>' +
    '</div>' +
    '</main>';
}

function viewReciclagemRegistar() {
  return pageHeader('Registar Entrega', '#reciclagem') +
    '<main class="app-main bg-white"><form id="form-recycling" class="space-y-4"><div><label class="block text-sm font-medium mb-1">Volume *</label><select name="volume" required class="w-full px-4 py-2 input-outline"><option value="pequeno">Pequeno (~6 embalagens)</option><option value="medio">Médio (~15)</option><option value="grande">Grande (~30)</option></select></div><div><label class="block text-sm font-medium mb-1">Nome da farmácia (opcional)</label><input type="text" name="pharmacyName" class="w-full px-4 py-2 input-outline" /></div><div id="recycling-summary" class="hidden p-3 rounded-xl bg-gray-100 text-sm"></div><button type="submit" class="w-full py-3 btn-primary font-medium rounded-xl btn-round">Confirmar</button></form></main>';
}

function viewReciclagemGuia() {
  return pageHeader('Guia de Reciclagem', '#reciclagem') +
    '<main class="app-main bg-white space-y-4">' +
    '<section class="recycling-guide-hero">' +
    '<div><p class="guide-kicker">Guia rápido</p><h3 class="guide-title">Como reciclar medicamentos com segurança</h3><p class="guide-sub">Segue estes passos simples para proteger a tua saúde e o ambiente.</p></div>' +
    '<span class="material-icons guide-hero-icon">recycling</span>' +
    '</section>' +
    '<section class="recycling-guide-steps">' +
    '<div class="guide-step"><div class="guide-step__num">1</div><div><h4>Separa o que vais entregar</h4><p>Medicamentos fora de prazo, sobras, embalagens vazias e medicamentos veterinários.</p></div></div>' +
    '<div class="guide-step"><div class="guide-step__num">2</div><div><h4>Remove dados pessoais</h4><p>Apaga etiquetas com o teu nome e mantém as embalagens fechadas.</p></div></div>' +
    '<div class="guide-step"><div class="guide-step__num">3</div><div><h4>Entrega no local certo</h4><p>Leva tudo a uma farmácia ou parafarmácia aderente (Valormed).</p></div></div>' +
    '</section>' +
    '<section class="recycling-guide-grid">' +
    '<div class="recycling-guide-card"><div class="recycling-guide-icon"><span class="material-icons">check_circle</span></div><div><h3>O que entregar</h3><p>Blisters, frascos, bisnagas, caixas e folhetos.</p></div></div>' +
    '<div class="recycling-guide-card"><div class="recycling-guide-icon"><span class="material-icons">block</span></div><div><h3>O que não fazer</h3><p>Não deites no lixo comum nem na sanita.</p></div></div>' +
    '<div class="recycling-guide-card"><div class="recycling-guide-icon"><span class="material-icons">location_on</span></div><div><h3>Onde entregar</h3><p>Farmácias e parafarmácias aderentes.</p></div></div>' +
    '<div class="recycling-guide-card"><div class="recycling-guide-icon"><span class="material-icons">verified_user</span></div><div><h3>Cuidados</h3><p>Embalagens fechadas e sem dados pessoais.</p></div></div>' +
    '</section>' +
    '<section class="recycling-guide-cta">' +
    '<a href="#reciclagem-pontos" class="btn-primary w-full">Encontrar pontos de recolha</a>' +
    '<a href="#reciclagem-registar" class="btn-outline w-full">Registar entrega</a>' +
    '</section>' +
    '</main>';
}

function viewReciclagemPontos() {
  const pointsHtml = RECYCLING_POINTS.map(function (p, i) {
    var distLabel = p.distanceCalc || '—';
    return '<li><button type="button" class="block w-full text-left p-4 app-card map-point-item" data-idx="' + i + '">' +
      '<div class="flex items-start gap-3"><span class="material-icons text-primary">location_on</span>' +
      '<div><p class="font-medium">' + p.name + '</p>' +
      '<p class="text-sm text-on-surface-variant">' + p.address + '</p>' +
      '<p class="text-sm flex items-center gap-1"><span class="material-icons text-sm">straighten</span> ' + distLabel + '</p></div></div></button></li>';
  }).join('');
  return pageHeader('Localizador de Pontos', '#reciclagem') +
    '<main class="app-main bg-white space-y-4">' +
    '<div class="flex items-center justify-between gap-2">' +
    '<div class="flex items-center gap-2">' +
    '<button type="button" id="btn-use-location" class="btn-primary px-4 py-2 rounded-xl flex items-center gap-2"><span class="material-icons">my_location</span><span>Usar a minha localização</span></button>' +
    '<button type="button" id="btn-refresh-location" class="btn-outline px-4 py-2 rounded-xl flex items-center gap-2"><span class="material-icons">refresh</span><span>Atualizar localização</span></button>' +
    '</div>' +
    '<div id="map-status" class="text-xs text-on-surface-variant"></div>' +
    '</div>' +
    '<div class="flex flex-wrap gap-2">' +
    '<button type="button" class="chip chip--active map-radius" data-radius="all">Todas</button>' +
    '<button type="button" class="chip chip--ghost map-radius" data-radius="5">Até 5 km</button>' +
    '</div>' +
    '<div id="recycling-map" class="map-card" aria-label="Mapa de pontos de recolha"></div>' +
    '<ul class="space-y-3" id="map-points-list">' + pointsHtml + '</ul></main>';
}

function viewReciclagemPonto(params) {
  const id = parseInt(params.id, 10);
  const p = RECYCLING_POINTS[id];
  if (!p) return viewReciclagemPontos();
  return pageHeader(p.name, '#reciclagem-pontos') +
    '<main class="app-main space-y-2 bg-white"><p><span class="material-icons align-middle text-lg mr-1">location_on</span> ' + p.address + '</p><p><span class="material-icons align-middle text-lg mr-1">straighten</span> ' + p.distance + '</p><p class="text-sm text-on-surface-variant">Ponto de recolha Valormed.</p></main>';
}

function viewReciclagemHistorico() {
  const list = getRecyclingDeliveries().slice().reverse();
  const listHtml = list.length === 0 ? '<p class="text-on-surface-variant">Nenhuma entrega registada.</p>' : '<ul class="space-y-3">' + list.map(function (d) { return '<li class="p-3 app-card"><p class="font-medium">' + (d.date || '') + '</p><p class="text-sm">' + (d.totalPackages || 0) + ' embalagens · ' + (d.points || 0) + ' pontos' + (d.pharmacyName ? ' · ' + d.pharmacyName : '') + '</p></li>'; }).join('') + '</ul>';
  return pageHeader('Histórico de Reciclagem', '#reciclagem') +
    '<main class="app-main bg-white">' + listHtml + '</main>';
}

function getLastReadDicaId() {
  try { return localStorage.getItem('dailymed_last_dica') || ''; } catch (e) { return ''; }
}

function setLastReadDicaId(id) {
  try { if (id) localStorage.setItem('dailymed_last_dica', id); } catch (e) {}
}

function viewDicas() {
  const lastId = getLastReadDicaId();
  const featured = DICAS_ARTIGOS.find(function (a) { return a.id === lastId; }) || DICAS_ARTIGOS[0];
  const list = featured ? DICAS_ARTIGOS.filter(function (a) { return a.id !== featured.id; }) : DICAS_ARTIGOS;
  const cards = list.map(function (a) {
    return '<a href="#dicas-artigo?id=' + a.id + '" class="dicas-card">' +
      '<div class="dicas-card__media"><img src="' + a.image + '" alt="" /></div>' +
      '<div class="dicas-card__body">' +
      '<span class="dicas-chip">' + escapeHtml(a.category) + '</span>' +
      '<h2>' + escapeHtml(a.title) + '</h2>' +
      '<p>' + a.readTime + ' min de leitura</p>' +
      '</div>' +
      '</a>';
  }).join('');
  return pageHeader('Dicas de Saúde', null) +
    '<main class="app-main bg-white">' +
    '<section class="dicas-hero">' +
    '<div>' +
    '<p class="dicas-kicker">Guia rápido</p>' +
    '<h2>Cuida da tua saúde com informação simples e prática.</h2>' +
    '<p>Seleciona um tema e guarda as dicas úteis para o teu dia a dia.</p>' +
    '</div>' +
    '<span class="material-icons">favorite</span>' +
    '</section>' +
    '<section class="dicas-actions">' +
    '<a href="#checklist-viagem" class="dicas-action">' +
    '<div><span class="material-icons">flight_takeoff</span><span>Checklist de viagem</span></div>' +
    '<span class="material-icons dicas-action__arrow">chevron_right</span>' +
    '</a>' +
    '</section>' +
    (featured ? '<section class="dicas-featured">' +
      '<a href="#dicas-artigo?id=' + featured.id + '" class="dicas-featured__card">' +
      '<div class="dicas-featured__media"><img src="' + featured.image + '" alt="" /></div>' +
      '<div class="dicas-featured__body">' +
      '<div class="dicas-featured__meta">' +
      '<span class="dicas-chip dicas-chip--light">' + escapeHtml(featured.category) + '</span>' +
      '<span class="dicas-featured__badge">Último lido</span>' +
      '</div>' +
      '<h3>' + escapeHtml(featured.title) + '</h3>' +
      '<p>' + featured.readTime + ' min de leitura</p>' +
      '</div>' +
      '</a>' +
      '</section>' : '') +
    '<section class="dicas-grid">' + cards + '</section>' +
    '</main>';
}

function viewDicasArtigo(params) {
  const a = DICAS_ARTIGOS.find(function (x) { return x.id === params.id; });
  if (!a) return viewDicas();
  setLastReadDicaId(a.id);
  const paragraphs = a.text.split(/\n\n+/).filter(Boolean);
  const body = paragraphs.map(function (p) { return '<p>' + escapeHtml(p) + '</p>'; }).join('');
  return pageHeader('', '#dicas') +
    '<main class="app-main bg-white dicas-article">' +
    '<div class="dicas-article__media"><img src="' + a.image + '" alt="" /></div>' +
    '<div class="dicas-article__content">' +
    '<span class="dicas-chip">' + escapeHtml(a.category) + '</span>' +
    '<p class="dicas-meta">' + escapeHtml(a.publishedAt) + ' · ' + a.readTime + ' min</p>' +
    '<h1>' + escapeHtml(a.title) + '</h1>' +
    '<div class="dicas-body">' + body + '</div>' +
    '</div>' +
    '</main>';
}

function viewDefinicoes() {
  const s = getSettings();
  return pageHeader('Definições', '#home') +
    '<main class="app-main space-y-4 bg-white"><div class="flex items-center justify-between p-4 rounded-xl border border-gray-200"><span class="font-medium text-black">Notificações</span><input type="checkbox" id="setting-notifications" ' + (s.notifications ? 'checked' : '') + ' class="rounded" /></div><div class="flex items-center justify-between p-4 rounded-xl border border-gray-200"><span class="font-medium text-black">Tema</span><select id="setting-theme" class="px-3 py-2 rounded-lg border border-gray-200"><option value="light"' + (s.theme === 'light' ? ' selected' : '') + '>Claro</option><option value="dark"' + (s.theme === 'dark' ? ' selected' : '') + '>Escuro</option></select></div></main>';
}

const ROUTES = {
  home: viewHome,
  medicacao: viewMedicacaoCategorias,
  'medicacao-categorias': viewMedicacaoCategorias,
  'medicacao-armario': viewMedicacaoArmario,
  'medicacao-adicionar': viewMedicacaoAdicionar,
  'medicacao-detalhes': viewMedicacaoDetalhes,
  'medicacao-editar': viewMedicacaoEditar,
  'medicacao-pesquisar': viewMedicacaoPesquisar,
  'medicacao-interacoes': viewMedicacaoInteracoes,
  'medicacao-historico': viewMedicacaoHistorico,
  'medicacao-folheto': viewMedicacaoFolheto,
  'checklist-viagem': viewChecklistViagem,
  lembretes: viewLembretes,
  'lembretes-novo': viewLembretesNovo,
  'lembretes-editar': viewLembretesEditar,
  reciclagem: viewReciclagem,
  'reciclagem-registar': viewReciclagemRegistar,
  'reciclagem-guia': viewReciclagemGuia,
  'reciclagem-pontos': viewReciclagemPontos,
  'reciclagem-ponto': viewReciclagemPonto,
  'reciclagem-historico': viewReciclagemHistorico,
  dicas: viewDicas,
  'dicas-artigo': viewDicasArtigo,
  definicoes: viewDefinicoes,
};

function pageHeader(title, backHref) {
  var back = backHref ? '<a href="' + backHref + '" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 p-1 rounded-full hover:bg-gray-100" aria-label="Voltar"><span class="material-icons">arrow_back</span></a>' : '';
  var safeTitle = title ? escapeHtml(title) : '';
  return '<header class="subpage-header relative px-4 flex items-center justify-center bg-white">' + back +
    '<img src="logo.png" alt="DailyMed" class="app-logo object-contain" />' +
    '</header>' +
    (title ? '<div class="subpage-title-wrap px-4 pb-4 bg-white"><h2 class="page-title text-black text-center">' + safeTitle + '</h2></div>' : '');
}

function runRoute() {
  const parsed = parseHash();
  const pathNorm = parsed.path || 'home';
  currentView = pathNorm;
  const fn = ROUTES[pathNorm] || ROUTES.home;
  const showNav = ['home', 'medicacao', 'lembretes', 'reciclagem', 'dicas'].indexOf(pathNorm.split('-')[0]) >= 0;
  render(fn(parsed.params), showNav);
  afterRender(pathNorm, parsed.params);
}

function afterRender(path, params) {
  setupFab();
  if (path === 'reciclagem-pontos') initRecyclingMap();

  var armarioSearch = document.getElementById('armario-search');
  if (armarioSearch) {
    var currentParams = parseHash().params;
    var onSearchInput = debounce(function () {
      var q = armarioSearch.value.trim();
      var np = compactParams({ filter: currentParams.filter, cat: currentParams.cat, q: q });
      navigate('medicacao-armario', np);
    }, 250);
    armarioSearch.addEventListener('input', onSearchInput);
  }
  var armarioFilter = document.getElementById('armario-filter');
  if (armarioFilter) {
    var currentParamsFilter = parseHash().params;
    armarioFilter.addEventListener('change', function () {
      var np = compactParams({ cat: currentParamsFilter.cat, filter: armarioFilter.value, q: currentParamsFilter.q });
      navigate('medicacao-armario', np);
    });
  }

  var medName = document.getElementById('med-name');
  var medSubstance = document.getElementById('med-substance');
  var acList = document.getElementById('autocomplete-list');
  if (medName && acList) {
    medName.addEventListener('input', function () {
      var q = medName.value.trim();
      if (q.length < 2) { acList.classList.add('hidden'); acList.innerHTML = ''; return; }
      acList.innerHTML = '<li class="px-4 py-2 text-on-surface-variant text-sm">A carregar...</li>';
      acList.classList.remove('hidden');
      getInfomedReady().then(function () {
        var results = searchInfomed(q, 10);
        acList.innerHTML = results.map(function (item) {
          var d = getItemDisplay(item);
          var name = escapeHtml(d.name || '');
          var dosage = escapeHtml(d.dosage || '');
          var substance = escapeHtml(d.substance || '');
          var titular = escapeHtml(d.titular || '');
          return '<li class="px-4 py-2 cursor-pointer border-b border-outline last:border-0" data-name="' + name + '" data-dosage="' + dosage + '" data-substance="' + substance + '" data-manufacturer="' + titular + '">' + escapeHtml(d.name || '') + ' · ' + escapeHtml(d.dosage || '') + '</li>';
        }).join('');
        acList.classList.toggle('hidden', !results.length);
      });
    });
    medName.addEventListener('blur', function () { setTimeout(function () { acList.classList.add('hidden'); }, 200); });
    acList.addEventListener('click', function (e) {
      var li = e.target.closest('li');
      if (!li) return;
      medName.value = li.dataset.name || '';
      var dosageInput = document.querySelector('#form-add-med input[name="dosage"]');
      if (dosageInput) dosageInput.value = li.dataset.dosage || '';
      if (medSubstance) medSubstance.value = li.dataset.substance || '';
      var manuInput = document.querySelector('#form-add-med input[name="manufacturer"]');
      if (manuInput) manuInput.value = li.dataset.manufacturer || '';
      acList.classList.add('hidden');
    });
  }

  var formAdd = document.getElementById('form-add-med');
  if (formAdd) {
    formAdd.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(formAdd);
      var imageInput = formAdd.querySelector('input[name="image"]');
      var imageUri = null;
      if (imageInput && imageInput.files && imageInput.files[0]) {
        var fr = new FileReader();
        fr.onload = function () {
          imageUri = fr.result;
          saveMedAndShow(formAdd, imageUri);
        };
        fr.readAsDataURL(imageInput.files[0]);
      } else {
        saveMedAndShow(formAdd, null);
      }
    });
  }

  function saveMedAndShow(form, imageUri) {
    var fd = new FormData(form);
    var med = {
      id: genId(),
      name: fd.get('name'),
      dosage: fd.get('dosage'),
      substance: fd.get('substance') || null,
      quantity: parseInt(fd.get('quantity'), 10) || 0,
      expiryDate: fd.get('expiryDate'),
      manufacturer: fd.get('manufacturer') || '',
      category: fd.get('category'),
      isActive: fd.get('isActive') === 'true',
      isInStock: true,
      addedDate: todayStr(),
      posology: fd.get('posology') || '',
      indication: fd.get('indication') || '',
      notes: fd.get('notes') || '',
      reminderTimes: [],
      dailyDosage: '',
      imageUri: imageUri || null,
    };
    saveMedication(med);
    showToast('Medicamento guardado', 'check_circle');
    checkMedicationAlerts();
    var detected = detectInteractions();
    if (detected.length > 0) {
      showInteractionsModal(detected, function () { navigate('medicacao-armario'); });
    } else {
      navigate('medicacao-armario');
    }
  }

  var formEdit = document.getElementById('form-edit-med');
  if (formEdit) {
    formEdit.addEventListener('submit', function (e) {
      e.preventDefault();
      var id = formEdit.dataset.id;
      var fd = new FormData(formEdit);
      var m = getMedicationById(id);
      if (!m) return;
      m.name = fd.get('name');
      m.dosage = fd.get('dosage');
      m.substance = fd.get('substance') || null;
      m.quantity = parseInt(fd.get('quantity'), 10) || 0;
      m.expiryDate = fd.get('expiryDate');
      m.manufacturer = fd.get('manufacturer') || '';
      m.category = fd.get('category');
      m.isActive = fd.get('isActive') === 'true';
      m.posology = fd.get('posology') || '';
      m.indication = fd.get('indication') || '';
      m.notes = fd.get('notes') || '';
      saveMedication(m);
      showToast('Medicamento guardado', 'check_circle');
      checkMedicationAlerts();
      navigate('medicacao-detalhes', { id: id });
    });
  }

  document.querySelectorAll('.delete-med').forEach(function (btn) {
    btn.addEventListener('click', function (e) { e.stopPropagation(); });
    btn.addEventListener('click', function () {
      var m = getMedicationById(btn.dataset.id);
      var name = m ? (m.name || 'este medicamento') : 'este medicamento';
      if (confirm('Remover ' + name + '?')) {
        deleteMedication(btn.dataset.id);
        checkMedicationAlerts();
        runRoute();
      }
    });
  });

  document.querySelectorAll('.med-card-detail').forEach(function (el) {
    el.addEventListener('click', function () {
      var id = el.dataset.id;
      if (id) navigate('medicacao-detalhes', { id: id });
    });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.click(); } });
  });

  document.querySelectorAll('.travel-check').forEach(function (cb) {
    cb.addEventListener('change', function () {
      setTravelChecklistItem(cb.dataset.id, cb.checked);
      cb.closest('label').classList.toggle('done', cb.checked);
    });
  });

  function setupReminderForm(form, options) {
    options = options || {};
    var selectedTimes = (options.initialTimes || []).slice(0, 3);
    var medHidden = form.querySelector('#rem-medication-id');
    if (options.initialMedicationId && medHidden) {
      medHidden.value = options.initialMedicationId;
    }

    // Seleção de medicamento (cards)
    var medButtons = form.querySelectorAll('.med-option');
    medButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.dataset.id;
        if (!id || !medHidden) return;
        medHidden.value = id;
        medButtons.forEach(function (other) {
          other.classList.remove('border-primary', 'bg-primary-container');
          other.classList.add('border-outline', 'bg-white');
          var icon = other.querySelector('.med-check');
          if (icon) icon.classList.add('opacity-0');
        });
        btn.classList.remove('border-outline', 'bg-white');
        btn.classList.add('border-primary', 'bg-primary-container');
        var icon = btn.querySelector('.med-check');
        if (icon) icon.classList.remove('opacity-0');
      });
    });

    // Períodos e grelha de horários (30 em 30 min)
    var periodBtns = form.querySelectorAll('.period-option');
    var timeGrid = form.querySelector('#rem-time-grid');
    if (!timeGrid || !periodBtns.length) {
      form._getSelectedTimes = function () { return selectedTimes.slice(); };
      return;
    }

    var timeToMinutes = Core && Core.timeToMinutes ? Core.timeToMinutes : function (t) {
      var parts = (t || '').split(':');
      var h = parseInt(parts[0] || '0', 10);
      var m = parseInt(parts[1] || '0', 10);
      return h * 60 + m;
    };

    var minutesToTime = Core && Core.minutesToTime ? Core.minutesToTime : function (min) {
      var h = Math.floor(min / 60);
      var m = min % 60;
      return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    };

    function getPeriodById(id) {
      return PERIODOS.find(function (p) { return p.id === id; }) || PERIODOS[0];
    }

    var activePeriodId = (Core && Core.pickPeriodId)
      ? Core.pickPeriodId(options.initialTimes, PERIODOS)
      : (function () {
          if (options.initialTimes && options.initialTimes.length) {
            var t0 = options.initialTimes[0];
            var baseMin = timeToMinutes(t0);
            for (var i = 0; i < PERIODOS.length; i++) {
              var p = PERIODOS[i];
              if (!p.start || !p.end) continue;
              var s = timeToMinutes(p.start);
              var e = timeToMinutes(p.end);
              if (baseMin >= s && baseMin <= e) return p.id;
            }
          }
          var firstBtn = periodBtns[0];
          return firstBtn ? firstBtn.dataset.id : (PERIODOS[0] && PERIODOS[0].id);
        })();

    function updatePeriodHighlight() {
      periodBtns.forEach(function (btn) {
        var isActive = btn.dataset.id === activePeriodId;
        btn.classList.toggle('is-active', isActive);
        if (isActive) {
          btn.classList.add('border-primary', 'bg-primary-container');
          btn.classList.remove('border-outline', 'bg-white');
        } else {
          btn.classList.remove('border-primary', 'bg-primary-container');
          btn.classList.add('border-outline', 'bg-white');
        }
      });
    }

    function renderTimeGrid() {
      var period = getPeriodById(activePeriodId);
      if (!period || !period.start || !period.end) {
        timeGrid.innerHTML = '';
        return;
      }
      var html = '';
      var slots = (Core && Core.buildTimeGrid)
        ? Core.buildTimeGrid(period.start, period.end, 30)
        : (function () {
            var startMin = timeToMinutes(period.start);
            var endMin = timeToMinutes(period.end);
            var list = [];
            for (var m = startMin; m <= endMin; m += 30) list.push(minutesToTime(m));
            return list;
          })();
      for (var i = 0; i < slots.length; i++) {
        var t = slots[i];
        var selected = selectedTimes.indexOf(t) !== -1;
        html += '<button type="button" class="time-chip px-3 py-1.5 rounded-full text-xs font-medium border ' +
          (selected ? 'border-primary bg-primary text-on-primary' : 'border-outline bg-white text-black') +
          '" data-time="' + t + '">' + t + '</button>';
      }
      timeGrid.innerHTML = html;
    }

    periodBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        activePeriodId = btn.dataset.id;
        updatePeriodHighlight();
        renderTimeGrid();
      });
    });

    timeGrid.addEventListener('click', function (e) {
      var chip = e.target.closest('.time-chip');
      if (!chip) return;
      var t = chip.dataset.time;
      if (!t) return;
      if (Core && Core.toggleTimeSelection) {
        var res = Core.toggleTimeSelection(selectedTimes, t, 3);
        selectedTimes = res.times;
        if (res.exceeded) {
          alert('Só podes selecionar até 3 horários distintos.');
          return;
        }
      } else {
        var idx = selectedTimes.indexOf(t);
        if (idx !== -1) {
          selectedTimes.splice(idx, 1);
        } else {
          if (selectedTimes.length >= 3) {
            alert('Só podes selecionar até 3 horários distintos.');
            return;
          }
          selectedTimes.push(t);
        }
      }
      renderTimeGrid();
    });

    updatePeriodHighlight();
    renderTimeGrid();

    form._getSelectedTimes = function () { return selectedTimes.slice(); };
  }

  var formNewRem = document.getElementById('form-new-reminder');
  if (formNewRem) {
    setupReminderForm(formNewRem, { initialTimes: [] });
    formNewRem.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(formNewRem);
      var times = (typeof formNewRem._getSelectedTimes === 'function') ? formNewRem._getSelectedTimes() : [];
      if (!times.length) {
        alert('Seleciona pelo menos um horário.');
        return;
      }
      if (times.length > 3) times = times.slice(0, 3);
      var rem = {
        id: genId(),
        medicationId: fd.get('medicationId'),
        startDate: fd.get('startDate'),
        endDate: fd.get('endDate') || null,
        period: null,
        time: times[0],
        times: times,
        isActive: true,
        lastTakenDate: null,
        lastNotifiedDate: null,
        lastNotifiedTimes: [],
      };
      saveReminder(rem);
      showToast('Lembrete criado', 'check_circle');
      scheduleReminderNotifications();
      navigate('lembretes');
    });
  }

  var formEditRem = document.getElementById('form-edit-reminder');
  if (formEditRem) {
    var existingRem = getReminderById(formEditRem.dataset.id);
    var initialTimesEdit = existingRem && Array.isArray(existingRem.times)
      ? existingRem.times
      : (existingRem && existingRem.time ? [existingRem.time] : []);
    setupReminderForm(formEditRem, {
      initialTimes: initialTimesEdit,
      initialMedicationId: existingRem ? existingRem.medicationId : null,
    });
    formEditRem.addEventListener('submit', function (e) {
      e.preventDefault();
      var id = formEditRem.dataset.id;
      var fd = new FormData(formEditRem);
      var r = getReminderById(id);
      if (!r) return;
      var timesEdit = (typeof formEditRem._getSelectedTimes === 'function') ? formEditRem._getSelectedTimes() : [];
      if (!timesEdit.length) {
        alert('Seleciona pelo menos um horário.');
        return;
      }
      if (timesEdit.length > 3) timesEdit = timesEdit.slice(0, 3);
      r.medicationId = fd.get('medicationId');
      r.startDate = fd.get('startDate');
      r.endDate = fd.get('endDate') || null;
      r.period = null;
      r.time = timesEdit[0];
      r.times = timesEdit;
      saveReminder(r);
      showToast('Lembrete guardado', 'check_circle');
      scheduleReminderNotifications();
      navigate('lembretes');
    });
  }

  document.querySelectorAll('.taken-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var r = getReminderById(btn.dataset.id);
      if (r) {
        var med = getMedicationById(r.medicationId);
        var today = todayStr();
        if (r.lastTakenDate === today) {
          // Voltar a "Não Tomado" (clique por engano): repor 1 unidade
          r.lastTakenDate = null;
          if (med && (med.quantity != null)) {
            med.quantity = (parseInt(med.quantity, 10) || 0) + 1;
            saveMedication(med);
          }
        } else {
          // Marcar como "Já Tomei" hoje: descontar 1 unidade
          if (med && (med.quantity != null)) {
            var qty = parseInt(med.quantity, 10) || 0;
            if (qty > 0) {
              med.quantity = qty - 1;
              saveMedication(med);
            }
          }
          addMedicationHistory({
            medicationName: med ? med.name : '',
            dosage: med ? med.dosage : '',
            dateTime: new Date().toLocaleString('pt-PT'),
            notes: '',
          });
          r.lastTakenDate = today;
        }
        saveReminder(r);
      }
      checkMedicationAlerts();
      runRoute();
    });
  });
  document.querySelectorAll('.postpone-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var r = getReminderById(btn.dataset.id);
      if (!r) { alert('Não foi possível adiar o lembrete.'); return; }
      var now = new Date();
      var snoozeAt = new Date(now.getTime() + 15 * 60 * 1000);
      var hh = String(snoozeAt.getHours()).padStart(2, '0');
      var mm = String(snoozeAt.getMinutes()).padStart(2, '0');
      var horaTexto = hh + ':' + mm;

      var settings = getSettings();
      if (settings.notifications && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        var med = getMedicationById(r.medicationId);
        var titulo = 'Lembrete DailyMed';
        var corpo = 'Hora de tomar ' + (med ? med.name : 'o teu medicamento') + '.';
        setTimeout(function () {
          try {
            new Notification(titulo, { body: corpo });
          } catch (e) {}
        }, 15 * 60 * 1000);
      }

      alert('Lembrete adiado para ' + horaTexto + ' (simulação em HTML / navegador).');
    });
  });
  document.querySelectorAll('.deactivate-reminder-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var r = getReminderById(btn.dataset.id);
      if (r) { r.isActive = false; saveReminder(r); }
      scheduleReminderNotifications();
      runRoute();
    });
  });

  var formRecycling = document.getElementById('form-recycling');
  if (formRecycling) {
    formRecycling.querySelector('select[name="volume"]').addEventListener('change', function () {
      var v = RECYCLING_VOLUMES[this.value];
      if (!v) return;
      var boxes = v.boxes, blisters = v.blisters, bottles = v.bottles;
      var total = boxes + blisters + bottles;
      var green = boxes * GREEN_UNITS.box + blisters * GREEN_UNITS.blister + bottles * GREEN_UNITS.bottle;
      var points = boxes * POINTS_UNIT.box + blisters * POINTS_UNIT.blister + bottles * POINTS_UNIT.bottle;
      var summaryDiv = document.getElementById('recycling-summary');
      if (summaryDiv) { summaryDiv.classList.remove('hidden'); summaryDiv.textContent = 'Caixas: ' + boxes + ', Blisters: ' + blisters + ', Frascos: ' + bottles + '. Total: ' + total + ' embalagens. Unidades verdes: ' + green + '. Pontos: ' + points + '.'; }
    });
    formRecycling.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(formRecycling);
      var vol = fd.get('volume');
      var v = RECYCLING_VOLUMES[vol];
      if (!v) return;
      var boxes = v.boxes, blisters = v.blisters, bottles = v.bottles;
      var total = boxes + blisters + bottles;
      var greenUnits = boxes * GREEN_UNITS.box + blisters * GREEN_UNITS.blister + bottles * GREEN_UNITS.bottle;
      var points = boxes * POINTS_UNIT.box + blisters * POINTS_UNIT.blister + bottles * POINTS_UNIT.bottle;
      addRecyclingDelivery({ id: genId(), date: todayStr(), boxes: boxes, blisters: blisters, bottles: bottles, totalPackages: total, greenUnits: greenUnits, points: points, pharmacyName: fd.get('pharmacyName') || null });
      showToast('Entrega registada', 'check_circle');
      navigate('reciclagem');
    });
  }

  var pesquisaInput = document.getElementById('pesquisa-infomed');
  var pesquisaResultados = document.getElementById('pesquisa-resultados');
  if (pesquisaInput && pesquisaResultados) {
    pesquisaInput.addEventListener('input', function () {
      var q = pesquisaInput.value.trim();
      if (q.length < 2) { pesquisaResultados.innerHTML = ''; return; }
      pesquisaResultados.innerHTML = '<li class="p-3 text-on-surface-variant text-sm">A carregar...</li>';
      getInfomedReady().then(function () {
        var results = searchInfomed(q, 15);
        if (results.length === 0) {
          pesquisaResultados.innerHTML = '<li class="p-3 text-on-surface-variant text-sm">Nenhum medicamento encontrado.</li>';
          return;
        }
        pesquisaResultados.innerHTML = results.map(function (item) {
          var d = getItemDisplay(item);
          var goto = '#medicacao-adicionar?nome=' + encodeURIComponent(d.name) +
            '&dosagem=' + encodeURIComponent(d.dosage) +
            '&substancia=' + encodeURIComponent(d.substance) +
            '&titular=' + encodeURIComponent(d.titular || '');
          return '<li><a href="' + goto + '" class="block p-3 rounded-xl border border-outline hover:bg-primary-container">' + escapeHtml(d.name || '') + ' · ' + escapeHtml(d.dosage || '') + '</a></li>';
        }).join('');
      });
    });
  }

  var notifCheck = document.getElementById('setting-notifications');
  if (notifCheck) {
    notifCheck.addEventListener('change', function () {
      setSettings({ notifications: notifCheck.checked });
      if (notifCheck.checked && typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission();
      scheduleReminderNotifications();
      checkDueRemindersNow();
      scheduleMedicationAlertChecks();
      checkMedicationAlerts();
    });
  }
  var themeSelect = document.getElementById('setting-theme');
  if (themeSelect) {
    themeSelect.addEventListener('change', function () {
      setSettings({ theme: themeSelect.value });
      document.getElementById('body-theme').classList.toggle('dark', themeSelect.value === 'dark');
    });
  }
}

function initRecyclingMap() {
  var mapEl = document.getElementById('recycling-map');
  if (!mapEl || typeof L === 'undefined') return;
  if (mapEl._leaflet_id) return;
  var fallbackCenter = [38.7223, -9.1393];
  var map = L.map(mapEl).setView(fallbackCenter, 13);
  var statusEl = document.getElementById('map-status');
  var listEl = document.getElementById('map-points-list');
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map);
  var markers = [];

  function renderMarkers(points) {
    markers.forEach(function (m) { map.removeLayer(m); });
    markers = [];
    points.forEach(function (p, idx) {
      if (typeof p.lat !== 'number' || typeof p.lng !== 'number') return;
      var m = L.marker([p.lat, p.lng], { title: p.name }).addTo(map).bindPopup(p.name);
      m.on('click', function () { highlightListItem(idx); });
      markers.push(m);
    });
  }

  function highlightListItem(idx) {
    if (!listEl) return;
    listEl.querySelectorAll('.map-point-item').forEach(function (el) {
      el.classList.toggle('is-active', el.dataset.idx === String(idx));
    });
  }

  function updateList(points) {
    if (!listEl) return;
    var hasDistances = points.some(function (p) { return !!p.distanceCalc && p.distanceCalc !== '—'; });
    var nearestIdx = -1;
    if (hasDistances) {
      for (var i = 0; i < points.length; i += 1) {
        if (typeof points[i]._dist === 'number') { nearestIdx = i; break; }
      }
    }
    listEl.innerHTML = points.map(function (p, i) {
      var distLabel = hasDistances ? (p.distanceCalc || '—') : 'Ativar localização';
      var badge = (i === nearestIdx) ? '<span class="nearest-badge">Mais perto</span>' : '';
      return '<li><button type="button" class="block w-full text-left p-4 app-card map-point-item" data-idx="' + i + '">' +
        '<div class="flex items-start gap-3"><span class="material-icons text-primary">location_on</span>' +
        '<div><p class="font-medium">' + p.name + '</p>' +
        '<p class="text-sm text-on-surface-variant">' + p.address + '</p>' +
        '<div class="flex items-center gap-2 mt-1">' + badge + '<p class="text-sm flex items-center gap-1"><span class="material-icons text-sm">straighten</span> ' + distLabel + '</p></div></div></div></button></li>';
    }).join('');
    listEl.querySelectorAll('.map-point-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.dataset.idx, 10);
        var p = points[idx];
        if (p && typeof p.lat === 'number' && typeof p.lng === 'number') {
          map.setView([p.lat, p.lng], 15);
          if (markers[idx]) markers[idx].openPopup();
        }
        highlightListItem(idx);
      });
    });
  }

  function applyFilter(points, radiusKm) {
    var items = points.slice();
    if (radiusKm && radiusKm !== 'all') {
      items = items.filter(function (p) { return typeof p._dist === 'number' && p._dist <= radiusKm; });
    }
    return items;
  }

  function renderAll(points) {
    updateList(points);
    renderMarkers(points);
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text || '';
  }

  function sleep(ms) {
    return new Promise(function (res) { setTimeout(res, ms); });
  }

  function geocodeAddress(address) {
    if (!address) return Promise.resolve(null);
    var url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=0&q=' + encodeURIComponent(address);
    return fetch(url, { headers: { 'Accept-Language': 'pt-PT' } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!Array.isArray(data) || !data.length) return null;
        var first = data[0];
        return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
      })
      .catch(function () { return null; });
  }

  function getCachedCoords(address) {
    try {
      var key = 'dailymed_geo_' + encodeURIComponent(address);
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || typeof data.lat !== 'number' || typeof data.lng !== 'number') return null;
      return { lat: data.lat, lng: data.lng };
    } catch (e) {
      return null;
    }
  }

  function setCachedCoords(address, coords) {
    try {
      var key = 'dailymed_geo_' + encodeURIComponent(address);
      localStorage.setItem(key, JSON.stringify(coords));
    } catch (e) {}
  }

  async function geocodeAllPoints() {
    if (geocodeAllPoints._done) return;
    setStatus('A localizar pontos…');
    var updated = false;
    RECYCLING_POINTS.forEach(function (p) {
      if (!p.address || (typeof p.lat === 'number' && typeof p.lng === 'number')) return;
      var cached = getCachedCoords(p.address);
      if (cached) {
        p.lat = cached.lat;
        p.lng = cached.lng;
        updated = true;
      }
    });
    if (updated) renderAll(RECYCLING_POINTS);
    var allDone = RECYCLING_POINTS.every(function (p) { return typeof p.lat === 'number' && typeof p.lng === 'number'; });
    if (allDone) {
      setStatus('');
      geocodeAllPoints._done = true;
      return;
    }
    for (var i = 0; i < RECYCLING_POINTS.length; i += 1) {
      var p = RECYCLING_POINTS[i];
      if (!p.address) continue;
      if (typeof p.lat === 'number' && typeof p.lng === 'number') continue;
      var cached = getCachedCoords(p.address);
      var coords = cached || await geocodeAddress(p.address);
      if (coords && !Number.isNaN(coords.lat) && !Number.isNaN(coords.lng)) {
        p.lat = coords.lat;
        p.lng = coords.lng;
        if (!cached) setCachedCoords(p.address, coords);
      }
      await sleep(1000);
    }
    setStatus('');
    geocodeAllPoints._done = true;
  }

  function requestLocation(showBusy) {
    if (!navigator.geolocation) {
      setStatus('Localização indisponível.');
      return;
    }
    setStatus(showBusy ? 'A atualizar…' : 'A obter localização…');
    navigator.geolocation.getCurrentPosition(function (pos) {
      var lat = pos.coords.latitude;
      var lng = pos.coords.longitude;
      var sorted = RECYCLING_POINTS.slice().map(function (p) {
        var dist = (typeof p.lat === 'number' && typeof p.lng === 'number')
          ? haversineKm(lat, lng, p.lat, p.lng)
          : null;
        var pretty = (dist != null) ? dist.toFixed(1) + ' km' : '—';
        return Object.assign({}, p, { distanceCalc: pretty, _dist: dist });
      }).sort(function (a, b) {
        if (a._dist == null) return 1;
        if (b._dist == null) return -1;
        return a._dist - b._dist;
      });
      setStatus('');
      map.setView([lat, lng], 13);
      L.circleMarker([lat, lng], { radius: 6, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.6 }).addTo(map).bindPopup('A tua localização');
      var radiusSel = document.querySelector('.map-radius.chip--active')?.dataset.radius || 'all';
      var radiusVal = radiusSel === 'all' ? 'all' : parseFloat(radiusSel);
      var filtered = applyFilter(sorted, radiusVal);
      renderAll(filtered);
    }, function () {
      setStatus('Localização não permitida.');
      showToast('Não foi possível obter a localização', 'warning');
      map.setView(fallbackCenter, 13);
      var radiusSel = document.querySelector('.map-radius.chip--active')?.dataset.radius || 'all';
      var radiusVal = radiusSel === 'all' ? 'all' : parseFloat(radiusSel);
      renderAll(applyFilter(RECYCLING_POINTS, radiusVal));
    }, { enableHighAccuracy: true, timeout: 5000 });
  }

  renderAll(RECYCLING_POINTS);
  setStatus('Localização não permitida.');
  geocodeAllPoints().then(function () {
    renderAll(RECYCLING_POINTS);
  });

  var btnLoc = document.getElementById('btn-use-location');
  if (btnLoc) btnLoc.addEventListener('click', function () { requestLocation(false); });
  var btnRefresh = document.getElementById('btn-refresh-location');
  if (btnRefresh) btnRefresh.addEventListener('click', function () { requestLocation(true); });

  document.querySelectorAll('.map-radius').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.map-radius').forEach(function (b) {
        b.classList.remove('chip--active');
        b.classList.add('chip--ghost');
      });
      btn.classList.add('chip--active');
      btn.classList.remove('chip--ghost');
      var radiusSel = btn.dataset.radius || 'all';
      var radiusVal = radiusSel === 'all' ? 'all' : parseFloat(radiusSel);
      var points = RECYCLING_POINTS;
      if (points.some(function (p) { return p._dist != null; })) {
        points = points.slice().sort(function (a, b) {
          if (a._dist == null) return 1;
          if (b._dist == null) return -1;
          return a._dist - b._dist;
        });
      }
      renderAll(applyFilter(points, radiusVal));
    });
  });
}

function showAddMedicationModal() {
  var html = '<div id="modal-add-med" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">' +
    '<div class="bg-white rounded-2xl max-w-md w-full shadow-lg p-5">' +
    '<h3 class="font-bold text-lg text-black text-center mb-5">Como queres adicionar o medicamento?</h3>' +
    '<div class="space-y-3">' +
    '<button type="button" id="modal-add-manual" class="btn-primary w-full"><span class="material-icons">edit</span><span>Adicionar manualmente</span></button>' +
    '<button type="button" id="modal-add-pesquisar" class="btn-secondary w-full"><span class="material-icons">search</span><span>Pesquisar medicamento</span></button>' +
    '<button type="button" id="modal-add-cancelar" class="btn-ghost w-full">Cancelar</button>' +
    '</div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  setTimeout(function () {
    var primary = document.getElementById('modal-add-manual');
    if (primary) primary.focus();
  }, 0);
  function closeModal() { var el = document.getElementById('modal-add-med'); if (el) el.remove(); }
  document.getElementById('modal-add-manual').addEventListener('click', function () { closeModal(); navigate('medicacao-adicionar'); });
  document.getElementById('modal-add-pesquisar').addEventListener('click', function () { closeModal(); navigate('medicacao-pesquisar'); });
  document.getElementById('modal-add-cancelar').addEventListener('click', closeModal);
  document.getElementById('modal-add-med').addEventListener('click', function (e) { if (e.target.id === 'modal-add-med') closeModal(); });
}

function showInteractionsModal(detected, onClose) {
  var listHtml = detected.map(function (i) { return '<li class="p-2 rounded border-l-4" style="border-color:' + i.color + '"><p class="font-medium text-sm">' + i.combination + '</p><p class="text-xs">' + i.mechanism + '</p></li>'; }).join('');
  var html = '<div id="modal-overlay" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div class="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto p-4"><h3 class="font-bold text-lg mb-2">Interações detetadas</h3><p class="text-sm text-on-surface-variant mb-4">Consulte um profissional de saúde.</p><ul class="space-y-2 mb-4">' + listHtml + '</ul><button type="button" id="modal-close-btn" class="btn-primary w-full">Entendi</button></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  setTimeout(function () {
    var primary = document.getElementById('modal-close-btn');
    if (primary) primary.focus();
  }, 0);
  document.getElementById('modal-close-btn').addEventListener('click', function () { document.getElementById('modal-overlay').remove(); if (onClose) onClose(); });
  document.getElementById('modal-overlay').addEventListener('click', function (e) { if (e.target.id === 'modal-overlay') { document.getElementById('modal-overlay').remove(); if (onClose) onClose(); } });
}

function showMedicationDetailModal(m) {
  if (!m) return;
  var nameEsc = escapeHtml(m.name || '');
  var dosageEsc = escapeHtml(m.dosage || '-');
  var substanceEsc = escapeHtml(m.substance || '-');
  var manufacturerEsc = escapeHtml(m.manufacturer || '-');
  var validityEsc = escapeHtml(formatDateYMD(m.expiryDate) || '-');
  var categoryEsc = escapeHtml(m.category || '-');
  var stateStr = m.isActive ? 'Ativo' : 'Inativo';
  var posologyEsc = escapeHtml(m.posology || '-');
  var indicationEsc = escapeHtml(m.indication || '-');
  var notesEsc = escapeHtml(cleanNotesFromLegacy(m.notes) || '-');
  var imgBlock = m.imageUri ? '<img src="' + escapeHtml(m.imageUri) + '" alt="" class="w-full max-h-40 object-contain rounded-xl bg-gray-100" />' : '';
  var body = '<div id="modal-med-detail" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">' +
    '<div class="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-xl border border-gray-100">' +
    '<div class="modal-med-header text-on-primary px-4 py-3 flex items-center justify-between">' +
    '<h2 class="font-bold text-lg truncate pr-2">' + nameEsc + '</h2>' +
    '<button type="button" class="modal-med-close flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center" aria-label="Fechar"><span class="material-icons text-lg">close</span></button>' +
    '</div>' +
    '<div class="p-4 overflow-y-auto max-h-[calc(90vh-8rem)]">' +
    imgBlock +
    '<dl class="grid grid-cols-1 gap-2 mt-4 text-sm">' +
    '<div class="flex justify-between py-2 border-b border-gray-100"><dt class="text-gray-500">Dosagem</dt><dd class="font-medium">' + dosageEsc + '</dd></div>' +
    '<div class="flex justify-between py-2 border-b border-gray-100"><dt class="text-gray-500">Substância ativa</dt><dd class="font-medium">' + substanceEsc + '</dd></div>' +
    '<div class="flex justify-between py-2 border-b border-gray-100"><dt class="text-gray-500">Fabricante</dt><dd class="font-medium">' + manufacturerEsc + '</dd></div>' +
    '<div class="flex justify-between py-2 border-b border-gray-100"><dt class="text-gray-500">Posologia</dt><dd class="text-right max-w-[60%]">' + posologyEsc + '</dd></div>' +
    '<div class="flex justify-between py-2 border-b border-gray-100"><dt class="text-gray-500">Indicação Terapêutica</dt><dd class="text-right max-w-[60%]">' + indicationEsc + '</dd></div>' +
    '<div class="flex justify-between py-2 border-b border-gray-100"><dt class="text-gray-500">Quantidade</dt><dd>' + (m.quantity ?? '-') + '</dd></div>' +
    '<div class="flex justify-between py-2 border-b border-gray-100"><dt class="text-gray-500">Data de validade</dt><dd>' + validityEsc + '</dd></div>' +
    '<div class="flex justify-between py-2 border-b border-gray-100"><dt class="text-gray-500">Categoria</dt><dd>' + categoryEsc + '</dd></div>' +
    '<div class="flex justify-between py-2 border-b border-gray-100"><dt class="text-gray-500">Estado</dt><dd>' + stateStr + '</dd></div>' +
    '<div class="flex justify-between py-2 border-b border-gray-100"><dt class="text-gray-500">Notas</dt><dd class="text-right max-w-[60%]">' + notesEsc + '</dd></div>' +
    '</dl>' +
    '<div class="flex flex-wrap gap-2 mt-4">' +
    '<a href="#medicacao-editar?id=' + m.id + '" class="modal-med-link btn-primary"><span class="material-icons text-base">edit</span>Editar</a>' +
    '<a href="#medicacao-folheto?id=' + m.id + '" class="modal-med-link btn-outline">Ver folheto</a>' +
    '<a href="#medicacao-interacoes" class="modal-med-link btn-outline">Ver interações</a>' +
    '<a href="#medicacao-historico" class="modal-med-link btn-ghost">Ver histórico</a>' +
    '</div></div></div></div>';
  document.body.insertAdjacentHTML('beforeend', body);
  function closeModal() { var el = document.getElementById('modal-med-detail'); if (el) el.remove(); }
  var wrap = document.getElementById('modal-med-detail');
  setTimeout(function () {
    var primary = wrap ? wrap.querySelector('.modal-med-link.btn-primary') : null;
    if (primary) primary.focus();
  }, 0);
  wrap.querySelector('.modal-med-close').addEventListener('click', closeModal);
  wrap.addEventListener('click', function (e) { if (e.target === wrap) closeModal(); });
  wrap.querySelectorAll('.modal-med-link').forEach(function (link) {
    link.addEventListener('click', function (e) { e.preventDefault(); closeModal(); window.location.hash = this.getAttribute('href') || ''; });
  });
}

function setupFab() {
  var existing = document.getElementById('fab-root');
  if (existing) existing.remove();
  var html = '<div id="fab-root">' +
    '<div class="fab-backdrop hidden" id="fab-backdrop"></div>' +
    '<div class="fab-menu hidden" id="fab-menu">' +
    '<a href="#medicacao-adicionar" class="fab-action"><span class="material-icons text-primary">add_circle_outline</span><span>Adicionar medicamento</span></a>' +
    '<a href="#lembretes-novo" class="fab-action"><span class="material-icons text-secondary">alarm</span><span>Adicionar lembrete</span></a>' +
    '</div>' +
    '<button type="button" class="fab" id="fab-btn" aria-label="Ações rápidas"><span class="material-icons">add</span></button>' +
    '</div>';
  document.body.insertAdjacentHTML('beforeend', html);
  var btn = document.getElementById('fab-btn');
  var menu = document.getElementById('fab-menu');
  var backdrop = document.getElementById('fab-backdrop');
  function closeFab() {
    if (menu) menu.classList.add('hidden');
    if (backdrop) backdrop.classList.add('hidden');
  }
  function toggleFab() {
    if (!menu || !backdrop) return;
    var isOpen = !menu.classList.contains('hidden');
    if (isOpen) closeFab();
    else { menu.classList.remove('hidden'); backdrop.classList.remove('hidden'); }
  }
  if (btn) btn.addEventListener('click', toggleFab);
  if (backdrop) backdrop.addEventListener('click', closeFab);
  if (menu) {
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeFab);
    });
  }
}

function maybeShowOnboarding() {
  try {
    if (localStorage.getItem('dailymed_onboarding_done') === 'true') return;
  } catch (e) {}
  var step = 0;
  var steps = [
    { title: 'Bem-vindo à DailyMed', text: 'Vamos configurar a tua rotina em 3 passos simples.' },
    { title: 'Adicionar medicamento', text: 'Regista o teu primeiro medicamento para começar.' },
    { title: 'Criar lembrete', text: 'Define horários para não te esqueceres.' },
  ];
  function renderStep() {
    var s = steps[step];
    var html = '<div class="modal-overlay" id="onboarding-overlay">' +
      '<div class="modal-card">' +
      '<div class="modal-title">' + s.title + '</div>' +
      '<p class="modal-text mt-2">' + s.text + '</p>' +
      '<div class="modal-actions">' +
      '<button type="button" class="modal-btn modal-btn--ghost" id="onb-skip">Saltar</button>' +
      '<button type="button" class="modal-btn modal-btn--primary" id="onb-next">' + (step === steps.length - 1 ? 'Concluir' : 'Seguinte') + '</button>' +
      '</div>' +
      '</div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('onb-skip').addEventListener('click', finish);
    document.getElementById('onb-next').addEventListener('click', function () {
      if (step < steps.length - 1) {
        closeOverlay();
        step += 1;
        renderStep();
      } else {
        finish();
      }
    });
    setTimeout(function () {
      var primary = document.getElementById('onb-next');
      if (primary) primary.focus();
    }, 0);
  }
  function closeOverlay() {
    var el = document.getElementById('onboarding-overlay');
    if (el) el.remove();
  }
  function finish() {
    try { localStorage.setItem('dailymed_onboarding_done', 'true'); } catch (e) {}
    closeOverlay();
  }
  renderStep();
}

function init() {
  loadInfomed().catch(function () {});
  seedMedicationsIfEmpty();
  var meds = getMedications();
  var changed = false;
  meds.forEach(function (m) {
    if (m.notes && typeof m.notes === 'string') {
      var cleaned = cleanNotesFromLegacy(m.notes);
      if (cleaned !== m.notes) { m.notes = cleaned; changed = true; }
    }
  });
  if (changed) setMedications(meds);
  var s = getSettings();
  document.getElementById('body-theme').classList.toggle('dark', s.theme === 'dark');
  if (s.notifications && typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission();
  maybeShowOnboarding();
  window.addEventListener('hashchange', runRoute);
  document.body.addEventListener('click', function (e) {
    if (e.target.closest('#btn-adicionar-medicamento') || e.target.closest('#btn-adicionar-medicamento-fab')) {
      e.preventDefault();
      showAddMedicationModal();
    }
  });
  scheduleReminderNotifications();
  startReminderSweep();
  checkDueRemindersNow();
  scheduleMedicationAlertChecks();
  checkMedicationAlerts();
  runRoute();
}

init();
