import { doc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Counter Types
 */
export type CounterType = 'offers' | 'invoices' | 'configurations';

/**
 * Number Prefixes
 */
export type NumberPrefix = 'ANG' | 'RE' | 'KONF';

/**
 * Counter Status Interface
 */
export interface CounterStatus {
  currentYear: number;
  lastNumber: number;
  updatedAt?: Timestamp;
}

/**
 * CounterService - Atomare Nummern-Generierung für Angebote, Rechnungen, etc.
 *
 * Verwendet Firestore Transactions um Race Conditions zu vermeiden.
 * Ersetzt das ineffiziente Laden aller Dokumente nur um die nächste Nummer zu finden.
 */
export class CounterService {
  /**
   * Generiert die nächste Nummer atomar (race-condition safe)
   *
   * @param type - Collection-Typ: 'offers' | 'invoices' | 'configurations'
   * @param prefix - Nummern-Prefix: 'ANG' | 'RE' | 'KONF'
   * @returns Formatierte Nummer z.B. "ANG-2025-0043"
   *
   * @example
   * const offerNumber = await CounterService.getNextNumber('offers', 'ANG');
   * // => "ANG-2025-0043"
   */
  static async getNextNumber(type: CounterType, prefix: NumberPrefix): Promise<string> {
    const counterRef = doc(db, 'counters', type);
    const currentYear = new Date().getFullYear();

    try {
      const newNumber = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);

        let nextNum = 1;

        if (counterDoc.exists()) {
          const data = counterDoc.data();

          // Jahr gewechselt? Reset auf 1
          if (data.currentYear === currentYear) {
            nextNum = (data.lastNumber || 0) + 1;
          }
          // Sonst beginnt neues Jahr mit 1
        }

        // Counter aktualisieren (atomar!)
        transaction.set(counterRef, {
          currentYear,
          lastNumber: nextNum,
          updatedAt: serverTimestamp()
        });

        return nextNum;
      });

      // Format: ANG-2025-0043
      return `${prefix}-${currentYear}-${String(newNumber).padStart(4, '0')}`;

    } catch (error) {
      console.error(`Fehler bei Nummern-Generierung (${type}):`, error);

      // Fallback: Timestamp-basierte Nummer (sollte nie passieren)
      const timestamp = Date.now().toString().slice(-6);
      return `${prefix}-${currentYear}-ERR${timestamp}`;
    }
  }

  /**
   * Initialisiert einen Counter mit einem Startwert
   * Nützlich für Migration von bestehenden Daten
   *
   * @param type - Counter-Typ
   * @param startNumber - Start-Nummer
   * @param year - Jahr (optional, Standard: aktuelles Jahr)
   */
  static async initializeCounter(
    type: CounterType,
    startNumber: number = 0,
    year: number | null = null
  ): Promise<void> {
    const counterRef = doc(db, 'counters', type);
    const currentYear = year || new Date().getFullYear();

    try {
      await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);

        // Nur setzen wenn Counter noch nicht existiert
        if (!counterDoc.exists()) {
          transaction.set(counterRef, {
            currentYear,
            lastNumber: startNumber,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } else {
          console.warn(`Counter '${type}' existiert bereits. Überspringe Initialisierung.`);
        }
      });

      console.log(`Counter '${type}' initialisiert: Jahr ${currentYear}, Start ${startNumber}`);
    } catch (error) {
      console.error(`Fehler bei Counter-Initialisierung (${type}):`, error);
      throw error;
    }
  }

  /**
   * Setzt einen Counter zurück (z.B. für Jahreswechsel oder Tests)
   *
   * @param type - Counter-Typ
   * @param newNumber - Neue Nummer
   * @param year - Jahr
   */
  static async resetCounter(
    type: CounterType,
    newNumber: number = 0,
    year: number | null = null
  ): Promise<void> {
    const counterRef = doc(db, 'counters', type);
    const currentYear = year || new Date().getFullYear();

    try {
      await runTransaction(db, async (transaction) => {
        transaction.set(counterRef, {
          currentYear,
          lastNumber: newNumber,
          updatedAt: serverTimestamp()
        }, { merge: true });
      });

      console.log(`Counter '${type}' zurückgesetzt: Jahr ${currentYear}, Nummer ${newNumber}`);
    } catch (error) {
      console.error(`Fehler beim Counter-Reset (${type}):`, error);
      throw error;
    }
  }

  /**
   * Liest den aktuellen Counter-Stand (für Debugging/Monitoring)
   *
   * @param type - Counter-Typ
   * @returns Counter-Status oder null falls nicht vorhanden
   */
  static async getCounterStatus(type: CounterType): Promise<CounterStatus | null> {
    const counterRef = doc(db, 'counters', type);

    try {
      const counterDoc = await runTransaction(db, async (transaction) => {
        return await transaction.get(counterRef);
      });

      if (counterDoc.exists()) {
        const data = counterDoc.data();
        return {
          currentYear: data.currentYear,
          lastNumber: data.lastNumber,
          updatedAt: data.updatedAt
        };
      }

      return null;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Counter-Status (${type}):`, error);
      throw error;
    }
  }
}

export default CounterService;
