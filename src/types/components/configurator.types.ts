/**
 * Type Definitions für OfferConfigurator und verwandte Komponenten
 *
 * Types für Wizard-Navigation, Validation, Image Upload
 * und Configurator-spezifische State-Management.
 */

import type { LucideIcon } from 'lucide-react';
import type { OfferItem, OfferConditions, OfferTotals, Customer, Project } from '../index';
import type { ExtendedValidationErrors } from '../base.types';

// ============================================
// WIZARD CONFIGURATION
// ============================================

export interface WizardStep {
  id: number;
  title: string;
  icon: LucideIcon;
  description?: string;
  isComplete?: boolean;
  isOptional?: boolean;
}

export type WizardStepId = 0 | 1 | 2 | 3;  // Customer, Services, Positions, Preview

// ============================================
// CONFIGURATOR STATE
// ============================================

export interface OfferConfiguratorState {
  // Customer & Project
  customerID: string;
  customerName: string;
  projectID?: string;
  projectName?: string;

  // Offer Content
  items: OfferItem[];
  conditions: OfferConditions;
  totals: OfferTotals;

  // Configuration
  offerDate: string;
  depositPercent: number;
  notes?: string;

  // UI State
  currentStep: WizardStepId;
  isEditing: boolean;
}

// ============================================
// VALIDATION
// ============================================

// Erweitert ExtendedValidationErrors mit spezifischen Feldern für Configurator
export interface ValidationErrors extends ExtendedValidationErrors {
  customer?: string;
  project?: string;
  items?: string;
  conditions?: {
    validUntil?: string;
    paymentTerms?: string;
    deliveryTerms?: string;
  };
}

export interface StepValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

// ============================================
// IMAGE UPLOAD
// ============================================

export interface ImageUploadResult {
  url: string;
  path: string;
  name: string;
  size: number;
}

export interface ImageUploadProgress {
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
}

export interface ImageMetadata {
  name: string;
  size: number;
  type: string;
  url: string;
  path: string;
  uploadedAt: string;
  uploadedBy: string;
}

// ============================================
// CUSTOMER STEP
// ============================================

export interface CustomerStepProps {
  selectedCustomer: Customer | null;
  selectedProject: Project | null;
  customers: Customer[];
  projects: Project[];
  onCustomerChange: (customerId: string) => void;
  onProjectChange: (projectId: string) => void;
  errors?: ValidationErrors;
}

// ============================================
// SERVICES STEP
// ============================================

export interface ServicesStepProps {
  selectedServices: string[];
  availableServices: Array<{
    id: string;
    name: string;
    category: string;
    priceNet: number;
  }>;
  onServiceToggle: (serviceId: string) => void;
  onServiceQuantityChange: (serviceId: string, quantity: number) => void;
  errors?: ValidationErrors;
}

// ============================================
// POSITIONS STEP
// ============================================

export interface PositionsStepProps {
  items: OfferItem[];
  onAddItem: () => void;
  onUpdateItem: (itemId: string, updates: Partial<OfferItem>) => void;
  onRemoveItem: (itemId: string) => void;
  onReorderItems: (fromIndex: number, toIndex: number) => void;
  errors?: ValidationErrors;
}

// ============================================
// PREVIEW STEP
// ============================================

export interface PreviewStepProps {
  offer: OfferConfiguratorState;
  customer: Customer | null;
  project: Project | null;
  onEdit: (step: WizardStepId) => void;
  errors?: ValidationErrors;
}

// ============================================
// CONFIGURATOR PROPS
// ============================================

export interface OfferConfiguratorProps {
  isOpen: boolean;
  onClose: () => void;
  offer?: {
    id: string;
    [key: string]: unknown;
  } | null;
  mode?: 'create' | 'edit';
}

// ============================================
// HOOKS RETURN TYPES
// ============================================

export interface UseOfferStateReturn {
  state: OfferConfiguratorState;
  setState: React.Dispatch<React.SetStateAction<OfferConfiguratorState>>;
  updateState: (updates: Partial<OfferConfiguratorState>) => void;
  resetState: () => void;
}

export interface UseOfferValidationReturn {
  errors: ValidationErrors;
  validateStep: (step: WizardStepId) => StepValidationResult;
  validateAll: () => boolean;
  clearErrors: () => void;
  setFieldError: (field: string, error: string) => void;
}

export interface UseImageUploadReturn {
  uploading: boolean;
  progress: ImageUploadProgress | null;
  uploadImage: (file: File, path: string) => Promise<ImageUploadResult>;
  deleteImage: (path: string) => Promise<void>;
  getImageOrientation: (file: File) => Promise<number>;
  fixImageOrientation: (file: File) => Promise<File>;
}
