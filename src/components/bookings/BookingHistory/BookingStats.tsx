import React from 'react';
import type { BookingStatsProps } from '@app-types/components/booking.types';

const BookingStats: React.FC<BookingStatsProps> = ({ stats }) => {
  const statItems = [
    { label: 'Gesamt', value: stats.total, color: 'text-gray-900' },
    { label: 'Eingänge', value: stats.eingaenge, color: 'text-green-600' },
    { label: 'Ausgänge', value: stats.ausgaenge, color: 'text-red-600' },
    { label: 'Heute', value: stats.heute, color: 'text-blue-600' }
  ];

  return (
    <div className="grid grid-cols-4 md:grid-cols-4 gap-1.5 md:gap-4">
      {statItems.map((item) => (
        <div key={item.label} className="bg-white p-2 md:p-4 rounded-lg shadow">
          <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">
            {item.label}
          </p>
          <p className={`text-base md:text-2xl font-bold ${item.color}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default BookingStats;
