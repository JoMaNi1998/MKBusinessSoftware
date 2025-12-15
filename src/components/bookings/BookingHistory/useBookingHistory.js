import { useState, useEffect, useMemo } from 'react';
import { useBookings } from '../../../context/BookingContext';
import { useNotification } from '../../../context/NotificationContext';
import { parseTimestamp } from '../../../utils/dateUtils';

const ITEMS_PER_PAGE = 20;

const normalize = (s) => (s || '').toString().toLowerCase();

export const useBookingHistory = () => {
  const { bookings, undoBooking, getBookingStatistics } = useBookings();
  const { showNotification } = useNotification();

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('monat'); // Standard: Letzter Monat
  const [typeFilter, setTypeFilter] = useState('alle');
  const [currentPage, setCurrentPage] = useState(1);

  const stats = getBookingStatistics();

  // Gefilterte Buchungen
  const filteredHistory = useMemo(() => {
    return bookings.filter(entry => {
      // Null-safe search - handle bookings with missing fields
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
          matchesDate = false; // Ungültiges Datum ausfiltern
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

  // Pagination berechnen
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Seite zurücksetzen wenn Filter sich ändern
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, typeFilter]);

  // Buchung rückgängig machen
  const handleUndoBooking = (bookingId) => {
    const bookingExists = bookings.some(b => b.id === bookingId);
    if (!bookingExists) {
      showNotification('Buchung existiert nicht mehr', 'warning');
      return;
    }

    if (window.confirm('Buchung wirklich rückgängig machen?')) {
      undoBooking(bookingId);
      showNotification('Buchung erfolgreich rückgängig gemacht', 'success');
    }
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
    // Abgeleitete Daten
    stats,
    filteredHistory,
    paginatedHistory,
    totalPages,
    startIndex,
    itemsPerPage: ITEMS_PER_PAGE,
    // Aktionen
    handleUndoBooking
  };
};
