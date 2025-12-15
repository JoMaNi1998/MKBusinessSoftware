/**
 * Project-related constants
 */

export const STATUS_OPTIONS = [
  { value: 'Aktiv', label: 'Aktiv', color: 'bg-green-100 text-green-800' },
  { value: 'Geplant', label: 'Geplant', color: 'bg-blue-100 text-blue-800' },
  { value: 'Pausiert', label: 'Pausiert', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Abgeschlossen', label: 'Abgeschlossen', color: 'bg-gray-100 text-gray-800' },
  { value: 'Storniert', label: 'Storniert', color: 'bg-red-100 text-red-800' }
];

export const STATUS_OPTIONS_WITH_ALL = [
  { value: 'alle', label: 'Alle Status' },
  ...STATUS_OPTIONS
];

export const AVAILABLE_COLUMNS = [
  { key: 'name', label: 'Projekt', required: true },
  { key: 'customer', label: 'Kunde', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'address', label: 'Adresse', required: false },
  { key: 'description', label: 'Beschreibung', required: false }
];

export const DEFAULT_VISIBLE_COLUMNS = {
  name: true,
  customer: true,
  status: true,
  address: false,
  description: false
};

export const DEFAULT_COLUMN_FILTERS = {
  status: 'alle',
  customer: 'alle'
};

export const VDE_STATUS_OPTIONS = [
  { value: 'Erstellt', label: 'Erstellt', color: 'bg-blue-100 text-blue-800' },
  { value: 'Geprüft', label: 'Geprüft', color: 'bg-green-100 text-green-800' },
  { value: 'Abgeschlossen', label: 'Abgeschlossen', color: 'bg-gray-100 text-gray-800' }
];
