import React from 'react';
import { Package, TrendingDown, TrendingUp, Sun, RotateCcw } from 'lucide-react';
import { formatDateTime } from '@utils';
import { getBookingTypeLabel, getBookingTypeColor } from '@utils/bookingHelpers';
import type { ExtendedBooking } from '@app-types/contexts/booking.types';
import { BookingType } from '@app-types';

interface BookingsSectionProps {
  bookings: ExtendedBooking[];
  onUndoBooking?: (bookingId: string) => void;
}

const BookingsSection: React.FC<BookingsSectionProps> = ({ bookings, onUndoBooking }) => {
  const isPVConfiguration = (booking: ExtendedBooking) => {
    return (booking as any).referenceType === 'pv-configuration';
  };

  const getConfigNumber = (booking: ExtendedBooking) => {
    return (booking as any).configNumber;
  };

  // Sortiere Buchungen nach Datum (neueste zuerst)
  const sortedBookings = [...bookings].sort((a, b) => {
    const dateA = a.timestamp?.toDate?.() || new Date(a.date || 0);
    const dateB = b.timestamp?.toDate?.() || new Date(b.date || 0);
    return dateB.getTime() - dateA.getTime();
  });

  // Gesamtanzahl der Materialien berechnen
  const _totalMaterials = bookings.reduce((sum, b) => {
    return sum + (b.materials?.length || 1);
  }, 0);

  return (
    <div className="space-y-4">
      {bookings.length === 0 ? (
        <div className="text-center py-8">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Buchungen</h3>
          <p className="mt-1 text-sm text-gray-500">
            Für dieses Projekt wurden noch keine Materialbuchungen durchgeführt.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedBookings.map((booking, index) => {
            const timestamp = booking.timestamp?.toDate?.()
              ? booking.timestamp.toDate().toISOString()
              : booking.date || '';

            return (
              <div key={booking.id || index} className="bg-white border rounded-lg p-4">
                {/* Header mit Typ und Datum */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {isPVConfiguration(booking) ? (
                      <Sun className="h-5 w-5 text-yellow-500" />
                    ) : booking.type === BookingType.IN ? (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBookingTypeColor(booking.type)}`}>
                      {getBookingTypeLabel(booking.type)}
                    </span>
                    {isPVConfiguration(booking) && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        PV-Konfig #{getConfigNumber(booking)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {formatDateTime(timestamp)}
                    </span>
                    {onUndoBooking && (
                      <button
                        onClick={() => onUndoBooking(booking.id)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Buchung rückgängig machen"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Materialliste */}
                <div className="space-y-2 border-t pt-3">
                  {booking.materials && booking.materials.length > 0 ? (
                    // Wenn materials[] Array vorhanden ist, zeige alle Materialien
                    booking.materials.map((material, matIndex) => (
                      <div key={matIndex} className="flex items-center space-x-3 text-sm">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{material.quantity}x</span>
                        <span className="font-medium text-gray-900">
                          {material.description || material.materialName || '-'}
                        </span>
                        <span className="text-gray-500 text-xs">{material.materialID}</span>
                      </div>
                    ))
                  ) : (
                    // Fallback: Zeige einzelnes Material aus den Basis-Feldern
                    <div className="flex items-center space-x-3 text-sm">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{booking.quantity}x</span>
                      <span className="font-medium text-gray-900">
                        {booking.materialName || '-'}
                      </span>
                      <span className="text-gray-500 text-xs">{booking.materialID}</span>
                    </div>
                  )}
                </div>

                {/* Grund falls vorhanden */}
                {booking.reason && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Grund:</span> {booking.reason}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingsSection;
