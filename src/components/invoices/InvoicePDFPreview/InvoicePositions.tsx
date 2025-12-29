import React from 'react';
import { formatCurrency } from '@utils';

// Lokale Hilfsfunktion für Preisformatierung mit Fallback
const formatPrice = (price: number | string | null | undefined): string => {
  const formatted = formatCurrency(price);
  return formatted || '0,00 €';
};

interface InvoiceItem {
  id?: string;
  position?: number;
  shortText: string;
  longText?: string;
  quantity: number;
  unit: string;
  unitPriceNet: number;
  totalNet: number;
  [key: string]: any;
}

interface InvoicePositionsProps {
  items: InvoiceItem[] | null | undefined;
}

const InvoicePositions: React.FC<InvoicePositionsProps> = ({ items }) => {
  return (
    <div className="mb-8">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="py-2 text-left font-medium text-gray-700 w-12">Pos.</th>
            <th className="py-2 text-left font-medium text-gray-700">Beschreibung</th>
            <th className="py-2 text-right font-medium text-gray-700 w-16">Menge</th>
            <th className="py-2 text-center font-medium text-gray-700 w-16">Einheit</th>
            <th className="py-2 text-right font-medium text-gray-700 w-24">EP (netto)</th>
            <th className="py-2 text-right font-medium text-gray-700 w-28">Gesamt</th>
          </tr>
        </thead>
        <tbody>
          {(items || []).map((item, index) => (
            <tr key={item.id || index} className="border-b border-gray-100 print-no-break">
              <td className="py-3 text-gray-600">{item.position || index + 1}</td>
              <td className="py-3">
                <p className="font-medium text-gray-900">{item.shortText}</p>
                {item.longText && (
                  <p className="text-xs text-gray-500 mt-1">{item.longText}</p>
                )}
              </td>
              <td className="py-3 text-right">{item.quantity}</td>
              <td className="py-3 text-center text-gray-600">{item.unit}</td>
              <td className="py-3 text-right">{formatPrice(item.unitPriceNet)}</td>
              <td className="py-3 text-right font-medium">{formatPrice(item.totalNet)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoicePositions;
