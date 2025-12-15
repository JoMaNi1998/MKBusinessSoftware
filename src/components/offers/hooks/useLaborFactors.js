import { useState, useCallback } from 'react';
import { LABOR_FACTOR_LABELS } from '../shared';

/**
 * Hook für Arbeitszeitfaktoren-Logik
 */
export const useLaborFactors = (calcSettings) => {
  const [laborFactorSelections, setLaborFactorSelections] = useState({
    dach: 'normal',
    elektro: 'normal',
    geruest: 'normal'
  });

  // Faktor für einen Typ holen
  const getLaborFactor = useCallback((factorType) => {
    const factors = calcSettings?.laborFactors?.[factorType] || [];
    const selected = laborFactorSelections[factorType];
    const factor = factors.find(f => f.id === selected);
    return factor?.laborFactor || 1.0;
  }, [laborFactorSelections, calcSettings?.laborFactors]);

  // Faktor für eine Kategorie bestimmen
  const getFactorForCategory = useCallback((categoryId) => {
    let laborFactor = 1.0;
    const appliedFactors = {};

    if (categoryId === 'pv-montage' || categoryId === 'optimierer') {
      const dachFactor = getLaborFactor('dach');
      laborFactor = dachFactor;
      if (dachFactor > 1) appliedFactors.dach = dachFactor;
    } else if (['elektroinstallation', 'wechselrichter', 'speicher', 'wallbox', 'notstrom', 'energiemanagement', 'erdungsanlage'].includes(categoryId)) {
      const elektroFactor = getLaborFactor('elektro');
      laborFactor = elektroFactor;
      if (elektroFactor > 1) appliedFactors.elektro = elektroFactor;
    } else if (categoryId === 'geruest') {
      const geruestFactor = getLaborFactor('geruest');
      laborFactor = geruestFactor;
      if (geruestFactor > 1) appliedFactors.geruest = geruestFactor;
    }

    return { laborFactor, appliedFactors };
  }, [getLaborFactor]);

  // Preise mit Faktor anpassen
  const adjustPricesWithFactor = useCallback((service, categoryId) => {
    const { laborFactor, appliedFactors } = getFactorForCategory(categoryId || service.category);

    const originalLaborCost = service.calculatedPrices?.laborCost || 0;
    const adjustedLaborCost = originalLaborCost * laborFactor;
    const materialCost = service.calculatedPrices?.materialCostVK || 0;
    const originalUnitPrice = service.calculatedPrices?.unitPriceNet || 0;
    const laborDiff = adjustedLaborCost - originalLaborCost;
    const adjustedUnitPrice = originalUnitPrice + laborDiff;

    return {
      unitPriceNet: adjustedUnitPrice,
      originalUnitPrice,
      laborFactor,
      appliedFactors,
      priceOverridden: laborFactor !== 1.0,
      breakdown: {
        materials: service.materials || [],
        labor: service.labor || [],
        materialCost,
        laborCost: adjustedLaborCost,
        originalLaborCost
      }
    };
  }, [getFactorForCategory]);

  // Faktor-Auswahl ändern
  const setFactorSelection = useCallback((factorType, value) => {
    setLaborFactorSelections(prev => ({
      ...prev,
      [factorType]: value
    }));
  }, []);

  return {
    laborFactorSelections,
    setFactorSelection,
    getLaborFactor,
    getFactorForCategory,
    adjustPricesWithFactor,
    factorTypes: Object.keys(LABOR_FACTOR_LABELS),
    factorLabels: LABOR_FACTOR_LABELS
  };
};

export default useLaborFactors;
