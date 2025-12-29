/**
 * Type Definitions für Material-Komponenten
 *
 * Zentrale Types für MaterialManagement und verwandte Komponenten.
 */

import type { Material, Category, Specification } from '../base.types';
import type { BookingType } from '../enums';

// ============================================
// MODAL TYPES
// ============================================

export type MaterialModalMode = 'view' | 'create' | 'edit';

export interface MaterialFormData {
  materialID: string;
  description: string;
  categoryId: string;
  type: string;
  manufacturer: string;
  stock: number | string;
  heatStock: number | string;
  unit: string;
  itemsPerUnit: number | string;
  orderQuantity: number | string;
  price: number | string;
  link: string;
  image: string;
  ean: string;
  excludeFromAutoOrder: boolean;
  specifications: Record<string, any>;
}

export interface MaterialFormErrors {
  [key: string]: string;
}

export interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: MaterialModalMode;
  material?: Material;
  onSave?: (material: Material) => void;
  onEdit?: (material: Material) => void;
  onDelete?: (materialId: string) => void;
}

// ============================================
// TABLE TYPES
// ============================================

export interface MaterialSortConfig {
  key: string | null;
  direction: 'asc' | 'desc';
}

export interface MaterialVisibleColumns {
  material?: boolean;
  category?: boolean;
  manufacturer?: boolean;
  stock?: boolean;
  price?: boolean;
  status?: boolean;
  ean?: boolean;
  link?: boolean;
  orderQuantity?: boolean;
  unit?: boolean;
  itemsPerUnit?: boolean;
  type?: boolean;
  [key: string]: boolean | undefined;
}

export interface MaterialColumnFilters {
  category: string;
  manufacturer: string;
  status: string;
}

export interface MaterialTableProps {
  materials: Material[];
  categories: Category[];
  visibleColumns: MaterialVisibleColumns;
  sortConfig: MaterialSortConfig;
  onSort: (key: string) => void;
  columnFilters: MaterialColumnFilters;
  onColumnFilterChange: (column: string, value: string) => void;
  uniqueCategories: string[];
  uniqueManufacturers: string[];
  uniqueStatuses: string[];
  onMaterialClick: (material: Material) => void;
  onEditMaterial: (material: Material) => void;
  onDeleteMaterial: (materialId: string) => void;
  editingPrice: string | null;
  tempPrice: string;
  onPriceEdit: (materialId: string, currentPrice: number | undefined) => void;
  onPriceChange: (value: string) => void;
  onPriceSave: (materialId: string) => void;
  onPriceCancel: () => void;
}

// ============================================
// CARDS TYPES
// ============================================

export interface MaterialCardsProps {
  materials: Material[];
  categories: Category[];
  visibleColumns: MaterialVisibleColumns;
  onMaterialClick: (material: Material) => void;
}

// ============================================
// COLUMN SETTINGS TYPES
// ============================================

export interface MaterialColumnConfig {
  key: string;
  label: string;
  required: boolean;
}

export interface ColumnSettingsProps {
  visibleColumns: MaterialVisibleColumns;
  availableColumns: MaterialColumnConfig[];
  loadingPreferences: boolean;
  onToggleColumn: (key: string) => void;
}

// ============================================
// STATS TYPES
// ============================================

export interface MaterialStatsProps {
  materials: Material[];
}

// ============================================
// HEADER TYPES
// ============================================

export interface MaterialHeaderProps {
  onAddMaterial: () => void;
  onOpenBooking: (type: BookingType) => void;
}

// ============================================
// SEARCH BAR TYPES
// ============================================

export interface MaterialSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenQRScanner: () => void;
  isMobile?: boolean;
}

// ============================================
// EMPTY STATE TYPES
// ============================================

export interface MaterialEmptyStateProps {
  searchTerm?: string;
  hasFilters: boolean;
  onClearFilters?: () => void;
  onAddMaterial?: () => void;
}

// ============================================
// CATEGORY SETTINGS TYPES
// ============================================

export interface CategorySpec {
  name: string;
  unit: string;
}

export interface SpecificationsMap {
  [categoryId: string]: Specification[];
}

// ============================================
// HOOK RETURN TYPES
// ============================================

export interface UseMaterialFiltersReturn {
  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;

  // Sort
  sortConfig: MaterialSortConfig;
  handleSort: (key: string) => void;

  // Filters
  columnFilters: MaterialColumnFilters;
  handleColumnFilterChange: (column: string, value: string) => void;
  resetFilters: () => void;

  // Data
  filteredMaterials: Material[];
  totalCount: number;
  filteredCount: number;

  // Filter Options
  uniqueCategories: string[];
  uniqueManufacturers: string[];
  uniqueStatuses: string[];
}

export interface UseColumnPreferencesReturn {
  visibleColumns: MaterialVisibleColumns;
  loadingPreferences: boolean;
  toggleColumn: (key: string) => void;
  availableColumns: MaterialColumnConfig[];
}

export interface UseCategoriesAndSpecsReturn {
  categories: Category[];
  specsByCategoryKey: Record<string, Specification[]>;
  loadingMeta: boolean;
  reload: () => Promise<void>;
  findCategoryById: (categoryId: string | undefined) => Category | undefined;
  getSpecsForCategory: (category: Category | undefined) => Specification[];
}
