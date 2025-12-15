import React, { useMemo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, FileText, Edit } from 'lucide-react';
import { useCustomers } from '../../../context/CustomerContext';
import { useProjects } from '../../../context/ProjectContext';
import { INVOICE_STATUS_LABELS } from '../../../context/InvoiceContext';
import { useCompany } from '../../../context/CompanyContext';
import { formatPrice } from '../shared/formatPrice';
import { formatDate } from '../shared/formatDate';
import InvoiceHeader from './InvoiceHeader';
import InvoicePositions from './InvoicePositions';
import InvoiceTotals from './InvoiceTotals';
import InvoicePaymentInfo from './InvoicePaymentInfo';
import InvoicePrintStyles from './InvoicePrintStyles';

const InvoicePDFPreview = ({ invoice, isOpen, onClose, onEdit }) => {
  const { customers } = useCustomers();
  const { projects } = useProjects();
  const { company, invoiceTexts, footer } = useCompany();
  const pdfContentRef = useRef(null);
  const [printMount, setPrintMount] = useState(null);

  // Print-Portal erstellen wenn Modal offen ist
  useEffect(() => {
    if (!isOpen) return;
    const el = document.createElement('div');
    el.id = 'invoice-print-root';
    el.style.display = 'none';
    document.body.appendChild(el);
    setPrintMount(el);
    return () => {
      document.body.removeChild(el);
      setPrintMount(null);
    };
  }, [isOpen]);

  const customer = useMemo(() => {
    return customers.find(c => c.id === invoice?.customerID);
  }, [customers, invoice?.customerID]);

  const project = useMemo(() => {
    return projects.find(p => p.id === invoice?.projectID);
  }, [projects, invoice?.projectID]);

  const handlePrint = () => {
    requestAnimationFrame(() => window.print());
  };

  if (!isOpen || !invoice) return null;

  // Print-Version des Rechnungsinhalts
  const renderPageContent = () => (
    <div className="page bg-white">
      <div className="page-content">
        <div className="page-body">
          <table className="w-full">
            <tbody>
              <tr>
                <td>
                  <InvoiceHeader invoice={invoice} company={company} />

                  {/* Kunde & Datum */}
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <div className="text-sm">
                        {project?.contactPersonName && (
                          <p className="font-medium text-gray-900">{project.contactPersonName}</p>
                        )}
                        {(project?.street || project?.houseNumber) && (
                          <p>{project.street} {project.houseNumber}</p>
                        )}
                        {(project?.postalCode || project?.city) && (
                          <p>{project.postalCode} {project.city}</p>
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
                      </div>
                    </div>
                  </div>

                  {/* Betreff & Einleitung */}
                  <div className="mb-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-2">
                      Rechnung - {invoice.invoiceNumber}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {invoiceTexts.greeting}
                    </p>
                  </div>

                  <InvoicePositions items={invoice.items} />

                  <div className="summary-section">
                    <InvoiceTotals invoice={invoice} />
                  </div>

                  <InvoicePaymentInfo invoice={invoice} company={company} />

                  {/* Notizen */}
                  {invoice.notes && (
                    <div className="border-t pt-6 mb-6 text-sm">
                      <h3 className="font-medium text-gray-900 mb-2">Anmerkungen</h3>
                      <p className="text-gray-600 whitespace-pre-line">{invoice.notes}</p>
                    </div>
                  )}

                  {/* Footer Text */}
                  <div className="border-t pt-6 text-sm text-gray-500">
                    <p>{invoiceTexts.paymentTerms}</p>
                    <p className="mt-4">{invoiceTexts.closing}</p>
                    <p className="mt-4">{invoiceTexts.signature}</p>
                    <p className="mt-2 font-medium text-gray-700">{company.name}</p>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot className="footer-spacer">
              <tr><td style={{height: '25mm'}}></td></tr>
            </tfoot>
          </table>
        </div>

        {/* Firmen-Footer mit 3 Spalten */}
        {(footer?.column1 || footer?.column2 || footer?.column3) && (
          <div className="page-footer">
            <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
              {footer?.column1 && (
                <div className="whitespace-pre-line">{footer.column1}</div>
              )}
              {footer?.column2 && (
                <div className="whitespace-pre-line">{footer.column2}</div>
              )}
              {footer?.column3 && (
                <div className="whitespace-pre-line">{footer.column3}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

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
            {onEdit && !invoice.offerID && (
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
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-medium"
            >
              <Printer className="h-4 w-4 mr-2" />
              Drucken
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
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100 print:p-0 print:overflow-visible print:bg-white" id="invoice-pdf-content">
          <div ref={pdfContentRef} className="max-w-[210mm] mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none">
            <div className="p-8 print:p-0">
              <InvoiceHeader invoice={invoice} company={company} />

              {/* Kunde & Datum */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="text-sm">
                    {project?.contactPersonName && (
                      <p className="font-medium text-gray-900">{project.contactPersonName}</p>
                    )}
                    {(project?.street || project?.houseNumber) && (
                      <p>{project.street} {project.houseNumber}</p>
                    )}
                    {(project?.postalCode || project?.city) && (
                      <p>{project.postalCode} {project.city}</p>
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
                  </div>
                </div>
              </div>

              {/* Betreff & Einleitung */}
              <div className="mb-6">
                <h2 className="text-base font-semibold text-gray-900 mb-2">
                  Rechnung - {invoice.invoiceNumber}
                </h2>
                <p className="text-sm text-gray-600">
                  {invoiceTexts.greeting}
                </p>
              </div>

              <InvoicePositions items={invoice.items} />

              <InvoiceTotals invoice={invoice} />

              <InvoicePaymentInfo invoice={invoice} company={company} />

              {/* Notizen */}
              {invoice.notes && (
                <div className="border-t pt-6 mb-6 text-sm">
                  <h3 className="font-medium text-gray-900 mb-2">Anmerkungen</h3>
                  <p className="text-gray-600 whitespace-pre-line">{invoice.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="border-t pt-6 text-sm text-gray-500">
                <p>{invoiceTexts.paymentTerms}</p>
                <p className="mt-4">{invoiceTexts.closing}</p>
                <p className="mt-4">{invoiceTexts.signature}</p>
                <p className="mt-2 font-medium text-gray-700">{company.name}</p>
              </div>

              {/* Firmen-Footer mit 3 Spalten */}
              {(footer?.column1 || footer?.column2 || footer?.column3) && (
                <div className="border-t mt-8 pt-4">
                  <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
                    {footer?.column1 && (
                      <div className="whitespace-pre-line">{footer.column1}</div>
                    )}
                    {footer?.column2 && (
                      <div className="whitespace-pre-line">{footer.column2}</div>
                    )}
                    {footer?.column3 && (
                      <div className="whitespace-pre-line">{footer.column3}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <InvoicePrintStyles />

      {/* Print-Portal: Rechnungsinhalt für den Druck */}
      {printMount && createPortal(renderPageContent(), printMount)}
    </div>
  );
};

export default InvoicePDFPreview;
