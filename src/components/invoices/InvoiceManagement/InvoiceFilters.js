import React from 'react';
import { Search, Settings } from 'lucide-react';
import { availableColumns } from './useInvoiceManagement';

const InvoiceFilters = ({
  searchTerm,
  setSearchTerm,
  visibleColumns,
  showColumnSettings,
  setShowColumnSettings,
  toggleColumn,
  columnSettingsRef
}) => {
  return (
    <div className="p-4 border-b border-gray-200 flex-shrink-0 space-y-3 sm:space-y-0">
      <div className="flex items-center justify-between sm:gap-3">
        <h2 className="text-lg font-semibold text-gray-900 flex-shrink-0">Rechnungsliste</h2>

        {/* Desktop: Suche inline */}
        <div className="hidden sm:flex items-center gap-2 flex-1">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="relative column-settings-container" ref={columnSettingsRef}>
          <button
            onClick={() => setShowColumnSettings(!showColumnSettings)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            title="Spalteneinstellungen"
          >
            <Settings className="h-5 w-5" />
          </button>
          {showColumnSettings && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
              <div className="p-3 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-900">Sichtbare Spalten</h4>
              </div>
              <div className="p-2 max-h-64 overflow-auto">
                {availableColumns.map((column) => (
                  <label
                    key={column.key}
                    className={`flex items-center px-2 py-1.5 rounded hover:bg-gray-50 ${column.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns[column.key]}
                      onChange={() => toggleColumn(column.key)}
                      disabled={column.required}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{column.label}</span>
                    {column.required && (
                      <span className="ml-auto text-xs text-gray-400">Pflicht</span>
                    )}
                  </label>
                ))}
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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default InvoiceFilters;
