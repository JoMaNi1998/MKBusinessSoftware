import { formatPrice as baseFormatPrice } from '../../../utils';

/**
 * Order-spezifische Preisformatierung (mit €)
 */
export const formatPrice = (price) => {
  if (price === null || price === undefined || price === '') return '-';
  const formatted = baseFormatPrice(price);
  return formatted ? `${formatted} €` : '-';
};

/**
 * Status-Farbe basierend auf displayType
 */
export const getStatusColor = (material) => {
  switch (material._displayType) {
    case 'ordered':
      return 'bg-blue-100 text-blue-800';
    case 'additional':
      return 'bg-red-100 text-red-800';
    case 'needed':
      return 'bg-red-100 text-red-800';
    case 'low':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Status-Text basierend auf displayType
 */
export const getStatusText = (material) => {
  switch (material._displayType) {
    case 'ordered':
      return `Bestellt (${material._displayQuantity})`;
    case 'additional':
      return `Nachbestellen (${material._displayQuantity})`;
    case 'needed':
      return `Nachbestellen (${material._displayQuantity})`;
    case 'low':
      return 'Niedrig';
    default:
      return 'Auf Lager';
  }
};

// Unique Status-Werte für Filter
export const STATUS_FILTER_OPTIONS = ['alle', 'Bestellt', 'Nachbestellen', 'Niedrig'];
