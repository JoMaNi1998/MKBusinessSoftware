import React, { useState, useMemo, useCallback } from 'react';
import { useMaterials } from '@context/MaterialContext';
import { useNotification } from '@context/NotificationContext';
import { FirebaseService } from '@services/firebaseService';
import { QRScannerModal } from '@components/shared';
import type { Material } from '@app-types';
import type { OrderMaterialDisplay, BulkOrderItem } from '@app-types/components/order.types';
import { NotificationType } from '@app-types/enums';

// Hooks
import { useOrderList, useOrderColumnPrefs } from '@hooks';

// Components
import {
  OrderStats,
  OrderHeader,
  OrderListHeader,
  OrderTable,
  OrderCards,
  OrderEmptyState,
  ExcludedMaterialsTable
} from './components';

// Modals
import {
  AddMaterialModal,
  DirectOrderModal,
  SingleOrderModal,
  BulkOrderModal
} from './modals';

// Utils
import { getOrderStatusText } from '@utils/orderHelpers';

const OrderManagement: React.FC = () => {
  const { materials, updateMaterial } = useMaterials();
  const { showNotification } = useNotification();

  // Custom Hooks
  const { orderList, stats, excludedLowStockMaterials } = useOrderList(materials);
  const { visibleColumns, toggleColumn, availableColumns } = useOrderColumnPrefs();

  // State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [listSearchTerm, setListSearchTerm] = useState<string>('');
  const [columnFilters, setColumnFilters] = useState<{ status: string }>({ status: 'alle' });

  // Modal States
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addSearchTerm, setAddSearchTerm] = useState<string>('');

  const [showDirectOrderModal, setShowDirectOrderModal] = useState<boolean>(false);
  const [directOrderSearchTerm, setDirectOrderSearchTerm] = useState<string>('');

  const [showSingleOrderModal, setShowSingleOrderModal] = useState<boolean>(false);
  const [singleOrderMaterial, setSingleOrderMaterial] = useState<OrderMaterialDisplay | null>(null);
  const [singleOrderIsAdditional, setSingleOrderIsAdditional] = useState<boolean>(false);

  const [showBulkOrderModal, setShowBulkOrderModal] = useState<boolean>(false);

  const [showQRScanner, setShowQRScanner] = useState<boolean>(false);

  // Gefilterte Bestellliste
  const filteredOrderList = useMemo<OrderMaterialDisplay[]>(() => {
    return orderList.filter(m => {
      const matchesSearch = listSearchTerm === '' ||
        m.materialID.toLowerCase().includes(listSearchTerm.toLowerCase()) ||
        (m.description || '').toLowerCase().includes(listSearchTerm.toLowerCase()) ||
        (m.manufacturer || '').toLowerCase().includes(listSearchTerm.toLowerCase());

      const statusText = getOrderStatusText(m);
      const matchesStatus = columnFilters.status === 'alle' ||
        statusText.includes(columnFilters.status);

      return matchesSearch && matchesStatus;
    });
  }, [orderList, listSearchTerm, columnFilters]);

  // Verfügbare Materialien für Modals
  const availableMaterialsForAdd = useMemo<Material[]>(() => {
    return materials.filter(m =>
      m.orderStatus !== 'bestellt' &&
      (addSearchTerm === '' ||
       m.materialID.toLowerCase().includes(addSearchTerm.toLowerCase()) ||
       (m.description || '').toLowerCase().includes(addSearchTerm.toLowerCase()) ||
       (m.manufacturer || '').toLowerCase().includes(addSearchTerm.toLowerCase()))
    );
  }, [materials, addSearchTerm]);

  const availableMaterialsForDirectOrder = useMemo<Material[]>(() => {
    return materials.filter(m =>
      m.orderStatus !== 'bestellt' &&
      (directOrderSearchTerm === '' ||
       m.materialID.toLowerCase().includes(directOrderSearchTerm.toLowerCase()) ||
       (m.description || '').toLowerCase().includes(directOrderSearchTerm.toLowerCase()) ||
       (m.manufacturer || '').toLowerCase().includes(directOrderSearchTerm.toLowerCase()))
    );
  }, [materials, directOrderSearchTerm]);

  // Materialien für Sammelbestellung
  const bulkOrderMaterials = useMemo<OrderMaterialDisplay[]>(() => {
    return materials
      .filter(m =>
        m.orderStatus !== 'bestellt' && (
          (m.stock || 0) < 0 ||
          ((m.stock || 0) <= (m.heatStock || 0) && (m.stock || 0) > 0 && !m.excludeFromAutoOrder)
        )
      )
      .map(m => ({
        ...m,
        _displayType: 'needed' as const,
        _displayQuantity: m.orderQuantity || 0
      }));
  }, [materials]);

  // Handlers
  const handleColumnFilterChange = useCallback((column: string, value: string): void => {
    setColumnFilters(prev => ({ ...prev, [column]: value }));
  }, []);

  const openSingleOrderModal = useCallback((material: OrderMaterialDisplay, isAdditional: boolean = false): void => {
    setSingleOrderMaterial(material);
    setSingleOrderIsAdditional(isAdditional);
    setShowSingleOrderModal(true);
  }, []);

  const closeSingleOrderModal = useCallback((): void => {
    setShowSingleOrderModal(false);
    setSingleOrderMaterial(null);
    setSingleOrderIsAdditional(false);
  }, []);

  // Einzelbestellung bestätigen
  const confirmSingleOrder = useCallback(async ({ qty, price, isAdditional }: { qty: string; price: string; totalPrice: string; isAdditional: boolean }): Promise<void> => {
    if (!singleOrderMaterial) return;

    const qtyValue = parseInt(qty, 10);
    if (isNaN(qtyValue) || qtyValue <= 0) {
      showNotification('Bitte geben Sie eine gültige Bestellmenge ein', NotificationType.ERROR);
      return;
    }

    setIsLoading(true);
    try {
      const newPrice = price.trim() !== '' ? parseFloat(price.replace(',', '.')) : null;
      const priceChanged = newPrice !== null && newPrice !== singleOrderMaterial.price;

      if (priceChanged && newPrice !== null) {
        await updateMaterial({ ...singleOrderMaterial, price: newPrice });
      }

      if (isAdditional) {
        const currentOrdered = singleOrderMaterial.orderedQuantity || 0;
        const newTotal = currentOrdered + qtyValue;

        await FirebaseService.updateDocument('materials', singleOrderMaterial.id, {
          orderedQuantity: newTotal,
          orderDate: new Date(),
          updatedAt: new Date()
        });

        showNotification(`+${qtyValue} Stück nachbestellt (gesamt: ${newTotal})`, NotificationType.SUCCESS);
      } else {
        await FirebaseService.updateDocument('materials', singleOrderMaterial.id, {
          orderStatus: 'bestellt',
          orderDate: new Date(),
          orderedQuantity: qtyValue,
          updatedAt: new Date()
        });

        showNotification(`${qtyValue} Stück als bestellt markiert`, NotificationType.SUCCESS);
      }

      closeSingleOrderModal();
    } catch (error) {
      console.error('Fehler beim Bestellen:', error);
      showNotification('Fehler beim Bestellen', NotificationType.ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [singleOrderMaterial, updateMaterial, showNotification, closeSingleOrderModal]);

  // Bestellung stornieren
  const cancelOrder = useCallback(async (materialId: string): Promise<void> => {
    setIsLoading(true);
    try {
      await FirebaseService.updateDocument('materials', materialId, {
        orderStatus: null,
        orderDate: null,
        orderedQuantity: null,
        updatedAt: new Date()
      });
      showNotification('Bestellung storniert', NotificationType.SUCCESS);
    } catch (error) {
      console.error('Fehler beim Stornieren:', error);
      showNotification('Fehler beim Stornieren', NotificationType.ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  // Material zur Bestellliste hinzufügen
  const addToOrderList = useCallback(async (materialId: string): Promise<void> => {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      if (material.orderStatus !== 'offen' && material.orderStatus !== 'bestellt') {
        try {
          await FirebaseService.updateDocument('materials', materialId, {
            orderStatus: 'offen',
            orderedQuantity: material.orderQuantity || 1,
            orderRequestedAt: new Date(),
            updatedAt: new Date()
          });
          showNotification(`${material.description} zur Bestellliste hinzugefügt`, NotificationType.SUCCESS);
        } catch (error) {
          console.error('Fehler beim Hinzufügen zur Bestellliste:', error);
          showNotification('Fehler beim Hinzufügen zur Bestellliste', NotificationType.ERROR);
        }
      } else {
        showNotification(`${material.description} ist bereits in der Bestellliste`, NotificationType.INFO);
      }
      setShowAddModal(false);
      setAddSearchTerm('');
    }
  }, [materials, showNotification]);

  // Material direkt bestellen
  const directOrderMaterial = useCallback((materialId: string): void => {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      const mockOrderItem: OrderMaterialDisplay = {
        ...material,
        _displayType: 'needed',
        _displayQuantity: material.orderQuantity || 0
      };
      openSingleOrderModal(mockOrderItem, false);
      setShowDirectOrderModal(false);
      setDirectOrderSearchTerm('');
    }
  }, [materials, openSingleOrderModal]);

  // Manuell bestellen (für ausgeschlossene Materialien)
  const manualOrderMaterial = useCallback((materialId: string): void => {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      const mockOrderItem: OrderMaterialDisplay = {
        ...material,
        _displayType: 'needed',
        _displayQuantity: material.orderQuantity || 0
      };
      openSingleOrderModal(mockOrderItem, false);
    }
  }, [materials, openSingleOrderModal]);

  // Sammelbestellung öffnen
  const openBulkOrderModal = useCallback((): void => {
    if (bulkOrderMaterials.length === 0) {
      showNotification('Keine Materialien zu bestellen', NotificationType.INFO);
      return;
    }
    setShowBulkOrderModal(true);
  }, [bulkOrderMaterials, showNotification]);

  // Sammelbestellung bestätigen
  const confirmBulkOrder = useCallback(async (items: BulkOrderItem[]): Promise<void> => {
    setIsLoading(true);
    try {
      const updatePromises = items.map(async (item) => {
        const qtyValue = parseInt(item.qty, 10);
        if (isNaN(qtyValue) || qtyValue <= 0) return;

        const newPrice = item.price.trim() !== '' ? parseFloat(item.price.replace(',', '.')) : null;
        const priceChanged = newPrice !== null && newPrice !== item.material.price;

        if (priceChanged && newPrice !== null) {
          await updateMaterial({ ...item.material, price: newPrice });
        }

        return FirebaseService.updateDocument('materials', item.material.id, {
          orderStatus: 'bestellt',
          orderDate: new Date(),
          orderedQuantity: qtyValue,
          updatedAt: new Date()
        });
      });

      await Promise.all(updatePromises);
      showNotification(`${items.length} Materialien als bestellt markiert`, NotificationType.SUCCESS);
      setShowBulkOrderModal(false);
    } catch (error) {
      console.error('Fehler bei der Sammelbestellung:', error);
      showNotification('Fehler bei der Sammelbestellung', NotificationType.ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [updateMaterial, showNotification]);

  // QR-Code Scan Handler
  const handleQRScan = useCallback((scannedCode: string): void => {
    const material = materials.find(m => m.materialID === scannedCode);

    if (material) {
      if (material.orderStatus === 'bestellt') {
        showNotification(`${material.description} ist bereits bestellt`, NotificationType.WARNING);
        return;
      }
      directOrderMaterial(material.id);
      showNotification(`${material.description} gefunden`, NotificationType.SUCCESS);
    } else {
      showNotification(`Material mit ID "${scannedCode}" nicht gefunden`, NotificationType.ERROR);
    }
  }, [materials, directOrderMaterial, showNotification]);

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <OrderHeader
        toOrderCount={stats.toOrderCount}
        isLoading={isLoading}
        onAddToList={() => setShowAddModal(true)}
        onDirectOrder={() => setShowDirectOrderModal(true)}
        onBulkOrder={openBulkOrderModal}
      />

      {/* Statistiken */}
      <OrderStats stats={stats} />

      {/* Bestellliste */}
      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col">
        <OrderListHeader
          searchTerm={listSearchTerm}
          setSearchTerm={setListSearchTerm}
          statusFilter={columnFilters.status}
          setStatusFilter={(value: string) => handleColumnFilterChange('status', value)}
          visibleColumns={visibleColumns}
          toggleColumn={toggleColumn}
          availableColumns={availableColumns}
        />

        {filteredOrderList.length === 0 ? (
          <OrderEmptyState hasFilters={!!listSearchTerm || columnFilters.status !== 'alle'} />
        ) : (
          <div className="flex-1 overflow-hidden">
            {/* Mobile: Cards */}
            <OrderCards
              orderList={filteredOrderList}
              visibleColumns={visibleColumns}
              isLoading={isLoading}
              onOrder={openSingleOrderModal}
              onCancel={cancelOrder}
            />

            {/* Desktop: Table */}
            <OrderTable
              orderList={filteredOrderList}
              visibleColumns={visibleColumns}
              isLoading={isLoading}
              columnFilters={columnFilters}
              onColumnFilterChange={handleColumnFilterChange}
              onOrder={openSingleOrderModal}
              onCancel={cancelOrder}
            />
          </div>
        )}
      </div>

      {/* Ausgeschlossene Materialien */}
      <ExcludedMaterialsTable
        materials={excludedLowStockMaterials}
        onInclude={manualOrderMaterial}
      />

      {/* Modals */}
      <AddMaterialModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setAddSearchTerm(''); }}
        searchTerm={addSearchTerm}
        onSearchChange={setAddSearchTerm}
        materials={availableMaterialsForAdd}
        isLoading={isLoading}
        onAddToList={addToOrderList}
        onOpenQRScanner={() => setShowQRScanner(true)}
      />

      <DirectOrderModal
        isOpen={showDirectOrderModal}
        onClose={() => { setShowDirectOrderModal(false); setDirectOrderSearchTerm(''); }}
        searchTerm={directOrderSearchTerm}
        onSearchChange={setDirectOrderSearchTerm}
        materials={availableMaterialsForDirectOrder}
        isLoading={isLoading}
        onDirectOrder={directOrderMaterial}
        onOpenQRScanner={() => setShowQRScanner(true)}
      />

      <SingleOrderModal
        isOpen={showSingleOrderModal}
        material={singleOrderMaterial}
        isAdditional={singleOrderIsAdditional}
        isLoading={isLoading}
        onClose={closeSingleOrderModal}
        onConfirm={confirmSingleOrder}
      />

      <BulkOrderModal
        isOpen={showBulkOrderModal}
        materials={bulkOrderMaterials}
        isLoading={isLoading}
        onClose={() => setShowBulkOrderModal(false)}
        onConfirm={confirmBulkOrder}
      />

      {/* QR-Code Scanner Modal */}
      <QRScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
      />
    </div>
  );
};

export default OrderManagement;
