/**
 * Base Type Definitions für MK Business Software
 *
 * Diese Datei enthält die grundlegenden Geschäftsobjekte,
 * die von anderen Type-Dateien importiert werden können.
 * WICHTIG: Diese Datei darf KEINE anderen lokalen Types importieren!
 */

import { Timestamp } from 'firebase/firestore';
import type { BookingType, ProjectStatus, InvoiceStatus, OfferStatus } from './enums';

// Re-export enums for convenience (as both type and value for enum usage)
export { BookingType, ProjectStatus, InvoiceStatus, OfferStatus } from './enums';

// ============================================
// BASE TYPES
// ============================================

/** Firebase Timestamp oder kompatible Formate */
export type TimestampInput = Timestamp | Date | string | number | null;

/** Basis für alle Firebase-Dokumente */
export interface BaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  originalId?: string;
}

/** Standard Service-Rückgabe */
export interface ServiceResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

// ============================================
// CUSTOMER TYPES
// ============================================

export interface CustomerContact {
  id: string;
  name: string;
  position?: string;
  email?: string;
  phone?: string;
  isPrimary?: boolean;
}

export interface Customer extends BaseDocument {
  customerID: string;
  firmennameKundenname: string;
  name?: string;
  ansprechpartner?: string;
  strasse?: string;
  hausnummer?: string;
  plz?: string;
  ort?: string;
  land?: string;
  telefon?: string;
  mobil?: string;
  email?: string;
  website?: string;
  ustIdNr?: string;
  steuernummer?: string;
  zahlungsziel?: number;
  rabatt?: number;
  notizen?: string;
  contacts?: CustomerContact[];
  tags?: string[];
}

export type CustomerInput = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;

// ============================================
// MATERIAL TYPES
// ============================================

export interface Material extends BaseDocument {
  materialID: string;
  description?: string;
  bezeichnung?: string;
  name?: string;
  kategorie?: string;
  categoryId?: string;
  einheit?: string;
  manufacturer?: string;
  type?: string;
  einkaufspreis?: number;
  verkaufspreis?: number;
  purchasePrice?: number;
  price?: number;
  stock?: number;
  bestand?: number;
  heatStock?: number;
  mindestbestand?: number;
  orderStatus?: 'bestellt' | 'offen' | null;
  orderQuantity?: number;
  orderedQuantity?: number;
  orderDate?: Date | null;
  lieferant?: string;
  ean?: string;
  link?: string;
  itemsPerUnit?: number;
  specifications?: Record<string, string | number>;
  excludeFromAutoOrder?: boolean;
}

export type MaterialInput = Omit<Material, 'id' | 'createdAt' | 'updatedAt'>;

// ============================================
// PROJECT TYPES
// ============================================

export interface Project extends BaseDocument {
  name: string;
  description?: string;
  customerID: string;
  customerName?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  address?: {
    strasse?: string;
    plz?: string;
    ort?: string;
  };
  // English property names for compatibility
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  contactPersonName?: string;
  contactPersonId?: string;
  projectID?: string;
  notes?: string;
  tags?: string[];
  // Alternative naming conventions (legacy compatibility)
  projectName?: string;
  title?: string;
  projektName?: string;
}

// ============================================
// BOOKING TYPES
// ============================================

export interface Booking extends BaseDocument {
  materialID: string;
  materialName?: string;
  type: BookingType;
  quantity: number;
  previousStock?: number;
  newStock?: number;
  reason?: string;
  customerID?: string;
  customerName?: string;
  projectID?: string;
  projectName?: string;
  date: string;
  timestamp: Timestamp;
  createdBy?: string;
}

// ============================================
// CATEGORY & SPECIFICATION TYPES
// ============================================

export interface Category extends BaseDocument {
  name: string;
  description?: string;
  sortOrder?: number;
  color?: string;
  icon?: string;
}

export interface Specification extends BaseDocument {
  categoryId: string;
  name: string;
  label?: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  options?: string[];
  unit?: string;
  required?: boolean;
  sortOrder?: number;
}

// ============================================
// OFFER TYPES
// ============================================

export interface OfferItem {
  id: string;
  position: number;
  description?: string;
  shortText?: string;
  longText?: string;
  quantity: number;
  unit: string;
  unitPriceNet: number;
  originalUnitPrice?: number;
  priceOverridden?: boolean;
  laborFactor?: number;
  appliedFactors?: Record<string, number>;
  discount?: number;
  totalNet: number;
  materialId?: string;
  serviceId?: string;
  serviceID?: string;
  category?: string;
  type?: 'material' | 'service' | 'custom';
  isDefaultPosition?: boolean;
  isPackage?: boolean;
  subItems?: Array<{ serviceId: string; quantity: number }>;
  breakdown?: {
    materials: Array<{ materialID: string; quantity: number; name?: string; price?: number }>;
    labor: Array<{ role: string; minutes: number; cost?: number }>;
    materialCost: number;
    laborCost: number;
    originalLaborCost?: number;
  };
}

export interface OfferConditions {
  validUntil: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
}

export interface OfferTotals {
  subtotalNet: number;
  discountPercent?: number;
  discountAmount?: number;
  netTotal: number;
  netAfterDiscount?: number;
  vatRate?: number;
  vatAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  grossTotal: number;
}

export interface OfferHistoryEntry {
  version: number;
  createdAt: string;
  createdBy: string;
  changes: string;
}

export interface Offer extends BaseDocument {
  offerNumber: string;
  offerDate?: string;
  customerID: string;
  customerName?: string;
  projectID?: string;
  projectName?: string;
  status: OfferStatus;
  items: OfferItem[];
  conditions: OfferConditions;
  totals: OfferTotals;
  version: number;
  history: OfferHistoryEntry[];
  createdBy: string;
  sentAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  notes?: string;
  discount?: number;
  taxRate?: number;
  depositPercent?: number;
}

// ============================================
// INVOICE TYPES
// ============================================

export interface Invoice extends BaseDocument {
  invoiceNumber: string;
  offerID?: string;
  offerNumber?: string;
  customerID: string;
  customerName?: string;
  projectID?: string;
  status: InvoiceStatus;
  items?: OfferItem[];
  invoiceDate: string;
  dueDate?: string;
  conditions?: {
    invoiceDate: string;
    dueDate: string;
    paymentTerms?: string;
    notes?: string;
  };
  totals?: OfferTotals;
  createdBy?: string;
  paidAt?: string;
  paidAmount?: number;
}

// ============================================
// VALIDATION TYPES
// ============================================

/** Basis ValidationErrors-Type für einfache Formulare */
export interface ValidationErrors {
  [key: string]: string | undefined;
}

/** Erweiterte ValidationErrors mit nested objects (für komplexe Formulare) */
export interface ExtendedValidationErrors {
  [key: string]: string | Record<string, string> | undefined;
}

// ============================================
// VERSION HISTORY TYPES
// ============================================

/** Generischer VersionHistoryEntry-Base-Type */
export interface BaseVersionHistoryEntry<T = unknown> {
  version: number;
  createdAt: string | Date;
  createdBy: string;
  changes: string;
  previousState?: Partial<T>;
}
