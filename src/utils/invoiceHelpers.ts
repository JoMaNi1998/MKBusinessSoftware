/**
 * Invoice Helpers
 *
 * Zentrale Hilfsfunktionen und Konstanten für Invoice-Komponenten
 */

import type { InvoiceColumnConfig, InvoiceVisibleColumns } from '@app-types/components/invoice.types';

// ============================================
// SPALTEN-KONFIGURATION
// ============================================

/**
 * Verfügbare Spalten für die Invoice-Tabelle
 */
export const INVOICE_AVAILABLE_COLUMNS: InvoiceColumnConfig[] = [
  { key: 'rechnung', label: 'Rechnung', required: true },
  { key: 'kunde', label: 'Kunde', required: false },
  { key: 'angebot', label: 'Angebot', required: false },
  { key: 'betrag', label: 'Betrag', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'faellig', label: 'Fällig am', required: false },
  { key: 'aktionen', label: 'Aktionen', required: true }
];

/**
 * Standard-Spalteneinstellungen für Invoices
 */
export const DEFAULT_INVOICE_COLUMNS: InvoiceVisibleColumns = {
  rechnung: true,
  kunde: true,
  angebot: true,
  betrag: true,
  status: true,
  faellig: true,
  aktionen: true
};

// ============================================
// HELPER-FUNKTIONEN
// ============================================

/**
 * Prüft ob eine Spalte erforderlich ist
 *
 * @param columnKey - Schlüssel der Spalte
 * @returns true wenn die Spalte erforderlich ist
 */
export const isRequiredColumn = (columnKey: string): boolean => {
  const column = INVOICE_AVAILABLE_COLUMNS.find(c => c.key === columnKey);
  return column?.required ?? false;
};

/**
 * Gibt die Spalten-Konfiguration für einen Schlüssel zurück
 *
 * @param columnKey - Schlüssel der Spalte
 * @returns Spalten-Konfiguration oder undefined
 */
export const getColumnConfig = (columnKey: string): InvoiceColumnConfig | undefined => {
  return INVOICE_AVAILABLE_COLUMNS.find(c => c.key === columnKey);
};

/**
 * Erstellt eine Kopie der Spalteneinstellungen mit einer getoggelden Spalte
 *
 * @param currentColumns - Aktuelle Spalteneinstellungen
 * @param columnKey - Schlüssel der zu toggelnden Spalte
 * @returns Neue Spalteneinstellungen
 */
export const toggleInvoiceColumn = (
  currentColumns: InvoiceVisibleColumns,
  columnKey: string
): InvoiceVisibleColumns => {
  // Erforderliche Spalten können nicht getoggelt werden
  if (isRequiredColumn(columnKey)) {
    return currentColumns;
  }

  return {
    ...currentColumns,
    [columnKey]: !currentColumns[columnKey]
  };
};

/**
 * Merged gespeicherte Preferences mit Defaults
 *
 * @param savedPrefs - Gespeicherte Preferences (kann unvollständig sein)
 * @returns Vollständige Spalteneinstellungen
 */
export const mergeInvoiceColumnPreferences = (
  savedPrefs: Partial<InvoiceVisibleColumns> | null | undefined
): InvoiceVisibleColumns => {
  if (!savedPrefs) {
    return { ...DEFAULT_INVOICE_COLUMNS };
  }

  // Filter out undefined values to satisfy index signature
  const filteredPrefs: InvoiceVisibleColumns = { ...DEFAULT_INVOICE_COLUMNS };
  for (const [key, value] of Object.entries(savedPrefs)) {
    if (value !== undefined) {
      filteredPrefs[key] = value;
    }
  }
  return filteredPrefs;
};
