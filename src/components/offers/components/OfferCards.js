import React from 'react';
import { formatPrice, formatDate, getStatusColorClasses, getStatusLabel } from '../shared';

const OfferCards = ({
  offers,
  visibleColumns,
  getCustomerName,
  getProjectName,
  onView
}) => {
  const getStatusBadge = (status) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColorClasses(status)}`}>
      {getStatusLabel(status)}
    </span>
  );

  return (
    <div className="md:hidden h-full overflow-auto p-4 space-y-3">
      {offers.map((offer) => (
        <div
          key={offer.id}
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm active:bg-gray-50"
          onClick={() => onView(offer)}
        >
          {/* Header: Angebot + Status */}
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{offer.offerNumber}</p>
              {visibleColumns.kunde && (
                <p className="text-sm text-gray-500">{getCustomerName(offer.customerID)}</p>
              )}
            </div>
            {visibleColumns.status && getStatusBadge(offer.status)}
          </div>

          {/* Projekt */}
          {visibleColumns.projekt && offer.projectID && (
            <div className="mt-2 text-sm text-gray-600">
              {getProjectName(offer.projectID)}
            </div>
          )}

          {/* Datum + Betrag */}
          {(visibleColumns.datum || visibleColumns.betrag) && (
            <div className="mt-3 flex justify-between items-center text-sm">
              {visibleColumns.datum && (
                <span className="text-gray-500">
                  {formatDate(offer.createdAt)}
                </span>
              )}
              {visibleColumns.betrag && (
                <span className="font-bold text-gray-900">
                  {formatPrice(offer.totals?.grossTotal)}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default OfferCards;
