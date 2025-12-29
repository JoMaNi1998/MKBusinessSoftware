import React from 'react';
import { Package } from 'lucide-react';
import type { OrderEmptyStateProps } from '../../../types/components/order.types';

const OrderEmptyState: React.FC<OrderEmptyStateProps> = ({ hasFilters }) => {
  return (
    <div className="p-8 text-center text-gray-500">
      <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <p>{hasFilters ? 'Keine Materialien gefunden' : 'Keine Materialien in der Bestellliste'}</p>
    </div>
  );
};

export default OrderEmptyState;
