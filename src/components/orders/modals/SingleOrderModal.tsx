import React, { useState, useEffect } from 'react';
import { X, Check, Euro } from 'lucide-react';
import type { SingleOrderModalProps } from '../../../types/components/order.types';

const SingleOrderModal: React.FC<SingleOrderModalProps> = ({
  isOpen,
  material,
  isAdditional,
  isLoading,
  onClose,
  onConfirm
}) => {
  const [qty, setQty] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [totalPrice, setTotalPrice] = useState<string>('');
  const [priceMode, setPriceMode] = useState<'unit' | 'total'>('unit');

  // Initialisierung wenn Modal öffnet
  useEffect(() => {
    if (isOpen && material) {
      const defaultQty = isAdditional
        ? material._displayQuantity
        : (material.excludeFromAutoOrder ? Math.abs(material.stock || 0) : (material.orderQuantity || 0));

      const unitPrice = material.price !== undefined && material.price !== null ? String(material.price) : '';
      const qtyNum = defaultQty || 0;
      const total = unitPrice && qtyNum ? String((parseFloat(String(unitPrice).replace(',', '.')) * qtyNum).toFixed(2).replace('.', ',')) : '';

      setQty(String(defaultQty));
      setPrice(unitPrice);
      setTotalPrice(total);
      setPriceMode('unit');
    }
  }, [isOpen, material, isAdditional]);

  if (!isOpen || !material) return null;

  // Berechnung bei Änderung der Menge
  const handleQtyChange = (newQty: string): void => {
    setQty(newQty);
    const qtyNum = parseInt(newQty, 10);
    if (!isNaN(qtyNum) && qtyNum > 0) {
      if (priceMode === 'unit' && price) {
        const unitPrice = parseFloat(price.replace(',', '.'));
        if (!isNaN(unitPrice)) {
          setTotalPrice((unitPrice * qtyNum).toFixed(2).replace('.', ','));
        }
      } else if (priceMode === 'total' && totalPrice) {
        const total = parseFloat(totalPrice.replace(',', '.'));
        if (!isNaN(total)) {
          setPrice((total / qtyNum).toFixed(2).replace('.', ','));
        }
      }
    }
  };

  // Berechnung bei Änderung des Stückpreises
  const handleUnitPriceChange = (newPrice: string): void => {
    setPrice(newPrice);
    const qtyNum = parseInt(qty, 10);
    const unitPrice = parseFloat(newPrice.replace(',', '.'));
    if (!isNaN(qtyNum) && qtyNum > 0 && !isNaN(unitPrice)) {
      setTotalPrice((unitPrice * qtyNum).toFixed(2).replace('.', ','));
    }
  };

  // Berechnung bei Änderung des Gesamtpreises
  const handleTotalPriceChange = (newTotal: string): void => {
    setTotalPrice(newTotal);
    const qtyNum = parseInt(qty, 10);
    const total = parseFloat(newTotal.replace(',', '.'));
    if (!isNaN(qtyNum) && qtyNum > 0 && !isNaN(total)) {
      setPrice((total / qtyNum).toFixed(2).replace('.', ','));
    }
  };

  const handleConfirm = (): void => {
    onConfirm({
      qty,
      price,
      totalPrice,
      isAdditional
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 !m-0 !top-0">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {isAdditional ? 'Nachbestellung bestätigen' : 'Bestellung bestätigen'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Material Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="font-medium text-gray-900">{material.description}</div>
            <div className="text-sm text-gray-500">{material.materialID}</div>
            {material.itemsPerUnit && (
              <div className="text-sm text-gray-500 mt-1">
                Stück pro Einheit: {material.itemsPerUnit}
              </div>
            )}
          </div>

          {/* Bestellmenge */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bestellmenge
            </label>
            <input
              type="number"
              value={qty}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQtyChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
              min="1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Diese Menge gilt nur für diese Bestellung
            </p>
          </div>

          {/* Preiseingabe-Modus Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preiseingabe
            </label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setPriceMode('unit')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  priceMode === 'unit'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Stückpreis
              </button>
              <button
                type="button"
                onClick={() => setPriceMode('total')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                  priceMode === 'total'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Gesamtpreis
              </button>
            </div>
          </div>

          {/* Preiseingabe basierend auf Modus */}
          {priceMode === 'unit' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stückpreis (€)
              </label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUnitPriceChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0,00"
                />
              </div>
              {totalPrice && (
                <p className="text-sm text-gray-600 mt-2">
                  Gesamtpreis: <span className="font-medium">{totalPrice} €</span>
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gesamtpreis der Bestellung (€)
              </label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={totalPrice}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTotalPriceChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0,00"
                />
              </div>
              {price && (
                <p className="text-sm text-green-600 mt-2">
                  Berechneter Stückpreis: <span className="font-medium">{price} €</span>
                </p>
              )}
            </div>
          )}

          <p className="text-xs text-amber-600">
            Der Stückpreis wird permanent für das Material gespeichert
          </p>
        </div>

        {/* Aktionen */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Abbrechen
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <Check className="h-4 w-4" />
            <span>{isAdditional ? 'Nachbestellen' : 'Bestellen'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SingleOrderModal;
