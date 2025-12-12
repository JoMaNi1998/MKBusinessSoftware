import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  AlertTriangle,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Settings
} from 'lucide-react';
import { useMaterials } from '../context/MaterialContext';
import { useNotification } from '../context/NotificationContext';
import { FirebaseService } from '../services/firebaseService';
import { AddMaterialModal } from './MaterialDetailModal';
import BookingModal from './BookingModal';
import MaterialDetailModal from './MaterialDetailModal';

const MaterialManagement = () => {
  const { materials, addMaterial, updateMaterial, deleteMaterial, updateStock } = useMaterials();
  const { showNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('alle');
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingType, setBookingType] = useState('Ausgang');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    material: true,
    category: true,
    manufacturer: true,
    stock: true,
    price: true,
    status: true,
    ean: false,
    link: false,
    orderQuantity: false,
    unit: false,
    itemsPerUnit: false,
    type: false
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [columnFilters, setColumnFilters] = useState({
    category: 'alle',
    status: 'alle',
    manufacturer: 'alle'
  });
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [activeColumnFilter, setActiveColumnFilter] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [editingPrice, setEditingPrice] = useState(null);
  const [tempPrice, setTempPrice] = useState('');

  const [categories, setCategories] = useState([]);
  
  // Kategorien aus Firebase laden
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await FirebaseService.getDocuments('categories');
        setCategories([{ id: 'alle', name: 'alle' }, ...categoriesData]);
      } catch (error) {
        console.error('Fehler beim Laden der Kategorien:', error);
      }
    };
    loadCategories();
  }, []);
  
  const staticCategories = [
    'alle',
    'Module',
    'Wechselrichter',
    'Batteriespeicher',
    'Montagesystem',
    'Kabel',
    'Stecker',
    'Sicherungen',
    'Überspannungsschutz',
    'Messgeräte',
    'Werkzeuge',
    'Kleinteile',
    'Dokumentation',
    'Energiemanagement',
    'Backupbox',
    'Aderleitung',
    'Tiefenerder'
  ];

  const getStockStatusColor = (stock, heatStock, orderStatus) => {
    if (stock < 0) return 'text-red-700 bg-red-100';
    if (stock === 0) return 'text-red-600 bg-red-50';
    if (orderStatus === 'bestellt') return 'text-blue-600 bg-blue-50';
    if (stock <= heatStock) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getStockStatusText = (stock, heatStock, orderStatus) => {
    if (stock < 0) return `Nachbestellen (${Math.abs(stock)})`;
    if (stock === 0) return 'Nicht verfügbar';
    if (orderStatus === 'bestellt') return 'Bestellt';
    if (stock <= heatStock) return 'Niedrig';
    return 'Auf Lager';
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = searchTerm === '' || 
      material.materialID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Kategorie-Matching mit ID-System
    const matchesCategory = selectedCategory === 'alle' || 
      (material.categoryId && categories.find(cat => cat.id === material.categoryId)?.name === selectedCategory);
    
    const matchesColumnFilters = Object.entries(columnFilters).every(([column, value]) => {
      if (value === 'alle') return true;
      
      switch (column) {
        case 'category': {
          const categoryName = categories.find(cat => cat.id === material.categoryId)?.name;
          return categoryName === value;
        }
        case 'status':
          return getStockStatusText(material.stock, material.heatStock, material.orderStatus) === value;
        case 'manufacturer':
          return material.manufacturer === value;
        default:
          return true;
      }
    });
    
    return matchesSearch && matchesCategory && matchesColumnFilters;
  }).sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    
    // Convert to numbers for stock and price sorting
    if (sortConfig.key === 'stock') {
      aValue = parseInt(aValue) || 0;
      bValue = parseInt(bValue) || 0;
    } else if (sortConfig.key === 'price') {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    }
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const handleAddMaterial = () => {
    setEditingMaterial(null);
    setIsAddModalOpen(true);
  };


  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingMaterial(null);
  };

  const handleOpenBooking = (type) => {
    setBookingType(type);
    setIsBookingModalOpen(true);
  };

  const handleCloseBookingModal = () => {
    setIsBookingModalOpen(false);
  };

  const toggleColumn = async (columnKey) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey]
    };
    setVisibleColumns(newVisibleColumns);
    await saveColumnPreferences(newVisibleColumns);
  };

  // Load column preferences from Firebase
  const loadColumnPreferences = async () => {
    try {
      setLoadingPreferences(true);
      const preferences = await FirebaseService.getDocuments('user-preferences');
      const columnPrefs = preferences.find(pref => pref.type === 'materialColumns');
      
      if (columnPrefs && columnPrefs.columns) {
        setVisibleColumns(columnPrefs.columns);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Spalteneinstellungen:', error);
    } finally {
      setLoadingPreferences(false);
    }
  };

  // Save column preferences to Firebase
  const saveColumnPreferences = async (columns) => {
    try {
      const preferences = await FirebaseService.getDocuments('user-preferences');
      const existingPref = preferences.find(pref => pref.type === 'materialColumns');
      
      const prefData = {
        type: 'materialColumns',
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

  const availableColumns = [
    { key: 'material', label: 'Material', required: true },
    { key: 'category', label: 'Kategorie', required: false },
    { key: 'manufacturer', label: 'Hersteller', required: false },
    { key: 'stock', label: 'Bestand', required: true },
    { key: 'price', label: 'Preis', required: false },
    { key: 'status', label: 'Status', required: false },
    { key: 'ean', label: 'EAN', required: false },
    { key: 'link', label: 'Link', required: false },
    { key: 'orderQuantity', label: 'Bestellmenge', required: false },
    { key: 'itemsPerUnit', label: 'Stück pro Einheit', required: false },
    { key: 'type', label: 'Typ', required: false }
  ];

  // Unique values für Filter
  const uniqueCategories = ['alle', ...new Set(materials.map(m => m.category))];
  const uniqueStatuses = ['alle', 'Auf Lager', 'Niedrig', 'Nicht verfügbar'];
  const uniqueManufacturers = ['alle', ...new Set(materials.map(m => m.manufacturer))];

  const handleColumnFilterChange = (column, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleEditMaterial = (material) => {
    setEditingMaterial(material);
    setIsAddModalOpen(true);
    setDropdownOpen(null);
    setIsDetailModalOpen(false);
  };

  const handleMaterialClick = (material) => {
    setSelectedMaterial(material);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedMaterial(null);
  };

  const handleDeleteMaterial = (materialId) => {
    if (window.confirm('Material wirklich löschen?')) {
      deleteMaterial(materialId);
      showNotification('Material erfolgreich gelöscht', 'success');
    }
    setDropdownOpen(null);
  };

  // Load preferences on component mount
  React.useEffect(() => {
    loadColumnPreferences();
  }, []);

  // Click outside handler for column settings
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColumnSettings && !event.target.closest('.column-settings-container')) {
        setShowColumnSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnSettings]);

  const handleSaveMaterial = (materialData) => {
    if (editingMaterial) {
      // Ensure the material ID is preserved when updating
      const updatedMaterialData = {
        ...materialData,
        id: editingMaterial.id
      };
      updateMaterial(updatedMaterialData);
      showNotification('Material erfolgreich aktualisiert', 'success');
    } else {
      addMaterial(materialData);
      showNotification('Material erfolgreich hinzugefügt', 'success');
    }
  };

  const handleStockUpdate = (materialId, change) => {
    updateStock(materialId, change);
  };

  // Inline Price Editing Functions
  const handlePriceEdit = (materialId, currentPrice) => {
    console.log('Editing price for material ID:', materialId, 'Current price:', currentPrice);
    setEditingPrice(materialId);
    setTempPrice(String(currentPrice || ''));
  };

  const handlePriceCancel = () => {
    setEditingPrice(null);
    setTempPrice('');
  };

  const handlePriceSave = async (materialId) => {
    try {
      // Sicherstellen dass tempPrice ein String ist und leeren Preis abfangen
      const priceString = String(tempPrice || '').trim();
      if (priceString === '') {
        setEditingPrice(null);
        setTempPrice('');
        return;
      }

      const priceValue = parseFloat(priceString.replace(',', '.'));
      if (isNaN(priceValue) || priceValue < 0) {
        showNotification('Bitte geben Sie einen gültigen Preis ein', 'error');
        return;
      }

      // Material finden und komplettes Objekt mit neuem Preis erstellen
      const material = materials.find(m => m.id === materialId);
      if (material) {
        const updatedMaterial = {
          ...material,
          price: priceValue
        };
        console.log('Updating material with:', updatedMaterial);
        await updateMaterial(updatedMaterial);
        showNotification('Preis erfolgreich aktualisiert', 'success');
      } else {
        showNotification('Material nicht gefunden', 'error');
        return;
      }
      
      setEditingPrice(null);
      setTempPrice('');
    } catch (error) {
      console.error('Fehler beim Speichern des Preises:', error);
      showNotification('Fehler beim Aktualisieren des Preises', 'error');
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === '') return '';
    return `${Number(price).toFixed(2).replace('.', ',')}`;
  };


  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Materialverwaltung</h1>
          <p className="mt-1 text-sm text-gray-600">
            Verwalten Sie Ihre PV-Materialien und Bestände
          </p>
        </div>
        <div className="flex space-x-3">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => handleOpenBooking('Eingang')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Einbuchen</span>
            </button>
            <button 
              onClick={() => handleOpenBooking('Ausgang')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
            >
              <TrendingDown className="h-4 w-4" />
              <span>Ausbuchen</span>
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Material hinzufügen</span>
            </button>

          </div>
        </div>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamt Materialien</p>
              <p className="text-2xl font-bold text-gray-900">{materials.length}</p>
            </div>
            <Package className="h-8 w-8 text-primary-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Auf Lager</p>
              <p className="text-2xl font-bold text-green-600">
                {materials.filter(m => m.stock > m.heatStock && m.orderStatus !== 'bestellt').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Niedrig</p>
              <p className="text-2xl font-bold text-orange-600">
                {materials.filter(m => m.stock > 0 && m.stock <= m.heatStock && m.orderStatus !== 'bestellt').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bestellt</p>
              <p className="text-2xl font-bold text-blue-600">
                {materials.filter(m => m.orderStatus === 'bestellt').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nicht verfügbar</p>
              <p className="text-2xl font-bold text-red-600">
                {materials.filter(m => m.stock === 0).length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Suchleiste */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex-1 relative">
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
      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col">
        {/* Fixierter Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-medium text-gray-900">Materialliste</h3>
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
        
        {/* Scrollbare Tabelle */}
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
                {visibleColumns.category && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>Kategorie</span>
                      <div className="relative">
                        <button
                          onClick={() => setActiveColumnFilter(activeColumnFilter === 'category' ? null : 'category')}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <Filter className="h-3 w-3" />
                        </button>
                        {activeColumnFilter === 'category' && (
                          <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-30 border border-gray-200">
                            <div className="p-2">
                              <select
                                value={columnFilters.category}
                                onChange={(e) => handleColumnFilterChange('category', e.target.value)}
                                className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                              >
                                {uniqueCategories.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                )}
                {visibleColumns.manufacturer && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>Hersteller</span>
                      <div className="relative">
                        <button
                          onClick={() => setActiveColumnFilter(activeColumnFilter === 'manufacturer' ? null : 'manufacturer')}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <Filter className="h-3 w-3" />
                        </button>
                        {activeColumnFilter === 'manufacturer' && (
                          <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-30 border border-gray-200">
                            <div className="p-2">
                              <select
                                value={columnFilters.manufacturer}
                                onChange={(e) => handleColumnFilterChange('manufacturer', e.target.value)}
                                className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                              >
                                {uniqueManufacturers.map(manu => (
                                  <option key={manu} value={manu}>{manu}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                )}
                {visibleColumns.stock && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50" onClick={() => handleSort('stock')}>
                    <div className="flex items-center space-x-1">
                      <span>Bestand</span>
                      <div className="relative">
                        {sortConfig.key === 'stock' ? (
                          <span className="text-gray-400 hover:text-gray-600 text-lg font-bold">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        ) : (
                          <Filter className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                        )}
                      </div>
                    </div>
                  </th>
                )}
                {visibleColumns.price && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50" onClick={() => handleSort('price')}>
                    <div className="flex items-center space-x-1">
                      <span>Preis</span>
                      <div className="relative">
                        {sortConfig.key === 'price' ? (
                          <span className="text-gray-400 hover:text-gray-600 text-lg font-bold">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        ) : (
                          <Filter className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                        )}
                      </div>
                    </div>
                  </th>
                )}
                {visibleColumns.ean && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    EAN
                  </th>
                )}
                {visibleColumns.orderQuantity && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50" onClick={() => handleSort('orderQuantity')}>
                    <div className="flex items-center space-x-1">
                      <span>Bestellmenge</span>
                      <div className="relative">
                        {sortConfig.key === 'orderQuantity' ? (
                          <span className="text-gray-400 hover:text-gray-600 text-lg font-bold">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        ) : (
                          <Filter className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                        )}
                      </div>
                    </div>
                  </th>
                )}
                {visibleColumns.itemsPerUnit && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50" onClick={() => handleSort('itemsPerUnit')}>
                    <div className="flex items-center space-x-1">
                      <span>Stück pro Einheit</span>
                      <div className="relative">
                        {sortConfig.key === 'itemsPerUnit' ? (
                          <span className="text-gray-400 hover:text-gray-600 text-lg font-bold">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        ) : (
                          <Filter className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                        )}
                      </div>
                    </div>
                  </th>
                )}
                {visibleColumns.type && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Typ
                  </th>
                )}
                {visibleColumns.link && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Link
                  </th>
                )}
                {visibleColumns.status && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      <div className="relative">
                        <button
                          onClick={() => setActiveColumnFilter(activeColumnFilter === 'status' ? null : 'status')}
                          className="text-gray-400 hover:text-gray-600 p-1"
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMaterials.map((material) => (
                <tr 
                  key={material.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleMaterialClick(material)}
                >
                  {visibleColumns.material && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="p-2">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {material.description}
                          {!visibleColumns.link && material.link && (
                            <a 
                              href={material.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ml-2 text-primary-600 hover:text-primary-800"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {material.materialID}
                        </div>
                      </div>
                    </td>
                  )}
                  {visibleColumns.category && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {categories.find(cat => cat.id === material.categoryId)?.name || 'Unbekannt'}
                      </span>
                    </td>
                  )}
                  {visibleColumns.manufacturer && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {material.manufacturer}
                    </td>
                  )}
                  {visibleColumns.stock && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {material.stock}
                      </span>
                    </td>
                  )}
                  {visibleColumns.price && (
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {editingPrice === material.id ? (
                        <div className="relative z-50">
                          <input
                            type="text"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handlePriceSave(material.id);
                              } else if (e.key === 'Escape') {
                                handlePriceCancel();
                              }
                            }}
                            onBlur={() => handlePriceSave(material.id)}
                            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent relative z-50"
                            placeholder="0,00"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div 
                          className="cursor-pointer hover:bg-blue-50 hover:border hover:border-blue-200 px-2 py-1 rounded transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePriceEdit(material.id, material.price);
                          }}
                          title="Klicken zum Bearbeiten"
                        >
                          <span className="text-sm font-medium text-gray-900 hover:text-blue-700">
                            {formatPrice(material.price) || 'Preis hinzufügen'}
                          </span>
                        </div>
                      )}
                    </td>
                  )}
                  {visibleColumns.ean && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {material.ean || '-'}
                    </td>
                  )}
                  {visibleColumns.orderQuantity && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {material.orderQuantity || 0}
                    </td>
                  )}
                  {visibleColumns.itemsPerUnit && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {material.itemsPerUnit || 0}
                    </td>
                  )}
                  {visibleColumns.type && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {material.type || '-'}
                    </td>
                  )}
                  {visibleColumns.link && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {material.link ? (
                        <a 
                          href={material.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800 flex items-center space-x-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="text-sm">Link</span>
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(material.stock, material.heatStock, material.orderStatus)}`}>
                        {getStockStatusText(material.stock, material.heatStock, material.orderStatus)}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDropdownOpen(dropdownOpen === material.id ? null : material.id);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {dropdownOpen === material.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditMaterial(material);
                              }}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Bearbeiten
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMaterial(material.id);
                              }}
                              className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Löschen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
            
            {filteredMaterials.length === 0 && (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Materialien gefunden</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || selectedCategory !== 'alle' 
                    ? 'Versuchen Sie andere Suchbegriffe oder Filter.'
                    : 'Beginnen Sie mit dem Hinzufügen Ihres ersten Materials.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Material Modal */}
      <AddMaterialModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        material={editingMaterial}
        onSave={handleSaveMaterial}
      />

      {/* Material Detail Modal */}
      <MaterialDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        material={selectedMaterial}
        onEdit={handleEditMaterial}
        onDelete={handleDeleteMaterial}
      />

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={handleCloseBookingModal}
        type={bookingType}
      />
    </div>
  );
};

export default MaterialManagement;
