/**
 * Stock Status Utilities
 * Zentrale Hilfsfunktionen für Bestandsstatus-Anzeige
 */

/**
 * Bestellstatus-Typ (aus Material)
 */
export type OrderStatus = 'bestellt' | 'offen' | null | undefined;

/**
 * Gibt die Tailwind-CSS-Klassen für den Bestandsstatus zurück
 * @param stock - Aktueller Bestand
 * @param heatStock - Meldebestand
 * @param orderStatus - Bestellstatus
 * @returns Tailwind-CSS-Klassen für Farbe und Hintergrund
 */
export const getStockStatusColor = (
  stock: number = 0,
  heatStock: number = 0,
  orderStatus?: OrderStatus
): string => {
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
 * @param stock - Aktueller Bestand
 * @param heatStock - Meldebestand
 * @param orderStatus - Bestellstatus
 * @returns Deutscher Statustext
 */
export const getStockStatusText = (
  stock: number = 0,
  heatStock: number = 0,
  orderStatus?: OrderStatus
): string => {
  const stockNum = Number(stock);
  const heatStockNum = Number(heatStock);

  if (stockNum < 0) return `Nachbestellen (${Math.abs(stockNum)})`;
  if (stockNum === 0) return 'Nicht verfügbar';
  if (orderStatus === 'bestellt') return 'Bestellt';
  if (stockNum <= heatStockNum) return 'Niedrig';
  return 'Auf Lager';
};
