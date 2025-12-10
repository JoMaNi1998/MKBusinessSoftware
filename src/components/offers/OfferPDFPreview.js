import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Download,
  Printer,
  FileText,
  Edit,
  Receipt
} from 'lucide-react';
import { useCustomers } from '../../context/CustomerContext';
import { useProjects } from '../../context/ProjectContext';
import { OFFER_STATUS_LABELS, OFFER_STATUS } from '../../context/OfferContext';
import { useInvoices } from '../../context/InvoiceContext';
import { useCompany } from '../../context/CompanyContext';

const OfferPDFPreview = ({ offer, isOpen, onClose, onEdit }) => {
  const navigate = useNavigate();
  const { customers } = useCustomers();
  const { projects } = useProjects();
  const { hasDepositInvoice, getInvoicesByOffer, createInvoiceFromOffer } = useInvoices();
  const { company, offerTexts, footer, additionalPages } = useCompany();
  const [isCreatingInvoice, setIsCreatingInvoice] = React.useState(false);

  // Prüfen welcher Rechnungstyp als nächstes erstellt werden soll
  const depositExists = offer ? hasDepositInvoice(offer.id) : false;
  const existingInvoices = offer ? getInvoicesByOffer(offer.id) : [];

  const customer = useMemo(() => {
    return customers.find(c => c.id === offer?.customerID);
  }, [customers, offer?.customerID]);

  const project = useMemo(() => {
    return projects.find(p => p.id === offer?.projectID);
  }, [projects, offer?.projectID]);

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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleCreateInvoice = async () => {
    if (isCreatingInvoice) return;

    setIsCreatingInvoice(true);
    try {
      // Rechnung direkt erstellen (Anzahlung oder Schlussrechnung wird automatisch erkannt)
      const result = await createInvoiceFromOffer(offer);

      if (result.success) {
        onClose();
        // Zur Rechnungsliste navigieren
        navigate('/invoices');
      } else {
        alert('Fehler beim Erstellen der Rechnung: ' + (result.error || 'Unbekannter Fehler'));
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      alert('Fehler beim Erstellen der Rechnung');
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  if (!isOpen || !offer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 !m-0 !top-0">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header mit Titel links und Buttons rechts */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-gray-600" />
            <span className="text-lg font-semibold text-gray-900">Angebotsvorschau</span>
            <span className="font-medium text-gray-600">{offer.offerNumber}</span>
          </div>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(offer)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center"
              >
                <Edit className="h-4 w-4 mr-1" />
                Bearbeiten
              </button>
            )}
            <button
                onClick={handleCreateInvoice}
                disabled={isCreatingInvoice}
                className={`px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg flex items-center font-medium ${isCreatingInvoice ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isCreatingInvoice ? (
                  <div className="h-4 w-4 mr-1 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Receipt className="h-4 w-4 mr-1" />
                )}
                {depositExists ? 'Schlussrechnung' : 'Anzahlungsrechnung'}
              </button>
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

        {/* Scrollbarer Inhalt - nur eine Scrollbar */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div className="max-w-[210mm] mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none">
            {/* PDF Content - A4 Layout */}
            <div className="p-8 print:p-0" id="offer-pdf-content">
              {/* Header */}
              <div className="flex justify-between items-start mb-8 pb-6 border-b">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">ANGEBOT</h1>
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
                      <span className="text-gray-500">Datum:</span>
                      <span>{formatDate(offer.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gültig bis:</span>
                      <span>{formatDate(offer.conditions?.validUntil)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Betreff */}
              <div className="mb-6">
                <p className="font-medium text-gray-900">
                  Angebot - {offer.offerNumber}
                </p>
              </div>

              {/* Einleitung */}
              <div className="mb-6 text-sm text-gray-600">
                <p>
                  {offerTexts.greeting}
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
                    {(offer.items || []).map((item, index) => (
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
                <div className="w-64">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Zwischensumme (netto):</span>
                      <span>{formatPrice(offer.totals?.subtotalNet)}</span>
                    </div>
                    {offer.totals?.discountPercent > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Rabatt ({offer.totals?.discountPercent}%):</span>
                        <span>- {formatPrice(offer.totals?.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Netto:</span>
                      <span>{formatPrice(offer.totals?.netTotal)}</span>
                    </div>
                    {(offer.totals?.taxRate > 0) && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">MwSt ({offer.totals?.taxRate}%):</span>
                        <span>{formatPrice(offer.totals?.taxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-lg font-bold">
                      <span>Gesamtbetrag:</span>
                      <span>{formatPrice(offer.totals?.grossTotal)}</span>
                    </div>
                    {/* Anzahlung */}
                    {(offer.depositPercent > 0) && (
                      <>
                        <div className="flex justify-between mt-3 pt-3 border-t border-dashed text-sm">
                          <span className="text-gray-600">Anzahlung ({offer.depositPercent}%):</span>
                          <span className="font-medium">{formatPrice((offer.totals?.grossTotal || 0) * (offer.depositPercent / 100))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Schlussrechnung ({100 - offer.depositPercent}%):</span>
                          <span className="font-medium">{formatPrice((offer.totals?.grossTotal || 0) * ((100 - offer.depositPercent) / 100))}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t pt-6 text-sm text-gray-600 space-y-3">
                {(offer.depositPercent > 0) && (
                  <>
                    <p>
                      {offerTexts.paymentTerms}
                    </p>
                    <p>
                      {offerTexts.closing}
                    </p>
                    <p className="text-xs text-gray-500">
                      {offerTexts.depositNote}
                    </p>
                  </>
                )}
                <p className="mt-4">{offerTexts.signature}</p>
                <p className="mt-2 font-medium text-gray-700">{company.name}</p>
              </div>

              {/* Fußzeile */}
              {(footer?.column1 || footer?.column2 || footer?.column3) && (
                <div className="mt-8 pt-4 border-t border-gray-300">
                  <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
                    <div className="whitespace-pre-line">{footer?.column1}</div>
                    <div className="whitespace-pre-line text-center">{footer?.column2}</div>
                    <div className="whitespace-pre-line text-right">{footer?.column3}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Zusätzliche Seiten */}
          {additionalPages && additionalPages.length > 0 && additionalPages.map((page, index) => (
            <div key={page.id || index} className="max-w-[210mm] mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none mt-6 break-before-page">
              <div className="p-8 print:p-0 min-h-[297mm] flex flex-col">
                {/* Seiteninhalt */}
                <div className="flex-1">
                  {/* Seitentitel */}
                  {page.title && (
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">{page.title}</h2>
                  )}

                  {/* Seiteninhalt */}
                  <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                    {page.content}
                  </div>
                </div>

                {/* Fußzeile auf zusätzlichen Seiten - immer unten */}
                {(footer?.column1 || footer?.column2 || footer?.column3) && (
                  <div className="mt-auto pt-4 border-t border-gray-300">
                    <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
                      <div className="whitespace-pre-line">{footer?.column1}</div>
                      <div className="whitespace-pre-line text-center">{footer?.column2}</div>
                      <div className="whitespace-pre-line text-right">{footer?.column3}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #offer-pdf-content, #offer-pdf-content * {
            visibility: visible;
          }
          #offer-pdf-content {
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

export default OfferPDFPreview;
