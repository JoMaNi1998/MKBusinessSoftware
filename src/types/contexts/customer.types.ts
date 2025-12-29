/**
 * Type Definitions für den CustomerContext
 *
 * Types für Kundenverwaltung, CRUD-Operationen
 * und Customer-spezifische Operationen.
 */

import type { Customer, Project } from '../index';

// ============================================
// EXTENDED CUSTOMER
// ============================================

export interface ExtendedCustomer extends Customer {
  projects?: Project[];
  lastActivity?: Date;
}

// ============================================
// CUSTOMER CONTEXT VALUE
// ============================================

export interface CustomerContextValue {
  // State
  customers: ExtendedCustomer[];
  loading: boolean;
  error: string | null;

  // CRUD Operations
  addCustomer: (customerData: Partial<Customer>) => Promise<{ success: boolean; error?: string }>;
  updateCustomer: (customerId: string, customerData: Partial<Customer>) => Promise<{ success: boolean; error?: string }>;
  deleteCustomer: (customerId: string) => Promise<{ success: boolean; error?: string }>;

  // Queries
  getCustomerById: (id: string) => ExtendedCustomer | undefined;

  // Project Management (local state)
  addProject: (customerId: string, projectData: Partial<Project>) => void;
  updateProject: (customerId: string, projectId: string, projectData: Partial<Project>) => void;
  deleteProject: (customerId: string, projectId: string) => void;

  // Alias functions for compatibility
  addProjectToCustomer: (customerId: string, projectData: Partial<Project>) => void;
  updateCustomerProject: (customerId: string, projectId: string, projectData: Partial<Project>) => void;
  deleteCustomerProject: (customerId: string, projectId: string) => void;
}

// ============================================
// CUSTOMER STATISTICS
// ============================================

export interface CustomerStatistics {
  total: number;
  active: number;
  withProjects: number;
  withoutProjects: number;
  totalProjects: number;
}

// ============================================
// CUSTOMER FILTERS
// ============================================

export interface CustomerFilters {
  searchTerm?: string;
  tags?: string[];
  hasProjects?: boolean;
}
