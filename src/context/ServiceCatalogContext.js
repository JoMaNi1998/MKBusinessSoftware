import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ServiceCatalogService } from '../services/firebaseService';
import { useCalculation } from './CalculationContext';
import { useMaterials } from './MaterialContext';

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
  { id: 'pv-montage', label: 'PV-Montage', icon: 'Sun' },
  { id: 'elektroinstallation', label: 'Elektroinstallation', icon: 'Zap' },
  { id: 'speicher', label: 'Speichersysteme', icon: 'Battery' },
  { id: 'wallbox', label: 'Wallbox/E-Mobilität', icon: 'Car' },
  { id: 'planung', label: 'Planung & Dokumentation', icon: 'FileText' },
  { id: 'geruest', label: 'Gerüst & Logistik', icon: 'Truck' },
  { id: 'sonstiges', label: 'Sonstiges', icon: 'MoreHorizontal' }
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
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { calculateServicePosition, settings: calcSettings } = useCalculation();
  const { materials } = useMaterials();

  // Firebase Real-time Listener
  useEffect(() => {
    let unsubscribe;

    const setupListener = async () => {
      try {
        setLoading(true);
        unsubscribe = ServiceCatalogService.subscribeToServices((servicesData) => {
          setServices(servicesData || []);
          setLoading(false);
        });
      } catch (err) {
        console.error('Error setting up services listener:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Leistungsposition hinzufügen
  const addService = useCallback(async (serviceData) => {
    try {
      setLoading(true);

      // Preise berechnen
      const calculatedPrices = calculateServicePosition(
        serviceData.materials || [],
        serviceData.labor || [],
        materials
      );

      const newService = {
        ...serviceData,
        calculatedPrices,
        isActive: serviceData.isActive !== false,
        sortOrder: serviceData.sortOrder || 999
      };

      await ServiceCatalogService.addService(newService);
      return { success: true };
    } catch (err) {
      console.error('Error adding service:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [calculateServicePosition, materials]);

  // Leistungsposition aktualisieren
  const updateService = useCallback(async (serviceId, serviceData) => {
    try {
      setLoading(true);

      // Preise neu berechnen
      const calculatedPrices = calculateServicePosition(
        serviceData.materials || [],
        serviceData.labor || [],
        materials
      );

      const updatedService = {
        ...serviceData,
        calculatedPrices
      };

      await ServiceCatalogService.updateService(serviceId, updatedService);
      return { success: true };
    } catch (err) {
      console.error('Error updating service:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [calculateServicePosition, materials]);

  // Leistungsposition löschen
  const deleteService = useCallback(async (serviceId) => {
    try {
      setLoading(true);
      await ServiceCatalogService.deleteService(serviceId);
      return { success: true };
    } catch (err) {
      console.error('Error deleting service:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Leistungsposition duplizieren
  const duplicateService = useCallback(async (serviceId) => {
    try {
      const originalService = services.find(s => s.id === serviceId);
      if (!originalService) {
        throw new Error('Service not found');
      }

      const { id, createdAt, updatedAt, ...serviceData } = originalService;
      const duplicatedService = {
        ...serviceData,
        name: `${serviceData.name} (Kopie)`,
        shortText: `${serviceData.shortText} (Kopie)`
      };

      return addService(duplicatedService);
    } catch (err) {
      console.error('Error duplicating service:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [services, addService]);

  // Alle Preise neu berechnen (z.B. nach Änderung der Kalkulationseinstellungen)
  const recalculateAllPrices = useCallback(async () => {
    try {
      setLoading(true);

      for (const service of services) {
        const calculatedPrices = calculateServicePosition(
          service.materials || [],
          service.labor || [],
          materials
        );

        await ServiceCatalogService.updateService(service.id, {
          ...service,
          calculatedPrices
        });
      }

      return { success: true };
    } catch (err) {
      console.error('Error recalculating prices:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [services, calculateServicePosition, materials]);

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
  const activeServices = services.filter(s => s.isActive !== false);

  const value = {
    services,
    activeServices,
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
