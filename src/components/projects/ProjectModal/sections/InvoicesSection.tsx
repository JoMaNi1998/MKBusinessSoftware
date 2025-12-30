import React from 'react';
import { Receipt, Eye } from 'lucide-react';
import { cn } from '@utils/customerHelpers';
import { formatDate, formatPrice } from '@utils';
import { INVOICE_STATUS_LABELS } from '@context/InvoiceContext';
import type { InvoicesSectionProps } from '@app-types/components/project.types';

const getInvoiceStatusColor = (status: string): string => {
  const config = INVOICE_STATUS_LABELS[status as keyof typeof INVOICE_STATUS_LABELS];
  if (!config) return 'bg-gray-100 text-gray-800';

  const colorMap: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    orange: 'bg-orange-100 text-orange-800'
  };

  return colorMap[config.color] || 'bg-gray-100 text-gray-800';
};

const getInvoiceStatusLabel = (status: string): string => {
  const config = INVOICE_STATUS_LABELS[status as keyof typeof INVOICE_STATUS_LABELS];
  return config?.label || status;
};

const InvoicesSection: React.FC<InvoicesSectionProps> = ({
  invoices,
  loading,
  onInvoiceClick
}) => {
  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Lade Rechnungen...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-8">
          <Receipt className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Rechnungen</h3>
          <p className="mt-1 text-sm text-gray-500">
            Für dieses Projekt wurden noch keine Rechnungen erstellt.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
              onClick={() => onInvoiceClick(invoice)}
            >
              <div className="flex items-center space-x-3">
                <Receipt className="h-4 w-4 text-green-500" />
                <span className="font-medium text-gray-900">
                  {invoice.invoiceNumber || 'Rechnung'}
                </span>
                {invoice.status && (
                  <span className={cn('px-2 py-0.5 rounded-full text-xs', getInvoiceStatusColor(invoice.status))}>
                    {getInvoiceStatusLabel(invoice.status)}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {invoice.totals?.grossTotal !== undefined && (
                  <span className="text-sm font-medium text-gray-700">
                    {formatPrice(invoice.totals.grossTotal)}
                  </span>
                )}
                <span className="text-sm text-gray-500">
                  {formatDate(invoice.invoiceDate || invoice.createdAt)}
                </span>
                <Eye className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoicesSection;
