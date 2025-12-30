import React, { useState, useCallback } from 'react';
import { QrCode, Plus, Minus, Trash2, Package, Loader2 } from 'lucide-react';
import { useMaterials } from '@context/MaterialContext';
import { useBookings } from '@context/BookingContext';
import { useProjects } from '@context/ProjectContext';
import { useNotification } from '@context/NotificationContext';
import { QRScannerModal } from '@components/shared';
import { BookingType, NotificationType } from '@app-types/enums';
import type { ExtendedMaterial } from '@app-types/contexts/material.types';

interface MaterialBookingProps {
  projectId: string;
}

interface SelectedMaterial {
  materialId: string;
  quantity: number;
}

/**
 * MaterialBooking - Vereinfachte Material-Buchung für Monteure
 *
 * Features:
 * - QR-Scanner für schnelle Material-Erfassung
 * - Ein-/Ausbuchen mit Mengenänderung
 * - Validierung des Lagerbestands
 */
const MaterialBooking: React.FC<MaterialBookingProps> = ({ projectId }) => {
  const { materials, updateMaterialStock } = useMaterials();
  const { addBooking } = useBookings();
  const { getProjectById } = useProjects();
  const { showNotification } = useNotification();

  const [showScanner, setShowScanner] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  const [isBooking, setIsBooking] = useState(false);

  const project = getProjectById(projectId);

  // Material per QR-Code hinzufügen
  const handleQRScan = useCallback(
    (code: string) => {
      const material = materials.find(m => m.materialID === code || m.id === code);
      if (material) {
        // Prüfen ob schon ausgewählt
        const existing = selectedMaterials.find(s => s.materialId === material.id);
        if (existing) {
          showNotification(`${material.description} ist bereits in der Liste`, NotificationType.INFO);
        } else {
          setSelectedMaterials(prev => [...prev, { materialId: material.id, quantity: 1 }]);
          showNotification(`${material.description} hinzugefügt`, NotificationType.SUCCESS);
        }
      } else {
        showNotification('Material nicht gefunden', NotificationType.ERROR);
      }
    },
    [materials, selectedMaterials, showNotification]
  );

  // Menge ändern
  const updateQuantity = (materialId: string, delta: number) => {
    setSelectedMaterials(prev =>
      prev.map(item => {
        if (item.materialId === materialId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  // Material entfernen
  const removeMaterial = (materialId: string) => {
    setSelectedMaterials(prev => prev.filter(item => item.materialId !== materialId));
  };

  // Buchung durchführen
  const handleBooking = async (type: BookingType) => {
    if (selectedMaterials.length === 0) {
      showNotification('Bitte wähle mindestens ein Material aus', NotificationType.ERROR);
      return;
    }

    if (!project) {
      showNotification('Projekt nicht gefunden', NotificationType.ERROR);
      return;
    }

    // Validierung bei Ausgang
    if (type === BookingType.OUT) {
      for (const item of selectedMaterials) {
        const material = materials.find(m => m.id === item.materialId);
        if (material && (material.stock ?? 0) < item.quantity) {
          showNotification(
            `Nicht genügend Bestand für ${material.description} (verfügbar: ${material.stock ?? 0})`,
            NotificationType.ERROR
          );
          return;
        }
      }
    }

    setIsBooking(true);

    try {
      // Buchungsmaterialien aufbereiten
      const bookingMaterials = selectedMaterials.map(item => {
        const material = materials.find(m => m.id === item.materialId);
        return {
          materialId: item.materialId,
          materialID: material?.materialID || '',
          description: material?.description || '',
          quantity: item.quantity
        };
      });

      // Buchung erstellen
      await addBooking({
        type,
        customerID: project.customerID,
        customerName: project.customerName || '',
        projectID: project.id,
        projectName: project.name || project.projectID || '',
        materials: bookingMaterials,
        notes: `Mobil gebucht`
      });

      // Bestand aktualisieren
      for (const item of selectedMaterials) {
        const stockChange = type === BookingType.IN ? item.quantity : -item.quantity;
        await updateMaterialStock(item.materialId, stockChange);
      }

      showNotification(
        `${selectedMaterials.length} Material${selectedMaterials.length > 1 ? 'ien' : ''} erfolgreich ${
          type === BookingType.IN ? 'eingebucht' : 'ausgebucht'
        }`,
        NotificationType.SUCCESS
      );

      // Reset
      setSelectedMaterials([]);
    } catch (error) {
      console.error('Buchungsfehler:', error);
      showNotification('Buchung fehlgeschlagen', NotificationType.ERROR);
    } finally {
      setIsBooking(false);
    }
  };

  // Material Info abrufen
  const getMaterialInfo = (materialId: string): ExtendedMaterial | undefined => {
    return materials.find(m => m.id === materialId);
  };

  return (
    <div className="space-y-4">
      {/* QR-Scanner Button */}
      <button
        onClick={() => setShowScanner(true)}
        disabled={isBooking}
        className="w-full py-4 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-3 active:bg-blue-700 transition-colors touch-manipulation disabled:opacity-50"
      >
        <QrCode className="h-6 w-6" />
        <span>Material scannen</span>
      </button>

      {/* Ausgewählte Materialien */}
      {selectedMaterials.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-3 space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Ausgewählt ({selectedMaterials.length})
          </h4>

          {selectedMaterials.map(item => {
            const material = getMaterialInfo(item.materialId);
            if (!material) return null;

            return (
              <div
                key={item.materialId}
                className="bg-white rounded-lg p-3 flex items-center gap-3 shadow-sm"
              >
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Package className="h-4 w-4 text-gray-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {material.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    ID: {material.materialID} • Bestand: {material.stock ?? 0}
                  </p>
                </div>

                {/* Mengen-Steuerung */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.materialId, -1)}
                    className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.materialId, 1)}
                    className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Entfernen */}
                <button
                  onClick={() => removeMaterial(item.materialId)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Buchungs-Buttons */}
      {selectedMaterials.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleBooking(BookingType.OUT)}
            disabled={isBooking}
            className="py-3 bg-red-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 active:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isBooking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Minus className="h-5 w-5" />}
            <span>Ausbuchen</span>
          </button>
          <button
            onClick={() => handleBooking(BookingType.IN)}
            disabled={isBooking}
            className="py-3 bg-green-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 active:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isBooking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            <span>Einbuchen</span>
          </button>
        </div>
      )}

      {/* Leerer Zustand */}
      {selectedMaterials.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <Package className="h-10 w-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Scanne QR-Codes um Material hinzuzufügen</p>
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

export default MaterialBooking;
