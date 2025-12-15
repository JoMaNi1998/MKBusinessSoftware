import React from 'react';
import { Search, Settings, X } from 'lucide-react';

const CustomerFilters = ({
  searchTerm,
  setSearchTerm,
  hasActiveFilters,
  resetFilters,
  showColumnSelector,
  setShowColumnSelector,
  visibleColumns,
  availableColumns,
  loadingPreferences,
  toggleColumn
}) => {
  return (
    <>
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
        {hasActiveFilters() && (
          <button
            onClick={resetFilters}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg flex-shrink-0"
            title="Filter zurücksetzen"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="relative column-settings-container">
        <button
          onClick={() => setShowColumnSelector(!showColumnSelector)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          title="Spalten auswählen"
        >
          <Settings className="h-5 w-5" />
        </button>

        {/* Spaltenauswahl-Dropdown */}
        {showColumnSelector && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Spalten auswählen</h4>
                {loadingPreferences && (
                  <div className="text-xs text-gray-500">Lädt...</div>
                )}
              </div>

              <div className="space-y-2">
                {availableColumns.map(column => (
                  <label key={column.key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={visibleColumns[column.key]}
                      onChange={() => !column.required && toggleColumn(column.key)}
                      disabled={column.required || loadingPreferences}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
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
                  Einstellungen werden automatisch in Firebase gespeichert
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export const CustomerMobileFilters = ({
  searchTerm,
  setSearchTerm,
  hasActiveFilters,
  resetFilters
}) => {
  return (
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
      {hasActiveFilters() && (
        <button
          onClick={resetFilters}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg flex-shrink-0"
          title="Filter zurücksetzen"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default CustomerFilters;
