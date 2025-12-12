import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { ServiceCatalogService } from '../services/firebaseService';
import { useCalculation } from './CalculationContext';
import { useMaterials } from './MaterialContext';
import { useFirebaseListener, useFirebaseCRUD } from '../hooks';

const ServiceCatalogContext = createContext();

export const useServiceCatalog = () => {
  const context = useContext(ServiceCatalogContext);
  if (!context) {
    throw new Error('useServiceCatalog must be used within a ServiceCatalogProvider');
  }
  return context;
};

// Kategorien für Leistungspositionen
export const SERVICE_CATEGORIES = [
  { id: 'pv-montage', label: 'PV-Montage', icon: 'Sun', isDropdown: true },
  { id: 'wechselrichter', label: 'Wechselrichter', icon: 'Zap', isDropdown: true },
  { id: 'speicher', label: 'Speicher', icon: 'Battery', isDropdown: true },
  { id: 'wallbox', label: 'Wallbox', icon: 'Car', isDropdown: true },
  { id: 'notstrom', label: 'Notstrom', icon: 'Power', isDropdown: true },
  { id: 'optimierer', label: 'Optimierer', icon: 'Target', isDropdown: true },
  { id: 'energiemanagement', label: 'Energiemanagement', icon: 'Cpu', isDropdown: true },
  { id: 'elektroinstallation', label: 'Elektroinstallation', icon: 'Plug', isDropdown: true },
  { id: 'planung', label: 'Planung & Dokumentation', icon: 'FileText', isDropdown: true },
  { id: 'geruest', label: 'Gerüst & Logistik', icon: 'Truck', isDropdown: true },
  { id: 'erdungsanlage', label: 'Erdungsanlage', icon: 'Zap', isDropdown: true }
];

// Einheiten für Leistungspositionen
export const SERVICE_UNITS = [
  { id: 'Stk', label: 'Stück' },
  { id: 'kWp', label: 'kWp' },
  { id: 'm', label: 'Meter' },
  { id: 'm²', label: 'Quadratmeter' },
  { id: 'Std', label: 'Stunde' },
  { id: 'Pausch', label: 'Pauschal' }
];

export const ServiceCatalogProvider = ({ children }) => {
  // Firebase Real-time Listener mit Custom Hook
  const {
    data: services,
    loading: listenerLoading,
    error: listenerError
  } = useFirebaseListener(ServiceCatalogService.subscribeToServices);

  // CRUD Operations Hook
  const crud = useFirebaseCRUD();

  // Kombinierter Loading-State
  const loading = listenerLoading || crud.loading;
  const error = listenerError || crud.error;

  const { calculateServicePosition } = useCalculation();
  const { materials } = useMaterials();

  // Leistungsposition hinzufügen
  const addService = useCallback(async (serviceData) => {
    // Preise berechnen (mit individuellem Materialaufschlag)
    const calculatedPrices = calculateServicePosition(
      serviceData.materials || [],
      serviceData.labor || [],
      materials,
      serviceData.materialMarkup ?? 15
    );

    const newService = {
      ...serviceData,
      calculatedPrices,
      isActive: serviceData.isActive !== false,
      isDefaultPosition: serviceData.isDefaultPosition || false,
      defaultQuantity: serviceData.defaultQuantity || 1,
      sortOrder: serviceData.sortOrder || 999,
      materialMarkup: serviceData.materialMarkup ?? 15
    };

    return crud.execute(ServiceCatalogService.addService, newService);
  }, [crud, calculateServicePosition, materials]);

  // Leistungsposition aktualisieren
  const updateService = useCallback(async (serviceId, serviceData) => {
    // Preise neu berechnen (mit individuellem Materialaufschlag)
    const calculatedPrices = calculateServicePosition(
      serviceData.materials || [],
      serviceData.labor || [],
      materials,
      serviceData.materialMarkup ?? 15
    );

    const updatedService = {
      ...serviceData,
      calculatedPrices,
      materialMarkup: serviceData.materialMarkup ?? 15
    };

    return crud.execute(ServiceCatalogService.updateService, serviceId, updatedService);
  }, [crud, calculateServicePosition, materials]);

  // Leistungsposition löschen
  const deleteService = useCallback(async (serviceId) => {
    return crud.execute(ServiceCatalogService.deleteService, serviceId);
  }, [crud]);

  // Leistungsposition duplizieren
  const duplicateService = useCallback(async (serviceId) => {
    const originalService = services.find(s => s.id === serviceId);
    if (!originalService) {
      return { success: false, error: 'Service nicht gefunden' };
    }

    const { id, createdAt, updatedAt, ...serviceData } = originalService;
    const duplicatedService = {
      ...serviceData,
      name: `${serviceData.name} (Kopie)`,
      shortText: `${serviceData.shortText} (Kopie)`
    };

    return addService(duplicatedService);
  }, [services, addService]);

  // Alle Preise neu berechnen (z.B. nach Änderung der Kalkulationseinstellungen)
  const recalculateAllPrices = useCallback(async () => {
    try {
      crud.setLoading(true);

      for (const service of services) {
        const calculatedPrices = calculateServicePosition(
          service.materials || [],
          service.labor || [],
          materials,
          service.materialMarkup ?? 15
        );

        await ServiceCatalogService.updateService(service.id, {
          ...service,
          calculatedPrices
        });
      }

      return { success: true };
    } catch (err) {
      console.error('Error recalculating prices:', err);
      return { success: false, error: err.message };
    } finally {
      crud.setLoading(false);
    }
  }, [services, calculateServicePosition, materials, crud]);

  // Services nach Kategorie gruppieren
  const getServicesByCategory = useCallback(() => {
    const grouped = {};

    SERVICE_CATEGORIES.forEach(cat => {
      grouped[cat.id] = services.filter(s => s.category === cat.id && s.isActive !== false);
    });

    return grouped;
  }, [services]);

  // Service nach ID finden
  const getServiceById = useCallback((serviceId) => {
    return services.find(s => s.id === serviceId);
  }, [services]);

  // Aktive Services
  const activeServices = useMemo(() =>
    services.filter(s => s.isActive !== false),
    [services]
  );

  // Pflichtpositionen (werden automatisch zu neuen Angeboten hinzugefügt)
  const defaultServices = useMemo(() =>
    services.filter(s => s.isActive !== false && s.isDefaultPosition === true),
    [services]
  );

  const value = {
    services,
    activeServices,
    defaultServices,
    loading,
    error,
    addService,
    updateService,
    deleteService,
    duplicateService,
    recalculateAllPrices,
    getServicesByCategory,
    getServiceById,
    SERVICE_CATEGORIES,
    SERVICE_UNITS
  };

  return (
    <ServiceCatalogContext.Provider value={value}>
      {children}
    </ServiceCatalogContext.Provider>
  );
};
