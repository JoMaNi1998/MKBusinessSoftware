import React from 'react';
import { Search } from 'lucide-react';

const BookingFilters = ({
  searchTerm,
  setSearchTerm,
  dateFilter,
  setDateFilter,
  typeFilter,
  setTypeFilter
}) => {
  return (
    <div className="p-4 border-b border-gray-200 flex-shrink-0 space-y-3 sm:space-y-0">
      <div className="flex items-center justify-between sm:gap-3">
        <h3 className="text-lg font-medium text-gray-900 flex-shrink-0">Buchungsliste</h3>

        {/* Desktop: Suche und Filter inline */}
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

        <div className="hidden sm:flex items-center gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="alle">Alle</option>
            <option value="heute">Heute</option>
            <option value="woche">Woche</option>
            <option value="monat">Monat</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="alle">Alle</option>
            <option value="Eingang">Eingänge</option>
            <option value="Ausgang">Ausgänge</option>
          </select>
        </div>
      </div>

      {/* Mobile: Suche und Filter als zweite/dritte Zeile */}
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
      <div className="flex sm:hidden items-center gap-2">
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="alle">Alle</option>
          <option value="heute">Heute</option>
          <option value="woche">Woche</option>
          <option value="monat">Monat</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="alle">Alle</option>
          <option value="Eingang">Eingänge</option>
          <option value="Ausgang">Ausgänge</option>
        </select>
      </div>
    </div>
  );
};

export default BookingFilters;
