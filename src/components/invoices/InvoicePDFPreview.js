import React, { useMemo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Download,
  Printer,
  FileText,
  Edit,
  Loader2
} from 'lucide-react';
import { useCustomers } from '../../context/CustomerContext';
import { useProjects } from '../../context/ProjectContext';
import { INVOICE_STATUS_LABELS, INVOICE_TYPE } from '../../context/InvoiceContext';
import { useCompany } from '../../context/CompanyContext';
import { generatePDF } from '../../utils/pdfGenerator';

const InvoicePDFPreview = ({ invoice, isOpen, onClose, onEdit }) => {
  const { customers } = useCustomers();
  const { projects } = useProjects();
  const { company, invoiceTexts, footer } = useCompany();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
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
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const handleDownloadPDF = async () => {
    if (!pdfContentRef.current || isGeneratingPDF) return;

    setIsGeneratingPDF(true);
    try {
      const filename = `Rechnung_${invoice.invoiceNumber || 'Entwurf'}`;
      // Footer-Daten für jede Seite übergeben
      const footerData = {
        column1: footer?.column1 || '',
        column2: footer?.column2 || '',
        column3: footer?.column3 || ''
      };
      await generatePDF(pdfContentRef.current, filename, {}, footerData);
    } catch (error) {
      console.error('PDF-Generierung fehlgeschlagen:', error);
      alert('PDF-Generierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    requestAnimationFrame(() => window.print());
  };

  if (!isOpen || !invoice) return null;

  // Print-Version des Rechnungsinhalts
  const renderPageContent = () => (
    <div className="page bg-white">
      <div className="page-content">
        <div className="page-body">
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
              <p className="font-medium text-gray-900">{company.name}</p>
              <p>{company.street}</p>
              <p>{company.zipCode} {company.city}</p>
              <p>Tel: {company.phone}</p>
              <p>{company.email}</p>
            </div>
          </div>

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
          <div className="flex justify-end mb-8 summary-section">
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
                      <span>Abzgl. Anzahlung ({invoice.offerDepositPercent || 50}%):</span>
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
                {(invoice.totals?.taxRate > 0) ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600">MwSt ({invoice.totals?.taxRate}%):</span>
                    <span>{formatPrice(invoice.totals?.taxAmount)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-600">0% MwSt. nach §12 UStG</span>
                    <span>{formatPrice(0)}</span>
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
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className={`px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center ${isGeneratingPDF ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isGeneratingPDF ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-1" />
              )}
              {isGeneratingPDF ? 'Erstelle...' : 'PDF'}
            </button>
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
            {/* PDF Content - A4 Layout */}
            <div className="p-8 print:p-0">
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
                  <p className="font-medium text-gray-900">{company.name}</p>
                  <p>{company.street}</p>
                  <p>{company.zipCode} {company.city}</p>
                  <p>Tel: {company.phone}</p>
                  <p>{company.email}</p>
                </div>
              </div>

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
                          <span>Abzgl. Anzahlung ({invoice.offerDepositPercent || 50}%):</span>
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
                    {(invoice.totals?.taxRate > 0) ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">MwSt ({invoice.totals?.taxRate}%):</span>
                        <span>{formatPrice(invoice.totals?.taxAmount)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-gray-600">0% MwSt. nach §12 UStG</span>
                        <span>{formatPrice(0)}</span>
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
                  {invoiceTexts.paymentTerms}
                </p>
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

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 5mm 12mm;
          }

          /* Nur den Print-Portal-Root drucken */
          body > *:not(#invoice-print-root) { display: none !important; }
          #invoice-print-root { display: block !important; }

          /* Hauptseite */
          #invoice-print-root .page {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            position: relative;
            overflow: visible !important;
          }

          /* Seiten-Container */
          #invoice-print-root .page-content {
            display: block !important;
            padding: 0 !important;
          }

          /* Hauptinhalt - padding für Footer-Platz */
          #invoice-print-root .page-body {
            overflow: visible !important;
            padding-bottom: 25mm !important;
          }

          /* Tabellen-Zeilen nicht umbrechen */
          #invoice-print-root table tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          /* Summenbereich nicht umbrechen */
          #invoice-print-root .summary-section {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          /* Footer auf jeder Seite fixiert, nach unten in Margin verschoben */
          #invoice-print-root .page-footer {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            padding: 6px 0 !important;
            border-top: 1px solid #e5e7eb !important;
            background: white !important;
          }
        }
      `}</style>

      {/* Print-Portal: Rechnungsinhalt für den Druck */}
      {printMount && createPortal(renderPageContent(), printMount)}
    </div>
  );
};

export default InvoicePDFPreview;
