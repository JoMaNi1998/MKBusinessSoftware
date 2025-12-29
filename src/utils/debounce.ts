/**
 * Debounce & Throttle Utilities
 *
 * Debounce: Verzögert Funktionsaufruf bis keine weiteren Aufrufe mehr kommen
 * Throttle: Führt Funktion maximal einmal pro Zeitraum aus
 */

/**
 * Debounced Funktion mit zusätzlichen Methoden
 */
export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: (...args: Parameters<T>) => void;
}

/**
 * Debounce - verzögert Funktionsaufruf bis keine weiteren Aufrufe kommen
 *
 * Nützlich für:
 * - Suche während Tippen (z.B. nach 300ms ohne weitere Eingabe)
 * - Window resize Events
 * - Auto-save nach Änderungen
 *
 * @param fn - Die zu verzögernde Funktion
 * @param delay - Verzögerung in ms
 * @returns Debounced Funktion mit .cancel() und .flush() Methoden
 *
 * @example
 * const search = debounce((query: string) => fetchResults(query), 300);
 * search('test'); // Wartet 300ms
 * search.cancel(); // Bricht wartenden Aufruf ab
 * search.flush('test'); // Führt sofort aus
 */
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): DebouncedFunction<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const debouncedFn = (...args: Parameters<T>): void => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };

  // Cancel-Methode: Bricht wartenden Aufruf ab
  debouncedFn.cancel = (): void => {
    clearTimeout(timeoutId);
  };

  // Flush-Methode: Führt sofort aus und setzt Timer zurück
  debouncedFn.flush = (...args: Parameters<T>): void => {
    clearTimeout(timeoutId);
    fn(...args);
  };

  return debouncedFn as DebouncedFunction<T>;
};

/**
 * Throttle - führt Funktion maximal einmal pro Zeitraum aus
 *
 * Nützlich für:
 * - Scroll Events (z.B. maximal alle 100ms)
 * - Mouse Move Events
 * - Button Clicks (Doppelklick-Schutz)
 *
 * @param fn - Die zu throttlende Funktion
 * @param limit - Minimaler Abstand zwischen Aufrufen in ms
 * @returns Throttled Funktion
 *
 * @example
 * const handleScroll = throttle(() => updateUI(), 100);
 * window.addEventListener('scroll', handleScroll);
 */
export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>): void => {
    if (!inThrottle) {
      // Erster Aufruf: Sofort ausführen
      fn(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;

        // Falls es weitere Aufrufe gab, führe den letzten aus
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      // Während Throttle: Speichere letzten Aufruf
      lastArgs = args;
    }
  };
};

// Default Export
// eslint-disable-next-line import/no-anonymous-default-export
export default { debounce, throttle };
