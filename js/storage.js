/**
 * DailyMed - Persistence layer (localStorage)
 * Keys: medications, reminders, recycling_deliveries, settings, travel_checklist, medication_history
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

function setJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Medications
function getMedications() {
  return getJson(STORAGE_KEYS.medications, []);
}

function setMedications(arr) {
  setJson(STORAGE_KEYS.medications, arr);
}

function getMedicationById(id) {
  return getMedications().find((m) => m.id === id);
}

function saveMedication(med) {
  const list = getMedications();
  const idx = list.findIndex((m) => m.id === med.id);
  if (idx >= 0) list[idx] = med;
  else list.push(med);
  setMedications(list);
  return med;
}

function deleteMedication(id) {
  setMedications(getMedications().filter((m) => m.id !== id));
}

// Reminders
function getReminders() {
  return getJson(STORAGE_KEYS.reminders, []);
}

function setReminders(arr) {
  setJson(STORAGE_KEYS.reminders, arr);
}

function getReminderById(id) {
  return getReminders().find((r) => r.id === id);
}

function saveReminder(rem) {
  const list = getReminders();
  const idx = list.findIndex((r) => r.id === rem.id);
  if (idx >= 0) list[idx] = rem;
  else list.push(rem);
  setReminders(list);
  return rem;
}

function deleteReminder(id) {
  setReminders(getReminders().filter((r) => r.id !== id));
}

// Recycling deliveries
function getRecyclingDeliveries() {
  return getJson(STORAGE_KEYS.recycling, []);
}

function setRecyclingDeliveries(arr) {
  setJson(STORAGE_KEYS.recycling, arr);
}

function addRecyclingDelivery(delivery) {
  const list = getRecyclingDeliveries();
  list.push(delivery);
  setRecyclingDeliveries(list);
  return delivery;
}

// Settings (notifications, theme)
function getSettings() {
  return getJson(STORAGE_KEYS.settings, { notifications: true, theme: 'light' });
}

function setSettings(settings) {
  setJson(STORAGE_KEYS.settings, { ...getSettings(), ...settings });
}

// Travel checklist: { itemId: true } for checked
function getTravelChecklistState() {
  return getJson(STORAGE_KEYS.travelChecklist, {});
}

function setTravelChecklistState(state) {
  setJson(STORAGE_KEYS.travelChecklist, state);
}

function setTravelChecklistItem(itemId, checked) {
  const state = getTravelChecklistState();
  if (checked) state[itemId] = true;
  else delete state[itemId];
  setTravelChecklistState(state);
}

// Medication history (taken doses)
function getMedicationHistory() {
  return getJson(STORAGE_KEYS.medicationHistory, []);
}

function addMedicationHistory(entry) {
  const list = getMedicationHistory();
  list.unshift(entry);
  setJson(STORAGE_KEYS.medicationHistory, list);
  return entry;
}

// Seed from user_medications.json if empty (apenas com protocolo http/https)
function seedMedicationsIfEmpty() {
  if (getMedications().length > 0) return;
  if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') return;
  fetch('user_medications.json')
    .then((r) => r.json())
    .then((arr) => {
      if (Array.isArray(arr) && arr.length) setMedications(arr);
    })
    .catch(() => {});
}
