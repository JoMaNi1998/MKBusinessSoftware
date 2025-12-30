import { useState, useEffect, useCallback } from 'react';
import { FirebaseService } from '@services/firebaseService';
import { useNotification } from '@context/NotificationContext';
import { NotificationType } from '@app-types/enums';
import type { VDEProtocol, VDEData } from '@components/vde-protocols/VDEProtocolModal/types';

interface UseVDEEditReturn {
  protocol: VDEProtocol | null;
  vdeData: VDEData | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  updateField: (field: string, value: unknown) => void;
  saveProtocol: () => Promise<boolean>;
  hasChanges: boolean;
}

/**
 * useVDEEdit - Hook zum Laden und Speichern von VDE-Protokollen
 *
 * @param protocolId - Die ID des VDE-Protokolls
 */
export const useVDEEdit = (protocolId: string | undefined): UseVDEEditReturn => {
  const { showNotification } = useNotification();

  const [protocol, setProtocol] = useState<VDEProtocol | null>(null);
  const [vdeData, setVdeData] = useState<VDEData | null>(null);
  const [originalData, setOriginalData] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Protokoll laden
  useEffect(() => {
    const loadProtocol = async () => {
      if (!protocolId) {
        setLoading(false);
        setError('Keine Protokoll-ID angegeben');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const doc = await FirebaseService.getDocument('vde-protocols', protocolId);

        if (doc) {
          const loadedProtocol = doc as VDEProtocol;
          setProtocol(loadedProtocol);
          setVdeData(loadedProtocol.vdeData || {} as VDEData);
          setOriginalData(JSON.stringify(loadedProtocol.vdeData || {}));
        } else {
          setError('Protokoll nicht gefunden');
        }
      } catch (err) {
        console.error('Fehler beim Laden des VDE-Protokolls:', err);
        setError('Protokoll konnte nicht geladen werden');
        showNotification('Protokoll konnte nicht geladen werden', NotificationType.ERROR);
      } finally {
        setLoading(false);
      }
    };

    loadProtocol();
  }, [protocolId, showNotification]);

  // Einzelnes Feld aktualisieren
  const updateField = useCallback((field: string, value: unknown) => {
    setVdeData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value
      };
    });
  }, []);

  // Protokoll speichern
  const saveProtocol = useCallback(async (): Promise<boolean> => {
    if (!protocol || !vdeData || !protocolId) {
      showNotification('Keine Daten zum Speichern', NotificationType.ERROR);
      return false;
    }

    try {
      setSaving(true);

      await FirebaseService.updateDocument('vde-protocols', protocolId, {
        vdeData,
        updatedDate: new Date(),
        updatedAt: new Date()
      });

      // Original-Daten aktualisieren
      setOriginalData(JSON.stringify(vdeData));

      showNotification('Protokoll gespeichert', NotificationType.SUCCESS);
      return true;
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
      showNotification('Speichern fehlgeschlagen', NotificationType.ERROR);
      return false;
    } finally {
      setSaving(false);
    }
  }, [protocol, vdeData, protocolId, showNotification]);

  // Pruefen ob Aenderungen vorhanden
  const hasChanges = vdeData
    ? JSON.stringify(vdeData) !== originalData
    : false;

  return {
    protocol,
    vdeData,
    loading,
    saving,
    error,
    updateField,
    saveProtocol,
    hasChanges
  };
};

export default useVDEEdit;
