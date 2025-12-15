import { useState, useEffect } from 'react';

/**
 * Hook für die Bestelllisten-Logik
 * Berechnet welche Materialien bestellt werden müssen
 */
export const useOrderList = (materials) => {
  const [orderList, setOrderList] = useState([]);

  useEffect(() => {
    const result = [];

    materials.forEach(m => {
      const isOrdered = m.orderStatus === 'bestellt';
      const orderedQty = m.orderedQuantity || 0;
      const isNegative = m.stock < 0;
      const needed = isNegative ? Math.abs(m.stock) : 0;
      const additionalNeeded = isOrdered && isNegative ? needed - orderedQty : 0;

      // Fall 1: Material ist bestellt - zeige bestellte Menge
      if (isOrdered) {
        result.push({
          ...m,
          _displayType: 'ordered',
          _displayQuantity: orderedQty
        });
      }

      // Fall 2: Material ist bestellt UND es wird mehr benötigt - neue Zeile für Nachbestellung
      if (isOrdered && additionalNeeded > 0) {
        result.push({
          ...m,
          _displayType: 'additional',
          _displayQuantity: additionalNeeded,
          _isAdditionalOrder: true
        });
      }

      // Fall 3: Material ist NICHT bestellt, aber hat negativen Bestand
      if (!isOrdered && isNegative) {
        result.push({
          ...m,
          _displayType: 'needed',
          _displayQuantity: m.excludeFromAutoOrder ? needed : (m.orderQuantity || needed)
        });
      }

      // Fall 4: Niedriger Bestand (nicht negativ, nicht bestellt, nicht ausgeschlossen)
      if (!isOrdered && !isNegative && m.stock <= (m.heatStock || 0) && m.stock > 0 && !m.excludeFromAutoOrder) {
        result.push({
          ...m,
          _displayType: 'low',
          _displayQuantity: m.orderQuantity || 0
        });
      }
    });

    setOrderList(result);
  }, [materials]);

  // Statistiken berechnen
  const lowStockCount = materials.filter(m =>
    m.stock <= (m.heatStock || 0) && m.stock > 0 && m.orderStatus !== 'bestellt' && !m.excludeFromAutoOrder
  ).length;

  const negativeStockCount = materials.filter(m =>
    m.stock < 0 && m.orderStatus !== 'bestellt'
  ).length;

  const toOrderCount = lowStockCount + negativeStockCount;
  const orderedCount = materials.filter(m => m.orderStatus === 'bestellt').length;
  const excludedLowStockCount = materials.filter(m =>
    m.stock <= (m.heatStock || 0) && m.stock > 0 && m.excludeFromAutoOrder && m.orderStatus !== 'bestellt'
  ).length;

  // Ausgeschlossene Materialien mit niedrigem Bestand
  const excludedLowStockMaterials = materials.filter(m =>
    m.stock <= (m.heatStock || 0) && m.stock > 0 && m.excludeFromAutoOrder && m.orderStatus !== 'bestellt'
  );

  return {
    orderList,
    stats: {
      toOrderCount,
      orderedCount,
      excludedLowStockCount,
      totalCount: orderList.length
    },
    excludedLowStockMaterials
  };
};

export default useOrderList;
