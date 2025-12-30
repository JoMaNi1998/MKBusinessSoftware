/**
 * Type Definitions für den BookingContext
 *
 * Types für Materialbuchungen, Stock-Management,
 * Rückbuchungen und Booking-Statistiken.
 */

import type { Booking, BookingType } from '../index';

// ============================================
// EXTENDED BOOKING
// ============================================

export interface BookingMaterial {
  materialID: string;
  materialName?: string;
  description?: string;
  quantity: number;
  priceAtBooking?: number;
  totalCost?: number;
  isConfigured?: boolean;   // Material aus PV-Konfiguration
  isManual?: boolean;       // Manuell hinzugefügt (Monteur)
}

export interface ExtendedBooking extends Booking {
  materials?: BookingMaterial[];  // Für Mehrfach-Material-Buchungen
  status?: 'Aktiv' | 'Storniert' | 'Rückbuchung';
  notes?: string;
  customerName?: string;  // Zusätzliche Anzeige-Informationen
  projectName?: string;   // Zusätzliche Anzeige-Informationen
}

// ============================================
// BOOKING STATISTICS
// ============================================

export interface BookingStatistics {
  total: number;
  eingaenge: number;  // Eingänge
  ausgaenge: number;  // Ausgänge
  heute: number;
  dieseWoche: number;
  dieserMonat: number;
  storniert: number;
  rueckbuchungen: number;
}

// ============================================
// BOOKING FILTERS
// ============================================

export interface BookingFilters {
  type?: BookingType | 'all';
  materialID?: string;
  customerID?: string;
  projectID?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

// ============================================
// BOOKING CONTEXT VALUE
// ============================================

export interface BookingContextValue {
  // State
  bookings: ExtendedBooking[];
  loading: boolean;
  error: string | null;

  // CRUD Operations
  addBooking: (bookingData: Partial<ExtendedBooking>) => Promise<{ success: boolean; error?: string }>;
  deleteBooking: (bookingId: string) => Promise<{ success: boolean; error?: string }>;
  undoBooking: (bookingId: string) => Promise<{ success: boolean; message?: string; error?: string }>;

  // Queries
  getBookingsByCustomer: (customerID: string) => ExtendedBooking[];
  getBookingsByDateRange: (startDate: Date, endDate: Date) => ExtendedBooking[];

  // Statistics
  getBookingStatistics: () => BookingStatistics;
}

// ============================================
// BOOKING TYPE LABELS
// ============================================

export interface BookingTypeConfig {
  label: string;
  color: 'blue' | 'green' | 'orange' | 'red';
  icon: string;
}

export const BOOKING_TYPE_LABELS: Record<BookingType, BookingTypeConfig> = {
  in: {
    label: 'Eingang',
    color: 'green',
    icon: 'ArrowDownCircle'
  },
  out: {
    label: 'Ausgang',
    color: 'blue',
    icon: 'ArrowUpCircle'
  },
  correction: {
    label: 'Korrektur',
    color: 'orange',
    icon: 'Edit'
  },
  inventory: {
    label: 'Inventur',
    color: 'red',
    icon: 'Package'
  }
};
