/**
 * BOMReadOnlyTable - Read-Only Stücklisten-Tabelle
 *
 * Zeigt eine Kategorie von BOM-Items ohne Bearbeitungsmöglichkeit.
 * Optimiert für Anzeige und Druck.
 */

import React from 'react';
import type { AggregatedMaterial } from '@services/BookingAggregationService';

interface BOMReadOnlyTableProps {
  items: AggregatedMaterial[];
  title: string;
  startIndex?: number;
  colorClass?: string;
}

const BOMReadOnlyTable: React.FC<BOMReadOnlyTableProps> = ({
  items,
  title,
  startIndex = 0,
  colorClass = 'bg-gray-50'
}) => {
  if (items.length === 0) return null;

  // Farbe für Header basierend auf colorClass
  const headerColors: Record<string, { bg: string; border: string; text: string }> = {
    'bg-green-50': { bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-800' },
    'bg-blue-50': { bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-800' },
    'bg-gray-50': { bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-800' }
  };

  const colors = headerColors[colorClass] || headerColors['bg-gray-50'];

  return (
    <div className={`border ${colors.border} rounded-lg overflow-hidden print:rounded-none print:border-gray-300`}>
      {/* Header */}
      <div className={`${colors.bg} px-4 py-2 border-b ${colors.border} print:bg-gray-100 print:border-gray-300`}>
        <h4 className={`font-semibold ${colors.text} text-sm print:text-black`}>
          {title}
          <span className="ml-2 text-xs font-normal text-gray-500 print:text-gray-600">
            ({items.length} Position{items.length !== 1 ? 'en' : ''})
          </span>
        </h4>
      </div>

      {/* Tabelle */}
      <table className="w-full border-collapse print-table">
        <thead>
          <tr className="bg-gray-50 print:bg-gray-100">
            <th className="border border-gray-200 print:border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 print:text-black uppercase w-16">
              Pos.
            </th>
            <th className="border border-gray-200 print:border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 print:text-black uppercase">
              Material
            </th>
            <th className="border border-gray-200 print:border-gray-300 px-4 py-2 text-center text-xs font-medium text-gray-500 print:text-black uppercase w-32">
              Stk/Einheit
            </th>
            <th className="border border-gray-200 print:border-gray-300 px-4 py-2 text-center text-xs font-medium text-gray-500 print:text-black uppercase w-24">
              Anzahl
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 print:divide-gray-300">
          {items.map((item, index) => (
            <tr key={item.materialId || item.materialID} className="hover:bg-gray-50 print:hover:bg-white">
              {/* Position */}
              <td className="border border-gray-200 print:border-gray-300 px-4 py-2 text-gray-900 print:text-black text-center text-sm">
                {startIndex + index + 1}
              </td>

              {/* Material */}
              <td className="border border-gray-200 print:border-gray-300 px-4 py-2 align-top">
                <div>
                  <p className="font-medium text-gray-900 print:text-black text-sm">
                    {item.description}
                  </p>
                  <p className="text-xs text-gray-500 print:text-gray-600">
                    {item.materialID}
                  </p>
                </div>
              </td>

              {/* Stk/Einheit */}
              <td className="border border-gray-200 print:border-gray-300 px-4 py-2 text-gray-900 print:text-black text-center text-sm">
                {item.itemsPerUnit || 1} {item.unit}
              </td>

              {/* Anzahl (Netto = OUT - IN) */}
              <td className="border border-gray-200 print:border-gray-300 px-4 py-2 text-gray-900 print:text-black text-center text-sm font-medium">
                {item.netQuantity}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BOMReadOnlyTable;
