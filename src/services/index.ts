/**
 * Services - Zentrale Exports
 */

export { FirebaseService } from './firebaseService';
export { CounterService } from './CounterService';

// BOM Service
export {
  computeBOMFromBookings,
  updateBOMItemQuantity,
  splitBOMItemsByConfiguration
} from './BOMService';

// Booking Service
export {
  validateBookingForm,
  hasValidationErrors,
  executeStockUpdates,
  resetOrderStatus,
  generateBookingId,
  createBookingMaterial,
  createBookingData
} from './BookingService';
export type {
  BookingValidationErrors,
  BookingExecutionResult,
  BookingMaterialOptions,
  CreateBookingParams
} from './BookingService';

// Customer Service
export {
  calculateCustomerTotalCosts,
  validateCustomerForm,
  hasCustomerValidationErrors,
  saveCustomerColumnPreferences,
  loadCustomerColumnPreferences
} from './CustomerService';

// Invoice Service
export {
  loadInvoiceColumnPreferences,
  saveInvoiceColumnPreferences,
  validateCustomerStep,
  validateServicesStep,
  validateInvoiceStep,
  hasValidationErrors as hasInvoiceValidationErrors,
  calculateInvoiceTotals
} from './InvoiceService';

// User Service
export { UserService } from './UserService';
export type { FirestoreUser } from './UserService';

// Booking Aggregation Service
export {
  aggregateProjectBookings,
  getMaxReturnableQuantity,
  validateProjectInBooking,
  splitAggregatedByCategory
} from './BookingAggregationService';
export type { AggregatedMaterial, InBookingValidationResult } from './BookingAggregationService';
