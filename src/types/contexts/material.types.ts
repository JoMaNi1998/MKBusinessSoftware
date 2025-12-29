/**
 * Type Definitions für den MaterialContext
 *
 * Types für Materialverwaltung, Lagerbestand, Stock-Status
 * und Material-spezifische Operationen.
 */

import type { Material } from '../index';
import { StockStatus } from '../enums';

// ============================================
// STOCK STATUS CONFIGURATION
// ============================================

export interface StockStatusConfig {
  label: string;
  color: 'green' | 'yellow' | 'red' | 'orange';
  icon: string;
}

export const STOCK_STATUS_CONFIG: Record<StockStatus, StockStatusConfig> = {
  [StockStatus.AVAILABLE]: {
    label: 'Auf Lager',
    color: 'green',
    icon: 'CheckCircle'
  },
  [StockStatus.LOW]: {
    label: 'Niedrig',
    color: 'yellow',
    icon: 'AlertTriangle'
  },
  [StockStatus.OUT_OF_STOCK]: {
    label: 'Nicht verfügbar',
    color: 'red',
    icon: 'XCircle'
  },
  [StockStatus.TO_ORDER]: {
    label: 'Nachbestellen',
    color: 'orange',
    icon: 'ShoppingCart'
  }
};

// ============================================
// EXTENDED MATERIAL
// ============================================

export interface ExtendedMaterial extends Material {
  stockState?: StockStatus;
}

// ============================================
// MATERIAL CONTEXT VALUE
// ============================================

export interface MaterialContextValue {
  // State
  materials: ExtendedMaterial[];
  loading: boolean;
  error: string | null;

  // CRUD Operations
  addMaterial: (materialData: Partial<ExtendedMaterial>) => Promise<void>;
  updateMaterial: (materialData: ExtendedMaterial) => Promise<void>;
  deleteMaterial: (materialId: string) => Promise<void>;

  // Stock Management
  updateStock: (materialId: string, newStock: number, heatStock?: number) => Promise<void>;
  updateMaterialStock: (materialId: string, stockChange: number) => Promise<void>;  // Delta-basiert für Buchungen
}

// ============================================
// MATERIAL STATISTICS
// ============================================

export interface MaterialStatistics {
  total: number;
  available: number;
  low: number;
  outOfStock: number;
  toOrder: number;
  totalValue: number;
}

// ============================================
// MATERIAL FILTERS
// ============================================

export interface MaterialFilters {
  category?: string;
  manufacturer?: string;
  stockStatus?: StockStatus | 'all';
  searchTerm?: string;
}
