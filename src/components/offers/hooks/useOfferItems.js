import { useState, useCallback, useEffect, useRef } from 'react';
import { useNotification } from '../../../context/NotificationContext';

/**
 * Hook für Angebots-Positionen-Logik
 */
export const useOfferItems = ({
  defaultServices,
  activeServices,
  calculateOfferTotals,
  adjustPricesWithFactor,
  isEditing
}) => {
  const { showNotification } = useNotification();
  const defaultsAddedRef = useRef(false);

  const [offerData, setOfferData] = useState({
    items: [],
    offerDate: new Date().toISOString().split('T')[0],
    totals: {
      subtotalNet: 0,
      discountPercent: 0,
      discountAmount: 0,
      netTotal: 0,
      taxRate: 0,
      taxAmount: 0,
      grossTotal: 0
    },
    conditions: {
      validUntil: '',
      paymentTerms: '',
      deliveryTerms: '',
      notes: ''
    },
    depositPercent: 50
  });

  // Pflichtpositionen automatisch hinzufügen bei neuen Angeboten
  useEffect(() => {
    if (!isEditing && offerData.items.length === 0 && defaultServices.length > 0 && !defaultsAddedRef.current) {
      defaultsAddedRef.current = true;

      const defaultItems = defaultServices.map((service, index) => ({
        id: `item-${Date.now()}-${index}`,
        position: index + 1,
        type: 'service',
        serviceID: service.id,
        category: service.category,
        shortText: service.shortText,
        longText: service.longText,
        quantity: service.defaultQuantity || 1,
        unit: service.unit,
        unitPriceNet: service.calculatedPrices?.unitPriceNet || 0,
        originalUnitPrice: service.calculatedPrices?.unitPriceNet || 0,
        priceOverridden: false,
        discount: 0,
        totalNet: (service.defaultQuantity || 1) * (service.calculatedPrices?.unitPriceNet || 0),
        isDefaultPosition: true,
        breakdown: {
          materials: service.materials,
          labor: service.labor,
          materialCost: service.calculatedPrices?.materialCostVK || 0,
          laborCost: service.calculatedPrices?.laborCost || 0
        }
      }));

      setOfferData(prev => ({
        ...prev,
        items: defaultItems
      }));

      if (defaultItems.length > 0) {
        showNotification(`${defaultItems.length} Pflichtposition(en) hinzugefügt`, 'info');
      }
    }
  }, [isEditing, defaultServices, showNotification, offerData.items.length]);

  // Totals neu berechnen
  useEffect(() => {
    if (calculateOfferTotals) {
      const totals = calculateOfferTotals(
        offerData.items,
        offerData.totals?.discountPercent || 0,
        offerData.totals?.taxRate ?? 0
      );
      setOfferData(prev => ({
        ...prev,
        totals: { ...totals, taxRate: prev.totals?.taxRate ?? 0 }
      }));
    }
  }, [offerData.items, offerData.totals?.discountPercent, offerData.totals?.taxRate, calculateOfferTotals]);

  // Service zum Angebot hinzufügen
  const addService = useCallback((service) => {
    const priceData = adjustPricesWithFactor(service, service.category);

    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: offerData.items.length + 1,
      type: 'service',
      serviceID: service.id,
      category: service.category || '',
      shortText: service.shortText || '',
      longText: service.longText || '',
      quantity: 1,
      unit: service.unit || 'Stk',
      discount: 0,
      totalNet: priceData.unitPriceNet,
      ...priceData
    };

    setOfferData(prev => {
      const regularItems = prev.items.filter(item => !item.isDefaultPosition);
      const defaultItems = prev.items.filter(item => item.isDefaultPosition);
      const allItems = [...regularItems, newItem, ...defaultItems].map((item, index) => ({
        ...item,
        position: index + 1
      }));
      return { ...prev, items: allItems };
    });

    const factorInfo = priceData.laborFactor > 1 ? ` (+${Math.round((priceData.laborFactor - 1) * 100)}% Arbeitszeit)` : '';
    showNotification(`Position hinzugefügt${factorInfo}`, 'success');
  }, [offerData.items.length, adjustPricesWithFactor, showNotification]);

  // Manuelle Position hinzufügen
  const addManualItem = useCallback(() => {
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: 0,
      type: 'manual',
      serviceID: null,
      shortText: 'Neue Position',
      longText: '',
      quantity: 1,
      unit: 'Stk',
      unitPriceNet: 0,
      originalUnitPrice: 0,
      priceOverridden: true,
      discount: 0,
      totalNet: 0
    };

    setOfferData(prev => {
      const regularItems = prev.items.filter(item => !item.isDefaultPosition);
      const defaultItems = prev.items.filter(item => item.isDefaultPosition);
      const allItems = [...regularItems, newItem, ...defaultItems].map((item, index) => ({
        ...item,
        position: index + 1
      }));
      return { ...prev, items: allItems };
    });
  }, []);

  // Position aktualisieren
  const updateItem = useCallback((itemId, updates) => {
    setOfferData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, ...updates };
          updatedItem.totalNet = (updatedItem.quantity || 1) * (updatedItem.unitPriceNet || 0) * (1 - (updatedItem.discount || 0) / 100);
          if (updates.unitPriceNet !== undefined && updates.unitPriceNet !== item.originalUnitPrice) {
            updatedItem.priceOverridden = true;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  }, []);

  // Position entfernen
  const removeItem = useCallback((itemId) => {
    setOfferData(prev => ({
      ...prev,
      items: prev.items
        .filter(item => item.id !== itemId)
        .map((item, index) => ({ ...item, position: index + 1 }))
    }));
  }, []);

  // Offer Data direkt setzen (für Laden von bestehendem Angebot)
  const setOffer = useCallback((data) => {
    setOfferData(data);
  }, []);

  // Einzelne Felder aktualisieren
  const updateOfferField = useCallback((field, value) => {
    setOfferData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Conditions aktualisieren
  const updateConditions = useCallback((updates) => {
    setOfferData(prev => ({
      ...prev,
      conditions: { ...prev.conditions, ...updates }
    }));
  }, []);

  // Totals aktualisieren
  const updateTotals = useCallback((updates) => {
    setOfferData(prev => ({
      ...prev,
      totals: { ...prev.totals, ...updates }
    }));
  }, []);

  return {
    offerData,
    setOffer,
    updateOfferField,
    updateConditions,
    updateTotals,
    addService,
    addManualItem,
    updateItem,
    removeItem
  };
};

export default useOfferItems;
