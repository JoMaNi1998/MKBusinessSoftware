import { useState, useCallback, useRef } from 'react';
import type { CRUDResult, BatchOperation, BatchResult } from '../types';

/**
 * Return Type für useFirebaseCRUD Hook
 */
export interface UseFirebaseCRUDReturn {
  execute: <T = unknown>(operation: (...args: unknown[]) => Promise<unknown>, ...args: unknown[]) => Promise<CRUDResult<T>>;
  executeBatch: (operations: BatchOperation[]) => Promise<BatchResult>;
  executeBatchParallel: (operations: BatchOperation[]) => Promise<BatchResult>;
  loading: boolean;
  error: string | null;
  reset: () => void;
  setLoading: (state: boolean) => void;
  cancel: () => void;
}

/**
 * Custom Hook für standardisierte Firebase CRUD-Operationen
 *
 * Bietet konsistente Error-Handling und Rückgabewerte für alle CRUD-Operationen.
 * Unterstützt AbortController für Abbrechen von Operationen.
 *
 * Rückgabewert ist immer: { success: boolean, error?: string, ...additionalData }
 *
 * @returns Hook-Return mit execute, executeBatch, executeBatchParallel, loading, error, reset, cancel
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
 * // Abbrechen
 * crud.cancel();
 *
 * // Parallel batch
 * const parallelResult = await crud.executeBatchParallel([
 *   { operation: CustomerService.addCustomer, args: [data1] },
 *   { operation: CustomerService.addCustomer, args: [data2] }
 * ]);
 */
export function useFirebaseCRUD(): UseFirebaseCRUDReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ NEU: AbortController für Operationen
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Führt eine Firebase-Operation aus mit standardisierter Error-Handling
   *
   * @param operation - Die auszuführende Firebase-Funktion
   * @param args - Argumente für die Operation
   * @returns Promise mit CRUDResult
   */
  const execute = useCallback(async <T = unknown>(
    operation: (...args: unknown[]) => Promise<unknown>,
    ...args: unknown[]
  ): Promise<CRUDResult<T>> => {
    // ✅ NEU: AbortController erstellen
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setLoading(true);
      setError(null);

      // ✅ Check if already aborted before starting
      if (signal.aborted) {
        throw new Error('Operation cancelled');
      }

      const result = await operation(...args);

      // ✅ Check if aborted after operation
      if (signal.aborted) {
        throw new Error('Operation cancelled');
      }

      // Wenn result ein Objekt ist, spread es in die Rückgabe
      // Ansonsten gib nur success: true zurück
      if (result && typeof result === 'object') {
        return { success: true, ...result } as CRUDResult<T>;
      }

      return { success: true, result } as CRUDResult<T>;
    } catch (err) {
      // ✅ Unterscheide zwischen Abbruch und echtem Fehler
      if ((err as Error).message === 'Operation cancelled') {
        console.log('Firebase CRUD operation cancelled');
        return { success: false, error: 'Operation abgebrochen', cancelled: true };
      }

      console.error('Firebase CRUD error:', err);
      const errorMessage = (err as Error).message || 'Ein unbekannter Fehler ist aufgetreten';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Führt mehrere Operationen sequentiell aus
   *
   * @param operations - Array von Operationen
   * @returns Promise mit BatchResult
   */
  const executeBatch = useCallback(async (operations: BatchOperation[]): Promise<BatchResult> => {
    // ✅ NEU: AbortController für Batch
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setLoading(true);
      setError(null);

      const results: Array<{ index: number; result: unknown }> = [];
      for (let i = 0; i < operations.length; i++) {
        const { operation, args = [] } = operations[i];

        // ✅ Check if aborted
        if (signal.aborted) {
          throw new Error('Batch operation cancelled');
        }

        const result = await operation(...args);
        results.push({ index: i, result });
      }

      return { success: true, results, errors: [] };
    } catch (err) {
      // ✅ Unterscheide zwischen Abbruch und echtem Fehler
      if ((err as Error).message === 'Batch operation cancelled') {
        console.log('Firebase batch CRUD operation cancelled');
        return {
          success: false,
          results: [],
          errors: [{ index: 0, error: 'Batch-Operation abgebrochen' }]
        };
      }

      console.error('Firebase batch CRUD error:', err);
      const errorMessage = (err as Error).message || 'Ein Fehler ist bei der Batch-Operation aufgetreten';
      setError(errorMessage);
      return {
        success: false,
        results: [],
        errors: [{ index: 0, error: errorMessage }]
      };
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * ✅ NEU: Führt mehrere Operationen parallel aus (Promise.all)
   *
   * @param operations - Array von Operationen
   * @returns Promise mit BatchResult
   */
  const executeBatchParallel = useCallback(async (operations: BatchOperation[]): Promise<BatchResult> => {
    // ✅ AbortController für Parallel Batch
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setLoading(true);
      setError(null);

      // ✅ Check if aborted before starting
      if (signal.aborted) {
        throw new Error('Parallel batch operation cancelled');
      }

      // ✅ Führe alle Operationen parallel aus
      const promises = operations.map(({ operation, args = [] }) => operation(...args));
      const results = await Promise.all(promises);

      // ✅ Check if aborted after completion
      if (signal.aborted) {
        throw new Error('Parallel batch operation cancelled');
      }

      return {
        success: true,
        results: results.map((result, index) => ({ index, result })),
        errors: []
      };
    } catch (err) {
      // ✅ Unterscheide zwischen Abbruch und echtem Fehler
      if ((err as Error).message === 'Parallel batch operation cancelled') {
        console.log('Firebase parallel batch CRUD operation cancelled');
        return {
          success: false,
          results: [],
          errors: [{ index: 0, error: 'Parallele Batch-Operation abgebrochen' }]
        };
      }

      console.error('Firebase parallel batch CRUD error:', err);
      const errorMessage = (err as Error).message || 'Ein Fehler ist bei der parallelen Batch-Operation aufgetreten';
      setError(errorMessage);
      return {
        success: false,
        results: [],
        errors: [{ index: 0, error: errorMessage }]
      };
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * ✅ NEU: Bricht die aktuell laufende Operation ab
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('Cancelling Firebase CRUD operation');
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
  const setLoadingState = useCallback((state: boolean) => {
    setLoading(state);
  }, []);

  return {
    execute,
    executeBatch,
    executeBatchParallel, // ✅ NEU
    loading,
    error,
    reset,
    setLoading: setLoadingState,
    cancel // ✅ NEU
  };
}

export default useFirebaseCRUD;
