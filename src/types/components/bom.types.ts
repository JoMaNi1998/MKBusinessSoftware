/**
 * Type Definitions für Bill-of-Materials-Komponenten
 */

import type { Customer, Project } from '../index';

// ============================================
// BOM ITEM
// ============================================

export interface BOMItem {
  key: string;
  id: string;
  materialID: string;
  description: string;
  unit: string;
  itemsPerUnit: number;
  quantity: number;
  totalUnits: number;
  categoryId: string | null;
  isConfigured: boolean;
  isManual?: boolean;
  category: string;
}

// ============================================
// HOOK RETURN TYPES
// ============================================

export interface UseBillOfMaterialsReturn {
  // State
  selectedProject: Project | null;
  projectSearch: string;
  setProjectSearch: (search: string) => void;
  bomItems: BOMItem[];
  showProjectSelect: boolean;

  // Derived Data
  projects: Project[];
  customersById: Map<string, Customer>;
  filteredProjects: Project[];
  customer: Customer | null;

  // Actions
  handleProjectSelect: (project: Project) => void;
  handleRefreshFromBookings: () => void;
  handleRemoveItem: (itemId: string) => void;
  handleQuantityChange: (itemId: string, newQuantity: number | string) => void;
  handlePrint: () => void;
  handleNewBOM: () => void;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface BOMTableProps {
  items: BOMItem[];
  title: string;
  bgColor: string;
  borderColor: string;
  startIndex?: number;
  onQuantityChange: (itemId: string, newQuantity: string) => void;
  onRemoveItem: (itemId: string) => void;
}

export interface ProjectSelectorProps {
  projects: Project[];
  customersById: Map<string, Customer>;
  filteredProjects: Project[];
  projectSearch: string;
  setProjectSearch: (search: string) => void;
  onProjectSelect: (project: Project) => void;
}

export interface ProjectInfoCardProps {
  project: Project | null;
  customer: Customer | null;
}
