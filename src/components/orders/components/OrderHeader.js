import React from 'react';
import { ShoppingCart, Plus, ListPlus } from 'lucide-react';

const OrderHeader = ({
  toOrderCount,
  isLoading,
  onAddToList,
  onDirectOrder,
  onBulkOrder
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="pl-12 sm:pl-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bestellungen</h1>
        <p className="text-gray-600 hidden sm:block">Materialien bestellen und Bestellstatus verwalten</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onAddToList}
          className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <ListPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Zur Liste</span>
        </button>
        <button
          onClick={onDirectOrder}
          className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Direkt bestellen</span>
        </button>
        <button
          onClick={onBulkOrder}
          disabled={isLoading || toOrderCount === 0}
          className="bg-primary-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          <span className="hidden sm:inline">Alle bestellen ({toOrderCount})</span>
          <span className="sm:hidden">{toOrderCount}</span>
        </button>
      </div>
    </div>
  );
};

export default OrderHeader;
