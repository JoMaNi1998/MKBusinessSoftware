import React from 'react';
import {
  Plus,
  Trash2,
  Eye,
  Upload,
  Loader2,
  TrendingDown
} from 'lucide-react';
import { formatPrice } from '../../shared';

const PositionsStep = ({
  offerData,
  customers,
  projects,
  selectedCustomer,
  selectedProject,
  company,
  offerTexts,
  footer,
  totalKwp,
  pvConfigFiles,
  isUploading,
  onFileUpload,
  onDeleteFile,
  onUpdateItem,
  onRemoveItem,
  onAddManualItem,
  onUpdateOfferField,
  onUpdateConditions,
  onUpdateTotals,
  onGoToServices
}) => {
  const customer = customers.find(c => c.id === selectedCustomer);
  const project = projects.find(p => p.id === selectedProject);

  if (offerData.items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="h-12 w-12 mx-auto mb-4 text-gray-300 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
          <Plus className="h-6 w-6" />
        </div>
        <p>Noch keine Positionen hinzugefügt</p>
        <button
          onClick={onGoToServices}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Leistungen hinzufügen
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 -m-6 p-6">
      <div className="max-w-[210mm] mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-8">
          {/* Header mit Firmeninfo rechts */}
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ANGEBOT {totalKwp && <span className="text-lg font-normal text-gray-600">({totalKwp} kWp)</span>}
              </h1>
              {/* PV-Konfiguration Bild */}
              {pvConfigFiles.filter(file => file.type?.startsWith('image/')).length > 0 ? (
                <div className="relative group inline-block mt-4">
                  <img
                    src={pvConfigFiles.filter(file => file.type?.startsWith('image/'))[0]?.url}
                    alt="PV-Konfiguration"
                    className="w-32 h-24 object-contain object-left"
                  />
                  <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={pvConfigFiles.filter(file => file.type?.startsWith('image/'))[0]?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 bg-white rounded shadow text-blue-600 hover:bg-blue-50"
                      title="Vollbild"
                    >
                      <Eye className="h-3 w-3" />
                    </a>
                    <button
                      onClick={() => onDeleteFile(pvConfigFiles.filter(file => file.type?.startsWith('image/'))[0])}
                      className="p-1 bg-white rounded shadow text-red-500 hover:bg-red-50"
                      title="Löschen"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center w-32 h-24 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors mt-4 ${isUploading ? 'opacity-70 cursor-wait' : ''}`}>
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Bild</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
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
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-gray-500">Datum:</span>
                  <input
                    type="date"
                    value={offerData.offerDate || ''}
                    onChange={(e) => onUpdateOfferField('offerDate', e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-gray-500">Gültig bis:</span>
                  <input
                    type="date"
                    value={offerData.conditions?.validUntil || ''}
                    onChange={(e) => onUpdateConditions({ validUntil: e.target.value })}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Betreff & Einleitung */}
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Angebot - {offerData.offerNumber || 'Neu'}
            </h2>
            <p className="text-sm text-gray-600">
              {offerTexts?.greeting}
            </p>
          </div>

          {/* Editierbare Positionstabelle */}
          <div className="mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="py-2 text-left font-medium text-gray-700 w-12">Pos.</th>
                  <th className="py-2 text-left font-medium text-gray-700">Beschreibung</th>
                  <th className="py-2 text-right font-medium text-gray-700 w-20">Menge</th>
                  <th className="py-2 text-center font-medium text-gray-700 w-16">Einheit</th>
                  <th className="py-2 text-right font-medium text-gray-700 w-24">EP (netto)</th>
                  <th className="py-2 text-right font-medium text-gray-700 w-16">Rabatt</th>
                  <th className="py-2 text-right font-medium text-gray-700 w-28">Gesamt</th>
                  <th className="py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {offerData.items.map((item, index) => (
                  <tr key={item.id || index} className="border-b border-gray-100 group">
                    <td className="py-3 text-gray-600 align-top">{item.position || index + 1}</td>
                    <td className="py-3">
                      <input
                        type="text"
                        value={item.shortText}
                        onChange={(e) => onUpdateItem(item.id, { shortText: e.target.value })}
                        className="w-full bg-transparent border-0 p-0 focus:ring-0 font-medium text-gray-900"
                      />
                      {item.type === 'manual' ? (
                        <textarea
                          value={item.longText || ''}
                          onChange={(e) => onUpdateItem(item.id, { longText: e.target.value })}
                          placeholder="Beschreibung eingeben..."
                          rows={2}
                          className="w-full bg-transparent border border-gray-200 rounded p-1 mt-1 text-xs text-gray-500 focus:ring-1 focus:ring-blue-500 resize-none"
                        />
                      ) : (
                        item.longText && (
                          <p className="text-xs text-gray-500 mt-1">{item.longText}</p>
                        )
                      )}
                      {item.laborFactor > 1 && (
                        <span className="text-xs text-amber-600 block">
                          +{Math.round((item.laborFactor - 1) * 100)}% Arbeitszeit
                        </span>
                      )}
                      {item.discount > 0 && (
                        <span className="text-xs text-red-600 block">
                          {item.discount}% Rabatt gewährt
                        </span>
                      )}
                    </td>
                    <td className="py-3 align-top">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={item.quantity}
                        onChange={(e) => onUpdateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                        className="w-full text-right bg-transparent border-0 p-0 focus:ring-0"
                      />
                    </td>
                    <td className="py-3 text-center text-gray-600 align-top">{item.unit}</td>
                    <td className="py-3 align-top">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPriceNet}
                        onChange={(e) => onUpdateItem(item.id, { unitPriceNet: parseFloat(e.target.value) || 0 })}
                        className="w-full text-right bg-transparent border-0 p-0 focus:ring-0"
                      />
                    </td>
                    <td className="py-3 align-top">
                      <div className="flex items-center justify-end">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) => onUpdateItem(item.id, { discount: parseFloat(e.target.value) || 0 })}
                          className="w-12 text-right bg-transparent border-0 p-0 focus:ring-0"
                        />
                        <span className="text-gray-400 ml-0.5">%</span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-medium align-top">{formatPrice(item.totalNet)}</td>
                    <td className="py-3 align-top">
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Manuelle Position Button */}
            <button
              onClick={onAddManualItem}
              className="mt-4 w-full py-2 border-2 border-dashed border-gray-200 rounded text-gray-500 hover:border-blue-400 hover:text-blue-600 text-sm flex items-center justify-center transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Manuelle Position hinzufügen
            </button>
          </div>

          {/* Summen */}
          <div className="flex justify-end mb-8">
            <div className="w-72">
              {/* Mengenstaffel Info */}
              {offerData.totals?.quantityScaleDiscount > 0 && (
                <div className="bg-green-50 text-green-700 rounded p-2 mb-3 text-xs">
                  <div className="flex items-center">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Mengenstaffel: {offerData.totals.moduleCount} Module ({offerData.totals.quantityScaleTier?.label})
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>-{offerData.totals.quantityScaleDiscount}% auf Arbeitszeit</span>
                    <span>-{formatPrice(offerData.totals.laborReductionTotal)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Zwischensumme (netto):</span>
                  <span>{formatPrice(offerData.totals?.subtotalNet)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Rabatt:</span>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={offerData.totals?.discountPercent || 0}
                      onChange={(e) => onUpdateTotals({ discountPercent: parseFloat(e.target.value) || 0 })}
                      className="w-12 text-right border border-gray-200 rounded px-1 py-0.5 text-xs"
                    />
                    <span className="text-gray-400 ml-1">%</span>
                    {offerData.totals?.discountAmount > 0 && (
                      <span className="ml-2 text-red-600">-{formatPrice(offerData.totals?.discountAmount)}</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Netto:</span>
                  <span>{formatPrice(offerData.totals?.netTotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">MwSt:</span>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={offerData.totals?.taxRate ?? 0}
                      onChange={(e) => onUpdateTotals({ taxRate: parseFloat(e.target.value) || 0 })}
                      className="w-12 text-right border border-gray-200 rounded px-1 py-0.5 text-xs"
                    />
                    <span className="text-gray-400 ml-1">%</span>
                    <span className="ml-2">{formatPrice(offerData.totals?.taxAmount)}</span>
                  </div>
                </div>
                <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-lg font-bold">
                  <span>Gesamtbetrag:</span>
                  <span>{formatPrice(offerData.totals?.grossTotal)}</span>
                </div>
                {/* Anzahlung */}
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-dashed">
                  <span className="text-gray-600">Anzahlung:</span>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={offerData.depositPercent ?? 50}
                      onChange={(e) => onUpdateOfferField('depositPercent', parseFloat(e.target.value) || 0)}
                      className="w-12 text-right border border-gray-200 rounded px-1 py-0.5 text-xs"
                    />
                    <span className="text-gray-400 ml-1">%</span>
                    <span className="ml-2 font-medium">{formatPrice((offerData.totals?.grossTotal || 0) * ((offerData.depositPercent ?? 50) / 100))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-6 text-sm text-gray-600 space-y-3">
            {(offerData.depositPercent > 0) && (
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
    </div>
  );
};

export default PositionsStep;
