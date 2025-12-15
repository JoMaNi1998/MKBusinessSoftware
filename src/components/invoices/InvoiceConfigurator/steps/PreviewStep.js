import React from 'react';
import { formatPrice } from '../../shared/formatPrice';
import { formatDate } from '../../shared/formatDate';

const PreviewStep = ({
  invoiceData,
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
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Datum:</span>
                  <span>{formatDate(invoiceData.invoiceDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fällig bis:</span>
                  <span>{formatDate(invoiceData.dueDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Betreff */}
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Rechnung {invoiceData.offerNumber && <span className="text-sm font-normal text-gray-600">(Ref: {invoiceData.offerNumber})</span>}
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
                {invoiceData.items.map((item, index) => (
                  <tr key={item.id || index} className="border-b border-gray-100">
                    <td className="py-3 text-gray-600">{item.position || index + 1}</td>
                    <td className="py-3">
                      <p className="font-medium text-gray-900">{item.shortText}</p>
                      {item.longText && (
                        <p className="text-xs text-gray-500 mt-1">{item.longText}</p>
                      )}
                      {item.discount > 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          {item.discount}% Rabatt
                        </p>
                      )}
                    </td>
                    <td className="py-3 text-right">{item.quantity}</td>
                    <td className="py-3 text-center text-gray-600">{item.unit}</td>
                    <td className="py-3 text-right">
                      {item.discount > 0 ? (
                        <div>
                          <span className="line-through text-gray-400 text-xs">{formatPrice(item.unitPriceNet)}</span>
                          <span className="block text-red-600">{formatPrice(item.unitPriceNet * (1 - item.discount / 100))}</span>
                        </div>
                      ) : (
                        formatPrice(item.unitPriceNet)
                      )}
                    </td>
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
                  <span>{formatPrice(invoiceData.totals?.subtotalNet)}</span>
                </div>
                {invoiceData.totals?.discountPercent > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Rabatt ({invoiceData.totals?.discountPercent}%):</span>
                    <span>- {formatPrice(invoiceData.totals?.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Netto:</span>
                  <span>{formatPrice(invoiceData.totals?.netTotal)}</span>
                </div>
                {(invoiceData.totals?.taxRate > 0) ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600">MwSt ({invoiceData.totals?.taxRate}%):</span>
                    <span>{formatPrice(invoiceData.totals?.taxAmount)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-600">0% MwSt. nach §12 UStG</span>
                    <span>{formatPrice(0)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-lg font-bold">
                  <span>Gesamtbetrag:</span>
                  <span>{formatPrice(invoiceData.totals?.grossTotal)}</span>
                </div>
              </div>
            </div>
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

export default PreviewStep;
