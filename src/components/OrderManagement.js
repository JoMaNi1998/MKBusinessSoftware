import React, { useState, useEffect } from 'react';
import { ShoppingCart, Check, X, Package, AlertTriangle, Clock, Plus, Search, Shield, ExternalLink, Settings, Filter, Euro } from 'lucide-react';
import { useMaterials } from '../context/MaterialContext';
import { useNotification } from '../context/NotificationContext';
import { FirebaseService } from '../services/firebaseService';

const OrderManagement = () => {
  const { materials, updateMaterial } = useMaterials();
  const { showNotification } = useNotification();
  const [orderList, setOrderList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [listSearchTerm, setListSearchTerm] = useState('');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    material: true,
    stock: true,
    heatStock: true,
    itemsPerUnit: true,
    price: true,
    orderQuantity: true,
    status: true,
    link: true,
    actions: true
  });
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [columnFilters, setColumnFilters] = useState({
    status: 'alle'
  });
  const [activeColumnFilter, setActiveColumnFilter] = useState(null);

  // State für Einzelbestell-Modal
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderModalMaterial, setOrderModalMaterial] = useState(null);
  const [orderModalQty, setOrderModalQty] = useState('');
  const [orderModalPrice, setOrderModalPrice] = useState('');
  const [orderModalTotalPrice, setOrderModalTotalPrice] = useState('');
  const [orderModalPriceMode, setOrderModalPriceMode] = useState('unit'); // 'unit' oder 'total'
  const [orderModalIsAdditional, setOrderModalIsAdditional] = useState(false);

  // State für Sammelbestell-Modal
  const [showBulkOrderModal, setShowBulkOrderModal] = useState(false);
  const [bulkOrderItems, setBulkOrderItems] = useState([]);
  const [bulkPriceMode, setBulkPriceMode] = useState('unit'); // 'unit' oder 'total'


  // Materialien mit Status "niedrig", "nachbestellen" oder "bestellt" laden (ausgenommen: excludeFromAutoOrder bei positiven Beständen)
  // Bei bereits bestellten Materialien mit zusätzlichem Bedarf: Separate Zeile für Nachbestellung
  useEffect(() => {
    const result = [];

    materials.forEach(m => {
      const isOrdered = m.orderStatus === 'bestellt';
      const orderedQty = m.orderedQuantity || 0;
      const isNegative = m.stock < 0;
      const needed = isNegative ? Math.abs(m.stock) : 0;
      const additionalNeeded = isOrdered && isNegative ? needed - orderedQty : 0;

      // Fall 1: Material ist bestellt - zeige bestellte Menge
      if (isOrdered) {
        result.push({
          ...m,
          _displayType: 'ordered',
          _displayQuantity: orderedQty
        });
      }

      // Fall 2: Material ist bestellt UND es wird mehr benötigt - neue Zeile für Nachbestellung
      if (isOrdered && additionalNeeded > 0) {
        result.push({
          ...m,
          _displayType: 'additional',
          _displayQuantity: additionalNeeded,
          _isAdditionalOrder: true
        });
      }

      // Fall 3: Material ist NICHT bestellt, aber hat negativen Bestand
      // excludeFromAutoOrder = true → absoluter Wert des Defizits anzeigen
      // excludeFromAutoOrder = false → konfigurierte orderQuantity anzeigen
      if (!isOrdered && isNegative) {
        result.push({
          ...m,
          _displayType: 'needed',
          _displayQuantity: m.excludeFromAutoOrder ? needed : (m.orderQuantity || needed)
        });
      }

      // Fall 4: Niedriger Bestand (nicht negativ, nicht bestellt, nicht ausgeschlossen)
      if (!isOrdered && !isNegative && m.stock <= (m.heatStock || 0) && m.stock > 0 && !m.excludeFromAutoOrder) {
        result.push({
          ...m,
          _displayType: 'low',
          _displayQuantity: m.orderQuantity || 0
        });
      }
    });

    setOrderList(result);
  }, [materials]);

  // Einzelbestell-Modal öffnen
  const openOrderModal = (material, isAdditional = false) => {
    const defaultQty = isAdditional
      ? material._displayQuantity
      : (material.excludeFromAutoOrder ? Math.abs(material.stock || 0) : (material.orderQuantity || 0));

    const unitPrice = material.price !== undefined && material.price !== '' ? String(material.price) : '';
    const qty = defaultQty || 0;
    const totalPrice = unitPrice && qty ? String((parseFloat(String(unitPrice).replace(',', '.')) * qty).toFixed(2).replace('.', ',')) : '';

    setOrderModalMaterial(material);
    setOrderModalQty(String(defaultQty));
    setOrderModalPrice(unitPrice);
    setOrderModalTotalPrice(totalPrice);
    setOrderModalPriceMode('unit');
    setOrderModalIsAdditional(isAdditional);
    setShowOrderModal(true);
  };

  // Einzelbestell-Modal schließen
  const closeOrderModal = () => {
    setShowOrderModal(false);
    setOrderModalMaterial(null);
    setOrderModalQty('');
    setOrderModalPrice('');
    setOrderModalTotalPrice('');
    setOrderModalPriceMode('unit');
    setOrderModalIsAdditional(false);
  };

  // Berechnung bei Änderung der Menge im Einzelbestell-Modal
  const handleOrderModalQtyChange = (newQty) => {
    setOrderModalQty(newQty);
    const qty = parseInt(newQty, 10);
    if (!isNaN(qty) && qty > 0) {
      if (orderModalPriceMode === 'unit' && orderModalPrice) {
        const unitPrice = parseFloat(orderModalPrice.replace(',', '.'));
        if (!isNaN(unitPrice)) {
          setOrderModalTotalPrice((unitPrice * qty).toFixed(2).replace('.', ','));
        }
      } else if (orderModalPriceMode === 'total' && orderModalTotalPrice) {
        const totalPrice = parseFloat(orderModalTotalPrice.replace(',', '.'));
        if (!isNaN(totalPrice)) {
          setOrderModalPrice((totalPrice / qty).toFixed(2).replace('.', ','));
        }
      }
    }
  };

  // Berechnung bei Änderung des Stückpreises
  const handleOrderModalUnitPriceChange = (newPrice) => {
    setOrderModalPrice(newPrice);
    const qty = parseInt(orderModalQty, 10);
    const unitPrice = parseFloat(newPrice.replace(',', '.'));
    if (!isNaN(qty) && qty > 0 && !isNaN(unitPrice)) {
      setOrderModalTotalPrice((unitPrice * qty).toFixed(2).replace('.', ','));
    }
  };

  // Berechnung bei Änderung des Gesamtpreises
  const handleOrderModalTotalPriceChange = (newTotal) => {
    setOrderModalTotalPrice(newTotal);
    const qty = parseInt(orderModalQty, 10);
    const totalPrice = parseFloat(newTotal.replace(',', '.'));
    if (!isNaN(qty) && qty > 0 && !isNaN(totalPrice)) {
      setOrderModalPrice((totalPrice / qty).toFixed(2).replace('.', ','));
    }
  };

  // Einzelbestellung bestätigen
  const confirmSingleOrder = async () => {
    if (!orderModalMaterial) return;

    const qtyValue = parseInt(orderModalQty, 10);
    if (isNaN(qtyValue) || qtyValue <= 0) {
      showNotification('Bitte geben Sie eine gültige Bestellmenge ein', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // Preis aktualisieren falls geändert
      const newPrice = orderModalPrice.trim() !== '' ? parseFloat(orderModalPrice.replace(',', '.')) : null;
      const priceChanged = newPrice !== null && newPrice !== orderModalMaterial.price;

      if (priceChanged) {
        await updateMaterial({
          ...orderModalMaterial,
          price: newPrice
        });
      }

      // Bestellung durchführen
      if (orderModalIsAdditional) {
        const currentOrdered = orderModalMaterial.orderedQuantity || 0;
        const newTotal = currentOrdered + qtyValue;

        await FirebaseService.updateDocument('materials', orderModalMaterial.id, {
          orderedQuantity: newTotal,
          orderDate: new Date(),
          updatedAt: new Date()
        });

        showNotification(`+${qtyValue} Stück nachbestellt (gesamt: ${newTotal})`, 'success');
      } else {
        await FirebaseService.updateDocument('materials', orderModalMaterial.id, {
          orderStatus: 'bestellt',
          orderDate: new Date(),
          orderedQuantity: qtyValue,
          updatedAt: new Date()
        });

        showNotification(`${qtyValue} Stück als bestellt markiert`, 'success');
      }

      closeOrderModal();
    } catch (error) {
      console.error('Fehler beim Bestellen:', error);
      showNotification('Fehler beim Bestellen', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Sammelbestell-Modal öffnen
  const openBulkOrderModal = () => {
    const lowStockMaterials = materials.filter(m =>
      m.orderStatus !== 'bestellt' && (
        m.stock < 0 ||
        (m.stock <= (m.heatStock || 0) && m.stock > 0 && !m.excludeFromAutoOrder)
      )
    );

    if (lowStockMaterials.length === 0) {
      showNotification('Keine Materialien zu bestellen', 'info');
      return;
    }

    const items = lowStockMaterials.map(material => {
      const qty = material.excludeFromAutoOrder ? Math.abs(material.stock || 0) : (material.orderQuantity || 0);
      const unitPrice = material.price !== undefined && material.price !== '' ? String(material.price) : '';
      const totalPrice = unitPrice && qty ? String((parseFloat(String(unitPrice).replace(',', '.')) * qty).toFixed(2).replace('.', ',')) : '';
      return {
        material,
        qty: String(qty),
        price: unitPrice,
        totalPrice: totalPrice
      };
    });

    setBulkOrderItems(items);
    setBulkPriceMode('unit');
    setShowBulkOrderModal(true);
  };

  // Sammelbestell-Modal schließen
  const closeBulkOrderModal = () => {
    setShowBulkOrderModal(false);
    setBulkOrderItems([]);
    setBulkPriceMode('unit');
  };

  // Sammelbestell-Item aktualisieren mit automatischer Berechnung
  const updateBulkOrderItem = (index, field, value) => {
    setBulkOrderItems(prev => {
      const newItems = [...prev];
      const item = { ...newItems[index] };
      item[field] = value;

      const qty = parseInt(item.qty, 10);

      if (field === 'qty' && !isNaN(qty) && qty > 0) {
        if (bulkPriceMode === 'unit' && item.price) {
          const unitPrice = parseFloat(item.price.replace(',', '.'));
          if (!isNaN(unitPrice)) {
            item.totalPrice = (unitPrice * qty).toFixed(2).replace('.', ',');
          }
        } else if (bulkPriceMode === 'total' && item.totalPrice) {
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

  // Sammelbestellung bestätigen
  const confirmBulkOrder = async () => {
    setIsLoading(true);
    try {
      const updatePromises = bulkOrderItems.map(async (item) => {
        const qtyValue = parseInt(item.qty, 10);
        if (isNaN(qtyValue) || qtyValue <= 0) return;

        // Preis aktualisieren falls geändert
        const newPrice = item.price.trim() !== '' ? parseFloat(item.price.replace(',', '.')) : null;
        const priceChanged = newPrice !== null && newPrice !== item.material.price;

        if (priceChanged) {
          await updateMaterial({
            ...item.material,
            price: newPrice
          });
        }

        // Bestellung durchführen
        return FirebaseService.updateDocument('materials', item.material.id, {
          orderStatus: 'bestellt',
          orderDate: new Date(),
          orderedQuantity: qtyValue,
          updatedAt: new Date()
        });
      });

      await Promise.all(updatePromises);
      showNotification(`${bulkOrderItems.length} Materialien als bestellt markiert`, 'success');
      closeBulkOrderModal();
    } catch (error) {
      console.error('Fehler bei der Sammelbestellung:', error);
      showNotification('Fehler bei der Sammelbestellung', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Bestellung stornieren
  const cancelOrder = async (materialId) => {
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
  };

  const getStatusColor = (material) => {
    switch (material._displayType) {
      case 'ordered':
        return 'bg-blue-100 text-blue-800';
      case 'additional':
        return 'bg-red-100 text-red-800';
      case 'needed':
        return 'bg-red-100 text-red-800';
      case 'low':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (material) => {
    switch (material._displayType) {
      case 'ordered':
        return `Bestellt (${material._displayQuantity})`;
      case 'additional':
        return `Nachbestellen (${material._displayQuantity})`;
      case 'needed':
        return `Nachbestellen (${material._displayQuantity})`;
      case 'low':
        return 'Niedrig';
      default:
        return 'Auf Lager';
    }
  };

  // Preis formatieren
  const formatPrice = (price) => {
    if (price === null || price === undefined || price === '') return '-';
    return `${Number(price).toFixed(2).replace('.', ',')} €`;
  };

  // Verfügbare Spalten
  const availableColumns = [
    { key: 'material', label: 'Material', required: true },
    { key: 'stock', label: 'Bestand', required: false },
    { key: 'heatStock', label: 'Meldebestand', required: false },
    { key: 'itemsPerUnit', label: 'Stk/Einheit', required: false },
    { key: 'price', label: 'Preis', required: false },
    { key: 'orderQuantity', label: 'Bestellmenge', required: true },
    { key: 'status', label: 'Status', required: false },
    { key: 'link', label: 'Link', required: false },
    { key: 'actions', label: 'Aktionen', required: true }
  ];

  // Unique Status-Werte für Filter
  const uniqueStatuses = ['alle', 'Bestellt', 'Nachbestellen', 'Niedrig'];

  // Spalten-Einstellungen aus Firebase laden
  const loadColumnPreferences = async () => {
    try {
      setLoadingPreferences(true);
      const preferences = await FirebaseService.getDocuments('user-preferences');
      const columnPrefs = preferences.find(pref => pref.type === 'orderColumns');

      if (columnPrefs && columnPrefs.columns) {
        // Merge mit Default-Werten für neue Spalten
        setVisibleColumns(prev => ({
          ...prev,
          ...columnPrefs.columns
        }));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Spalteneinstellungen:', error);
    } finally {
      setLoadingPreferences(false);
    }
  };

  // Spalten-Einstellungen in Firebase speichern
  const saveColumnPreferences = async (columns) => {
    try {
      const preferences = await FirebaseService.getDocuments('user-preferences');
      const existingPref = preferences.find(pref => pref.type === 'orderColumns');

      const prefData = {
        type: 'orderColumns',
        columns: columns,
        updatedAt: new Date()
      };

      if (existingPref) {
        await FirebaseService.updateDocument('user-preferences', existingPref.id, prefData);
      } else {
        await FirebaseService.addDocument('user-preferences', {
          ...prefData,
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Spalteneinstellungen:', error);
      showNotification('Fehler beim Speichern der Spalteneinstellungen', 'error');
    }
  };

  // Spalte umschalten
  const toggleColumn = async (columnKey) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey]
    };
    setVisibleColumns(newVisibleColumns);
    await saveColumnPreferences(newVisibleColumns);
  };

  // Spaltenfilter ändern
  const handleColumnFilterChange = (column, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
    setActiveColumnFilter(null);
  };

  // Click-Outside Handler für Settings und Filter
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColumnSettings && !event.target.closest('.column-settings-container')) {
        setShowColumnSettings(false);
      }
      if (activeColumnFilter && !event.target.closest('.column-filter-container')) {
        setActiveColumnFilter(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColumnSettings, activeColumnFilter]);

  // Spalten-Einstellungen beim Laden der Komponente laden
  useEffect(() => {
    loadColumnPreferences();
  }, []);

  // Material manuell zur Bestellung hinzufügen (öffnet Modal)
  const addMaterialToOrder = (materialId) => {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      // Material wie ein orderList-Item behandeln
      const mockOrderItem = {
        ...material,
        _displayType: 'needed',
        _displayQuantity: material.orderQuantity || 0
      };
      openOrderModal(mockOrderItem, false);
      setShowAddModal(false);
      setSearchTerm('');
    }
  };

  // Verfügbare Materialien für manuelle Bestellung (nicht bereits bestellt)
  const availableMaterials = materials.filter(m =>
    m.orderStatus !== 'bestellt' &&
    (searchTerm === '' ||
     m.materialID.toLowerCase().includes(searchTerm.toLowerCase()) ||
     m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
     m.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const lowStockCount = materials.filter(m => m.stock <= (m.heatStock || 0) && m.stock > 0 && m.orderStatus !== 'bestellt' && !m.excludeFromAutoOrder).length;
  const negativeStockCount = materials.filter(m => m.stock < 0 && m.orderStatus !== 'bestellt').length;
  const toOrderCount = lowStockCount + negativeStockCount;
  const orderedCount = materials.filter(m => m.orderStatus === 'bestellt').length;
  const excludedLowStockCount = materials.filter(m => m.stock <= (m.heatStock || 0) && m.stock > 0 && m.excludeFromAutoOrder && m.orderStatus !== 'bestellt').length;

  // Ausgeschlossene Materialien mit niedrigem Bestand
  const excludedLowStockMaterials = materials.filter(m =>
    m.stock <= (m.heatStock || 0) && m.stock > 0 && m.excludeFromAutoOrder && m.orderStatus !== 'bestellt'
  );

  // Gefilterte Bestellliste basierend auf Suchbegriff und Spaltenfilter
  const filteredOrderList = orderList.filter(m => {
    const matchesSearch = listSearchTerm === '' ||
      m.materialID.toLowerCase().includes(listSearchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(listSearchTerm.toLowerCase()) ||
      m.manufacturer.toLowerCase().includes(listSearchTerm.toLowerCase());

    const statusText = getStatusText(m);
    const matchesStatus = columnFilters.status === 'alle' ||
      statusText.includes(columnFilters.status);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bestellmanagement</h1>
          <p className="text-gray-600">Materialien bestellen und Bestellstatus verwalten</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Material hinzufügen</span>
          </button>
          <button
            onClick={openBulkOrderModal}
            disabled={isLoading || toOrderCount === 0}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Alle niedrigen bestellen ({toOrderCount})</span>
          </button>
        </div>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Zu bestellen</p>
              <p className="text-2xl font-bold text-orange-600">{toOrderCount}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bestellt</p>
              <p className="text-2xl font-bold text-blue-600">{orderedCount}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ausgeschlossen</p>
              <p className="text-2xl font-bold text-amber-600">{excludedLowStockCount}</p>
            </div>
            <Shield className="h-8 w-8 text-amber-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamt Bestellliste</p>
              <p className="text-2xl font-bold text-gray-900">{orderList.length}</p>
            </div>
            <Package className="h-8 w-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Suchleiste */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Bestellung suchen (ID, Beschreibung, Hersteller)..."
            value={listSearchTerm}
            onChange={(e) => setListSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Bestellliste */}
      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Bestellliste</h2>
          <div className="relative column-settings-container">
            <button
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
              title="Spalten anpassen"
            >
              <Settings className="h-5 w-5" />
            </button>
            {showColumnSettings && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Spalten anzeigen</h3>
                    {loadingPreferences && (
                      <div className="text-xs text-gray-500">Lädt...</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {availableColumns.map(column => (
                      <label key={column.key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={visibleColumns[column.key]}
                          onChange={() => !column.required && toggleColumn(column.key)}
                          disabled={column.required || loadingPreferences}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className={`text-sm ${
                          column.required ? 'text-gray-400' : 'text-gray-700'
                        }`}>
                          {column.label}
                          {column.required && ' (erforderlich)'}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Einstellungen werden automatisch gespeichert
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {filteredOrderList.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>{listSearchTerm ? 'Keine Materialien gefunden' : 'Keine Materialien in der Bestellliste'}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {visibleColumns.material && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Material
                    </th>
                  )}
                  {visibleColumns.stock && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bestand
                    </th>
                  )}
                  {visibleColumns.heatStock && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meldebestand
                    </th>
                  )}
                  {visibleColumns.itemsPerUnit && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stk/Einheit
                    </th>
                  )}
                  {visibleColumns.price && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preis
                    </th>
                  )}
                  {visibleColumns.orderQuantity && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bestellmenge
                    </th>
                  )}
                  {visibleColumns.status && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        <div className="relative column-filter-container">
                          <button
                            onClick={() => setActiveColumnFilter(activeColumnFilter === 'status' ? null : 'status')}
                            className={`text-gray-400 hover:text-gray-600 p-1 ${columnFilters.status !== 'alle' ? 'text-primary-600' : ''}`}
                          >
                            <Filter className="h-3 w-3" />
                          </button>
                          {activeColumnFilter === 'status' && (
                            <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-30 border border-gray-200">
                              <div className="p-2">
                                <select
                                  value={columnFilters.status}
                                  onChange={(e) => handleColumnFilterChange('status', e.target.value)}
                                  className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                  {uniqueStatuses.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </th>
                  )}
                  {visibleColumns.link && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Link
                    </th>
                  )}
                  {visibleColumns.actions && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrderList.map((material, index) => (
                  <tr key={`${material.id}-${material._displayType}-${index}`} className="hover:bg-gray-50">
                    {visibleColumns.material && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {material.description}
                          </div>
                          <div className="text-sm text-gray-500">
                            {material.materialID}
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.stock && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${material.stock < 0 ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                          {material.stock}
                        </div>
                      </td>
                    )}
                    {visibleColumns.heatStock && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {material.heatStock}
                        </div>
                      </td>
                    )}
                    {visibleColumns.itemsPerUnit && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {material.itemsPerUnit || '-'}
                        </div>
                      </td>
                    )}
                    {visibleColumns.price && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatPrice(material.price)}
                        </div>
                      </td>
                    )}
                    {visibleColumns.orderQuantity && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {material._displayQuantity}
                        </div>
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(material)}`}>
                          {getStatusText(material)}
                        </span>
                      </td>
                    )}
                    {visibleColumns.link && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {material.link ? (
                          <a
                            href={material.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-5 w-5" />
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.actions && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {material._displayType === 'ordered' ? (
                          <button
                            onClick={() => cancelOrder(material.id)}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 flex items-center space-x-1"
                          >
                            <X className="h-4 w-4" />
                            <span>Stornieren</span>
                          </button>
                        ) : material._displayType === 'additional' ? (
                          <button
                            onClick={() => openOrderModal(material, true)}
                            disabled={isLoading}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50 flex items-center space-x-1"
                          >
                            <Check className="h-4 w-4" />
                            <span>Nachbestellen</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => openOrderModal(material, false)}
                            disabled={isLoading}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50 flex items-center space-x-1"
                          >
                            <Check className="h-4 w-4" />
                            <span>Bestellen</span>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {/* Ausgeschlossene Materialien mit niedrigem Bestand */}
      {excludedLowStockMaterials.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-amber-50">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Von automatischer Nachbestellung ausgeschlossen
              </h2>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              Diese Materialien haben niedrigen Bestand, werden aber nicht automatisch nachbestellt
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bestand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meldebestand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stk/Einheit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Link
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {excludedLowStockMaterials.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {material.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          {material.materialID}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-red-600 font-medium">
                        {material.stock}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {material.heatStock}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {material.itemsPerUnit || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatPrice(material.price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {material.link ? (
                        <a
                          href={material.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => addMaterialToOrder(material.id)}
                        disabled={isLoading}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50 flex items-center space-x-1"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>Manuell bestellen</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Material zur Bestellung hinzufügen Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 !m-0 !top-0">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Material zur Bestellung hinzufügen</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchTerm('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Suchfeld */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Material suchen (ID, Beschreibung, Hersteller)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Materialliste */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableMaterials.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>Keine verfügbaren Materialien gefunden</p>
                </div>
              ) : (
                availableMaterials.map((material) => (
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
                      onClick={() => addMaterialToOrder(material.id)}
                      disabled={isLoading}
                      className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-sm"
                    >
                      Hinzufügen
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Einzelbestell-Modal */}
      {showOrderModal && orderModalMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 !m-0 !top-0">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {orderModalIsAdditional ? 'Nachbestellung bestätigen' : 'Bestellung bestätigen'}
              </h2>
              <button
                onClick={closeOrderModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Material Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-medium text-gray-900">{orderModalMaterial.description}</div>
                <div className="text-sm text-gray-500">{orderModalMaterial.materialID}</div>
                {orderModalMaterial.itemsPerUnit && (
                  <div className="text-sm text-gray-500 mt-1">
                    Stück pro Einheit: {orderModalMaterial.itemsPerUnit}
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
                  value={orderModalQty}
                  onChange={(e) => handleOrderModalQtyChange(e.target.value)}
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
                    onClick={() => setOrderModalPriceMode('unit')}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                      orderModalPriceMode === 'unit'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Stückpreis
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderModalPriceMode('total')}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                      orderModalPriceMode === 'total'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Gesamtpreis
                  </button>
                </div>
              </div>

              {/* Preiseingabe basierend auf Modus */}
              {orderModalPriceMode === 'unit' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stückpreis (€)
                  </label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      value={orderModalPrice}
                      onChange={(e) => handleOrderModalUnitPriceChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="0,00"
                    />
                  </div>
                  {orderModalTotalPrice && (
                    <p className="text-sm text-gray-600 mt-2">
                      Gesamtpreis: <span className="font-medium">{orderModalTotalPrice} €</span>
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
                      value={orderModalTotalPrice}
                      onChange={(e) => handleOrderModalTotalPriceChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="0,00"
                    />
                  </div>
                  {orderModalPrice && (
                    <p className="text-sm text-green-600 mt-2">
                      Berechneter Stückpreis: <span className="font-medium">{orderModalPrice} €</span>
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
                onClick={closeOrderModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Abbrechen
              </button>
              <button
                onClick={confirmSingleOrder}
                disabled={isLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <Check className="h-4 w-4" />
                <span>{orderModalIsAdditional ? 'Nachbestellen' : 'Bestellen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sammelbestell-Modal */}
      {showBulkOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 !m-0 !top-0">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Sammelbestellung bestätigen ({bulkOrderItems.length} Materialien)
              </h2>
              <button
                onClick={closeBulkOrderModal}
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
                    onClick={() => setBulkPriceMode('unit')}
                    className={`px-3 py-1 text-sm font-medium transition-colors ${
                      bulkPriceMode === 'unit'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Stückpreis
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkPriceMode('total')}
                    className={`px-3 py-1 text-sm font-medium transition-colors border-l border-gray-300 ${
                      bulkPriceMode === 'total'
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
                    {bulkPriceMode === 'unit' ? (
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
                  {bulkOrderItems.map((item, index) => {
                    const qty = parseInt(item.qty || 0, 10);
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
                            onChange={(e) => updateBulkOrderItem(index, 'qty', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            min="1"
                          />
                        </td>
                        {bulkPriceMode === 'unit' ? (
                          <>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={item.price}
                                onChange={(e) => updateBulkOrderItem(index, 'price', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="0,00"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatPrice(total)}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={item.totalPrice || ''}
                                onChange={(e) => updateBulkOrderItem(index, 'totalPrice', e.target.value)}
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
                    <td colSpan="4" className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      Gesamtsumme:
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">
                      {formatPrice(
                        bulkOrderItems.reduce((sum, item) => {
                          const qty = parseInt(item.qty || 0, 10);
                          const price = parseFloat((item.price || '0').replace(',', '.'));
                          return sum + (qty * price);
                        }, 0)
                      )}
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
                onClick={closeBulkOrderModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Abbrechen
              </button>
              <button
                onClick={confirmBulkOrder}
                disabled={isLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Alle bestellen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
