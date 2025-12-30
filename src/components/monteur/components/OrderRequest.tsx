import React, { useState, useCallback } from 'react';
import { QrCode, ShoppingCart, Package, Loader2 } from 'lucide-react';
import { useMaterials } from '@context/MaterialContext';
import { useNotification } from '@context/NotificationContext';
import { QRScannerModal } from '@components/shared';
import { FirebaseService } from '@services/firebaseService';
import { NotificationType } from '@app-types/enums';
import type { ExtendedMaterial } from '@app-types/contexts/material.types';

interface OrderRequestProps {
  projectId: string;
}

/**
 * OrderRequest - Material zur Bestellliste hinzufügen
 *
 * Features:
 * - QR-Scanner für Material-Erfassung
 * - Menge angeben
 * - Setzt orderStatus auf 'offen'
 */
const OrderRequest: React.FC<OrderRequestProps> = ({ projectId }) => {
  const { materials } = useMaterials();
  const { showNotification } = useNotification();

  const [showScanner, setShowScanner] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<ExtendedMaterial | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Material per QR-Code auswählen
  const handleQRScan = useCallback(
    (code: string) => {
      const material = materials.find(m => m.materialID === code || m.id === code);
      if (material) {
        setSelectedMaterial(material);
        setQuantity(1);
        showNotification(`${material.description} ausgewählt`, NotificationType.SUCCESS);
      } else {
        showNotification('Material nicht gefunden', NotificationType.ERROR);
      }
    },
    [materials, showNotification]
  );

  // Zur Bestellliste hinzufügen
  const handleAddToOrderList = async () => {
    if (!selectedMaterial) return;

    setIsSubmitting(true);

    try {
      await FirebaseService.updateDocument('materials', selectedMaterial.id, {
        orderStatus: 'offen',
        orderedQuantity: quantity,
        orderRequestedAt: new Date(),
        orderRequestedFrom: projectId
      });

      showNotification(
        `${selectedMaterial.description} (${quantity}x) zur Bestellliste hinzugefügt`,
        NotificationType.SUCCESS
      );

      // Reset
      setSelectedMaterial(null);
      setQuantity(1);
    } catch (error) {
      console.error('Fehler beim Hinzufügen zur Bestellliste:', error);
      showNotification('Fehler beim Hinzufügen zur Bestellliste', NotificationType.ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abbrechen
  const handleCancel = () => {
    setSelectedMaterial(null);
    setQuantity(1);
  };

  return (
    <div className="space-y-4">
      {/* QR-Scanner Button */}
      {!selectedMaterial && (
        <button
          onClick={() => setShowScanner(true)}
          className="w-full py-4 bg-amber-600 text-white rounded-xl font-medium flex items-center justify-center gap-3 active:bg-amber-700 transition-colors touch-manipulation"
        >
          <QrCode className="h-6 w-6" />
          <span>Material scannen</span>
        </button>
      )}

      {/* Ausgewähltes Material */}
      {selectedMaterial && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Material Info */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-gray-100 rounded-lg">
                <Package className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900">{selectedMaterial.description}</h4>
                <p className="text-sm text-gray-500 mt-0.5">
                  ID: {selectedMaterial.materialID}
                </p>
                <p className="text-sm text-gray-500">
                  Aktueller Bestand: {selectedMaterial.stock ?? 0}
                </p>
              </div>
            </div>
          </div>

          {/* Menge */}
          <div className="p-4 border-b border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bestellmenge
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={quantity <= 1}
              >
                <span className="text-lg font-medium">-</span>
              </button>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 text-center py-2 border border-gray-200 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                min={1}
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="text-lg font-medium">+</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 bg-gray-50 flex gap-3">
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              onClick={handleAddToOrderList}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 active:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ShoppingCart className="h-5 w-5" />
              )}
              <span>Bestellen</span>
            </button>
          </div>
        </div>
      )}

      {/* Hinweis */}
      {!selectedMaterial && (
        <div className="text-center py-6 text-gray-500">
          <ShoppingCart className="h-10 w-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">
            Scanne ein Material um es zur Bestellliste hinzuzufügen
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Der Einkauf wird benachrichtigt
          </p>
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleQRScan}
      />
    </div>
  );
};

export default OrderRequest;
