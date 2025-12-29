/**
 * Type Definitions für den CompanyContext
 *
 * Types für Firmeneinstellungen, Textvorlagen für Angebote/Rechnungen,
 * und Company-spezifische Operationen.
 */

// ============================================
// COMPANY INFO
// ============================================

export interface CompanyInfo {
  name: string;
  street: string;
  zipCode: string;
  city: string;
  phone: string;
  email: string;
  website?: string;
  taxId?: string;
  bankName?: string;
  iban?: string;
  bic?: string;
}

// ============================================
// TEXT TEMPLATES
// ============================================

export interface OfferTexts {
  greeting: string;
  paymentTerms: string;
  closing: string;
  depositNote: string;
  signature: string;
}

export interface InvoiceTexts {
  greeting: string;
  paymentTerms: string;
  closing: string;
  signature: string;
}

// ============================================
// FOOTER
// ============================================

export interface FooterColumns {
  column1: string;
  column2: string;
  column3: string;
}

// ============================================
// ADDITIONAL PAGES
// ============================================

export interface AdditionalPage {
  id: string;
  title: string;
  content: string;
  order: number;
  enabled: boolean;
}

// ============================================
// COMPANY SETTINGS
// ============================================

export interface CompanySettingsData {
  company: CompanyInfo;
  offerTexts: OfferTexts;
  invoiceTexts: InvoiceTexts;
  footer: FooterColumns;
  additionalPages: AdditionalPage[];
}

// ============================================
// COMPANY CONTEXT VALUE
// ============================================

export interface CompanyContextValue {
  // State
  settings: CompanySettingsData;
  company: CompanyInfo;
  offerTexts: OfferTexts;
  invoiceTexts: InvoiceTexts;
  footer: FooterColumns;
  additionalPages: AdditionalPage[];
  formattedAddress: string;
  loading: boolean;
  error: string | null;
  saving: boolean;

  // Operations
  saveSettings: (newSettings: CompanySettingsData) => Promise<{ success: boolean; error?: string }>;
  updateSetting: (path: string, value: unknown) => Promise<{ success: boolean; error?: string }>;

  // Constants
  DEFAULT_COMPANY_SETTINGS: CompanySettingsData;
}
