import { useState, useEffect, useCallback, useRef } from 'react';
import { FirebaseService } from '../services/firebaseService';
import { debounce } from '../utils/debounce';
import { NotificationType } from '../types/enums';

/**
 * Sichtbarkeit pro Spalte
 */
export interface VisibleColumns {
  material: boolean;
  category: boolean;
  manufacturer: boolean;
  stock: boolean;
  price: boolean;
  status: boolean;
  ean: boolean;
  link: boolean;
  orderQuantity: boolean;
  unit: boolean;
  itemsPerUnit: boolean;
  type: boolean;
  [key: string]: boolean;
}

/**
 * Spalten-Definition
 */
export interface ColumnDefinition {
  key: string;
  label: string;
  required: boolean;
}

const DEFAULT_VISIBLE_COLUMNS: VisibleColumns = {
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

export const AVAILABLE_COLUMNS: ColumnDefinition[] = [
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

const PREFS_DOC_ID = 'material-columns';

/**
 * Notification Function Type
 * Akzeptiert sowohl NotificationType enum als auch String-Literale für Kompatibilität
 */
export type ShowNotificationFn = (message: string, type?: NotificationType, duration?: number) => string | void;

/**
 * Return Type für useColumnPreferences Hook
 */
export interface UseColumnPreferencesReturn {
  visibleColumns: VisibleColumns;
  loadingPreferences: boolean;
  toggleColumn: (columnKey: string) => void;
  availableColumns: ColumnDefinition[];
}

/**
 * Hook für Spalten-Einstellungen mit Firebase-Persistierung
 *
 * OPTIMIERUNGEN:
 * - Direkter Document-Zugriff statt alle Preferences zu laden
 * - Debouncing (500ms) beim Speichern um Firebase-Writes zu reduzieren
 * - Rollback bei Fehlern
 * - userId-Support für user-spezifische Preferences
 *
 * @param showNotification - Notification-Funktion für Fehlermeldungen
 * @param userId - Optional: User-ID für user-spezifische Preferences
 * @returns Hook-Return mit visibleColumns, loadingPreferences, toggleColumn, availableColumns
 */
export const useColumnPreferences = (
  showNotification?: ShowNotificationFn,
  userId: string | null = null
): UseColumnPreferencesReturn => {
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(DEFAULT_VISIBLE_COLUMNS);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const pendingSaveRef = useRef<VisibleColumns | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced Save - wartet 500ms nach letzter Änderung
  const debouncedSave = useRef(
    debounce(async (columns: VisibleColumns) => {
      try {
        // Document-ID: falls userId vorhanden, user-spezifisch, sonst global
        const docId = userId ? `${PREFS_DOC_ID}-${userId}` : PREFS_DOC_ID;

        // DIREKT ein spezifisches Dokument laden (nicht alle!)
        const existing = await FirebaseService.getDocument('user-preferences', docId);

        const prefData = {
          type: 'materialColumns',
          columns: columns
        };

        if (existing) {
          // Dokument existiert → Update
          await FirebaseService.updateDocument('user-preferences', docId, prefData);
        } else {
          // Dokument existiert nicht → Create
          await FirebaseService.addDocument('user-preferences', {
            id: docId,
            ...prefData
          });
        }

        pendingSaveRef.current = null;
      } catch (error) {
        console.error('Fehler beim Speichern der Spalteneinstellungen:', error);
        showNotification?.('Fehler beim Speichern der Spalteneinstellungen', NotificationType.ERROR);

        // Rollback: Zurück zum letzten gespeicherten Zustand
        if (pendingSaveRef.current) {
          setVisibleColumns(pendingSaveRef.current);
          pendingSaveRef.current = null;
        }
      }
    }, 500)
  ).current;

  const loadColumnPreferences = useCallback(async () => {
    try {
      setLoadingPreferences(true);
      const docId = userId ? `${PREFS_DOC_ID}-${userId}` : PREFS_DOC_ID;

      // DIREKT ein Dokument laden - nicht alle!
      const prefs = await FirebaseService.getDocument('user-preferences', docId) as { columns?: VisibleColumns } | null;

      if (prefs?.columns) {
        setVisibleColumns(prefs.columns);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Spalteneinstellungen:', error);
      // Kein showNotification hier, da beim initialen Laden
      // Fehlende Preferences normal sind
    } finally {
      setLoadingPreferences(false);
    }
  }, [userId]);

  const toggleColumn = useCallback((columnKey: string) => {
    setVisibleColumns(prev => {
      // Alten Zustand für potentiellen Rollback speichern
      pendingSaveRef.current = prev;

      const newColumns = { ...prev, [columnKey]: !prev[columnKey] };

      // Debounced Save: Wird erst nach 500ms ohne weitere Änderungen ausgeführt
      debouncedSave(newColumns);

      return newColumns;
    });
  }, [debouncedSave]);

  useEffect(() => {
    loadColumnPreferences();

    // Cleanup: Timeout clearen beim Unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [loadColumnPreferences]);

  return {
    visibleColumns,
    loadingPreferences,
    toggleColumn,
    availableColumns: AVAILABLE_COLUMNS
  };
};

export default useColumnPreferences;
