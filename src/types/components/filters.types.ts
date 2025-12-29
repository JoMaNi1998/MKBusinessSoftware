/**
 * Type Definitions für Filter und Table Komponenten
 *
 * Types für Filter-State, Column-Preferences, Sortierung,
 * Pagination und Table-spezifische Operationen.
 */

// ============================================
// FILTER STATE
// ============================================

export interface FilterState {
  searchTerm: string;
  dateRange?: DateRangeFilter;
  status?: string;
  category?: string;
  customFilters?: Record<string, unknown>;
}

export type DateRangeFilter = 'alle' | 'heute' | '7tage' | '30tage' | '90tage' | 'jahr' | 'custom';

export interface DateRangeOption {
  value: DateRangeFilter;
  label: string;
}

export interface CustomDateRange {
  from: string | Date;
  to: string | Date;
}

// ============================================
// SORT CONFIGURATION
// ============================================

export interface SortConfig {
  key: string | null;
  direction: 'asc' | 'desc';
}

export type SortDirection = 'asc' | 'desc';

// ============================================
// COLUMN PREFERENCES
// ============================================

export interface ColumnPreference {
  key: string;
  label: string;
  visible: boolean;
  required?: boolean;
  width?: number | string;
  sortable?: boolean;
  filterable?: boolean;
}

export interface VisibleColumns {
  [key: string]: boolean;
}

export interface ColumnConfig {
  key: string;
  label: string;
  required?: boolean;
  defaultVisible?: boolean;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, row: unknown) => React.ReactNode;
}

// ============================================
// TABLE PROPS
// ============================================

export interface TableColumn<T = unknown> {
  key: keyof T | string;
  label: string;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface TableProps<T = unknown> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  sortConfig?: SortConfig;
  onSort?: (key: string) => void;
  className?: string;
}

// ============================================
// PAGINATION
// ============================================

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
  showInfo?: boolean;
}

// ============================================
// SEARCH & FILTER PROPS
// ============================================

export interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
  debounceMs?: number;
  showQRScanner?: boolean;
  onQRScan?: () => void;
}

export interface FilterDropdownProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}

export interface DateRangeFilterProps {
  value: DateRangeFilter;
  onChange: (range: DateRangeFilter) => void;
  customRange?: CustomDateRange;
  onCustomRangeChange?: (range: CustomDateRange) => void;
}

// ============================================
// COLUMN SETTINGS PROPS
// ============================================

export interface ColumnSettingsProps {
  visibleColumns: VisibleColumns;
  availableColumns: ColumnConfig[];
  onToggleColumn: (columnKey: string) => void;
  loadingPreferences?: boolean;
  onResetColumns?: () => void;
}

// ============================================
// FILTER HOOKS
// ============================================

export interface UseFiltersReturn<T> {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredData: T[];
  sortConfig: SortConfig;
  handleSort: (key: string) => void;
  columnFilters: Record<string, string>;
  handleColumnFilterChange: (column: string, value: string) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

export interface UseColumnPreferencesReturn {
  visibleColumns: VisibleColumns;
  loadingPreferences: boolean;
  toggleColumn: (columnKey: string) => Promise<void>;
  resetColumns: () => void;
  availableColumns: ColumnConfig[];
}

export interface UsePaginationReturn {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  paginatedData: unknown[];
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: () => void;
  prevPage: () => void;
}

// ============================================
// STATS & CARDS
// ============================================

export interface StatCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export interface StatsGridProps {
  stats: Array<{
    key: string;
    title: string;
    value: number | string;
    icon?: React.ReactNode;
    color?: StatCardProps['color'];
  }>;
}
