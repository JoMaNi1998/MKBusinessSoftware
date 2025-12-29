/**
 * Type Definitions für den ConfiguratorContext
 *
 * Types für PV-Anlagen Konfigurator, Konfigurationsverwaltung
 * und Configurator-spezifische Operationen.
 */

// ============================================
// CONFIGURATION STATUS
// ============================================

export enum ConfigurationStatus {
  DRAFT = 'draft',
  COMPLETED = 'completed',
  BOOKED = 'booked'
}

export interface ConfigurationStatusConfig {
  label: string;
  color: 'gray' | 'blue' | 'green';
}

export const CONFIG_STATUS_LABELS: Record<ConfigurationStatus, ConfigurationStatusConfig> = {
  [ConfigurationStatus.DRAFT]: { label: 'Entwurf', color: 'gray' },
  [ConfigurationStatus.COMPLETED]: { label: 'Abgeschlossen', color: 'blue' },
  [ConfigurationStatus.BOOKED]: { label: 'Gebucht', color: 'green' }
};

// ============================================
// CONFIGURATION TOTALS
// ============================================

export interface ConfigurationTotals {
  powerKwp?: number;
  moduleCount?: number;
  totalNet?: number;
  totalGross?: number;
  batteryKwh?: number;
  inverterCount?: number;
  stringCount?: number;
}

// ============================================
// INVERTER CONFIGURATION
// ============================================

export interface InverterString {
  name: string;
  modules: number;
}

export interface InverterConfig {
  type?: string;
  quantity?: number;
  strings?: InverterString[];
}

// ============================================
// PV CONFIGURATION DETAILS
// ============================================

export interface ConfigurationDetails {
  module?: string;
  inverters?: InverterConfig[];
  wallbox?: string;
  wallboxQty?: number;
  notstromloesungen?: string;
  notstromloesungenQty?: number;
  speicher?: string;
  speicherQty?: number;
  optimierer?: string;
  optimiererQty?: number;
  energiemanagement?: string;
  energiemanagementQty?: number;
  [key: string]: unknown;
}

// ============================================
// CONFIGURATOR BOM ITEM
// ============================================

// Lokale BOM-Item Struktur für den Konfigurator
// (unterscheidet sich von components/bom.types.ts BOMItem)
export interface ConfiguratorBOMItem {
  materialId: string;
  name?: string;
  articleNumber?: string;
  category?: string;
  quantity: number;
  unit?: string;
  isConfigured?: boolean;
  isManual?: boolean;
  unitPrice?: number;
  totalPrice?: number;
  [key: string]: unknown;
}

// ============================================
// CONFIGURATION
// ============================================

export interface Configuration {
  id: string;
  configNumber: number;
  name?: string;
  customerID?: string;
  customerName?: string;
  projectID?: string;
  status: ConfigurationStatus;
  totals?: ConfigurationTotals;
  configuration?: ConfigurationDetails;
  billOfMaterials?: ConfiguratorBOMItem[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  [key: string]: unknown; // Allow additional properties
}

// ============================================
// CONFIGURATION STATISTICS
// ============================================

export interface ConfigurationStatistics {
  total: number;
  byStatus: {
    draft: number;
    completed: number;
    booked: number;
  };
  totalKwp: string;
  totalModules: number;
}

// ============================================
// CONFIGURATOR CONTEXT VALUE
// ============================================

export interface ConfiguratorContextValue {
  // State
  configurations: Configuration[];
  loading: boolean;
  error: string | null;

  // CRUD Operations
  createConfiguration: (configData: Partial<Configuration>) => Promise<{
    success: boolean;
    configId?: string;
    configNumber?: number;
    error?: string;
  }>;
  updateConfiguration: (configId: string, configData: Partial<Configuration>) => Promise<{
    success: boolean;
    error?: string;
  }>;
  deleteConfiguration: (configId: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  duplicateConfiguration: (configId: string) => Promise<{
    success: boolean;
    configId?: string;
    configNumber?: number;
    error?: string;
  }>;

  // Status Management
  updateConfigurationStatus: (configId: string, newStatus: ConfigurationStatus) => Promise<{
    success: boolean;
    error?: string;
  }>;

  // Queries
  getConfiguration: (configId: string) => Configuration | undefined;
  getStatistics: () => ConfigurationStatistics;
}
