import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Calendar,
  User,
  Package,
  Building,
  TrendingDown,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { useBookings } from '../context/BookingContext';
import { useNotification } from '../context/NotificationContext';

const ITEMS_PER_PAGE = 20;

// Hilfsfunktion um Timestamp zu Date zu konvertieren (Firebase Timestamp Support)
const parseTimestamp = (timestamp) => {
  if (!timestamp) return null;

  if (timestamp instanceof Date) {
    return timestamp;
  } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    return new Date(timestamp);
  } else if (timestamp.seconds) {
    // Firebase Timestamp
    return new Date(timestamp.seconds * 1000);
  } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    // Firebase Timestamp mit toDate() Methode
    return timestamp.toDate();
  }
  return null;
};

const BookingHistory = () => {
  const { bookings, undoBooking, getBookingStatistics } = useBookings();
  const { showNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('monat'); // Standard: Letzter Monat statt alle
  const [typeFilter, setTypeFilter] = useState('alle');
  const [currentPage, setCurrentPage] = useState(1);

  const bookingHistory = bookings;
  const stats = getBookingStatistics();

  const filteredHistory = bookingHistory.filter(entry => {
    const matchesSearch = entry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.customerID.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (entry.projectName && entry.projectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         entry.materials.some(m => 
                           m.materialID.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           m.description.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    const matchesType = typeFilter === 'alle' || entry.type === typeFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'alle') {
      const entryDate = parseTimestamp(entry.timestamp);
      const today = new Date();

      if (!entryDate || isNaN(entryDate.getTime())) {
        matchesDate = false; // Ungültiges Datum ausfiltern
      } else {
        switch (dateFilter) {
          case 'heute':
            matchesDate = entryDate.toDateString() === today.toDateString();
            break;
          case 'woche': {
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = entryDate >= weekAgo;
            break;
          }
          case 'monat': {
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = entryDate >= monthAgo;
            break;
          }
          default:
            matchesDate = true; // Alle anzeigen wenn kein Filter
            break;
        }
      }
    }
    
    return matchesSearch && matchesType && matchesDate;
  });

  // Pagination berechnen
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Seite zurücksetzen wenn Filter sich ändern
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, typeFilter]);

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'Unbekannt';
    
    try {
      // Verschiedene Datumsformate unterstützen
      let dateObj;
      
      if (timestamp instanceof Date) {
        dateObj = timestamp;
      } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        dateObj = new Date(timestamp);
      } else if (timestamp.seconds) {
        // Firebase Timestamp
        dateObj = new Date(timestamp.seconds * 1000);
      } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        // Firebase Timestamp mit toDate() Methode
        dateObj = timestamp.toDate();
      } else {
        return 'Ungültiges Datum';
      }
      
      // Prüfen ob das Datum gültig ist
      if (isNaN(dateObj.getTime())) {
        return 'Ungültiges Datum';
      }
      
      return dateObj.toLocaleString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Fehler beim Formatieren des Datums:', error, timestamp);
      return 'Ungültiges Datum';
    }
  };

  const getTypeIcon = (type) => {
    return type === 'Eingang' ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getTypeColor = (type) => {
    return type === 'Eingang' ? 
      'bg-green-100 text-green-800' : 
      'bg-red-100 text-red-800';
  };

  const handleUndoBooking = (bookingId) => {
    // Prüfen ob Buchung noch existiert (Idempotenz)
    const bookingExists = bookings.some(b => b.id === bookingId);
    if (!bookingExists) {
      showNotification('Buchung existiert nicht mehr', 'warning');
      return;
    }

    if (window.confirm('Buchung wirklich rückgängig machen?')) {
      undoBooking(bookingId);
      showNotification('Buchung erfolgreich rückgängig gemacht', 'success');
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="pl-12 sm:pl-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Buchungshistorie</h1>
          <p className="mt-1 text-sm text-gray-600 hidden sm:block">
            Übersicht über alle Material-Buchungen und Bewegungen
          </p>
        </div>
      </div>

      {/* Statistiken - Kompakt auf Mobile */}
      <div className="grid grid-cols-4 md:grid-cols-4 gap-1.5 md:gap-4">
        <div className="bg-white p-2 md:p-4 rounded-lg shadow">
          <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Gesamt</p>
          <p className="text-base md:text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-2 md:p-4 rounded-lg shadow">
          <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Eingänge</p>
          <p className="text-base md:text-2xl font-bold text-green-600">{stats.eingaenge}</p>
        </div>
        <div className="bg-white p-2 md:p-4 rounded-lg shadow">
          <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Ausgänge</p>
          <p className="text-base md:text-2xl font-bold text-red-600">{stats.ausgaenge}</p>
        </div>
        <div className="bg-white p-2 md:p-4 rounded-lg shadow">
          <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Heute</p>
          <p className="text-base md:text-2xl font-bold text-blue-600">{stats.heute}</p>
        </div>
      </div>

      {/* Filter und Suche */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Suchen (Kunde, Projekt, Material)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Buchungsliste */}
      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col">
        {/* Fixierter Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b border-gray-200 flex-shrink-0 gap-3">
          <h3 className="text-lg font-medium text-gray-900">Buchungsliste</h3>
          <div className="flex items-center gap-2 flex-wrap">
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
        
        {/* Scrollbare Liste */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
              <div className="space-y-4 p-6">
                {paginatedHistory.map((entry) => (
                  <div key={entry.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getTypeIcon(entry.type)}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(entry.type)}`}>
                            {entry.type}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDateTime(entry.timestamp)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 mb-3">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {entry.customerName}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({entry.customerID})
                          </span>
                        </div>

                        {/* Projekt anzeigen falls vorhanden */}
                        {entry.projectName && entry.projectName !== 'Unbekannt' ? (
                          <div className="flex items-center space-x-2 mb-3">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-blue-900">
                              Projekt: {entry.projectName}
                            </span>
                          </div>
                        ) : entry.projectID && (
                          <div className="flex items-center space-x-2 mb-3">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-blue-900">
                              Projekt-ID: {entry.projectID}
                            </span>
                          </div>
                        )}

                        <div className="space-y-2">
                          {entry.materials.map((material, index) => (
                            <div key={index} className="flex items-center space-x-3 text-sm">
                              <Package className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900">
                                {material.quantity}x
                              </span>
                              <span className="font-medium text-gray-900">
                                {material.description}
                              </span>
                              <span className="text-gray-500 text-xs">
                                {material.materialID}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUndoBooking(entry.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Buchung rückgängig machen"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
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
              Zeige {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredHistory.length)} von {filteredHistory.length} Buchungen
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Zurück
              </button>
              <span className="text-sm text-gray-700">
                Seite {currentPage} von {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
