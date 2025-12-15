import React from 'react';
import { formatDate } from '../shared/formatDate';

const InvoicePaymentInfo = ({ invoice, company }) => {
  return (
    <div className="border-t pt-6 mb-6 text-sm">
      <h3 className="font-medium text-gray-900 mb-3">Zahlungsinformationen</h3>
      <div className="grid grid-cols-2 gap-4 text-gray-600">
        <div>
          <span className="text-gray-500">Zahlungsbedingungen:</span>
          <p>{invoice.paymentTerms || '14 Tage netto'}</p>
        </div>
        <div>
          <span className="text-gray-500">Fällig am:</span>
          <p className="font-medium">{formatDate(invoice.dueDate)}</p>
        </div>
      </div>
      {(company.iban || company.bic) && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-1">Bankverbindung:</p>
          {company.bankName && <p>{company.bankName}</p>}
          {company.iban && <p>IBAN: {company.iban}</p>}
          {company.bic && <p>BIC: {company.bic}</p>}
          <p className="mt-1">Verwendungszweck: {invoice.invoiceNumber}</p>
        </div>
      )}
    </div>
  );
};

export default InvoicePaymentInfo;
