import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  Package,
  Clock,
  RefreshCw,
  Sun,
  Zap,
  Battery,
  Car,
  FileText,
  Truck,
  MoreHorizontal,
  AlertCircle,
  LucideIcon
} from 'lucide-react';
import { useServiceCatalog, SERVICE_CATEGORIES } from '@context/ServiceCatalogContext';
import { useNotification } from '@context/NotificationContext';
import { NotificationType } from '@app-types/enums';
import ServicePositionEditor from './ServicePositionEditor';
import { BaseModal } from '@components/shared';
import type { ExtendedServiceCatalogItem } from '@app-types/contexts/serviceCatalog.types';

// Icon-Mapping für Kategorien
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Sun,
  Zap,
  Battery,
  Car,
  FileText,
  Truck,
  MoreHorizontal
};

const ServiceCatalog: React.FC = () => {
  const {
    services,
    activeServices,
    loading,
    deleteService,
    duplicateService,
    recalculateAllPrices
  } = useServiceCatalog();
  const { showNotification } = useNotification();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    SERVICE_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.id]: true }), {})
  );
  const [selectedService, setSelectedService] = useState<ExtendedServiceCatalogItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [serviceToDelete, setServiceToDelete] = useState<ExtendedServiceCatalogItem | null>(null);
  const [recalculating, setRecalculating] = useState<boolean>(false);

  // Gefilterte Services
  const filteredServices = useMemo<ExtendedServiceCatalogItem[]>(() => {
    if (!searchTerm.trim()) return services;

    const term = searchTerm.toLowerCase();
    return services.filter(s =>
      s.name?.toLowerCase().includes(term) ||
      s.shortText?.toLowerCase().includes(term) ||
      s.category?.toLowerCase().includes(term)
    );
  }, [services, searchTerm]);

  // Services nach Kategorie gruppiert
  const groupedServices = useMemo<Record<string, ExtendedServiceCatalogItem[]>>(() => {
    const grouped: Record<string, ExtendedServiceCatalogItem[]> = {};
    SERVICE_CATEGORIES.forEach(cat => {
      grouped[cat.id] = filteredServices.filter(s => s.category === cat.id);
    });
    return grouped;
  }, [filteredServices]);

  const toggleCategory = (categoryId: string): void => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleAddNew = (): void => {
    setSelectedService(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (service: ExtendedServiceCatalogItem): void => {
    setSelectedService(service);
    setIsEditorOpen(true);
  };

  const handleDuplicate = async (service: ExtendedServiceCatalogItem): Promise<void> => {
    const result = await duplicateService(service.id);
    if (result.success) {
      showNotification('Position dupliziert', NotificationType.SUCCESS);
    } else {
      showNotification('Fehler beim Duplizieren', NotificationType.ERROR);
    }
  };

  const handleDeleteClick = (service: ExtendedServiceCatalogItem): void => {
    setServiceToDelete(service);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!serviceToDelete) return;

    const result = await deleteService(serviceToDelete.id);
    if (result.success) {
      showNotification('Position gelöscht', NotificationType.SUCCESS);
    } else {
      showNotification('Fehler beim Löschen', NotificationType.ERROR);
    }
    setIsDeleteModalOpen(false);
    setServiceToDelete(null);
  };

  const handleRecalculateAll = async (): Promise<void> => {
    setRecalculating(true);
    const result = await recalculateAllPrices();
    if (result.success) {
      showNotification('Alle Preise wurden neu berechnet', NotificationType.SUCCESS);
    } else {
      showNotification('Fehler bei der Neuberechnung', NotificationType.ERROR);
    }
    setRecalculating(false);
  };

  const formatPrice = (price: number | undefined): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0);
  };

  const getCategoryIcon = (iconName: string): React.ReactNode => {
    const IconComponent = CATEGORY_ICONS[iconName];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <Package className="h-4 w-4" />;
  };

  if (loading && services.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Leistungskatalog</h2>
          <p className="text-sm text-gray-500">
            {activeServices.length} aktive Leistungspositionen
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRecalculateAll}
            disabled={recalculating}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
            Preise neu berechnen
          </button>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Neue Position
          </button>
        </div>
      </div>

      {/* Suche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          placeholder="Positionen suchen..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Kategorien und Services */}
      <div className="space-y-4">
        {SERVICE_CATEGORIES.map(category => {
          const categoryServices = groupedServices[category.id] || [];
          const isExpanded = expandedCategories[category.id];

          return (
            <div key={category.id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Kategorie-Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-gray-600">
                    {getCategoryIcon(category.icon)}
                  </span>
                  <span className="font-medium text-gray-900">{category.label}</span>
                  <span className="text-sm text-gray-500">
                    ({categoryServices.length})
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {/* Services in dieser Kategorie */}
              {isExpanded && (
                <div className="divide-y divide-gray-100">
                  {categoryServices.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                      Keine Positionen in dieser Kategorie
                    </div>
                  ) : (
                    categoryServices.map(service => (
                      <div
                        key={service.id}
                        className="px-4 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-900 truncate">
                                {service.name}
                              </h4>
                              {service.isDefaultPosition && (
                                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                  Pflichtposition
                                </span>
                              )}
                              {!service.isActive && (
                                <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                                  Inaktiv
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1 truncate">
                              {service.shortText}
                            </p>

                            {/* Preisdetails */}
                            <div className="flex items-center space-x-4 mt-2 text-sm">
                              <span className="flex items-center text-gray-500">
                                <Package className="h-3.5 w-3.5 mr-1" />
                                {formatPrice(service.calculatedPrices?.materialCostVK)}
                              </span>
                              <span className="flex items-center text-gray-500">
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                {formatPrice(service.calculatedPrices?.laborCost)}
                              </span>
                              <span className="text-gray-300">|</span>
                              <span className="font-medium text-blue-600">
                                {formatPrice(service.calculatedPrices?.unitPriceNet)} / {service.unit}
                              </span>
                            </div>
                          </div>

                          {/* Aktionen */}
                          <div className="flex items-center space-x-1 ml-4">
                            <button
                              onClick={() => handleEdit(service)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Bearbeiten"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDuplicate(service)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                              title="Duplizieren"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(service)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Löschen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Editor Modal */}
      {isEditorOpen && (
        <ServicePositionEditor
          service={selectedService}
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setSelectedService(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <BaseModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setServiceToDelete(null);
        }}
        title="Position löschen"
        size="sm"
      >
        <div className="p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-gray-900">
                Möchten Sie die Position <strong>"{serviceToDelete?.name}"</strong> wirklich löschen?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setServiceToDelete(null);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Abbrechen
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Löschen
            </button>
          </div>
        </div>
      </BaseModal>
    </div>
  );
};

export default ServiceCatalog;
