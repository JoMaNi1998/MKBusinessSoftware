import React, { MouseEvent } from 'react';
import { ExternalLink } from 'lucide-react';
import { getStockStatusColor, getStockStatusText, formatPrice } from '@utils';
import type { MaterialCardsProps } from '@app-types/components/material.types';

const MaterialCards: React.FC<MaterialCardsProps> = ({
  materials,
  categories,
  visibleColumns,
  onMaterialClick
}) => {
  return (
    <div className="md:hidden h-full overflow-auto p-4 space-y-3">
      {materials.map((material) => {
        const categoryName = categories.find(cat => cat.id === material.categoryId)?.name || 'Unbekannt';
        const stockStatus = getStockStatusText(material.stock, material.heatStock, material.orderStatus);
        const stockColor = getStockStatusColor(material.stock, material.heatStock, material.orderStatus);

        return (
          <div
            key={material.id}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm active:bg-gray-50"
            onClick={() => onMaterialClick(material)}
          >
            {/* Header: Beschreibung + ID + Bestand */}
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{material.description}</p>
                <p className="text-sm text-gray-500">{material.materialID}</p>
              </div>
              {visibleColumns.stock && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${stockColor}`}>
                  {material.stock} Stk
                </span>
              )}
            </div>

            {/* Kategorie + Preis */}
            {(visibleColumns.category || visibleColumns.price) && (
              <div className="mt-3 flex items-center justify-between text-sm">
                {visibleColumns.category && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {categoryName}
                  </span>
                )}
                {visibleColumns.price && (
                  <span className="font-medium text-gray-900">
                    {formatPrice(material.price) ? `${formatPrice(material.price)} €` : '-'}
                  </span>
                )}
              </div>
            )}

            {/* Hersteller + Status */}
            {(visibleColumns.manufacturer || visibleColumns.status) && (
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                {visibleColumns.manufacturer && (
                  <span>{material.manufacturer || '-'}</span>
                )}
                {visibleColumns.status && (
                  <span className={`px-2 py-0.5 rounded-full ${stockColor}`}>{stockStatus}</span>
                )}
              </div>
            )}

            {/* EAN */}
            {visibleColumns.ean && material.ean && (
              <div className="mt-2 text-xs text-gray-500 font-mono">
                EAN: {material.ean}
              </div>
            )}

            {/* Link */}
            {visibleColumns.link && material.link && (
              <a
                href={material.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-xs text-primary-600 hover:text-primary-800 flex items-center"
                onClick={(e: MouseEvent) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Link öffnen
              </a>
            )}

            {/* Zusätzliche Felder */}
            {(visibleColumns.orderQuantity || visibleColumns.itemsPerUnit || visibleColumns.type) && (
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                {visibleColumns.orderQuantity && (
                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                    Bestell: {material.orderQuantity || '-'}
                  </span>
                )}
                {visibleColumns.itemsPerUnit && (
                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                    Stk/Einh: {material.itemsPerUnit || '-'}
                  </span>
                )}
                {visibleColumns.type && (
                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                    Typ: {material.type || '-'}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MaterialCards;
