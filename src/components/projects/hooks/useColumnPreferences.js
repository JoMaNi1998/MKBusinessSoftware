import { useState, useEffect, useCallback } from 'react';
import { FirebaseService } from '../../../services/firebaseService';
import { DEFAULT_VISIBLE_COLUMNS } from '../constants';

/**
 * Hook for managing column visibility preferences with Firebase persistence
 */
export const useColumnPreferences = (preferencesType = 'projectColumns') => {
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [loading, setLoading] = useState(true);

  // Load preferences from Firebase
  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const preferences = await FirebaseService.getDocuments('user-preferences');
      const columnPrefs = preferences.find(pref => pref.type === preferencesType);

      if (columnPrefs && columnPrefs.columns) {
        setVisibleColumns(columnPrefs.columns);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Spalteneinstellungen:', error);
    } finally {
      setLoading(false);
    }
  }, [preferencesType]);

  // Save preferences to Firebase
  const savePreferences = useCallback(async (columns) => {
    try {
      const preferences = await FirebaseService.getDocuments('user-preferences');
      const existingPref = preferences.find(pref => pref.type === preferencesType);

      const prefData = {
        type: preferencesType,
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
      throw error;
    }
  }, [preferencesType]);

  // Toggle column visibility
  const toggleColumn = useCallback(async (columnKey) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey]
    };
    setVisibleColumns(newVisibleColumns);
    await savePreferences(newVisibleColumns);
  }, [visibleColumns, savePreferences]);

  // Check if column is visible
  const isColumnVisible = useCallback((columnKey) => {
    return visibleColumns[columnKey] ?? false;
  }, [visibleColumns]);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    visibleColumns,
    loading,
    toggleColumn,
    isColumnVisible,
    reloadPreferences: loadPreferences
  };
};

export default useColumnPreferences;
