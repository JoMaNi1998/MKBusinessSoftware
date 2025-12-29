import React, { ChangeEvent } from 'react';
import { FileText } from 'lucide-react';
import type { CompanySettingsData } from '@app-types/contexts/company.types';

interface InvoiceTextSettingsProps {
  companySettings: CompanySettingsData;
  companyData: CompanySettingsData | null;
  setCompanyData: React.Dispatch<React.SetStateAction<CompanySettingsData | null>>;
  saveCompanySettings: (data: CompanySettingsData) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Rechnungs-Text Einstellungen
 * Verwaltet Texte für Rechnungen
 */
const InvoiceTextSettings: React.FC<InvoiceTextSettingsProps> = ({
  companySettings,
  companyData,
  setCompanyData,
  saveCompanySettings
}) => {
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
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCompanyData(prev => ({
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
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCompanyData(prev => ({
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
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCompanyData(prev => ({
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
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCompanyData(prev => ({
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
