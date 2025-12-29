/**
 * Project Helpers
 *
 * Zentrale Hilfsfunktionen und Konstanten für Project-Komponenten
 */

import type { Customer, Project, Booking, ProjectStatus } from '@app-types';
import type { ExtendedBooking } from '@app-types/contexts/booking.types';
import type {
  ProjectStatusOption,
  VDEStatusOption,
  ProjectColumnConfig,
  ProjectVisibleColumns,
  ProjectColumnFilters,
  AddressParts,
  ProjectCosts
} from '@app-types/components/project.types';

// ============================================
// STATUS KONSTANTEN
// ============================================

/**
 * Projekt-Status-Optionen
 */
export const PROJECT_STATUS_OPTIONS: ProjectStatusOption[] = [
  { value: 'Aktiv', label: 'Aktiv', color: 'bg-green-100 text-green-800' },
  { value: 'Geplant', label: 'Geplant', color: 'bg-blue-100 text-blue-800' },
  { value: 'Pausiert', label: 'Pausiert', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Abgeschlossen', label: 'Abgeschlossen', color: 'bg-gray-100 text-gray-800' },
  { value: 'Storniert', label: 'Storniert', color: 'bg-red-100 text-red-800' }
];

/**
 * Projekt-Status-Optionen mit "Alle" Option
 */
export const PROJECT_STATUS_OPTIONS_WITH_ALL: ProjectStatusOption[] = [
  { value: 'alle', label: 'Alle Status', color: '' },
  ...PROJECT_STATUS_OPTIONS
];

/**
 * VDE-Protokoll-Status-Optionen
 */
export const VDE_STATUS_OPTIONS: VDEStatusOption[] = [
  { value: 'Erstellt', label: 'Erstellt', color: 'bg-blue-100 text-blue-800' },
  { value: 'Geprüft', label: 'Geprüft', color: 'bg-green-100 text-green-800' },
  { value: 'Abgeschlossen', label: 'Abgeschlossen', color: 'bg-gray-100 text-gray-800' }
];

// ============================================
// SPALTEN-KONFIGURATION
// ============================================

/**
 * Verfügbare Spalten für ProjectManagement
 */
export const PROJECT_COLUMNS: ProjectColumnConfig[] = [
  { key: 'name', label: 'Projekt', required: true },
  { key: 'customer', label: 'Kunde', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'address', label: 'Adresse', required: false },
  { key: 'description', label: 'Beschreibung', required: false }
];

/**
 * Default sichtbare Spalten
 */
export const DEFAULT_PROJECT_COLUMNS: ProjectVisibleColumns = {
  name: true,
  customer: true,
  status: true,
  address: false,
  description: false
};

/**
 * Default Spalten-Filter
 */
export const DEFAULT_PROJECT_FILTERS: ProjectColumnFilters = {
  status: 'alle',
  customer: 'alle'
};

// ============================================
// STATUS HELPER FUNCTIONS
// ============================================

/**
 * Projekt-Status-Farben ermitteln
 *
 * @param status - Projekt-Status
 * @returns Tailwind CSS Klassen für das Status-Badge
 */
export const getProjectStatusColor = (status: ProjectStatus): string => {
  switch (status) {
    case 'planning':
      return 'bg-yellow-100 text-yellow-800';
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'on-hold':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * VDE-Status-Farben ermitteln
 *
 * @param status - VDE-Status
 * @returns Tailwind CSS Klassen für das Status-Badge
 */
export const getVdeStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'pending':
    case 'offen':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
    case 'abgeschlossen':
    case 'bestanden':
      return 'bg-green-100 text-green-800';
    case 'failed':
    case 'fehlgeschlagen':
    case 'nicht bestanden':
      return 'bg-red-100 text-red-800';
    case 'in-progress':
    case 'in bearbeitung':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// ============================================
// CUSTOMER HELPER FUNCTIONS
// ============================================

/**
 * Kunde anhand ID finden
 *
 * @param customers - Liste aller Kunden
 * @param customerId - Kunden-ID
 * @returns Gefundener Kunde oder undefined
 */
export const findProjectCustomerById = (customers: Customer[], customerId: string): Customer | undefined => {
  return customers.find(c => c.id === customerId);
};

/**
 * Kundenanzeigename ermitteln
 *
 * @param customer - Kunde oder undefined
 * @returns Anzeigename des Kunden
 */
export const getProjectCustomerDisplayName = (customer: Customer | undefined): string => {
  return customer?.firmennameKundenname || '-';
};

// ============================================
// ID GENERATION
// ============================================

/**
 * Nächste Projekt-ID berechnen
 *
 * @param projects - Liste aller Projekte
 * @returns Nächste Projekt-ID
 */
export const computeNextProjectId = (projects: Project[]): string => {
  const maxId = projects.reduce((max, p) => {
    const projectId = p.projectID || '';
    const num = parseInt(projectId.replace(/\D/g, ''), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  return `PRJ${String(maxId + 1).padStart(4, '0')}`;
};

/**
 * Kundenname für Projektbenennung bereinigen
 *
 * @param name - Kundenname
 * @returns Bereinigter Name
 */
export const sanitizeProjectCustomerName = (name: string): string => {
  return name.trim().replace(/[^a-zA-Z0-9\s-]/g, '').substring(0, 30);
};

// ============================================
// ADDRESS FUNCTIONS
// ============================================

/**
 * Adresse aus Teilen erstellen
 *
 * @param parts - Adressteile
 * @returns Formatierte Adresse
 */
export const buildProjectAddress = (parts: AddressParts): string => {
  const { street, houseNumber, postalCode, city } = parts;
  const addressParts = [
    street && houseNumber ? `${street} ${houseNumber}` : street || houseNumber,
    postalCode && city ? `${postalCode} ${city}` : postalCode || city
  ].filter(Boolean);
  return addressParts.join(', ');
};

/**
 * Adresse in Teile parsen
 *
 * @param address - Adressstring
 * @returns Adressteile
 */
export const parseProjectAddress = (address: string): AddressParts => {
  const parts = address.split(',').map(p => p.trim());
  const streetPart = parts[0] || '';
  const cityPart = parts[1] || '';

  const streetMatch = streetPart.match(/^(.+?)\s+(\d+.*)$/);
  const street = streetMatch ? streetMatch[1] : streetPart;
  const houseNumber = streetMatch ? streetMatch[2] : '';

  const cityMatch = cityPart.match(/^(\d{4,5})\s+(.+)$/);
  const postalCode = cityMatch ? cityMatch[1] : '';
  const city = cityMatch ? cityMatch[2] : cityPart;

  return { street, houseNumber, postalCode, city };
};

/**
 * Formatiert die Projektadresse als String
 *
 * Kann sowohl mit dem neuen Adress-Objekt als auch mit den alten String-Properties umgehen.
 *
 * @param project - Projekt mit address-Objekt oder String-Properties
 * @returns Formatierte Adresse als String
 */
export const formatProjectAddressDisplay = (project: Project): string => {
  // Check for string properties first (legacy/compatibility)
  if (project.street || project.city) {
    const streetPart = project.houseNumber
      ? `${project.street || ''} ${project.houseNumber}`
      : project.street || '';
    const cityPart = project.postalCode
      ? `${project.postalCode} ${project.city || ''}`
      : project.city || '';
    const parts = [streetPart, cityPart].filter(Boolean);
    return parts.join(', ') || '';
  }

  // Check for address object (German property names)
  if (project.address && typeof project.address === 'object') {
    const addr = project.address;
    const cityPart = addr.plz ? `${addr.plz} ${addr.ort || ''}` : addr.ort || '';
    const parts = [addr.strasse, cityPart].filter(Boolean);
    return parts.join(', ') || '';
  }

  return '';
};

// ============================================
// COST CALCULATION
// ============================================

/**
 * Projektkosten aus Buchungen berechnen
 *
 * Berechnet die Kosten basierend auf gespeicherten Preisen in Buchungen.
 * Nur OUT-Buchungen (Material wurde verwendet) werden berücksichtigt.
 *
 * @param bookings - Liste der Buchungen (ExtendedBooking mit materials[])
 * @returns Berechnete Kosten
 */
export const calculateProjectCosts = (bookings: Booking[] | ExtendedBooking[]): ProjectCosts => {
  let totalMaterialCost = 0;

  for (const booking of bookings) {
    // Nur OUT-Buchungen zählen (Material wurde für Projekt verwendet)
    if (booking.type !== 'out') continue;

    const extBooking = booking as ExtendedBooking;
    if (extBooking.materials && Array.isArray(extBooking.materials)) {
      for (const material of extBooking.materials) {
        // Nutze gespeicherte Kosten falls vorhanden
        if (material.totalCost) {
          totalMaterialCost += material.totalCost;
        } else if (material.priceAtBooking) {
          totalMaterialCost += material.priceAtBooking * material.quantity;
        }
      }
    }
  }

  return {
    totalMaterialCost,
    totalLaborCost: 0,
    totalCost: totalMaterialCost
  };
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
export const isProjectColumnRequired = (columnKey: string): boolean => {
  const column = PROJECT_COLUMNS.find(c => c.key === columnKey);
  return column?.required ?? false;
};

/**
 * Merged gespeicherte Preferences mit Defaults
 *
 * @param savedPrefs - Gespeicherte Preferences (kann unvollständig sein)
 * @returns Vollständige Spalteneinstellungen
 */
export const mergeProjectColumnPreferences = (
  savedPrefs: Partial<ProjectVisibleColumns> | null | undefined
): ProjectVisibleColumns => {
  if (!savedPrefs) {
    return { ...DEFAULT_PROJECT_COLUMNS };
  }

  // Filter out undefined values and merge with defaults
  const filtered: ProjectVisibleColumns = { ...DEFAULT_PROJECT_COLUMNS };
  for (const key in savedPrefs) {
    const val = savedPrefs[key];
    if (typeof val === 'boolean') {
      filtered[key] = val;
    }
  }
  return filtered;
};

/**
 * Erstellt eine Kopie der Spalteneinstellungen mit einer getoggelden Spalte
 *
 * @param currentColumns - Aktuelle Spalteneinstellungen
 * @param columnKey - Schlüssel der zu toggelnden Spalte
 * @returns Neue Spalteneinstellungen
 */
export const toggleProjectColumn = (
  currentColumns: ProjectVisibleColumns,
  columnKey: string
): ProjectVisibleColumns => {
  if (isProjectColumnRequired(columnKey)) {
    return currentColumns;
  }

  return {
    ...currentColumns,
    [columnKey]: !currentColumns[columnKey]
  };
};
