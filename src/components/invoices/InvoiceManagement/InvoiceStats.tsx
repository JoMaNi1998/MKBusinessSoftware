import React from 'react';
import { formatCurrency } from '@utils';

// Lokale Hilfsfunktion für Preisformatierung mit Fallback
const formatPrice = (price: number | string | null | undefined): string => {
  const formatted = formatCurrency(price);
  return formatted || '0,00 €';
};

interface StatusStats {
  sent?: number;
  overdue?: number;
  paid?: number;
  [key: string]: number | undefined;
}

interface InvoiceStatsData {
  total: number;
  byStatus?: StatusStats;
  openValue: number;
}

interface InvoiceStatsProps {
  stats: InvoiceStatsData;
}

const InvoiceStats: React.FC<InvoiceStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-4 md:grid-cols-4 gap-1.5 md:gap-4 flex-shrink-0">
      <div className="bg-white rounded-lg shadow p-2 md:p-4">
        <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Gesamt</p>
        <p className="text-base md:text-2xl font-bold text-gray-900">{stats.total}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-2 md:p-4">
        <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Offen</p>
        <p className="text-base md:text-2xl font-bold text-blue-600">
          {(stats.byStatus?.sent || 0) + (stats.byStatus?.overdue || 0)}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-2 md:p-4">
        <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Bezahlt</p>
        <p className="text-base md:text-2xl font-bold text-green-600">{stats.byStatus?.paid || 0}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-2 md:p-4">
        <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Offen €</p>
        <p className="text-base md:text-xl font-bold text-orange-600">{formatPrice(stats.openValue)}</p>
      </div>
    </div>
  );
};

export default InvoiceStats;
