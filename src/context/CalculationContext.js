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
    gesellePrivat: { rate: 58, label: 'Geselle (Privat)' },
    geselleGewerbe: { rate: 68, label: 'Geselle (Gewerbe)' },
    meisterPrivat: { rate: 72, label: 'Meister (Privat)' },
    meisterGewerbe: { rate: 85, label: 'Meister (Gewerbe)' }
  },

  // Zuschläge in %
  margins: {
    defaultMaterialMarkup: 15, // Standard-Materialaufschlag für neue Positionen
    materialMarkup: 15         // Materialaufschlag auf EK (legacy, für Fallback)
  },

  // Steuern
  tax: {
    defaultRate: 0             // Standard MwSt
  },

  // Arbeitszeitfaktoren pro Gewerk
  laborFactors: {
    dach: [
      { id: 'normal', label: 'Normal', laborFactor: 1.0 },
      { id: 'aufwendig', label: 'Aufwendig', laborFactor: 1.15 },
      { id: 'komplex', label: 'Komplex', laborFactor: 1.30 }
    ],
    elektro: [
      { id: 'normal', label: 'Normal', laborFactor: 1.0 },
      { id: 'aufwendig', label: 'Aufwendig', laborFactor: 1.20 },
      { id: 'komplex', label: 'Komplex', laborFactor: 1.40 }
    ],
    geruest: [
      { id: 'normal', label: 'Normal', laborFactor: 1.0 },
      { id: 'aufwendig', label: 'Aufwendig', laborFactor: 1.15 },
      { id: 'komplex', label: 'Komplex', laborFactor: 1.30 }
    ]
  },

  // Mengenstaffel für Arbeitszeit (PV-Montage)
  quantityScales: {
    enabled: true,
    tiers: [
      { minQuantity: 1, maxQuantity: 10, laborDiscount: 0, label: '1-10 Module' },
      { minQuantity: 11, maxQuantity: 20, laborDiscount: 5, label: '11-20 Module' },
      { minQuantity: 21, maxQuantity: 30, laborDiscount: 10, label: '21-30 Module' },
      { minQuantity: 31, maxQuantity: 50, laborDiscount: 15, label: '31-50 Module' },
      { minQuantity: 51, maxQuantity: null, laborDiscount: 20, label: '>50 Module' }
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
              quantityScales: { ...DEFAULT_SETTINGS.quantityScales, ...settingsData.quantityScales },
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
  const calculateMaterialPrice = useCallback((purchasePrice, customMarkup = null) => {
    const markup = (customMarkup !== null ? customMarkup : settings.margins.materialMarkup) / 100;
    return purchasePrice * (1 + markup);
  }, [settings.margins.materialMarkup]);

  // Lohnkosten berechnen (Minuten -> Euro)
  const calculateLaborCost = useCallback((role, minutes) => {
    const hourlyRate = getHourlyRate(role);
    return (minutes / 60) * hourlyRate;
  }, [getHourlyRate]);

  // Einheitspreis berechnen (Material + Lohn)
  const calculateUnitPrice = useCallback((materialCost, laborCost) => {
    return materialCost + laborCost;
  }, []);

  // Vollständige Positionskalkulation
  const calculateServicePosition = useCallback((materials, laborItems, materialsData, customMarkup = null) => {
    // Materialkosten berechnen
    let materialCostEK = 0;
    let materialCostVK = 0;

    materials.forEach(mat => {
      const materialData = materialsData.find(m => m.id === mat.materialID);
      const ekPrice = materialData?.purchasePrice || materialData?.price || 0;
      const quantity = mat.quantity || 1;

      materialCostEK += ekPrice * quantity;
      materialCostVK += calculateMaterialPrice(ekPrice, customMarkup) * quantity;
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
  const calculateTax = useCallback((netAmount) => {
    const rate = settings.tax.defaultRate ?? 0;
    return netAmount * (rate / 100);
  }, [settings.tax]);

  // Brutto berechnen
  const calculateGross = useCallback((netAmount) => {
    const tax = calculateTax(netAmount);
    return netAmount + tax;
  }, [calculateTax]);

  // Modulanzahl aus Angebotspositionen ermitteln (für Mengenstaffel)
  const getModuleCount = useCallback((items) => {
    return items
      .filter(item => item.category === 'pv-montage' && item.unit === 'Stk')
      .reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, []);

  // Passende Staffel für Modulanzahl finden
  const getQuantityScaleTier = useCallback((moduleCount) => {
    if (!settings.quantityScales?.enabled || !settings.quantityScales?.tiers) {
      return null;
    }
    return settings.quantityScales.tiers.find(t =>
      moduleCount >= t.minQuantity &&
      (t.maxQuantity === null || moduleCount <= t.maxQuantity)
    ) || null;
  }, [settings.quantityScales]);

  // Staffelrabatt in Prozent ermitteln
  const getQuantityScaleDiscount = useCallback((moduleCount) => {
    const tier = getQuantityScaleTier(moduleCount);
    return tier?.laborDiscount || 0;
  }, [getQuantityScaleTier]);

  // Angebotssummen berechnen (mit Mengenstaffel)
  const calculateOfferTotals = useCallback((items, globalDiscount = 0, customTaxRate = null) => {
    // Modulanzahl und Staffelrabatt ermitteln
    const moduleCount = getModuleCount(items);
    const quantityScaleDiscount = getQuantityScaleDiscount(moduleCount);
    const quantityScaleTier = getQuantityScaleTier(moduleCount);

    // Staffelrabatt auf Arbeitszeit der PV-Montage-Positionen anwenden
    let laborReductionTotal = 0;
    if (quantityScaleDiscount > 0) {
      items.forEach(item => {
        if (item.category === 'pv-montage' && item.breakdown?.laborCost) {
          const laborReduction = item.breakdown.laborCost * (item.quantity || 1) * (quantityScaleDiscount / 100);
          laborReductionTotal += laborReduction;
        }
      });
    }

    const subtotalNet = items.reduce((sum, item) => sum + (item.totalNet || 0), 0);
    const subtotalAfterScale = subtotalNet - laborReductionTotal;
    const discountAmount = subtotalAfterScale * (globalDiscount / 100);
    const netTotal = subtotalAfterScale - discountAmount;

    // Verwende custom taxRate falls angegeben, sonst default
    const taxRate = customTaxRate !== null ? customTaxRate : settings.tax.defaultRate;
    const taxAmount = netTotal * (taxRate / 100);
    const grossTotal = netTotal + taxAmount;

    return {
      subtotalNet,
      laborReductionTotal,
      subtotalAfterScale,
      discountPercent: globalDiscount,
      discountAmount,
      netTotal,
      taxRate,
      taxAmount,
      grossTotal,
      // Staffel-Infos
      moduleCount,
      quantityScaleDiscount,
      quantityScaleTier
    };
  }, [settings.tax.defaultRate, getModuleCount, getQuantityScaleDiscount, getQuantityScaleTier]);

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
    // Mengenstaffel-Funktionen
    getModuleCount,
    getQuantityScaleTier,
    getQuantityScaleDiscount,
    DEFAULT_SETTINGS
  };

  return (
    <CalculationContext.Provider value={value}>
      {children}
    </CalculationContext.Provider>
  );
};
