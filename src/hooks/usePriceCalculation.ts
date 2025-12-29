import { useState, useCallback } from 'react';

/**
 * Preis-Berechnungsstate
 */
export interface PriceState {
  qty: string;
  price: string;
  totalPrice: string;
  priceMode: 'unit' | 'total';
}

/**
 * Return-Type des usePriceCalculation Hooks
 */
export interface UsePriceCalculationReturn {
  state: PriceState;
  setQty: (qty: string) => void;
  setUnitPrice: (price: string) => void;
  setTotalPrice: (total: string) => void;
  setPriceMode: (mode: 'unit' | 'total') => void;
  reset: (initialQty?: number, initialPrice?: number | string) => void;
  getNumericValues: () => { qty: number; unitPrice: number; totalPrice: number };
}

/**
 * Parst einen String-Preis zu einer Zahl (unterstützt Komma als Dezimaltrennzeichen)
 */
const parsePrice = (value: string): number => {
  const parsed = parseFloat(value.replace(',', '.'));
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formatiert eine Zahl als Preis-String (mit Komma als Dezimaltrennzeichen)
 */
const formatPrice = (value: number): string => {
  return value.toFixed(2).replace('.', ',');
};

/**
 * Hook für Preis-Berechnung zwischen Stückpreis und Gesamtpreis
 *
 * Ermöglicht bidirektionale Berechnung:
 * - Stückpreis × Menge = Gesamtpreis
 * - Gesamtpreis ÷ Menge = Stückpreis
 *
 * @example
 * ```tsx
 * const { state, setQty, setUnitPrice, setTotalPrice, setPriceMode, reset } = usePriceCalculation();
 *
 * // Bei Modal-Öffnung initialisieren
 * useEffect(() => {
 *   if (isOpen && material) {
 *     reset(material.orderQuantity, material.price);
 *   }
 * }, [isOpen, material]);
 *
 * return (
 *   <input value={state.qty} onChange={(e) => setQty(e.target.value)} />
 *   <input value={state.price} onChange={(e) => setUnitPrice(e.target.value)} />
 *   <span>Gesamt: {state.totalPrice} €</span>
 * );
 * ```
 */
export const usePriceCalculation = (): UsePriceCalculationReturn => {
  const [state, setState] = useState<PriceState>({
    qty: '',
    price: '',
    totalPrice: '',
    priceMode: 'unit'
  });

  /**
   * Berechnet und setzt den Gesamtpreis basierend auf Menge und Stückpreis
   */
  const calculateTotal = useCallback((qty: string, unitPrice: string): string => {
    const qtyNum = parseInt(qty, 10);
    const priceNum = parsePrice(unitPrice);
    if (!isNaN(qtyNum) && qtyNum > 0 && priceNum > 0) {
      return formatPrice(qtyNum * priceNum);
    }
    return '';
  }, []);

  /**
   * Berechnet und setzt den Stückpreis basierend auf Menge und Gesamtpreis
   */
  const calculateUnitPrice = useCallback((qty: string, total: string): string => {
    const qtyNum = parseInt(qty, 10);
    const totalNum = parsePrice(total);
    if (!isNaN(qtyNum) && qtyNum > 0 && totalNum > 0) {
      return formatPrice(totalNum / qtyNum);
    }
    return '';
  }, []);

  /**
   * Setzt die Menge und berechnet abhängige Werte
   */
  const setQty = useCallback((newQty: string): void => {
    setState(prev => {
      const qtyNum = parseInt(newQty, 10);
      if (isNaN(qtyNum) || qtyNum <= 0) {
        return { ...prev, qty: newQty };
      }

      if (prev.priceMode === 'unit' && prev.price) {
        const newTotal = calculateTotal(newQty, prev.price);
        return { ...prev, qty: newQty, totalPrice: newTotal };
      } else if (prev.priceMode === 'total' && prev.totalPrice) {
        const newUnitPrice = calculateUnitPrice(newQty, prev.totalPrice);
        return { ...prev, qty: newQty, price: newUnitPrice };
      }

      return { ...prev, qty: newQty };
    });
  }, [calculateTotal, calculateUnitPrice]);

  /**
   * Setzt den Stückpreis und berechnet den Gesamtpreis
   */
  const setUnitPrice = useCallback((newPrice: string): void => {
    setState(prev => {
      const newTotal = calculateTotal(prev.qty, newPrice);
      return { ...prev, price: newPrice, totalPrice: newTotal };
    });
  }, [calculateTotal]);

  /**
   * Setzt den Gesamtpreis und berechnet den Stückpreis
   */
  const setTotalPrice = useCallback((newTotal: string): void => {
    setState(prev => {
      const newUnitPrice = calculateUnitPrice(prev.qty, newTotal);
      return { ...prev, totalPrice: newTotal, price: newUnitPrice };
    });
  }, [calculateUnitPrice]);

  /**
   * Setzt den Preismodus (Stückpreis oder Gesamtpreis als Eingabe)
   */
  const setPriceMode = useCallback((mode: 'unit' | 'total'): void => {
    setState(prev => ({ ...prev, priceMode: mode }));
  }, []);

  /**
   * Setzt den State zurück mit optionalen Initialwerten
   */
  const reset = useCallback((initialQty: number = 0, initialPrice: number | string = ''): void => {
    const qtyStr = String(initialQty);
    const priceStr = initialPrice !== '' && initialPrice !== undefined && initialPrice !== null
      ? String(initialPrice)
      : '';

    const totalPrice = priceStr && initialQty
      ? formatPrice(parsePrice(priceStr) * initialQty)
      : '';

    setState({
      qty: qtyStr,
      price: priceStr,
      totalPrice,
      priceMode: 'unit'
    });
  }, []);

  /**
   * Gibt die numerischen Werte zurück
   */
  const getNumericValues = useCallback((): { qty: number; unitPrice: number; totalPrice: number } => {
    return {
      qty: parseInt(state.qty, 10) || 0,
      unitPrice: parsePrice(state.price),
      totalPrice: parsePrice(state.totalPrice)
    };
  }, [state]);

  return {
    state,
    setQty,
    setUnitPrice,
    setTotalPrice,
    setPriceMode,
    reset,
    getNumericValues
  };
};

export default usePriceCalculation;
