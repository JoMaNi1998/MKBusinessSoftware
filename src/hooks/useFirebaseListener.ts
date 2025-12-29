import { useState, useEffect, useCallback, useRef } from 'react';
import type { UseFirebaseListenerOptions, UseFirebaseListenerReturn } from '../types';

/**
 * Firebase Subscribe Function Type
 * Nimmt einen Callback entgegen und gibt eine Unsubscribe-Funktion zurück
 */
export type SubscribeFunction<T> = (callback: (data: T[]) => void) => (() => void);

/**
 * Custom Hook für Firebase Real-time Listener
 *
 * Ersetzt das wiederholende Pattern:
 * - useEffect mit unsubscribe
 * - try/catch für Fehlerbehandlung
 * - Loading/Error States
 * - Retry Logic mit exponential backoff
 *
 * @param subscribeFn - Firebase subscribe Funktion (z.B. CustomerService.subscribeToCustomers)
 * @param options - Konfiguration
 * @returns Hook-Return mit data, loading, error, setData, clearError, refresh
 *
 * @example
 * const { data: customers, loading, error, refresh } = useFirebaseListener(
 *   CustomerService.subscribeToCustomers,
 *   { enabled: true, maxRetries: 3 }
 * );
 */
export function useFirebaseListener<T>(
  subscribeFn: SubscribeFunction<T>,
  options: UseFirebaseListenerOptions = {}
): UseFirebaseListenerReturn<T> {
  const {
    enabled = true,
    maxRetries = 3,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // ✅ useRef um subscribeFn stabil zu halten und eslint-warnings zu vermeiden
  const subscribeFnRef = useRef<SubscribeFunction<T>>(subscribeFn);
  useEffect(() => {
    subscribeFnRef.current = subscribeFn;
  }, [subscribeFn]);

  // ✅ NEU: Refresh Funktion für manuelles Neuladen
  const refresh = useCallback(() => {
    setRetryCount(0);
    setLoading(true);
    setError(null);
  }, []);

  useEffect(() => {
    // ✅ NEU: Listener nicht starten wenn disabled
    if (!enabled) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let isMounted = true;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;

    const setupListener = async () => {
      try {
        setLoading(true);
        setError(null);

        unsubscribe = subscribeFnRef.current((newData) => {
          if (isMounted) {
            setData(newData);
            setLoading(false);
            setRetryCount(0); // Reset retry count on success
          }
        });
      } catch (err) {
        console.error('Firebase listener error:', err);
        if (isMounted) {
          setError((err as Error).message);
          setLoading(false);

          // ✅ NEU: Retry Logic mit exponential backoff
          if (retryCount < maxRetries) {
            const delay = retryDelay * Math.pow(2, retryCount);
            console.log(`Retrying Firebase listener in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);

            retryTimeout = setTimeout(() => {
              if (isMounted) {
                setRetryCount(prev => prev + 1);
              }
            }, delay);
          } else {
            console.error(`Max retries (${maxRetries}) reached for Firebase listener. Giving up.`);
          }
        }
      }
    };

    setupListener();

    return () => {
      isMounted = false;
      clearTimeout(retryTimeout);
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [enabled, retryCount, maxRetries, retryDelay]);

  // Manuelle Aktualisierung des Datums (für optimistische Updates)
  const updateData = useCallback((updater: T[] | ((prev: T[]) => T[])) => {
    setData(prev => typeof updater === 'function' ? (updater as (prev: T[]) => T[])(prev) : updater);
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
    clearError,
    refresh // ✅ NEU: Refresh-Funktion
  };
}

export default useFirebaseListener;
