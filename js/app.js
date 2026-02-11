/**
 * DailyMed - SPA Router and Views
 */

const CATEGORIAS = [
  'Diarreia', 'Dores de Cabeça', 'Dores Musculares', 'Estômago', 'Febre', 'Garganta',
  'Gripes e Constipações', 'Insónias', 'Irritação Ocular', 'Pele', 'Tosse', 'Vitaminas', 'Vómitos',
];

const PERIODOS = [
  { id: 'pequeno_almoco', label: 'Pequeno-almoço', times: ['07:30', '08:00', '09:00'] },
  { id: 'almoco', label: 'Almoço', times: ['12:30', '13:00', '13:30'] },
  { id: 'lanche', label: 'Lanche', times: ['16:00', '16:30', '17:00'] },
  { id: 'jantar', label: 'Jantar', times: ['19:30', '20:00', '20:30'] },
  { id: 'ceia', label: 'Ceia', times: ['22:00', '22:30', '23:00'] },
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
  { name: 'Farmácia Central', address: 'Rua das Flores, 123, Lisboa', distance: '0.5 km' },
  { name: 'Parafarmácia Saúde', address: 'Av. da Liberdade, 45, Lisboa', distance: '1.2 km' },
  { name: 'Farmácia do Martim', address: 'Largo do Martim Moniz, 1, Lisboa', distance: '2 km' },
];

const DICAS_ARTIGOS = [
  { id: 'paracetamol', title: 'Paracetamol: quando o excesso vira risco', category: 'Medicação', publishedAt: '2024-01-15', readTime: 3, image: 'dicas/imagens/paracetamol.jpg', text: 'O paracetamol é um dos medicamentos mais utilizados em todo o mundo, e não é por acaso, pois é eficaz no alívio da dor e na redução da febre, sendo frequentemente a primeira escolha para tratar sintomas como gripe, dores de cabeça ou dores musculares. No entanto, mesmo os medicamentos mais comuns merecem cuidado e utilização responsável.\n\nPara um uso seguro, é essencial respeitar a dose recomendada, sendo que a dose máxima diária para um adulto é, normalmente, de 4 gramas (4000 mg), devendo sempre seguir as indicações do médico ou do farmacêutico. É também importante evitar a duplicação de medicamentos, uma vez que muitos fármacos para a gripe ou constipações já contêm paracetamol na sua composição, o que pode levar à ingestão excessiva sem que a pessoa se aperceba.\n\nOutro aspeto fundamental é o cuidado com o consumo de álcool, pois a sua associação com o paracetamol pode aumentar significativamente o risco de danos no fígado. No caso das crianças, deve ser utilizada sempre a dose correta de acordo com o peso e a idade, preferencialmente com orientação médica.\n\nO paracetamol é seguro quando usado corretamente, mas o seu uso excessivo pode ser perigoso, podendo causar lesões hepáticas graves. Por isso, sempre que existam dúvidas ou os sintomas persistam, é fundamental procurar um profissional de saúde. Pequenas escolhas conscientes fazem toda a diferença, inclusive na forma como cuidamos da nossa saúde.' },
  { id: 'resfriado', title: 'Resfriado comum: especialistas alertam para cuidados essenciais durante a recuperação', category: 'Saúde', publishedAt: '2024-01-14', readTime: 5, image: 'dicas/imagens/resfriado.jpg', text: 'Com a mudança de temperatura, o aumento de casos de resfriado comum acende um alerta para a importância de cuidados simples que aceleram a recuperação e evitam a transmissão. Diferente da gripe, o resfriado costuma apresentar sintomas mais leves, como coriza, espirros e leve dor de garganta, mas ainda assim exige atenção.\n\nO pilar fundamental para o tratamento é o repouso aliado a uma hidratação constante, pois a ingestão de líquidos ajuda a manter as mucosas hidratadas e facilita a eliminação de secreções. Especialistas recomendam manter uma alimentação equilibrada, rica em vitaminas, para fortalecer o sistema imunológico enquanto o corpo combate o vírus.\n\nNo campo da prevenção, a higiene das mãos continua sendo a regra de ouro: lavar as mãos com frequência ou usar álcool em gel reduz drasticamente as chances de contágio. Além disso, evitar locais fechados e sem ventilação ajuda a conter a propagação do vírus para outras pessoas.\n\nÉ importante lembrar que o uso de medicamentos deve ser feito apenas sob orientação médica, focando no alívio dos sintomas, já que o corpo precisa de tempo para se recuperar naturalmente. Caso surjam sintomas mais graves, como febre persistente ou dificuldade para respirar, a recomendação é procurar uma unidade de saúde imediatamente. Cuidar de si durante um resfriado não é apenas uma questão de conforto, mas um gesto de responsabilidade com a saúde pública.' },
  { id: 'halitose', title: 'O segredo do hálito fresco: pequenos gestos que transformam o seu bem-estar', category: 'Saúde', publishedAt: '2024-01-13', readTime: 4, image: 'dicas/imagens/halitose.png', text: 'O mau hálito, ou halitose, é um problema comum que afeta diretamente a autoestima e as relações sociais, mas a solução pode ser mais simples do que parece. O primeiro passo essencial é manter uma higiene rigorosa, escovando os dentes com pasta de flúor ao menos duas vezes ao dia por dois minutos e nunca esquecendo o fio dental para remover restos de comida entre os dentes.\n\nAlém disso, a língua merece atenção especial: a limpeza da parte de trás com um raspador ou escova suave ajuda a eliminar o acúmulo de bactérias que causa o mau cheiro. Manter o corpo hidratado também é fundamental, pois a água estimula o fluxo salivar necessário para neutralizar odores desagradáveis.\n\nGestos simples como mastigar pastilhas sem açúcar, evitar o tabaco e o álcool, e manter as próteses limpas fazem toda a diferença. Novas abordagens sugerem ainda que o uso de probióticos pode ajudar a equilibrar a flora oral. Se o problema persistir mesmo com esses cuidados, é importante consultar um profissional, pois a causa pode ser fisiológica ou até emocional. Afinal, cuidar da boca é cuidar de si mesmo e da sua confiança.' },
  { id: 'lactose', title: 'Intolerância à Lactose: o que precisa de saber', category: 'Saúde', publishedAt: '2024-01-12', readTime: 3, image: 'dicas/imagens/lactose.jpg', text: 'Sentir desconforto depois de beber leite pode ser um sinal de intolerância à lactose. Esta condição acontece quando o corpo tem dificuldade em digerir a lactose, o açúcar natural do leite. Quando a lactose não é devidamente digerida, chega intacta ao intestino grosso, onde é fermentada pelas bactérias, provocando sintomas como gases, inchaço, dor abdominal e, por vezes, diarreia. Curiosamente, cerca de 65% da população mundial apresenta algum grau de intolerância à lactose.\n\nApesar disso, é totalmente possível viver bem com esta condição. No dia a dia, pode optar por leite e derivados sem lactose, que já contêm a enzima lactase, experimentar leites vegetais como os de amêndoa, aveia, soja ou arroz, e ler atentamente os rótulos dos alimentos, uma vez que a lactose pode estar presente em produtos inesperados, como molhos ou artigos de padaria. É também importante falar com o médico ou farmacêutico antes de tomar suplementos de lactase ou fazer alterações significativas na dieta.\n\nCada pessoa tem um nível diferente de intolerância, pelo que o segredo está em conhecer o próprio corpo e encontrar o equilíbrio que melhor funciona. Com acompanhamento médico e escolhas informadas, é possível manter uma alimentação saudável, saborosa e sem desconfortos.' },
];

const TRAVEL_SECTIONS = [
  { id: 's1', title: 'Medicamentos essenciais (uso pessoal)', items: ['Medicamentos de uso contínuo (com receita, se necessário)', 'Quantidade extra (para atrasos/imprevistos)', 'Cópia da receita médica (importante para viagens internacionais)', 'Lista dos medicamentos e doses'], checkbox: true },
  { id: 's2', title: 'Dor, febre e inflamação', items: ['Paracetamol ou ibuprofeno', 'Termómetro (opcional, mas útil)'], checkbox: true },
  { id: 's3', title: 'Estômago e intestino', items: ['Antidiarréico', 'Probióticos', 'Remédio para enjoo/náuseas', 'Antiácido / protetor gástrico', 'Sais de reidratação oral'], checkbox: true },
  { id: 's4', title: 'Gripes, alergias e respiração', items: ['Antialérgico (ex: loratadina, cetirizina)', 'Descongestionante nasal', 'Spray nasal com soro fisiológico', 'Pastilhas para dor de garganta'], checkbox: true },
  { id: 's5', title: 'Pele e primeiros socorros', items: ['Repelente de insetos', 'Protetor solar', 'Pomada para picadas/coceiras', 'Pomada cicatrizante/antisséptica', 'Curativos (pensos rápidos)', 'Gaze + fita adesiva', 'Álcool ou lenços antissépticos'], checkbox: true },
  { id: 's6', title: 'Outros úteis', items: ['Remédio para dormir (se usas)', 'Colírio', 'Hidratante labial', 'Álcool gel'], checkbox: true },
  { id: 's7', title: 'Documentação (muito importante)', items: ['Receita médica em inglês (ou idioma do destino)', 'Declaração médica para medicamentos controlados', 'Lista dos medicamentos (nome genérico + dosagem)', 'Cópia digital das receitas'], checkbox: true },
  { id: 's8', title: 'Antes de viajar', items: ['Ver site da embaixada do país de destino', 'Confirmar vacinas obrigatórias', 'Seguro de viagem com cobertura médica'], checkbox: true },
  { id: 's9', title: 'Atenção especial', items: ['Alguns países proíbem certos medicamentos (ex: codeína, tramadol, alguns ansiolíticos)', 'Leva sempre na bagagem de mão', 'Mantém os medicamentos na embalagem original', 'Líquidos acima de 100 ml só com declaração médica'], checkbox: false },
  { id: 's10', title: 'Dicas rápidas', items: ['Leva os medicamentos na bagagem de mão', 'Verifica se algum remédio é proibido no país de destino', 'Mantém tudo na embalagem original', 'Se vais para um destino exótico, considera falar com um médico antes'], checkbox: false },
];

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateYMD(dateStr) {
  if (!dateStr) return '';
  const d = dateStr.split('-');
  if (d.length !== 3) return dateStr;
  return d[2] + '/' + d[1] + '/' + d[0];
}

function getValidityStatus(expiryDate) {
  if (!expiryDate) return { label: 'Válido', type: 'ok' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  if (exp < today) return { label: 'Expirado', type: 'expired' };
  const days = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  if (days <= 30) return { label: 'Expira em breve', type: 'soon' };
  return { label: 'Válido', type: 'ok' };
}

function getStockStatus(quantity) {
  if (quantity <= 10) return { label: 'Baixo', type: 'low' };
  if (quantity <= 30) return { label: 'Médio', type: 'medium' };
  return { label: 'OK', type: 'ok' };
}

function parseHash() {
  const hash = (window.location.hash || '#home').slice(1);
  const parts = hash.split('?');
  const path = parts[0] || 'home';
  const params = {};
  if (parts[1]) {
    parts[1].split('&').forEach(function (p) {
      const kv = p.split('=');
      params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
    });
  }
  return { path: path, params: params };
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

let currentView = '';

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
  const meds = getMedications().filter(function (m) { return m.isActive; });
  const remindersToday = getRemindersForToday().length;
  return '<header class="relative px-4 flex items-center justify-center gap-3 bg-white">' +
    '<img src="logo.png" alt="DailyMed" class="h-40 w-40 object-contain" />' +
    '</header>' +
    '<main class="p-4 space-y-4 bg-white">' +
    '<div class="grid grid-cols-2 gap-4">' +
    '<div class="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm text-center"><p class="text-3xl font-bold text-primary">' + meds.length + '</p><p class="text-xs text-black mt-1">Medicamentos Ativos</p></div>' +
    '<div class="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm text-center"><p class="text-3xl font-bold text-secondary">' + remindersToday + '</p><p class="text-xs text-black mt-1">Lembretes de Hoje</p></div>' +
    '</div>' +
    '<a href="#lembretes" class="flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-xl bg-secondary text-white shadow-sm w-full"><span class="material-icons text-4xl">schedule</span><span class="text-sm font-medium">Lembretes</span></a>' +
    '<div class="grid grid-cols-3 gap-3">' +
    '<a href="#medicacao" class="flex flex-col items-center justify-center gap-2 py-5 px-3 rounded-xl bg-primary text-white shadow-sm min-h-[90px]"><span class="material-icons text-3xl">medication</span><span class="text-xs font-medium text-center leading-tight">Armário de Medicamentos</span></a>' +
    '<a href="#reciclagem" class="flex flex-col items-center justify-center gap-2 py-5 px-3 rounded-xl bg-secondary text-white shadow-sm min-h-[90px]"><span class="material-icons text-3xl">eco</span><span class="text-xs font-medium text-center leading-tight">Reciclar</span></a>' +
    '<a href="#dicas" class="flex flex-col items-center justify-center gap-2 py-5 px-3 rounded-xl bg-primary text-white shadow-sm min-h-[90px]"><span class="material-icons text-3xl">bookmark</span><span class="text-xs font-medium text-center leading-tight">Dicas</span></a>' +
    '</div></main>';
}

function viewMedicacaoCategorias() {
  let list = '';
  list = '<a href="#medicacao-armario" class="block w-full py-3 px-4 rounded-xl bg-primary-container text-black font-medium text-center">Ver Todos</a>';
  CATEGORIAS.forEach(function (c) {
    list += '<a href="#medicacao-armario?cat=' + encodeURIComponent(c) + '" class="block w-full py-3 px-4 rounded-xl bg-primary-container text-black font-medium text-center">' + c + '</a>';
  });
  return pageHeader('Armário de Medicamentos', '#home') +
    '<main class="p-4 space-y-3 bg-white">' +
    '<button type="button" id="btn-adicionar-medicamento" class="flex items-center gap-3 w-full py-3 px-4 rounded-xl bg-primary text-white font-medium"><span class="material-icons">add_circle_outline</span><span>Adicionar Medicamento</span></button>' +
    '<a href="#checklist-viagem" class="flex items-center justify-between w-full py-3 px-4 rounded-xl bg-secondary-container text-secondary font-medium"><span class="flex items-center gap-3"><span class="material-icons">flight_takeoff</span><span>Checklist de Viagem</span></span><span class="material-icons text-gray-500">chevron_right</span></a>' +
    '<h3 class="text-base font-bold text-black text-center pt-2">Categorias de Medicamentos</h3>' +
    '<div class="space-y-2">' + list + '</div></main>';
}

function viewMedicacaoArmario(params) {
  const filter = params.filter || 'todos';
  const search = (params.q || '').toLowerCase();
  const category = params.cat || '';
  let list = getMedications();
  if (category) list = list.filter(function (m) { return m.category === category; });
  if (search) list = list.filter(function (m) { return (m.name || '').toLowerCase().includes(search) || (m.manufacturer || '').toLowerCase().includes(search); });
  if (filter === 'ativos') list = list.filter(function (m) { return m.isActive; });
  if (filter === 'stock') list = list.filter(function (m) { return m.isInStock; });
  if (filter === 'expirando') list = list.filter(function (m) { return getValidityStatus(m.expiryDate).type === 'soon'; });
  if (filter === 'expirados') list = list.filter(function (m) { return getValidityStatus(m.expiryDate).type === 'expired'; });
  if (filter === 'baixo') list = list.filter(function (m) { return (m.quantity || 0) <= 10; });
  const detected = detectInteractions(list);
  const backHref = category ? '#medicacao' : '#medicacao';
  const catQs = category ? '&cat=' + encodeURIComponent(category) : '';
  let listHtml = '';
  list.forEach(function (m) {
    const validity = getValidityStatus(m.expiryDate);
    const stock = getStockStatus(m.quantity);
    listHtml += '<li class="p-4 rounded-xl border border-outline bg-surface card-round"><div class="flex justify-between items-start"><div><h3 class="font-medium">' + (m.name || '').replace(/</g, '&lt;') + '</h3><p class="text-sm text-on-surface-variant">' + (m.dosage || '').replace(/</g, '&lt;') + ' · ' + (m.manufacturer || '').replace(/</g, '&lt;') + '</p><p class="text-sm">Quantidade: ' + (m.quantity ?? '-') + ' · Validade: ' + (formatDateYMD(m.expiryDate) || '-') + '</p><div class="flex gap-2 mt-2"><span class="text-xs px-2 py-0.5 rounded ' + (validity.type === 'expired' ? 'bg-red-100 text-red-800' : validity.type === 'soon' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800') + '">' + validity.label + '</span><span class="text-xs px-2 py-0.5 rounded ' + (stock.type === 'low' ? 'bg-red-100 text-red-800' : stock.type === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800') + '">' + stock.label + '</span><span class="text-xs px-2 py-0.5 rounded bg-gray-100">' + (m.isActive ? 'Ativo' : 'Inativo') + '</span></div></div><div class="flex flex-col gap-1"><a href="#medicacao-detalhes?id=' + m.id + '" class="text-primary text-sm">Ver</a><a href="#medicacao-editar?id=' + m.id + '" class="text-primary text-sm">Editar</a><button type="button" class="text-red-600 text-sm delete-med" data-id="' + m.id + '">Remover</button></div></div></li>';
  });
  let filterLinks = '<a href="#medicacao-armario' + (category ? '?cat=' + encodeURIComponent(category) : '') + '" class="whitespace-nowrap px-3 py-1 rounded-full text-sm ' + (!filter ? 'bg-primary text-on-primary' : 'bg-gray-200') + '">Todos</a>';
  ['ativos', 'stock', 'expirando', 'expirados', 'baixo'].forEach(function (f) {
    const label = f === 'ativos' ? 'Ativos' : f === 'stock' ? 'Em Stock' : f === 'expirando' ? 'Expirando' : f === 'expirados' ? 'Expirados' : 'Estoque baixo';
    filterLinks += '<a href="#medicacao-armario?filter=' + f + catQs + '" class="whitespace-nowrap px-3 py-1 rounded-full text-sm ' + (filter === f ? 'bg-primary text-on-primary' : 'bg-gray-200') + '">' + label + '</a>';
  });
  let banner = '';
  if (detected.length > 0) banner = '<a href="#medicacao-interacoes" class="block p-3 rounded-xl bg-red-50 border border-red-200 text-red-800"><span class="material-icons align-middle text-lg mr-1">warning</span>Atenção: ' + detected.length + ' interação(ões) detetada(s). Toque para ver.</a>';
  const emptyMsg = list.length === 0 ? '<p class="text-center text-on-surface-variant py-8">Nenhum medicamento encontrado.</p>' : '<ul class="space-y-3">' + listHtml + '</ul><button type="button" id="btn-adicionar-medicamento-fab" class="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg" aria-label="Adicionar medicamento"><span class="material-icons">add</span></button>';
  return pageHeader(category ? category : 'Armário de Medicamentos', '#medicacao') +
    '<main class="p-4 space-y-3 bg-white"><input type="search" placeholder="Pesquisar nome ou fabricante..." class="w-full px-4 py-2 rounded-xl border border-gray-200" id="armario-search" value="' + (params.q || '').replace(/"/g, '&quot;') + '" />' +
    '<div class="flex gap-2 overflow-x-auto pb-2">' + filterLinks + '</div>' + (category ? '<p class="text-sm text-on-surface-variant">Categoria: ' + category + '</p>' : '') + banner + emptyMsg + '</main>';
}

function viewMedicacaoAdicionar(params) {
  const prefilled = params.nome ? { name: params.nome, dosage: params.dosagem, substance: params.substancia } : {};
  const nameVal = (prefilled.name || '').replace(/"/g, '&quot;');
  const dosageVal = (prefilled.dosage || '').replace(/"/g, '&quot;');
  const substanceVal = (prefilled.substance || '').replace(/"/g, '&quot;');
  return pageHeader('Adicionar Medicamento', '#medicacao') +
    '<main class="p-4 bg-white"><form id="form-add-med" class="space-y-4">' +
    '<div class="relative"><label class="block text-sm font-medium mb-1">Nome *</label><input type="text" name="name" required placeholder="Pesquisar ou escrever..." class="w-full px-4 py-2 input-outline" id="med-name" value="' + nameVal + '" autocomplete="off" /><ul class="autocomplete-list absolute left-0 right-0 z-10 mt-1 bg-white border border-outline rounded-lg shadow-lg max-h-60 overflow-y-auto hidden" id="autocomplete-list"></ul></div>' +
    '<div><label class="block text-sm font-medium mb-1">Dosagem *</label><input type="text" name="dosage" required class="w-full px-4 py-2 input-outline" value="' + dosageVal + '" /></div>' +
    '<div><label class="block text-sm font-medium mb-1">Substância ativa</label><input type="text" name="substance" class="w-full px-4 py-2 input-outline" id="med-substance" value="' + substanceVal + '" readonly /></div>' +
    '<div><label class="block text-sm font-medium mb-1">Fabricante</label><input type="text" name="manufacturer" class="w-full px-4 py-2 input-outline" /></div>' +
    '<div><label class="block text-sm font-medium mb-1">Posologia</label><input type="text" name="posology" class="w-full px-4 py-2 input-outline" /></div>' +
    '<div><label class="block text-sm font-medium mb-1">Indicação Terapêutica</label><input type="text" name="indication" class="w-full px-4 py-2 input-outline" /></div>' +
    '<div><label class="block text-sm font-medium mb-1">Número de Unidades *</label><input type="number" name="quantity" required min="1" class="w-full px-4 py-2 input-outline" value="30" /></div>' +
    '<div><label class="block text-sm font-medium mb-1">Data de Validade *</label><input type="date" name="expiryDate" required min="' + todayStr() + '" class="w-full px-4 py-2 input-outline" /></div>' +
    '<div><label class="block text-sm font-medium mb-1">Categoria *</label><select name="category" required class="w-full px-4 py-2 input-outline"><option value="">Selecionar...</option>' + CATEGORIAS.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('') + '</select></div>' +
    '<div><label class="block text-sm font-medium mb-1">Estado</label><select name="isActive" class="w-full px-4 py-2 input-outline"><option value="true">Ativo</option><option value="false">Não Ativo</option></select></div>' +
    '<div><label class="block text-sm font-medium mb-1">Notas</label><textarea name="notes" rows="2" class="w-full px-4 py-2 input-outline"></textarea></div>' +
    '<div><label class="block text-sm font-medium mb-1">Foto (opcional)</label><input type="file" name="image" accept="image/*" class="w-full px-4 py-2 input-outline" /></div>' +
    '<button type="submit" class="w-full py-3 bg-primary text-on-primary font-medium rounded-xl btn-round">Guardar</button></form></main>';
}

function viewMedicacaoDetalhes(params) {
  const m = getMedicationById(params.id);
  if (!m) return viewMedicacaoCategorias();
  return pageHeader((m.name || '').replace(/</g, '&lt;'), '#medicacao-armario') +
    '<main class="p-4 space-y-4 bg-white">' +
    (m.imageUri ? '<img src="' + m.imageUri + '" alt="" class="w-full max-h-48 object-contain rounded-xl bg-gray-100" />' : '') +
    '<dl class="space-y-2 text-sm"><dt class="text-on-surface-variant">Dosagem</dt><dd>' + (m.dosage || '-').replace(/</g, '&lt;') + '</dd><dt class="text-on-surface-variant">Substância ativa</dt><dd>' + (m.substance || '-').replace(/</g, '&lt;') + '</dd><dt class="text-on-surface-variant">Fabricante</dt><dd>' + (m.manufacturer || '-').replace(/</g, '&lt;') + '</dd><dt class="text-on-surface-variant">Quantidade</dt><dd>' + (m.quantity ?? '-') + '</dd><dt class="text-on-surface-variant">Data de validade</dt><dd>' + (formatDateYMD(m.expiryDate) || '-') + '</dd><dt class="text-on-surface-variant">Categoria</dt><dd>' + (m.category || '-').replace(/</g, '&lt;') + '</dd><dt class="text-on-surface-variant">Estado</dt><dd>' + (m.isActive ? 'Ativo' : 'Inativo') + '</dd><dt class="text-on-surface-variant">Notas</dt><dd>' + (m.notes || '-').replace(/</g, '&lt;') + '</dd></dl>' +
    '<div class="flex flex-wrap gap-2"><a href="#medicacao-editar?id=' + m.id + '" class="px-4 py-2 bg-primary text-on-primary rounded-lg">Editar</a><a href="#medicacao-folheto?id=' + m.id + '" class="px-4 py-2 border border-outline rounded-lg">Ver folheto</a><a href="#medicacao-interacoes" class="px-4 py-2 border border-outline rounded-lg">Ver interações</a><a href="#medicacao-historico" class="px-4 py-2 border border-outline rounded-lg">Ver histórico</a></div></main>';
}

function viewMedicacaoEditar(params) {
  const m = getMedicationById(params.id);
  if (!m) return viewMedicacaoCategorias();
  const catOpts = CATEGORIAS.map(function (c) { return '<option value="' + c + '"' + (m.category === c ? ' selected' : '') + '>' + c + '</option>'; }).join('');
  return pageHeader('Editar Medicamento', '#medicacao-detalhes?id=' + m.id) +
    '<main class="p-4 bg-white"><form id="form-edit-med" data-id="' + m.id + '" class="space-y-4">' +
    '<div><label class="block text-sm font-medium mb-1">Nome *</label><input type="text" name="name" required class="w-full px-4 py-2 input-outline" value="' + (m.name || '').replace(/"/g, '&quot;') + '" /></div>' +
    '<div><label class="block text-sm font-medium mb-1">Dosagem *</label><input type="text" name="dosage" required class="w-full px-4 py-2 input-outline" value="' + (m.dosage || '').replace(/"/g, '&quot;') + '" /></div>' +
    '<div><label class="block text-sm font-medium mb-1">Substância ativa</label><input type="text" name="substance" class="w-full px-4 py-2 input-outline" value="' + (m.substance || '').replace(/"/g, '&quot;') + '" /></div>' +
    '<div><label class="block text-sm font-medium mb-1">Fabricante</label><input type="text" name="manufacturer" class="w-full px-4 py-2 input-outline" value="' + (m.manufacturer || '').replace(/"/g, '&quot;') + '" /></div>' +
    '<div><label class="block text-sm font-medium mb-1">Número de Unidades *</label><input type="number" name="quantity" required min="1" class="w-full px-4 py-2 input-outline" value="' + (m.quantity ?? 0) + '" /></div>' +
    '<div><label class="block text-sm font-medium mb-1">Data de Validade *</label><input type="date" name="expiryDate" required class="w-full px-4 py-2 input-outline" value="' + (m.expiryDate || '') + '" /></div>' +
    '<div><label class="block text-sm font-medium mb-1">Categoria *</label><select name="category" required class="w-full px-4 py-2 input-outline">' + catOpts + '</select></div>' +
    '<div><label class="block text-sm font-medium mb-1">Estado</label><select name="isActive" class="w-full px-4 py-2 input-outline"><option value="true"' + (m.isActive ? ' selected' : '') + '>Ativo</option><option value="false"' + (!m.isActive ? ' selected' : '') + '>Não Ativo</option></select></div>' +
    '<div><label class="block text-sm font-medium mb-1">Notas</label><textarea name="notes" rows="2" class="w-full px-4 py-2 input-outline">' + (m.notes || '').replace(/</g, '&lt;') + '</textarea></div>' +
    '<button type="submit" class="w-full py-3 bg-primary text-on-primary font-medium rounded-xl btn-round">Guardar alterações</button></form></main>';
}

function viewMedicacaoPesquisar() {
  return pageHeader('Pesquisar Medicamento', '#medicacao') +
    '<main class="p-4 bg-white"><input type="search" placeholder="Nome ou substância (mín. 2 caracteres)..." class="w-full px-4 py-2 rounded-xl border border-gray-200 mb-4" id="pesquisa-infomed" autocomplete="off" /><ul class="space-y-2" id="pesquisa-resultados"></ul></main>';
}

function viewMedicacaoInteracoes() {
  const detected = detectInteractions();
  const known = getKnownInteractions();
  let detHtml = detected.length === 0 ? '<p class="text-on-surface-variant">Nenhuma interação detetada.</p>' : '<ul class="space-y-3">' + detected.map(function (i) { return '<li class="p-3 rounded-xl border-l-4" style="border-color:' + i.color + '"><p class="font-medium">' + i.combination + '</p><p class="text-sm capitalize">' + i.severity + '</p><p class="text-sm mt-1">' + i.mechanism + '</p></li>'; }).join('') + '</ul>';
  let knownHtml = '<ul class="space-y-3">' + known.map(function (i) { return '<li class="p-3 rounded-xl border border-outline" style="border-left-width:4px;border-left-color:' + i.color + '"><p class="font-medium">' + i.combination + '</p><p class="text-sm capitalize">' + i.severity + '</p><p class="text-sm mt-1">' + i.mechanism + '</p></li>'; }).join('') + '</ul>';
  return pageHeader('Interações Medicamentosas', '#medicacao-armario') +
    '<main class="p-4 space-y-6 bg-white"><section><h2 class="font-bold text-lg mb-2">Interações detetadas no seu armário</h2>' + detHtml + '</section><section><h2 class="font-bold text-lg mb-2">Interações que a app verifica</h2>' + knownHtml + '</section></main>';
}

function viewMedicacaoHistorico() {
  const history = getMedicationHistory();
  const listHtml = history.length === 0 ? '<p class="text-on-surface-variant">Nenhuma toma registada.</p>' : '<ul class="space-y-3">' + history.map(function (h) { return '<li class="p-3 rounded-xl border border-outline flex items-center gap-3"><span class="material-icons text-primary">event</span><div><p class="font-medium">' + (h.medicationName || '').replace(/</g, '&lt;') + '</p><p class="text-sm text-on-surface-variant">' + (h.dateTime || '').replace(/</g, '&lt;') + ' · ' + (h.dosage || '').replace(/</g, '&lt;') + '</p></div></li>'; }).join('') + '</ul>';
  return pageHeader('Histórico de Medicação', '#medicacao-armario') +
    '<main class="p-4 bg-white">' + listHtml + '</main>';
}

function viewMedicacaoFolheto(params) {
  const m = getMedicationById(params.id);
  if (!m) return viewMedicacaoCategorias();
  return pageHeader('Folheto informativo', '#medicacao-detalhes?id=' + params.id) +
    '<main class="p-4 prose prose-sm max-w-none bg-white"><h2>' + (m.name || '').replace(/</g, '&lt;') + '</h2><p><strong>Composição:</strong> ' + (m.substance || '-').replace(/</g, '&lt;') + '. Dosagem: ' + (m.dosage || '-').replace(/</g, '&lt;') + '.</p><p>Consulte sempre o folheto da embalagem ou o seu médico/farmacêutico para informações completas.</p></main>';
}

function viewChecklistViagem() {
  let html = pageHeader('Checklist de Viagem', '#medicacao') + '<main class="p-4 space-y-6 bg-white"><p class="text-sm text-on-surface-variant text-center -mt-2">Lista para não esquecer nada antes de viajar.</p>';
  const state = getTravelChecklistState();
  TRAVEL_SECTIONS.forEach(function (sec) {
    html += '<section class="card-round border border-outline p-4"><h2 class="font-bold mb-3">' + sec.title + '</h2>';
    if (sec.checkbox) {
      sec.items.forEach(function (item, idx) {
        const itemId = sec.id + '-' + idx;
        const checked = state[itemId];
        html += '<label class="flex items-start gap-2 py-1 cursor-pointer checklist-item ' + (checked ? 'done' : '') + '"><input type="checkbox" class="travel-check mt-1" data-id="' + itemId + '"' + (checked ? ' checked' : '') + ' /><span>' + item.replace(/</g, '&lt;') + '</span></label>';
      });
    } else {
      html += '<ul class="list-disc pl-5 space-y-1">';
      sec.items.forEach(function (item) { html += '<li>' + item.replace(/</g, '&lt;') + '</li>'; });
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
    const takenLabel = isTakenToday ? 'Já Tomei' : 'Não Tomado';
    const takenIcon = isTakenToday ? 'check_circle' : 'close';
    const takenClasses = isTakenToday
      ? 'taken-btn flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-on-primary'
      : 'taken-btn flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-red-500 text-red-500 bg-transparent';
    return '<li class="p-4 rounded-xl border border-outline bg-surface card-round">' +
      '<div class="flex justify-between items-start gap-3">' +
      '<div>' +
      '<p class="font-medium">' + (med ? med.name : 'Medicamento').replace(/</g, '&lt;') + '</p>' +
      '<p class="text-sm text-on-surface-variant">' + (med ? med.dosage : '') + '</p>' +
      (hours ? '<p class="text-xs text-on-surface-variant mt-1">Horários: ' + hours + '</p>' : '') +
      '</div>' +
      '<div class="flex flex-col items-stretch gap-2 min-w-[140px]">' +
      '<button type="button" class="' + takenClasses + '" data-id="' + r.id + '">' +
      '<span class="material-icons text-sm">' + takenIcon + '</span><span>' + takenLabel + '</span>' +
      '</button>' +
      '<button type="button" class="postpone-btn flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-secondary text-secondary bg-transparent" data-id="' + r.id + '">' +
      '<span class="material-icons text-sm">schedule</span><span>Adiar 15 min</span>' +
      '</button>' +
      '<div class="flex justify-end gap-3 text-xs mt-1">' +
      '<a href="#lembretes-editar?id=' + r.id + '" class="text-on-surface-variant">Editar</a>' +
      '<button type="button" class="text-red-600 deactivate-reminder-btn" data-id="' + r.id + '">Desativar</button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</li>';
  }).join('') + '</ul>';
  return pageHeader('Lembretes', null) +
    '<main class="p-4 space-y-4 bg-white"><a href="#lembretes-novo" class="flex items-center gap-3 w-full py-3 px-4 rounded-xl bg-primary text-white font-medium"><span class="material-icons">add_circle_outline</span><span>Adicionar Lembrete</span></a>' + listHtml + '</main>';
}

function viewLembretesNovo() {
  const meds = getMedications().filter(function (m) { return m.isActive; });
  const medOpts = meds.map(function (m) { return '<option value="' + m.id + '">' + m.name + ' - ' + m.dosage + '</option>'; }).join('');
  return pageHeader('Novo Lembrete', '#lembretes') +
    '<main class="p-4 bg-white"><form id="form-new-reminder" class="space-y-4">' +
    '<div><label class="block text-sm font-medium mb-1">Medicamento *</label><select name="medicationId" required class="w-full px-4 py-2 input-outline"><option value="">Selecionar...</option>' + medOpts + '</select></div>' +
    '<div><label class="block text-sm font-medium mb-1">Data início *</label><input type="date" name="startDate" required value="' + todayStr() + '" class="w-full px-4 py-2 input-outline" /></div>' +
    '<div><label class="block text-sm font-medium mb-1">Data fim</label><input type="date" name="endDate" class="w-full px-4 py-2 input-outline" /></div>' +
    '<div>' +
    '<label class="block text-sm font-medium mb-1">Horários (até 3 por dia) *</label>' +
    '<div id="reminder-times-container" class="space-y-2">' +
    '<div class="flex items-center gap-2 time-row"><input type="time" name="time" required class="flex-1 px-4 py-2 input-outline" />' +
    '<button type="button" class="remove-time-btn hidden text-gray-400"><span class="material-icons text-base">close</span></button></div>' +
    '</div>' +
    '<button type="button" id="btn-add-time" class="mt-2 text-sm text-primary flex items-center gap-1"><span class="material-icons text-base">add</span><span>Adicionar hora</span></button>' +
    '<p class="text-xs text-on-surface-variant mt-1">Pode definir até 3 horários diferentes para este lembrete.</p>' +
    '</div>' +
    '<button type="submit" class="w-full py-3 bg-primary text-on-primary font-medium rounded-xl btn-round">Criar lembrete</button></form></main>';
}

function viewLembretesEditar(params) {
  const r = getReminderById(params.id);
  if (!r) return viewLembretes();
  const meds = getMedications().filter(function (m) { return m.isActive; });
  const medOpts = meds.map(function (m) { return '<option value="' + m.id + '"' + (m.id === r.medicationId ? ' selected' : '') + '>' + m.name + ' - ' + m.dosage + '</option>'; }).join('');
  const timesArr = (r.times && r.times.length ? r.times : [r.time]).filter(function (t) { return !!t; });
  const rowsHtml = (timesArr.length ? timesArr : ['']).map(function (t, idx) {
    const canRemove = idx > 0;
    return '<div class="flex items-center gap-2 time-row"><input type="time" name="time" value="' + (t || '') + '" class="flex-1 px-4 py-2 input-outline"' + (idx === 0 ? ' required' : '') + ' />' +
      '<button type="button" class="remove-time-btn ' + (canRemove ? '' : 'hidden') + ' text-gray-400"><span class="material-icons text-base">close</span></button></div>';
  }).join('');
  return pageHeader('Editar Lembrete', '#lembretes') +
    '<main class="p-4 bg-white"><form id="form-edit-reminder" data-id="' + r.id + '" class="space-y-4">' +
    '<div><label class="block text-sm font-medium mb-1">Medicamento *</label><select name="medicationId" required class="w-full px-4 py-2 input-outline">' + medOpts + '</select></div>' +
    '<div><label class="block text-sm font-medium mb-1">Data início *</label><input type="date" name="startDate" required value="' + (r.startDate || '') + '" class="w-full px-4 py-2 input-outline" /></div>' +
    '<div><label class="block text-sm font-medium mb-1">Data fim</label><input type="date" name="endDate" value="' + (r.endDate || '') + '" class="w-full px-4 py-2 input-outline" /></div>' +
    '<div>' +
    '<label class="block text-sm font-medium mb-1">Horários (até 3 por dia) *</label>' +
    '<div id="reminder-times-container" class="space-y-2">' + rowsHtml + '</div>' +
    '<button type="button" id="btn-add-time" class="mt-2 text-sm text-primary flex items-center gap-1"><span class="material-icons text-base">add</span><span>Adicionar hora</span></button>' +
    '<p class="text-xs text-on-surface-variant mt-1">Pode definir até 3 horários diferentes para este lembrete.</p>' +
    '</div>' +
    '<button type="submit" class="w-full py-3 bg-primary text-on-primary font-medium rounded-xl btn-round">Guardar</button></form></main>';
}

function viewReciclagem() {
  const s = recyclingStats();
  const progressBar = s.nextLevel ? '<div class="mt-2 h-2 bg-gray-200 rounded overflow-hidden"><div class="h-full bg-primary rounded" style="width:' + Math.min(100, s.progress) + '%"></div></div><p class="text-xs text-on-surface-variant mt-1">Próximo: ' + s.nextLevel.name + ' (' + s.nextLevel.min + ' pts)</p>' : '';
  const milestoneBlock = s.milestoneText ? '<p class="p-3 rounded-xl bg-green-50 text-green-800 text-sm">' + s.milestoneText + '</p>' : '';
  return pageHeader('Reciclagem', null) +
    '<main class="p-4 space-y-4 bg-white"><div class="grid grid-cols-2 gap-3"><div class="rounded-2xl p-4 bg-primary-container"><p class="text-sm text-black">Embalagens recicladas</p><p class="text-2xl font-bold text-primary">' + s.totalPackages + '</p></div><div class="rounded-2xl p-4 bg-secondary-container"><p class="text-sm text-black">Unidades verdes</p><p class="text-2xl font-bold text-secondary">' + s.greenUnits + '</p></div></div><div class="rounded-2xl p-4 border border-gray-200"><p class="text-sm text-black">Pontos</p><p class="text-2xl font-bold">' + s.points + '</p><p class="text-sm mt-1">Nível: ' + s.level.name + '</p>' + progressBar + '</div>' + milestoneBlock + '<div class="space-y-2"><a href="#reciclagem-registar" class="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl bg-primary text-white font-medium"><span class="material-icons">add_circle_outline</span><span>Registar Entrega</span></a><a href="#reciclagem-guia" class="flex items-center justify-between w-full py-3 px-4 rounded-xl bg-secondary-container text-secondary font-medium"><span>Guia de Reciclagem</span><span class="material-icons text-gray-500">chevron_right</span></a><a href="#reciclagem-pontos" class="flex items-center justify-between w-full py-3 px-4 rounded-xl bg-secondary-container text-secondary font-medium"><span>Localizador de Pontos</span><span class="material-icons text-gray-500">chevron_right</span></a><a href="#reciclagem-historico" class="flex items-center justify-between w-full py-3 px-4 rounded-xl bg-primary-container text-black font-medium"><span>Histórico</span><span class="material-icons text-gray-500">chevron_right</span></a></div></main>';
}

function viewReciclagemRegistar() {
  return pageHeader('Registar Entrega', '#reciclagem') +
    '<main class="p-4 bg-white"><form id="form-recycling" class="space-y-4"><div><label class="block text-sm font-medium mb-1">Volume *</label><select name="volume" required class="w-full px-4 py-2 input-outline"><option value="pequeno">Pequeno (~6 embalagens)</option><option value="medio">Médio (~15)</option><option value="grande">Grande (~30)</option></select></div><div><label class="block text-sm font-medium mb-1">Nome da farmácia (opcional)</label><input type="text" name="pharmacyName" class="w-full px-4 py-2 input-outline" /></div><div id="recycling-summary" class="hidden p-3 rounded-xl bg-gray-100 text-sm"></div><button type="submit" class="w-full py-3 bg-primary text-on-primary font-medium rounded-xl btn-round">Confirmar</button></form></main>';
}

function viewReciclagemGuia() {
  return pageHeader('Guia de Reciclagem', '#reciclagem') +
    '<main class="p-4 prose prose-sm max-w-none bg-white"><h2>O que entregar (Valormed)</h2><p>Medicamentos fora de prazo, embalagens vazias, medicamentos veterinários.</p><h2>O que não fazer</h2><p>Não deitar no lixo comum nem na sanita.</p><h2>Onde entregar</h2><p>Farmácias e parafarmácias aderentes.</p><h2>Cuidados</h2><p>Entregar embalagens fechadas e retirar dados pessoais.</p></main>';
}

function viewReciclagemPontos() {
  const pointsHtml = RECYCLING_POINTS.map(function (p, i) { return '<li><a href="#reciclagem-ponto?id=' + i + '" class="block p-4 rounded-xl border border-outline card-round"><div class="flex items-start gap-3"><span class="material-icons text-primary">location_on</span><div><p class="font-medium">' + p.name + '</p><p class="text-sm text-on-surface-variant">' + p.address + '</p><p class="text-sm flex items-center gap-1"><span class="material-icons text-sm">straighten</span> ' + p.distance + '</p></div></div></a></li>'; }).join('');
  return pageHeader('Localizador de Pontos', '#reciclagem') +
    '<main class="p-4 bg-white"><ul class="space-y-3">' + pointsHtml + '</ul></main>';
}

function viewReciclagemPonto(params) {
  const id = parseInt(params.id, 10);
  const p = RECYCLING_POINTS[id];
  if (!p) return viewReciclagemPontos();
  return pageHeader(p.name, '#reciclagem-pontos') +
    '<main class="p-4 space-y-2 bg-white"><p><span class="material-icons align-middle text-lg mr-1">location_on</span> ' + p.address + '</p><p><span class="material-icons align-middle text-lg mr-1">straighten</span> ' + p.distance + '</p><p class="text-sm text-on-surface-variant">Ponto de recolha Valormed.</p></main>';
}

function viewReciclagemHistorico() {
  const list = getRecyclingDeliveries().slice().reverse();
  const listHtml = list.length === 0 ? '<p class="text-on-surface-variant">Nenhuma entrega registada.</p>' : '<ul class="space-y-3">' + list.map(function (d) { return '<li class="p-3 rounded-xl border border-outline"><p class="font-medium">' + (d.date || '') + '</p><p class="text-sm">' + (d.totalPackages || 0) + ' embalagens · ' + (d.points || 0) + ' pontos' + (d.pharmacyName ? ' · ' + d.pharmacyName : '') + '</p></li>'; }).join('') + '</ul>';
  return pageHeader('Histórico de Reciclagem', '#reciclagem') +
    '<main class="p-4 bg-white">' + listHtml + '</main>';
}

function viewDicas() {
  const cards = DICAS_ARTIGOS.map(function (a) { return '<a href="#dicas-artigo?id=' + a.id + '" class="block rounded-xl border border-outline overflow-hidden card-round bg-surface"><img src="' + a.image + '" alt="" class="w-full h-40 object-cover" /><div class="p-4"><span class="text-xs text-primary font-medium">' + a.category + '</span><h2 class="font-bold mt-1">' + a.title.replace(/</g, '&lt;') + '</h2><p class="text-sm text-on-surface-variant">' + a.readTime + ' min de leitura</p></div></a>'; }).join('');
  return pageHeader('Dicas de Saúde', null) +
    '<main class="p-4 bg-white"><div class="grid gap-4">' + cards + '</div></main>';
}

function viewDicasArtigo(params) {
  const a = DICAS_ARTIGOS.find(function (x) { return x.id === params.id; });
  if (!a) return viewDicas();
  const paragraphs = a.text.split(/\n\n+/).filter(Boolean);
  const body = paragraphs.map(function (p) { return '<p class="mb-3">' + p.replace(/</g, '&lt;') + '</p>'; }).join('');
  return pageHeader('', '#dicas') +
    '<main class="p-4 bg-white"><img src="' + a.image + '" alt="" class="w-full -mt-2 rounded-t-xl object-cover h-48" /><div class="p-4 -mt-2 rounded-t-2xl"><span class="text-xs text-primary font-medium">' + a.category + '</span><p class="text-sm text-on-surface-variant">' + a.publishedAt + ' · ' + a.readTime + ' min</p><h1 class="text-xl font-bold mt-2 text-black">' + a.title.replace(/</g, '&lt;') + '</h1><div class="prose prose-sm mt-4 max-w-none">' + body + '</div></div></main>';
}

function viewPerfil() {
  return pageHeader('Perfil', '#home') +
    '<main class="p-4 bg-white"><p class="text-on-surface-variant">Informações do utilizador.</p><a href="#definicoes" class="flex items-center justify-between mt-4 py-3 px-4 rounded-xl bg-primary-container text-black font-medium"><span>Definições</span><span class="material-icons text-gray-500">chevron_right</span></a></main>';
}

function viewDefinicoes() {
  const s = getSettings();
  return pageHeader('Definições', '#perfil') +
    '<main class="p-4 space-y-4 bg-white"><div class="flex items-center justify-between p-4 rounded-xl border border-gray-200"><span class="font-medium text-black">Notificações</span><input type="checkbox" id="setting-notifications" ' + (s.notifications ? 'checked' : '') + ' class="rounded" /></div><div class="flex items-center justify-between p-4 rounded-xl border border-gray-200"><span class="font-medium text-black">Tema</span><select id="setting-theme" class="px-3 py-2 rounded-lg border border-gray-200"><option value="light"' + (s.theme === 'light' ? ' selected' : '') + '>Claro</option><option value="dark"' + (s.theme === 'dark' ? ' selected' : '') + '>Escuro</option></select></div></main>';
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
  perfil: viewPerfil,
  definicoes: viewDefinicoes,
};

function pageHeader(title, backHref) {
  var back = backHref ? '<a href="' + backHref + '" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 p-1 rounded-full hover:bg-gray-100" aria-label="Voltar"><span class="material-icons">arrow_back</span></a>' : '';
  return '<header class="relative px-4 flex items-center justify-center bg-white">' + back +
    '<img src="logo.png" alt="DailyMed" class="h-40 w-40 object-contain" />' +
    '</header>' +
    (title ? '<div class="px-4 pb-4 bg-white"><h2 class="text-lg font-bold text-black text-center">' + title + '</h2></div>' : '');
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
  var armarioSearch = document.getElementById('armario-search');
  if (armarioSearch) {
    var currentParams = parseHash().params;
    armarioSearch.addEventListener('input', function () {
      var q = armarioSearch.value.trim();
      var np = { filter: currentParams.filter, cat: currentParams.cat };
      if (q) np.q = q;
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
          var name = (d.name || '').replace(/"/g, '&quot;');
          var dosage = (d.dosage || '').replace(/"/g, '&quot;');
          var substance = (d.substance || '').replace(/"/g, '&quot;');
          var titular = (d.titular || '').replace(/"/g, '&quot;');
          return '<li class="px-4 py-2 cursor-pointer border-b border-outline last:border-0" data-name="' + name + '" data-dosage="' + dosage + '" data-substance="' + substance + '" data-manufacturer="' + titular + '">' + (d.name || '').replace(/</g, '&lt;') + ' · ' + (d.dosage || '').replace(/</g, '&lt;') + '</li>';
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
      notes: [fd.get('posology') && ('Posologia: ' + fd.get('posology')), fd.get('indication') && ('Indicação: ' + fd.get('indication')), fd.get('notes')].filter(Boolean).join('. ') || '',
      reminderTimes: [],
      dailyDosage: '',
      imageUri: imageUri || null,
    };
    saveMedication(med);
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
      m.notes = fd.get('notes') || '';
      saveMedication(m);
      navigate('medicacao-detalhes', { id: id });
    });
  }

  document.querySelectorAll('.delete-med').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (confirm('Remover este medicamento?')) {
        deleteMedication(btn.dataset.id);
        runRoute();
      }
    });
  });

  document.querySelectorAll('.travel-check').forEach(function (cb) {
    cb.addEventListener('change', function () {
      setTravelChecklistItem(cb.dataset.id, cb.checked);
      cb.closest('label').classList.toggle('done', cb.checked);
    });
  });

  function setupReminderTimesForm(form) {
    var container = form.querySelector('#reminder-times-container');
    var addBtn = form.querySelector('#btn-add-time');
    if (!container || !addBtn) return;

    function normalizeRows() {
      var rows = container.querySelectorAll('.time-row');
      rows.forEach(function (row, idx) {
        var input = row.querySelector('input[name="time"]');
        var rm = row.querySelector('.remove-time-btn');
        if (input) input.required = idx === 0;
        if (rm) rm.classList.toggle('hidden', idx === 0);
      });
      var count = rows.length;
      addBtn.disabled = count >= 3;
      addBtn.classList.toggle('opacity-50', count >= 3);
    }

    addBtn.addEventListener('click', function () {
      var rows = container.querySelectorAll('.time-row');
      if (rows.length >= 3) return;
      var row = document.createElement('div');
      row.className = 'flex items-center gap-2 time-row';
      row.innerHTML = '<input type="time" name="time" class="flex-1 px-4 py-2 input-outline" />' +
        '<button type="button" class="remove-time-btn text-gray-400"><span class="material-icons text-base">close</span></button>';
      container.appendChild(row);
      normalizeRows();
    });

    container.addEventListener('click', function (e) {
      var rmBtn = e.target.closest('.remove-time-btn');
      if (!rmBtn) return;
      var rows = container.querySelectorAll('.time-row');
      if (rows.length <= 1) return;
      var row = rmBtn.closest('.time-row');
      if (row) row.remove();
      normalizeRows();
    });

    normalizeRows();
  }

  var formNewRem = document.getElementById('form-new-reminder');
  if (formNewRem) {
    setupReminderTimesForm(formNewRem);
    formNewRem.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(formNewRem);
      var times = [];
      formNewRem.querySelectorAll('input[name="time"]').forEach(function (input) {
        var v = (input.value || '').trim();
        if (v) times.push(v);
      });
      if (!times.length) {
        alert('Selecione pelo menos um horário.');
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
      };
      saveReminder(rem);
      navigate('lembretes');
    });
  }

  var formEditRem = document.getElementById('form-edit-reminder');
  if (formEditRem) {
    setupReminderTimesForm(formEditRem);
    formEditRem.addEventListener('submit', function (e) {
      e.preventDefault();
      var id = formEditRem.dataset.id;
      var fd = new FormData(formEditRem);
      var r = getReminderById(id);
      if (!r) return;
      var timesEdit = [];
      formEditRem.querySelectorAll('input[name="time"]').forEach(function (input) {
        var v = (input.value || '').trim();
        if (v) timesEdit.push(v);
      });
      if (!timesEdit.length) {
        alert('Selecione pelo menos um horário.');
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
      navigate('lembretes');
    });
  }

  document.querySelectorAll('.taken-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var r = getReminderById(btn.dataset.id);
      if (r) {
        var today = todayStr();
        if (r.lastTakenDate === today) {
          // Voltar a "Não Tomado"
          r.lastTakenDate = null;
        } else {
          // Marcar como "Já Tomei" hoje
          var med = getMedicationById(r.medicationId);
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
        var corpo = 'Hora de tomar ' + (med ? med.name : 'o seu medicamento') + '.';
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
          var goto = '#medicacao-adicionar?nome=' + encodeURIComponent(d.name) + '&dosagem=' + encodeURIComponent(d.dosage) + '&substancia=' + encodeURIComponent(d.substance);
          return '<li><a href="' + goto + '" class="block p-3 rounded-xl border border-outline hover:bg-primary-container">' + (d.name || '').replace(/</g, '&lt;') + ' · ' + (d.dosage || '').replace(/</g, '&lt;') + '</a></li>';
        }).join('');
      });
    });
  }

  var notifCheck = document.getElementById('setting-notifications');
  if (notifCheck) {
    notifCheck.addEventListener('change', function () {
      setSettings({ notifications: notifCheck.checked });
      if (notifCheck.checked && typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission();
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

function showAddMedicationModal() {
  var html = '<div id="modal-add-med" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">' +
    '<div class="bg-white rounded-2xl max-w-md w-full shadow-lg p-5">' +
    '<h3 class="font-bold text-lg text-black text-center mb-5">Como deseja adicionar o medicamento?</h3>' +
    '<div class="space-y-3">' +
    '<button type="button" id="modal-add-manual" class="flex items-center gap-3 w-full py-3 px-4 rounded-xl bg-primary text-white font-medium"><span class="material-icons">edit</span><span>Adicionar Manualmente</span></button>' +
    '<button type="button" id="modal-add-pesquisar" class="flex items-center gap-3 w-full py-3 px-4 rounded-xl bg-secondary text-white font-medium"><span class="material-icons">search</span><span>Pesquisar Medicamento</span></button>' +
    '<button type="button" id="modal-add-cancelar" class="flex items-center justify-center w-full py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-medium">Cancelar</button>' +
    '</div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  function closeModal() { var el = document.getElementById('modal-add-med'); if (el) el.remove(); }
  document.getElementById('modal-add-manual').addEventListener('click', function () { closeModal(); navigate('medicacao-adicionar'); });
  document.getElementById('modal-add-pesquisar').addEventListener('click', function () { closeModal(); navigate('medicacao-pesquisar'); });
  document.getElementById('modal-add-cancelar').addEventListener('click', closeModal);
  document.getElementById('modal-add-med').addEventListener('click', function (e) { if (e.target.id === 'modal-add-med') closeModal(); });
}

function showInteractionsModal(detected, onClose) {
  var listHtml = detected.map(function (i) { return '<li class="p-2 rounded border-l-4" style="border-color:' + i.color + '"><p class="font-medium text-sm">' + i.combination + '</p><p class="text-xs">' + i.mechanism + '</p></li>'; }).join('');
  var html = '<div id="modal-overlay" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div class="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto p-4"><h3 class="font-bold text-lg mb-2">Interações detetadas</h3><p class="text-sm text-on-surface-variant mb-4">Consulte um profissional de saúde.</p><ul class="space-y-2 mb-4">' + listHtml + '</ul><button type="button" id="modal-close-btn" class="w-full py-3 bg-primary text-white rounded-xl">Entendi</button></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('modal-close-btn').addEventListener('click', function () { document.getElementById('modal-overlay').remove(); if (onClose) onClose(); });
  document.getElementById('modal-overlay').addEventListener('click', function (e) { if (e.target.id === 'modal-overlay') { document.getElementById('modal-overlay').remove(); if (onClose) onClose(); } });
}

function init() {
  loadInfomed().catch(function () {});
  seedMedicationsIfEmpty();
  var s = getSettings();
  document.getElementById('body-theme').classList.toggle('dark', s.theme === 'dark');
  if (s.notifications && typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission();
  window.addEventListener('hashchange', runRoute);
  document.body.addEventListener('click', function (e) {
    if (e.target.closest('#btn-adicionar-medicamento') || e.target.closest('#btn-adicionar-medicamento-fab')) {
      e.preventDefault();
      showAddMedicationModal();
    }
  });
  runRoute();
}

init();
