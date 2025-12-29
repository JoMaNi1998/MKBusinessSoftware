// Main Components
export { default as OfferManagement } from './OfferManagement';
export { default as OfferConfigurator } from './OfferConfigurator';
export { default as OfferPDFPreview } from './OfferPDFPreview';

// Settings Components
export {
  CalculationSettings,
  OfferTextSettings,
  ServiceCatalog,
  ServicePositionEditor
} from './settings';

// UI Components
export {
  OfferStats,
  OfferHeader,
  OfferListHeader,
  OfferTable,
  OfferCards,
  OfferEmptyState
} from './components';

// Wizard Steps
export {
  CustomerStep,
  ServicesStep,
  PositionsStep,
  PreviewStep
} from './components/wizard';

// Hooks - Re-export from global hooks
export { useOfferColumnPrefs, useLaborFactors, useOfferItems } from '@hooks';

// Modals
export { DeleteOfferModal } from './modals';

// Utils - Re-export from global utils
export {
  OFFER_COLUMNS,
  DEFAULT_OFFER_COLUMNS,
  OFFER_WIZARD_STEPS,
  LABOR_FACTOR_LABELS,
  CATEGORY_ICON_NAMES,
  getOfferStatusColorClasses,
  getOfferStatusLabel,
  isOfferColumnRequired,
  mergeOfferColumnPreferences,
  toggleOfferColumn,
  getCategoryLaborFactorType
} from '@utils/offerHelpers';

export { formatCurrency, formatDate } from '@utils';
