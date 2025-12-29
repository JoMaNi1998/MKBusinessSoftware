// Main components
export { default as ProjectManagement } from './ProjectManagement';
export { default as ProjectModal, ProjectDetailModal, AddProjectModal } from './ProjectModal';

// Hooks - Re-export from global hooks
export { useProjectColumnPrefs, useProjectManagement, useProjectModal } from '@hooks';

// Utils - Re-export from global utils
export {
  PROJECT_STATUS_OPTIONS,
  PROJECT_STATUS_OPTIONS_WITH_ALL,
  VDE_STATUS_OPTIONS,
  PROJECT_COLUMNS,
  DEFAULT_PROJECT_COLUMNS,
  DEFAULT_PROJECT_FILTERS,
  getProjectStatusColor,
  getVdeStatusColor,
  findProjectCustomerById,
  getProjectCustomerDisplayName,
  formatProjectAddressDisplay,
  sanitizeProjectCustomerName,
  buildProjectAddress,
  parseProjectAddress,
  calculateProjectCosts,
  isProjectColumnRequired,
  mergeProjectColumnPreferences,
  toggleProjectColumn
} from '@utils/projectHelpers';

export { computeNextProjectId } from '@utils/projectHelpers';
