/**
 * Type Definitions für den ProjectContext
 *
 * Types für Projektverwaltung, Status-Tracking
 * und Project-spezifische Operationen.
 */

import type { Project, ProjectStatus } from '../index';

// ============================================
// PROJECT CONTEXT VALUE
// ============================================

export interface ProjectContextValue {
  // State
  projects: Project[];
  loading: boolean;
  error: string | null;

  // CRUD Operations
  addProject: (projectData: Partial<Project>) => Promise<void>;
  updateProject: (projectId: string, projectData: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;

  // Queries
  getProjectsByCustomer: (customerID: string) => Project[];
  getActiveProjects: () => Project[];
  getProjectById: (projectId: string) => Project | undefined;
}

// ============================================
// PROJECT STATISTICS
// ============================================

export interface ProjectStatistics {
  total: number;
  active: number;
  planning: number;
  completed: number;
  cancelled: number;
  onHold: number;
}

// ============================================
// PROJECT FILTERS
// ============================================

export interface ProjectFilters {
  status?: ProjectStatus | 'all';
  customerID?: string;
  searchTerm?: string;
  startDateFrom?: string;
  startDateTo?: string;
}
