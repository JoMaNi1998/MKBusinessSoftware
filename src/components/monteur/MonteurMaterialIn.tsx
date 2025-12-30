import React, { useState, useCallback } from 'react';
import { QrCode, Search, Plus, Minus, Trash2, Package, Loader2, CheckCircle } from 'lucide-react';
import { useMaterials } from '@context/MaterialContext';
import { useBookings } from '@context/BookingContext';
import { useNotification } from '@context/NotificationContext';
import { QRScannerModal } from '@components/shared';
import { BookingType, NotificationType } from '@app-types/enums';
import type { ExtendedMaterial } from '@app-types/contexts/material.types';

interface SelectedMaterial {
  material: ExtendedMaterial;
  quantity: number;
}

/**
 * MonteurMaterialIn - Material Einbuchen (Wareneingang)
 *
 * Features:
 * - QR-Scanner für schnelle Material-Erfassung
 * - Suchfeld für manuelle Suche
 * - Mehrere Materialien gleichzeitig einbuchen
 */
const MonteurMaterialIn: React.FC = () => {
  const { materials, updateMaterialStock } = useMaterials();
  const { addBooking } = useBookings();
  const { showNotification } = useNotification();

  const [showScanner, setShowScanner] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  const [isBooking, setIsBooking] = useState(false);

  // Gefilterte Materialien für Suche
  const filteredMaterials = materials.filter(m => {
    const search = searchTerm.toLowerCase();
    return (
      m.description?.toLowerCase().includes(search) ||
      m.materialID?.toLowerCase().includes(search) ||
      m.manufacturer?.toLowerCase().includes(search)
    );
  }).slice(0, 10);

  // Material per QR-Code hinzufügen
  const handleQRScan = useCallback(
    (code: string) => {
      const material = materials.find(m => m.materialID === code || m.id === code);
      if (material) {
        addMaterial(material);
      } else {
        showNotification('Material nicht gefunden', NotificationType.ERROR);
      }
    },
    [materials, showNotification]
  );

  // Material zur Liste hinzufügen
  const addMaterial = (material: ExtendedMaterial) => {
    const existing = selectedMaterials.find(s => s.material.id === material.id);
    if (existing) {
      showNotification(`${material.description} ist bereits in der Liste`, NotificationType.INFO);
    } else {
      setSelectedMaterials(prev => [...prev, { material, quantity: 1 }]);
      showNotification(`${material.description} hinzugefuegt`, NotificationType.SUCCESS);
    }
    setShowSearch(false);
    setSearchTerm('');
  };

  // Menge aendern
  const updateQuantity = (materialId: string, delta: number) => {
    setSelectedMaterials(prev =>
      prev.map(item => {
        if (item.material.id === materialId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  // Material entfernen
  const removeMaterial = (materialId: string) => {
    setSelectedMaterials(prev => prev.filter(item => item.material.id !== materialId));
  };

  // Einbuchen durchfuehren
  const handleBookIn = async () => {
    if (selectedMaterials.length === 0) {
      showNotification('Bitte waehle mindestens ein Material aus', NotificationType.ERROR);
      return;
    }

    setIsBooking(true);

    try {
      // Buchungsmaterialien aufbereiten
      const bookingMaterials = selectedMaterials.map(item => ({
        materialId: item.material.id,
        materialID: item.material.materialID || '',
        description: item.material.description || '',
        quantity: item.quantity
      }));

      // Buchung erstellen
      await addBooking({
        type: BookingType.IN,
        customerID: '',
        customerName: 'Wareneingang',
        projectID: '',
        projectName: '',
        materials: bookingMaterials,
        notes: 'Mobil eingebucht (Monteur)'
      });

      // Bestand aktualisieren
      for (const item of selectedMaterials) {
        await updateMaterialStock(item.material.id, item.quantity);
      }

      showNotification(
        `${selectedMaterials.length} Material${selectedMaterials.length > 1 ? 'ien' : ''} erfolgreich eingebucht`,
        NotificationType.SUCCESS
      );

      // Reset
      setSelectedMaterials([]);
    } catch (error) {
      console.error('Buchungsfehler:', error);
      showNotification('Einbuchung fehlgeschlagen', NotificationType.ERROR);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header Card */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Plus className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="font-semibold text-green-900">Material Einbuchen</h2>
            <p className="text-sm text-green-700">Wareneingang ins Lager</p>
          </div>
        </div>
      </div>

      {/* QR-Scanner Button */}
      <button
        onClick={() => setShowScanner(true)}
        disabled={isBooking}
        className="w-full py-4 bg-primary-600 text-white rounded-xl font-medium flex items-center justify-center gap-3 active:bg-primary-700 transition-colors touch-manipulation disabled:opacity-50"
      >
        <QrCode className="h-6 w-6" />
        <span>Material scannen</span>
      </button>

      {/* Such-Button */}
      <button
        onClick={() => setShowSearch(!showSearch)}
        disabled={isBooking}
        className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-3 active:bg-gray-200 transition-colors touch-manipulation disabled:opacity-50"
      >
        <Search className="h-6 w-6" />
        <span>Material suchen</span>
      </button>

      {/* Suchfeld */}
      {showSearch && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Material-ID, Name oder Hersteller..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>
          {searchTerm && (
            <div className="max-h-64 overflow-y-auto">
              {filteredMaterials.length > 0 ? (
                filteredMaterials.map(material => (
                  <button
                    key={material.id}
                    onClick={() => addMaterial(material)}
                    className="w-full p-3 text-left hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <p className="font-medium text-gray-900 truncate">{material.description}</p>
                    <p className="text-sm text-gray-500">
                      {material.materialID} • Bestand: {material.stock ?? 0}
                    </p>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  Keine Materialien gefunden
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Ausgewaehlte Materialien */}
      {selectedMaterials.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">
              Ausgewaehlt ({selectedMaterials.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {selectedMaterials.map(item => (
              <div key={item.material.id} className="p-4 flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Package className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.material.description}</p>
                  <p className="text-sm text-gray-500">
                    {item.material.materialID} • Bestand: {item.material.stock ?? 0}
                  </p>
                </div>
                {/* Mengen-Steuerung */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(item.material.id, -1)}
                    className="w-10 h-10 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors flex items-center justify-center touch-manipulation"
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <span className="w-12 text-center font-semibold text-lg">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.material.id, 1)}
                    className="w-10 h-10 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors flex items-center justify-center touch-manipulation"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                {/* Entfernen */}
                <button
                  onClick={() => removeMaterial(item.material.id)}
                  className="p-2 text-red-500 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors touch-manipulation"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Einbuchen Button */}
      {selectedMaterials.length > 0 && (
        <button
          onClick={handleBookIn}
          disabled={isBooking}
          className="w-full py-4 bg-green-600 text-white rounded-xl font-medium flex items-center justify-center gap-3 active:bg-green-700 transition-colors touch-manipulation disabled:opacity-50"
        >
          {isBooking ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <CheckCircle className="h-6 w-6" />
          )}
          <span>
            {selectedMaterials.length} Material{selectedMaterials.length > 1 ? 'ien' : ''} einbuchen
          </span>
        </button>
      )}

      {/* Leerer Zustand */}
      {selectedMaterials.length === 0 && !showSearch && (
        <div className="text-center py-8 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Scanne oder suche Material zum Einbuchen</p>
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

export default MonteurMaterialIn;
