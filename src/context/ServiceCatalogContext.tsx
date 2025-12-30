import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { ServiceCatalogService } from '../services/firebaseService';
import { useAuth } from './AuthContext';
import { useCalculation } from './CalculationContext';
import { useMaterials } from './MaterialContext';
import { useFirebaseListener, useFirebaseCRUD } from '../hooks';
import type {
  ServiceCatalogContextValue,
  ExtendedServiceCatalogItem
} from '../types/contexts/serviceCatalog.types';
import { SERVICE_CATEGORIES as CATEGORIES, SERVICE_UNITS as UNITS } from '../types/contexts/serviceCatalog.types';

const ServiceCatalogContext = createContext<ServiceCatalogContextValue | undefined>(undefined);

export const useServiceCatalog = (): ServiceCatalogContextValue => {
  const context = useContext(ServiceCatalogContext);
  if (!context) {
    throw new Error('useServiceCatalog must be used within a ServiceCatalogProvider');
  }
  return context;
};

// Export constants for backward compatibility
export { CATEGORIES as SERVICE_CATEGORIES, UNITS as SERVICE_UNITS };

interface ServiceCatalogProviderProps {
  children: React.ReactNode;
}

export const ServiceCatalogProvider: React.FC<ServiceCatalogProviderProps> = ({ children }) => {
  const { user } = useAuth();

  // Firebase Real-time Listener mit Custom Hook
  // Nur laden wenn User eingeloggt ist
  const {
    data: servicesData,
    loading: listenerLoading,
    error: listenerError
  } = useFirebaseListener(ServiceCatalogService.subscribeToServices, {
    enabled: !!user
  });

  // Type assertion: ServiceCatalogItem → ExtendedServiceCatalogItem
  const services = servicesData as ExtendedServiceCatalogItem[];

  // CRUD Operations Hook
  const crud = useFirebaseCRUD();

  // Kombinierter Loading-State
  const loading = listenerLoading || crud.loading;
  const error = listenerError || crud.error;

  const { calculateServicePosition } = useCalculation();
  const { materials } = useMaterials();

  // Leistungsposition hinzufügen
  const addService = useCallback(async (serviceData: Partial<ExtendedServiceCatalogItem>): Promise<{ success: boolean; error?: string }> => {
    // Preise berechnen (mit individuellem Materialaufschlag)
    const calculatedPrices = calculateServicePosition(
      serviceData.materials || [],
      serviceData.labor || [],
      materials,
      serviceData.materialMarkup ?? 15
    );

    const newService: Partial<ExtendedServiceCatalogItem> = {
      ...serviceData,
      calculatedPrices,
      isActive: serviceData.isActive !== false,
      isDefaultPosition: serviceData.isDefaultPosition || false,
      defaultQuantity: serviceData.defaultQuantity || 1,
      sortOrder: serviceData.sortOrder || 999,
      materialMarkup: serviceData.materialMarkup ?? 15
    };

    return crud.execute(() => ServiceCatalogService.addService(newService as ExtendedServiceCatalogItem));
  }, [crud, calculateServicePosition, materials]);

  // Leistungsposition aktualisieren
  const updateService = useCallback(async (
    serviceId: string,
    serviceData: Partial<ExtendedServiceCatalogItem>
  ): Promise<{ success: boolean; error?: string }> => {
    // Preise neu berechnen (mit individuellem Materialaufschlag)
    const calculatedPrices = calculateServicePosition(
      serviceData.materials || [],
      serviceData.labor || [],
      materials,
      serviceData.materialMarkup ?? 15
    );

    const updatedService: Partial<ExtendedServiceCatalogItem> = {
      ...serviceData,
      calculatedPrices,
      materialMarkup: serviceData.materialMarkup ?? 15
    };

    return crud.execute(() => ServiceCatalogService.updateService(serviceId, updatedService));
  }, [crud, calculateServicePosition, materials]);

  // Leistungsposition löschen
  const deleteService = useCallback(async (serviceId: string): Promise<{ success: boolean; error?: string }> => {
    return crud.execute(() => ServiceCatalogService.deleteService(serviceId));
  }, [crud]);

  // Leistungsposition duplizieren
  const duplicateService = useCallback(async (serviceId: string): Promise<{ success: boolean; error?: string }> => {
    const originalService = services.find(s => s.id === serviceId);
    if (!originalService) {
      return { success: false, error: 'Service nicht gefunden' };
    }

    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...serviceData } = originalService;
    const duplicatedService: Partial<ExtendedServiceCatalogItem> = {
      ...serviceData,
      name: `${serviceData.name} (Kopie)`,
      shortText: `${serviceData.shortText} (Kopie)`
    };

    return addService(duplicatedService);
  }, [services, addService]);

  // Alle Preise neu berechnen (z.B. nach Änderung der Kalkulationseinstellungen)
  const recalculateAllPrices = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
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
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errorMessage };
    } finally {
      crud.setLoading(false);
    }
  }, [services, calculateServicePosition, materials, crud]);

  // Services nach Kategorie gruppieren
  const getServicesByCategory = useCallback((): Record<string, ExtendedServiceCatalogItem[]> => {
    const grouped: Record<string, ExtendedServiceCatalogItem[]> = {};

    CATEGORIES.forEach(cat => {
      grouped[cat.id] = services.filter(s => s.category === cat.id && s.isActive !== false);
    });

    return grouped;
  }, [services]);

  // Service nach ID finden
  const getServiceById = useCallback((serviceId: string): ExtendedServiceCatalogItem | undefined => {
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

  const value: ServiceCatalogContextValue = {
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
    SERVICE_CATEGORIES: CATEGORIES,
    SERVICE_UNITS: UNITS
  };

  return (
    <ServiceCatalogContext.Provider value={value}>
      {children}
    </ServiceCatalogContext.Provider>
  );
};
