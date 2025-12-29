/**
 * Type Definitions für Booking-Komponenten
 */

import type { ExtendedBooking, BookingStatistics } from '../contexts/booking.types';
import type { BookingType } from '../index';

// ============================================
// BOOKING MODAL
// ============================================

export interface SelectedMaterial {
  materialId: string;
  quantity: number;
}

export interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: BookingType;
}

// ============================================
// BOOKING HISTORY HOOK
// ============================================

export type DateFilter = 'alle' | 'heute' | 'woche' | 'monat';
export type TypeFilter = 'alle' | BookingType;

export interface UseBookingHistoryReturn {
  // State
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  typeFilter: TypeFilter;
  setTypeFilter: (filter: TypeFilter) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;

  // Derived Data
  stats: BookingStatistics;
  filteredHistory: ExtendedBooking[];
  paginatedHistory: ExtendedBooking[];
  totalPages: number;
  startIndex: number;
  itemsPerPage: number;

  // Loading State
  undoingBookingId: string | null;

  // Actions
  handleUndoBooking: (bookingId: string) => Promise<void>;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface BookingFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  typeFilter: TypeFilter;
  setTypeFilter: (filter: TypeFilter) => void;
}

export interface BookingCardProps {
  entry: ExtendedBooking;
  onUndo: (bookingId: string) => void;
  isUndoing?: boolean;
}

export interface BookingStatsProps {
  stats: BookingStatistics;
}
