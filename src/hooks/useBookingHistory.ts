/**
 * useBookingHistory Hook
 * Zentraler Hook für Buchungshistorie-Management
 */

import { useState, useEffect, useMemo } from 'react';
import { useBookings } from '@context/BookingContext';
import { useNotification } from '@context/NotificationContext';
import { useConfirm } from '@context/ConfirmContext';
import { parseTimestamp } from '../utils/dateUtils';
import { normalize, BOOKING_ITEMS_PER_PAGE } from '../utils';
import type { UseBookingHistoryReturn, DateFilter, TypeFilter } from '@app-types/components/booking.types';
import type { ExtendedBooking } from '@app-types/contexts/booking.types';
import { NotificationType, ConfirmVariant } from '@app-types/enums';

/**
 * Hook für Buchungshistorie mit Filterung, Pagination und Undo-Funktionalität
 *
 * @returns Hook-Return mit State, abgeleiteten Daten und Aktionen
 *
 * @example
 * const {
 *   filteredHistory,
 *   paginatedHistory,
 *   handleUndoBooking,
 *   setSearchTerm
 * } = useBookingHistory();
 */
export const useBookingHistory = (): UseBookingHistoryReturn => {
  const { bookings, undoBooking, getBookingStatistics } = useBookings();
  const { showNotification } = useNotification();
  const { confirm } = useConfirm();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('monat');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('alle');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [undoingBookingId, setUndoingBookingId] = useState<string | null>(null);

  const stats = getBookingStatistics();

  // Gefilterte Buchungen
  const filteredHistory = useMemo<ExtendedBooking[]>(() => {
    return bookings.filter(entry => {
      // Null-safe search
      const customerName = entry.customerName || '';
      const customerID = entry.customerID || '';
      const projectName = entry.projectName || '';
      const materials = entry.materials || [];

      const matchesSearch = normalize(customerName).includes(normalize(searchTerm)) ||
                           normalize(customerID).includes(normalize(searchTerm)) ||
                           normalize(projectName).includes(normalize(searchTerm)) ||
                           materials.some(m =>
                             normalize(m.materialID || '').includes(normalize(searchTerm)) ||
                             normalize(m.description || '').includes(normalize(searchTerm))
                           );

      const matchesType = typeFilter === 'alle' || entry.type === typeFilter;

      let matchesDate = true;
      if (dateFilter !== 'alle') {
        const entryDate = parseTimestamp(entry.date || entry.timestamp || entry.createdAt);
        const today = new Date();

        if (!entryDate || isNaN(entryDate.getTime())) {
          matchesDate = false;
        } else {
          switch (dateFilter) {
            case 'heute':
              matchesDate = entryDate.toDateString() === today.toDateString();
              break;
            case 'woche': {
              const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
              matchesDate = entryDate >= weekAgo;
              break;
            }
            case 'monat': {
              const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
              matchesDate = entryDate >= monthAgo;
              break;
            }
            default:
              matchesDate = true;
              break;
          }
        }
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [bookings, searchTerm, dateFilter, typeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / BOOKING_ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * BOOKING_ITEMS_PER_PAGE;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + BOOKING_ITEMS_PER_PAGE);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, typeFilter]);

  // Undo booking
  const handleUndoBooking = async (bookingId: string): Promise<void> => {
    // Verhindere Doppelklicks
    if (undoingBookingId) return;

    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) {
      showNotification('Buchung existiert nicht mehr', NotificationType.WARNING);
      return;
    }

    const bookingName = booking.customerName || booking.projectName || 'diese Buchung';

    setUndoingBookingId(bookingId);

    await confirm({
      title: 'Buchung rückgängig machen',
      message: `Möchten Sie die Buchung "${bookingName}" wirklich rückgängig machen?`,
      variant: ConfirmVariant.DANGER,
      confirmText: 'Rückgängig machen',
      onConfirmAsync: async () => {
        const result = await undoBooking(bookingId);
        if (result.success) {
          showNotification('Buchung erfolgreich rückgängig gemacht', NotificationType.SUCCESS);
        } else {
          showNotification(result.error || 'Fehler beim Rückgängig machen', NotificationType.ERROR);
        }
      }
    });

    setUndoingBookingId(null);
  };

  return {
    // State
    searchTerm,
    setSearchTerm,
    dateFilter,
    setDateFilter,
    typeFilter,
    setTypeFilter,
    currentPage,
    setCurrentPage,
    // Derived data
    stats,
    filteredHistory,
    paginatedHistory,
    totalPages,
    startIndex,
    itemsPerPage: BOOKING_ITEMS_PER_PAGE,
    // Loading State
    undoingBookingId,
    // Actions
    handleUndoBooking
  };
};

export default useBookingHistory;
