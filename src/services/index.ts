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
  generateBookingId
} from './BookingService';
export type { BookingValidationErrors, BookingExecutionResult } from './BookingService';

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
