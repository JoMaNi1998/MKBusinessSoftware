import React, { useState, useEffect } from 'react';
import { ShoppingCart, Check, X, Package, AlertTriangle, Clock, Plus, Search, Shield } from 'lucide-react';
import { useMaterials } from '../context/MaterialContext';
import { useNotification } from '../context/NotificationContext';
import { FirebaseService } from '../services/firebaseService';

const OrderManagement = () => {
  const { materials } = useMaterials();
  const { showNotification } = useNotification();
  const [orderList, setOrderList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Materialien mit Status "niedrig" oder "bestellt" laden (ausgenommen: excludeFromAutoOrder)
  useEffect(() => {
    const lowStockMaterials = materials.filter(m => 
      ((m.stock <= m.heatStock && m.stock > 0 && !m.excludeFromAutoOrder) || m.orderStatus === 'bestellt')
    );
    setOrderList(lowStockMaterials);
  }, [materials]);

  // Material als bestellt markieren
  const markAsOrdered = async (materialId) => {
    setIsLoading(true);
    try {
      await FirebaseService.updateDocument('materials', materialId, {
        orderStatus: 'bestellt',
        orderDate: new Date(),
        updatedAt: new Date()
      });
      
      showNotification('Material als bestellt markiert', 'success');
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

  // Alle niedrigen Materialien auf einmal bestellen (ausgenommen: excludeFromAutoOrder)
  const orderAllLowStock = async () => {
    const lowStockMaterials = materials.filter(m => 
      m.stock <= m.heatStock && m.stock > 0 && m.orderStatus !== 'bestellt' && !m.excludeFromAutoOrder
    );

    if (lowStockMaterials.length === 0) {
      showNotification('Keine Materialien zu bestellen', 'info');
      return;
    }

    setIsLoading(true);
    try {
      const updatePromises = lowStockMaterials.map(material =>
        FirebaseService.updateDocument('materials', material.id, {
          orderStatus: 'bestellt',
          orderDate: new Date(),
          updatedAt: new Date()
        })
      );

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
    if (material.orderStatus === 'bestellt') return 'bg-blue-100 text-blue-800';
    if (material.stock <= material.heatStock) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (material) => {
    if (material.orderStatus === 'bestellt') return 'Bestellt';
    if (material.stock <= material.heatStock) return 'Niedrig';
    return 'Auf Lager';
  };

  // Material manuell zur Bestellung hinzufügen
  const addMaterialToOrder = async (materialId) => {
    setIsLoading(true);
    try {
      await FirebaseService.updateDocument('materials', materialId, {
        orderStatus: 'bestellt',
        orderDate: new Date(),
        updatedAt: new Date()
      });
      
      showNotification('Material zur Bestellung hinzugefügt', 'success');
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

  const lowStockCount = materials.filter(m => m.stock <= m.heatStock && m.stock > 0 && m.orderStatus !== 'bestellt' && !m.excludeFromAutoOrder).length;
  const orderedCount = materials.filter(m => m.orderStatus === 'bestellt').length;
  const excludedLowStockCount = materials.filter(m => m.stock <= m.heatStock && m.stock > 0 && m.excludeFromAutoOrder && m.orderStatus !== 'bestellt').length;
  
  // Ausgeschlossene Materialien mit niedrigem Bestand
  const excludedLowStockMaterials = materials.filter(m => 
    m.stock <= m.heatStock && m.stock > 0 && m.excludeFromAutoOrder && m.orderStatus !== 'bestellt'
  );

  return (
    <div className="space-y-6">
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

      {/* Bestellliste */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Bestellliste</h2>
        </div>

        {orderList.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>Keine Materialien in der Bestellliste</p>
          </div>
        ) : (
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
                    Bestellmenge
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orderList.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                          <span>{material.materialID}</span>
                          {material.excludeFromAutoOrder && (
                            <Shield className="h-4 w-4 text-amber-500" title="Von automatischer Nachbestellung ausgeschlossen" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {material.description}
                        </div>
                        {material.excludeFromAutoOrder && (
                          <div className="text-xs text-amber-600 mt-1">
                            Manuelle Bestellung erforderlich
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {material.stock} {material.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {material.heatStock} {material.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {material.orderQuantity || (material.heatStock * 2)} {material.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(material)}`}>
                        {getStatusText(material)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {material.orderStatus === 'bestellt' ? (
                        <button
                          onClick={() => cancelOrder(material.id)}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 flex items-center space-x-1"
                        >
                          <X className="h-4 w-4" />
                          <span>Stornieren</span>
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
                  </tr>
                ))}
              </tbody>
            </table>
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
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {excludedLowStockMaterials.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                          <span>{material.materialID}</span>
                          <Shield className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="text-sm text-gray-500">
                          {material.description}
                        </div>
                        <div className="text-xs text-amber-600 mt-1">
                          Manuelle Bestellung erforderlich
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-red-600 font-medium">
                        {material.stock} {material.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {material.heatStock} {material.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {material.price ? `${material.price} €` : 'Nicht angegeben'}
                      </div>
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
                        {material.manufacturer} • Bestand: {material.stock} {material.unit}
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
