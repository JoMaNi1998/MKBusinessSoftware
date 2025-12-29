/**
 * Type Definitions für Offer-Komponenten
 *
 * Basis-Types (OfferItem, OfferTotals, OfferConditions) werden aus base.types.ts importiert.
 * Hier sind nur Komponenten-spezifische Types definiert.
 */

import type { Offer, Customer, Project, Service, OfferItem, OfferTotals, OfferConditions } from '../index';

// Re-export base types für Abwärtskompatibilität
export type { OfferItem, OfferTotals, OfferConditions };

// ============================================
// OFFER ITEM BREAKDOWN (nur hier definiert)
// ============================================

export interface OfferItemBreakdown {
  materials: any[];
  labor: any[];
  materialCost: number;
  laborCost: number;
  originalLaborCost?: number;
}

// ============================================
// OFFER FORM DATA
// ============================================

export interface OfferFormData {
  items: OfferItem[];
  offerDate?: string;
  totals: OfferTotals;
  conditions: OfferConditions;
  depositPercent?: number;
}

// ============================================
// LABOR FACTORS
// ============================================

export type LaborFactorType = 'dach' | 'elektro' | 'geruest';

export interface LaborFactorSelections {
  dach: string;
  elektro: string;
  geruest: string;
  [key: string]: string;
}

export interface LaborFactorResult {
  laborFactor: number;
  appliedFactors: Record<string, number>;
}

export interface AdjustedPriceData {
  unitPriceNet: number;
  originalUnitPrice: number;
  laborFactor: number;
  appliedFactors: Record<string, number>;
  priceOverridden: boolean;
  breakdown: OfferItemBreakdown;
}

// ============================================
// COLUMN CONFIGURATION
// ============================================

export interface OfferColumnConfig {
  key: string;
  label: string;
  required: boolean;
}

export interface OfferVisibleColumns {
  [key: string]: boolean;
}

// ============================================
// WIZARD CONFIGURATION
// ============================================

export interface WizardStep {
  id: number;
  title: string;
  icon: string;
}

// ============================================
// HOOKS RETURN TYPES
// ============================================

export interface UseOfferItemsParams {
  defaultServices: Service[];
  activeServices: Service[];
  calculateOfferTotals: (items: OfferItem[], discountPercent: number, taxRate: number) => OfferTotals;
  adjustPricesWithFactor: (service: Service, categoryId: string) => AdjustedPriceData;
  isEditing: boolean;
}

export interface UseOfferItemsReturn {
  offerData: OfferFormData;
  setOffer: (data: OfferFormData) => void;
  updateOfferField: (field: string, value: any) => void;
  updateConditions: (updates: Partial<OfferConditions>) => void;
  updateTotals: (updates: Partial<OfferTotals>) => void;
  addService: (service: Service) => void;
  addManualItem: () => void;
  updateItem: (itemId: string, updates: Partial<OfferItem>) => void;
  removeItem: (itemId: string) => void;
}

export interface UseLaborFactorsReturn {
  laborFactorSelections: LaborFactorSelections;
  setFactorSelection: (factorType: string, value: string) => void;
  getLaborFactor: (factorType: LaborFactorType) => number;
  getFactorForCategory: (categoryId: string) => LaborFactorResult;
  adjustPricesWithFactor: (service: Service, categoryId: string) => AdjustedPriceData;
  factorTypes: string[];
  factorLabels: Record<string, string>;
}

export interface UseOfferColumnPrefsReturn {
  visibleColumns: OfferVisibleColumns;
  loading: boolean;
  toggleColumn: (columnKey: string) => void;
  availableColumns: OfferColumnConfig[];
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface OfferStats {
  total: number;
  byStatus?: {
    draft?: number;
    sent?: number;
    accepted?: number;
  };
  acceptedValue: number;
}

export interface OfferStatsProps {
  stats: OfferStats;
}

export interface OfferHeaderProps {
  onNewOffer: () => void;
}

export interface OfferListHeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  visibleColumns: OfferVisibleColumns;
  availableColumns: OfferColumnConfig[];
  loadingPreferences: boolean;
  onToggleColumn: (columnKey: string) => void;
}

export interface OfferTableProps {
  offers: Offer[];
  visibleColumns: OfferVisibleColumns;
  statusFilter: string;
  onStatusFilterChange: (filter: string) => void;
  getCustomerName: (customerId: string) => string;
  getProjectName: (projectId: string) => string;
  onView: (offer: Offer) => void;
  onEdit: (offer: Offer) => void;
  onDelete: (offer: Offer) => void;
  onCreateInvoice: (offer: Offer) => void;
  hasDepositInvoice: (offerId: string) => boolean;
}

export interface OfferCardsProps {
  offers: Offer[];
  visibleColumns: OfferVisibleColumns;
  getCustomerName: (customerId: string) => string;
  getProjectName: (projectId: string) => string;
  onView: (offer: Offer) => void;
}

export interface OfferEmptyStateProps {
  hasOffers: boolean;
  onNewOffer: () => void;
}

// ============================================
// WIZARD STEP PROPS
// ============================================

export interface CustomerStepProps {
  selectedCustomer: Customer | null;
  selectedProject: Project | null;
  onCustomerSelect: (customer: Customer) => void;
  onProjectSelect: (project: Project | null) => void;
  onNext: () => void;
}

export interface PositionsStepProps {
  offerData: OfferFormData;
  onAddService: (service: Service) => void;
  onAddCustomPosition: () => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, updates: Partial<OfferItem>) => void;
  onMoveItem: (fromIndex: number, toIndex: number) => void;
  onBack: () => void;
  onNext: () => void;
}

export interface ServicesStepProps {
  selectedServices: Service[];
  onServiceToggle: (service: Service) => void;
  laborFactorSelections: LaborFactorSelections;
  onFactorChange: (factorType: LaborFactorType | string, value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export interface PreviewStepProps {
  customer: Customer | null;
  project: Project | null;
  offerData: OfferFormData;
  onSetGlobalDiscount: (percent: number) => void;
  onSetTaxRate: (rate: number) => void;
  onSetDepositPercent: (percent: number) => void;
  onSetConditions: (conditions: Partial<OfferConditions>) => void;
  onSetOfferDate: (date: string) => void;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
}

// ============================================
// MODAL PROPS
// ============================================

export interface DeleteOfferModalProps {
  isOpen: boolean;
  offer: Offer | null;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}

// ============================================
// SETTINGS PROPS
// ============================================

export interface CalculationSettingsProps {
  // Will be defined based on actual component
}

export interface ServiceCatalogProps {
  // Will be defined based on actual component
}

export interface OfferTextSettingsProps {
  companySettings: any;
  companyData: any;
  setCompanyData: (data: any) => void;
  saveCompanySettings: (data: any) => Promise<{ success: boolean; error?: string }>;
}

export interface ServicePositionEditorProps {
  // Will be defined based on actual component
}
