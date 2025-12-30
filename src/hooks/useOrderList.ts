import { useState, useEffect } from 'react';
import type { Material } from '@app-types';
import type { OrderMaterialDisplay, UseOrderListReturn } from '@app-types/components/order.types';

/**
 * Hook für die Bestelllisten-Logik
 * Berechnet welche Materialien bestellt werden müssen
 */
export const useOrderList = (materials: Material[]): UseOrderListReturn => {
  const [orderList, setOrderList] = useState<OrderMaterialDisplay[]>([]);

  useEffect(() => {
    const result: OrderMaterialDisplay[] = [];

    materials.forEach(m => {
      const isOrdered = m.orderStatus === 'bestellt';
      const orderedQty = m.orderedQuantity || 0;
      const isNegative = (m.stock || 0) < 0;
      const needed = isNegative ? Math.abs(m.stock || 0) : 0;
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
      if (!isOrdered && !isNegative && (m.stock || 0) <= (m.heatStock || 0) && (m.stock || 0) > 0 && !m.excludeFromAutoOrder) {
        result.push({
          ...m,
          _displayType: 'low',
          _displayQuantity: m.orderQuantity || 0
        });
      }

      // Fall 5: Monteur-Anforderung (orderStatus = 'offen')
      if (m.orderStatus === 'offen') {
        result.push({
          ...m,
          _displayType: 'requested',
          _displayQuantity: m.orderedQuantity || 1
        });
      }
    });

    setOrderList(result);
  }, [materials]);

  // Statistiken berechnen
  const lowStockCount = materials.filter(m =>
    (m.stock || 0) <= (m.heatStock || 0) && (m.stock || 0) > 0 && m.orderStatus !== 'bestellt' && !m.excludeFromAutoOrder
  ).length;

  const negativeStockCount = materials.filter(m =>
    (m.stock || 0) < 0 && m.orderStatus !== 'bestellt'
  ).length;

  const requestedCount = materials.filter(m => m.orderStatus === 'offen').length;

  const toOrderCount = lowStockCount + negativeStockCount + requestedCount;
  const orderedCount = materials.filter(m => m.orderStatus === 'bestellt').length;
  const excludedLowStockCount = materials.filter(m =>
    (m.stock || 0) <= (m.heatStock || 0) && (m.stock || 0) > 0 && m.excludeFromAutoOrder && m.orderStatus !== 'bestellt'
  ).length;

  // Ausgeschlossene Materialien mit niedrigem Bestand
  const excludedLowStockMaterials = materials.filter(m =>
    (m.stock || 0) <= (m.heatStock || 0) && (m.stock || 0) > 0 && m.excludeFromAutoOrder && m.orderStatus !== 'bestellt'
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
