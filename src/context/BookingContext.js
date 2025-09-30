import React, { createContext, useContext, useState, useEffect } from 'react';
import { BookingService, MaterialService } from '../services/firebaseService';

const BookingContext = createContext();

export const useBookings = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookings must be used within a BookingProvider');
  }
  return context;
};

export const BookingProvider = ({ children }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Firebase Real-time Listener
  useEffect(() => {
    let unsubscribe;
    
    const setupListener = async () => {
      try {
        setLoading(true);
        unsubscribe = BookingService.subscribeToBookings((bookingsData) => {
          setBookings(bookingsData);
          setLoading(false);
        });
      } catch (err) {
        console.error('Error setting up bookings listener:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);


  const addBooking = async (bookingData) => {
    try {
      setLoading(true);
      await BookingService.addBooking(bookingData);
      // Real-time listener wird automatisch die UI aktualisieren
    } catch (err) {
      console.error('Error adding booking:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateBooking = (bookingId, bookingData) => {
    setBookings(prev => 
      prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, ...bookingData }
          : booking
      )
    );
  };

  const deleteBooking = async (bookingId) => {
    try {
      setLoading(true);
      await BookingService.deleteBooking(bookingId);
      // Real-time listener wird automatisch die UI aktualisieren
    } catch (err) {
      console.error('Error deleting booking:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const undoBooking = async (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      try {
        // Bestand für alle Materialien rückgängig machen
        for (const material of booking.materials) {
          // Hole aktuelles Material aus Firebase
          const currentMaterial = await MaterialService.getDocument(material.materialID);
          if (currentMaterial) {
            const stockChange = booking.type === 'Eingang' 
              ? -material.quantity  // Bei Eingang: Bestand reduzieren
              : material.quantity;   // Bei Ausgang: Bestand erhöhen
            
            const newStock = Math.max(0, currentMaterial.stock + stockChange);
            const stockState = newStock === 0 ? 'Nicht verfügbar' : 
                              newStock <= currentMaterial.heatStock * 0.2 ? 'Niedrig' : 'Auf Lager';
            
            await MaterialService.updateMaterial(material.materialID, {
              ...currentMaterial,
              stock: newStock,
              stockState
            });
          }
        }
        
        // Buchung direkt löschen (elegantere Lösung)
        await BookingService.deleteBooking(bookingId);
        
        return { success: true, message: 'Buchung erfolgreich rückgängig gemacht' };
      } catch (err) {
        console.error('Error undoing booking:', err);
        setError(err.message);
        throw err;
      }
    }
  };

  const getBookingsByCustomer = (customerID) => {
    return bookings.filter(booking => booking.customerID === customerID);
  };

  const getBookingsByDateRange = (startDate, endDate) => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.timestamp);
      return bookingDate >= startDate && bookingDate <= endDate;
    });
  };

  const getBookingStatistics = () => {
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
  };

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
