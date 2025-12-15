import React, { useState, useRef, useEffect } from 'react';
import { Users, MoreVertical, Edit, Trash2, Receipt, Filter } from 'lucide-react';
import { OFFER_STATUS_LABELS } from '../../../context/OfferContext';
import { formatPrice, formatDate, getStatusColorClasses, getStatusLabel } from '../shared';

const OfferTable = ({
  offers,
  visibleColumns,
  statusFilter,
  onStatusFilterChange,
  getCustomerName,
  getProjectName,
  onView,
  onEdit,
  onDelete,
  onCreateInvoice,
  hasDepositInvoice
}) => {
  const [showActionsMenu, setShowActionsMenu] = useState(null);
  const [activeColumnFilter, setActiveColumnFilter] = useState(null);
  const filterRef = useRef(null);

  // Unique Statuses für Filter
  const uniqueStatuses = Object.entries(OFFER_STATUS_LABELS).map(([key, value]) => ({
    value: key,
    label: value.label
  }));

  // Click-Outside Handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setActiveColumnFilter(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusBadge = (status) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColorClasses(status)}`}>
      {getStatusLabel(status)}
    </span>
  );

  return (
    <div className="hidden md:block h-full overflow-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            {visibleColumns.angebot && (
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Angebot
              </th>
            )}
            {visibleColumns.kunde && (
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Kunde
              </th>
            )}
            {visibleColumns.projekt && (
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Projekt
              </th>
            )}
            {visibleColumns.betrag && (
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Betrag
              </th>
            )}
            {visibleColumns.status && (
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase relative">
                <div className="flex items-center justify-center gap-1">
                  <span>Status</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveColumnFilter(activeColumnFilter === 'status' ? null : 'status');
                    }}
                    className={`p-0.5 rounded hover:bg-gray-200 ${statusFilter !== 'all' ? 'text-blue-600' : 'text-gray-400'}`}
                  >
                    <Filter className="h-3 w-3" />
                  </button>
                </div>
                {activeColumnFilter === 'status' && (
                  <div ref={filterRef} className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          onStatusFilterChange('all');
                          setActiveColumnFilter(null);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded ${statusFilter === 'all' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                      >
                        Alle Status
                      </button>
                      {uniqueStatuses.map((status) => (
                        <button
                          key={status.value}
                          onClick={() => {
                            onStatusFilterChange(status.value);
                            setActiveColumnFilter(null);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-sm rounded ${statusFilter === status.value ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </th>
            )}
            {visibleColumns.datum && (
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Datum
              </th>
            )}
            {visibleColumns.aktionen && (
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Aktionen
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {offers.map((offer) => (
            <tr
              key={offer.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onView(offer)}
            >
              {visibleColumns.angebot && (
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">{offer.offerNumber}</span>
                  <span className="text-xs text-gray-500 block">v{offer.version || 1}</span>
                </td>
              )}
              {visibleColumns.kunde && (
                <td className="px-4 py-3 text-gray-600">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    {getCustomerName(offer.customerID)}
                  </div>
                </td>
              )}
              {visibleColumns.projekt && (
                <td className="px-4 py-3 text-gray-600">
                  {getProjectName(offer.projectID)}
                </td>
              )}
              {visibleColumns.betrag && (
                <td className="px-4 py-3 text-right font-medium">
                  {formatPrice(offer.totals?.grossTotal)}
                </td>
              )}
              {visibleColumns.status && (
                <td className="px-4 py-3 text-center">
                  {getStatusBadge(offer.status)}
                </td>
              )}
              {visibleColumns.datum && (
                <td className="px-4 py-3 text-gray-600 text-sm">
                  {formatDate(offer.createdAt)}
                </td>
              )}
              {visibleColumns.aktionen && (
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="relative inline-block">
                    <button
                      onClick={() => setShowActionsMenu(showActionsMenu === offer.id ? null : offer.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>

                    {showActionsMenu === offer.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowActionsMenu(null)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                onEdit(offer);
                                setShowActionsMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <Edit className="h-4 w-4 mr-3" />
                              Bearbeiten
                            </button>
                            <button
                              onClick={() => {
                                onCreateInvoice(offer);
                                setShowActionsMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-gray-100 flex items-center"
                            >
                              <Receipt className="h-4 w-4 mr-3" />
                              {hasDepositInvoice(offer.id) ? 'Schlussrechnung erstellen' : 'Anzahlungsrechnung erstellen'}
                            </button>
                            <button
                              onClick={() => {
                                onDelete(offer);
                                setShowActionsMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center"
                            >
                              <Trash2 className="h-4 w-4 mr-3" />
                              Löschen
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OfferTable;
