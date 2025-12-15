import React, { useState, useMemo, useCallback } from 'react';
import { useMaterials } from '../../context/MaterialContext';
import { useNotification } from '../../context/NotificationContext';
import { FirebaseService } from '../../services/firebaseService';
import { QRScannerModal } from '../shared';

// Hooks
import { useOrderList, useOrderColumnPrefs } from './hooks';

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
import { getStatusText } from './shared/orderUtils';

const OrderManagement = () => {
  const { materials, updateMaterial } = useMaterials();
  const { showNotification } = useNotification();

  // Custom Hooks
  const { orderList, stats, excludedLowStockMaterials } = useOrderList(materials);
  const { visibleColumns, loading: loadingPreferences, toggleColumn, availableColumns } = useOrderColumnPrefs();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [listSearchTerm, setListSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState({ status: 'alle' });

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearchTerm, setAddSearchTerm] = useState('');

  const [showDirectOrderModal, setShowDirectOrderModal] = useState(false);
  const [directOrderSearchTerm, setDirectOrderSearchTerm] = useState('');

  const [showSingleOrderModal, setShowSingleOrderModal] = useState(false);
  const [singleOrderMaterial, setSingleOrderMaterial] = useState(null);
  const [singleOrderIsAdditional, setSingleOrderIsAdditional] = useState(false);

  const [showBulkOrderModal, setShowBulkOrderModal] = useState(false);

  const [showQRScanner, setShowQRScanner] = useState(false);

  // Gefilterte Bestellliste
  const filteredOrderList = useMemo(() => {
    return orderList.filter(m => {
      const matchesSearch = listSearchTerm === '' ||
        m.materialID.toLowerCase().includes(listSearchTerm.toLowerCase()) ||
        m.description.toLowerCase().includes(listSearchTerm.toLowerCase()) ||
        m.manufacturer.toLowerCase().includes(listSearchTerm.toLowerCase());

      const statusText = getStatusText(m);
      const matchesStatus = columnFilters.status === 'alle' ||
        statusText.includes(columnFilters.status);

      return matchesSearch && matchesStatus;
    });
  }, [orderList, listSearchTerm, columnFilters]);

  // Verfügbare Materialien für Modals
  const availableMaterialsForAdd = useMemo(() => {
    return materials.filter(m =>
      m.orderStatus !== 'bestellt' &&
      (addSearchTerm === '' ||
       m.materialID.toLowerCase().includes(addSearchTerm.toLowerCase()) ||
       m.description.toLowerCase().includes(addSearchTerm.toLowerCase()) ||
       m.manufacturer.toLowerCase().includes(addSearchTerm.toLowerCase()))
    );
  }, [materials, addSearchTerm]);

  const availableMaterialsForDirectOrder = useMemo(() => {
    return materials.filter(m =>
      m.orderStatus !== 'bestellt' &&
      (directOrderSearchTerm === '' ||
       m.materialID.toLowerCase().includes(directOrderSearchTerm.toLowerCase()) ||
       m.description.toLowerCase().includes(directOrderSearchTerm.toLowerCase()) ||
       m.manufacturer.toLowerCase().includes(directOrderSearchTerm.toLowerCase()))
    );
  }, [materials, directOrderSearchTerm]);

  // Materialien für Sammelbestellung
  const bulkOrderMaterials = useMemo(() => {
    return materials.filter(m =>
      m.orderStatus !== 'bestellt' && (
        m.stock < 0 ||
        (m.stock <= (m.heatStock || 0) && m.stock > 0 && !m.excludeFromAutoOrder)
      )
    );
  }, [materials]);

  // Handlers
  const handleColumnFilterChange = useCallback((column, value) => {
    setColumnFilters(prev => ({ ...prev, [column]: value }));
  }, []);

  const openSingleOrderModal = useCallback((material, isAdditional = false) => {
    setSingleOrderMaterial(material);
    setSingleOrderIsAdditional(isAdditional);
    setShowSingleOrderModal(true);
  }, []);

  const closeSingleOrderModal = useCallback(() => {
    setShowSingleOrderModal(false);
    setSingleOrderMaterial(null);
    setSingleOrderIsAdditional(false);
  }, []);

  // Einzelbestellung bestätigen
  const confirmSingleOrder = useCallback(async ({ qty, price, isAdditional }) => {
    if (!singleOrderMaterial) return;

    const qtyValue = parseInt(qty, 10);
    if (isNaN(qtyValue) || qtyValue <= 0) {
      showNotification('Bitte geben Sie eine gültige Bestellmenge ein', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const newPrice = price.trim() !== '' ? parseFloat(price.replace(',', '.')) : null;
      const priceChanged = newPrice !== null && newPrice !== singleOrderMaterial.price;

      if (priceChanged) {
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

        showNotification(`+${qtyValue} Stück nachbestellt (gesamt: ${newTotal})`, 'success');
      } else {
        await FirebaseService.updateDocument('materials', singleOrderMaterial.id, {
          orderStatus: 'bestellt',
          orderDate: new Date(),
          orderedQuantity: qtyValue,
          updatedAt: new Date()
        });

        showNotification(`${qtyValue} Stück als bestellt markiert`, 'success');
      }

      closeSingleOrderModal();
    } catch (error) {
      console.error('Fehler beim Bestellen:', error);
      showNotification('Fehler beim Bestellen', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [singleOrderMaterial, updateMaterial, showNotification, closeSingleOrderModal]);

  // Bestellung stornieren
  const cancelOrder = useCallback(async (materialId) => {
    setIsLoading(true);
    try {
      await FirebaseService.updateDocument('materials', materialId, {
        orderStatus: null,
        orderDate: null,
        orderedQuantity: null,
        updatedAt: new Date()
      });
      showNotification('Bestellung storniert', 'success');
    } catch (error) {
      console.error('Fehler beim Stornieren:', error);
      showNotification('Fehler beim Stornieren', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  // Material zur Bestellliste hinzufügen
  const addToOrderList = useCallback(async (materialId) => {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      if (material.stock >= 0) {
        try {
          await FirebaseService.updateDocument('materials', materialId, {
            stock: -1,
            stockState: 'Nachbestellen',
            updatedAt: new Date()
          });
          showNotification(`${material.description} zur Bestellliste hinzugefügt`, 'success');
        } catch (error) {
          console.error('Fehler beim Hinzufügen zur Bestellliste:', error);
          showNotification('Fehler beim Hinzufügen zur Bestellliste', 'error');
        }
      } else {
        showNotification(`${material.description} ist bereits in der Bestellliste`, 'info');
      }
      setShowAddModal(false);
      setAddSearchTerm('');
    }
  }, [materials, showNotification]);

  // Material direkt bestellen
  const directOrderMaterial = useCallback((materialId) => {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      const mockOrderItem = {
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
  const manualOrderMaterial = useCallback((materialId) => {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      const mockOrderItem = {
        ...material,
        _displayType: 'needed',
        _displayQuantity: material.orderQuantity || 0
      };
      openSingleOrderModal(mockOrderItem, false);
    }
  }, [materials, openSingleOrderModal]);

  // Sammelbestellung öffnen
  const openBulkOrderModal = useCallback(() => {
    if (bulkOrderMaterials.length === 0) {
      showNotification('Keine Materialien zu bestellen', 'info');
      return;
    }
    setShowBulkOrderModal(true);
  }, [bulkOrderMaterials, showNotification]);

  // Sammelbestellung bestätigen
  const confirmBulkOrder = useCallback(async (items) => {
    setIsLoading(true);
    try {
      const updatePromises = items.map(async (item) => {
        const qtyValue = parseInt(item.qty, 10);
        if (isNaN(qtyValue) || qtyValue <= 0) return;

        const newPrice = item.price.trim() !== '' ? parseFloat(item.price.replace(',', '.')) : null;
        const priceChanged = newPrice !== null && newPrice !== item.material.price;

        if (priceChanged) {
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
      showNotification(`${items.length} Materialien als bestellt markiert`, 'success');
      setShowBulkOrderModal(false);
    } catch (error) {
      console.error('Fehler bei der Sammelbestellung:', error);
      showNotification('Fehler bei der Sammelbestellung', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [updateMaterial, showNotification]);

  // QR-Code Scan Handler
  const handleQRScan = useCallback((scannedCode) => {
    const material = materials.find(m => m.materialID === scannedCode);

    if (material) {
      if (material.orderStatus === 'bestellt') {
        showNotification(`${material.description} ist bereits bestellt`, 'warning');
        return;
      }
      directOrderMaterial(material.id);
      showNotification(`${material.description} gefunden`, 'success');
    } else {
      showNotification(`Material mit ID "${scannedCode}" nicht gefunden`, 'error');
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
          onSearchChange={setListSearchTerm}
          visibleColumns={visibleColumns}
          availableColumns={availableColumns}
          loadingPreferences={loadingPreferences}
          onToggleColumn={toggleColumn}
        />

        {filteredOrderList.length === 0 ? (
          <OrderEmptyState hasSearchTerm={!!listSearchTerm} />
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
        isLoading={isLoading}
        onManualOrder={manualOrderMaterial}
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
