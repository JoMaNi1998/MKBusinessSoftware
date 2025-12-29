/**
 * Helper Utilities
 * Allgemeine Hilfsfunktionen für die gesamte Anwendung
 */

/**
 * Konvertiert einen Wert sicher zu einer Zahl
 *
 * @param value - Der zu konvertierende Wert
 * @param defaultValue - Standardwert falls Konvertierung fehlschlägt (default: 0)
 * @returns Die konvertierte Zahl oder den Standardwert
 *
 * @example
 * toNumber('42') // 42
 * toNumber(null, 10) // 10
 * toNumber('abc') // 0
 */
export const toNumber = (value: unknown, defaultValue: number = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : defaultValue;
};

/**
 * Normalisiert einen String für Vergleiche (lowercase, trimmed)
 *
 * @param value - Der zu normalisierende Wert
 * @returns Normalisierter String in Kleinbuchstaben
 *
 * @example
 * normalize('  Hello World  ') // 'hello world'
 * normalize(null) // ''
 * normalize(123) // '123'
 */
export const normalize = (value: unknown): string => {
  return (value || '').toString().toLowerCase().trim();
};

/**
 * Prüft ob ein Wert leer ist (null, undefined, leerer String, leeres Array)
 *
 * @param value - Der zu prüfende Wert
 * @returns true wenn der Wert leer ist
 *
 * @example
 * isEmpty(null) // true
 * isEmpty('') // true
 * isEmpty([]) // true
 * isEmpty('hello') // false
 */
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Erstellt einen eindeutigen Schlüssel aus mehreren Werten
 *
 * @param parts - Die Teile des Schlüssels
 * @returns Zusammengesetzter Schlüssel
 *
 * @example
 * createKey('user', '123', 'profile') // 'user:123:profile'
 */
export const createKey = (...parts: (string | number | undefined | null)[]): string => {
  return parts.filter(Boolean).join(':');
};
