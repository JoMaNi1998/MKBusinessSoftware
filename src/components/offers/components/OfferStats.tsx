import React from 'react';
import { formatCurrency } from '@utils';
import type { OfferStatsProps } from '@app-types/components/offer.types';

const OfferStats: React.FC<OfferStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-4 md:grid-cols-4 gap-1.5 md:gap-4 flex-shrink-0">
      <div className="bg-white p-2 md:p-4 rounded-lg shadow">
        <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Gesamt</p>
        <p className="text-base md:text-2xl font-bold text-gray-900">{stats.total}</p>
      </div>
      <div className="bg-white p-2 md:p-4 rounded-lg shadow">
        <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Offen</p>
        <p className="text-base md:text-2xl font-bold text-blue-600">
          {(stats.byStatus?.draft || 0) + (stats.byStatus?.sent || 0)}
        </p>
      </div>
      <div className="bg-white p-2 md:p-4 rounded-lg shadow">
        <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Angen.</p>
        <p className="text-base md:text-2xl font-bold text-green-600">{stats.byStatus?.accepted || 0}</p>
      </div>
      <div className="bg-white p-2 md:p-4 rounded-lg shadow">
        <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Wert €</p>
        <p className="text-base md:text-xl font-bold text-green-600">{formatCurrency(stats.acceptedValue)}</p>
      </div>
    </div>
  );
};

export default OfferStats;
