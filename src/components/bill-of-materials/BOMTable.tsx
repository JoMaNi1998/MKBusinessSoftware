import React from 'react';
import { Trash2 } from 'lucide-react';
import type { BOMTableProps } from '@app-types/components/bom.types';

const BOMTable: React.FC<BOMTableProps> = ({
  items,
  title,
  bgColor,
  borderColor,
  startIndex = 0,
  onQuantityChange,
  onRemoveItem
}) => {
  if (items.length === 0) return null;

  return (
    <div className={`border ${borderColor} rounded-lg overflow-hidden print:rounded-none print:border-0`}>
      <div className={`${bgColor} px-4 py-2 border-b ${borderColor} print:bg-gray-100 print:border-gray-300`}>
        <h4 className="font-semibold text-gray-800 text-sm print:text-black">
          {title}
          <span className="ml-2 text-xs font-normal text-gray-500 print:text-gray-600">({items.length} Positionen)</span>
        </h4>
      </div>
      <table className="w-full border-collapse print-table">
        <thead>
          <tr className="bg-gray-50 print:bg-gray-100">
            <th className="border border-gray-200 print:border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 print:text-black uppercase w-16">
              Pos.
            </th>
            <th className="border border-gray-200 print:border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 print:text-black uppercase">
              Material
            </th>
            <th className="border border-gray-200 print:border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 print:text-black uppercase w-32">
              Stk/Einheit
            </th>
            <th className="border border-gray-200 print:border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 print:text-black uppercase w-24">
              Anzahl
            </th>
            <th className="border border-gray-200 px-4 py-2 text-center w-16 print:hidden">
              Aktion
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 print:divide-gray-300">
          {items.map((item, index) => (
            <tr key={item.id} className="hover:bg-gray-50 print:hover:bg-white">
              <td className="border border-gray-200 print:border-gray-300 px-4 py-2 text-gray-900 print:text-black text-center text-sm">
                {startIndex + index + 1}
              </td>
              <td className="border border-gray-200 print:border-gray-300 px-4 py-2 align-top">
                <div>
                  <p className="font-medium text-gray-900 print:text-black text-sm">
                    {item.description}
                  </p>
                  <p className="text-xs text-gray-500 print:text-gray-600">{item.materialID}</p>
                </div>
              </td>
              <td className="border border-gray-200 print:border-gray-300 px-4 py-2 text-gray-900 print:text-black text-center text-sm">
                {item.itemsPerUnit || 1}
              </td>
              <td className="border border-gray-200 print:border-gray-300 px-4 py-2 text-gray-900 print:text-black">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onQuantityChange(item.id, e.target.value)}
                  className="print:hidden w-full px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="1"
                />
                <span className="hidden print:block text-center text-sm">
                  {item.quantity}
                </span>
              </td>
              <td className="border border-gray-200 px-4 py-2 text-center print:hidden">
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Position entfernen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BOMTable;
