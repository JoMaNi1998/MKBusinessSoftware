import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Download,
  FileText,
  Edit,
  Receipt,
  Loader2,
  File,
  ExternalLink
} from 'lucide-react';
import { useCustomers } from '../../context/CustomerContext';
import { useProjects } from '../../context/ProjectContext';
import { useMaterials } from '../../context/MaterialContext';
import { useInvoices } from '../../context/InvoiceContext';
import { useCompany } from '../../context/CompanyContext';
import { generatePDF } from '../../utils/pdfGenerator';

// Spezifikations-ID für PMAX_DC (Modulleistung in Wp)
const SPEC_PMAX_DC = 'l5YKWiis3xv1nM5BAawD';

const OfferPDFPreview = ({ offer, isOpen, onClose, onEdit }) => {
  const navigate = useNavigate();
  const { customers } = useCustomers();
  const { projects } = useProjects();
  const { materials } = useMaterials();
  const { hasDepositInvoice, getInvoicesByOffer, createInvoiceFromOffer } = useInvoices();
  const { company, offerTexts, footer, additionalPages } = useCompany();
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const pdfContentRef = useRef(null);

  // Prüfen welcher Rechnungstyp als nächstes erstellt werden soll
  const depositExists = offer ? hasDepositInvoice(offer.id) : false;
  const existingInvoices = offer ? getInvoicesByOffer(offer.id) : [];

  const customer = useMemo(() => {
    return customers.find(c => c.id === offer?.customerID);
  }, [customers, offer?.customerID]);

  const project = useMemo(() => {
    return projects.find(p => p.id === offer?.projectID);
  }, [projects, offer?.projectID]);

  // kWp-Berechnung aus PV-Montage Positionen
  const totalKwp = useMemo(() => {
    const pvItems = (offer?.items || []).filter(item => item.category === 'pv-montage');
    if (pvItems.length === 0) return null;

    let totalWp = 0;

    for (const pvItem of pvItems) {
      const itemMaterials = pvItem.breakdown?.materials || [];

      for (const mat of itemMaterials) {
        const materialData = materials.find(m => m.id === mat.materialID);
        const pmaxDc = parseFloat(materialData?.specifications?.[SPEC_PMAX_DC]);

        if (pmaxDc && mat.quantity) {
          totalWp += pmaxDc * mat.quantity * pvItem.quantity;
        }
      }
    }

    if (totalWp === 0) return null;
    return (totalWp / 1000).toFixed(2);
  }, [offer?.items, materials]);

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
      const filename = `Angebot_${offer.offerNumber || 'Entwurf'}`;
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
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className={`px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-medium ${isGeneratingPDF ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isGeneratingPDF ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isGeneratingPDF ? 'Erstelle...' : 'PDF'}
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
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100 print:p-0 print:overflow-visible print:bg-white" id="offer-pdf-content">
          {/* PDF Content Wrapper - enthält alle Seiten für PDF-Export */}
          <div ref={pdfContentRef} className="pdf-export-container">
            {/* Hauptseite */}
            <div className="max-w-[210mm] mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none">
              {/* PDF Content - A4 Layout */}
              <div className="p-8 print:p-0">
              {/* Header */}
              <div className="flex justify-between items-start mb-8 pb-6 border-b">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    ANGEBOT {totalKwp && <span className="text-lg font-normal text-gray-600">({totalKwp} kWp)</span>}
                  </h1>
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
                      <span>{formatDate(offer.offerDate || offer.createdAt)}</span>
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
              <div className="flex justify-end mb-8 print-no-break">
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
                    {(offer.totals?.taxRate > 0) ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">MwSt ({offer.totals?.taxRate}%):</span>
                        <span>{formatPrice(offer.totals?.taxAmount)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-gray-600">0% MwSt. nach §12 UStG</span>
                        <span>{formatPrice(0)}</span>
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
              <div className="border-t pt-6 text-sm text-gray-600 space-y-3 print-no-break">
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
            </div>
          </div>

          {/* PV-Konfiguration Dateien Anzeige (außerhalb PDF) */}
          {offer.pvConfigFiles && offer.pvConfigFiles.length > 0 && (
            <div className="max-w-[210mm] mx-auto mt-6 bg-green-50 border border-green-200 rounded-lg p-4 print:hidden">
              <div className="flex items-center space-x-2 mb-3">
                <File className="h-5 w-5 text-green-600" />
                <h3 className="font-medium text-green-900">PV-Konfiguration ({offer.pvConfigFiles.length} Datei{offer.pvConfigFiles.length > 1 ? 'en' : ''})</h3>
              </div>
              <div className="space-y-2">
                {offer.pvConfigFiles.map(file => (
                  <a
                    key={file.id}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-white border border-green-200 rounded-lg px-3 py-2 hover:bg-green-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <File className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-green-600" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Zusätzliche Seiten */}
            {additionalPages && additionalPages.length > 0 && additionalPages.map((page, index) => (
              <div key={page.id || index} className="max-w-[210mm] mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none mt-6 pdf-page-break">
                <div className="p-8 print:p-0">
                  {/* Seitentitel */}
                  {page.title && (
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">{page.title}</h2>
                  )}

                  {/* Seiteninhalt */}
                  <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                    {page.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          /* Browser Header/Footer ausblenden */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
          }

          body * {
            visibility: hidden;
          }

          #offer-pdf-content,
          #offer-pdf-content * {
            visibility: visible;
          }

          #offer-pdf-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 5mm;
          }

          /* Seitenumbrüche für zusätzliche Seiten */
          .break-before-page {
            page-break-before: always;
            break-before: page;
          }

          /* Positionen nicht umbrechen */
          .print-no-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Tabellen-Header auf jeder Seite wiederholen */
          thead {
            display: table-header-group;
          }

          /* Footer nicht umbrechen */
          .print-footer {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Keine Hintergrundfarben im Druck */
          .bg-gray-100, .bg-white {
            background: white !important;
          }

          /* Schatten entfernen */
          .shadow-lg {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default OfferPDFPreview;
