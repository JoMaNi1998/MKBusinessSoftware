import { useState, useEffect, useCallback } from 'react';
import { FirebaseService } from '../../../services/firebaseService';

// Verfügbare Spalten für Bestellungen
export const ORDER_COLUMNS = [
  { key: 'material', label: 'Material', required: true },
  { key: 'stock', label: 'Bestand', required: false },
  { key: 'heatStock', label: 'Meldebestand', required: false },
  { key: 'itemsPerUnit', label: 'Stk/Einheit', required: false },
  { key: 'price', label: 'Preis', required: false },
  { key: 'orderQuantity', label: 'Bestellmenge', required: true },
  { key: 'status', label: 'Status', required: false },
  { key: 'link', label: 'Link', required: false },
  { key: 'actions', label: 'Aktionen', required: true }
];

const DEFAULT_VISIBLE = {
  material: true,
  stock: true,
  heatStock: true,
  itemsPerUnit: true,
  price: true,
  orderQuantity: true,
  status: true,
  link: true,
  actions: true
};

/**
 * Hook für Order-Spalten-Präferenzen
 * Speichert und lädt Einstellungen aus Firebase
 */
export const useOrderColumnPrefs = () => {
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE);
  const [loading, setLoading] = useState(true);

  // Laden der Präferenzen
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        const preferences = await FirebaseService.getDocuments('user-preferences');
        const columnPrefs = preferences.find(pref => pref.type === 'orderColumns');

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
  const savePreferences = useCallback(async (columns) => {
    try {
      const preferences = await FirebaseService.getDocuments('user-preferences');
      const existingPref = preferences.find(pref => pref.type === 'orderColumns');

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
  const toggleColumn = useCallback(async (columnKey) => {
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
