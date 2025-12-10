import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CompanySettingsService } from '../services/firebaseService';

const CompanyContext = createContext();

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

// Default-Werte für Firmendaten
const DEFAULT_COMPANY_SETTINGS = {
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

export const CompanyProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_COMPANY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Firebase Real-time Listener
  useEffect(() => {
    let unsubscribe;

    const setupListener = async () => {
      try {
        setLoading(true);
        unsubscribe = CompanySettingsService.subscribeToSettings((settingsData) => {
          if (settingsData) {
            // Merge mit Default-Werten um sicherzustellen dass alle Felder existieren
            setSettings(prev => ({
              ...DEFAULT_COMPANY_SETTINGS,
              ...settingsData,
              company: { ...DEFAULT_COMPANY_SETTINGS.company, ...settingsData.company },
              offerTexts: { ...DEFAULT_COMPANY_SETTINGS.offerTexts, ...settingsData.offerTexts },
              invoiceTexts: { ...DEFAULT_COMPANY_SETTINGS.invoiceTexts, ...settingsData.invoiceTexts },
              footer: { ...DEFAULT_COMPANY_SETTINGS.footer, ...settingsData.footer },
              additionalPages: settingsData.additionalPages || []
            }));
          } else {
            // Keine Einstellungen gefunden, verwende Defaults
            setSettings(DEFAULT_COMPANY_SETTINGS);
          }
          setLoading(false);
        });
      } catch (err) {
        console.error('Error setting up company settings listener:', err);
        setError(err.message);
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
  }, []);

  // Einstellungen speichern
  const saveSettings = useCallback(async (newSettings) => {
    try {
      setSaving(true);
      await CompanySettingsService.saveSettings(newSettings);
      return { success: true };
    } catch (err) {
      console.error('Error saving company settings:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, []);

  // Einzelne Einstellung aktualisieren
  const updateSetting = useCallback(async (path, value) => {
    const newSettings = { ...settings };
    const keys = path.split('.');
    let current = newSettings;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    return saveSettings(newSettings);
  }, [settings, saveSettings]);

  // Firmendaten-Objekt für einfachen Zugriff
  const company = settings.company;
  const offerTexts = settings.offerTexts;
  const invoiceTexts = settings.invoiceTexts;
  const footer = settings.footer;
  const additionalPages = settings.additionalPages || [];

  // Formatierte Adresse
  const formattedAddress = `${company.street}, ${company.zipCode} ${company.city}`;

  const value = {
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
