/**
 * DailyMed - camada de persistência.
 * Modo v1: as chaves de sempre (dailymed_medications, dailymed_reminders, ...), como antes.
 * Modo v2: medicamentos, lembretes, tomas e stock vivem em dailymed_v2 (ver js/v2-store.js) e as chaves
 * de medicação v1 ficam congeladas: nunca são escritas.
 * Em ambos os modos, todas as gravações passam por DMStore, que bloqueia separadores sem permissão de escrita.
 */

const STORAGE_KEYS = {
  medications: 'dailymed_medications',
  reminders: 'dailymed_reminders',
  recycling: 'dailymed_recycling_deliveries',
  settings: 'dailymed_settings',
  travelChecklist: 'dailymed_travel_checklist',
  medicationHistory: 'dailymed_medication_history',
};

function getJson(key, defaultValue = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/** Gravação guardada. Devolve true se gravou. */
function setJson(key, value) {
  if (typeof DMStore !== 'undefined') return DMStore.writeRaw(key, JSON.stringify(value));
  localStorage.setItem(key, JSON.stringify(value));
  return true;
}

function isV2() { return typeof DMStore !== 'undefined' && DMStore.mode() === 'v2'; }
function v2State() { return isV2() ? DMStore.getV2() : null; }

/** Medicamento v2 apresentado no formato que o resto da app conhece (quantity = saldo de stock, imageUri validada). */
function decorateV2Medication(st, m, images) {
  var out = Object.assign({}, m);
  var bal = DailyMedV2.stockBalance(st, m.id);
  out.quantity = bal !== null ? bal : (m.legacyQuantity != null ? m.legacyQuantity : null);
  out.stockConfigured = bal !== null;
  var uri = m.imageId && images ? images[m.imageId] : null;
  out.imageUri = uri && DailyMedImages.safeImageSrc(uri) ? uri : null;
  out.imageInvalid = !!(m.imageId && !out.imageUri); // fotografia referenciada mas inválida ou em falta → placeholder
  return out;
}
function v2Images() { try { return JSON.parse(localStorage.getItem('dailymed_v2_images') || '{}') || {}; } catch (e) { return {}; } }

// Medications
function getMedications() {
  const st = v2State();
  if (st) {
    const images = v2Images();
    return st.medications.filter(function (m) { return !m.removedAt; }).map(function (m) { return decorateV2Medication(st, m, images); });
  }
  return getJson(STORAGE_KEYS.medications, []);
}

function setMedications(arr) {
  if (isV2()) return false; // em v2 só se grava medicamento a medicamento, por operações
  return setJson(STORAGE_KEYS.medications, arr);
}

function getMedicationById(id) {
  return getMedications().find((m) => m.id === id);
}

/** Em v2 devolve o resultado da operação; em v1 devolve o medicamento ou false. */
function saveMedication(med) {
  if (isV2()) {
    const st = v2State();
    const current = st.medications.find(function (m) { return m.id === med.id; }) || null;
    const clean = Object.assign({}, med);
    delete clean.quantity; delete clean.stockConfigured; delete clean.imageUri; delete clean.imageInvalid;
    clean.imageId = current ? current.imageId || null : null;
    const currentUri = current && current.imageId ? v2Images()[current.imageId] : null;
    if (med.imageUri && med.imageUri !== currentUri) {
      // Fotografia nova: 1) grava a imagem com id novo, 2) atualiza a referência, 3) remove a antiga.
      const imgId = DMStore.putImage(med.imageUri);
      if (!imgId) return { status: 'rejected', reason: 'image_not_saved' };
      clean.imageId = imgId;
    }
    if (!current) clean.legacyQuantity = null;
    const res = DMStore.applyV2({ operationId: med._operationId || DMStore.newOperationId(), type: 'medication_upsert', medication: clean });
    DMStore.cleanupOrphanImages();
    return res;
  }
  const list = getMedications();
  const idx = list.findIndex((m) => m.id === med.id);
  if (idx >= 0) list[idx] = med;
  else list.push(med);
  return setMedications(list) ? med : false;
}

function deleteMedication(id) {
  if (isV2()) return DMStore.applyV2({ operationId: DMStore.newOperationId(), type: 'medication_remove', medicationId: id });
  return setMedications(getMedications().filter((m) => m.id !== id));
}

// Reminders
function getReminders() {
  const st = v2State();
  if (st) return st.reminders.map(function (r) { return Object.assign({}, r); });
  return getJson(STORAGE_KEYS.reminders, []);
}

function setReminders(arr) {
  if (isV2()) return false;
  return setJson(STORAGE_KEYS.reminders, arr);
}

function getReminderById(id) {
  return getReminders().find((r) => r.id === id);
}

function saveReminder(rem) {
  if (isV2()) {
    const clean = Object.assign({}, rem);
    delete clean.lastTakenDate; delete clean.lastNotifiedDate; delete clean.lastNotifiedTimes; delete clean.time; delete clean.period;
    return DMStore.applyV2({ operationId: rem._operationId || DMStore.newOperationId(), type: 'reminder_upsert', reminder: clean });
  }
  const list = getReminders();
  const idx = list.findIndex((r) => r.id === rem.id);
  if (idx >= 0) list[idx] = rem;
  else list.push(rem);
  return setReminders(list) ? rem : false;
}

function deleteReminder(id) {
  if (isV2()) {
    const r = getReminderById(id); if (!r) return false;
    r.isActive = false;
    return saveReminder(r);
  }
  return setReminders(getReminders().filter((r) => r.id !== id));
}

// Recycling deliveries
function getRecyclingDeliveries() {
  return getJson(STORAGE_KEYS.recycling, []);
}

function setRecyclingDeliveries(arr) {
  return setJson(STORAGE_KEYS.recycling, arr);
}

function addRecyclingDelivery(delivery) {
  const list = getRecyclingDeliveries();
  list.push(delivery);
  return setRecyclingDeliveries(list) ? delivery : false;
}

// Settings (notifications, theme)
function getSettings() {
  return getJson(STORAGE_KEYS.settings, { notifications: true, theme: 'light' });
}

function setSettings(settings) {
  return setJson(STORAGE_KEYS.settings, { ...getSettings(), ...settings });
}

// Travel checklist: { itemId: true } for checked
function getTravelChecklistState() {
  return getJson(STORAGE_KEYS.travelChecklist, {});
}

function setTravelChecklistState(state) {
  return setJson(STORAGE_KEYS.travelChecklist, state);
}

function setTravelChecklistItem(itemId, checked) {
  const state = getTravelChecklistState();
  if (checked) state[itemId] = true;
  else delete state[itemId];
  return setTravelChecklistState(state);
}

// Medication history (taken doses)
function getMedicationHistory() {
  const st = v2State();
  if (st) {
    return DailyMedV2.historyEntries(st).map(function (r) {
      return { medicationName: r.medicationSnapshot.name, dosage: r.medicationSnapshot.dosage,
        dateTime: r.recordedAt ? new Date(r.recordedAt).toLocaleString('pt-PT') : (r.legacy ? r.legacy.dateTime : ''), notes: '', status: r.status };
    });
  }
  return getJson(STORAGE_KEYS.medicationHistory, []);
}

function addMedicationHistory(entry) {
  if (isV2()) return false; // em v2 o histórico vem dos registos de toma
  const list = getMedicationHistory();
  list.unshift(entry);
  return setJson(STORAGE_KEYS.medicationHistory, list) ? entry : false;
}

// Seed inicial desativado (já não usa user_medications.json)
function seedMedicationsIfEmpty() {
  // Não carrega medicamentos de ficheiro externo; a lista fica vazia até o utilizador adicionar.
}
