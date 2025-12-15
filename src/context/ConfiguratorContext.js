import React, { createContext, useContext, useCallback } from 'react';
import { ConfiguratorService } from '../services/firebaseService';
import { useAuth } from './AuthContext';
import { useFirebaseListener, useFirebaseCRUD } from '../hooks';

const ConfiguratorContext = createContext();

export const useConfigurations = () => {
  const context = useContext(ConfiguratorContext);
  if (!context) {
    throw new Error('useConfigurations must be used within a ConfiguratorProvider');
  }
  return context;
};

// Status-Optionen für Konfigurationen
export const CONFIG_STATUS = {
  DRAFT: 'draft',
  COMPLETED: 'completed',
  BOOKED: 'booked'
};

export const CONFIG_STATUS_LABELS = {
  draft: { label: 'Entwurf', color: 'gray' },
  completed: { label: 'Abgeschlossen', color: 'blue' },
  booked: { label: 'Gebucht', color: 'green' }
};

export const ConfiguratorProvider = ({ children }) => {
  // Firebase Real-time Listener mit Custom Hook
  const {
    data: configurations,
    loading: listenerLoading,
    error: listenerError
  } = useFirebaseListener(ConfiguratorService.subscribeToConfigurations);

  // CRUD Operations Hook
  const crud = useFirebaseCRUD();

  // Kombinierter Loading-State
  const loading = listenerLoading || crud.loading;
  const error = listenerError || crud.error;

  const { user } = useAuth();

  // Neue Konfiguration erstellen
  const createConfiguration = useCallback(async (configData) => {
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
        status: configData.status || CONFIG_STATUS.DRAFT,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.uid || 'system'
      };

      const result = await ConfiguratorService.addConfiguration(newConfig);
      return { success: true, configId: result.id, configNumber };
    } catch (err) {
      console.error('Error creating configuration:', err);
      return { success: false, error: err.message };
    } finally {
      crud.setLoading(false);
    }
  }, [crud, user]);

  // Konfiguration aktualisieren
  const updateConfiguration = useCallback(async (configId, configData) => {
    const existingConfig = configurations.find(c => c.id === configId);
    if (!existingConfig) {
      return { success: false, error: 'Konfiguration nicht gefunden' };
    }

    const updatedConfig = {
      ...configData,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.uid || 'system'
    };

    return crud.execute(ConfiguratorService.updateConfiguration, configId, updatedConfig);
  }, [crud, configurations, user]);

  // Konfiguration löschen
  const deleteConfiguration = useCallback(async (configId) => {
    return crud.execute(ConfiguratorService.deleteConfiguration, configId);
  }, [crud]);

  // Konfiguration duplizieren
  const duplicateConfiguration = useCallback(async (configId) => {
    const originalConfig = configurations.find(c => c.id === configId);
    if (!originalConfig) {
      return { success: false, error: 'Konfiguration nicht gefunden' };
    }

    const { id, configNumber, createdAt, updatedAt, status, ...configData } = originalConfig;

    return createConfiguration({
      ...configData,
      name: `Kopie von ${originalConfig.name || configNumber}`,
      status: CONFIG_STATUS.DRAFT
    });
  }, [configurations, createConfiguration]);

  // Status aktualisieren
  const updateConfigurationStatus = useCallback(async (configId, newStatus) => {
    return updateConfiguration(configId, { status: newStatus });
  }, [updateConfiguration]);

  // Einzelne Konfiguration laden
  const getConfiguration = useCallback((configId) => {
    return configurations.find(c => c.id === configId);
  }, [configurations]);

  // Statistiken berechnen
  const getStatistics = useCallback(() => {
    const total = configurations.length;
    const byStatus = {
      draft: configurations.filter(c => c.status === CONFIG_STATUS.DRAFT).length,
      completed: configurations.filter(c => c.status === CONFIG_STATUS.COMPLETED).length,
      booked: configurations.filter(c => c.status === CONFIG_STATUS.BOOKED).length
    };

    // Gesamte kWp berechnen
    const totalKwp = configurations.reduce((sum, c) => {
      const kwp = parseFloat(c.totals?.powerKwp || 0);
      return sum + (isNaN(kwp) ? 0 : kwp);
    }, 0);

    // Gesamte Module berechnen
    const totalModules = configurations.reduce((sum, c) => {
      const modules = parseInt(c.totals?.moduleCount || 0, 10);
      return sum + (isNaN(modules) ? 0 : modules);
    }, 0);

    return {
      total,
      byStatus,
      totalKwp: totalKwp.toFixed(2),
      totalModules
    };
  }, [configurations]);

  const value = {
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
