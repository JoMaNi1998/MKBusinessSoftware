import React, { createContext, useContext, useCallback } from 'react';
import { MaterialService } from '../services/firebaseService';
import { useFirebaseListener, useFirebaseCRUD } from '../hooks';

const MaterialContext = createContext();

export const useMaterials = () => {
  const context = useContext(MaterialContext);
  if (!context) {
    throw new Error('useMaterials must be used within a MaterialProvider');
  }
  return context;
};

export const MaterialProvider = ({ children }) => {
  // Firebase Real-time Listener mit Custom Hook
  const {
    data: materials,
    loading: listenerLoading,
    error: listenerError
  } = useFirebaseListener(MaterialService.subscribeToMaterials);

  // CRUD Operations Hook
  const crud = useFirebaseCRUD();

  // Kombinierter Loading-State
  const loading = listenerLoading || crud.loading;
  const error = listenerError || crud.error;

  // CRUD Operationen mit konsistenter Rückgabe
  const addMaterial = useCallback(async (materialData) => {
    return crud.execute(MaterialService.addMaterial, materialData);
  }, [crud]);

  const updateMaterial = useCallback(async (materialData) => {
    return crud.execute(MaterialService.updateMaterial, materialData.id, materialData);
  }, [crud]);

  const deleteMaterial = useCallback(async (materialId) => {
    return crud.execute(MaterialService.deleteMaterial, materialId);
  }, [crud]);

  const updateStock = useCallback(async (materialId, change) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) {
      return { success: false, error: 'Material nicht gefunden' };
    }

    const newStock = material.stock + change;
    // Negativer Bestand = Nachbestellen, 0 = Nicht verfügbar, niedrig (≤ heatStock) oder auf Lager
    const stockState = newStock < 0 ? 'Nachbestellen' :
                      newStock === 0 ? 'Nicht verfügbar' :
                      newStock <= material.heatStock ? 'Niedrig' : 'Auf Lager';

    return crud.execute(MaterialService.updateMaterial, materialId, {
      ...material,
      stock: newStock,
      stockState
    });
  }, [crud, materials]);

  // Alias für updateStock für Kompatibilität mit BookingModal
  const updateMaterialStock = updateStock;

  const value = {
    materials,
    loading,
    error,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    updateStock,
    updateMaterialStock
  };

  return (
    <MaterialContext.Provider value={value}>
      {children}
    </MaterialContext.Provider>
  );
};
