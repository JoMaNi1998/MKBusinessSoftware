import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Printer,
  FileText,
  Edit,
  Receipt
} from 'lucide-react';
import { useCustomers } from '@context/CustomerContext';
import { useProjects } from '@context/ProjectContext';
import { useMaterials } from '@context/MaterialContext';
import { useInvoice } from '@context/InvoiceContext';
import { useCompany } from '@context/CompanyContext';
import type { Offer, Project, Material } from '@app-types';

// Spezifikations-ID für PMAX_DC (Modulleistung in Wp)
const SPEC_PMAX_DC = 'l5YKWiis3xv1nM5BAawD';

interface AdditionalPage {
  id?: string;
  title: string;
  content: string;
}

interface PVConfigFile {
  id: string;
  name: string;
  path: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

interface OfferPDFPreviewProps {
  offer: Offer | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (offer: Offer) => void;
}

const OfferPDFPreview: React.FC<OfferPDFPreviewProps> = ({ offer, isOpen, onClose, onEdit }) => {
  const navigate = useNavigate();
  useCustomers(); // Required context
  const { projects } = useProjects();
  const { materials } = useMaterials();
  const { hasDepositInvoice, createInvoiceFromOffer } = useInvoice();
  const { company, offerTexts, footer, additionalPages } = useCompany();
  const [isCreatingInvoice, setIsCreatingInvoice] = useState<boolean>(false);
  const [printMount, setPrintMount] = useState<HTMLElement | null>(null);

  // Print-Portal erstellen wenn Modal offen ist
  useEffect(() => {
    if (!isOpen) return;
    const el = document.createElement('div');
    el.id = 'offer-print-root';
    el.style.display = 'none';
    document.body.appendChild(el);
    setPrintMount(el);
    return () => {
      document.body.removeChild(el);
      setPrintMount(null);
    };
  }, [isOpen]);

  // Prüfen welcher Rechnungstyp als nächstes erstellt werden soll
  const depositExists = offer ? hasDepositInvoice(offer.id) : false;

  const project = useMemo<Project | undefined>(() => {
    return projects.find(p => p.id === offer?.projectID);
  }, [projects, offer?.projectID]);

  // kWp-Berechnung aus PV-Montage Positionen
  const totalKwp = useMemo<string | null>(() => {
    const pvItems = (offer?.items || []).filter(item => (item as any).category === 'pv-montage');
    if (pvItems.length === 0) return null;

    let totalWp = 0;

    for (const pvItem of pvItems) {
      const itemMaterials = (pvItem as any).breakdown?.materials || [];

      for (const mat of itemMaterials) {
        const materialData = materials.find((m: Material) => m.id === mat.materialID);
        const pmaxDc = parseFloat((materialData?.specifications as any)?.[SPEC_PMAX_DC]);

        if (pmaxDc && mat.quantity) {
          totalWp += pmaxDc * mat.quantity * pvItem.quantity;
        }
      }
    }

    if (totalWp === 0) return null;
    return (totalWp / 1000).toFixed(2);
  }, [offer?.items, materials]);

  const formatPrice = (price: number | undefined): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0);
  };

  const formatDate = (dateString: any): string => {
    if (!dateString) return '-';
    try {
      const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const handlePrint = (): void => {
    requestAnimationFrame(() => window.print());
  };

  const handleCreateInvoice = async (): Promise<void> => {
    if (isCreatingInvoice || !offer) return;

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

  // Gemeinsamer Seiten-Inhalt (wird sowohl in Modal als auch Print-Portal verwendet)
  const renderPageContent = (): React.ReactNode => (
    <>
      {/* Hauptseite */}
      <div className="page bg-white">
        <div className="page-content">
          <div className="page-body">
            <table className="w-full">
              <tbody>
                <tr>
                  <td>
                    {/* Header mit Firmeninfo rechts */}
                    <div className="flex justify-between items-start mb-8 pb-6 border-b">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                          ANGEBOT {totalKwp && <span className="text-lg font-normal text-gray-600">({totalKwp} kWp)</span>}
                        </h1>
                        {/* PV-Konfiguration Bild - linksbündig direkt unter ANGEBOT */}
                        {(offer as any).pvConfigFiles?.filter((file: PVConfigFile) => file.type?.startsWith('image/')).length > 0 && (
                          <img
                            src={(offer as any).pvConfigFiles.filter((file: PVConfigFile) => file.type?.startsWith('image/'))[0]?.url}
                            alt="PV-Konfiguration"
                            className="w-32 h-24 object-contain object-left mt-4"
                          />
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
                    <div className="grid grid-cols-2 gap-8 mb-6">
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
                            <span>{formatDate((offer as any).conditions?.validUntil)}</span>
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
                    <div className="flex justify-end mb-8 summary-section">
                      <div className="w-64">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Zwischensumme (netto):</span>
                            <span>{formatPrice((offer as any).totals?.subtotalNet)}</span>
                          </div>
                          {(offer as any).totals?.discountPercent > 0 && (
                            <div className="flex justify-between text-red-600">
                              <span>Rabatt ({(offer as any).totals?.discountPercent}%):</span>
                              <span>- {formatPrice((offer as any).totals?.discountAmount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-gray-600">Netto:</span>
                            <span>{formatPrice((offer as any).totals?.netTotal)}</span>
                          </div>
                          {((offer as any).totals?.taxRate > 0) ? (
                            <div className="flex justify-between">
                              <span className="text-gray-600">MwSt ({(offer as any).totals?.taxRate}%):</span>
                              <span>{formatPrice((offer as any).totals?.taxAmount)}</span>
                            </div>
                          ) : (
                            <div className="flex justify-between">
                              <span className="text-gray-600">0% MwSt. nach §12 UStG</span>
                              <span>{formatPrice(0)}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-lg font-bold">
                            <span>Gesamtbetrag:</span>
                            <span>{formatPrice((offer as any).totals?.grossTotal)}</span>
                          </div>
                          {/* Anzahlung */}
                          {((offer as any).depositPercent > 0) && (
                            <>
                              <div className="flex justify-between mt-3 pt-3 border-t border-dashed text-sm">
                                <span className="text-gray-600">Anzahlung ({(offer as any).depositPercent}%):</span>
                                <span className="font-medium">{formatPrice(((offer as any).totals?.grossTotal || 0) * ((offer as any).depositPercent / 100))}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Schlussrechnung ({100 - (offer as any).depositPercent}%):</span>
                                <span className="font-medium">{formatPrice(((offer as any).totals?.grossTotal || 0) * ((100 - (offer as any).depositPercent) / 100))}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t mt-8 pt-6 text-sm text-gray-600 space-y-3">
                      {((offer as any).depositPercent > 0) && (
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
                  </td>
                </tr>
              </tbody>
              <tfoot className="footer-spacer">
                <tr><td style={{height: '25mm'}}></td></tr>
              </tfoot>
            </table>
          </div>

          {/* Firmen-Footer mit 3 Spalten - immer unten */}
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

      {/* Zusätzliche Seiten - Browser macht automatischen Seitenumbruch */}
      {additionalPages && additionalPages.length > 0 && additionalPages.map((page: AdditionalPage, pageIndex: number) => (
        <div key={page.id || pageIndex} className="page additional-page bg-white">
          <div className="page-content">
            <div className="page-body">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td>
                      {/* Seitentitel */}
                      {page.title && (
                        <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">{page.title}</h2>
                      )}

                      {/* Seiteninhalt */}
                      <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                        {page.content}
                      </div>
                    </td>
                  </tr>
                </tbody>
                <tfoot className="footer-spacer">
                  <tr><td style={{height: '25mm'}}></td></tr>
                </tfoot>
              </table>
            </div>

            {/* Firmen-Footer mit 3 Spalten - auf jeder Seite */}
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
      ))}
    </>
  );

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 5mm 12mm;
          }

          /* Nur den Print-Portal-Root drucken */
          body > *:not(#offer-print-root) { display: none !important; }
          #offer-print-root { display: block !important; }

          /* Hauptseite - automatischer Seitenumbruch erlaubt */
          #offer-print-root .page {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            position: relative;
            overflow: visible !important;
          }

          /* Zusätzliche Seiten - automatischer Seitenumbruch */
          #offer-print-root .page.additional-page {
            position: relative !important;
            break-before: page;
            page-break-before: always;
            overflow: visible !important;
          }

          /* Seiten-Container */
          #offer-print-root .page-content {
            display: block !important;
            padding: 0 !important;
          }

          /* Hauptinhalt - Überlauf erlauben */
          #offer-print-root .page-body {
            overflow: visible !important;
          }

          /* Body in zusätzlichen Seiten - Überlauf erlauben */
          #offer-print-root .page.additional-page .page-body {
            overflow: visible !important;
          }

          /* Tabellen ohne implizite Borders - nur äußere Wrapper-Tabelle */
          #offer-print-root > .page > .page-content > .page-body > table {
            border-collapse: collapse;
            border: none !important;
          }

          #offer-print-root > .page > .page-content > .page-body > table > tbody,
          #offer-print-root > .page > .page-content > .page-body > table > tbody > tr,
          #offer-print-root > .page > .page-content > .page-body > table > tbody > tr > td {
            border: none !important;
          }

          /* Innere Tabellen (Positionen) behalten ihre Borders */
          #offer-print-root table table {
            border-collapse: collapse;
          }

          /* Tabellen-Zeilen nicht umbrechen */
          #offer-print-root table tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          /* tfoot als unsichtbarer Spacer - wiederholt sich auf jeder Seite */
          #offer-print-root .footer-spacer {
            display: table-footer-group !important;
            visibility: hidden !important;
          }

          /* Footer-Spacer komplett ohne Borders */
          #offer-print-root .footer-spacer,
          #offer-print-root .footer-spacer tr,
          #offer-print-root .footer-spacer td {
            border: none !important;
          }

          /* Summenbereich nicht umbrechen */
          #offer-print-root .summary-section {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          /* Footer auf allen Seiten fixiert */
          #offer-print-root .page-footer {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            height: 25mm !important;
            padding: 6px 0 !important;
            background: white !important;
            z-index: 500 !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Print-Portal: Alle Seiten für den Druck */}
      {printMount && createPortal(renderPageContent(), printMount)}

      {/* Modal für die Vorschau */}
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

          {/* Scrollbarer Inhalt - Vorschau */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
            <div className="max-w-[210mm] mx-auto space-y-6">
              {/* Hauptseite */}
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="p-8">
                  {/* Header mit Firmeninfo rechts */}
                  <div className="flex justify-between items-start mb-8 pb-6 border-b">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        ANGEBOT {totalKwp && <span className="text-lg font-normal text-gray-600">({totalKwp} kWp)</span>}
                      </h1>
                      {/* PV-Konfiguration Bild - linksbündig direkt unter ANGEBOT */}
                      {(offer as any).pvConfigFiles?.filter((file: PVConfigFile) => file.type?.startsWith('image/')).length > 0 && (
                        <img
                          src={(offer as any).pvConfigFiles.filter((file: PVConfigFile) => file.type?.startsWith('image/'))[0]?.url}
                          alt="PV-Konfiguration"
                          className="w-32 h-24 object-contain object-left mt-4"
                        />
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
                  <div className="grid grid-cols-2 gap-8 mb-6">
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
                          <span>{formatDate((offer as any).conditions?.validUntil)}</span>
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
                          <span>{formatPrice((offer as any).totals?.subtotalNet)}</span>
                        </div>
                        {(offer as any).totals?.discountPercent > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Rabatt ({(offer as any).totals?.discountPercent}%):</span>
                            <span>- {formatPrice((offer as any).totals?.discountAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-600">Netto:</span>
                          <span>{formatPrice((offer as any).totals?.netTotal)}</span>
                        </div>
                        {((offer as any).totals?.taxRate > 0) ? (
                          <div className="flex justify-between">
                            <span className="text-gray-600">MwSt ({(offer as any).totals?.taxRate}%):</span>
                            <span>{formatPrice((offer as any).totals?.taxAmount)}</span>
                          </div>
                        ) : (
                          <div className="flex justify-between">
                            <span className="text-gray-600">0% MwSt. nach §12 UStG</span>
                            <span>{formatPrice(0)}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-lg font-bold">
                          <span>Gesamtbetrag:</span>
                          <span>{formatPrice((offer as any).totals?.grossTotal)}</span>
                        </div>
                        {/* Anzahlung */}
                        {((offer as any).depositPercent > 0) && (
                          <>
                            <div className="flex justify-between mt-3 pt-3 border-t border-dashed text-sm">
                              <span className="text-gray-600">Anzahlung ({(offer as any).depositPercent}%):</span>
                              <span className="font-medium">{formatPrice(((offer as any).totals?.grossTotal || 0) * ((offer as any).depositPercent / 100))}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Schlussrechnung ({100 - (offer as any).depositPercent}%):</span>
                              <span className="font-medium">{formatPrice(((offer as any).totals?.grossTotal || 0) * ((100 - (offer as any).depositPercent) / 100))}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t mt-8 pt-6 text-sm text-gray-600 space-y-3">
                    {((offer as any).depositPercent > 0) && (
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

                  {/* Firmen-Footer mit 3 Spalten */}
                  {(footer?.column1 || footer?.column2 || footer?.column3) && (
                    <div className="mt-8 pt-4">
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

              {/* Zusätzliche Seiten (Vorschau) - nicht aufgeteilt */}
              {additionalPages && additionalPages.length > 0 && additionalPages.map((page: AdditionalPage, index: number) => (
                <div key={page.id || index} className="bg-white shadow-lg rounded-lg overflow-hidden">
                  <div className="p-8">
                    {/* Seitentitel */}
                    {page.title && (
                      <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">{page.title}</h2>
                    )}

                    {/* Seiteninhalt */}
                    <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                      {page.content}
                    </div>

                    {/* Firmen-Footer mit 3 Spalten */}
                    {(footer?.column1 || footer?.column2 || footer?.column3) && (
                      <div className="mt-8 pt-4">
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OfferPDFPreview;
