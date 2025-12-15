import { OFFER_STATUS_LABELS } from '../../../context/OfferContext';

/**
 * Preis formatieren mit EUR
 */
export const formatPrice = (price) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(price || 0);
};

/**
 * Datum formatieren (DD.MM.YYYY)
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = dateString?.toDate ? dateString.toDate() : new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

/**
 * Status-Badge Klassen
 */
export const getStatusColorClasses = (status) => {
  const statusInfo = OFFER_STATUS_LABELS[status] || { color: 'gray' };
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700'
  };
  return colorClasses[statusInfo.color] || colorClasses.gray;
};

/**
 * Status-Label
 */
export const getStatusLabel = (status) => {
  return OFFER_STATUS_LABELS[status]?.label || status;
};

/**
 * Verfügbare Spalten für OfferManagement
 */
export const OFFER_COLUMNS = [
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
export const DEFAULT_VISIBLE_COLUMNS = {
  angebot: true,
  kunde: true,
  projekt: true,
  betrag: true,
  status: true,
  datum: true,
  aktionen: true
};

/**
 * Wizard Steps Konfiguration
 */
export const WIZARD_STEPS = [
  { id: 0, title: 'Kunde', icon: 'Users' },
  { id: 1, title: 'Leistungen', icon: 'Package' },
  { id: 2, title: 'Positionen', icon: 'Edit' },
  { id: 3, title: 'Zusammenfassung', icon: 'Eye' }
];

/**
 * Arbeitszeitfaktor Labels
 */
export const LABOR_FACTOR_LABELS = {
  dach: 'Dach',
  elektro: 'Elektro',
  geruest: 'Gerüst & Logistik'
};

/**
 * Kategorie-Icons Mapping
 */
export const CATEGORY_ICON_NAMES = {
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
