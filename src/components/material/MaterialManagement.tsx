import React, { useState } from 'react';

import { useMaterials } from '@context/MaterialContext';
import { useNotification } from '@context/NotificationContext';
import { useConfirm } from '@context/ConfirmContext';

// Hooks (global)
import { useColumnPreferences, useMaterialFilters, useCategoriesAndSpecs } from '@hooks';

// Components
import {
  MaterialStats,
  MaterialHeader,
  MaterialSearchBar,
  ColumnSettings,
  MaterialTable,
  MaterialCards,
  MaterialEmptyState
} from './components';

// Modals
import { AddMaterialModal, MaterialDetailModal } from './modals';
import { BookingModal } from '../bookings';
import { QRScannerModal } from '../shared';

import type { Material } from '@app-types';
import { NotificationType, BookingType } from '@app-types';

const MaterialManagement: React.FC = () => {
  const { materials, addMaterial, updateMaterial, deleteMaterial } = useMaterials();
  const { showNotification } = useNotification();
  const { confirmDelete } = useConfirm();

  // Kategorien laden
  const { categories } = useCategoriesAndSpecs(true);

  // Spalten-Einstellungen
  const { visibleColumns, loadingPreferences, toggleColumn, availableColumns } =
    useColumnPreferences(showNotification);

  // Filter & Sortierung
  const {
    searchTerm,
    setSearchTerm,
    sortConfig,
    handleSort,
    columnFilters,
    handleColumnFilterChange,
    filteredMaterials,
    uniqueCategories,
    uniqueManufacturers,
    uniqueStatuses
  } = useMaterialFilters(materials, categories);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [bookingType, setBookingType] = useState<BookingType>(BookingType.OUT);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState<boolean>(false);

  // Inline Price Editing
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  // Handlers
  const handleAddMaterial = (): void => {
    setEditingMaterial(null);
    setIsAddModalOpen(true);
  };

  const handleOpenBooking = (type: BookingType): void => {
    setBookingType(type);
    setIsBookingModalOpen(true);
  };

  const handleMaterialClick = (material: Material): void => {
    setSelectedMaterial(material);
    setIsDetailModalOpen(true);
  };

  const handleEditMaterial = (material: Material): void => {
    setEditingMaterial(material);
    setIsAddModalOpen(true);
    setIsDetailModalOpen(false);
  };

  const handleDeleteMaterial = async (materialId: string): Promise<void> => {
    const material = materials.find(m => m.id === materialId);
    const materialName = material?.description || material?.bezeichnung || 'dieses Material';

    const confirmed = await confirmDelete(materialName, 'Material');
    if (confirmed) {
      deleteMaterial(materialId);
      showNotification('Material erfolgreich gelöscht', NotificationType.SUCCESS);
    }
    setIsDetailModalOpen(false);
  };

  const handleSaveMaterial = (materialData: Material): void => {
    if (editingMaterial) {
      const updatedMaterialData: Material = {
        ...materialData,
        id: editingMaterial.id
      };
      updateMaterial(updatedMaterialData);
      showNotification('Material erfolgreich aktualisiert', NotificationType.SUCCESS);
    } else {
      addMaterial(materialData);
      showNotification('Material erfolgreich hinzugefügt', NotificationType.SUCCESS);
    }
  };

  const handleQRScan = (scannedData: string): void => {
    setIsQRScannerOpen(false);
    const foundMaterial = materials.find(
      m => m.materialID === scannedData || m.id === scannedData
    );

    if (foundMaterial) {
      setSelectedMaterial(foundMaterial);
      setIsDetailModalOpen(true);
    } else {
      setSearchTerm(scannedData);
      showNotification('Material nicht gefunden - Suche aktiviert', NotificationType.INFO);
    }
  };

  // Inline Price Editing Handlers
  const handlePriceEdit = (materialId: string, currentPrice: number | undefined): void => {
    setEditingPrice(materialId);
    setTempPrice(String(currentPrice || ''));
  };

  const handlePriceCancel = (): void => {
    setEditingPrice(null);
    setTempPrice('');
  };

  const handlePriceSave = async (materialId: string): Promise<void> => {
    try {
      const priceString = String(tempPrice || '').trim();
      if (priceString === '') {
        setEditingPrice(null);
        setTempPrice('');
        return;
      }

      const priceValue = parseFloat(priceString.replace(',', '.'));
      if (isNaN(priceValue) || priceValue < 0) {
        showNotification('Bitte geben Sie einen gültigen Preis ein', NotificationType.ERROR);
        return;
      }

      const material = materials.find(m => m.id === materialId);
      if (material) {
        const updatedMaterial: Material = { ...material, price: priceValue };
        await updateMaterial(updatedMaterial);
        showNotification('Preis erfolgreich aktualisiert', NotificationType.SUCCESS);
      } else {
        showNotification('Material nicht gefunden', NotificationType.ERROR);
        return;
      }

      setEditingPrice(null);
      setTempPrice('');
    } catch (error) {
      console.error('Fehler beim Speichern des Preises:', error);
      showNotification('Fehler beim Aktualisieren des Preises', NotificationType.ERROR);
    }
  };

  const hasFilters = searchTerm !== '' || Object.values(columnFilters).some(v => v !== 'alle');

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <MaterialHeader
        onOpenBooking={handleOpenBooking}
        onAddMaterial={handleAddMaterial}
      />

      {/* Statistiken */}
      <MaterialStats materials={materials} />

      {/* Materialliste */}
      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col">
        {/* Fixierter Header mit Suche */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0 space-y-3 sm:space-y-0">
          <div className="flex items-center justify-between sm:gap-3">
            <h3 className="text-lg font-medium text-gray-900 flex-shrink-0">Materialliste</h3>

            {/* Desktop: Suche inline */}
            <div className="hidden sm:flex items-center gap-2 flex-1">
              <MaterialSearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onOpenQRScanner={() => setIsQRScannerOpen(true)}
              />
            </div>

            <ColumnSettings
              visibleColumns={visibleColumns}
              availableColumns={availableColumns}
              loadingPreferences={loadingPreferences}
              onToggleColumn={toggleColumn}
            />
          </div>

          {/* Mobile: Suche als zweite Zeile */}
          <div className="flex sm:hidden items-center gap-2">
            <MaterialSearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onOpenQRScanner={() => setIsQRScannerOpen(true)}
              isMobile
            />
          </div>
        </div>

        {/* Scrollbare Tabelle / Mobile Cards */}
        <div className="flex-1 overflow-hidden">
          {/* Mobile: Card-Liste */}
          <MaterialCards
            materials={filteredMaterials}
            categories={categories}
            visibleColumns={visibleColumns}
            onMaterialClick={handleMaterialClick}
          />

          {/* Desktop: Tabelle */}
          <MaterialTable
            materials={filteredMaterials}
            categories={categories}
            visibleColumns={visibleColumns}
            sortConfig={sortConfig}
            onSort={handleSort}
            columnFilters={columnFilters}
            onColumnFilterChange={handleColumnFilterChange}
            uniqueCategories={uniqueCategories}
            uniqueManufacturers={uniqueManufacturers}
            uniqueStatuses={uniqueStatuses}
            onMaterialClick={handleMaterialClick}
            onEditMaterial={handleEditMaterial}
            onDeleteMaterial={handleDeleteMaterial}
            editingPrice={editingPrice}
            tempPrice={tempPrice}
            onPriceEdit={handlePriceEdit}
            onPriceChange={setTempPrice}
            onPriceSave={handlePriceSave}
            onPriceCancel={handlePriceCancel}
          />

          {/* Empty State */}
          {filteredMaterials.length === 0 && (
            <MaterialEmptyState hasFilters={hasFilters} />
          )}
        </div>
      </div>

      {/* Modals */}
      <AddMaterialModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingMaterial(null);
        }}
        material={editingMaterial || undefined}
        onSave={handleSaveMaterial}
      />

      <MaterialDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMaterial(null);
        }}
        material={selectedMaterial!}
        onEdit={handleEditMaterial}
        onDelete={handleDeleteMaterial}
      />

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        type={bookingType}
      />

      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScan={handleQRScan}
      />
    </div>
  );
};

export default MaterialManagement;
