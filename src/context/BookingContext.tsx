import React, { createContext, useContext, useCallback } from 'react';
import { BookingService } from '../services/firebaseService';
import { useAuth } from './AuthContext';
import { useFirebaseListener, useFirebaseCRUD } from '../hooks';
import { useMaterials } from './MaterialContext';
import type {
  BookingContextValue,
  ExtendedBooking,
  BookingStatistics
} from '../types/contexts/booking.types';

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

export const useBookings = (): BookingContextValue => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookings must be used within a BookingProvider');
  }
  return context;
};

interface BookingProviderProps {
  children: React.ReactNode;
}

export const BookingProvider: React.FC<BookingProviderProps> = ({ children }) => {
  const { user } = useAuth();

  // Firebase Real-time Listener mit Custom Hook
  // Nur laden wenn User eingeloggt ist
  const {
    data: bookingsData,
    loading: listenerLoading,
    error: listenerError
  } = useFirebaseListener(BookingService.subscribeToBookings, {
    enabled: !!user
  });

  // Type assertion: Booking → ExtendedBooking
  const bookings = bookingsData as ExtendedBooking[];

  // CRUD Operations Hook
  const crud = useFirebaseCRUD();

  // Material Context für Stock-Updates (wie bei PV-Konfiguration)
  const { materials, updateMaterialStock } = useMaterials();

  // Kombinierter Loading-State
  const loading = listenerLoading || crud.loading;
  const error = listenerError || crud.error;

  // Helper: Timestamp zu Date konvertieren
  const timestampToDate = (timestamp: unknown): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (timestamp as any).toDate === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (timestamp as any).toDate();
    }
    if (typeof timestamp === 'string') return new Date(timestamp);
    return new Date();
  };

  // CRUD Operationen mit konsistenter Rückgabe
  const addBooking = useCallback(async (
    bookingData: Partial<ExtendedBooking>
  ): Promise<{ success: boolean; error?: string }> => {
    return crud.execute(() => BookingService.addBooking(bookingData as unknown as ExtendedBooking));
  }, [crud]);

  const deleteBooking = useCallback(async (
    bookingId: string
  ): Promise<{ success: boolean; error?: string }> => {
    return crud.execute(() => BookingService.deleteBooking(bookingId));
  }, [crud]);

  const undoBooking = useCallback(async (
    bookingId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) {
      return { success: false, error: 'Buchung nicht gefunden' };
    }

    try {
      // Bestand für alle Materialien rückgängig machen (wie bei PV-Konfiguration)
      const bookingMaterials = booking.materials || [];
      for (const bookingMaterial of bookingMaterials) {
        // Material finden über materialID (z.B. "MAT-096")
        const material = materials.find(m => m.materialID === bookingMaterial.materialID);

        if (material) {
          // Stock-Änderung berechnen (umgekehrt zur ursprünglichen Buchung)
          const stockChange = booking.type === 'in'
            ? -bookingMaterial.quantity  // Bei Eingang: Bestand reduzieren
            : bookingMaterial.quantity;   // Bei Ausgang: Bestand erhöhen

          // updateMaterialStock verwendet die Firebase Document ID (material.id)
          await updateMaterialStock(material.id, stockChange);
        }
      }

      // Buchung löschen
      await BookingService.deleteBooking(bookingId);

      return { success: true, message: 'Buchung erfolgreich rückgängig gemacht' };
    } catch (err) {
      console.error('Error undoing booking:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }, [bookings, materials, updateMaterialStock]);

  // Hilfsfunktionen (keine async Operationen)
  const getBookingsByCustomer = useCallback((customerID: string): ExtendedBooking[] => {
    return bookings.filter(booking => booking.customerID === customerID);
  }, [bookings]);

  const getBookingsByDateRange = useCallback((
    startDate: Date,
    endDate: Date
  ): ExtendedBooking[] => {
    return bookings.filter(booking => {
      const bookingDate = timestampToDate(booking.timestamp);
      return bookingDate >= startDate && bookingDate <= endDate;
    });
  }, [bookings]);

  const getBookingStatistics = useCallback((): BookingStatistics => {
    const today = new Date();
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      total: bookings.length,
      eingaenge: bookings.filter(b => b.type === 'in').length,
      ausgaenge: bookings.filter(b => b.type === 'out').length,
      heute: bookings.filter(b => {
        const bookingDate = timestampToDate(b.timestamp);
        return bookingDate.toDateString() === today.toDateString();
      }).length,
      dieseWoche: bookings.filter(b => {
        const bookingDate = timestampToDate(b.timestamp);
        return bookingDate >= thisWeek;
      }).length,
      dieserMonat: bookings.filter(b => {
        const bookingDate = timestampToDate(b.timestamp);
        return bookingDate >= thisMonth;
      }).length,
      storniert: bookings.filter(b => b.status === 'Storniert').length,
      rueckbuchungen: bookings.filter(b => b.status === 'Rückbuchung').length
    };
  }, [bookings]);

  const value: BookingContextValue = {
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
