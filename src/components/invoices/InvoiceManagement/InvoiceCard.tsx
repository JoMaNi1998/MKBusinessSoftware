import React, { ReactNode } from 'react';
import { formatCurrency, formatDate } from '@utils';

// Lokale Hilfsfunktion für Preisformatierung mit Fallback
const formatPrice = (price: number | string | null | undefined): string => {
  const formatted = formatCurrency(price);
  return formatted || '0,00 €';
};

interface InvoiceTotals {
  grossTotal?: number;
  [key: string]: any;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerID: string;
  status: string;
  invoiceDate: string;
  totals?: InvoiceTotals;
  offerNumber?: string;
  dueDate?: string;
  [key: string]: any;
}

interface VisibleColumns {
  kunde?: boolean;
  status?: boolean;
  betrag?: boolean;
  angebot?: boolean;
  faellig?: boolean;
  [key: string]: boolean | undefined;
}

interface StatusLabel {
  label: string;
  color: string;
}

interface InvoiceStatusLabels {
  [key: string]: StatusLabel;
}

interface InvoiceCardProps {
  filteredInvoices: Invoice[];
  visibleColumns: VisibleColumns;
  handleViewInvoice: (invoice: Invoice) => void;
  getCustomerName: (customerId: string) => string;
  INVOICE_STATUS_LABELS: InvoiceStatusLabels;
}

const getStatusBadge = (status: string, INVOICE_STATUS_LABELS: InvoiceStatusLabels): ReactNode => {
  const statusInfo = INVOICE_STATUS_LABELS[status] || { label: status, color: 'gray' };
  const colorClasses: { [key: string]: string } = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses[statusInfo.color]}`}>
      {statusInfo.label}
    </span>
  );
};

const InvoiceCard: React.FC<InvoiceCardProps> = ({
  filteredInvoices,
  visibleColumns,
  handleViewInvoice,
  getCustomerName,
  INVOICE_STATUS_LABELS
}) => {
  return (
    <div className="md:hidden h-full overflow-auto p-4 space-y-3">
      {filteredInvoices.map((invoice) => (
        <div
          key={invoice.id}
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm active:bg-gray-50"
          onClick={() => handleViewInvoice(invoice)}
        >
          {/* Header: Rechnung + Status */}
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
              {visibleColumns.kunde && (
                <p className="text-sm text-gray-500">{getCustomerName(invoice.customerID)}</p>
              )}
            </div>
            {visibleColumns.status && getStatusBadge(invoice.status, INVOICE_STATUS_LABELS)}
          </div>

          {/* Betrag + Datum */}
          {visibleColumns.betrag && (
            <div className="mt-3 flex justify-between items-center text-sm">
              <span className="text-gray-500">
                {formatDate(invoice.invoiceDate)}
              </span>
              <span className="font-bold text-gray-900">
                {formatPrice(invoice.totals?.grossTotal)}
              </span>
            </div>
          )}

          {/* Angebot */}
          {visibleColumns.angebot && invoice.offerNumber && (
            <div className="mt-2 text-xs text-gray-500">
              Angebot: {invoice.offerNumber}
            </div>
          )}

          {/* Fällig */}
          {visibleColumns.faellig && invoice.dueDate && (
            <div className="mt-1 text-xs text-gray-400">
              Fällig: {formatDate(invoice.dueDate)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default InvoiceCard;
