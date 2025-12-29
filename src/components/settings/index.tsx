import React, { useState } from 'react';
import {
  Package,
  Zap,
  Users,
  CheckCircle,
  Loader,
  FileSpreadsheet,
  Building2,
  FileText
} from 'lucide-react';
import { useCompany } from '@context/CompanyContext';
import { useCalculation } from '@context/CalculationContext';
import CalculationSettings from '../offers/settings/CalculationSettings';
import ServiceCatalog from '../offers/settings/ServiceCatalog';
import OfferTextSettings from '../offers/settings/OfferTextSettings';
import InvoiceTextSettings from '../invoices/InvoiceTextSettings';
import { CategorySettings } from '../material';
import CompanySettings from './CompanySettings';
import UserSettings from './UserSettings';
import { PvConfiguratorSettings } from '../pv-configurator/settings';
import type { CompanySettingsData } from '@app-types/contexts/company.types';
import type { LucideIcon } from 'lucide-react';

type TabId = 'company' | 'users' | 'pv-configurator' | 'angebote' | 'rechnungen' | 'leistungskatalog' | 'categories';
type AngeboteSubTab = 'kalkulation' | 'texte';

interface Tab {
  id: TabId;
  name: string;
  icon: LucideIcon;
}

const Settings: React.FC = () => {
  const { settings: companySettings, saveSettings: saveCompanySettings, saving: savingCompany } = useCompany();
  const { saving: calculationSaving } = useCalculation();
  const [activeTab, setActiveTab] = useState<TabId>('users');
  const [companyData, setCompanyData] = useState<CompanySettingsData | null>(null);
  const [angeboteSubTab, setAngeboteSubTab] = useState<AngeboteSubTab>('kalkulation');
  const [pvSaving, setPvSaving] = useState<boolean>(false);

  const tabs: Tab[] = [
    { id: 'company', name: 'Firma', icon: Building2 },
    { id: 'users', name: 'Benutzer', icon: Users },
    { id: 'pv-configurator', name: 'PV Konfig', icon: Zap },
    { id: 'angebote', name: 'Angebote', icon: FileText },
    { id: 'rechnungen', name: 'Rechnungen', icon: FileText },
    { id: 'leistungskatalog', name: 'Leistungen', icon: FileSpreadsheet },
    { id: 'categories', name: 'Kategorien', icon: Package }
  ];

  // Determine if autosave indicator should show saving state
  const isSaving =
    (activeTab === 'pv-configurator' && pvSaving) ||
    (activeTab === 'company' && savingCompany) ||
    (activeTab === 'angebote' && (calculationSaving || savingCompany));

  const showAutosaveIndicator =
    activeTab === 'pv-configurator' ||
    activeTab === 'company' ||
    activeTab === 'angebote';

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="pl-12 sm:pl-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Einstellungen</h1>
          <p className="mt-1 text-sm text-gray-600">
            Verwalten Sie Ihre Anwendungseinstellungen und Präferenzen
          </p>
        </div>
        {showAutosaveIndicator && (
          <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
            {isSaving ? (
              <>
                <Loader className="h-4 w-4 animate-spin text-primary-600" />
                <span>Speichert...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Autosave aktiv</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col min-h-0">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 flex-shrink-0">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'company' && (
            <CompanySettings
              companySettings={companySettings}
              companyData={companyData}
              setCompanyData={setCompanyData}
              saveCompanySettings={saveCompanySettings}
              savingCompany={savingCompany}
            />
          )}

          {activeTab === 'users' && (
            <UserSettings />
          )}

          {activeTab === 'pv-configurator' && (
            <PvConfiguratorSettings onSavingChange={setPvSaving} />
          )}

          {activeTab === 'angebote' && (
            <div className="space-y-6">
              {/* Sub-Tabs für Angebote */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setAngeboteSubTab('kalkulation')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      angeboteSubTab === 'kalkulation'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Kalkulation
                  </button>
                  <button
                    onClick={() => setAngeboteSubTab('texte')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      angeboteSubTab === 'texte'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Texte & Seiten
                  </button>
                </nav>
              </div>

              {/* Kalkulation Sub-Tab */}
              {angeboteSubTab === 'kalkulation' && (
                <CalculationSettings />
              )}

              {/* Texte Sub-Tab */}
              {angeboteSubTab === 'texte' && (
                <OfferTextSettings
                  companySettings={companySettings}
                  companyData={companyData}
                  setCompanyData={setCompanyData}
                  saveCompanySettings={saveCompanySettings}
                />
              )}
            </div>
          )}

          {activeTab === 'rechnungen' && (
            <InvoiceTextSettings
              companySettings={companySettings}
              companyData={companyData}
              setCompanyData={setCompanyData}
              saveCompanySettings={saveCompanySettings}
            />
          )}

          {activeTab === 'leistungskatalog' && (
            <ServiceCatalog />
          )}

          {activeTab === 'categories' && (
            <CategorySettings />
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
