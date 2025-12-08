import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CalculationSettingsService } from '../services/firebaseService';

const CalculationContext = createContext();

export const useCalculation = () => {
  const context = useContext(CalculationContext);
  if (!context) {
    throw new Error('useCalculation must be used within a CalculationProvider');
  }
  return context;
};

// Default-Werte für Kalkulationseinstellungen
const DEFAULT_SETTINGS = {
  // Stundensätze (netto)
  hourlyRates: {
    meister: { rate: 72, label: 'Meister' },
    geselle: { rate: 58, label: 'Geselle' },
    helfer: { rate: 42, label: 'Helfer/Azubi' }
  },

  // Zuschläge in %
  margins: {
    materialMarkup: 15,        // Materialaufschlag auf EK
    profitMargin: 15,          // Gewinnmarge auf Selbstkosten
    riskMargin: 5,             // Wagnis/Risiko
    discountBuffer: 3          // Skonto-Puffer
  },

  // Steuern
  tax: {
    defaultRate: 19,           // Standard MwSt
    reducedRate: 7             // Ermäßigt
  },

  // Arbeitszeitfaktoren für erschwerte Bedingungen
  laborFactors: {
    roofPitchCategories: [
      { id: 'standard', label: 'Standard (0-25°)', laborFactor: 1.0 },
      { id: 'medium', label: 'Mittel (25-35°)', laborFactor: 1.15 },
      { id: 'steep', label: 'Steil (>35°)', laborFactor: 1.30 }
    ],
    cableLengthCategories: [
      { id: 'standard', label: 'Standard (<15m)', laborFactor: 1.0 },
      { id: 'medium', label: 'Mittel (15-30m)', laborFactor: 1.20 },
      { id: 'long', label: 'Lang (>30m)', laborFactor: 1.40 }
    ],
    pvLayoutCategories: [
      { id: 'standard', label: 'Standard (einfach)', laborFactor: 1.0 },
      { id: 'medium', label: 'Mittel (mehrere Flächen)', laborFactor: 1.15 },
      { id: 'complex', label: 'Komplex (Gauben/Verschattung)', laborFactor: 1.30 }
    ],
    travelCategories: [
      { id: 'standard', label: 'Standard (<30km)', laborFactor: 1.0 },
      { id: 'medium', label: 'Mittel (30-60km)', laborFactor: 1.15 },
      { id: 'far', label: 'Weit (>60km)', laborFactor: 1.30 }
    ]
  },

  // Angebotseinstellungen
  offerDefaults: {
    validityDays: 30,          // Gültigkeit in Tagen
    paymentTerms: '14 Tage netto',
    deliveryTerms: 'Nach Vereinbarung',
    numberPrefix: 'ANG',
    numberFormat: 'ANG-{YEAR}-{NUMBER}'
  }
};

export const CalculationProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Firebase Real-time Listener
  useEffect(() => {
    let unsubscribe;

    const setupListener = async () => {
      try {
        setLoading(true);
        unsubscribe = CalculationSettingsService.subscribeToSettings((settingsData) => {
          if (settingsData) {
            // Merge mit Default-Werten um sicherzustellen dass alle Felder existieren
            setSettings(prev => ({
              ...DEFAULT_SETTINGS,
              ...settingsData,
              hourlyRates: { ...DEFAULT_SETTINGS.hourlyRates, ...settingsData.hourlyRates },
              margins: { ...DEFAULT_SETTINGS.margins, ...settingsData.margins },
              tax: { ...DEFAULT_SETTINGS.tax, ...settingsData.tax },
              laborFactors: { ...DEFAULT_SETTINGS.laborFactors, ...settingsData.laborFactors },
              offerDefaults: { ...DEFAULT_SETTINGS.offerDefaults, ...settingsData.offerDefaults }
            }));
          } else {
            // Keine Einstellungen gefunden, verwende Defaults
            setSettings(DEFAULT_SETTINGS);
          }
          setLoading(false);
        });
      } catch (err) {
        console.error('Error setting up calculation settings listener:', err);
        setError(err.message);
        setSettings(DEFAULT_SETTINGS);
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
      await CalculationSettingsService.saveSettings(newSettings);
      return { success: true };
    } catch (err) {
      console.error('Error saving calculation settings:', err);
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

  // Stundensatz für eine Rolle abrufen
  const getHourlyRate = useCallback((role) => {
    return settings.hourlyRates[role]?.rate || 0;
  }, [settings.hourlyRates]);

  // Materialpreis mit Aufschlag berechnen
  const calculateMaterialPrice = useCallback((purchasePrice) => {
    const markup = settings.margins.materialMarkup / 100;
    return purchasePrice * (1 + markup);
  }, [settings.margins.materialMarkup]);

  // Lohnkosten berechnen (Minuten -> Euro)
  const calculateLaborCost = useCallback((role, minutes) => {
    const hourlyRate = getHourlyRate(role);
    return (minutes / 60) * hourlyRate;
  }, [getHourlyRate]);

  // Einheitspreis berechnen (Material + Lohn + Zuschläge)
  const calculateUnitPrice = useCallback((materialCost, laborCost) => {
    const subtotal = materialCost + laborCost;
    const profitMargin = settings.margins.profitMargin / 100;
    const riskMargin = settings.margins.riskMargin / 100;

    return subtotal * (1 + profitMargin + riskMargin);
  }, [settings.margins]);

  // Vollständige Positionskalkulation
  const calculateServicePosition = useCallback((materials, laborItems, materialsData) => {
    // Materialkosten berechnen
    let materialCostEK = 0;
    let materialCostVK = 0;

    materials.forEach(mat => {
      const materialData = materialsData.find(m => m.id === mat.materialID);
      const ekPrice = materialData?.purchasePrice || materialData?.price || 0;
      const quantity = mat.quantity || 1;

      materialCostEK += ekPrice * quantity;
      materialCostVK += calculateMaterialPrice(ekPrice) * quantity;
    });

    // Lohnkosten berechnen
    let laborCost = 0;
    laborItems.forEach(item => {
      laborCost += calculateLaborCost(item.role, item.minutes);
    });

    // Selbstkosten
    const subtotal = materialCostVK + laborCost;

    // Endpreis mit Zuschlägen
    const unitPriceNet = calculateUnitPrice(materialCostVK, laborCost);

    return {
      materialCostEK,
      materialCostVK,
      laborCost,
      subtotal,
      unitPriceNet,
      lastCalculated: new Date().toISOString()
    };
  }, [calculateMaterialPrice, calculateLaborCost, calculateUnitPrice]);

  // MwSt berechnen
  const calculateTax = useCallback((netAmount, reduced = false) => {
    const rate = reduced ? settings.tax.reducedRate : settings.tax.defaultRate;
    return netAmount * (rate / 100);
  }, [settings.tax]);

  // Brutto berechnen
  const calculateGross = useCallback((netAmount, reduced = false) => {
    const tax = calculateTax(netAmount, reduced);
    return netAmount + tax;
  }, [calculateTax]);

  // Angebotssummen berechnen
  const calculateOfferTotals = useCallback((items, globalDiscount = 0) => {
    const subtotalNet = items.reduce((sum, item) => sum + (item.totalNet || 0), 0);
    const discountAmount = subtotalNet * (globalDiscount / 100);
    const netTotal = subtotalNet - discountAmount;
    const taxAmount = calculateTax(netTotal);
    const grossTotal = netTotal + taxAmount;

    return {
      subtotalNet,
      discountPercent: globalDiscount,
      discountAmount,
      netTotal,
      taxRate: settings.tax.defaultRate,
      taxAmount,
      grossTotal
    };
  }, [calculateTax, settings.tax.defaultRate]);

  // Gültigkeitsdatum berechnen
  const calculateValidUntil = useCallback((fromDate = new Date()) => {
    const validityDays = settings.offerDefaults.validityDays;
    const validUntil = new Date(fromDate);
    validUntil.setDate(validUntil.getDate() + validityDays);
    return validUntil.toISOString().split('T')[0];
  }, [settings.offerDefaults.validityDays]);

  const value = {
    settings,
    loading,
    error,
    saving,
    saveSettings,
    updateSetting,
    getHourlyRate,
    calculateMaterialPrice,
    calculateLaborCost,
    calculateUnitPrice,
    calculateServicePosition,
    calculateTax,
    calculateGross,
    calculateOfferTotals,
    calculateValidUntil,
    DEFAULT_SETTINGS
  };

  return (
    <CalculationContext.Provider value={value}>
      {children}
    </CalculationContext.Provider>
  );
};
