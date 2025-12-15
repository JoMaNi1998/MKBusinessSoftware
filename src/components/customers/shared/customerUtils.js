/**
 * Utility-Klasse für CSS-Klassen-Verkettung
 */
export const cn = (...cls) => cls.filter(Boolean).join(' ');

/**
 * Berechnet die nächste Kunden-ID basierend auf existierenden Kunden
 */
export const computeNextCustomerId = (customers = []) => {
  const regex = /^KUN-(\d{3,})$/;
  const max = customers.reduce((acc, c) => {
    const id = c?.customerID;
    if (!id || typeof id !== 'string') return acc;
    const m = id.match(regex);
    if (!m) return acc;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `KUN-${String(max + 1).padStart(3, '0')}`;
};

/**
 * Berechnet die nächste Projekt-ID basierend auf existierenden Projekten
 */
export const computeNextProjectId = (projects = []) => {
  const regex = /^PRO-(\d{3,})$/;
  const max = projects.reduce((acc, p) => {
    const id = p?.projectID;
    if (!id || typeof id !== 'string') return acc;
    const m = id.match(regex);
    if (!m) return acc;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `PRO-${String(max + 1).padStart(3, '0')}`;
};

/**
 * Generiert eine zufällige 4-stellige Zahl als String
 */
export const random4 = () => String(Math.floor(Math.random() * 10000)).padStart(4, '0');

/**
 * Bereinigt den Kundennamen für die Verwendung in Projekt-IDs
 */
export const sanitizeCustomerName = (name) => {
  if (!name) return '';
  return name.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '').substring(0, 20);
};

/**
 * Erstellt eine formatierte Adresse aus den Einzelteilen
 */
export const addressFromParts = ({ street, houseNumber, postalCode, city }) => {
  const s = (street || '').trim();
  const h = (houseNumber || '').trim();
  const p = (postalCode || '').trim();
  const c = (city || '').trim();
  if (!s && !h && !p && !c) return '';
  return `${s} ${h}, ${p} ${c}`.replace(/\s+,/g, ',').replace(/\s{2,}/g, ' ').trim();
};

/**
 * Formatiert einen Preis im deutschen Format
 */
export const formatPrice = (price) => {
  if (price === null || price === undefined || price === '') return '0,00 €';
  const num = Number(price);
  if (Number.isNaN(num)) return '0,00 €';
  return `${num.toFixed(2).replace('.', ',')} €`;
};

/**
 * Formatiert ein Datum im deutschen Format
 */
export const formatDate = (date) => {
  if (!date) return null;
  try {
    let d;
    if (date instanceof Date) d = date;
    else if (typeof date === 'string' || typeof date === 'number') d = new Date(date);
    else if (date.seconds) d = new Date(date.seconds * 1000); // Firestore Timestamp
    else return 'Ungültiges Datum';
    if (isNaN(d.getTime())) return 'Ungültiges Datum';
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return 'Ungültiges Datum';
  }
};
