import React from 'react';
import type { OrderStatsProps } from '../../../types/components/order.types';

const OrderStats: React.FC<OrderStatsProps> = ({ stats }) => {
  const { toOrderCount, orderedCount, excludedLowStockCount, totalCount } = stats;

  return (
    <div className="grid grid-cols-4 md:grid-cols-4 gap-1.5 md:gap-4">
      <div className="bg-white p-2 md:p-4 rounded-lg shadow">
        <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Bestellen</p>
        <p className="text-base md:text-2xl font-bold text-orange-600">{toOrderCount}</p>
      </div>
      <div className="bg-white p-2 md:p-4 rounded-lg shadow">
        <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Bestellt</p>
        <p className="text-base md:text-2xl font-bold text-blue-600">{orderedCount}</p>
      </div>
      <div className="bg-white p-2 md:p-4 rounded-lg shadow">
        <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Ausgeschl.</p>
        <p className="text-base md:text-2xl font-bold text-amber-600">{excludedLowStockCount}</p>
      </div>
      <div className="bg-white p-2 md:p-4 rounded-lg shadow">
        <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Gesamt</p>
        <p className="text-base md:text-2xl font-bold text-gray-900">{totalCount}</p>
      </div>
    </div>
  );
};

export default OrderStats;
