/**
 * Globale Datum-Utilities für Firebase Timestamp Support
 */

/**
 * Konvertiert verschiedene Timestamp-Formate zu einem Date-Objekt
 * Unterstützt: Date, String, Number, Firebase Timestamp
 */
export const parseTimestamp = (timestamp) => {
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
  if (timestamp.seconds !== undefined) {
    return new Date(timestamp.seconds * 1000);
  }

  // Firebase Timestamp mit toDate() Methode
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  // ServerTimestamp Platzhalter ignorieren (noch nicht aufgelöst)
  if (timestamp._methodName === 'serverTimestamp') {
    return null;
  }

  return null;
};

/**
 * Formatiert einen Timestamp als deutschen Datum-Zeit-String
 */
export const formatDateTime = (timestamp) => {
  if (!timestamp) return 'Unbekannt';

  // ServerTimestamp Platzhalter ignorieren
  if (timestamp && typeof timestamp === 'object' && timestamp._methodName === 'serverTimestamp') {
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
export const formatDate = (timestamp) => {
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
