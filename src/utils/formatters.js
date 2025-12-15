/**
 * Formatter Utilities
 * Zentrale Formatierungsfunktionen
 */

/**
 * Formatiert einen Preis im deutschen Format (ohne Währungssymbol)
 * @param {number|string} price - Der zu formatierende Preis
 * @returns {string} Formatierter Preis als "X,XX" oder leerer String
 */
export const formatPrice = (price) => {
  if (price === null || price === undefined || price === '') return '';
  const num = Number(price);
  if (Number.isNaN(num)) return '';
  return num.toFixed(2).replace('.', ',');
};

/**
 * Baut eine Beschreibung aus Hersteller, Typ und Kategorie zusammen
 * @param {Object} params - Parameter-Objekt
 * @param {string} params.manufacturer - Hersteller
 * @param {string} params.type - Produkttyp
 * @param {string} params.categoryName - Kategoriename
 * @returns {string} Zusammengesetzte Beschreibung
 */
export const buildDescription = ({ manufacturer, type, categoryName }) => {
  const m = (manufacturer || '').trim();
  const t = (type || '').trim();
  const c = (categoryName || '').trim();

  if (!m && !t && !c) return '';
  if (m && t && c) return `${m} ${t} (${c})`;
  if (m && t) return `${m} ${t}`;
  if (t && c) return `${t} (${c})`;
  if (m && c) return `${m} (${c})`;
  return m || t || c;
};

/**
 * Generiert die nächste Material-ID basierend auf existierenden Materialien
 * @param {Array} materials - Array aller Materialien
 * @returns {string} Nächste Material-ID im Format "MAT-XXX"
 */
export const computeNextMaterialId = (materials) => {
  const regex = /^MAT-(\d+)$/;
  const maxNum = (materials || []).reduce((acc, m) => {
    const id = m?.materialID;
    if (typeof id !== 'string') return acc;
    const match = id.match(regex);
    if (!match) return acc;
    const n = parseInt(match[1], 10);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `MAT-${String(maxNum + 1).padStart(3, '0')}`;
};
