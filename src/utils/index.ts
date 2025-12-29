/**
 * Utils Export
 *
 * Zentrale Export-Datei für alle wiederverwendbaren Utilities.
 */

// Date Utilities
export {
  parseTimestamp,
  formatDateTime,
  formatDate,
  formatRelativeTime,
  formatSmartDate,
  isPast,
  isToday,
  daysDifference,
  filterByDateRange
} from './dateUtils';
export type { DateRangeFilterType } from './dateUtils';

// Formatters
export {
  formatPrice,
  buildDescription,
  computeNextMaterialId,
  formatCurrency,
  formatCompactNumber,
  formatPercent,
  formatFileSize,
  formatPhone,
  getCustomerName,
  getCustomerAddress
} from './formatters';

export type { BuildDescriptionParams } from './formatters';

// Helpers
export {
  toNumber,
  normalize,
  isEmpty,
  createKey
} from './helpers';

// Stock Status
export { getStockStatusColor, getStockStatusText } from './stockStatus';
export type { OrderStatus } from './stockStatus';

// Debounce & Throttle
export { debounce, throttle } from './debounce';
export type { DebouncedFunction } from './debounce';

// Booking Helpers
export {
  getBookingTypeColor,
  getBookingTypeLabel,
  getBookingTypeIconName,
  isIncomingBooking,
  isOutgoingBooking,
  calculateStockChange,
  WAREHOUSE_BOOKING,
  BOOKING_ITEMS_PER_PAGE
} from './bookingHelpers';

// Customer Helpers
export {
  computeNextCustomerId,
  computeNextProjectId,
  random4,
  sanitizeCustomerName,
  addressFromParts,
  cn,
  DEFAULT_CUSTOMER_COLUMNS,
  CUSTOMER_AVAILABLE_COLUMNS,
  DATE_RANGE_OPTIONS
} from './customerHelpers';
export type { AddressParts } from './customerHelpers';

// Invoice Helpers
export {
  INVOICE_AVAILABLE_COLUMNS,
  DEFAULT_INVOICE_COLUMNS,
  isRequiredColumn,
  getColumnConfig,
  toggleInvoiceColumn,
  mergeInvoiceColumnPreferences
} from './invoiceHelpers';

// Material Helpers
export {
  MATERIAL_AVAILABLE_COLUMNS,
  DEFAULT_MATERIAL_COLUMNS,
  validateMaterialForm,
  hasMaterialValidationErrors,
  calculateMaterialStats,
  getCategoryName,
  buildCategoryMap,
  parsePriceInput,
  formatPriceForInput
} from './materialHelpers';

// Offer Helpers
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
} from './offerHelpers';

// Order Helpers
export {
  ORDER_COLUMNS,
  DEFAULT_ORDER_COLUMNS,
  STATUS_FILTER_OPTIONS,
  formatOrderPrice,
  getOrderStatusColor,
  getOrderStatusText,
  isOrderColumnRequired,
  mergeOrderColumnPreferences,
  toggleOrderColumn
} from './orderHelpers';

// Project Helpers
export {
  PROJECT_STATUS_OPTIONS,
  PROJECT_STATUS_OPTIONS_WITH_ALL,
  VDE_STATUS_OPTIONS,
  PROJECT_COLUMNS,
  DEFAULT_PROJECT_COLUMNS,
  DEFAULT_PROJECT_FILTERS,
  getProjectStatusColor,
  getVdeStatusColor,
  findProjectCustomerById,
  getProjectCustomerDisplayName,
  computeNextProjectId as computeNextProjectIdFromHelpers,
  sanitizeProjectCustomerName,
  buildProjectAddress,
  parseProjectAddress,
  calculateProjectCosts,
  isProjectColumnRequired,
  mergeProjectColumnPreferences,
  toggleProjectColumn
} from './projectHelpers';

// PV Configurator Helpers
export {
  PV_CAT,
  PV_SPEC,
  PV_ROOF_TYPES,
  PV_WIZARD_STEPS,
  PV_DEFAULT_CONFIGURATION,
  PV_STATUS_OPTIONS,
  PV_AVAILABLE_COLUMNS,
  PV_DEFAULT_VISIBLE_COLUMNS,
  parsePVNum,
  getPVSpec,
  getPVBreakerCurrent,
  getPVCableMM2,
  getPVCableTable,
  calculatePVLayoutTotals,
  pvOptionsFromCategory,
  createPVMaterialsById,
  pvPairRequired,
  generatePVUniqueId,
  getNextPVConfigVersion,
  getPVStatusColor,
  getPVStatusLabel
} from './pvConfiguratorHelpers';
