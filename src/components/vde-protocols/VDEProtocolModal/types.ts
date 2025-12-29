import { ReactNode } from 'react';
import type { Project as GlobalProject, Customer as GlobalCustomer } from '@app-types';

// ============================================================================
// Firebase & Base Types
// ============================================================================

export interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
}

export type DateValue = Date | FirebaseTimestamp | string | null;

// ============================================================================
// Material & Specification Types
// ============================================================================

export interface MaterialSpecifications {
  [specId: string]: string | number | undefined;
}

export interface Material {
  id: string;
  type?: string;
  manufacturer?: string;
  description?: string;
  specifications?: MaterialSpecifications;
}

// ============================================================================
// Project Configuration Types
// ============================================================================

export interface StringConfig {
  stringName?: string;
  name?: string;
  moduleCount?: number;
}

export interface InverterConfig {
  materialID?: string;
  description?: string;
  manufacturer?: string;
  type?: string;
  quantity?: number;
  strings?: StringConfig[];
  recommendedCable?: string;
  recommendedBreaker?: string;
  recommendedRCD?: string;
}

export interface ModuleConfig {
  materialID?: string;
  description?: string;
  totalQuantity?: number;
}

export interface WallboxConfig {
  description?: string;
  quantity?: number;
  recommendedCable?: string;
  recommendedBreaker?: string;
  recommendedRCD?: string;
}

export interface ProjectConfiguration {
  id?: string;
  projectID?: string;
  modules?: ModuleConfig;
  inverters?: InverterConfig[];
  wallbox?: WallboxConfig;
  generatoranschlusskasten?: {
    materialID?: string;
  };
  pvCables?: {
    materialID?: string;
  };
  potentialausgleichHESUK?: {
    materialID?: string;
  };
  configurationVersion?: string;
  createdAt?: DateValue;
}

// ============================================================================
// VDE Data Types
// ============================================================================

export interface VDEStringData {
  id: number;
  name: string;
  moduleCount: number;
}

export interface VDEData {
  // Seite 1 - Anlagenübersicht
  address: string;
  customerName: string;
  projectName: string;
  contractorName: string;
  inspectorName: string;
  installedPower: string;
  moduleCount: string;
  moduleType: string;
  modulePmaxDC: string;
  moduleUoc: string;
  moduleIsc: string;
  moduleUmpp: string;
  inverterCount: string;
  inverterType: string;
  inverterManufacturer: string;
  inverterPmaxDC: string;
  inverterPnomAC: string;
  inverterPmaxAC: string;
  commissioningDate: string;
  testEquipment: string;
  initialTest: boolean;
  repeatTest: boolean;
  testDate: string;
  nextTestDate: string;
  noDefectsFound: boolean;
  compliesWithStandards: boolean;
  locationDate: string;
  inspectorSignature: string;

  // Seite 2 - Besichtigung 1
  entirePVSystem: boolean;
  followingCircuits: boolean;
  pvSystemInspected: boolean;
  dcSystemGeneral: boolean;
  dcComponentsRated: boolean;
  dcComponentsMaxRated: boolean;
  protectionClass2: boolean;
  pvCablesSelected: boolean;
  wiringSystemSelected: boolean;
  systemsWithoutOvercurrent: boolean;
  acDcCablesSeparated: boolean;
  systemsWithOvercurrent: boolean;
  dcDisconnectorInstalled: boolean;
  blockingDiodesInstalled: boolean;
  inverterSimpleSeparation: boolean;
  alternativeRcdTypeB: boolean;
  wiringLoopsMinimized: boolean;
  pvFrameEquipotential: boolean;
  equipotentialConductors: boolean;

  // Seite 3 - Besichtigung 2
  acSideDisconnection: boolean;
  switchingDevicesConnected: boolean;
  protectionSettingsProgrammed: boolean;
  allCircuitsLabeled: boolean;
  dcJunctionBoxesWarning: boolean;
  acMainSwitchLabeled: boolean;
  dualSupplyWarnings: boolean;
  schematicDiagramOnSite: boolean;
  protectionSettingsOnSite: boolean;
  emergencyShutdownProcedures: boolean;
  signsSecurelyAttached: boolean;
  ventilationBehindPV: boolean;
  framesCorrosionResistant: boolean;
  framesProperlySecured: boolean;
  cableRoutingWeatherproof: boolean;

  // Seite 4 - AC-Seite Prüfbericht
  testAccordingVDE0100600: boolean;
  testAccordingVDE0105100: boolean;
  networkVoltage1: number;
  networkVoltage2: number;
  networkTNC: boolean;
  networkTNS: boolean;
  networkTNCS: boolean;
  networkTT: boolean;
  networkIT: boolean;
  selectionOfEquipment: boolean;
  protectionAgainstDirectContact: boolean;
  cablesLinesbusbars: boolean;
  circuitIdentification: boolean;
  nPeIdentification: boolean;
  protectionMonitoringDevices: boolean;
  mainEquipotentialBonding: boolean;
  conductorConnections: boolean;
  isolatingDevices: boolean;
  systemFunctionTest: boolean;
  rcdTest: boolean;
  protectiveConductorContinuity: boolean;
  earthingResistance: string;
  measurementWithoutLoad: boolean;
  measurementWithLoad: boolean;

  // Seite 5 & Projektdaten
  projectConfig?: ProjectConfiguration;
  materials?: Material[];
  strings: VDEStringData[];

  // Dynamische Felder (Inverter, Strings, AC-Rows)
  [key: string]: unknown;
}

// ============================================================================
// Protocol Types
// ============================================================================

export type ProtocolStatus = 'Erstellt' | 'Geprüft' | 'Fehler' | 'Abgeschlossen';

export interface VDEProtocol {
  id: string;
  protocolNumber: string;
  customerName: string;
  customerID?: string;
  projectName: string;
  projectID?: string;
  address: string;
  vdeData: VDEData;
  power: number;
  moduleCount: number;
  stringCount: number;
  inverterModel: string;
  status: ProtocolStatus;
  createdDate: DateValue;
  updatedDate?: DateValue;
}

// ============================================================================
// Hook Types
// ============================================================================

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: string | null;
  direction: SortDirection;
}

export interface ColumnFilters {
  status: string;
  customer: string;
}

export interface VisibleColumns {
  protocolNumber: boolean;
  customerName: boolean;
  projectName: boolean;
  power: boolean;
  moduleCount: boolean;
  stringCount: boolean;
  inverterModel: boolean;
  createdDate: boolean;
  status?: boolean;
}

export interface ColumnConfig {
  key: keyof VisibleColumns;
  label: string;
  required: boolean;
}

export interface ProtocolStats {
  total: number;
  created: number;
  checked: number;
  completed: number;
}

export interface UseVDEProtocolsReturn {
  // State
  protocols: VDEProtocol[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortConfig: SortConfig;
  columnFilters: ColumnFilters;
  visibleColumns: VisibleColumns;
  loadingPreferences: boolean;

  // Configuration
  availableColumns: ColumnConfig[];

  // Derived data
  uniqueStatuses: string[];
  uniqueCustomers: string[];
  filteredProtocols: VDEProtocol[];
  sortedProtocols: VDEProtocol[];
  stats: ProtocolStats;

  // Actions
  loadProtocols: () => Promise<void>;
  handleSort: (key: string) => void;
  handleColumnFilterChange: (column: string, value: string) => void;
  toggleColumnVisibility: (column: keyof VisibleColumns) => Promise<void>;
  handleDeleteProtocol: (protocolId: string) => Promise<void>;
  saveEdit: (protocolId: string, field: string, value: unknown) => Promise<void>;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface CheckboxFieldProps {
  field: string;
  label: string;
  checked: boolean;
  onChange: (field: string, value: boolean) => void;
  small?: boolean;
}

export interface InputFieldProps {
  type?: 'text' | 'number' | 'date';
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  customerName?: string;
}

export interface SectionProps {
  title: string;
  children: ReactNode;
}

export interface PageProps {
  vdeData: VDEData;
  handleVdeDataChange: (field: string, value: unknown) => void;
}

export interface Page5SingleProps extends PageProps {
  inverterData: InverterConfig & {
    originalIndex: number;
    instanceIndex: number;
    globalIndex: number;
  };
  inverterIndex: number;
  stringNames?: string[];
  pageNumber?: number;
}

export interface VDEProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  protocol?: VDEProtocol | ProjectConfiguration | null;
  hideActions?: boolean;
}

export interface VDEProjectSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConfiguration: (data: ProjectSelectionResult) => void;
}

export interface ProjectSelectionResult {
  customer: Customer | undefined;
  project: Project | undefined;
  configuration: ProjectConfiguration | undefined;
  selectedProject: string;
  selectedCustomer: string;
}

// ============================================================================
// Context Types (external - use global types)
// ============================================================================

// Re-export global types for use in VDE components
export type Customer = GlobalCustomer;
export type Project = GlobalProject;

// ============================================================================
// Checkbox Config Types
// ============================================================================

export interface CheckboxConfig {
  field: string;
  label: string;
}

// ============================================================================
// AC Row Types
// ============================================================================

export interface ACRowDefaults {
  nr: string;
  designation: string;
  cableType: string;
  cableInfo: string;
  breakerType: string;
  breakerCurrent: string;
  rcdIn: string;
  rcdIdn: string;
}

// ============================================================================
// Row Config Types for Page 5
// ============================================================================

export interface GeneratorParamRow {
  label: string;
  field: string;
  spec: string;
}

export interface ProtectionRow {
  label: string;
  field: string;
  spec: string;
}

export interface MeasurementRow {
  label: string;
  field: string;
}

export interface InsulationRow {
  label: string;
  field: string;
}
