/**
 * Type Definitions für Invoice-Komponenten
 *
 * Zentrale Types für den InvoiceConfigurator und verwandte Komponenten.
 * InvoiceStatistics wird aus contexts/invoice.types.ts importiert (Source of Truth).
 */

import type { OfferItem as BaseOfferItem, OfferTotals as BaseOfferTotals, LaborFactorSelections } from './offer.types';
import type { ExtendedServiceCatalogItem, ServiceCategoryConfig } from '../contexts/serviceCatalog.types';
import type { Customer, Project } from '../index';
import type { ValidationErrors as BaseValidationErrors } from '../base.types';
import type { CalculationSettings } from '../contexts/calculation.types';
import type { InvoiceStatistics as ContextInvoiceStatistics } from '../contexts/invoice.types';

// Re-export InvoiceStatistics aus contexts für Abwärtskompatibilität
export type InvoiceStatistics = ContextInvoiceStatistics;

// Alias für CalcSettings
export type InvoiceCalcSettings = CalculationSettings;

// Re-export OfferItem für Kompatibilität
export type { BaseOfferItem as OfferItem };

// Re-export OfferTotals für Kompatibilität
export type { BaseOfferTotals as OfferTotals };

// ============================================
// INVOICE ITEM & DATA STRUCTURES
// ============================================

export interface SubItem {
  serviceId: string;
  quantity: number;
}

export interface InvoiceItemBreakdown {
  materials?: any[];
  labor?: any[];
  materialCost?: number;
  laborCost?: number;
  originalLaborCost?: number;
}

export interface InvoiceItem extends Omit<BaseOfferItem, 'type' | 'longText' | 'discount' | 'breakdown'> {
  type?: string;
  sourceType?: string;
  serviceID?: string;
  longText?: string;
  originalUnitPrice?: number;
  discount?: number;
  laborFactor?: number;
  appliedFactors?: Record<string, number>;
  isPackage?: boolean;
  subItems?: SubItem[];
  isDefaultPosition?: boolean;
  breakdown?: InvoiceItemBreakdown;
}

export interface InvoiceTotals extends BaseOfferTotals {
  // Erweitert BaseOfferTotals - keine zusätzlichen Felder nötig
}

export interface InvoiceFormData {
  items: InvoiceItem[];
  totals: InvoiceTotals;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  notes: string;
  offerID?: string;
  offerNumber?: string;
}

// ============================================
// VALIDATION & SELECTIONS
// ============================================

// ValidationErrors wird aus base.types.ts importiert
export type ValidationErrors = BaseValidationErrors;

export type SelectedServices = Record<string, string | undefined>;

export type ServiceQuantities = Record<string, number | undefined>;

// ============================================
// SERVICE & SETTINGS TYPES (lokale Aliase)
// ============================================

// Alias für Service - verwendet ExtendedServiceCatalogItem
export type InvoiceService = ExtendedServiceCatalogItem;

// Alias für ServiceCategory
export type InvoiceServiceCategory = ServiceCategoryConfig;

// ============================================
// COMPANY INFO
// ============================================

export interface InvoiceCompanyInfo {
  name: string;
  street?: string;
  zipCode?: string;
  city?: string;
  phone?: string;
  email?: string;
  iban?: string;
  bic?: string;
  bankName?: string;
  [key: string]: unknown;
}

export interface InvoiceTexts {
  greeting?: string;
  paymentTerms?: string;
  closing?: string;
  signature?: string;
  [key: string]: unknown;
}

export interface InvoiceFooter {
  column1?: string;
  column2?: string;
  column3?: string;
  [key: string]: unknown;
}

// ============================================
// HOOK RETURN TYPES
// ============================================

export interface UseInvoiceConfiguratorReturn {
  // Navigation
  currentStep: number;
  setCurrentStep: (step: number) => void;
  saving: boolean;
  isEditing: boolean;

  // Customer/Project
  selectedCustomer: string;
  setSelectedCustomer: (id: string) => void;
  selectedProject: string;
  setSelectedProject: (id: string) => void;
  customers: Customer[];
  customerProjects: Project[];
  projects: Project[];

  // Invoice Data
  invoiceData: InvoiceFormData;
  setInvoiceData: React.Dispatch<React.SetStateAction<InvoiceFormData>>;
  validationErrors: ValidationErrors;
  setValidationErrors: React.Dispatch<React.SetStateAction<ValidationErrors>>;

  // Labor Factors
  laborFactorSelections: LaborFactorSelections;
  setLaborFactorSelections: React.Dispatch<React.SetStateAction<LaborFactorSelections>>;

  // Services
  activeServices: ExtendedServiceCatalogItem[];
  selectedServices: SelectedServices;
  serviceQuantities: ServiceQuantities;
  dropdownCategories: ServiceCategoryConfig[];
  serviceSearchTerm: string;
  setServiceSearchTerm: (term: string) => void;
  filteredServicesByCategory: Record<string, ExtendedServiceCatalogItem[]>;

  // Settings
  calcSettings: InvoiceCalcSettings;
  company: InvoiceCompanyInfo;
  invoiceTexts: InvoiceTexts;
  footer: InvoiceFooter;

  // Handlers
  handleServiceSelection: (categoryId: string, serviceId: string) => void;
  handleQuantityChange: (categoryId: string, quantity: number) => void;
  handleAddService: (service: ExtendedServiceCatalogItem) => void;
  getSelectedService: (categoryId: string) => ExtendedServiceCatalogItem | null;
  getServiceById: (serviceId: string) => ExtendedServiceCatalogItem | undefined;

  // Item Handlers
  handleUpdateItem: (itemId: string, updates: Partial<InvoiceItem>) => void;
  handleRemoveItem: (itemId: string) => void;
  handleAddManualItem: () => void;

  // Actions
  handleNext: () => void;
  handleBack: () => void;
  handleSave: () => Promise<void>;
  handleCancel: () => void;

  // Zusätzliche Felder für Kompatibilität (optional)
  [key: string]: unknown;
}

// ============================================
// STEP COMPONENT PROPS
// ============================================

export interface InvoiceCustomerStepProps {
  selectedCustomer: string;
  setSelectedCustomer: (id: string) => void;
  selectedProject: string;
  setSelectedProject: (id: string) => void;
  customers: Customer[];
  customerProjects: Project[];
  invoiceData: InvoiceFormData;
  validationErrors: ValidationErrors;
  setValidationErrors: React.Dispatch<React.SetStateAction<ValidationErrors>>;
}

export interface InvoiceServicesStepProps {
  laborFactorSelections: LaborFactorSelections;
  setLaborFactorSelections: React.Dispatch<React.SetStateAction<LaborFactorSelections>>;
  calcSettings: InvoiceCalcSettings;
  validationErrors: ValidationErrors;
  dropdownCategories: ServiceCategoryConfig[];
  activeServices: ExtendedServiceCatalogItem[];
  selectedServices: SelectedServices;
  serviceQuantities: ServiceQuantities;
  handleServiceSelection: (categoryId: string, serviceId: string) => void;
  handleQuantityChange: (categoryId: string, quantity: number) => void;
  getSelectedService: (categoryId: string) => ExtendedServiceCatalogItem | null;
  getServiceById: (serviceId: string) => ExtendedServiceCatalogItem | undefined;
  invoiceData: InvoiceFormData;
  serviceSearchTerm: string;
  setServiceSearchTerm: (term: string) => void;
  filteredServicesByCategory: Record<string, ExtendedServiceCatalogItem[]>;
  handleAddService: (service: ExtendedServiceCatalogItem) => void;
}

export interface InvoicePositionsStepProps {
  invoiceData: InvoiceFormData;
  setInvoiceData: React.Dispatch<React.SetStateAction<InvoiceFormData>>;
  handleUpdateItem: (itemId: string, updates: Partial<InvoiceItem>) => void;
  handleRemoveItem: (itemId: string) => void;
  handleAddManualItem: () => void;
  customers: Customer[];
  projects: Project[];
  selectedCustomer: string;
  selectedProject: string;
  company: InvoiceCompanyInfo;
  invoiceTexts: InvoiceTexts;
  footer: InvoiceFooter;
}

export interface InvoicePreviewStepProps {
  invoiceData: InvoiceFormData;
  customers: Customer[];
  projects: Project[];
  selectedCustomer: string;
  selectedProject: string;
  company: InvoiceCompanyInfo;
  invoiceTexts: InvoiceTexts;
  footer: InvoiceFooter;
}

// ============================================
// INVOICE MANAGEMENT TYPES
// ============================================

export interface InvoiceColumnConfig {
  key: string;
  label: string;
  required: boolean;
}

export interface InvoiceVisibleColumns {
  rechnung: boolean;
  kunde: boolean;
  angebot: boolean;
  betrag: boolean;
  status: boolean;
  faellig: boolean;
  aktionen: boolean;
  [key: string]: boolean;
}

export interface InvoiceStatusOption {
  value: string;
  label: string;
}

export interface InvoiceRecord {
  id: string;
  customerID: string;
  customerName?: string;
  projectID?: string;
  invoiceNumber: string;
  offerNumber?: string;
  status: string;
  invoiceDate: string;
  dueDate?: string;
  totals?: {
    grossTotal?: number;
    netTotal?: number;
    subtotalNet?: number;
    discountPercent?: number;
    discountAmount?: number;
    taxRate?: number;
    taxAmount?: number;
    vatRate?: number;
    vatAmount?: number;
  };
  items?: InvoiceItem[];
  conditions?: {
    invoiceDate: string;
    dueDate: string;
    paymentTerms?: string;
    notes?: string;
  };
  createdBy?: string;
  createdAt?: Date | string | { toDate: () => Date };  // Unterstützt Firebase Timestamp
  updatedAt?: Date | string | { toDate: () => Date };  // Unterstützt Firebase Timestamp
}

// InvoiceStatistics wird am Anfang der Datei aus contexts/invoice.types.ts importiert

// ============================================
// INVOICE MANAGEMENT COMPONENT PROPS
// ============================================

export interface InvoiceFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  visibleColumns: InvoiceVisibleColumns;
  showColumnSettings: boolean;
  setShowColumnSettings: (show: boolean) => void;
  toggleColumn: (key: string) => void;
  columnSettingsRef: React.RefObject<HTMLDivElement | null>;
}

export interface InvoiceTableProps {
  filteredInvoices: InvoiceRecord[];
  visibleColumns: InvoiceVisibleColumns;
  handleViewInvoice: (invoice: InvoiceRecord) => void;
  handleEditInvoice: (invoice: InvoiceRecord) => void;
  handleDeleteClick: (invoice: InvoiceRecord) => void;
  handleStatusChange: (invoice: InvoiceRecord, status: string) => void;
  showActionsMenu: string | null;
  setShowActionsMenu: (id: string | null) => void;
  getCustomerName: (customerId: string) => string;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  activeColumnFilter: string | null;
  setActiveColumnFilter: (filter: string | null) => void;
  handleColumnFilterChange: (filterType: string, value: string) => void;
  uniqueStatuses: InvoiceStatusOption[];
  filterRef: React.RefObject<HTMLDivElement | null>;
  INVOICE_STATUS: Record<string, string>;
  INVOICE_STATUS_LABELS: Record<string, { label: string; color: string }>;
}

export interface InvoiceCardProps {
  filteredInvoices: InvoiceRecord[];
  visibleColumns: InvoiceVisibleColumns;
  handleViewInvoice: (invoice: InvoiceRecord) => void;
  getCustomerName: (customerId: string) => string;
  INVOICE_STATUS_LABELS: Record<string, { label: string; color: string }>;
}

export interface InvoiceStatsProps {
  stats: InvoiceStatistics;
}

export interface InvoiceActionsMenuProps {
  invoice: InvoiceRecord;
  showMenu: boolean;
  onToggleMenu: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
  INVOICE_STATUS: Record<string, string>;
  INVOICE_STATUS_LABELS: Record<string, { label: string; color: string }>;
}

// ============================================
// INVOICE MANAGEMENT HOOK RETURN TYPE
// ============================================

export interface UseInvoiceManagementReturn {
  // Data
  invoices: InvoiceRecord[];
  filteredInvoices: InvoiceRecord[];
  loading: boolean;
  stats: InvoiceStatistics;
  customers: Customer[];
  customersWithInvoices: Customer[];

  // Filter State
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  customerFilter: string;
  setCustomerFilter: (customerId: string) => void;
  uniqueStatuses: InvoiceStatusOption[];

  // Column Settings
  visibleColumns: InvoiceVisibleColumns;
  showColumnSettings: boolean;
  setShowColumnSettings: (show: boolean) => void;
  toggleColumn: (key: string) => void;
  columnSettingsRef: React.RefObject<HTMLDivElement | null>;
  filterRef: React.RefObject<HTMLDivElement | null>;
  activeColumnFilter: string | null;
  setActiveColumnFilter: (filter: string | null) => void;
  handleColumnFilterChange: (filterType: string, value: string) => void;

  // Modal State
  selectedInvoice: InvoiceRecord | null;
  showDeleteModal: boolean;
  showPDFPreview: boolean;
  invoiceToDelete: InvoiceRecord | null;
  showActionsMenu: string | null;
  setShowActionsMenu: (id: string | null) => void;

  // Handlers
  handleNewInvoice: () => void;
  handleEditInvoice: (invoice: InvoiceRecord) => void;
  handleViewInvoice: (invoice: InvoiceRecord) => void;
  handleDeleteClick: (invoice: InvoiceRecord) => void;
  handleDeleteConfirm: () => Promise<void>;
  handleStatusChange: (invoice: InvoiceRecord, newStatus: string) => Promise<void>;
  handleClosePDFPreview: () => void;
  handleCloseDeleteModal: () => void;

  // Helper Functions
  getCustomerName: (customerId: string) => string;
  getProjectName: (projectId: string | null | undefined) => string;

  // Constants
  INVOICE_STATUS: Record<string, string>;
  INVOICE_STATUS_LABELS: Record<string, { label: string; color: string }>;
}
