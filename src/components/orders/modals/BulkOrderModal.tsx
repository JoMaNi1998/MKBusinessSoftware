import React, { useState, useEffect } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import { formatOrderPrice } from '@utils/orderHelpers';
import type { BulkOrderModalProps, BulkOrderItem } from '@app-types/components/order.types';

const BulkOrderModal: React.FC<BulkOrderModalProps> = ({
  isOpen,
  materials,
  isLoading,
  onClose,
  onConfirm
}) => {
  const [items, setItems] = useState<BulkOrderItem[]>([]);
  const [priceMode, setPriceMode] = useState<'unit' | 'total'>('unit');

  // Initialisierung wenn Modal öffnet
  useEffect(() => {
    if (isOpen && materials.length > 0) {
      const initialItems: BulkOrderItem[] = materials.map(material => {
        const qty = material.excludeFromAutoOrder ? Math.abs(material.stock || 0) : (material.orderQuantity || 0);
        const unitPrice = material.price !== undefined && material.price !== null ? String(material.price) : '';
        const totalPrice = unitPrice && qty ? String((parseFloat(String(unitPrice).replace(',', '.')) * qty).toFixed(2).replace('.', ',')) : '';
        return {
          material,
          qty: String(qty),
          price: unitPrice,
          totalPrice: totalPrice
        };
      });
      setItems(initialItems);
      setPriceMode('unit');
    }
  }, [isOpen, materials]);

  if (!isOpen) return null;

  // Item aktualisieren mit automatischer Berechnung
  const updateItem = (index: number, field: keyof BulkOrderItem, value: string): void => {
    setItems(prev => {
      const newItems = [...prev];
      const item = { ...newItems[index] };
      (item as any)[field] = value;

      const qty = parseInt(item.qty, 10);

      if (field === 'qty' && !isNaN(qty) && qty > 0) {
        if (priceMode === 'unit' && item.price) {
          const unitPrice = parseFloat(item.price.replace(',', '.'));
          if (!isNaN(unitPrice)) {
            item.totalPrice = (unitPrice * qty).toFixed(2).replace('.', ',');
          }
        } else if (priceMode === 'total' && item.totalPrice) {
          const totalPrice = parseFloat(item.totalPrice.replace(',', '.'));
          if (!isNaN(totalPrice)) {
            item.price = (totalPrice / qty).toFixed(2).replace('.', ',');
          }
        }
      } else if (field === 'price' && !isNaN(qty) && qty > 0) {
        const unitPrice = parseFloat(value.replace(',', '.'));
        if (!isNaN(unitPrice)) {
          item.totalPrice = (unitPrice * qty).toFixed(2).replace('.', ',');
        }
      } else if (field === 'totalPrice' && !isNaN(qty) && qty > 0) {
        const totalPrice = parseFloat(value.replace(',', '.'));
        if (!isNaN(totalPrice)) {
          item.price = (totalPrice / qty).toFixed(2).replace('.', ',');
        }
      }

      newItems[index] = item;
      return newItems;
    });
  };

  const handleConfirm = (): void => {
    onConfirm(items);
  };

  // Gesamtsumme berechnen
  const totalSum = items.reduce((sum, item) => {
    const qty = parseInt(item.qty || '0', 10);
    const price = parseFloat((item.price || '0').replace(',', '.'));
    return sum + (qty * price);
  }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 !m-0 !top-0">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Sammelbestellung bestätigen ({items.length} Materialien)
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            Überprüfen und passen Sie die Bestellmengen und Preise an.
          </div>
          {/* Preiseingabe-Modus Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Preiseingabe:</span>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setPriceMode('unit')}
                className={`px-3 py-1 text-sm font-medium transition-colors ${
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
                className={`px-3 py-1 text-sm font-medium transition-colors border-l border-gray-300 ${
                  priceMode === 'total'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Gesamtpreis
              </button>
            </div>
          </div>
        </div>

        {/* Tabelle */}
        <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stk/Einheit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-28">Menge</th>
                {priceMode === 'unit' ? (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Stückpreis (€)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Gesamt</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Gesamtpreis (€)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Stückpreis</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, index) => {
                const qty = parseInt(item.qty || '0', 10);
                const unitPrice = parseFloat((item.price || '0').replace(',', '.'));
                const total = qty * unitPrice;
                return (
                  <tr key={item.material.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{item.material.description}</div>
                      <div className="text-xs text-gray-500">{item.material.materialID}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.material.itemsPerUnit || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(index, 'qty', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        min="1"
                      />
                    </td>
                    {priceMode === 'unit' ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.price}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(index, 'price', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="0,00"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatOrderPrice(total)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.totalPrice || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(index, 'totalPrice', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="0,00"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-green-600">
                          {item.price ? `${item.price} €` : '-'}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                  Gesamtsumme:
                </td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">
                  {formatOrderPrice(totalSum)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="text-xs text-amber-600 mt-3">
          Hinweis: Der Stückpreis wird permanent für die jeweiligen Materialien gespeichert.
        </div>

        {/* Aktionen */}
        <div className="flex justify-end space-x-3 mt-4">
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
            <ShoppingCart className="h-4 w-4" />
            <span>Alle bestellen</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkOrderModal;
