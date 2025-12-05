import React, { createContext, useContext, useState, useEffect } from 'react';
import { MaterialService } from '../services/firebaseService';

const MaterialContext = createContext();

export const useMaterials = () => {
  const context = useContext(MaterialContext);
  if (!context) {
    throw new Error('useMaterials must be used within a MaterialProvider');
  }
  return context;
};

export const MaterialProvider = ({ children }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Firebase Real-time Listener
  useEffect(() => {
    let unsubscribe;
    
    const setupListener = async () => {
      try {
        setLoading(true);
        unsubscribe = MaterialService.subscribeToMaterials((materialsData) => {
          setMaterials(materialsData);
          setLoading(false);
        });
      } catch (err) {
        console.error('Error setting up materials listener:', err);
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

  // Beispieldaten basierend auf Ihren Excel-Tabellen
  const sampleMaterials = [
    {
      id: 'Mod-TrinaVertexS+DoppelglasTSM-NEG9R.28/450Wp-TSM',
      materialID: 'Mod-TrinaVertexS+DoppelglasTSM-NEG9R.28/450Wp-TSM',
      category: 'Module',
      description: 'Trina Vertex S+ Doppelglas TSM-NEG9R.28/450Wp',
      type: 'TSM-NEG9R.28',
      manufacturer: 'Trina Solar',
      stock: 500,
      heatStock: 200,
      stockState: 'Auf Lager',
      itemsPerUnit: 60,
      orderQuantity: 0,
      orderUnits: 0,
      link: 'https://www.trinasolar.com',
      image: '',
      specifications: {
        power: '450W',
        voltage: '52.9V',
        current: '10.7A',
        dimensions: '2384x1096x35mm',
        weight: '25.5kg'
      }
    },
    {
      id: 'Wec-HuaweiSUN2000-5KTL-M1-5KT',
      materialID: 'Wec-HuaweiSUN2000-5KTL-M1-5KT',
      category: 'Wechselrichter',
      description: 'Huawei SUN2000-5KTL-M1',
      type: '5KTL-M1_1',
      manufacturer: 'Huawei',
      stock: 60,
      heatStock: 200,
      stockState: 'Auf Lager',
      itemsPerUnit: 60,
      orderQuantity: 0,
      orderUnits: 0,
      link: 'https://www.huawei.com',
      image: '',
      specifications: {
        maxDCPower: '6500W',
        maxACPower: '5000W',
        efficiency: '98.4%',
        mpptInputs: '2',
        dimensions: '365x365x156mm'
      }
    },
    {
      id: 'Ade-H07V-K1x10Blau-H07',
      materialID: 'Ade-H07V-K1x10Blau-H07',
      category: 'Adernleitung',
      description: 'H07V-K 1x10 Blau',
      type: 'H07V-K',
      manufacturer: 'Standard',
      stock: 500,
      heatStock: 200,
      stockState: 'Auf Lager',
      itemsPerUnit: 60,
      orderQuantity: 0,
      orderUnits: 0,
      link: '',
      image: '',
      specifications: {
        crossSection: '10mm²',
        color: 'Blau',
        voltage: '450/750V',
        temperature: '-5°C bis +70°C'
      }
    },
    {
      id: 'Bac-HuaweiBackupBox-B0-Bac',
      materialID: 'Bac-HuaweiBackupBox-B0-Bac',
      category: 'Backupbox',
      description: 'Huawei Backup Box B0',
      type: 'Backup Box B0',
      manufacturer: 'Huawei',
      stock: 25,
      heatStock: 50,
      stockState: 'Niedrig',
      itemsPerUnit: 1,
      orderQuantity: 10,
      orderUnits: 1,
      link: 'https://www.huawei.com',
      image: '',
      specifications: {
        capacity: '5kWh',
        voltage: '400V',
        efficiency: '95%'
      }
    },
    {
      id: 'Ene-HuaweiEMMA-A02-EMM',
      materialID: 'Ene-HuaweiEMMA-A02-EMM',
      category: 'Energiemanagement',
      description: 'Huawei EMMA A02',
      type: 'EMMA A02',
      manufacturer: 'Huawei',
      stock: 15,
      heatStock: 30,
      stockState: 'Niedrig',
      itemsPerUnit: 1,
      orderQuantity: 20,
      orderUnits: 1,
      link: 'https://www.huawei.com',
      image: '',
      specifications: {
        maxCurrent: '63A',
        phases: '3',
        communication: 'RS485'
      }
    }
  ];

  // Sample-Daten-Initialisierung ENTFERNT - nur noch echte Firebase-Daten
  // useEffect(() => {
  //   const initializeSampleData = async () => {
  //     if (!loading && materials.length === 0 && !error) {
  //       try {
  //         console.log('Initializing sample data...');
  //         for (const material of sampleMaterials) {
  //           await MaterialService.addMaterial(material);
  //         }
  //       } catch (err) {
  //         console.error('Error initializing sample data:', err);
  //       }
  //     }
  //   };
  //
  //   initializeSampleData();
  // }, [loading, materials.length, error]);

  const addMaterial = async (materialData) => {
    try {
      setLoading(true);
      await MaterialService.addMaterial(materialData);
      // Real-time listener wird automatisch die UI aktualisieren
    } catch (err) {
      console.error('Error adding material:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateMaterial = async (materialData) => {
    try {
      setLoading(true);
      await MaterialService.updateMaterial(materialData.id, materialData);
      // Real-time listener wird automatisch die UI aktualisieren
    } catch (err) {
      console.error('Error updating material:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteMaterial = async (materialId) => {
    try {
      setLoading(true);
      await MaterialService.deleteMaterial(materialId);
      // Real-time listener wird automatisch die UI aktualisieren
    } catch (err) {
      console.error('Error deleting material:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (materialId, change) => {
    try {
      const material = materials.find(m => m.id === materialId);
      if (!material) return;

      const newStock = material.stock + change;
      // Negativer Bestand = Nachbestellen, 0 = Nicht verfügbar, niedrig (≤ heatStock) oder auf Lager
      const stockState = newStock < 0 ? 'Nachbestellen' :
                        newStock === 0 ? 'Nicht verfügbar' :
                        newStock <= material.heatStock ? 'Niedrig' : 'Auf Lager';

      await MaterialService.updateMaterial(materialId, {
        ...material,
        stock: newStock,
        stockState
      });
      // Real-time listener wird automatisch die UI aktualisieren
    } catch (err) {
      console.error('Error updating stock:', err);
      setError(err.message);
    }
  };

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
    updateMaterialStock: updateStock // Alias für Kompatibilität
  };

  return (
    <MaterialContext.Provider value={value}>
      {children}
    </MaterialContext.Provider>
  );
};
