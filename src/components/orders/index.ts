// Main Component
export { default as OrderManagement } from './OrderManagement';

// Components
export {
  OrderStats,
  OrderHeader,
  OrderListHeader,
  OrderTable,
  OrderCards,
  OrderEmptyState,
  ExcludedMaterialsTable
} from './components';

// Modals
export {
  AddMaterialModal,
  DirectOrderModal,
  SingleOrderModal,
  BulkOrderModal
} from './modals';

// Hooks - Re-export from global hooks
export { useOrderList, useOrderColumnPrefs } from '@hooks';

// Utils - Re-export from global utils
export {
  ORDER_COLUMNS,
  DEFAULT_ORDER_COLUMNS,
  STATUS_FILTER_OPTIONS,
  formatOrderPrice,
  getOrderStatusColor,
  getOrderStatusText,
  isOrderColumnRequired,
  mergeOrderColumnPreferences,
  toggleOrderColumn
} from '@utils/orderHelpers';
