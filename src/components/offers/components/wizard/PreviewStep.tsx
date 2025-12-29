import React from 'react';
import type { Customer, Project } from '@app-types';
import type { OfferFormData } from '@app-types/components/offer.types';
import { formatCurrency, formatDate } from '@utils';

interface CompanyInfo {
  name: string;
  street: string;
  zipCode: string;
  city: string;
  phone: string;
  email: string;
}

interface OfferTexts {
  greeting?: string;
  paymentTerms?: string;
  closing?: string;
  depositNote?: string;
  signature?: string;
}

interface Footer {
  column1?: string;
  column2?: string;
  column3?: string;
}

interface PVConfigFile {
  id?: string;
  url: string;
  type?: string;
  name?: string;
}

interface AdditionalPage {
  id?: string;
  title?: string;
  content: string;
}

interface PreviewStepProps {
  offerData: OfferFormData;
  customers: Customer[];
  projects: Project[];
  selectedCustomer: string;
  selectedProject: string;
  company: CompanyInfo;
  offerTexts: OfferTexts;
  footer: Footer;
  additionalPages?: AdditionalPage[];
  totalKwp: number | string | null;
  pvConfigFiles: PVConfigFile[];
}

const PreviewStep: React.FC<PreviewStepProps> = ({
  offerData,
  customers: _customers,
  projects,
  selectedCustomer: _selectedCustomer,
  selectedProject,
  company,
  offerTexts,
  footer,
  additionalPages,
  totalKwp,
  pvConfigFiles
}) => {
  const project = projects.find(p => p.id === selectedProject);

  return (
    <div className="bg-gray-100 -m-6 p-6">
      <div className="max-w-[210mm] mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* PDF Content - A4 Layout */}
        <div className="p-8">
          {/* Header mit Firmeninfo rechts */}
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ANGEBOT {totalKwp && <span className="text-lg font-normal text-gray-600">({totalKwp} kWp)</span>}
              </h1>
              {/* PV-Konfiguration Bild */}
              {pvConfigFiles.filter(file => file.type?.startsWith('image/')).length > 0 && (
                <img
                  src={pvConfigFiles.filter(file => file.type?.startsWith('image/'))[0]?.url}
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
                {project?.name && (
                  <p className="font-medium text-gray-900">{project.name}</p>
                )}
                {project?.address?.strasse && (
                  <p>{project.address.strasse}</p>
                )}
                {(project?.address?.plz || project?.address?.ort) && (
                  <p>{project.address?.plz} {project.address?.ort}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Datum:</span>
                  <span>{offerData.offerDate ? formatDate(offerData.offerDate) : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Gültig bis:</span>
                  <span>{formatDate(offerData.conditions?.validUntil)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Betreff & Einleitung */}
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Angebot - {(offerData as any).offerNumber || 'Neu'}
            </h2>
            <p className="text-sm text-gray-600">
              {offerTexts?.greeting}
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
                {offerData.items.map((item, index) => (
                  <tr key={item.id || index} className="border-b border-gray-100">
                    <td className="py-3 text-gray-600">{item.position || index + 1}</td>
                    <td className="py-3">
                      <p className="font-medium text-gray-900">{item.shortText}</p>
                      {item.longText && (
                        <p className="text-xs text-gray-500 mt-1">{item.longText}</p>
                      )}
                      {(item.discount ?? 0) > 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          {item.discount}% Rabatt
                        </p>
                      )}
                    </td>
                    <td className="py-3 text-right">{item.quantity}</td>
                    <td className="py-3 text-center text-gray-600">{item.unit}</td>
                    <td className="py-3 text-right">
                      {(item.discount ?? 0) > 0 ? (
                        <div>
                          <span className="line-through text-gray-400 text-xs">{formatCurrency(item.unitPriceNet)}</span>
                          <span className="block text-red-600">{formatCurrency(item.unitPriceNet * (1 - (item.discount ?? 0) / 100))}</span>
                        </div>
                      ) : (
                        formatCurrency(item.unitPriceNet)
                      )}
                    </td>
                    <td className="py-3 text-right font-medium">{formatCurrency(item.totalNet)}</td>
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
                  <span>{formatCurrency((offerData.totals as any)?.subtotalNet)}</span>
                </div>
                {(offerData.totals?.discountPercent ?? 0) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Rabatt ({offerData.totals?.discountPercent}%):</span>
                    <span>- {formatCurrency(offerData.totals?.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Netto:</span>
                  <span>{formatCurrency(offerData.totals?.netTotal)}</span>
                </div>
                {((offerData.totals?.taxRate ?? 0) > 0) ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600">MwSt ({offerData.totals?.taxRate}%):</span>
                    <span>{formatCurrency(offerData.totals?.taxAmount)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-600">0% MwSt. nach §12 UStG</span>
                    <span>{formatCurrency(0)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-lg font-bold">
                  <span>Gesamtbetrag:</span>
                  <span>{formatCurrency(offerData.totals?.grossTotal)}</span>
                </div>
                {/* Anzahlung */}
                {((offerData.depositPercent ?? 0) > 0) && (
                  <>
                    <div className="flex justify-between mt-3 pt-3 border-t border-dashed text-sm">
                      <span className="text-gray-600">Anzahlung ({offerData.depositPercent}%):</span>
                      <span className="font-medium">{formatCurrency((offerData.totals?.grossTotal || 0) * ((offerData.depositPercent ?? 0) / 100))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Schlussrechnung ({100 - (offerData.depositPercent ?? 0)}%):</span>
                      <span className="font-medium">{formatCurrency((offerData.totals?.grossTotal || 0) * ((100 - (offerData.depositPercent ?? 0)) / 100))}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-6 text-sm text-gray-600 space-y-3">
            {((offerData.depositPercent ?? 0) > 0) && (
              <>
                <p>{offerTexts?.paymentTerms}</p>
                <p>{offerTexts?.closing}</p>
                <p className="text-xs text-gray-500">{offerTexts?.depositNote}</p>
              </>
            )}
            <p className="mt-4">{offerTexts?.signature}</p>
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
        <div key={page.id || index} className="max-w-[210mm] mx-auto bg-white shadow-lg rounded-lg overflow-hidden mt-6">
          <div className="p-8 min-h-[297mm] flex flex-col relative">
            {/* Seiteninhalt */}
            <div className="flex-1">
              {page.title && (
                <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">{page.title}</h2>
              )}
              <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {page.content}
              </div>
            </div>

            {/* Fußzeile auf zusätzlichen Seiten */}
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
  );
};

export default PreviewStep;
