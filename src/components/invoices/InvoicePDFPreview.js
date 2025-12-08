import React, { useMemo } from 'react';
import {
  X,
  Download,
  Printer,
  FileText,
  Edit
} from 'lucide-react';
import { useCustomers } from '../../context/CustomerContext';
import { useProjects } from '../../context/ProjectContext';
import { INVOICE_STATUS_LABELS, INVOICE_TYPE, INVOICE_TYPE_LABELS } from '../../context/InvoiceContext';

const InvoicePDFPreview = ({ invoice, isOpen, onClose, onEdit }) => {
  const { customers } = useCustomers();
  const { projects } = useProjects();

  const customer = useMemo(() => {
    return customers.find(c => c.id === invoice?.customerID);
  }, [customers, invoice?.customerID]);

  const project = useMemo(() => {
    return projects.find(p => p.id === invoice?.projectID);
  }, [projects, invoice?.projectID]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
      return date.toLocaleDateString('de-DE');
    } catch {
      return dateString;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 !m-0 !top-0">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header mit Titel links und Buttons rechts */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-gray-600" />
            <span className="text-lg font-semibold text-gray-900">Rechnungsvorschau</span>
            <span className="font-medium text-gray-600">{invoice.invoiceNumber}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              INVOICE_STATUS_LABELS[invoice.status]?.color === 'green' ? 'bg-green-100 text-green-700' :
              INVOICE_STATUS_LABELS[invoice.status]?.color === 'blue' ? 'bg-blue-100 text-blue-700' :
              INVOICE_STATUS_LABELS[invoice.status]?.color === 'red' ? 'bg-red-100 text-red-700' :
              INVOICE_STATUS_LABELS[invoice.status]?.color === 'orange' ? 'bg-orange-100 text-orange-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {INVOICE_STATUS_LABELS[invoice.status]?.label}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(invoice)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center"
              >
                <Edit className="h-4 w-4 mr-1" />
                Bearbeiten
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center"
            >
              <Printer className="h-4 w-4 mr-1" />
              Drucken
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-medium"
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollbarer Inhalt */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div className="max-w-[210mm] mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none">
            {/* PDF Content - A4 Layout */}
            <div className="p-8 print:p-0" id="invoice-pdf-content">
              {/* Header */}
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
                  <p className="font-medium text-gray-900">Ihr Unternehmen</p>
                  <p>Musterstraße 123</p>
                  <p>12345 Musterstadt</p>
                  <p>Tel: 0123 456789</p>
                  <p>info@unternehmen.de</p>
                </div>
              </div>

              {/* Kunde & Datum */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Rechnungsempfänger</p>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">
                      {customer?.firmennameKundenname || customer?.name || '-'}
                    </p>
                    {customer?.strasse && <p>{customer.strasse}</p>}
                    {(customer?.plz || customer?.ort) && (
                      <p>{customer?.plz} {customer?.ort}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Rechnungsdatum:</span>
                      <span>{formatDate(invoice.invoiceDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fällig am:</span>
                      <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                    </div>
                    {project && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Projekt:</span>
                        <span>{project.projektname || project.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Betreff */}
              <div className="mb-6">
                <p className="font-medium text-gray-900">
                  Betreff: Rechnung {project ? `- ${project.projektname || project.name}` : ''}
                </p>
              </div>

              {/* Einleitung */}
              <div className="mb-6 text-sm text-gray-600">
                <p>
                  Für die erbrachten Leistungen erlauben wir uns, Ihnen folgende Positionen in Rechnung zu stellen:
                </p>
              </div>

              {/* Positionen */}
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
                    {(invoice.items || []).map((item, index) => (
                      <tr key={item.id || index} className="border-b border-gray-100">
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

              {/* Summen */}
              <div className="flex justify-end mb-8">
                <div className="w-72">
                  <div className="space-y-2 text-sm">
                    {/* Bei Schlussrechnung: Gesamtübersicht zeigen */}
                    {invoice.invoiceType === INVOICE_TYPE.FINAL && invoice.offerTotals && (
                      <>
                        <div className="flex justify-between text-gray-500">
                          <span>Auftragssumme (brutto):</span>
                          <span>{formatPrice(invoice.offerTotals?.grossTotal)}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>./. Anzahlung ({invoice.offerDepositPercent || 50}%):</span>
                          <span>- {formatPrice(invoice.depositAmount || (invoice.offerTotals?.grossTotal * (invoice.offerDepositPercent || 50) / 100))}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-medium">
                          <span>Restbetrag:</span>
                          <span>{formatPrice(invoice.totals?.grossTotal)}</span>
                        </div>
                        <div className="border-t my-2"></div>
                      </>
                    )}

                    <div className="flex justify-between">
                      <span className="text-gray-600">Netto:</span>
                      <span>{formatPrice(invoice.totals?.netTotal)}</span>
                    </div>
                    {(invoice.totals?.taxRate > 0) && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">MwSt ({invoice.totals?.taxRate}%):</span>
                        <span>{formatPrice(invoice.totals?.taxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-lg font-bold">
                      <span>Rechnungsbetrag:</span>
                      <span>{formatPrice(invoice.totals?.grossTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Zahlungsinformationen */}
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
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-1">Bankverbindung:</p>
                  <p>IBAN: DE89 3704 0044 0532 0130 00</p>
                  <p>BIC: COBADEFFXXX</p>
                  <p className="mt-1">Verwendungszweck: {invoice.invoiceNumber}</p>
                </div>
              </div>

              {/* Notizen */}
              {invoice.notes && (
                <div className="border-t pt-6 mb-6 text-sm">
                  <h3 className="font-medium text-gray-900 mb-2">Anmerkungen</h3>
                  <p className="text-gray-600 whitespace-pre-line">{invoice.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="border-t pt-6 text-sm text-gray-500">
                <p>
                  Bitte überweisen Sie den Betrag von <strong>{formatPrice(invoice.totals?.grossTotal)}</strong> bis
                  zum <strong>{formatDate(invoice.dueDate)}</strong> auf das oben genannte Konto.
                </p>
                <p className="mt-4">Vielen Dank für Ihr Vertrauen!</p>
                <p className="mt-4 font-medium text-gray-700">Ihr Unternehmen</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-pdf-content, #invoice-pdf-content * {
            visibility: visible;
          }
          #invoice-pdf-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20mm;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoicePDFPreview;
