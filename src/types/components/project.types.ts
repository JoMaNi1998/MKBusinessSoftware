/**
 * Type Definitions für Project-Komponenten
 *
 * Zentrale Types für ProjectManagement und verwandte Komponenten.
 */

import type { Project, Customer, Booking } from '../base.types';

// ============================================
// STATUS TYPES
// ============================================

export interface ProjectStatusOption {
  value: string;
  label: string;
  color: string;
}

export interface VDEStatusOption {
  value: string;
  label: string;
  color: string;
}

// ============================================
// COLUMN TYPES
// ============================================

export interface ProjectColumnConfig {
  key: string;
  label: string;
  required: boolean;
}

export interface ProjectVisibleColumns {
  [key: string]: boolean;
}

export interface ProjectColumnFilters {
  status: string;
  customer: string;
  [key: string]: string;
}

export interface ProjectSortConfig {
  key: string | null;
  direction: 'asc' | 'desc';
}

// ============================================
// STATISTICS TYPES
// ============================================

export interface ProjectStats {
  total: number;
  active: number;
  planned: number;
  completed: number;
}

// ============================================
// MODAL TYPES
// ============================================

export type ProjectModalMode = 'view' | 'create' | 'edit';

export interface ProjectFormData {
  projectID: string;
  name: string;
  description: string;
  customerID: string;
  customerName: string;
  contactPersonId: string;
  contactPersonName: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  status: string;
  notes: string;
  startDate: string;
  endDate: string;
  assignedUsers: string[];
}

export interface ProjectFormErrors {
  [key: string]: string;
}

export interface ProjectContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface ProjectConfiguration {
  id: string;
  projectID: string;
  name?: string;
  [key: string]: any;
}

export interface VDEProtocol {
  id: string;
  projectID?: string;
  customerID?: string;
  projectName?: string;
  customerName?: string;
  [key: string]: any;
}

// ============================================
// HOOK PROPS & RETURN TYPES
// ============================================

export interface UseProjectModalProps {
  isOpen: boolean;
  mode?: ProjectModalMode;
  project?: Project | null;
  customersProp?: Customer[];
  projectsProp?: Project[];
  onSave?: (projectData: any) => void;
  onClose?: () => void;
}

export interface UseProjectModalReturn {
  // Mode flags
  isView: boolean;
  isEdit: boolean;
  isCreate: boolean;

  // Data
  customersList: Customer[];
  customersCtx: Customer[];
  projectBookings: Booking[];
  customerOfProject: Customer | null;

  // View-specific data
  projectConfigurations: ProjectConfiguration[];
  loadingConfigurations: boolean;
  deletingConfigId: string | null;
  vdeProtocols: VDEProtocol[];
  loadingVdeProtocols: boolean;
  projectCosts: number;
  loadingCosts: boolean;

  // Form data
  formData: ProjectFormData;
  errors: ProjectFormErrors;
  selectedCustomerContacts: ProjectContact[];

  // Handlers
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleCustomerChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleContactPersonChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleAssignedUsersChange: (userIds: string[]) => void;
  handleSubmit: (evt?: React.FormEvent<HTMLFormElement>) => void;
  deleteConfiguration: (configId: string) => Promise<void>;
  loadVdeProtocols: () => Promise<void>;

  // Notifications
  showNotification: (message: string, type: any) => void;
}

export interface UseProjectManagementReturn {
  // Data
  projects: Project[];
  customers: Customer[];
  sortedProjects: Project[];
  stats: ProjectStats;
  uniqueStatuses: string[];
  uniqueCustomers: string[];

  // Search & Filter
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  columnFilters: ProjectColumnFilters;
  activeColumnFilter: string | null;
  setActiveColumnFilter: (filter: string | null) => void;
  handleColumnFilterChange: (column: string, value: string) => void;

  // Sort
  sortConfig: ProjectSortConfig;
  handleSort: (key: string) => void;

  // Modal State
  isAddModalOpen: boolean;
  isDetailModalOpen: boolean;
  editingProject: Project | null;
  selectedProject: Project | null;

  // UI State
  dropdownOpen: string | null;
  setDropdownOpen: (id: string | null) => void;
  editingStatus: string | null;

  // Handlers
  handleAddProject: () => void;
  handleEditProject: (project: Project) => void;
  handleProjectClick: (project: Project) => void;
  handleSaveProject: (projectData: Partial<Project>) => Promise<void>;
  handleDeleteProject: (projectId: string) => Promise<void>;
  handleCloseModal: () => void;
  handleCloseDetailModal: () => void;
  handleStatusEdit: (projectId: string) => void;
  handleStatusSave: (projectId: string, newStatus: string) => Promise<void>;
  handleStatusCancel: () => void;
}

export interface UseProjectColumnPrefsReturn {
  visibleColumns: ProjectVisibleColumns;
  loading: boolean;
  toggleColumn: (columnKey: string) => Promise<void>;
  isColumnVisible: (columnKey: string) => boolean;
  reloadPreferences: () => Promise<void>;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface ProjectHeaderProps {
  stats: ProjectStats;
  onAddProject: () => void;
}

export interface ProjectStatsProps {
  stats: ProjectStats;
}

export interface ProjectListProps {
  projects: Project[];
  customers: Customer[];
  visibleColumns: ProjectVisibleColumns;
  sortConfig: ProjectSortConfig;
  columnFilters: ProjectColumnFilters;
  activeColumnFilter: string | null;
  uniqueStatuses: string[];
  uniqueCustomers: string[];
  editingStatus: string | null;
  dropdownOpen: string | null;
  onSort: (key: string) => void;
  onColumnFilterChange: (column: string, value: string) => void;
  setActiveColumnFilter: (filter: string | null) => void;
  onProjectClick: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => Promise<void>;
  onStatusEdit: (projectId: string) => void;
  onStatusSave: (projectId: string, newStatus: string) => Promise<void>;
  onStatusCancel: () => void;
  setDropdownOpen: (id: string | null) => void;
}

export interface ProjectTableProps extends ProjectListProps {}

export interface ProjectCardProps {
  project: Project;
  customer: Customer | undefined;
  visibleColumns: ProjectVisibleColumns;
  onProjectClick: (project: Project) => void;
}

export interface ProjectTableHeaderProps {
  visibleColumns: ProjectVisibleColumns;
  sortConfig: ProjectSortConfig;
  columnFilters: ProjectColumnFilters;
  activeColumnFilter: string | null;
  uniqueStatuses: string[];
  uniqueCustomers: string[];
  onSort: (key: string) => void;
  onColumnFilterChange: (column: string, value: string) => void;
  setActiveColumnFilter: (filter: string | null) => void;
}

export interface ColumnSettingsProps {
  visibleColumns: ProjectVisibleColumns;
  availableColumns: ProjectColumnConfig[];
  loadingPreferences: boolean;
  onToggleColumn: (key: string) => void;
}

export interface ProjectModalProps {
  isOpen: boolean;
  mode?: ProjectModalMode;
  project?: Project | null;
  customers?: Customer[];
  projects?: Project[];
  onSave?: (projectData: any) => void;
  onClose: () => void;
}

export interface ProjectFormProps {
  formData: ProjectFormData;
  errors: ProjectFormErrors;
  customersList: Customer[];
  selectedCustomerContacts: ProjectContact[];
  isEdit: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onCustomerChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onContactPersonChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubmit: (evt?: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

export interface ProjectViewDetailsProps {
  project: Project;
  customer: Customer | null;
}

export interface ProjectViewStatsProps {
  projectCosts: number;
  loadingCosts: boolean;
  bookingsCount: number;
}

export interface BookingsSectionProps {
  bookings: Booking[];
  project: Project;
}

export interface PVConfigurationSectionProps {
  configurations: ProjectConfiguration[];
  loading: boolean;
  deletingConfigId: string | null;
  onDeleteConfiguration: (configId: string) => Promise<void>;
}

export interface VDEProtocolsSectionProps {
  protocols: VDEProtocol[];
  loading: boolean;
}

// ============================================
// ADDRESS TYPES
// ============================================

export interface AddressParts {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
}

// ============================================
// COST CALCULATION TYPES
// ============================================

export interface ProjectCosts {
  totalMaterialCost: number;
  totalLaborCost: number;
  totalCost: number;
}
