/**
 * Type Definitions für den InvoiceContext
 *
 * Erweiterte Types für Rechnungsverwaltung, Anzahlungs-/Schlussrechnungen,
 * Status-Tracking und Invoice-spezifische Operationen.
 */

// Import base types directly to avoid circular deps
import type { Invoice, Offer, OfferItem, BaseVersionHistoryEntry } from '../base.types';
import type { InvoiceStatus } from '../enums';
import { InvoiceType } from '../enums';

// ============================================
// INVOICE TYPE CONFIGURATION
// ============================================

export interface InvoiceTypeConfig {
  label: string;
  color: 'blue' | 'orange' | 'green';
  description: string;
}

export const INVOICE_TYPE_LABELS: Record<InvoiceType, InvoiceTypeConfig> = {
  [InvoiceType.FULL]: {
    label: 'Vollrechnung',
    color: 'blue',
    description: '100% Rechnungsbetrag'
  },
  [InvoiceType.DEPOSIT]: {
    label: 'Anzahlungsrechnung',
    color: 'orange',
    description: 'Teilbetrag als Anzahlung'
  },
  [InvoiceType.FINAL]: {
    label: 'Schlussrechnung',
    color: 'green',
    description: 'Restbetrag nach Anzahlung'
  }
};

// ============================================
// EXTENDED INVOICE
// ============================================

export interface ExtendedInvoice extends Invoice {
  type: InvoiceType;
  depositPercent?: number;  // Für Anzahlungsrechnungen
  depositInvoiceID?: string;  // Für Schlussrechnungen: Referenz zur Anzahlung
  depositAmount?: number;  // Bereits gezahlter Anzahlungsbetrag
  originalAmount?: number;  // Original-Betrag vor Anzahlung
  version?: number;  // Versionsnummer
  history?: VersionHistoryEntry[];  // Änderungshistorie

  // Direkte Felder (Alias für conditions.*)
  // invoiceDate wird von Invoice geerbt (required)
  dueDate?: string;  // Alias für conditions.dueDate / Fälligkeitsdatum
  paymentTerms?: string;  // Alias für conditions.paymentTerms
  notes?: string;  // Alias für conditions.notes / Notizen
}

// ============================================
// VERSION HISTORY
// ============================================

// Verwendet BaseVersionHistoryEntry aus base.types.ts
export type InvoiceVersionHistoryEntry = BaseVersionHistoryEntry<ExtendedInvoice>;

// Alias for compatibility
export type VersionHistoryEntry = InvoiceVersionHistoryEntry;

// ============================================
// INVOICE STATISTICS
// ============================================

export interface InvoiceStatistics {
  total: number;
  byStatus: Record<InvoiceStatus, number>;
  totalValue: number;
  paidValue: number;
  openValue: number;  // Offener Betrag (sent + overdue)
  // Legacy fields for compatibility
  draft?: number;
  sent?: number;
  paid?: number;
  overdue?: number;
  cancelled?: number;
  outstandingValue?: number;
  overdueValue?: number;
  [key: string]: unknown;
}

// ============================================
// INVOICE FILTERS
// ============================================

export interface InvoiceFilters {
  status?: InvoiceStatus | 'all';
  type?: InvoiceType | 'all';
  customerID?: string;
  offerID?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

// ============================================
// INVOICE CONTEXT VALUE
// ============================================

export interface InvoiceContextValue {
  // State
  invoices: ExtendedInvoice[];
  loading: boolean;
  error: string | null;

  // CRUD Operations
  createInvoice: (invoiceData: Partial<ExtendedInvoice>) => Promise<{ success: boolean; invoiceId?: string; invoiceNumber?: string; error?: string }>;
  createInvoiceFromOffer: (offer: Offer, forceType?: InvoiceType) => Promise<{ success: boolean; invoiceId?: string; error?: string }>;
  updateInvoice: (invoiceId: string, invoiceData: Partial<ExtendedInvoice>, changeDescription?: string) => Promise<{ success: boolean; error?: string }>;
  deleteInvoice: (invoiceId: string) => Promise<{ success: boolean; error?: string }>;

  // Status Management
  updateInvoiceStatus: (invoiceId: string, newStatus: InvoiceStatus) => Promise<{ success: boolean; error?: string }>;

  // Queries
  getInvoicesByCustomer: (customerID: string) => ExtendedInvoice[];
  getInvoicesByOffer: (offerID: string) => ExtendedInvoice[];
  getInvoicesByStatus: (status: InvoiceStatus) => ExtendedInvoice[];
  getInvoiceById: (invoiceId: string) => ExtendedInvoice | undefined;

  // Deposit Invoice Helpers
  hasDepositInvoice: (offerId: string) => boolean;
  getDepositInvoice: (offerId: string) => ExtendedInvoice | undefined;

  // Utilities
  checkOverdueInvoices: () => Promise<void>;
  getStatistics: () => InvoiceStatistics;

  // Status Labels
  INVOICE_STATUS_LABELS: Record<InvoiceStatus, InvoiceStatusConfig>;
  INVOICE_TYPE_LABELS: Record<InvoiceType, InvoiceTypeConfig>;
}

// ============================================
// INVOICE NUMBER GENERATION
// ============================================

export interface InvoiceNumberConfig {
  prefix: string;
  year: number;
  sequence: number;
  format: string;
}

// ============================================
// INVOICE CREATION INPUT
// ============================================

export interface CreateInvoiceInput {
  offerID?: string;
  offerNumber?: string;
  customerID: string;
  customerName?: string;
  projectID?: string;
  type: InvoiceType;
  items: OfferItem[];
  conditions: {
    invoiceDate: string;
    dueDate: string;
    paymentTerms?: string;
    notes?: string;
  };
  depositPercent?: number;
  depositInvoiceID?: string;
  status?: InvoiceStatus;
}

// ============================================
// DEPOSIT CALCULATION
// ============================================

export interface DepositCalculationResult {
  depositPercent: number;
  depositAmount: number;
  depositVat: number;
  depositGross: number;
  remainingAmount: number;
  remainingVat: number;
  remainingGross: number;
}

// ============================================
// INVOICE STATUS CONFIG
// ============================================

export interface InvoiceStatusConfig {
  label: string;
  color: 'gray' | 'blue' | 'green' | 'red' | 'orange';
  icon?: string;
  description?: string;
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, InvoiceStatusConfig> = {
  draft: {
    label: 'Entwurf',
    color: 'gray',
    icon: 'Edit',
    description: 'Noch nicht versendet'
  },
  sent: {
    label: 'Versendet',
    color: 'blue',
    icon: 'Send',
    description: 'An Kunden gesendet'
  },
  paid: {
    label: 'Bezahlt',
    color: 'green',
    icon: 'CheckCircle',
    description: 'Vollständig beglichen'
  },
  overdue: {
    label: 'Überfällig',
    color: 'red',
    icon: 'AlertCircle',
    description: 'Zahlungsziel überschritten'
  },
  cancelled: {
    label: 'Storniert',
    color: 'orange',
    icon: 'XCircle',
    description: 'Rechnung storniert'
  }
};
