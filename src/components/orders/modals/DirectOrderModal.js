import React from 'react';
import { X, Search, Package, QrCode } from 'lucide-react';
import { formatPrice } from '../shared/orderUtils';

const DirectOrderModal = ({
  isOpen,
  onClose,
  searchTerm,
  onSearchChange,
  materials,
  isLoading,
  onDirectOrder,
  onOpenQRScanner
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 !m-0 !top-0">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Material direkt bestellen</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Suchfeld mit QR-Code Button */}
        <div className="mb-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Material suchen (ID, Beschreibung, Hersteller)..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={onOpenQRScanner}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              title="QR-Code scannen"
            >
              <QrCode className="h-5 w-5" />
              <span>Scannen</span>
            </button>
          </div>
        </div>

        {/* Materialliste */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {materials.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>Keine verfügbaren Materialien gefunden</p>
            </div>
          ) : (
            materials.map((material) => (
              <div
                key={material.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{material.materialID}</div>
                  <div className="text-sm text-gray-500">{material.description}</div>
                  <div className="text-xs text-gray-400">
                    {material.manufacturer} • Bestand: {material.stock} • Preis: {formatPrice(material.price)}
                  </div>
                </div>
                <button
                  onClick={() => onDirectOrder(material.id)}
                  disabled={isLoading}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
                >
                  Bestellen
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectOrderModal;
