import React from 'react';
import { Edit, CheckCircle, FileText, Trash2 } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerID: string;
  status: string;
  invoiceDate: string;
  offerID?: string | null;
  [key: string]: any;
}

interface InvoiceStatusMap {
  [key: string]: string;
}

interface InvoiceActionsMenuProps {
  invoice: Invoice;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  onStatusChange: (invoice: Invoice, newStatus: string) => void;
  onClose: () => void;
  INVOICE_STATUS: InvoiceStatusMap;
}

const InvoiceActionsMenu: React.FC<InvoiceActionsMenuProps> = ({
  invoice,
  onEdit,
  onDelete,
  onStatusChange,
  onClose,
  INVOICE_STATUS
}) => {
  return (
    <>
      <div
        className="fixed inset-0 z-10"
        onClick={onClose}
      />
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
        <div className="py-1">
          {!invoice.offerID && (
            <button
              onClick={() => {
                onEdit(invoice);
                onClose();
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Edit className="h-4 w-4 mr-3" />
              Bearbeiten
            </button>
          )}
          {invoice.status === INVOICE_STATUS.SENT && (
            <button
              onClick={() => onStatusChange(invoice, INVOICE_STATUS.PAID)}
              className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-gray-100 flex items-center"
            >
              <CheckCircle className="h-4 w-4 mr-3" />
              Als bezahlt markieren
            </button>
          )}
          {invoice.status === INVOICE_STATUS.DRAFT && (
            <button
              onClick={() => onStatusChange(invoice, INVOICE_STATUS.SENT)}
              className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-gray-100 flex items-center"
            >
              <FileText className="h-4 w-4 mr-3" />
              Als gesendet markieren
            </button>
          )}
          <button
            onClick={() => onDelete(invoice)}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-3" />
            Löschen
          </button>
        </div>
      </div>
    </>
  );
};

export default InvoiceActionsMenu;
