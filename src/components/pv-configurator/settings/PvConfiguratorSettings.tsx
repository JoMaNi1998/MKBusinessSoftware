import React, { useState, useEffect, useRef } from 'react';
import { FirebaseService } from '@services/firebaseService';
import { useMaterials } from '@context/MaterialContext';
import DefaultComponentsSettings from './DefaultComponentsSettings';
import CalculationParamsSettings from './CalculationParamsSettings';

interface PVDefaults {
  [key: string]: any;
  // First page defaults (Module + Dachtyp only)
  defaultModule?: string;
  defaultRoofType?: string;
  // Second page defaults (all components)
  defaultPvMountingSystem?: string;
  defaultBefestigungPVMountingSystem?: string;
  defaultModulEndklemmen?: string;
  defaultModulMittelklemmen?: string;
  defaultPvSteckerMale?: string;
  defaultPvSteckerFemale?: string;
  defaultProfile?: string;
  defaultVerbinder?: string;
  defaultEndkappen?: string;
  defaultInverter?: string;
  defaultOptimizer?: string;
  defaultBattery?: string;
  defaultWallbox?: string;
  defaultEnergyManagement?: string;
  defaultSmartDongle?: string;
  defaultBackupBox?: string;
  // Default Material-IDs für Kabelschuhe
  defaultKabelschuh6M8?: string;
  defaultKabelschuh10M6?: string;
  defaultKabelschuh16M6?: string;
  // Default Material-IDs für Aderendhülsen
  defaultAderendhuelsen10mm2?: string;
  defaultAderendhuelsen16mm2?: string;
  // Default Material-IDs für Dübel
  defaultDuebelGeruestanker?: string;
  // Aufkleber Standardkomponenten
  defaultAufkleberPV?: string;
  defaultAufkleberPVMitSpeicher?: string;
  defaultAufkleberPVMitNotstrom?: string;
  // ErdungHES Standardkomponente
  defaultErdungHES?: string;
  // ErdungStaberder Standardkomponente
  defaultErdungStaberder?: string;
}

interface PvConfiguratorSettingsProps {
  onSavingChange?: (saving: boolean) => void;
}

const PvConfiguratorSettings: React.FC<PvConfiguratorSettingsProps> = ({ onSavingChange }) => {
  const { materials } = useMaterials();
  const [pvSubTab, setPvSubTab] = useState<'komponenten' | 'berechnung'>('komponenten');

  // PV Configurator Default Settings
  const [pvDefaults, setPvDefaults] = useState<PVDefaults>({
    // First page defaults (Module + Dachtyp only)
    defaultModule: 'Kein Standard',
    defaultRoofType: 'Kein Standard',
    // Second page defaults (all components)
    defaultPvMountingSystem: 'Kein Standard',
    defaultBefestigungPVMountingSystem: 'Kein Standard',
    defaultModulEndklemmen: 'Kein Standard',
    defaultModulMittelklemmen: 'Kein Standard',
    defaultPvSteckerMale: 'Kein Standard',
    defaultPvSteckerFemale: 'Kein Standard',
    defaultProfile: 'Kein Standard',
    defaultVerbinder: 'Kein Standard',
    defaultEndkappen: 'Kein Standard',
    defaultInverter: 'Kein Standard',
    defaultOptimizer: 'Kein Standard',
    defaultBattery: 'Kein Standard',
    defaultWallbox: 'Kein Standard',
    defaultEnergyManagement: 'Kein Standard',
    defaultSmartDongle: 'Kein Standard',
    defaultBackupBox: 'Kein Standard',
    // Default Material-IDs für Kabelschuhe
    defaultKabelschuh6M8: 'Kein Standard',
    defaultKabelschuh10M6: 'Kein Standard',
    defaultKabelschuh16M6: 'Kein Standard',
    // Default Material-IDs für Aderendhülsen
    defaultAderendhuelsen10mm2: 'Kein Standard',
    defaultAderendhuelsen16mm2: 'Kein Standard',
    // Default Material-IDs für Dübel
    defaultDuebelGeruestanker: 'Kein Standard',
    // Aufkleber Standardkomponenten
    defaultAufkleberPV: 'Kein Standard',
    defaultAufkleberPVMitSpeicher: 'Kein Standard',
    defaultAufkleberPVMitNotstrom: 'Kein Standard',
    // ErdungHES Standardkomponente
    defaultErdungHES: 'Kein Standard',
    // ErdungStaberder Standardkomponente
    defaultErdungStaberder: 'Kein Standard',
  });

  // Autosave für PV-Defaults
  const pvDefaultsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pvDefaultsLoadedRef = useRef<boolean>(false);
  const [pvDefaultsSaving, setPvDefaultsSaving] = useState<boolean>(false);

  // Notify parent about saving state changes
  useEffect(() => {
    if (onSavingChange) {
      onSavingChange(pvDefaultsSaving);
    }
  }, [pvDefaultsSaving, onSavingChange]);

  // PV Configurator Functions
  const loadPvDefaults = async (): Promise<void> => {
    try {
      const defaultsData = await FirebaseService.getDocuments('pv-defaults');
      if (defaultsData && defaultsData.length > 0) {
        setPvDefaults(defaultsData[0]);
      }
      // Markiere als geladen, damit Autosave aktiviert wird
      setTimeout(() => {
        pvDefaultsLoadedRef.current = true;
      }, 500);
    } catch (error) {
      console.error('Fehler beim Laden der PV-Standardeinstellungen:', error);
    }
  };

  const handlePvDefaultChange = (key: string, value: string | number | null): void => {
    setPvDefaults(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Load PV defaults from Firebase
  useEffect(() => {
    loadPvDefaults();
  }, []);

  // Autosave für PV-Defaults (2 Sekunden Verzögerung)
  useEffect(() => {
    // Nicht speichern wenn noch nicht geladen oder beim initialen Laden
    if (!pvDefaultsLoadedRef.current) return;

    // Vorherigen Timer abbrechen
    if (pvDefaultsTimerRef.current) {
      clearTimeout(pvDefaultsTimerRef.current);
    }

    // Neuen Timer setzen
    pvDefaultsTimerRef.current = setTimeout(async () => {
      try {
        setPvDefaultsSaving(true);
        const existingDefaults = await FirebaseService.getDocuments('pv-defaults');

        if (existingDefaults && existingDefaults.length > 0) {
          await FirebaseService.updateDocument('pv-defaults', existingDefaults[0].id, pvDefaults);
        } else {
          await FirebaseService.addDocument('pv-defaults', pvDefaults);
        }
      } catch (error) {
        console.error('Fehler beim Auto-Speichern der PV-Standardeinstellungen:', error);
      } finally {
        setPvDefaultsSaving(false);
      }
    }, 2000);

    // Cleanup bei Unmount
    return () => {
      if (pvDefaultsTimerRef.current) {
        clearTimeout(pvDefaultsTimerRef.current);
      }
    };
  }, [pvDefaults]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">PV Konfigurator Standardeinstellungen</h3>
        <p className="text-sm text-gray-600 mb-6">
          Definieren Sie Standardwerte für den PV Konfigurator. Diese werden beim Start des Konfigurators vorausgewählt.
        </p>

        {/* PV Configurator Sub-tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setPvSubTab('komponenten')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                pvSubTab === 'komponenten'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Standard Komponenten
            </button>
            <button
              onClick={() => setPvSubTab('berechnung')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                pvSubTab === 'berechnung'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Berechnung
            </button>
          </nav>
        </div>

        {/* Standard Komponenten Tab */}
        {pvSubTab === 'komponenten' && (
          <DefaultComponentsSettings
            pvDefaults={pvDefaults}
            handlePvDefaultChange={handlePvDefaultChange}
            materials={materials}
          />
        )}

        {/* Berechnung Tab */}
        {pvSubTab === 'berechnung' && (
          <CalculationParamsSettings
            pvDefaults={pvDefaults}
            handlePvDefaultChange={handlePvDefaultChange}
          />
        )}
      </div>
    </div>
  );
};

export default PvConfiguratorSettings;
