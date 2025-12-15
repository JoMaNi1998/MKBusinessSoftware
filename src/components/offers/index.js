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

// Hooks
export { useOfferColumnPrefs, useLaborFactors, useOfferItems } from './hooks';

// Modals
export { DeleteOfferModal } from './modals';

// Shared Utils
export {
  formatPrice,
  formatDate,
  getStatusColorClasses,
  getStatusLabel,
  OFFER_COLUMNS,
  DEFAULT_VISIBLE_COLUMNS,
  WIZARD_STEPS,
  LABOR_FACTOR_LABELS,
  CATEGORY_ICON_NAMES
} from './shared';
