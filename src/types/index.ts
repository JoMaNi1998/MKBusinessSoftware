/**
 * Zentrale Type-Definitionen für MK Business Software
 *
 * Diese Datei definiert alle Geschäftsobjekte, Service-Rückgaben,
 * und Hook-Return-Types für die gesamte Anwendung.
 */

import type { OfferItem, OfferConditions, ServiceResult, BaseDocument } from './base.types';
import { OfferStatus } from './enums';

// ============================================
// EXPORTS - Base Types (no circular deps)
// ============================================

export * from './base.types';

// ============================================
// EXPORTS - Context & Component Types
// ============================================

export * from './enums';
export * from './contexts';
// Components - ohne InvoiceStatistics und InvoiceTexts (bereits in contexts)
export type {
  // bom.types
  BOMItem,
  // booking.types (components)
  BookingModalProps,
  // order.types
  DisplayType,
  OrderMaterialDisplay,
  OrderStatistics,
  UseOrderListReturn,
  ColumnConfig,
  VisibleColumns,
  UseOrderColumnPrefsReturn,
  OrderStatsProps,
  OrderHeaderProps,
  OrderListHeaderProps,
  OrderTableProps,
  OrderCardsProps,
  OrderEmptyStateProps,
  ExcludedMaterialsTableProps,
  AddMaterialModalProps,
  DirectOrderModalProps,
  SingleOrderModalProps,
  BulkOrderItem,
  BulkOrderModalProps,
  // offer.types (components)
  OfferItemBreakdown,
  LaborFactorType,
  LaborFactorSelections,
  LaborFactorResult,
  AdjustedPriceData,
  OfferColumnConfig,
  OfferVisibleColumns,
  WizardStep,
  UseOfferItemsParams,
  UseOfferItemsReturn,
  UseLaborFactorsReturn,
  UseOfferColumnPrefsReturn,
  OfferStats,
  OfferStatsProps,
  OfferHeaderProps,
  OfferListHeaderProps,
  OfferTableProps,
  OfferCardsProps,
  OfferEmptyStateProps,
  CustomerStepProps,
  PositionsStepProps,
  ServicesStepProps,
  PreviewStepProps,
  DeleteOfferModalProps,
  CalculationSettingsProps,
  ServiceCatalogProps,
  OfferTextSettingsProps,
  ServicePositionEditorProps,
  // invoice.types (components)
  SubItem,
  InvoiceItemBreakdown,
  InvoiceItem,
  InvoiceTotals,
  InvoiceFormData,
  ValidationErrors,
  SelectedServices,
  ServiceQuantities,
  InvoiceService,
  InvoiceServiceCategory,
  InvoiceCompanyInfo,
  InvoiceTexts,
  InvoiceFooter,
  UseInvoiceConfiguratorReturn,
  InvoiceCustomerStepProps,
  InvoiceServicesStepProps,
  InvoicePositionsStepProps,
  InvoicePreviewStepProps,
  InvoiceColumnConfig,
  InvoiceVisibleColumns,
  InvoiceStatusOption,
  InvoiceRecord,
  InvoiceFiltersProps,
  InvoiceCardProps,
  InvoiceStatsProps,
  InvoiceActionsMenuProps,
  UseInvoiceManagementReturn,
  // customer.types
  Contact,
  ContactFormData,
  Column,
  CustomerColumnFilters,
  DateRangeType,
  DateRangeOption,
  CustomerModalMode,
  CustomerModalProps,
  CustomerDetailModalProps,
  AddCustomerModalProps,
  CustomerFormData,
  CustomerFormErrors,
  DeleteConfirmation,
  CustomerCardProps,
  CustomerTableProps,
  CustomerFiltersProps,
  CustomerMobileFiltersProps,
  CustomerStatsProps,
  UseCustomerModalProps,
  UseCustomerModalReturn,
  UseCustomerManagementReturn,
  // material.types
  MaterialModalMode,
  MaterialFormData,
  MaterialFormErrors,
  MaterialModalProps,
  MaterialSortConfig,
  MaterialVisibleColumns,
  MaterialColumnFilters,
  MaterialTableProps,
  MaterialCardsProps,
  MaterialColumnConfig,
  ColumnSettingsProps,
  MaterialStatsProps,
  MaterialHeaderProps,
  MaterialSearchBarProps,
  MaterialEmptyStateProps,
  CategorySpec,
  SpecificationsMap,
  UseMaterialFiltersReturn,
  UseColumnPreferencesReturn,
  UseCategoriesAndSpecsReturn,
  // project.types (components)
  ProjectStatusOption,
  VDEStatusOption,
  ProjectColumnConfig,
  ProjectVisibleColumns,
  ProjectColumnFilters,
  ProjectSortConfig,
  ProjectStats,
  ProjectModalMode,
  ProjectFormData,
  ProjectFormErrors,
  ProjectContact,
  ProjectConfiguration,
  VDEProtocol,
  UseProjectModalProps,
  UseProjectModalReturn,
  UseProjectManagementReturn,
  UseProjectColumnPrefsReturn,
  ProjectHeaderProps,
  ProjectStatsProps,
  ProjectListProps,
  ProjectTableProps,
  ProjectCardProps,
  ProjectTableHeaderProps,
  ProjectModalProps,
  ProjectFormProps,
  ProjectViewDetailsProps,
  ProjectViewStatsProps,
  BookingsSectionProps,
  PVConfigurationSectionProps,
  VDEProtocolsSectionProps,
  AddressParts,
  ProjectCosts
} from './components';

// Hinweis: Die Component-Aliase (ComponentOfferItem, etc.) wurden entfernt.
// OfferItem, OfferTotals, OfferConditions werden jetzt aus base.types.ts exportiert.
// InvoiceStatistics wird aus contexts/invoice.types.ts exportiert.

// PV Configurator types
export * from './components/pvConfigurator.types';

// Project Photo types (Monteur App)
export * from './components/projectPhoto.types';

// ============================================
// NOTE: BASE TYPES (TimestampInput, BaseDocument, ServiceResult,
// CustomerContact, Customer, CustomerInput, Material, MaterialInput,
// Project, Booking, Category, Specification) are now in base.types.ts
// and re-exported via 'export * from './base.types'' above
// ============================================

// ============================================
// OFFER TYPES - Most now in base.types.ts
// ============================================

export interface OfferStatusConfig {
  label: string;
  color: 'gray' | 'blue' | 'green' | 'red' | 'orange';
  icon: string;
}

export const OFFER_STATUS_LABELS: Record<OfferStatus, OfferStatusConfig> = {
  [OfferStatus.DRAFT]: { label: 'Entwurf', color: 'gray', icon: 'Edit' },
  [OfferStatus.SENT]: { label: 'Gesendet', color: 'blue', icon: 'Send' },
  [OfferStatus.ACCEPTED]: { label: 'Angenommen', color: 'green', icon: 'CheckCircle' },
  [OfferStatus.REJECTED]: { label: 'Abgelehnt', color: 'red', icon: 'XCircle' },
  [OfferStatus.EXPIRED]: { label: 'Abgelaufen', color: 'orange', icon: 'Clock' }
};

export interface CreateOfferInput {
  customerID: string;
  projectID?: string;
  items?: Omit<OfferItem, 'id' | 'position' | 'totalNet'>[];
  conditions?: Partial<OfferConditions>;
  discountPercent?: number;
  status?: OfferStatus;
  notes?: string;
}

export interface CreateOfferResult extends ServiceResult {
  offerId?: string;
  offerNumber?: string;
}

// ============================================
// INVOICE TYPES - Most now in base.types.ts
// ============================================

// ============================================
// PROJECT TYPES - now in base.types.ts
// ============================================

// ============================================
// BOOKING TYPES - now in base.types.ts
// ============================================

// ============================================
// SETTINGS TYPES
// ============================================

export interface CalculationSettings {
  id: string;
  defaultVatRate: number;
  offerDefaults?: {
    validityDays: number;
    paymentTerms: string;
    deliveryTerms: string;
  };
  invoiceDefaults?: {
    paymentDays: number;
    paymentTerms: string;
  };
  margins?: {
    material: number;
    service: number;
  };
}

export interface CompanySettings {
  id: string;
  name: string;
  address?: {
    strasse: string;
    plz: string;
    ort: string;
    land?: string;
  };
  contact?: {
    telefon?: string;
    email?: string;
    website?: string;
  };
  bank?: {
    name: string;
    iban: string;
    bic?: string;
  };
  tax?: {
    ustIdNr?: string;
    steuernummer?: string;
  };
  logo?: string;
  footerTexts?: {
    column1?: string;
    column2?: string;
    column3?: string;
  };
}

// ============================================
// SERVICE CATALOG TYPES
// ============================================

export interface ServiceCatalogItem extends BaseDocument {
  name: string;
  description?: string;
  category: string;
  unit: string;
  priceNet: number;
  estimatedHours?: number;
  sortOrder: number;
  isActive: boolean;
}

// Service alias - verwendet ExtendedServiceCatalogItem für vollständige Funktionalität
export type { ExtendedServiceCatalogItem as Service } from './contexts/serviceCatalog.types';

// ServicePositionBreakdown für Offer-Berechnungen
export interface ServicePositionBreakdown {
  materials: Array<{
    materialID: string;
    quantity: number;
    name?: string;
    price?: number;
  }>;
  labor: Array<{
    role: string;
    minutes: number;
    cost?: number;
  }>;
  materialCost: number;
  laborCost: number;
}

// ============================================
// CATEGORY & SPECIFICATION TYPES - now in base.types.ts
// ============================================

// ============================================
// CONTEXT TYPES
// ============================================

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  variant?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
}

// ============================================
// HOOK TYPES
// ============================================

export interface UseFirebaseListenerOptions {
  enabled?: boolean;
  retryOnError?: boolean;
  retryDelay?: number;
  maxRetries?: number;
}

export interface UseFirebaseListenerReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  setData: (updater: T[] | ((prev: T[]) => T[])) => void;
  clearError: () => void;
  refresh: () => void;
}

export interface CRUDResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
  [key: string]: unknown;
}

export interface BatchOperation {
  operation: (...args: unknown[]) => Promise<unknown>;
  args?: unknown[];
}

export interface BatchOptions {
  stopOnError?: boolean;
  parallel?: boolean;
}

export interface BatchResult {
  success: boolean;
  results: Array<{ index: number; result: unknown }>;
  errors: Array<{ index: number; error: string }>;
}
