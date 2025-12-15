import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatPrice } from '../../shared/formatPrice';
import InvoiceSummary from '../InvoiceSummary';

const PositionsStep = ({
  invoiceData,
  setInvoiceData,
  handleUpdateItem,
  handleRemoveItem,
  handleAddManualItem,
  customers,
  projects,
  selectedCustomer,
  selectedProject,
  company,
  invoiceTexts,
  footer
}) => {
  const customer = customers.find(c => c.id === selectedCustomer);
  const project = projects.find(p => p.id === selectedProject);

  return (
    <div className="bg-gray-100 -m-6 p-6">
      <div className="max-w-[210mm] mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-8">
          {/* Header mit Firmeninfo rechts */}
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RECHNUNG</h1>
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
                {/* Fallback auf Kundendaten wenn kein Projekt */}
                {!project && customer && (
                  <>
                    <p className="font-medium text-gray-900">{customer.firmennameKundenname || customer.name}</p>
                    {customer.strasse && <p>{customer.strasse}</p>}
                    {(customer.plz || customer.ort) && (
                      <p>{customer.plz} {customer.ort}</p>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Datum:</span>
                  <input
                    type="date"
                    value={invoiceData.invoiceDate}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                    className="border border-gray-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Fällig bis:</span>
                  <input
                    type="date"
                    value={invoiceData.dueDate}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="border border-gray-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
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
                {invoiceData.items.map((item, index) => (
                  <tr key={item.id || index} className="border-b border-gray-100 group">
                    <td className="py-3 text-gray-600 align-top">{item.position || index + 1}</td>
                    <td className="py-3">
                      <input
                        type="text"
                        value={item.shortText}
                        onChange={(e) => handleUpdateItem(item.id, { shortText: e.target.value })}
                        className="w-full bg-transparent border-0 p-0 focus:ring-0 font-medium text-gray-900"
                      />
                      {item.type === 'manual' ? (
                        <textarea
                          value={item.longText || ''}
                          onChange={(e) => handleUpdateItem(item.id, { longText: e.target.value })}
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
                        onChange={(e) => handleUpdateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
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
                        onChange={(e) => handleUpdateItem(item.id, { unitPriceNet: parseFloat(e.target.value) || 0 })}
                        className="w-full text-right bg-transparent border-0 p-0 focus:ring-0"
                      />
                    </td>
                    <td className="py-3 align-top">
                      <div className="flex items-center justify-end">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount || 0}
                          onChange={(e) => handleUpdateItem(item.id, { discount: parseFloat(e.target.value) || 0 })}
                          className="w-12 text-right bg-transparent border-0 p-0 focus:ring-0"
                        />
                        <span className="text-gray-400 ml-0.5">%</span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-medium align-top">{formatPrice(item.totalNet)}</td>
                    <td className="py-3 align-top">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
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
              onClick={handleAddManualItem}
              className="mt-4 w-full py-2 border-2 border-dashed border-gray-200 rounded text-gray-500 hover:border-blue-400 hover:text-blue-600 text-sm flex items-center justify-center transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Manuelle Position hinzufügen
            </button>
          </div>

          {/* Summen */}
          <div className="flex justify-end mb-8">
            <InvoiceSummary
              totals={invoiceData.totals}
              editable={true}
              onDiscountChange={(value) => setInvoiceData(prev => ({
                ...prev,
                totals: { ...prev.totals, discountPercent: value }
              }))}
              onTaxRateChange={(value) => setInvoiceData(prev => ({
                ...prev,
                totals: { ...prev.totals, taxRate: value }
              }))}
            />
          </div>

          {/* Zahlungsinformationen */}
          {(company.iban || company.bic) && (
            <div className="border-t pt-6 mb-6 text-sm">
              <h3 className="font-medium text-gray-900 mb-3">Zahlungsinformationen</h3>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-1">Bankverbindung:</p>
                {company.bankName && <p>{company.bankName}</p>}
                {company.iban && <p>IBAN: {company.iban}</p>}
                {company.bic && <p>BIC: {company.bic}</p>}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-6 text-sm text-gray-600 space-y-3">
            <p>{invoiceTexts.paymentTerms}</p>
            <p>{invoiceTexts.closing}</p>
            <p className="mt-4">{invoiceTexts.signature}</p>
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
