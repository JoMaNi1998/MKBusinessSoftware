import React from 'react';
import { FileText, Plus, Trash2 } from 'lucide-react';
import type { OfferTextSettingsProps } from '@app-types/components/offer.types';

interface AdditionalPage {
  id: string;
  title: string;
  content: string;
}

/**
 * Angebots-Text Einstellungen
 * Verwaltet Angebots-Texte und zusätzliche Seiten für Angebote
 */
const OfferTextSettings: React.FC<OfferTextSettingsProps> = ({ companySettings, companyData, setCompanyData, saveCompanySettings }) => {
  return (
    <div className="space-y-6">
      {/* Angebots-Texte */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-gray-500" />
          Angebots-Texte
        </h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Einleitungstext</label>
            <textarea
              value={companyData?.offerTexts?.greeting ?? companySettings.offerTexts?.greeting ?? ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCompanyData((prev: any) => ({
                ...companySettings,
                ...prev,
                offerTexts: { ...companySettings.offerTexts, ...prev?.offerTexts, greeting: e.target.value }
              }))}
              onBlur={() => companyData && saveCompanySettings(companyData)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zahlungsbedingungen</label>
            <textarea
              value={companyData?.offerTexts?.paymentTerms ?? companySettings.offerTexts?.paymentTerms ?? ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCompanyData((prev: any) => ({
                ...companySettings,
                ...prev,
                offerTexts: { ...companySettings.offerTexts, ...prev?.offerTexts, paymentTerms: e.target.value }
              }))}
              onBlur={() => companyData && saveCompanySettings(companyData)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Abschlusstext</label>
            <textarea
              value={companyData?.offerTexts?.closing ?? companySettings.offerTexts?.closing ?? ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCompanyData((prev: any) => ({
                ...companySettings,
                ...prev,
                offerTexts: { ...companySettings.offerTexts, ...prev?.offerTexts, closing: e.target.value }
              }))}
              onBlur={() => companyData && saveCompanySettings(companyData)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Anzahlungs-Hinweis</label>
            <textarea
              value={companyData?.offerTexts?.depositNote ?? companySettings.offerTexts?.depositNote ?? ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCompanyData((prev: any) => ({
                ...companySettings,
                ...prev,
                offerTexts: { ...companySettings.offerTexts, ...prev?.offerTexts, depositNote: e.target.value }
              }))}
              onBlur={() => companyData && saveCompanySettings(companyData)}
              rows={1}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grußformel</label>
            <input
              type="text"
              value={companyData?.offerTexts?.signature ?? companySettings.offerTexts?.signature ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData((prev: any) => ({
                ...companySettings,
                ...prev,
                offerTexts: { ...companySettings.offerTexts, ...prev?.offerTexts, signature: e.target.value }
              }))}
              onBlur={() => companyData && saveCompanySettings(companyData)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Zusätzliche Seiten */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-md font-medium text-gray-900 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-gray-500" />
            Zusätzliche Seiten für Angebote (Widerrufsrecht, Garantien, etc.)
          </h4>
          <button
            type="button"
            onClick={() => {
              const newPage: AdditionalPage = {
                id: `page-${Date.now()}`,
                title: 'Neue Seite',
                content: ''
              };
              const updatedPages = [...(companySettings.additionalPages || []), newPage];
              const updatedData = {
                ...companySettings,
                ...companyData,
                additionalPages: updatedPages
              };
              setCompanyData(updatedData);
              saveCompanySettings(updatedData);
            }}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Seite hinzufügen
          </button>
        </div>

        {(companyData?.additionalPages || companySettings.additionalPages || []).length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Keine zusätzlichen Seiten konfiguriert</p>
            <p className="text-xs text-gray-400 mt-1">Fügen Sie Seiten wie Widerrufsrecht, Garantien oder AGB hinzu</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(companyData?.additionalPages || companySettings.additionalPages || []).map((page: AdditionalPage, index: number) => (
              <div key={page.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 mr-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seitentitel</label>
                    <input
                      type="text"
                      value={page.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const updatedPages = [...(companyData?.additionalPages || companySettings.additionalPages || [])];
                        updatedPages[index] = { ...page, title: e.target.value };
                        setCompanyData((prev: any) => ({
                          ...companySettings,
                          ...prev,
                          additionalPages: updatedPages
                        }));
                      }}
                      onBlur={() => companyData && saveCompanySettings(companyData)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedPages = (companyData?.additionalPages || companySettings.additionalPages || []).filter((p: AdditionalPage) => p.id !== page.id);
                      const updatedData = {
                        ...companySettings,
                        ...companyData,
                        additionalPages: updatedPages
                      };
                      setCompanyData(updatedData);
                      saveCompanySettings(updatedData);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seiteninhalt</label>
                  <textarea
                    value={page.content}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      const updatedPages = [...(companyData?.additionalPages || companySettings.additionalPages || [])];
                      updatedPages[index] = { ...page, content: e.target.value };
                      setCompanyData((prev: any) => ({
                        ...companySettings,
                        ...prev,
                        additionalPages: updatedPages
                      }));
                    }}
                    onBlur={() => companyData && saveCompanySettings(companyData)}
                    rows={8}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                    placeholder="Seiteninhalt eingeben..."
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferTextSettings;
