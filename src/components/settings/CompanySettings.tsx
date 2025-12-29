import React from 'react';
import {
  Building2,
  CreditCard,
  FileText,
  Loader
} from 'lucide-react';
import type { CompanySettingsProps } from '@app-types/components/settings.types';

const CompanySettings: React.FC<CompanySettingsProps> = ({
  companySettings,
  companyData,
  setCompanyData,
  saveCompanySettings,
  savingCompany
}) => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Firmendaten & Texte</h3>
          <p className="text-sm text-gray-600">
            Konfigurieren Sie Ihre Firmendaten und Texte für Angebote und Rechnungen
          </p>
        </div>
        {savingCompany && (
          <div className="flex items-center text-sm text-gray-500">
            <Loader className="animate-spin h-4 w-4 mr-2" />
            Speichert...
          </div>
        )}
      </div>

      {/* Firmendaten */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
          <Building2 className="h-5 w-5 mr-2 text-gray-500" />
          Firmendaten
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Firmenname</label>
            <input
              type="text"
              value={companyData?.company?.name ?? companySettings.company?.name ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData(prev => ({
                ...companySettings,
                ...prev,
                company: { ...companySettings.company, ...prev?.company, name: e.target.value }
              }))}
              onBlur={() => companyData && saveCompanySettings(companyData)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
            <input
              type="email"
              value={companyData?.company?.email ?? companySettings.company?.email ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData(prev => ({
                ...companySettings,
                ...prev,
                company: { ...companySettings.company, ...prev?.company, email: e.target.value }
              }))}
              onBlur={() => companyData && saveCompanySettings(companyData)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Straße</label>
            <input
              type="text"
              value={companyData?.company?.street ?? companySettings.company?.street ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData(prev => ({
                ...companySettings,
                ...prev,
                company: { ...companySettings.company, ...prev?.company, street: e.target.value }
              }))}
              onBlur={() => companyData && saveCompanySettings(companyData)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="text"
              value={companyData?.company?.phone ?? companySettings.company?.phone ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData(prev => ({
                ...companySettings,
                ...prev,
                company: { ...companySettings.company, ...prev?.company, phone: e.target.value }
              }))}
              onBlur={() => companyData && saveCompanySettings(companyData)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PLZ</label>
            <input
              type="text"
              value={companyData?.company?.zipCode ?? companySettings.company?.zipCode ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData(prev => ({
                ...companySettings,
                ...prev,
                company: { ...companySettings.company, ...prev?.company, zipCode: e.target.value }
              }))}
              onBlur={() => companyData && saveCompanySettings(companyData)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ort</label>
            <input
              type="text"
              value={companyData?.company?.city ?? companySettings.company?.city ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData(prev => ({
                ...companySettings,
                ...prev,
                company: { ...companySettings.company, ...prev?.company, city: e.target.value }
              }))}
              onBlur={() => companyData && saveCompanySettings(companyData)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              type="text"
              value={companyData?.company?.website ?? companySettings.company?.website ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData(prev => ({
                ...companySettings,
                ...prev,
                company: { ...companySettings.company, ...prev?.company, website: e.target.value }
              }))}
              onBlur={() => companyData && saveCompanySettings(companyData)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Steuernummer / USt-IdNr.</label>
            <input
              type="text"
              value={companyData?.company?.taxId ?? companySettings.company?.taxId ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData(prev => ({
                ...companySettings,
                ...prev,
                company: { ...companySettings.company, ...prev?.company, taxId: e.target.value }
              }))}
              onBlur={() => companyData && saveCompanySettings(companyData)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Bankdaten */}
        <h5 className="text-sm font-medium text-gray-900 mt-6 mb-3 flex items-center">
          <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
          Bankverbindung
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
            <input
              type="text"
              value={companyData?.company?.bankName ?? companySettings.company?.bankName ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData(prev => ({
                ...companySettings,
                ...prev,
                company: { ...companySettings.company, ...prev?.company, bankName: e.target.value }
              }))}
              onBlur={() => companyData && saveCompanySettings(companyData)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
            <input
              type="text"
              value={companyData?.company?.iban ?? companySettings.company?.iban ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData(prev => ({
                ...companySettings,
                ...prev,
                company: { ...companySettings.company, ...prev?.company, iban: e.target.value }
              }))}
              onBlur={() => companyData && saveCompanySettings(companyData)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">BIC</label>
            <input
              type="text"
              value={companyData?.company?.bic ?? companySettings.company?.bic ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData(prev => ({
                ...companySettings,
                ...prev,
                company: { ...companySettings.company, ...prev?.company, bic: e.target.value }
              }))}
              onBlur={() => companyData && saveCompanySettings(companyData)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Fußzeile (3 Spalten) */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-gray-500" />
          Fußzeile (wird auf jeder Seite angezeigt)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Spalte 1 (Links)</label>
            <textarea
              value={companyData?.footer?.column1 ?? companySettings.footer?.column1 ?? ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCompanyData(prev => ({
                ...companySettings,
                ...prev,
                footer: { ...companySettings.footer, ...prev?.footer, column1: e.target.value }
              }))}
              onBlur={() => companyData && saveCompanySettings(companyData)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="z.B. Firmenname&#10;Inhaber&#10;Adresse"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Spalte 2 (Mitte)</label>
            <textarea
              value={companyData?.footer?.column2 ?? companySettings.footer?.column2 ?? ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCompanyData(prev => ({
                ...companySettings,
                ...prev,
                footer: { ...companySettings.footer, ...prev?.footer, column2: e.target.value }
              }))}
              onBlur={() => companyData && saveCompanySettings(companyData)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="z.B. Bank&#10;IBAN&#10;BIC"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Spalte 3 (Rechts)</label>
            <textarea
              value={companyData?.footer?.column3 ?? companySettings.footer?.column3 ?? ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCompanyData(prev => ({
                ...companySettings,
                ...prev,
                footer: { ...companySettings.footer, ...prev?.footer, column3: e.target.value }
              }))}
              onBlur={() => companyData && saveCompanySettings(companyData)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="z.B. USt-IdNr.&#10;Finanzamt&#10;Kontakt"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;
