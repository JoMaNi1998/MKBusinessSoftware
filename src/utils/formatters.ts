/**
 * Formatter Utilities
 * Zentrale Formatierungsfunktionen
 */

import type { Material, Customer } from '../types';

/**
 * Formatiert einen Preis im deutschen Format (ohne Währungssymbol)
 * @param price - Der zu formatierende Preis
 * @returns Formatierter Preis als "X,XX" oder leerer String
 */
export const formatPrice = (price: number | string | null | undefined): string => {
  if (price === null || price === undefined || price === '') return '';
  const num = Number(price);
  if (Number.isNaN(num)) return '';
  return num.toFixed(2).replace('.', ',');
};

/**
 * Parameter für buildDescription
 */
export interface BuildDescriptionParams {
  manufacturer?: string;
  type?: string;
  categoryName?: string;
}

/**
 * Baut eine Beschreibung aus Hersteller, Typ und Kategorie zusammen
 * @param params - Parameter-Objekt
 * @returns Zusammengesetzte Beschreibung
 */
export const buildDescription = ({ manufacturer, type, categoryName }: BuildDescriptionParams): string => {
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
 * @param materials - Array aller Materialien
 * @returns Nächste Material-ID im Format "MAT-XXX"
 */
export const computeNextMaterialId = (materials: Material[]): string => {
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

// ============================================
// INTL FORMATTER INSTANZEN (Performance-Optimierung)
// ============================================

/**
 * Einmal erstellte Intl.NumberFormat Instanzen für bessere Performance
 * Vermeidet wiederholtes Erstellen der Formatter bei jedem Aufruf
 */
const _currencyFormatter = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const currencyWithSymbolFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR'
});

const compactFormatter = new Intl.NumberFormat('de-DE', {
  notation: 'compact',
  compactDisplay: 'short'
});

// ============================================
// ERWEITERTE FORMATIERUNGSFUNKTIONEN
// ============================================

/**
 * Formatiert Zahl als Währung mit Euro-Symbol
 *
 * @param price - Preis als Zahl oder String
 * @returns Formatierter Preis "1.234,56 €"
 *
 * @example
 * formatCurrency(1234.56) // "1.234,56 €"
 * formatCurrency('999.99') // "999,99 €"
 * formatCurrency(null) // ""
 */
export const formatCurrency = (price: number | string | null | undefined): string => {
  if (price === null || price === undefined || price === '') return '';
  const num = Number(price);
  if (Number.isNaN(num)) return '';
  return currencyWithSymbolFormatter.format(num);
};

/**
 * Formatiert große Zahlen kompakt
 *
 * @param num - Zahl
 * @returns Kompakte Darstellung "1,5 Tsd.", "2,3 Mio."
 *
 * @example
 * formatCompactNumber(1500) // "1,5 Tsd."
 * formatCompactNumber(2300000) // "2,3 Mio."
 * formatCompactNumber(42) // "42"
 */
export const formatCompactNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '';
  return compactFormatter.format(num);
};

/**
 * Formatiert Prozentsatz
 *
 * @param value - Wert zwischen 0 und 100
 * @param decimals - Anzahl Nachkommastellen (default: 1)
 * @returns Formatierter Prozentsatz "42,5 %"
 *
 * @example
 * formatPercent(42.5) // "42,5 %"
 * formatPercent(99.999, 2) // "100,00 %"
 * formatPercent(15) // "15,0 %"
 */
export const formatPercent = (value: number | null | undefined, decimals: number = 1): string => {
  if (value === null || value === undefined) return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return `${num.toFixed(decimals).replace('.', ',')} %`;
};

/**
 * Formatiert Dateigröße in lesbares Format
 *
 * @param bytes - Größe in Bytes
 * @returns Formatierte Größe "1,5 MB"
 *
 * @example
 * formatFileSize(0) // "0 Bytes"
 * formatFileSize(1024) // "1 KB"
 * formatFileSize(1536000) // "1,46 MB"
 * formatFileSize(1073741824) // "1 GB"
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return value.toString().replace('.', ',') + ' ' + sizes[i];
};

/**
 * Formatiert Telefonnummer im deutschen Format
 *
 * Einfache Formatierung für deutsche Nummern:
 * - +49 123 456789 (internationale Vorwahl)
 * - 0123 456789 (nationale Vorwahl)
 *
 * @param phone - Telefonnummer
 * @returns Formatierte Telefonnummer
 *
 * @example
 * formatPhone('+4912345678') // "+49 123 45678"
 * formatPhone('012345678') // "0123 45678"
 * formatPhone('invalid') // "invalid"
 */
export const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return '';

  // Entferne alles außer Zahlen und +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Formatierung für +49 Nummern
  if (cleaned.startsWith('+49')) {
    return cleaned.replace(/(\+49)(\d{3})(\d+)/, '$1 $2 $3');
  }

  // Formatierung für 0-Nummern (nationale Vorwahl)
  if (cleaned.startsWith('0')) {
    return cleaned.replace(/^0(\d{3})(\d+)/, '0$1 $2');
  }

  // Keine Formatierung möglich, Original zurückgeben
  return phone;
};

// ============================================
// KUNDEN-FORMATIERUNGSFUNKTIONEN
// ============================================

/**
 * Gibt den Kundennamen zurück oder einen Fallback
 *
 * @param customer - Kundenobjekt (kann null/undefined sein)
 * @returns Kundenname oder 'Unbekannter Kunde'
 *
 * @example
 * getCustomerName({ firmennameKundenname: 'Muster GmbH' }) // 'Muster GmbH'
 * getCustomerName(null) // 'Unbekannter Kunde'
 */
export const getCustomerName = (customer: Customer | null | undefined): string => {
  return customer?.firmennameKundenname || 'Unbekannter Kunde';
};

/**
 * Formatiert die Kundenadresse
 *
 * @param customer - Kundenobjekt (kann null/undefined sein)
 * @returns Formatierte Adresse oder 'Keine Adresse'
 *
 * @example
 * getCustomerAddress({ strasse: 'Hauptstr. 1', plz: '12345', ort: 'Berlin' })
 * // 'Hauptstr. 1, 12345 Berlin'
 * getCustomerAddress(null) // 'Keine Adresse'
 */
export const getCustomerAddress = (customer: Customer | null | undefined): string => {
  if (!customer) return 'Keine Adresse';

  const street = customer.strasse ?? '';
  const zip = customer.plz ?? '';
  const city = customer.ort ?? '';

  const zipCity = [zip, city].filter(Boolean).join(' ');
  const fullAddress = [street, zipCity].filter(Boolean).join(', ');

  return fullAddress || 'Keine Adresse';
};
