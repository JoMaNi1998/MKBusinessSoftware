import React from 'react';
import { ExternalLink, X, Check } from 'lucide-react';
import { formatPrice, getStatusColor, getStatusText } from '../shared/orderUtils';

const OrderCards = ({
  orderList,
  visibleColumns,
  isLoading,
  onOrder,
  onCancel
}) => {
  return (
    <div className="md:hidden h-full overflow-auto p-4 space-y-3">
      {orderList.map((material, index) => (
        <div
          key={`${material.id}-${material._displayType}-${index}`}
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
        >
          {/* Header: Material + Status */}
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{material.description}</p>
              <p className="text-sm text-gray-500">{material.materialID}</p>
            </div>
            {visibleColumns.status && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(material)}`}>
                {getStatusText(material)}
              </span>
            )}
          </div>

          {/* Hauptinformationen */}
          {(visibleColumns.stock || visibleColumns.orderQuantity || visibleColumns.price) && (
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              {visibleColumns.stock && (
                <div>
                  <span className="text-gray-500">Bestand:</span>
                  <span className={`ml-1 font-medium ${material.stock < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {material.stock}
                  </span>
                </div>
              )}
              {visibleColumns.orderQuantity && (
                <div>
                  <span className="text-gray-500">Menge:</span>
                  <span className="ml-1 font-medium text-gray-900">{material._displayQuantity}</span>
                </div>
              )}
              {visibleColumns.price && (
                <div>
                  <span className="text-gray-500">Preis:</span>
                  <span className="ml-1 font-medium text-gray-900">{formatPrice(material.price)}</span>
                </div>
              )}
            </div>
          )}

          {/* Zusätzliche Felder: Meldebestand, Stk/Einheit */}
          {(visibleColumns.heatStock || visibleColumns.itemsPerUnit) && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
              {visibleColumns.heatStock && (
                <span className="bg-gray-100 px-2 py-0.5 rounded">
                  Meldebestand: {material.heatStock || '-'}
                </span>
              )}
              {visibleColumns.itemsPerUnit && (
                <span className="bg-gray-100 px-2 py-0.5 rounded">
                  Stk/Einheit: {material.itemsPerUnit || '-'}
                </span>
              )}
            </div>
          )}

          {/* Link */}
          {visibleColumns.link && material.link && (
            <a
              href={material.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-xs text-primary-600 hover:text-primary-800 flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Link öffnen
            </a>
          )}

          {/* Aktionen */}
          {visibleColumns.actions && (
            <div className="mt-3 flex justify-end">
              {material._displayType === 'ordered' ? (
                <button
                  onClick={() => onCancel(material.id)}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-900 disabled:opacity-50 flex items-center space-x-1 text-sm"
                >
                  <X className="h-4 w-4" />
                  <span>Stornieren</span>
                </button>
              ) : material._displayType === 'additional' ? (
                <button
                  onClick={() => onOrder(material, true)}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-900 disabled:opacity-50 flex items-center space-x-1 text-sm"
                >
                  <Check className="h-4 w-4" />
                  <span>Nachbestellen</span>
                </button>
              ) : (
                <button
                  onClick={() => onOrder(material, false)}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-900 disabled:opacity-50 flex items-center space-x-1 text-sm"
                >
                  <Check className="h-4 w-4" />
                  <span>Bestellen</span>
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default OrderCards;
