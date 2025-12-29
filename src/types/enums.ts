/**
 * Zentrale Enum Definitions
 *
 * Alle Enums für Status, Rollen, Kategorien etc.
 */

// ============================================
// OFFER STATUS
// ============================================

export enum OfferStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

// ============================================
// INVOICE STATUS
// ============================================

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

// ============================================
// INVOICE TYPE
// ============================================

export enum InvoiceType {
  FULL = 'full',
  DEPOSIT = 'deposit',
  FINAL = 'final'
}

// ============================================
// BOOKING TYPE
// ============================================

export enum BookingType {
  IN = 'in',
  OUT = 'out',
  CORRECTION = 'correction',
  INVENTORY = 'inventory'
}

// ============================================
// PROJECT STATUS
// ============================================

export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on-hold'
}

// ============================================
// LABOR ROLES
// ============================================

export enum LaborRole {
  GESELLE_PRIVAT = 'gesellePrivat',
  GESELLE_GEWERBE = 'geselleGewerbe',
  MEISTER_PRIVAT = 'meisterPrivat',
  MEISTER_GEWERBE = 'meisterGewerbe'
}

// ============================================
// TRADE CATEGORIES
// ============================================

export enum TradeCategory {
  DACH = 'dach',
  ELEKTRO = 'elektro',
  GERUEST = 'geruest'
}

// ============================================
// SERVICE CATEGORIES
// ============================================

export enum ServiceCategory {
  PV_MONTAGE = 'pv-montage',
  WECHSELRICHTER = 'wechselrichter',
  SPEICHER = 'speicher',
  WALLBOX = 'wallbox',
  ELEKTRO = 'elektro',
  DACH = 'dach',
  GERUEST = 'geruest',
  PLANUNG = 'planung',
  INBETRIEBNAHME = 'inbetriebnahme',
  WARTUNG = 'wartung',
  SONSTIGES = 'sonstiges'
}

// ============================================
// SERVICE UNITS
// ============================================

export enum ServiceUnit {
  PIECE = 'piece',
  METER = 'meter',
  SQUARE_METER = 'squaremeter',
  HOUR = 'hour',
  LUMP = 'lump',
  KILOWATT = 'kilowatt'
}

// ============================================
// STOCK STATUS
// ============================================

export enum StockStatus {
  AVAILABLE = 'Auf Lager',
  LOW = 'Niedrig',
  OUT_OF_STOCK = 'Nicht verfügbar',
  TO_ORDER = 'Nachbestellen'
}

// ============================================
// ORDER STATUS
// ============================================

export enum OrderStatus {
  OPEN = 'offen',
  ORDERED = 'bestellt',
  DELIVERED = 'geliefert',
  CANCELLED = 'storniert'
}

// ============================================
// USER ROLES
// ============================================

export enum UserRole {
  ADMIN = 'admin',
  PROJEKTLEITER = 'projektleiter',
  MONTEUR = 'monteur'
}

// ============================================
// PERMISSIONS
// ============================================

export enum Permission {
  // Angebote
  OFFERS_VIEW = 'offers:view',
  OFFERS_CREATE = 'offers:create',
  OFFERS_EDIT = 'offers:edit',
  OFFERS_DELETE = 'offers:delete',

  // Rechnungen
  INVOICES_VIEW = 'invoices:view',
  INVOICES_CREATE = 'invoices:create',
  INVOICES_EDIT = 'invoices:edit',
  INVOICES_DELETE = 'invoices:delete',

  // Materialien
  MATERIALS_VIEW = 'materials:view',
  MATERIALS_CREATE = 'materials:create',
  MATERIALS_EDIT = 'materials:edit',
  MATERIALS_DELETE = 'materials:delete',

  // Buchungen
  BOOKINGS_VIEW = 'bookings:view',
  BOOKINGS_CREATE = 'bookings:create',
  BOOKINGS_EDIT = 'bookings:edit',
  BOOKINGS_DELETE = 'bookings:delete',

  // Projekte
  PROJECTS_VIEW = 'projects:view',
  PROJECTS_CREATE = 'projects:create',
  PROJECTS_EDIT = 'projects:edit',
  PROJECTS_DELETE = 'projects:delete',

  // Kunden
  CUSTOMERS_VIEW = 'customers:view',
  CUSTOMERS_CREATE = 'customers:create',
  CUSTOMERS_EDIT = 'customers:edit',
  CUSTOMERS_DELETE = 'customers:delete',

  // Settings
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_EDIT = 'settings:edit',

  // Users
  USERS_MANAGE = 'users:manage'
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

// ============================================
// CONFIRM DIALOG VARIANTS
// ============================================

export enum ConfirmVariant {
  DANGER = 'danger',
  WARNING = 'warning',
  INFO = 'info'
}

// ============================================
// VDE PROTOCOL STATUS
// ============================================

export enum VDEProtocolStatus {
  DRAFT = 'Erstellt',
  CHECKED = 'Geprüft',
  COMPLETED = 'Abgeschlossen'
}

// ============================================
// CONFIGURATOR STATUS
// ============================================

export enum ConfiguratorStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

// ============================================
// FILE TYPES
// ============================================

export enum FileType {
  IMAGE = 'image',
  PDF = 'pdf',
  EXCEL = 'excel',
  WORD = 'word',
  OTHER = 'other'
}
