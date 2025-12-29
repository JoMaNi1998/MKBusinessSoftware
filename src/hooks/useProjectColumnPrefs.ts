import { useState, useEffect, useCallback } from 'react';
import { FirebaseService } from '@services/firebaseService';
import { DEFAULT_PROJECT_COLUMNS } from '@utils/projectHelpers';
import type { ProjectVisibleColumns, UseProjectColumnPrefsReturn } from '@app-types/components/project.types';

/**
 * Hook für Project-Spalten-Präferenzen
 * Speichert und lädt Einstellungen aus Firebase
 */
export const useProjectColumnPrefs = (preferencesType: string = 'projectColumns'): UseProjectColumnPrefsReturn => {
  const [visibleColumns, setVisibleColumns] = useState<ProjectVisibleColumns>(DEFAULT_PROJECT_COLUMNS);
  const [loading, setLoading] = useState<boolean>(true);

  // Präferenzen laden
  const loadPreferences = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const preferences = await FirebaseService.getDocuments('user-preferences');
      const columnPrefs = preferences.find((pref: any) => pref.type === preferencesType);

      if (columnPrefs && columnPrefs.columns) {
        setVisibleColumns(columnPrefs.columns);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Spalteneinstellungen:', error);
    } finally {
      setLoading(false);
    }
  }, [preferencesType]);

  // Präferenzen speichern
  const savePreferences = useCallback(async (columns: ProjectVisibleColumns): Promise<void> => {
    try {
      const preferences = await FirebaseService.getDocuments('user-preferences');
      const existingPref = preferences.find((pref: any) => pref.type === preferencesType);

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

  // Spalte umschalten
  const toggleColumn = useCallback(async (columnKey: string): Promise<void> => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey]
    };
    setVisibleColumns(newVisibleColumns);
    await savePreferences(newVisibleColumns);
  }, [visibleColumns, savePreferences]);

  // Prüfen ob Spalte sichtbar ist
  const isColumnVisible = useCallback((columnKey: string): boolean => {
    return visibleColumns[columnKey] ?? false;
  }, [visibleColumns]);

  // Präferenzen beim Mount laden
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

export default useProjectColumnPrefs;
