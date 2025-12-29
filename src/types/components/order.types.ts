/**
 * Type Definitions für Order-Komponenten
 */

import type { Material } from '../index';

// ============================================
// ORDER MATERIAL DISPLAY
// ============================================

export type DisplayType = 'ordered' | 'additional' | 'needed' | 'low';

export interface OrderMaterialDisplay extends Material {
  _displayType: DisplayType;
  _displayQuantity: number;
  _isAdditionalOrder?: boolean;
}

// ============================================
// ORDER STATISTICS
// ============================================

export interface OrderStatistics {
  toOrderCount: number;
  orderedCount: number;
  excludedLowStockCount: number;
  totalCount: number;
}

// ============================================
// HOOKS
// ============================================

export interface UseOrderListReturn {
  orderList: OrderMaterialDisplay[];
  stats: OrderStatistics;
  excludedLowStockMaterials: Material[];
}

export interface ColumnConfig {
  key: string;
  label: string;
  required: boolean;
}

export interface VisibleColumns {
  [key: string]: boolean;
}

export interface UseOrderColumnPrefsReturn {
  visibleColumns: VisibleColumns;
  loading: boolean;
  toggleColumn: (columnKey: string) => void;
  availableColumns: ColumnConfig[];
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface OrderStatsProps {
  stats: OrderStatistics;
}

export interface OrderHeaderProps {
  toOrderCount: number;
  isLoading: boolean;
  onAddToList: () => void;
  onDirectOrder: () => void;
  onBulkOrder: () => void;
}

export interface OrderListHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  visibleColumns: VisibleColumns;
  toggleColumn: (columnKey: string) => void;
  availableColumns: ColumnConfig[];
}

export interface OrderTableProps {
  orderList: OrderMaterialDisplay[];
  visibleColumns: VisibleColumns;
  isLoading: boolean;
  columnFilters: { status: string };
  onColumnFilterChange: (column: string, value: string) => void;
  onOrder: (material: OrderMaterialDisplay, isAdditional: boolean) => void;
  onCancel: (materialId: string) => void;
}

export interface OrderCardsProps {
  orderList: OrderMaterialDisplay[];
  visibleColumns: VisibleColumns;
  isLoading: boolean;
  onOrder: (material: OrderMaterialDisplay, isAdditional: boolean) => void;
  onCancel: (materialId: string) => void;
}

export interface OrderEmptyStateProps {
  hasFilters: boolean;
}

export interface ExcludedMaterialsTableProps {
  materials: Material[];
  onInclude: (materialId: string) => void;
}

// ============================================
// MODAL PROPS
// ============================================

export interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  materials: Material[];
  isLoading: boolean;
  onAddToList: (materialId: string) => void;
  onOpenQRScanner: () => void;
}

export interface DirectOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  materials: Material[];
  isLoading: boolean;
  onDirectOrder: (materialId: string) => void;
  onOpenQRScanner: () => void;
}

export interface SingleOrderModalProps {
  isOpen: boolean;
  material: OrderMaterialDisplay | null;
  isAdditional: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (data: { qty: string; price: string; totalPrice: string; isAdditional: boolean }) => void;
}

export interface BulkOrderItem {
  material: OrderMaterialDisplay;
  qty: string;
  price: string;
  totalPrice: string;
}

export interface BulkOrderModalProps {
  isOpen: boolean;
  materials: OrderMaterialDisplay[];
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (items: BulkOrderItem[]) => void;
}
