/**
 * Type Definitions für PV-Configurator Komponenten
 *
 * Zentrale Types für den PV-Konfigurator und verwandte Komponenten.
 */

import type { Dispatch, SetStateAction } from 'react';
import type { Material } from '../index';

// ============================================
// ROOF TYPES
// ============================================

export interface PVRoofType {
  value: string;
  emoji: string;
  desc: string;
}

// ============================================
// WIZARD STEP TYPES
// ============================================

export interface PVWizardStep {
  id: number;
  title: string;
  key: string;
}

// ============================================
// MODULE/LAYOUT TYPES
// ============================================

export interface PVModuleRow {
  modules: number;
}

export interface PVLayoutTotals {
  totalModules: number;
  totalRows: number;
  qCount: number;
  hCount: number;
  qRows?: number;
  hRows?: number;
}

// ============================================
// INVERTER TYPES
// ============================================

export interface PVInverterString {
  name: string;
  modules: number;
}

export interface PVInverterConfig {
  type: string;
  quantity: number;
  strings: PVInverterString[];
}

// ============================================
// CONFIGURATION TYPES
// ============================================

export interface PVConfiguration {
  // Seite 1: Module & Layout
  module: string;
  roofType: string;
  querformatRows: PVModuleRow[];
  hochformatRows: PVModuleRow[];

  // Seite 2: Montage
  pvMountingSystem: string;
  befestigungPVMountingSystem: string;
  modulEndklemmen: string;
  modulMittelklemmen: string;
  pvSteckerMale: string;
  pvSteckerFemale: string;
  profile: string;
  verbinder: string;
  endkappen: string;

  // Seite 3: Wechselrichter
  inverters: PVInverterConfig[];

  // Seite 4: Zusätzliche Komponenten
  optimizer: string;
  optimizerQty: number;
  battery: string;
  batteryQty: number;
  wallbox: string;
  wallboxQty: number;
  energiemanagement: string;
  energiemanagementQty: number;
  notstromloesungen: string;
  notstromloesungenQty: number;

  // Seite 5: Elektrisch
  sls: string;
  slsQty: number;
  tiefenerder: string;
  tiefenerderQty: number;
  kombiableiter: string;
  kombiableiterQty: number;
  zaehlerschrank: string;
  zaehlerschrankQty: number;
  generatoranschlusskasten: string;
  generatoranschlusskastenQty: number;
  spannungsversorgungAPZ: string;
  spannungsversorgungAPZQty: number;

  // Smart Dongle
  smartDongle: string;
  smartDongleQty: number;
}

// ============================================
// BOM TYPES
// ============================================

export interface PVBOMItem {
  materialID: string;
  quantity: number;
  description: string;
  category: string;
  isConfigured?: boolean;
  isManual?: boolean;
}

// ============================================
// RECOMMENDATIONS TYPES
// ============================================

export interface PVRecommendations {
  inverterBreaker: string | null;
  inverterCable: string | null;
  wallboxBreaker: string | null;
  wallboxCable: string | null;
  wallboxRCD: string | null;
  backupBreaker: string | null;
  backupCable: string | null;
}

export interface PVOverrideRecommendations {
  inverterBreaker?: string;
  inverterCable?: string;
  wallboxBreaker?: string;
  wallboxCable?: string;
  wallboxRCD?: string;
  backupBreaker?: string;
  backupCable?: string;
}

export interface PVChosenRecommendations {
  inverterBreaker?: string;
  inverterCable?: string;
  wallboxBreaker?: string;
  wallboxCable?: string;
  wallboxRCD?: string;
  backupBreaker?: string;
  backupCable?: string;
}

// ============================================
// CABLE TABLE TYPES
// ============================================

export interface PVCableTableEntry {
  mm2: number;
  maxA: number;
  breaker: number;
}

// ============================================
// DEFAULTS TYPES
// ============================================

export interface PVDefaults {
  [key: string]: any;
  modulHakenVerhaeltnis?: number | null;
  defaultCableLength?: number;
  strombelastbarkeit15?: number;
  strombelastbarkeit25?: number;
  strombelastbarkeit4?: number;
  strombelastbarkeit6?: number;
  strombelastbarkeit10?: number;
  strombelastbarkeit16?: number;
  defaultModule?: string;
  defaultRoofType?: string;
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
}

export interface PVDefaultConfiguration {
  module: string;
  roofType: string;
  pvMountingSystem: string;
  befestigungPVMountingSystem: string;
  modulEndklemmen: string;
  modulMittelklemmen: string;
  pvSteckerMale: string;
  pvSteckerFemale: string;
  profile: string;
  verbinder: string;
  endkappen: string;
  defaultInverter: string;
}

// ============================================
// HOOK RETURN TYPES
// ============================================

export interface UsePVDefaultsReturn {
  isLoading: boolean;
  error: string | null;
  pvDefaults: PVDefaults;
  getDefaultConfiguration: () => PVDefaultConfiguration;
  modulHakenVerhaeltnis: number | null;
  defaultCableLength: number;
  [key: string]: any;
}

export interface UseBOMCalculationParams {
  configuration: PVConfiguration;
  layoutTotals: PVLayoutTotals;
  materials: Material[];
  materialsById: Map<string, Material>;
  chosen: PVChosenRecommendations;
  defaults: PVDefaults;
}

export interface UseBOMCalculationReturn {
  bom: PVBOMItem[];
  warnings: string[];
}

export interface UseRecommendationsParams {
  configuration: PVConfiguration;
  materialsById: Map<string, Material>;
  pvDefaults: PVDefaults;
}

export interface UseRecommendationsReturn {
  recommendations: PVRecommendations;
  chosen: PVRecommendations;
  overrideRec: PVOverrideRecommendations;
  setOverrideRec: Dispatch<SetStateAction<PVOverrideRecommendations>>;
}

// ============================================
// CONFIGURATOR MANAGEMENT TYPES
// ============================================

export interface PVColumnConfig {
  key: string;
  label: string;
  alwaysVisible?: boolean;
}

export interface PVVisibleColumns {
  [key: string]: boolean;
}

export interface PVConfigurationStatus {
  value: string;
  label: string;
  color: string;
}

export interface PVBookingMaterial {
  materialID: string;
  quantity: number;
  description?: string;
  priceAtBooking?: number;
  totalCost?: number;
}

export interface PVBookingData {
  id: string;
  customerID: string;
  customerName: string;
  projectID: string;
  projectName: string;
  type: string;
  timestamp: Date;
  materials: PVBookingMaterial[];
  notes: string;
}

// ============================================
// SELECT OPTION TYPES
// ============================================

export interface PVSelectOption {
  value: string;
  label: string;
}

// ============================================
// SAVED CONFIGURATION TYPES
// ============================================

export interface PVSavedConfiguration {
  id: string;
  projectID?: string;
  customerID?: string;
  customerName?: string;
  projectName?: string;
  status?: string;
  pvConfiguration?: {
    configurationVersion?: string;
    [key: string]: any;
  };
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}
