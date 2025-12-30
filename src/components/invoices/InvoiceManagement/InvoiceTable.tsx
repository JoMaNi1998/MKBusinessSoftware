import React, { ReactNode, MouseEvent } from 'react';
import { Users, Filter, MoreVertical } from 'lucide-react';
import { formatCurrency, formatDate } from '@utils';
import InvoiceActionsMenu from './InvoiceActionsMenu';

// Lokale Hilfsfunktion für Preisformatierung mit Fallback
const formatPrice = (price: number | string | null | undefined): string => {
  const formatted = formatCurrency(price);
  return formatted || '0,00 €';
};

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerID: string;
  status: string;
  invoiceDate: string;
  totals?: { grossTotal?: number; [key: string]: any };
  offerNumber?: string;
  dueDate?: string;
  offerID?: string | null;
  [key: string]: any;
}

interface VisibleColumns {
  rechnung?: boolean;
  kunde?: boolean;
  angebot?: boolean;
  betrag?: boolean;
  status?: boolean;
  faellig?: boolean;
  aktionen?: boolean;
  [key: string]: boolean | undefined;
}

interface StatusInfo {
  label: string;
  color: string;
}

interface InvoiceStatusLabels {
  [key: string]: StatusInfo;
}

interface InvoiceStatusMap {
  [key: string]: string;
}

interface UniqueStatus {
  value: string;
  label: string;
}

interface InvoiceTableProps {
  filteredInvoices: Invoice[];
  visibleColumns: VisibleColumns;
  handleViewInvoice: (invoice: Invoice) => void;
  handleEditInvoice: (invoice: Invoice) => void;
  handleDeleteClick: (invoice: Invoice) => void;
  handleStatusChange: (invoice: Invoice, newStatus: string) => void;
  showActionsMenu: string | null;
  setShowActionsMenu: (id: string | null) => void;
  getCustomerName: (customerId: string) => string;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  activeColumnFilter: string | null;
  setActiveColumnFilter: (filter: string | null) => void;
  handleColumnFilterChange: (column: string, value: string) => void;
  uniqueStatuses: UniqueStatus[];
  filterRef: React.RefObject<HTMLDivElement | null>;
  INVOICE_STATUS: InvoiceStatusMap;
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

const InvoiceTable: React.FC<InvoiceTableProps> = ({
  filteredInvoices,
  visibleColumns,
  handleViewInvoice,
  handleEditInvoice,
  handleDeleteClick,
  handleStatusChange,
  showActionsMenu,
  setShowActionsMenu,
  getCustomerName,
  statusFilter,
  setStatusFilter: _setStatusFilter,
  activeColumnFilter,
  setActiveColumnFilter,
  handleColumnFilterChange,
  uniqueStatuses,
  filterRef,
  INVOICE_STATUS,
  INVOICE_STATUS_LABELS
}) => {
  return (
    <div className="hidden md:block h-full overflow-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            {visibleColumns.rechnung && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rechnung
              </th>
            )}
            {visibleColumns.kunde && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kunde
              </th>
            )}
            {visibleColumns.angebot && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Angebot
              </th>
            )}
            {visibleColumns.betrag && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Betrag
              </th>
            )}
            {visibleColumns.status && (
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                <div className="flex items-center justify-center gap-1">
                  <span>Status</span>
                  <button
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation();
                      setActiveColumnFilter(activeColumnFilter === 'status' ? null : 'status');
                    }}
                    className={`p-0.5 rounded hover:bg-gray-200 ${statusFilter !== 'all' ? 'text-blue-600' : 'text-gray-400'}`}
                  >
                    <Filter className="h-3 w-3" />
                  </button>
                </div>
                {activeColumnFilter === 'status' && (
                  <div ref={filterRef as React.RefObject<HTMLDivElement>} className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
                    <div className="p-2">
                      <button
                        onClick={() => handleColumnFilterChange('status', 'all')}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded ${statusFilter === 'all' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                      >
                        Alle Status
                      </button>
                      {uniqueStatuses.map((status) => (
                        <button
                          key={status.value}
                          onClick={() => handleColumnFilterChange('status', status.value)}
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
            {visibleColumns.faellig && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fällig am
              </th>
            )}
            {visibleColumns.aktionen && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredInvoices.map((invoice) => (
            <tr
              key={invoice.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => handleViewInvoice(invoice)}
            >
              {visibleColumns.rechnung && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                  <span className="text-xs text-gray-500 block">{formatDate(invoice.invoiceDate)}</span>
                </td>
              )}
              {visibleColumns.kunde && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {getCustomerName(invoice.customerID)}
                </td>
              )}
              {visibleColumns.angebot && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {invoice.offerNumber || '-'}
                </td>
              )}
              {visibleColumns.betrag && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                  {formatPrice(invoice.totals?.grossTotal)}
                </td>
              )}
              {visibleColumns.status && (
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {getStatusBadge(invoice.status, INVOICE_STATUS_LABELS)}
                </td>
              )}
              {visibleColumns.faellig && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                </td>
              )}
              {visibleColumns.aktionen && (
                <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e: MouseEvent) => e.stopPropagation()}>
                  <div className="relative inline-block">
                    <button
                      onClick={() => setShowActionsMenu(showActionsMenu === invoice.id ? null : invoice.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>

                    {showActionsMenu === invoice.id && (
                      <InvoiceActionsMenu
                        invoice={invoice}
                        onEdit={handleEditInvoice}
                        onDelete={handleDeleteClick}
                        onStatusChange={handleStatusChange}
                        onClose={() => setShowActionsMenu(null)}
                        INVOICE_STATUS={INVOICE_STATUS}
                      />
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

export default InvoiceTable;
