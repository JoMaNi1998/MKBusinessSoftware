/**
 * Stock Status Utilities
 * Zentrale Hilfsfunktionen für Bestandsstatus-Anzeige
 */

/**
 * Gibt die Tailwind-CSS-Klassen für den Bestandsstatus zurück
 * @param {number} stock - Aktueller Bestand
 * @param {number} heatStock - Meldebestand
 * @param {string} orderStatus - Bestellstatus
 * @returns {string} Tailwind-CSS-Klassen für Farbe und Hintergrund
 */
export const getStockStatusColor = (stock = 0, heatStock = 0, orderStatus) => {
  const stockNum = Number(stock);
  const heatStockNum = Number(heatStock);

  if (stockNum < 0) return 'text-red-700 bg-red-100';
  if (stockNum === 0) return 'text-red-600 bg-red-50';
  if (orderStatus === 'bestellt') return 'text-blue-600 bg-blue-50';
  if (stockNum <= heatStockNum) return 'text-orange-600 bg-orange-50';
  return 'text-green-600 bg-green-50';
};

/**
 * Gibt den Statustext für den Bestand zurück
 * @param {number} stock - Aktueller Bestand
 * @param {number} heatStock - Meldebestand
 * @param {string} orderStatus - Bestellstatus
 * @returns {string} Deutscher Statustext
 */
export const getStockStatusText = (stock = 0, heatStock = 0, orderStatus) => {
  const stockNum = Number(stock);
  const heatStockNum = Number(heatStock);

  if (stockNum < 0) return `Nachbestellen (${Math.abs(stockNum)})`;
  if (stockNum === 0) return 'Nicht verfügbar';
  if (orderStatus === 'bestellt') return 'Bestellt';
  if (stockNum <= heatStockNum) return 'Niedrig';
  return 'Auf Lager';
};
