import React from 'react';
import { Package, TrendingDown } from 'lucide-react';
import { formatDateTime } from '../../utils';

const BookingsSection = ({ bookings }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
        Materialbuchungen ({bookings.length})
      </h3>

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
          {bookings.map((booking, index) => (
            <div key={index} className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-gray-900">{booking.type}</span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Abgeschlossen
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {formatDateTime(booking.date || booking.timestamp)}
                </span>
              </div>

              <div className="space-y-2">
                {booking.materials.map((m, mi) => (
                  <div key={mi} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium text-gray-900">{m.description}</span>
                      <p className="text-gray-500 text-xs">{m.materialID}</p>
                    </div>
                    <span className="font-medium text-gray-900">{m.quantity}x</span>
                  </div>
                ))}
              </div>

              {booking.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Notiz:</span> {booking.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingsSection;
