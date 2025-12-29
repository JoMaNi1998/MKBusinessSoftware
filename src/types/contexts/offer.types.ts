/**
 * Type Definitions für den OfferContext
 *
 * Erweiterte Types für Angebotsverwaltung, Version History,
 * Status-Tracking und Offer-spezifische Operationen.
 */

import type { Offer, OfferItem, OfferStatus, OfferConditions, OfferTotals, ServicePositionBreakdown, BaseVersionHistoryEntry } from '../index';

// ============================================
// EXTENDED OFFER ITEM
// ============================================

export interface ExtendedOfferItem extends OfferItem {
  // Erweiterte Felder für Berechnungen
  breakdown?: ServicePositionBreakdown;
  materials?: Array<{
    materialID: string;
    quantity: number;
    name?: string;
    price?: number;
  }>;
  labor?: Array<{
    role: string;
    minutes: number;
    cost?: number;
  }>;
  category?: string;
  // Für Service-Positionen
  laborFactor?: number;
  customMarkup?: number;
}

// ============================================
// VERSION HISTORY
// ============================================

// Verwendet BaseVersionHistoryEntry aus base.types.ts
export type VersionHistoryEntry = BaseVersionHistoryEntry<Offer>;

// ============================================
// OFFER STATISTICS
// ============================================

export interface OfferStatistics {
  total: number;
  draft: number;
  sent: number;
  accepted: number;
  rejected: number;
  expired: number;
  totalValue: number;
  acceptedValue: number;
  pendingValue: number;
}

// ============================================
// OFFER FILTERS
// ============================================

export interface OfferFilters {
  status?: OfferStatus | 'all';
  customerID?: string;
  projectID?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

// ============================================
// OFFER CONTEXT VALUE
// ============================================

export interface OfferContextValue {
  // State
  offers: Offer[];
  loading: boolean;
  error: string | null;

  // CRUD Operations
  createOffer: (offerData: Partial<Offer>) => Promise<{ success: boolean; offerId?: string; offerNumber?: string; error?: string }>;
  updateOffer: (offerId: string, offerData: Partial<Offer>, changeDescription?: string) => Promise<{ success: boolean; error?: string }>;
  deleteOffer: (offerId: string) => Promise<{ success: boolean; error?: string }>;
  duplicateOffer: (offerId: string) => Promise<{ success: boolean; offerId?: string; offerNumber?: string; error?: string }>;

  // Status Management
  updateOfferStatus: (offerId: string, newStatus: OfferStatus) => Promise<{ success: boolean; error?: string }>;

  // Item Management
  addOfferItem: (offer: Offer, newItem: ExtendedOfferItem) => Promise<{ success: boolean; error?: string }>;
  updateOfferItem: (offer: Offer, itemId: string, updates: Partial<ExtendedOfferItem>) => Promise<{ success: boolean; error?: string }>;
  removeOfferItem: (offer: Offer, itemId: string) => Promise<{ success: boolean; error?: string }>;
  reorderOfferItems: (offer: Offer, fromIndex: number, toIndex: number) => Promise<{ success: boolean; error?: string }>;

  // Queries
  getOffersByCustomer: (customerID: string) => Offer[];
  getOffersByProject: (projectID: string) => Offer[];
  getOffersByStatus: (status: OfferStatus) => Offer[];
  getOfferById: (offerId: string) => Offer | undefined;

  // Utilities
  checkExpiredOffers: () => Promise<void>;
  getStatistics: () => OfferStatistics;
}

// ============================================
// OFFER NUMBER GENERATION
// ============================================

export interface OfferNumberConfig {
  prefix: string;
  year: number;
  sequence: number;
  format: string;
}

// ============================================
// OFFER CREATION INPUT
// ============================================

export interface CreateOfferInput {
  customerID: string;
  customerName?: string;
  projectID?: string;
  projectName?: string;
  items: ExtendedOfferItem[];
  conditions?: Partial<OfferConditions>;
  totals?: Partial<OfferTotals>;
  status?: OfferStatus;
  notes?: string;
  discountPercent?: number;
}

// ============================================
// OFFER UPDATE INPUT
// ============================================

export interface UpdateOfferInput {
  items?: ExtendedOfferItem[];
  conditions?: Partial<OfferConditions>;
  totals?: Partial<OfferTotals>;
  status?: OfferStatus;
  notes?: string;
  customerID?: string;
  projectID?: string;
}
