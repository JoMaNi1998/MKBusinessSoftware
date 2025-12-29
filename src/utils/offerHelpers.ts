/**
 * Offer Helpers
 *
 * Zentrale Hilfsfunktionen und Konstanten für Offer-Komponenten
 */

import { OFFER_STATUS_LABELS } from '@context/OfferContext';
import type { OfferColumnConfig, OfferVisibleColumns, WizardStep } from '@app-types/components/offer.types';

// ============================================
// SPALTEN-KONFIGURATION
// ============================================

/**
 * Verfügbare Spalten für OfferManagement
 */
export const OFFER_COLUMNS: OfferColumnConfig[] = [
  { key: 'angebot', label: 'Angebot', required: true },
  { key: 'kunde', label: 'Kunde', required: false },
  { key: 'projekt', label: 'Projekt', required: false },
  { key: 'betrag', label: 'Betrag', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'datum', label: 'Datum', required: false },
  { key: 'aktionen', label: 'Aktionen', required: true }
];

/**
 * Default sichtbare Spalten
 */
export const DEFAULT_OFFER_COLUMNS: OfferVisibleColumns = {
  angebot: true,
  kunde: true,
  projekt: true,
  betrag: true,
  status: true,
  datum: true,
  aktionen: true
};

// ============================================
// WIZARD KONFIGURATION
// ============================================

/**
 * Wizard Steps Konfiguration
 */
export const OFFER_WIZARD_STEPS: WizardStep[] = [
  { id: 0, title: 'Kunde', icon: 'Users' },
  { id: 1, title: 'Leistungen', icon: 'Package' },
  { id: 2, title: 'Positionen', icon: 'Edit' },
  { id: 3, title: 'Zusammenfassung', icon: 'Eye' }
];

// ============================================
// ARBEITSZEITFAKTOR LABELS
// ============================================

/**
 * Arbeitszeitfaktor Labels
 */
export const LABOR_FACTOR_LABELS: Record<string, string> = {
  dach: 'Dach',
  elektro: 'Elektro',
  geruest: 'Gerüst & Logistik'
};

// ============================================
// KATEGORIE-ICONS
// ============================================

/**
 * Kategorie-Icons Mapping (Lucide Icon Namen)
 */
export const CATEGORY_ICON_NAMES: Record<string, string> = {
  'pv-montage': 'Sun',
  wechselrichter: 'Zap',
  speicher: 'Battery',
  wallbox: 'Car',
  notstrom: 'Power',
  optimierer: 'Target',
  energiemanagement: 'Cpu',
  elektroinstallation: 'Plug',
  planung: 'FileText',
  geruest: 'Truck',
  erdungsanlage: 'MoreHorizontal'
};

// ============================================
// STATUS HELPER FUNCTIONS
// ============================================

/**
 * Status-Badge Klassen ermitteln
 *
 * @param status - Offer-Status
 * @returns Tailwind CSS Klassen für das Status-Badge
 */
export const getOfferStatusColorClasses = (status: string): string => {
  const statusInfo = (OFFER_STATUS_LABELS as Record<string, { label: string; color: string }>)[status] || { color: 'gray' };
  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700'
  };
  return colorClasses[statusInfo.color] || colorClasses.gray;
};

/**
 * Status-Label ermitteln
 *
 * @param status - Offer-Status
 * @returns Anzeigetext für den Status
 */
export const getOfferStatusLabel = (status: string): string => {
  return (OFFER_STATUS_LABELS as Record<string, { label: string; color: string }>)[status]?.label || status;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Prüft ob eine Spalte erforderlich ist
 *
 * @param columnKey - Schlüssel der Spalte
 * @returns true wenn die Spalte erforderlich ist
 */
export const isOfferColumnRequired = (columnKey: string): boolean => {
  const column = OFFER_COLUMNS.find(c => c.key === columnKey);
  return column?.required ?? false;
};

/**
 * Merged gespeicherte Preferences mit Defaults
 *
 * @param savedPrefs - Gespeicherte Preferences (kann unvollständig sein)
 * @returns Vollständige Spalteneinstellungen
 */
export const mergeOfferColumnPreferences = (
  savedPrefs: Partial<OfferVisibleColumns> | null | undefined
): OfferVisibleColumns => {
  if (!savedPrefs) {
    return { ...DEFAULT_OFFER_COLUMNS };
  }

  // Filter out undefined values to satisfy index signature
  const filteredPrefs: OfferVisibleColumns = { ...DEFAULT_OFFER_COLUMNS };
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
export const toggleOfferColumn = (
  currentColumns: OfferVisibleColumns,
  columnKey: string
): OfferVisibleColumns => {
  if (isOfferColumnRequired(columnKey)) {
    return currentColumns;
  }

  return {
    ...currentColumns,
    [columnKey]: !currentColumns[columnKey]
  };
};

/**
 * Bestimmt die Kategorie-zu-Arbeitszeitfaktor-Zuordnung
 *
 * @param categoryId - Kategorie-ID
 * @returns Arbeitszeitfaktor-Typ oder null
 */
export const getCategoryLaborFactorType = (categoryId: string): 'dach' | 'elektro' | 'geruest' | null => {
  if (categoryId === 'pv-montage' || categoryId === 'optimierer') {
    return 'dach';
  }
  if (['elektroinstallation', 'wechselrichter', 'speicher', 'wallbox', 'notstrom', 'energiemanagement', 'erdungsanlage'].includes(categoryId)) {
    return 'elektro';
  }
  if (categoryId === 'geruest') {
    return 'geruest';
  }
  return null;
};
