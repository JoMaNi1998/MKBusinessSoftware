import React, { useState, useEffect } from 'react';
import { Search, Settings } from 'lucide-react';
import type { OrderListHeaderProps } from '../../../types/components/order.types';

const OrderListHeader: React.FC<OrderListHeaderProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter: _statusFilter,
  setStatusFilter: _setStatusFilter,
  visibleColumns,
  toggleColumn,
  availableColumns
}) => {
  const [showColumnSettings, setShowColumnSettings] = useState<boolean>(false);

  // Click-Outside Handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (showColumnSettings && !(event.target as HTMLElement).closest('.column-settings-container')) {
        setShowColumnSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColumnSettings]);

  return (
    <div className="p-4 border-b border-gray-200 flex-shrink-0 space-y-3 sm:space-y-0">
      <div className="flex items-center justify-between sm:gap-3">
        <h2 className="text-lg font-semibold text-gray-900 flex-shrink-0">Bestellliste</h2>

        {/* Desktop: Suche inline */}
        <div className="hidden sm:flex items-center gap-2 flex-1">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Suchen..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="relative column-settings-container">
          <button
            onClick={() => setShowColumnSettings(!showColumnSettings)}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
            title="Spalten anpassen"
          >
            <Settings className="h-5 w-5" />
          </button>
          {showColumnSettings && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-20 border border-gray-200">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Spalten anzeigen</h3>
                </div>
                <div className="space-y-2">
                  {availableColumns.map(column => (
                    <label key={column.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={visibleColumns[column.key]}
                        onChange={() => !column.required && toggleColumn(column.key)}
                        disabled={column.required}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className={`text-sm ${
                        column.required ? 'text-gray-400' : 'text-gray-700'
                      }`}>
                        {column.label}
                        {column.required && ' (erforderlich)'}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Einstellungen werden automatisch gespeichert
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Suche als zweite Zeile */}
      <div className="flex sm:hidden items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Suchen..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default OrderListHeader;
