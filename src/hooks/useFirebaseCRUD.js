import { useState, useCallback } from 'react';

/**
 * Custom Hook für standardisierte Firebase CRUD-Operationen
 *
 * Bietet konsistente Error-Handling und Rückgabewerte für alle CRUD-Operationen.
 *
 * Rückgabewert ist immer: { success: boolean, error?: string, ...additionalData }
 *
 * @returns {{ execute: Function, loading: boolean, error: string|null, reset: Function }}
 *
 * @example
 * const crud = useFirebaseCRUD();
 *
 * // Hinzufügen
 * const result = await crud.execute(CustomerService.addCustomer, customerData);
 * if (result.success) {
 *   console.log('Kunde erstellt:', result.id);
 * }
 *
 * // Aktualisieren
 * const updateResult = await crud.execute(CustomerService.updateCustomer, id, data);
 *
 * // Löschen
 * const deleteResult = await crud.execute(CustomerService.deleteCustomer, id);
 */
export function useFirebaseCRUD() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Führt eine Firebase-Operation aus mit standardisierter Error-Handling
   *
   * @param {Function} operation - Die auszuführende Firebase-Funktion
   * @param {...any} args - Argumente für die Operation
   * @returns {Promise<{ success: boolean, error?: string, [key: string]: any }>}
   */
  const execute = useCallback(async (operation, ...args) => {
    try {
      setLoading(true);
      setError(null);

      const result = await operation(...args);

      // Wenn result ein Objekt ist, spread es in die Rückgabe
      // Ansonsten gib nur success: true zurück
      if (result && typeof result === 'object') {
        return { success: true, ...result };
      }

      return { success: true, result };
    } catch (err) {
      console.error('Firebase CRUD error:', err);
      const errorMessage = err.message || 'Ein unbekannter Fehler ist aufgetreten';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Führt mehrere Operationen sequentiell aus
   *
   * @param {Array<{ operation: Function, args: Array }>} operations
   * @returns {Promise<{ success: boolean, results: Array, error?: string }>}
   */
  const executeBatch = useCallback(async (operations) => {
    try {
      setLoading(true);
      setError(null);

      const results = [];
      for (const { operation, args = [] } of operations) {
        const result = await operation(...args);
        results.push(result);
      }

      return { success: true, results };
    } catch (err) {
      console.error('Firebase batch CRUD error:', err);
      const errorMessage = err.message || 'Ein Fehler ist bei der Batch-Operation aufgetreten';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Setzt den Error-State zurück
   */
  const reset = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Setzt Loading-State manuell (für komplexe Flows)
   */
  const setLoadingState = useCallback((state) => {
    setLoading(state);
  }, []);

  return {
    execute,
    executeBatch,
    loading,
    error,
    reset,
    setLoading: setLoadingState
  };
}

export default useFirebaseCRUD;
