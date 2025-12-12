import React, { createContext, useContext, useCallback } from 'react';
import { BookingService, MaterialService } from '../services/firebaseService';
import { useFirebaseListener, useFirebaseCRUD } from '../hooks';

const BookingContext = createContext();

export const useBookings = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookings must be used within a BookingProvider');
  }
  return context;
};

export const BookingProvider = ({ children }) => {
  // Firebase Real-time Listener mit Custom Hook
  const {
    data: bookings,
    loading: listenerLoading,
    error: listenerError
  } = useFirebaseListener(BookingService.subscribeToBookings);

  // CRUD Operations Hook
  const crud = useFirebaseCRUD();

  // Kombinierter Loading-State
  const loading = listenerLoading || crud.loading;
  const error = listenerError || crud.error;

  // CRUD Operationen mit konsistenter Rückgabe
  const addBooking = useCallback(async (bookingData) => {
    return crud.execute(BookingService.addBooking, bookingData);
  }, [crud]);

  const deleteBooking = useCallback(async (bookingId) => {
    return crud.execute(BookingService.deleteBooking, bookingId);
  }, [crud]);

  const undoBooking = useCallback(async (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) {
      return { success: false, error: 'Buchung nicht gefunden' };
    }

    try {
      // Bestand für alle Materialien rückgängig machen
      for (const material of booking.materials) {
        // Hole aktuelles Material aus Firebase
        const currentMaterial = await MaterialService.getDocument(material.materialID);
        if (currentMaterial) {
          const stockChange = booking.type === 'Eingang'
            ? -material.quantity  // Bei Eingang: Bestand reduzieren
            : material.quantity;   // Bei Ausgang: Bestand erhöhen

          const newStock = currentMaterial.stock + stockChange;
          // Negativer Bestand = Nachbestellen, 0 = Nicht verfügbar, niedrig (≤ heatStock) oder auf Lager
          const stockState = newStock < 0 ? 'Nachbestellen' :
                            newStock === 0 ? 'Nicht verfügbar' :
                            newStock <= currentMaterial.heatStock ? 'Niedrig' : 'Auf Lager';

          await MaterialService.updateMaterial(material.materialID, {
            ...currentMaterial,
            stock: newStock,
            stockState
          });
        }
      }

      // Buchung direkt löschen
      await BookingService.deleteBooking(bookingId);

      return { success: true, message: 'Buchung erfolgreich rückgängig gemacht' };
    } catch (err) {
      console.error('Error undoing booking:', err);
      return { success: false, error: err.message };
    }
  }, [bookings]);

  // Hilfsfunktionen (keine async Operationen)
  const getBookingsByCustomer = useCallback((customerID) => {
    return bookings.filter(booking => booking.customerID === customerID);
  }, [bookings]);

  const getBookingsByDateRange = useCallback((startDate, endDate) => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.timestamp);
      return bookingDate >= startDate && bookingDate <= endDate;
    });
  }, [bookings]);

  const getBookingStatistics = useCallback(() => {
    const today = new Date();
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      total: bookings.length,
      eingaenge: bookings.filter(b => b.type === 'Eingang').length,
      ausgaenge: bookings.filter(b => b.type === 'Ausgang').length,
      heute: bookings.filter(b =>
        new Date(b.timestamp).toDateString() === today.toDateString()
      ).length,
      dieseWoche: bookings.filter(b =>
        new Date(b.timestamp) >= thisWeek
      ).length,
      dieserMonat: bookings.filter(b =>
        new Date(b.timestamp) >= thisMonth
      ).length,
      storniert: bookings.filter(b => b.status === 'Storniert').length,
      rueckbuchungen: bookings.filter(b => b.status === 'Rückbuchung').length
    };
  }, [bookings]);

  const value = {
    bookings,
    loading,
    error,
    addBooking,
    deleteBooking,
    undoBooking,
    getBookingsByCustomer,
    getBookingsByDateRange,
    getBookingStatistics
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

export default BookingContext;
