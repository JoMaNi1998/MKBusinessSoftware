import React from 'react';
import { INVOICE_TYPE } from '../../../context/InvoiceContext';

interface CompanyInfo {
  name: string;
  street?: string;
  zipCode?: string;
  city?: string;
  phone?: string;
  email?: string;
  [key: string]: any;
}

interface Invoice {
  invoiceType?: string;
  invoiceNumber: string;
  offerNumber?: string | null;
  depositInvoiceNumber?: string | null;
  [key: string]: any;
}

interface InvoiceHeaderProps {
  invoice: Invoice;
  company: CompanyInfo;
}

const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({ invoice, company }) => {
  return (
    <div className="flex justify-between items-start mb-8 pb-6 border-b">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {invoice.invoiceType === INVOICE_TYPE.DEPOSIT ? 'ANZAHLUNGSRECHNUNG' :
           invoice.invoiceType === INVOICE_TYPE.FINAL ? 'SCHLUSSRECHNUNG' :
           'RECHNUNG'}
        </h1>
        <p className="text-gray-600 mt-1">{invoice.invoiceNumber}</p>
        {invoice.offerNumber && (
          <p className="text-sm text-gray-500 mt-1">Angebot: {invoice.offerNumber}</p>
        )}
        {invoice.invoiceType === INVOICE_TYPE.FINAL && invoice.depositInvoiceNumber && (
          <p className="text-sm text-gray-500">Anzahlung: {invoice.depositInvoiceNumber}</p>
        )}
      </div>
      <div className="text-right text-sm text-gray-600">
        <p className="font-medium text-gray-900">{company.name}</p>
        <p>{company.street}</p>
        <p>{company.zipCode} {company.city}</p>
        <p>Tel: {company.phone}</p>
        <p>{company.email}</p>
      </div>
    </div>
  );
};

export default InvoiceHeader;
