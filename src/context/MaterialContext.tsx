import React, { createContext, useContext, useCallback } from 'react';
import { MaterialService } from '../services/firebaseService';
import { useAuth } from './AuthContext';
import { useFirebaseListener, useFirebaseCRUD } from '../hooks';
import type { MaterialContextValue, ExtendedMaterial } from '../types/contexts/material.types';
import type { Material } from '../types';
import { StockStatus } from '../types/enums';

const MaterialContext = createContext<MaterialContextValue | undefined>(undefined);

export const useMaterials = (): MaterialContextValue => {
  const context = useContext(MaterialContext);
  if (!context) {
    throw new Error('useMaterials must be used within a MaterialProvider');
  }
  return context;
};

interface MaterialProviderProps {
  children: React.ReactNode;
}

export const MaterialProvider: React.FC<MaterialProviderProps> = ({ children }) => {
  const { user } = useAuth();

  // Firebase Real-time Listener mit Custom Hook
  // Nur laden wenn User eingeloggt ist
  const {
    data: materials,
    loading: listenerLoading,
    error: listenerError
  } = useFirebaseListener<Material>(MaterialService.subscribeToMaterials, {
    enabled: !!user
  });

  // CRUD Operations Hook
  const crud = useFirebaseCRUD();

  // Kombinierter Loading-State
  const loading = listenerLoading || crud.loading;
  const error = listenerError || crud.error;

  // CRUD Operationen mit konsistenter Rückgabe
  const addMaterial = useCallback(async (materialData: Partial<ExtendedMaterial>): Promise<void> => {
    await crud.execute(MaterialService.addMaterial, materialData);
  }, [crud]);

  const updateMaterial = useCallback(async (materialData: ExtendedMaterial): Promise<void> => {
    const { id, ...data } = materialData;
    await crud.execute(() => MaterialService.updateMaterial(id, data as Material));
  }, [crud]);

  const deleteMaterial = useCallback(async (materialId: string): Promise<void> => {
    await crud.execute(() => MaterialService.deleteMaterial(materialId));
  }, [crud]);

  // Update Stock mit absolutem Wert
  const updateStock = useCallback(async (
    materialId: string,
    newStock: number,
    heatStock?: number
  ): Promise<void> => {
    const material = materials.find(m => m.id === materialId);
    if (!material) {
      throw new Error('Material nicht gefunden');
    }

    // Berechne neuen Stock Status
    const effectiveHeatStock = heatStock ?? material.heatStock ?? material.mindestbestand ?? 0;
    const stockState = newStock < 0 ? StockStatus.TO_ORDER :
                      newStock === 0 ? StockStatus.OUT_OF_STOCK :
                      newStock <= effectiveHeatStock ? StockStatus.LOW : StockStatus.AVAILABLE;

    await crud.execute(() => MaterialService.updateMaterial(materialId, {
      ...material,
      stock: newStock,
      stockState
    }));
  }, [crud, materials]);

  // Update Stock mit Delta (Änderung) - für Buchungen
  // stockChange: positiv = Eingang, negativ = Ausgang
  const updateMaterialStock = useCallback(async (
    materialId: string,
    stockChange: number
  ): Promise<void> => {
    const material = materials.find(m => m.id === materialId);
    if (!material) {
      throw new Error('Material nicht gefunden');
    }

    const currentStock = material.stock ?? 0;
    const newStock = currentStock + stockChange;

    // Berechne neuen Stock Status
    const effectiveHeatStock = material.heatStock ?? material.mindestbestand ?? 0;
    const stockState = newStock < 0 ? StockStatus.TO_ORDER :
                      newStock === 0 ? StockStatus.OUT_OF_STOCK :
                      newStock <= effectiveHeatStock ? StockStatus.LOW : StockStatus.AVAILABLE;

    await crud.execute(() => MaterialService.updateMaterial(materialId, {
      ...material,
      stock: newStock,
      stockState
    }));
  }, [crud, materials]);

  const value: MaterialContextValue = {
    materials: materials as ExtendedMaterial[],
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
