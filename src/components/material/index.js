// Main Component
export { default as MaterialManagement } from './MaterialManagement';

// Category Settings
export { default as CategorySettings } from './CategorySettings';

// Modals
export { MaterialModal, MaterialDetailModal, AddMaterialModal } from './modals';

// Components
export {
  MaterialStats,
  MaterialHeader,
  MaterialSearchBar,
  ColumnSettings,
  MaterialTable,
  MaterialCards,
  MaterialEmptyState
} from './components';

// Re-export Hooks from global (for backward compatibility)
export {
  useColumnPreferences,
  useMaterialFilters,
  useCategoriesAndSpecs,
  AVAILABLE_COLUMNS
} from '../../hooks';

// Re-export Utils from global (for backward compatibility)
export {
  getStockStatusColor,
  getStockStatusText,
  formatPrice,
  buildDescription,
  computeNextMaterialId
} from '../../utils';
