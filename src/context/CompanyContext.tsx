import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CompanySettingsService } from '../services/firebaseService';
import { useAuth } from './AuthContext';
import type {
  CompanyContextValue,
  CompanySettingsData,
  CompanyInfo,
  OfferTexts,
  InvoiceTexts,
  FooterColumns,
  AdditionalPage
} from '../types/contexts/company.types';

const CompanyContext = createContext<CompanyContextValue | undefined>(undefined);

export const useCompany = (): CompanyContextValue => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

// Default-Werte für Firmendaten
const DEFAULT_COMPANY_SETTINGS: CompanySettingsData = {
  // Firmendaten
  company: {
    name: 'Ihr Unternehmen',
    street: 'Musterstraße 123',
    zipCode: '12345',
    city: 'Musterstadt',
    phone: '0123 456789',
    email: 'info@unternehmen.de',
    website: '',
    taxId: '',
    bankName: '',
    iban: '',
    bic: ''
  },

  // Angebots-Texte
  offerTexts: {
    greeting: 'Vielen Dank für Ihre Anfrage. Wir freuen uns, Ihnen folgendes Angebot unterbreiten zu dürfen:',
    paymentTerms: 'Die Endzahlung erfolgt mit einer Frist von sieben Tagen nach Abschluss aller Montagearbeiten.',
    closing: 'Wir würden uns sehr freuen, wenn unser Angebot Ihre Zustimmung findet. Sie haben Fragen oder wünschen weitere Informationen? Rufen Sie uns an – wir sind für Sie da.',
    depositNote: 'Durch Anzahlung stimmen Sie den Widerrufsbedingungen zu.',
    signature: 'Mit freundlichen Grüßen'
  },

  // Rechnungs-Texte
  invoiceTexts: {
    greeting: 'Vielen Dank für Ihren Auftrag. Hiermit stellen wir Ihnen folgende Leistungen in Rechnung:',
    paymentTerms: 'Bitte überweisen Sie den Rechnungsbetrag innerhalb von 14 Tagen auf das unten angegebene Konto.',
    closing: 'Vielen Dank für Ihr Vertrauen in unsere Arbeit.',
    signature: 'Mit freundlichen Grüßen'
  },

  // Fußzeile (3 Spalten)
  footer: {
    column1: '',
    column2: '',
    column3: ''
  },

  // Zusätzliche Seiten (Widerrufsrecht, Garantien, etc.)
  additionalPages: []
};

interface CompanyProviderProps {
  children: React.ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<CompanySettingsData>(DEFAULT_COMPANY_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Firebase Real-time Listener
  // Nur laden wenn User eingeloggt ist
  useEffect(() => {
    // Nicht laden wenn kein User
    if (!user) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const setupListener = async (): Promise<void> => {
      try {
        setLoading(true);
        unsubscribe = CompanySettingsService.subscribeToSettings((settingsData) => {
          // Type assertion: Firebase CompanySettings → CompanySettingsData
          const typedSettings = settingsData as unknown as Partial<CompanySettingsData> | null;
          if (typedSettings) {
            // Merge mit Default-Werten um sicherzustellen dass alle Felder existieren
            setSettings({
              ...DEFAULT_COMPANY_SETTINGS,
              ...typedSettings,
              company: { ...DEFAULT_COMPANY_SETTINGS.company, ...typedSettings.company },
              offerTexts: { ...DEFAULT_COMPANY_SETTINGS.offerTexts, ...typedSettings.offerTexts },
              invoiceTexts: { ...DEFAULT_COMPANY_SETTINGS.invoiceTexts, ...typedSettings.invoiceTexts },
              footer: { ...DEFAULT_COMPANY_SETTINGS.footer, ...typedSettings.footer },
              additionalPages: typedSettings.additionalPages || []
            });
          } else {
            // Keine Einstellungen gefunden, verwende Defaults
            setSettings(DEFAULT_COMPANY_SETTINGS);
          }
          setLoading(false);
        });
      } catch (err) {
        console.error('Error setting up company settings listener:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setSettings(DEFAULT_COMPANY_SETTINGS);
        setLoading(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // Einstellungen speichern
  const saveSettings = useCallback(async (newSettings: CompanySettingsData): Promise<{ success: boolean; error?: string }> => {
    try {
      setSaving(true);
      // Type assertion: CompanySettingsData → Firebase CompanySettings
      await CompanySettingsService.saveSettings(newSettings as unknown as Partial<import('../types').CompanySettings>);
      return { success: true };
    } catch (err) {
      console.error('Error saving company settings:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSaving(false);
    }
  }, []);

  // Einzelne Einstellung aktualisieren
  const updateSetting = useCallback(async (path: string, value: unknown): Promise<{ success: boolean; error?: string }> => {
    const newSettings = { ...settings };
    const keys = path.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = newSettings;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    return saveSettings(newSettings);
  }, [settings, saveSettings]);

  // Firmendaten-Objekt für einfachen Zugriff
  const company: CompanyInfo = settings.company;
  const offerTexts: OfferTexts = settings.offerTexts;
  const invoiceTexts: InvoiceTexts = settings.invoiceTexts;
  const footer: FooterColumns = settings.footer;
  const additionalPages: AdditionalPage[] = settings.additionalPages || [];

  // Formatierte Adresse
  const formattedAddress = `${company.street}, ${company.zipCode} ${company.city}`;

  const value: CompanyContextValue = {
    settings,
    company,
    offerTexts,
    invoiceTexts,
    footer,
    additionalPages,
    formattedAddress,
    loading,
    error,
    saving,
    saveSettings,
    updateSetting,
    DEFAULT_COMPANY_SETTINGS
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};
