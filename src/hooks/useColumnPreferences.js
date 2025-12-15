import { useState, useEffect, useCallback } from 'react';
import { FirebaseService } from '../services/firebaseService';

const DEFAULT_VISIBLE_COLUMNS = {
  material: true,
  category: true,
  manufacturer: true,
  stock: true,
  price: true,
  status: true,
  ean: false,
  link: false,
  orderQuantity: false,
  unit: false,
  itemsPerUnit: false,
  type: false
};

export const AVAILABLE_COLUMNS = [
  { key: 'material', label: 'Material', required: true },
  { key: 'category', label: 'Kategorie', required: false },
  { key: 'manufacturer', label: 'Hersteller', required: false },
  { key: 'stock', label: 'Bestand', required: true },
  { key: 'price', label: 'Preis', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'ean', label: 'EAN', required: false },
  { key: 'link', label: 'Link', required: false },
  { key: 'orderQuantity', label: 'Bestellmenge', required: false },
  { key: 'itemsPerUnit', label: 'Stück pro Einheit', required: false },
  { key: 'type', label: 'Typ', required: false }
];

/**
 * Hook für Spalten-Einstellungen mit Firebase-Persistierung
 * @param {function} showNotification - Notification-Funktion für Fehlermeldungen
 */
export const useColumnPreferences = (showNotification) => {
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [loadingPreferences, setLoadingPreferences] = useState(true);

  const loadColumnPreferences = useCallback(async () => {
    try {
      setLoadingPreferences(true);
      const preferences = await FirebaseService.getDocuments('user-preferences');
      const columnPrefs = preferences.find(pref => pref.type === 'materialColumns');

      if (columnPrefs && columnPrefs.columns) {
        setVisibleColumns(columnPrefs.columns);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Spalteneinstellungen:', error);
    } finally {
      setLoadingPreferences(false);
    }
  }, []);

  const saveColumnPreferences = useCallback(async (columns) => {
    try {
      const preferences = await FirebaseService.getDocuments('user-preferences');
      const existingPref = preferences.find(pref => pref.type === 'materialColumns');

      const prefData = {
        type: 'materialColumns',
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
      showNotification?.('Fehler beim Speichern der Spalteneinstellungen', 'error');
    }
  }, [showNotification]);

  const toggleColumn = useCallback(async (columnKey) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey]
    };
    setVisibleColumns(newVisibleColumns);
    await saveColumnPreferences(newVisibleColumns);
  }, [visibleColumns, saveColumnPreferences]);

  useEffect(() => {
    loadColumnPreferences();
  }, [loadColumnPreferences]);

  return {
    visibleColumns,
    loadingPreferences,
    toggleColumn,
    availableColumns: AVAILABLE_COLUMNS
  };
};

export default useColumnPreferences;
