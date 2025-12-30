import React, { useState, useCallback, useMemo } from 'react';
import { QrCode, Search, Package, Tag, Factory, Hash, Layers, ExternalLink, ShoppingCart, Shield } from 'lucide-react';
import { useMaterials } from '@context/MaterialContext';
import { useNotification } from '@context/NotificationContext';
import { QRScannerModal } from '@components/shared';
import { useCategoriesAndSpecs } from '@hooks';
import { NotificationType } from '@app-types/enums';
import type { ExtendedMaterial } from '@app-types/contexts/material.types';

/**
 * MonteurMaterialInfo - Material Informationen anzeigen
 *
 * Features:
 * - QR-Scanner für schnelle Material-Suche
 * - Suchfeld für manuelle Suche
 * - Detaillierte Material-Informationen anzeigen
 */
const MonteurMaterialInfo: React.FC = () => {
  const { materials } = useMaterials();
  const { showNotification } = useNotification();
  const { findCategoryById, getSpecsForCategory } = useCategoriesAndSpecs(true);

  const [showScanner, setShowScanner] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<ExtendedMaterial | null>(null);

  // Kategorie und Spezifikationen fuer ausgewaehltes Material
  const selectedCategory = useMemo(() => {
    return selectedMaterial?.categoryId ? findCategoryById(selectedMaterial.categoryId) : undefined;
  }, [selectedMaterial?.categoryId, findCategoryById]);

  const categorySpecs = useMemo(() => {
    return getSpecsForCategory(selectedCategory);
  }, [selectedCategory, getSpecsForCategory]);

  // Gefilterte Materialien für Suche
  const filteredMaterials = materials.filter(m => {
    const search = searchTerm.toLowerCase();
    return (
      m.description?.toLowerCase().includes(search) ||
      m.materialID?.toLowerCase().includes(search) ||
      m.manufacturer?.toLowerCase().includes(search)
    );
  }).slice(0, 10);

  // Material per QR-Code finden
  const handleQRScan = useCallback(
    (code: string) => {
      const material = materials.find(m => m.materialID === code || m.id === code);
      if (material) {
        setSelectedMaterial(material);
        showNotification(`${material.description} gefunden`, NotificationType.SUCCESS);
      } else {
        showNotification('Material nicht gefunden', NotificationType.ERROR);
      }
    },
    [materials, showNotification]
  );

  // Material auswaehlen
  const selectMaterial = (material: ExtendedMaterial) => {
    setSelectedMaterial(material);
    setShowSearch(false);
    setSearchTerm('');
  };

  return (
    <div className="p-4 space-y-4">
      {!selectedMaterial ? (
        <>
          {/* QR-Scanner Button */}
          <button
            onClick={() => setShowScanner(true)}
            className="w-full py-4 bg-primary-600 text-white rounded-xl font-medium flex items-center justify-center gap-3 active:bg-primary-700 transition-colors touch-manipulation"
          >
            <QrCode className="h-6 w-6" />
            <span>Material scannen</span>
          </button>

          {/* Such-Button */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-3 active:bg-gray-200 transition-colors touch-manipulation"
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
                        onClick={() => selectMaterial(material)}
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

          {/* Leerer Zustand */}
          {!showSearch && (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Scanne oder suche ein Material</p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Material Details */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Material Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <Package className="h-8 w-8 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-gray-900">{selectedMaterial.description}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{selectedMaterial.materialID}</p>
                </div>
              </div>
            </div>

            {/* Bestand Status */}
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Aktueller Bestand</span>
                <span className="text-2xl font-bold text-gray-900">{selectedMaterial.stock ?? 0}</span>
              </div>
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="text-gray-500">Meldebestand</span>
                <span className="font-medium text-gray-700">{selectedMaterial.heatStock ?? selectedMaterial.mindestbestand ?? 0}</span>
              </div>
            </div>

            {/* Bestellinformationen */}
            <div className="p-4 border-b border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Stueck pro Einheit</p>
                  <p className="font-medium text-gray-900">{selectedMaterial.itemsPerUnit ?? '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Bestellmenge</p>
                  <p className="font-medium text-gray-900">{selectedMaterial.orderQuantity ?? '-'}</p>
                </div>
              </div>
              {/* Auto-Bestellung Status */}
              <div className="mt-3 flex items-center gap-2">
                {(selectedMaterial as any).excludeFromAutoOrder ? (
                  <>
                    <Shield className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-amber-600">Keine Auto-Bestellung</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Auto-Bestellung aktiv</span>
                  </>
                )}
              </div>
            </div>

            {/* Details Liste */}
            <div className="divide-y divide-gray-100">
              {/* Kategorie */}
              {(selectedCategory?.name || selectedMaterial.kategorie) && (
                <div className="p-4 flex items-center gap-3">
                  <Tag className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Kategorie</p>
                    <p className="font-medium text-gray-900">{selectedCategory?.name || selectedMaterial.kategorie}</p>
                  </div>
                </div>
              )}

              {/* Hersteller */}
              {selectedMaterial.manufacturer && (
                <div className="p-4 flex items-center gap-3">
                  <Factory className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Hersteller</p>
                    <p className="font-medium text-gray-900">{selectedMaterial.manufacturer}</p>
                  </div>
                </div>
              )}

              {/* Typ */}
              {selectedMaterial.type && (
                <div className="p-4 flex items-center gap-3">
                  <Layers className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Typ</p>
                    <p className="font-medium text-gray-900">{selectedMaterial.type}</p>
                  </div>
                </div>
              )}

              {/* EAN */}
              {selectedMaterial.ean && (
                <div className="p-4 flex items-center gap-3">
                  <Hash className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">EAN</p>
                    <p className="font-medium text-gray-900">{selectedMaterial.ean}</p>
                  </div>
                </div>
              )}

              {/* Preis */}
              {(selectedMaterial.price !== undefined || selectedMaterial.purchasePrice !== undefined) && (
                <div className="p-4 flex items-center gap-3">
                  <span className="h-5 w-5 text-gray-400 text-center font-bold">€</span>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Preis pro Einheit</p>
                    <p className="font-medium text-green-600 text-lg">
                      {(selectedMaterial.price ?? selectedMaterial.purchasePrice ?? 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                </div>
              )}

              {/* Produktlink */}
              {selectedMaterial.link && (
                <div className="p-4">
                  <a
                    href={selectedMaterial.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary-600 font-medium"
                  >
                    <ExternalLink className="h-5 w-5" />
                    <span>Produkt-Link oeffnen</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Kategorie-Spezifikationen */}
          {categorySpecs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">Spezifikationen</h3>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                {categorySpecs.map(spec => {
                  const value = selectedMaterial.specifications?.[spec.id];
                  if (!value) return null;
                  return (
                    <div key={spec.id} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">{spec.label || spec.name}{spec.unit ? ` (${spec.unit})` : ''}</p>
                      <p className="font-medium text-gray-900">{value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
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

export default MonteurMaterialInfo;
