/**
 * Type Definitions für Customer-Komponenten
 */

import type { Dispatch, SetStateAction } from 'react';
import type { Customer, Project } from '../base.types';

// ============================================
// CONTACT TYPES
// ============================================

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  position?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  position: string;
  notes: string;
  isPrimary?: boolean;
}

// ============================================
// COLUMN & FILTER TYPES
// ============================================

export interface Column {
  key: string;
  label: string;
  required?: boolean;
}

export interface VisibleColumns {
  [key: string]: boolean;
}

export interface CustomerColumnFilters {
  city: string;
  dateRange: string;
}

export type DateRangeType = 'alle' | 'heute' | '7tage' | '30tage' | '90tage' | 'jahr';

export interface DateRangeOption {
  value: string;
  label: string;
}

// ============================================
// CUSTOMER MODAL TYPES
// ============================================

export type CustomerModalMode = 'view' | 'create' | 'edit';

export interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: CustomerModalMode;
  customer?: Customer | null;
  onEdit?: (customer: Customer) => void;
  onDelete?: (customerId: string) => void;
  onProjectClick?: (project: Project) => void;
}

export interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onEdit?: (customer: Customer) => void;
  onDelete?: (customerId: string) => void;
  onProjectClick?: (project: Project) => void;
}

export interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
}

export interface CustomerFormData {
  customerID: string;
  firmennameKundenname: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  notes: string;
}

export interface CustomerFormErrors {
  [key: string]: string;
}

export interface DeleteConfirmation {
  contactId: string;
  contactName: string;
}

// ============================================
// CUSTOMER MANAGEMENT COMPONENT PROPS
// ============================================

export interface CustomerCardProps {
  filteredCustomers: Customer[];
  visibleColumns: VisibleColumns;
  searchTerm: string;
  handleCustomerClick: (customer: Customer) => void;
}

export interface CustomerTableProps {
  filteredCustomers: Customer[];
  visibleColumns: VisibleColumns;
  searchTerm: string;
  dropdownOpen: string | null;
  setDropdownOpen: (id: string | null) => void;
  activeColumnFilter: string | null;
  setActiveColumnFilter: (filter: string | null) => void;
  columnFilters: CustomerColumnFilters;
  uniqueCities: string[];
  handleColumnFilterChange: (column: string, value: string) => void;
  handleCustomerClick: (customer: Customer) => void;
  handleEditCustomer: (customer: Customer) => void;
  handleDeleteCustomer: (customerId: string) => Promise<void>;
}

export interface CustomerFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  hasActiveFilters: () => boolean;
  resetFilters: () => void;
  showColumnSelector: boolean;
  setShowColumnSelector: (show: boolean) => void;
  visibleColumns: VisibleColumns;
  availableColumns: Column[];
  loadingPreferences: boolean;
  toggleColumn: (columnKey: string) => Promise<void>;
}

export interface CustomerMobileFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  hasActiveFilters: () => boolean;
  resetFilters: () => void;
}

export interface CustomerStatsProps {
  totalCustomers: number;
}

// ============================================
// HOOK RETURN TYPES
// ============================================

export interface UseCustomerModalProps {
  isOpen: boolean;
  mode: CustomerModalMode;
  customer?: Customer | null;
}

export interface UseCustomerModalReturn {
  // States
  isView: boolean;
  isEdit: boolean;
  isCreate: boolean;
  contacts: Contact[];
  showAddContact: boolean;
  setShowAddContact: (show: boolean) => void;
  editingContact: Contact | null;
  setEditingContact: (contact: Contact | null) => void;
  contactForm: ContactFormData;
  setContactForm: (form: ContactFormData) => void;
  customerTotalCosts: number;
  loadingCosts: boolean;
  deleteConfirmation: DeleteConfirmation | null;
  setDeleteConfirmation: (confirmation: DeleteConfirmation | null) => void;
  formData: CustomerFormData;
  errors: CustomerFormErrors;
  setErrors: Dispatch<SetStateAction<CustomerFormErrors>>;
  customerProjects: Project[];

  // Actions
  startEditContact: (contact: Contact) => void;
  handleDeleteContact: (contactId: string) => void;
  confirmDeleteContact: () => Promise<void>;
  handleAddOrUpdateContact: () => Promise<void>;
  handleChange: (field: keyof CustomerFormData | string, value: string) => void;
  handleSubmit: (onClose?: () => void) => Promise<void>;
  handleLocalContactSubmit: () => void;
}

export interface UseCustomerManagementReturn {
  // Data
  customers: Customer[];
  projects: Project[];
  filteredCustomers: Customer[];

  // Search & Filter
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  dropdownOpen: string | null;
  setDropdownOpen: (id: string | null) => void;
  columnFilters: CustomerColumnFilters;
  activeColumnFilter: string | null;
  setActiveColumnFilter: (filter: string | null) => void;
  uniqueCities: string[];
  dateRangeOptions: DateRangeOption[];

  // Columns
  visibleColumns: VisibleColumns;
  availableColumns: Column[];
  showColumnSelector: boolean;
  setShowColumnSelector: (show: boolean) => void;
  loadingPreferences: boolean;
  toggleColumn: (columnKey: string) => Promise<void>;
  resetColumns: () => void;

  // Filter Actions
  handleColumnFilterChange: (column: string, value: string) => void;
  resetFilters: () => void;
  hasActiveFilters: () => boolean;

  // Customer Modal States
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  editingCustomer: Customer | null;
  isDetailModalOpen: boolean;
  selectedCustomer: Customer | null;

  // Customer Actions
  handleDeleteCustomer: (customerId: string) => Promise<void>;
  handleEditCustomer: (customer: Customer) => void;
  handleCloseModal: () => void;
  handleCustomerClick: (customer: Customer) => void;
  handleCloseDetailModal: () => void;

  // Project Modal States
  isProjectDetailModalOpen: boolean;
  setIsProjectDetailModalOpen: (open: boolean) => void;
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  isProjectEditModalOpen: boolean;
  setIsProjectEditModalOpen: (open: boolean) => void;
  editingProject: Project | null;

  // Project Actions
  handleProjectClick: (project: Project) => void;
  handleProjectEdit: (project: Project) => void;
  handleProjectDelete: (projectId: string) => Promise<void>;
  handleProjectSave: (projectData: Partial<Project>) => Promise<void>;
}
