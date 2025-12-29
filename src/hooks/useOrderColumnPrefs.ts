import { useState, useEffect, useCallback } from 'react';
import { FirebaseService } from '@services/firebaseService';
import { ORDER_COLUMNS, DEFAULT_ORDER_COLUMNS } from '@utils/orderHelpers';
import type { VisibleColumns, UseOrderColumnPrefsReturn } from '@app-types/components/order.types';

/**
 * Hook für Order-Spalten-Präferenzen
 * Speichert und lädt Einstellungen aus Firebase
 */
export const useOrderColumnPrefs = (): UseOrderColumnPrefsReturn => {
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(DEFAULT_ORDER_COLUMNS);
  const [loading, setLoading] = useState<boolean>(true);

  // Laden der Präferenzen
  useEffect(() => {
    const loadPreferences = async (): Promise<void> => {
      try {
        setLoading(true);
        const preferences = await FirebaseService.getDocuments('user-preferences');
        const columnPrefs = preferences.find((pref: any) => pref.type === 'orderColumns');

        if (columnPrefs && columnPrefs.columns) {
          setVisibleColumns(prev => ({
            ...prev,
            ...columnPrefs.columns
          }));
        }
      } catch (error) {
        console.error('Fehler beim Laden der Spalteneinstellungen:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Speichern der Präferenzen
  const savePreferences = useCallback(async (columns: VisibleColumns): Promise<void> => {
    try {
      const preferences = await FirebaseService.getDocuments('user-preferences');
      const existingPref = preferences.find((pref: any) => pref.type === 'orderColumns');

      const prefData = {
        type: 'orderColumns',
        columns: columns,
        updatedAt: new Date()
      };

      if (existingPref) {
        await FirebaseService.updateDocument('user-preferences', existingPref.id, prefData);
      } else {
        await FirebaseService.addDocument('user-preferences', {
          ...prefData,
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Spalteneinstellungen:', error);
    }
  }, []);

  // Spalte umschalten
  const toggleColumn = useCallback(async (columnKey: string): Promise<void> => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey]
    };
    setVisibleColumns(newVisibleColumns);
    await savePreferences(newVisibleColumns);
  }, [visibleColumns, savePreferences]);

  return {
    visibleColumns,
    loading,
    toggleColumn,
    availableColumns: ORDER_COLUMNS
  };
};

export default useOrderColumnPrefs;
