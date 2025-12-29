/**
 * Custom Hooks Export
 *
 * Zentrale Export-Datei für alle wiederverwendbaren Hooks.
 */

// Firebase Hooks
export { useFirebaseListener } from './useFirebaseListener';
export { useFirebaseCRUD } from './useFirebaseCRUD';

export type { SubscribeFunction } from './useFirebaseListener';
export type { UseFirebaseCRUDReturn } from './useFirebaseCRUD';

// Categories & Specifications
export { useCategoriesAndSpecs } from './useCategoriesAndSpecs';
export type { UseCategoriesAndSpecsReturn } from './useCategoriesAndSpecs';

// Column Preferences
export { useColumnPreferences, AVAILABLE_COLUMNS } from './useColumnPreferences';
export type {
  VisibleColumns,
  ColumnDefinition,
  ShowNotificationFn,
  UseColumnPreferencesReturn
} from './useColumnPreferences';

// Material Filters
export { useMaterialFilters } from './useMaterialFilters';
export type {
  SortConfig,
  ColumnFilters,
  UseMaterialFiltersReturn
} from './useMaterialFilters';

// Bill of Materials
export { useBillOfMaterials } from './useBillOfMaterials';

// Booking Hooks
export { useBookingHistory } from './useBookingHistory';
export { useBookingModal } from './useBookingModal';
export type { UseBookingModalReturn } from './useBookingModal';

// Customer Hooks
export { useCustomerManagement } from './useCustomerManagement';
export { useCustomerModal } from './useCustomerModal';

// Invoice Hooks
export { useInvoiceManagement } from './useInvoiceManagement';
export { useInvoiceConfigurator } from './useInvoiceConfigurator';

// Offer Hooks
export { useOfferItems } from './useOfferItems';
export { useLaborFactors } from './useLaborFactors';
export { useOfferColumnPrefs } from './useOfferColumnPrefs';

// Order Hooks
export { useOrderList } from './useOrderList';
export { useOrderColumnPrefs } from './useOrderColumnPrefs';

// Utility Hooks
export { useClickOutside } from './useClickOutside';
export { usePriceCalculation } from './usePriceCalculation';
export type { PriceState, UsePriceCalculationReturn } from './usePriceCalculation';

// Project Hooks
export { useProjectColumnPrefs } from './useProjectColumnPrefs';
export { useProjectManagement } from './useProjectManagement';
export { useProjectModal } from './useProjectModal';

// Auto-Select Hooks
export { useAutoSelectProject } from './useAutoSelectProject';
