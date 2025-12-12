import React, { useState, useEffect } from 'react';
import { ShoppingCart, Check, X, Package, AlertTriangle, Clock, Plus, Search, Shield, ExternalLink, Settings, Filter } from 'lucide-react';
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
  const [editingOrderQty, setEditingOrderQty] = useState(null);
  const [tempOrderQty, setTempOrderQty] = useState('');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    material: true,
    stock: true,
    heatStock: true,
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

  // Inline-Bearbeitung für Bestellmenge
  const handleOrderQtyEdit = (materialId, currentQty) => {
    setEditingOrderQty(materialId);
    setTempOrderQty(String(currentQty || ''));
  };

  const handleOrderQtyCancel = () => {
    setEditingOrderQty(null);
    setTempOrderQty('');
  };

  const handleOrderQtySave = async (materialId) => {
    try {
      const qtyString = String(tempOrderQty || '').trim();
      if (qtyString === '') {
        setEditingOrderQty(null);
        setTempOrderQty('');
        return;
      }

      const qtyValue = parseInt(qtyString, 10);
      if (isNaN(qtyValue) || qtyValue < 0) {
        showNotification('Bitte geben Sie eine gültige Menge ein', 'error');
        return;
      }

      const material = materials.find(m => m.id === materialId);
      if (material) {
        await updateMaterial({
          ...material,
          orderQuantity: qtyValue
        });
        showNotification('Bestellmenge erfolgreich aktualisiert', 'success');
      } else {
        showNotification('Material nicht gefunden', 'error');
        return;
      }

      setEditingOrderQty(null);
      setTempOrderQty('');
    } catch (error) {
      console.error('Fehler beim Speichern der Bestellmenge:', error);
      showNotification('Fehler beim Aktualisieren der Bestellmenge', 'error');
    }
  };

  // Material als bestellt markieren (mit bestellter Menge)
  // Wenn isAdditional=true, wird die zusätzliche Menge zur bestehenden Bestellung hinzugefügt
  const markAsOrdered = async (materialId, isAdditional = false, additionalQty = 0) => {
    setIsLoading(true);
    try {
      const material = materials.find(m => m.id === materialId);

      if (isAdditional) {
        // Zusätzliche Bestellung: Erhöhe orderedQuantity
        const currentOrdered = material?.orderedQuantity || 0;
        const newTotal = currentOrdered + additionalQty;

        await FirebaseService.updateDocument('materials', materialId, {
          orderedQuantity: newTotal,
          orderDate: new Date(),
          updatedAt: new Date()
        });

        showNotification(`+${additionalQty} Stück nachbestellt (gesamt: ${newTotal})`, 'success');
      } else {
        // excludeFromAutoOrder = true → Defizit, sonst orderQuantity
        const orderedQty = material?.excludeFromAutoOrder
          ? Math.abs(material?.stock || 0)
          : (material?.orderQuantity || 0);

        await FirebaseService.updateDocument('materials', materialId, {
          orderStatus: 'bestellt',
          orderDate: new Date(),
          orderedQuantity: orderedQty,
          updatedAt: new Date()
        });

        showNotification(`${orderedQty} Stück als bestellt markiert`, 'success');
      }
    } catch (error) {
      console.error('Fehler beim Markieren als bestellt:', error);
      showNotification('Fehler beim Aktualisieren', 'error');
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

  // Alle niedrigen/negativen Materialien auf einmal bestellen (ausgenommen: excludeFromAutoOrder bei positiven Beständen)
  const orderAllLowStock = async () => {
    const lowStockMaterials = materials.filter(m =>
      m.orderStatus !== 'bestellt' && (
        // Negativer Bestand = immer einschließen
        m.stock < 0 ||
        // Niedriger Bestand und nicht ausgeschlossen
        (m.stock <= (m.heatStock || 0) && m.stock > 0 && !m.excludeFromAutoOrder)
      )
    );

    if (lowStockMaterials.length === 0) {
      showNotification('Keine Materialien zu bestellen', 'info');
      return;
    }

    setIsLoading(true);
    try {
      const updatePromises = lowStockMaterials.map(material => {
        // excludeFromAutoOrder = true → Defizit, sonst orderQuantity
        const orderedQty = material.excludeFromAutoOrder
          ? Math.abs(material.stock || 0)
          : (material.orderQuantity || 0);
        return FirebaseService.updateDocument('materials', material.id, {
          orderStatus: 'bestellt',
          orderDate: new Date(),
          orderedQuantity: orderedQty,
          updatedAt: new Date()
        });
      });

      await Promise.all(updatePromises);
      showNotification(`${lowStockMaterials.length} Materialien als bestellt markiert`, 'success');
    } catch (error) {
      console.error('Fehler beim Massenbestellung:', error);
      showNotification('Fehler bei der Massenbestellung', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (material) => {
    // Verwende _displayType für die Anzeige
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
    // Verwende _displayType für die Anzeige
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

  // Verfügbare Spalten
  const availableColumns = [
    { key: 'material', label: 'Material', required: true },
    { key: 'stock', label: 'Bestand', required: false },
    { key: 'heatStock', label: 'Meldebestand', required: false },
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
        setVisibleColumns(columnPrefs.columns);
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

  // Material manuell zur Bestellung hinzufügen
  const addMaterialToOrder = async (materialId) => {
    setIsLoading(true);
    try {
      const material = materials.find(m => m.id === materialId);
      // excludeFromAutoOrder = true → Defizit, sonst orderQuantity
      const orderedQty = material?.excludeFromAutoOrder
        ? Math.abs(material?.stock || 0)
        : (material?.orderQuantity || 0);

      await FirebaseService.updateDocument('materials', materialId, {
        orderStatus: 'bestellt',
        orderDate: new Date(),
        orderedQuantity: orderedQty,
        updatedAt: new Date()
      });

      showNotification(`Material zur Bestellung hinzugefügt (${orderedQty} Stück)`, 'success');
      setShowAddModal(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Fehler beim Hinzufügen zur Bestellung:', error);
      showNotification('Fehler beim Hinzufügen zur Bestellung', 'error');
    } finally {
      setIsLoading(false);
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
            onClick={orderAllLowStock}
            disabled={isLoading || lowStockCount === 0}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Alle niedrigen bestellen ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Zu bestellen</p>
              <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
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
                      💾 Einstellungen werden automatisch in Firebase gespeichert
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
                {filteredOrderList.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-50">
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
                        <div className="text-sm text-gray-900">
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
                    {visibleColumns.orderQuantity && (
                      <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {editingOrderQty === material.id ? (
                          <div className="relative z-50">
                            <input
                              type="number"
                              value={tempOrderQty}
                              onChange={(e) => setTempOrderQty(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleOrderQtySave(material.id);
                                } else if (e.key === 'Escape') {
                                  handleOrderQtyCancel();
                                }
                              }}
                              onBlur={() => handleOrderQtySave(material.id)}
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="0"
                              min="0"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer hover:bg-blue-50 hover:border hover:border-blue-200 px-2 py-1 rounded transition-all duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOrderQtyEdit(material.id, material.orderQuantity);
                            }}
                            title="Klicken zum Bearbeiten der Bestellmenge"
                          >
                            <span className="text-sm font-medium text-gray-900 hover:text-blue-700">
                              {material._displayQuantity}
                            </span>
                          </div>
                        )}
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
                            onClick={() => markAsOrdered(material.id, true, material._displayQuantity)}
                            disabled={isLoading}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50 flex items-center space-x-1"
                          >
                            <Check className="h-4 w-4" />
                            <span>Nachbestellen</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => markAsOrdered(material.id)}
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
                        {material.price ? `${material.price} €` : 'Nicht angegeben'}
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
                        {material.manufacturer} • Bestand: {material.stock}
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
    </div>
  );
};

export default OrderManagement;
