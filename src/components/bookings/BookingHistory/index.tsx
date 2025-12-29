import React from 'react';
import { History } from 'lucide-react';
import { useBookingHistory } from '@hooks';
import BookingStats from './BookingStats';
import BookingFilters from './BookingFilters';
import BookingCard from './BookingCard';

const BookingHistory: React.FC = () => {
  const {
    searchTerm,
    setSearchTerm,
    dateFilter,
    setDateFilter,
    typeFilter,
    setTypeFilter,
    currentPage,
    setCurrentPage,
    stats,
    filteredHistory,
    paginatedHistory,
    totalPages,
    startIndex,
    itemsPerPage,
    undoingBookingId,
    handleUndoBooking
  } = useBookingHistory();

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="pl-12 sm:pl-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Buchungshistorie</h1>
          <p className="mt-1 text-sm text-gray-600 hidden sm:block">
            Übersicht über alle Material-Buchungen und Bewegungen
          </p>
        </div>
      </div>

      {/* Statistiken */}
      <BookingStats stats={stats} />

      {/* Buchungsliste */}
      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col">
        {/* Filter */}
        <BookingFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
        />

        {/* Scrollbare Liste */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            <div className="space-y-4 p-6">
              {paginatedHistory.map((entry) => (
                <BookingCard
                  key={entry.id}
                  entry={entry}
                  onUndo={handleUndoBooking}
                  isUndoing={undoingBookingId === entry.id}
                />
              ))}

              {paginatedHistory.length === 0 && (
                <div className="text-center py-12">
                  <History className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Buchungen gefunden</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || dateFilter !== 'alle' || typeFilter !== 'alle'
                      ? 'Versuchen Sie andere Filter oder Suchbegriffe.'
                      : 'Es wurden noch keine Buchungen durchgeführt.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="text-sm text-gray-700">
              Zeige {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredHistory.length)} von {filteredHistory.length} Buchungen
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Zurück
              </button>
              <span className="text-sm text-gray-700">
                Seite {currentPage} von {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Weiter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistory;
