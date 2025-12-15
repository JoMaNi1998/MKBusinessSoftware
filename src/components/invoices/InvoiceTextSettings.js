import React from 'react';
import { FileText } from 'lucide-react';

/**
 * Rechnungs-Text Einstellungen
 * Verwaltet Texte für Rechnungen
 */
const InvoiceTextSettings = ({ companySettings, companyData, setCompanyData, saveCompanySettings }) => {
  return (
    <div className="space-y-6">
      {/* Rechnungs-Texte */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-gray-500" />
          Rechnungs-Texte
        </h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Einleitungstext</label>
            <textarea
              value={companyData?.invoiceTexts?.greeting ?? companySettings.invoiceTexts?.greeting ?? ''}
              onChange={(e) => setCompanyData(prev => ({
                ...companySettings,
                ...prev,
                invoiceTexts: { ...companySettings.invoiceTexts, ...prev?.invoiceTexts, greeting: e.target.value }
              }))}
              onBlur={() => companyData && saveCompanySettings(companyData)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zahlungsbedingungen</label>
            <textarea
              value={companyData?.invoiceTexts?.paymentTerms ?? companySettings.invoiceTexts?.paymentTerms ?? ''}
              onChange={(e) => setCompanyData(prev => ({
                ...companySettings,
                ...prev,
                invoiceTexts: { ...companySettings.invoiceTexts, ...prev?.invoiceTexts, paymentTerms: e.target.value }
              }))}
              onBlur={() => companyData && saveCompanySettings(companyData)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Abschlusstext</label>
            <textarea
              value={companyData?.invoiceTexts?.closing ?? companySettings.invoiceTexts?.closing ?? ''}
              onChange={(e) => setCompanyData(prev => ({
                ...companySettings,
                ...prev,
                invoiceTexts: { ...companySettings.invoiceTexts, ...prev?.invoiceTexts, closing: e.target.value }
              }))}
              onBlur={() => companyData && saveCompanySettings(companyData)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grußformel</label>
            <input
              type="text"
              value={companyData?.invoiceTexts?.signature ?? companySettings.invoiceTexts?.signature ?? ''}
              onChange={(e) => setCompanyData(prev => ({
                ...companySettings,
                ...prev,
                invoiceTexts: { ...companySettings.invoiceTexts, ...prev?.invoiceTexts, signature: e.target.value }
              }))}
              onBlur={() => companyData && saveCompanySettings(companyData)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTextSettings;
