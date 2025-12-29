/**
 * Type Definitions für den CalculationContext
 *
 * Diese Datei enthält alle Types für Berechnungen, Stundensätze,
 * Arbeitsfaktoren, Mengenrabatte und die komplette Calculation API.
 */

import type { OfferItem } from '../index';
import type { LaborRole } from '../enums';

// ============================================
// HOURLY RATES
// ============================================

export interface HourlyRateConfig {
  rate: number;
  label: string;
}

export interface HourlyRates {
  gesellePrivat: HourlyRateConfig;
  geselleGewerbe: HourlyRateConfig;
  meisterPrivat: HourlyRateConfig;
  meisterGewerbe: HourlyRateConfig;
}

// ============================================
// LABOR FACTORS
// ============================================

export interface LaborFactorOption {
  id: string;
  label: string;
  laborFactor: number;
  description?: string;
}

export interface LaborFactors {
  dach: LaborFactorOption[];
  elektro: LaborFactorOption[];
  geruest: LaborFactorOption[];
  [key: string]: LaborFactorOption[];
}

// ============================================
// QUANTITY SCALES
// ============================================

export interface QuantityScaleTier {
  minQuantity: number;
  maxQuantity: number | null;  // null = unbegrenzt
  laborDiscount: number;  // Prozentsatz (0-100)
  label: string;
}

export interface QuantityScales {
  enabled: boolean;
  tiers: QuantityScaleTier[];
}

// ============================================
// MARGINS & TAX
// ============================================

export interface Margins {
  defaultMaterialMarkup: number;
  materialMarkup: number;
}

export interface Tax {
  defaultRate: number;
}

// ============================================
// OFFER DEFAULTS
// ============================================

export interface OfferDefaults {
  validityDays: number;
  paymentTerms: string;
  deliveryTerms: string;
  numberPrefix: string;
  numberFormat: string;
}

// ============================================
// CALCULATION SETTINGS
// ============================================

export interface CalculationSettings {
  hourlyRates: HourlyRates;
  margins: Margins;
  tax: Tax;
  laborFactors: LaborFactors;
  quantityScales: QuantityScales;
  offerDefaults: OfferDefaults;
  updatedAt?: Date;
  createdAt?: Date;
}

// ============================================
// SERVICE POSITION CALCULATIONS
// ============================================

export interface MaterialItem {
  materialID: string;
  quantity: number;
  purchasePrice?: number;
  description?: string;
  isVariable?: boolean;
}

export interface LaborItem {
  role: LaborRole;
  minutes: number;
  description?: string;
}

export interface ServicePositionBreakdown {
  materialCostEK: number;  // Material-Kosten Einkauf
  materialCostVK: number;  // Material-Kosten Verkauf
  laborCost: number;       // Arbeitskosten
  subtotal: number;        // Zwischensumme (Material VK + Labor)
  unitPriceNet: number;    // Preis pro Einheit (Netto)
  lastCalculated: string;  // Timestamp der letzten Berechnung
}

export interface CalculationBreakdown {
  materials: Array<{
    materialID: string;
    quantity: number;
    priceEK: number;
    priceVK: number;
    totalEK: number;
    totalVK: number;
  }>;
  labor: Array<{
    role: LaborRole;
    minutes: number;
    hourlyRate: number;
    cost: number;
  }>;
  totals: {
    materialEK: number;
    materialVK: number;
    labor: number;
    subtotal: number;
  };
}

// ============================================
// OFFER TOTALS CALCULATION
// ============================================

export interface OfferTotalsResult {
  subtotalNet: number;           // Netto-Zwischensumme
  laborReductionTotal: number;   // Arbeitskosten-Reduktion durch Mengenrabatt
  subtotalAfterScale: number;    // Zwischensumme nach Mengenrabatt
  discountPercent: number;       // Rabatt in Prozent
  discountAmount: number;        // Rabatt-Betrag
  netTotal: number;              // Netto-Gesamtsumme
  taxRate: number;               // MwSt-Satz
  taxAmount: number;             // MwSt-Betrag
  grossTotal: number;            // Brutto-Gesamtsumme
  moduleCount: number;           // Anzahl Module (für Mengenrabatt)
  quantityScaleDiscount: number; // Mengenrabatt in Prozent
  quantityScaleTier: QuantityScaleTier | null;  // Angewendete Mengenrabatt-Stufe
}

// ============================================
// CALCULATION CONTEXT VALUE
// ============================================

export interface CalculationContextValue {
  // State
  settings: CalculationSettings;
  loading: boolean;
  error: string | null;
  saving: boolean;

  // Settings Management
  saveSettings: (newSettings: CalculationSettings) => Promise<{ success: boolean; error?: string }>;
  updateSetting: (path: string, value: unknown) => Promise<{ success: boolean; error?: string }>;

  // Hourly Rates
  getHourlyRate: (role: LaborRole) => number;

  // Material Calculations
  calculateMaterialPrice: (purchasePrice: number, customMarkup?: number | null) => number;

  // Labor Calculations
  calculateLaborCost: (role: LaborRole, minutes: number) => number;

  // Unit Price
  calculateUnitPrice: (materialCost: number, laborCost: number) => number;

  // Service Position
  calculateServicePosition: (
    materials: MaterialItem[],
    laborItems: LaborItem[],
    materialsData: unknown[],
    customMarkup?: number | null
  ) => ServicePositionBreakdown;

  // Tax Calculations
  calculateTax: (netAmount: number, customTaxRate?: number | null) => number;
  calculateGross: (netAmount: number, customTaxRate?: number | null) => number;

  // Offer Totals
  calculateOfferTotals: (
    items: OfferItem[],
    globalDiscount?: number,
    customTaxRate?: number | null
  ) => OfferTotalsResult;

  // Offer Utilities
  calculateValidUntil: (fromDate?: Date) => string;

  // Module Count (für PV-Anlagen)
  getModuleCount: (items: OfferItem[]) => number;

  // Quantity Scales
  getQuantityScaleTier: (moduleCount: number) => QuantityScaleTier | null;
  getQuantityScaleDiscount: (moduleCount: number) => number;

  // Default Settings
  DEFAULT_SETTINGS: CalculationSettings;
}

// ============================================
// HELPER TYPES
// ============================================

export interface PriceCalculationInput {
  purchasePrice?: number;
  markup?: number;
  quantity?: number;
}

export interface LaborCalculationInput {
  role: LaborRole;
  durationMinutes: number;
  laborFactor?: number;
}

export interface PositionCalculationInput {
  materials: MaterialItem[];
  labor: LaborItem[];
  customMarkup?: number;
  quantity?: number;
}
