/**
 * Globale Datum-Utilities für Firebase Timestamp Support
 */

import { Timestamp } from 'firebase/firestore';
import type { TimestampInput } from '../types';

/**
 * Konvertiert verschiedene Timestamp-Formate zu einem Date-Objekt
 * Unterstützt: Date, String, Number, Firebase Timestamp
 */
export const parseTimestamp = (timestamp: TimestampInput): Date | null => {
  if (!timestamp) return null;

  // Bereits ein Date-Objekt
  if (timestamp instanceof Date) {
    return timestamp;
  }

  // String oder Nummer (ISO-String oder Unix-Timestamp)
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  }

  // Firebase Timestamp mit seconds Property
  if (typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date((timestamp as Timestamp).seconds * 1000);
  }

  // Firebase Timestamp mit toDate() Methode
  if (typeof timestamp === 'object' && 'toDate' in timestamp && typeof (timestamp as any).toDate === 'function') {
    return (timestamp as Timestamp).toDate();
  }

  // ServerTimestamp Platzhalter ignorieren (noch nicht aufgelöst)
  if (typeof timestamp === 'object' && '_methodName' in timestamp && (timestamp as any)._methodName === 'serverTimestamp') {
    return null;
  }

  return null;
};

/**
 * Formatiert einen Timestamp als deutschen Datum-Zeit-String
 */
export const formatDateTime = (timestamp: TimestampInput): string => {
  if (!timestamp) return 'Unbekannt';

  // ServerTimestamp Platzhalter ignorieren
  if (typeof timestamp === 'object' && '_methodName' in timestamp && (timestamp as any)._methodName === 'serverTimestamp') {
    return 'Gerade eben';
  }

  try {
    const dateObj = parseTimestamp(timestamp);

    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'Ungültiges Datum';
    }

    return dateObj.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Fehler beim Formatieren des Datums:', error, timestamp);
    return 'Ungültiges Datum';
  }
};

/**
 * Formatiert einen Timestamp als deutschen Datum-String (ohne Zeit)
 */
export const formatDate = (timestamp: TimestampInput): string => {
  if (!timestamp) return 'Unbekannt';

  try {
    const dateObj = parseTimestamp(timestamp);

    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'Ungültiges Datum';
    }

    return dateObj.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('Fehler beim Formatieren des Datums:', error, timestamp);
    return 'Ungültiges Datum';
  }
};

/**
 * Formatiert relative Zeit ("vor 5 Minuten", "in 2 Tagen")
 *
 * Verwendet Intl.RelativeTimeFormat für korrekte deutsche Lokalisierung
 */
export const formatRelativeTime = (timestamp: TimestampInput): string => {
  const date = parseTimestamp(timestamp);
  if (!date) return 'Unbekannt';

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat('de', { numeric: 'auto' });

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day');

  // Bei großen Zeitspannen: Normales Datum zurückgeben
  return formatDate(timestamp);
};

/**
 * Smart Date: "Heute, 14:30" / "Gestern, 09:15" / normales Datum
 *
 * Zeigt "Heute" und "Gestern" mit Uhrzeit, ansonsten volles Datum mit Zeit
 */
export const formatSmartDate = (timestamp: TimestampInput): string => {
  const date = parseTimestamp(timestamp);
  if (!date) return 'Unbekannt';

  const now = new Date();
  const isTodayCheck = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  });

  if (isTodayCheck) return `Heute, ${timeStr}`;
  if (isYesterday) return `Gestern, ${timeStr}`;

  return formatDateTime(timestamp);
};

/**
 * Prüft ob Datum in der Vergangenheit liegt
 */
export const isPast = (timestamp: TimestampInput): boolean => {
  const date = parseTimestamp(timestamp);
  if (!date) return false;
  return date.getTime() < Date.now();
};

/**
 * Prüft ob Datum heute ist
 */
export const isToday = (timestamp: TimestampInput): boolean => {
  const date = parseTimestamp(timestamp);
  if (!date) return false;
  return date.toDateString() === new Date().toDateString();
};

/**
 * Berechnet Differenz in Tagen zwischen zwei Zeitstempeln
 */
export const daysDifference = (timestamp1: TimestampInput, timestamp2: TimestampInput = new Date()): number | null => {
  const date1 = parseTimestamp(timestamp1);
  const date2 = parseTimestamp(timestamp2);
  if (!date1 || !date2) return null;

  const diffTime = date2.getTime() - date1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Datumsbereich-Filter Typen
 */
export type DateRangeFilterType = 'alle' | 'heute' | '7tage' | '30tage' | '90tage' | 'jahr' | 'woche' | 'monat';

/**
 * Filtert nach Datumsbereich
 *
 * @param date - Das zu prüfende Datum
 * @param range - Der Zeitraum-Filter
 * @returns true wenn das Datum im Bereich liegt
 *
 * @example
 * filterByDateRange(someDate, '7tage') // true wenn innerhalb 7 Tage
 */
export const filterByDateRange = (date: TimestampInput, range: DateRangeFilterType): boolean => {
  if (!date || range === 'alle') return true;

  const parsedDate = parseTimestamp(date);
  if (!parsedDate || isNaN(parsedDate.getTime())) return false;

  const now = new Date();
  const diffTime = Math.abs(now.getTime() - parsedDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  switch (range) {
    case 'heute':
      return parsedDate.toDateString() === now.toDateString();
    case 'woche':
    case '7tage':
      return diffDays <= 7;
    case 'monat':
    case '30tage':
      return diffDays <= 30;
    case '90tage':
      return diffDays <= 90;
    case 'jahr':
      return diffDays <= 365;
    default:
      return true;
  }
};
