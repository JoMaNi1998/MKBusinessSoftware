/**
 * Order Helpers
 *
 * Zentrale Hilfsfunktionen und Konstanten für Order-Komponenten
 */

import { formatPrice as baseFormatPrice } from './formatters';
import type { OrderMaterialDisplay, ColumnConfig, VisibleColumns } from '@app-types/components/order.types';

// ============================================
// SPALTEN-KONFIGURATION
// ============================================

/**
 * Verfügbare Spalten für OrderManagement
 */
export const ORDER_COLUMNS: ColumnConfig[] = [
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

/**
 * Default sichtbare Spalten
 */
export const DEFAULT_ORDER_COLUMNS: VisibleColumns = {
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

// ============================================
// STATUS FILTER
// ============================================

/**
 * Unique Status-Werte für Filter
 */
export const STATUS_FILTER_OPTIONS = ['alle', 'Angefordert', 'Bestellt', 'Nachbestellen', 'Niedrig'];

// ============================================
// FORMATTING FUNCTIONS
// ============================================

/**
 * Order-spezifische Preisformatierung (mit €)
 *
 * @param price - Preis als Zahl oder String
 * @returns Formatierter Preis mit € Symbol
 */
export const formatOrderPrice = (price: number | null | undefined | string): string => {
  if (price === null || price === undefined || price === '') return '-';
  const formatted = baseFormatPrice(price);
  return formatted || '-';
};

// ============================================
// STATUS HELPER FUNCTIONS
// ============================================

/**
 * Status-Farbe basierend auf displayType ermitteln
 *
 * @param material - Material mit displayType
 * @returns Tailwind CSS Klassen für das Status-Badge
 */
export const getOrderStatusColor = (material: OrderMaterialDisplay): string => {
  switch (material._displayType) {
    case 'ordered':
      return 'bg-blue-100 text-blue-800';
    case 'additional':
      return 'bg-red-100 text-red-800';
    case 'needed':
      return 'bg-red-100 text-red-800';
    case 'low':
      return 'bg-orange-100 text-orange-800';
    case 'requested':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Status-Text basierend auf displayType ermitteln
 *
 * @param material - Material mit displayType
 * @returns Anzeigetext für den Status
 */
export const getOrderStatusText = (material: OrderMaterialDisplay): string => {
  switch (material._displayType) {
    case 'ordered':
      return `Bestellt (${material._displayQuantity})`;
    case 'additional':
      return `Nachbestellen (${material._displayQuantity})`;
    case 'needed':
      return `Nachbestellen (${material._displayQuantity})`;
    case 'low':
      return 'Niedrig';
    case 'requested':
      return `Angefordert (${material._displayQuantity})`;
    default:
      return 'Auf Lager';
  }
};

// ============================================
// COLUMN HELPER FUNCTIONS
// ============================================

/**
 * Prüft ob eine Spalte erforderlich ist
 *
 * @param columnKey - Schlüssel der Spalte
 * @returns true wenn die Spalte erforderlich ist
 */
export const isOrderColumnRequired = (columnKey: string): boolean => {
  const column = ORDER_COLUMNS.find(c => c.key === columnKey);
  return column?.required ?? false;
};

/**
 * Merged gespeicherte Preferences mit Defaults
 *
 * @param savedPrefs - Gespeicherte Preferences (kann unvollständig sein)
 * @returns Vollständige Spalteneinstellungen
 */
export const mergeOrderColumnPreferences = (
  savedPrefs: Partial<VisibleColumns> | null | undefined
): VisibleColumns => {
  if (!savedPrefs) {
    return { ...DEFAULT_ORDER_COLUMNS };
  }

  // Filter out undefined values to satisfy index signature
  const filteredPrefs: VisibleColumns = { ...DEFAULT_ORDER_COLUMNS };
  for (const [key, value] of Object.entries(savedPrefs)) {
    if (value !== undefined) {
      filteredPrefs[key] = value;
    }
  }
  return filteredPrefs;
};

/**
 * Erstellt eine Kopie der Spalteneinstellungen mit einer getoggelden Spalte
 *
 * @param currentColumns - Aktuelle Spalteneinstellungen
 * @param columnKey - Schlüssel der zu toggelnden Spalte
 * @returns Neue Spalteneinstellungen
 */
export const toggleOrderColumn = (
  currentColumns: VisibleColumns,
  columnKey: string
): VisibleColumns => {
  if (isOrderColumnRequired(columnKey)) {
    return currentColumns;
  }

  return {
    ...currentColumns,
    [columnKey]: !currentColumns[columnKey]
  };
};
