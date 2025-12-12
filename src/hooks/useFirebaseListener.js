import { useState, useEffect, useCallback } from 'react';

/**
 * Custom Hook für Firebase Real-time Listener
 *
 * Ersetzt das wiederholende Pattern:
 * - useEffect mit unsubscribe
 * - try/catch für Fehlerbehandlung
 * - Loading/Error States
 *
 * @param {Function} subscribeFn - Firebase subscribe Funktion (z.B. CustomerService.subscribeToCustomers)
 * @param {Array} deps - Dependency Array für useEffect (optional)
 * @returns {{ data: Array, loading: boolean, error: string|null, setData: Function }}
 *
 * @example
 * const { data: customers, loading, error } = useFirebaseListener(
 *   CustomerService.subscribeToCustomers
 * );
 */
export function useFirebaseListener(subscribeFn, deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;
    let isMounted = true;

    const setupListener = async () => {
      try {
        setLoading(true);
        setError(null);

        unsubscribe = subscribeFn((newData) => {
          if (isMounted) {
            setData(newData);
            setLoading(false);
          }
        });
      } catch (err) {
        console.error('Firebase listener error:', err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    setupListener();

    return () => {
      isMounted = false;
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Manuelle Aktualisierung des Datums (für optimistische Updates)
  const updateData = useCallback((updater) => {
    setData(prev => typeof updater === 'function' ? updater(prev) : updater);
  }, []);

  // Error zurücksetzen
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    setData: updateData,
    clearError
  };
}

export default useFirebaseListener;
