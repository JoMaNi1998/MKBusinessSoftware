/**
 * Type Definitions für den ServiceCatalogContext
 *
 * Types für Service-Katalog, Service-Positionen,
 * Kategorien und Service-spezifische Berechnungen.
 */

import type { ServiceCatalogItem } from '../index';
import type { ServicePositionBreakdown, MaterialItem, LaborItem } from './calculation.types';

// ============================================
// SERVICE CATEGORIES
// ============================================

export interface ServiceCategoryConfig {
  id: string;
  label: string;
  icon: string;
  isDropdown?: boolean;
  description?: string;
  sortOrder?: number;
}

export const SERVICE_CATEGORIES: ServiceCategoryConfig[] = [
  { id: 'pv-montage', label: 'PV-Montage', icon: 'Sun', isDropdown: true },
  { id: 'wechselrichter', label: 'Wechselrichter', icon: 'Zap', isDropdown: true },
  { id: 'speicher', label: 'Speicher', icon: 'Battery', isDropdown: true },
  { id: 'wallbox', label: 'Wallbox', icon: 'Car', isDropdown: true },
  { id: 'notstrom', label: 'Notstrom', icon: 'Power', isDropdown: true },
  { id: 'optimierer', label: 'Optimierer', icon: 'Target', isDropdown: true },
  { id: 'energiemanagement', label: 'Energiemanagement', icon: 'Cpu', isDropdown: true },
  { id: 'elektroinstallation', label: 'Elektroinstallation', icon: 'Plug', isDropdown: true },
  { id: 'planung', label: 'Planung & Dokumentation', icon: 'FileText', isDropdown: true },
  { id: 'geruest', label: 'Gerüst & Logistik', icon: 'Truck', isDropdown: true },
  { id: 'erdungsanlage', label: 'Erdungsanlage', icon: 'Zap', isDropdown: true }
];

// ============================================
// SERVICE UNITS
// ============================================

export interface ServiceUnitConfig {
  id: string;
  label: string;
}

export const SERVICE_UNITS: ServiceUnitConfig[] = [
  { id: 'Stk', label: 'Stück' },
  { id: 'kWp', label: 'kWp' },
  { id: 'm', label: 'Meter' },
  { id: 'm²', label: 'Quadratmeter' },
  { id: 'Std', label: 'Stunde' },
  { id: 'Pausch', label: 'Pauschal' }
];

// ============================================
// EXTENDED SERVICE ITEM
// ============================================

export interface ExtendedServiceCatalogItem extends ServiceCatalogItem {
  // Erweiterte Felder für Berechnungen
  materials?: MaterialItem[];
  labor?: LaborItem[];
  calculatedPrices?: ServicePositionBreakdown;
  materialMarkup?: number;
  isDefaultPosition?: boolean;
  defaultQuantity?: number;
  shortText?: string;
  replaces?: string[];
  longText?: string;
  subItems?: Array<{ serviceId: string; quantity: number }>;
  isPackage?: boolean;
  [key: string]: unknown; // Allow additional properties
}

// ============================================
// SERVICE CATALOG CONTEXT VALUE
// ============================================

export interface ServiceCatalogContextValue {
  // State
  services: ExtendedServiceCatalogItem[];
  activeServices: ExtendedServiceCatalogItem[];
  defaultServices: ExtendedServiceCatalogItem[];
  loading: boolean;
  error: string | null;

  // CRUD Operations
  addService: (serviceData: Partial<ExtendedServiceCatalogItem>) => Promise<{ success: boolean; error?: string }>;
  updateService: (serviceId: string, serviceData: Partial<ExtendedServiceCatalogItem>) => Promise<{ success: boolean; error?: string }>;
  deleteService: (serviceId: string) => Promise<{ success: boolean; error?: string }>;
  duplicateService: (serviceId: string) => Promise<{ success: boolean; error?: string }>;

  // Price Recalculation
  recalculateAllPrices: () => Promise<{ success: boolean; error?: string }>;

  // Queries
  getServicesByCategory: () => Record<string, ExtendedServiceCatalogItem[]>;
  getServiceById: (serviceId: string) => ExtendedServiceCatalogItem | undefined;

  // Constants
  SERVICE_CATEGORIES: typeof SERVICE_CATEGORIES;
  SERVICE_UNITS: typeof SERVICE_UNITS;
}

// ============================================
// SERVICE STATISTICS
// ============================================

export interface ServiceStatistics {
  total: number;
  active: number;
  default: number;
  byCategory: Record<string, number>;
}

// ============================================
// SERVICE FILTERS
// ============================================

export interface ServiceFilters {
  category?: string;
  isActive?: boolean;
  isDefault?: boolean;
  searchTerm?: string;
}
