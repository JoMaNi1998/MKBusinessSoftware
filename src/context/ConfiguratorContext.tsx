import React, { createContext, useContext, useCallback } from 'react';
import { ConfiguratorService } from '../services/firebaseService';
import { useAuth } from './AuthContext';
import { useRoleSafe } from './RoleContext';
import { useFirebaseListener, useFirebaseCRUD } from '../hooks';
import type {
  ConfiguratorContextValue,
  Configuration,
  ConfigurationStatus,
  ConfigurationStatistics
} from '../types/contexts/configurator.types';
import { ConfigurationStatus as ConfigStatus } from '../types/contexts/configurator.types';

const ConfiguratorContext = createContext<ConfiguratorContextValue | undefined>(undefined);

export const useConfigurations = (): ConfiguratorContextValue => {
  const context = useContext(ConfiguratorContext);
  if (!context) {
    throw new Error('useConfigurations must be used within a ConfiguratorProvider');
  }
  return context;
};

// Status-Optionen für Konfigurationen (für Kompatibilität)
export const CONFIG_STATUS = {
  DRAFT: ConfigStatus.DRAFT,
  COMPLETED: ConfigStatus.COMPLETED,
  BOOKED: ConfigStatus.BOOKED
} as const;

// Export status labels
export { CONFIG_STATUS_LABELS } from '../types/contexts/configurator.types';

interface ConfiguratorProviderProps {
  children: React.ReactNode;
}

export const ConfiguratorProvider: React.FC<ConfiguratorProviderProps> = ({ children }) => {
  const { user } = useAuth();

  // Rollen-Check: Monteure haben keinen Zugriff auf PV-Konfigurationen
  const { permissions } = useRoleSafe();
  const isMonteurOnly = permissions.length === 1 && permissions.includes('monteur');

  // Firebase Real-time Listener mit Custom Hook
  // Nur laden wenn User eingeloggt und NICHT nur Monteur
  const {
    data: configurations,
    loading: listenerLoading,
    error: listenerError
  } = useFirebaseListener<Configuration>(ConfiguratorService.subscribeToConfigurations, {
    enabled: !!user && !isMonteurOnly
  });

  // CRUD Operations Hook
  const crud = useFirebaseCRUD();

  // Kombinierter Loading-State
  const loading = listenerLoading || crud.loading;
  const error = listenerError || crud.error;

  // Neue Konfiguration erstellen
  const createConfiguration = useCallback(async (configData: Partial<Configuration>): Promise<{
    success: boolean;
    configId?: string;
    configNumber?: number;
    error?: string;
  }> => {
    try {
      crud.setLoading(true);

      // Konfigurationsnummer generieren
      const configNumber = await ConfiguratorService.getNextConfigNumber();

      // Eindeutige ID generieren
      const configId = `config-${configNumber}-${Date.now()}`;

      const newConfig = {
        ...configData,
        id: configId,
        configNumber,
        status: configData.status || ConfigStatus.DRAFT,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.uid || 'system'
      };

      const result = await ConfiguratorService.addConfiguration(newConfig as unknown as Configuration);
      return { success: true, configId: result.id as string, configNumber: configNumber as unknown as number };
    } catch (err) {
      console.error('Error creating configuration:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errorMessage };
    } finally {
      crud.setLoading(false);
    }
  }, [crud, user]);

  // Konfiguration aktualisieren
  const updateConfiguration = useCallback(async (
    configId: string,
    configData: Partial<Configuration>
  ): Promise<{ success: boolean; error?: string }> => {
    const existingConfig = configurations.find(c => c.id === configId);
    if (!existingConfig) {
      return { success: false, error: 'Konfiguration nicht gefunden' };
    }

    const updatedConfig: Partial<Configuration> = {
      ...configData,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.uid || 'system'
    };

    return crud.execute(() => ConfiguratorService.updateConfiguration(configId, updatedConfig));
  }, [crud, configurations, user]);

  // Konfiguration löschen
  const deleteConfiguration = useCallback(async (configId: string): Promise<{ success: boolean; error?: string }> => {
    return crud.execute(() => ConfiguratorService.deleteConfiguration(configId));
  }, [crud]);

  // Konfiguration duplizieren
  const duplicateConfiguration = useCallback(async (configId: string): Promise<{
    success: boolean;
    configId?: string;
    configNumber?: number;
    error?: string;
  }> => {
    const originalConfig = configurations.find(c => c.id === configId);
    if (!originalConfig) {
      return { success: false, error: 'Konfiguration nicht gefunden' };
    }

    const { id: _id, configNumber, createdAt: _createdAt, updatedAt: _updatedAt, status: _status, ...configData } = originalConfig;

    return createConfiguration({
      ...configData,
      name: `Kopie von ${originalConfig.name || configNumber}`,
      status: ConfigStatus.DRAFT
    });
  }, [configurations, createConfiguration]);

  // Status aktualisieren
  const updateConfigurationStatus = useCallback(async (
    configId: string,
    newStatus: ConfigurationStatus
  ): Promise<{ success: boolean; error?: string }> => {
    return updateConfiguration(configId, { status: newStatus });
  }, [updateConfiguration]);

  // Einzelne Konfiguration laden
  const getConfiguration = useCallback((configId: string): Configuration | undefined => {
    return configurations.find(c => c.id === configId);
  }, [configurations]);

  // Statistiken berechnen
  const getStatistics = useCallback((): ConfigurationStatistics => {
    const total = configurations.length;
    const byStatus = {
      draft: configurations.filter(c => c.status === ConfigStatus.DRAFT).length,
      completed: configurations.filter(c => c.status === ConfigStatus.COMPLETED).length,
      booked: configurations.filter(c => c.status === ConfigStatus.BOOKED).length
    };

    // Gesamte kWp berechnen
    const totalKwp = configurations.reduce((sum, c) => {
      const kwp = parseFloat(String(c.totals?.powerKwp || 0));
      return sum + (isNaN(kwp) ? 0 : kwp);
    }, 0);

    // Gesamte Module berechnen
    const totalModules = configurations.reduce((sum, c) => {
      const modules = parseInt(String(c.totals?.moduleCount || 0), 10);
      return sum + (isNaN(modules) ? 0 : modules);
    }, 0);

    return {
      total,
      byStatus,
      totalKwp: totalKwp.toFixed(2),
      totalModules
    };
  }, [configurations]);

  const value: ConfiguratorContextValue = {
    configurations,
    loading,
    error,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
    duplicateConfiguration,
    updateConfigurationStatus,
    getConfiguration,
    getStatistics
  };

  return (
    <ConfiguratorContext.Provider value={value}>
      {children}
    </ConfiguratorContext.Provider>
  );
};

export default ConfiguratorContext;
