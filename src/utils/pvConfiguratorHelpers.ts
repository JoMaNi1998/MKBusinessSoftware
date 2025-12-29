/**
 * PV-Konfigurator Helper-Funktionen
 *
 * Utility-Funktionen für Zahlenformatierung, Spezifikationsauslesen,
 * Strombelastbarkeitstabellen und Konfigurationsverwaltung.
 */

import type { Material } from '@app-types';
import type {
  PVModuleRow,
  PVLayoutTotals,
  PVCableTableEntry,
  PVSelectOption,
  PVRoofType,
  PVWizardStep,
  PVConfiguration,
  PVSavedConfiguration
} from '@app-types/components/pvConfigurator.types';

// ============================================
// CATEGORY IDs (Firebase Material Categories)
// ============================================

export const PV_CAT = {
  MODULES: '1uOB8fBkWQYkPS0LOZxk',           // PV-Module
  INVERTERS: 'yGGCjoiZrmbabhCqWSyS',          // Wechselrichter
  WALLBOXES: 'sBUZ1B1IRinmuSPZNh7o',          // Wallboxen
  BATTERIES: 'CSVTWpEA5NSAIOZVyHTq',          // Batteriespeicher
  PV_MOUNTING: 'mHvC6RpkDKFFCqoZjZcW',        // PV-Montagesysteme
  CLAMPS: 'WGfZvGlkrPiTDUC3SqL2',             // Modulklemmen
  CONNECTORS: 'bArNeyutPDFXhpPBTsOw',         // PV-Stecker
  PROFILES: 'aAhBqQFaynXXCf42Ws1H',           // Profile (Ziegeldach)
  OPTIMIZERS: 'a6eKXo8lJX2RU7Ny8rDW',         // Leistungsoptimierer
  ENERGY_MGMT: 'xcd6LYhzBSV2u6r3lvTH',        // Energiemanagement
  BACKUP_BOXES: 'MhQf6qQNd5I08mqloE7R',       // Notstromlösungen
  CIRCUIT_BREAKERS: 'mMfrQeYNHrQJVT4hLAZs',   // Leitungsschutzschalter
  CABLES: 'BKL1zeVvHbOvtrD8udg9',             // Kabel
  RCDS: 'cpCa7ZqKiQfX37GvQVQn',               // FI-Schutzschalter
  POTENTIALAUSGLEICH: 'YsKVAMcq3UBWfpEUmuYm', // Potentialausgleich
  KABELMANAGEMENT: 'QVChNHri0HPhXpHW0spy',    // Kabelmanagement
  ADERENDHUESEN: '5psqw2EUItL72TMhfSfQ',      // Aderendhülsen
  BEFESTIGUNG_PV_MOUNTING: 'SyxjypSzRnCwf5ygddfh', // Befestigung Montagesystem
  VERBINDER: 'b5ipLND4IHvhV59PJdEP',          // Verbinder
  ENDKAPPEN: 'FFt4SWvmCjA51fL9JqIo',          // Endkappen
  SLS: 'XSJEgR8thn3PGhcH9W4f',                // SLS-Schalter
  TIEFENERDER: 'GP8qqjTGy7rb61Ldy4JR',        // Tiefenerder
  KOMBIALEITER: 'GbQ7mvPpvShm8yaXss5R',       // Kombiableiter
  ZAEHLERSCHRANK: 'sPp6SFLYLBt7jqj6ESV8',     // Zählerschrank
  APZ: 'oAkX5Hj0lu3KBVVvVnJv',                // APZ
  SMART_DONGLE: 'ZlqQZdDkuckVCHmCoU7T',       // Smart Dongle
  STROMWANDLER: 'xcd6LYhzBSV2u6r3lvTH',       // Stromwandler
  GENERATORANSCHLUSSKASTEN: 'UttktkBYB4PCle22csnr', // Generatoranschlusskasten
} as const;

// ============================================
// SPECIFICATION KEYS (Material Specifications)
// ============================================

export const PV_SPEC = {
  // Geräte-Ströme (für automatische Sicherungsempfehlung)
  DEV_MAX_I_1: 'Y3pBJPJrkUQMmVtLNOcv',        // Gerätestrom Variante 1
  DEV_MAX_I_2: 'Hvh5hlfkgPx78maaL72i',        // Gerätestrom Variante 2
  DEV_MAX_I_3: 'jqU0neeeT3zUIo4Aj9MJ',        // Gerätestrom Variante 3

  // Modul/Profil Maße (für Profilberechnung)
  MODULE_WIDTH_MM: 'wScGOKYdt4X1KdjYmZyy',    // Modulbreite in mm
  MODULE_LENGTH_MM: 'JI4bqhXSzmm9WGgddTYA',   // Modullänge in mm
  PROFILE_LENGTH_MM: '8YZJStJTGnHxZxBU30CP',  // Profillänge in mm

  // Kabel
  CABLE_CORES: 'hRDtjnTqWu1tuPhqg1Ql',        // Anzahl Kabeladern

  // Smart Dongle Spezifikation
  SMART_DONGLE_REQUIRED: 'fzK2fI7oj4XXbEYZe5tJ', // WR benötigt Smart Dongle (Ja/Nein)

  // Energiemanagement
  ENERGIEMANAGEMENT_SMART_DONGLE_ERSATZ: 'vtRsEoszWmDtdPZdKfBB', // EM ersetzt Smart Dongle (Ja/Nein)
} as const;

// ============================================
// ROOF TYPES CONFIGURATION
// ============================================

export const PV_ROOF_TYPES: PVRoofType[] = [
  { value: 'Ziegel', emoji: '🏠', desc: 'Klassisches Ziegeldach' },
  { value: 'Trapez', emoji: '🏭', desc: 'Gewerbedach' },
  { value: 'Flach', emoji: '🏢', desc: 'Flachdach' },
];

// ============================================
// WIZARD STEPS CONFIGURATION
// ============================================

export const PV_WIZARD_STEPS: PVWizardStep[] = [
  { id: 0, title: 'Kunde', key: 'customer' },
  { id: 1, title: 'Layout', key: 'layout' },
  { id: 2, title: 'Montage', key: 'mounting' },
  { id: 3, title: 'Wechselrichter', key: 'inverter' },
  { id: 4, title: 'Zusatz', key: 'extras' },
  { id: 5, title: 'Elektro', key: 'electrical' },
  { id: 6, title: 'Zusammenfassung', key: 'summary' },
];

// ============================================
// DEFAULT CONFIGURATION
// ============================================

export const PV_DEFAULT_CONFIGURATION: PVConfiguration = {
  // Seite 1: Module & Layout
  module: '',
  roofType: '',
  querformatRows: [],
  hochformatRows: [],

  // Seite 2: Montage
  pvMountingSystem: '',
  befestigungPVMountingSystem: '',
  modulEndklemmen: '',
  modulMittelklemmen: '',
  pvSteckerMale: '',
  pvSteckerFemale: '',
  profile: '',
  verbinder: '',
  endkappen: '',

  // Seite 3: Wechselrichter
  inverters: [{ type: '', quantity: 1, strings: [{ name: '1.0', modules: 1 }] }],

  // Seite 4: Zusätzliche Komponenten
  optimizer: '',
  optimizerQty: 0,
  battery: '',
  batteryQty: 0,
  wallbox: '',
  wallboxQty: 0,
  energiemanagement: '',
  energiemanagementQty: 0,
  notstromloesungen: '',
  notstromloesungenQty: 0,

  // Seite 5: Elektrisch
  sls: '',
  slsQty: 0,
  tiefenerder: '',
  tiefenerderQty: 0,
  kombiableiter: '',
  kombiableiterQty: 0,
  zaehlerschrank: '',
  zaehlerschrankQty: 0,
  generatoranschlusskasten: '',
  generatoranschlusskastenQty: 0,
  spannungsversorgungAPZ: '',
  spannungsversorgungAPZQty: 0,

  // Smart Dongle
  smartDongle: '',
  smartDongleQty: 0,
};

// ============================================
// NUMBER PARSING
// ============================================

/**
 * Parst einen Wert zu einer Zahl (unterstützt deutsche Kommaschreibweise)
 *
 * @param v - Zu parsender Wert
 * @returns Geparste Zahl oder 0
 */
export const parsePVNum = (v: any): number => {
  if (v === null || v === undefined) return 0;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

// ============================================
// SPECIFICATION HELPERS
// ============================================

/**
 * Liest eine Spezifikation aus einem Material aus (unterstützt mehrere Keys)
 *
 * @param mat - Material-Objekt
 * @param keys - Array von Spezifikations-Keys zum Ausprobieren
 * @returns Gefundener Wert oder undefined
 */
export const getPVSpec = (mat: Material | null | undefined, keys: string[]): any => {
  if (!mat?.specifications) return undefined;
  for (const k of keys) {
    if (mat.specifications[k] !== undefined && mat.specifications[k] !== '') {
      return mat.specifications[k];
    }
  }
  return undefined;
};

/**
 * Liest den Sicherungsstrom eines Materials aus
 *
 * @param mat - Material-Objekt
 * @returns Sicherungsstrom in Ampere
 */
export const getPVBreakerCurrent = (mat: Material | null | undefined): number => {
  return parsePVNum(getPVSpec(mat, [PV_SPEC.DEV_MAX_I_1, PV_SPEC.DEV_MAX_I_2]));
};

/**
 * Liest den Kabelquerschnitt eines Materials aus
 *
 * @param mat - Material-Objekt
 * @returns Kabelquerschnitt in mm²
 */
export const getPVCableMM2 = (_mat: Material | null | undefined): number => {
  return 0; // Spezifikations-Keys für Kabelquerschnitt fehlen
};

// ============================================
// CABLE TABLE
// ============================================

interface PVDefaultsForCableTable {
  strombelastbarkeit15?: number;
  strombelastbarkeit25?: number;
  strombelastbarkeit4?: number;
  strombelastbarkeit6?: number;
  strombelastbarkeit10?: number;
  strombelastbarkeit16?: number;
}

/**
 * Erstellt eine Strombelastbarkeitstabelle basierend auf pvDefaults
 *
 * @param pvDefaults - PV-Standardeinstellungen aus Firebase
 * @returns Tabelle mit mm², maxA, breaker
 */
export const getPVCableTable = (pvDefaults: PVDefaultsForCableTable): PVCableTableEntry[] => [
  { mm2: 1.5, maxA: pvDefaults.strombelastbarkeit15 || 0, breaker: 16 },
  { mm2: 2.5, maxA: pvDefaults.strombelastbarkeit25 || 0, breaker: 20 },
  { mm2: 4, maxA: pvDefaults.strombelastbarkeit4 || 0, breaker: 25 },
  { mm2: 6, maxA: pvDefaults.strombelastbarkeit6 || 0, breaker: 32 },
  { mm2: 10, maxA: pvDefaults.strombelastbarkeit10 || 0, breaker: 50 },
  { mm2: 16, maxA: pvDefaults.strombelastbarkeit16 || 0, breaker: 63 },
];

// ============================================
// LAYOUT CALCULATIONS
// ============================================

/**
 * Berechnet Layout-Summen aus Modulreihen
 *
 * @param querformatRows - Array von Querformat-Reihen
 * @param hochformatRows - Array von Hochformat-Reihen
 * @returns Berechnete Summen
 */
export const calculatePVLayoutTotals = (
  querformatRows: PVModuleRow[] = [],
  hochformatRows: PVModuleRow[] = []
): PVLayoutTotals => {
  const qCount = querformatRows.reduce((s, r) => s + (parseInt(String(r.modules)) || 0), 0);
  const hCount = hochformatRows.reduce((s, r) => s + (parseInt(String(r.modules)) || 0), 0);
  const qRows = querformatRows.length;
  const hRows = hochformatRows.length;

  return {
    totalModules: qCount + hCount,
    totalRows: qRows + hRows,
    qCount,
    hCount,
    qRows,
    hRows,
  };
};

// ============================================
// MATERIAL HELPERS
// ============================================

/**
 * Erstellt Select-Optionen aus einer Material-Liste für eine bestimmte Kategorie
 *
 * @param materials - Array aller Materialien
 * @param categoryId - Kategorie-ID zum Filtern
 * @returns Array von {value, label} Objekten für Select
 */
export const pvOptionsFromCategory = (materials: Material[], categoryId: string): PVSelectOption[] => {
  return materials
    .filter((m) => m.categoryId === categoryId)
    .map((m) => ({
      value: m.id,
      label: m.description || (m as any).name || m.id
    }));
};

/**
 * Erstellt eine Map von Material-ID zu Material für schnellen Zugriff
 *
 * @param materials - Array aller Materialien
 * @returns Map<string, Material>
 */
export const createPVMaterialsById = (materials: Material[]): Map<string, Material> => {
  const map = new Map<string, Material>();
  for (const mat of materials) {
    map.set(mat.id, mat);
  }
  return map;
};

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Prüft ob ein Paar aus Material-ID und Menge gültig ist
 * (entweder beide leer oder beide gefüllt)
 *
 * @param materialId - Material-ID
 * @param quantity - Menge
 * @returns true wenn gültig
 */
export const pvPairRequired = (materialId: string, quantity: number): boolean => {
  const hasId = Boolean(materialId);
  const hasQty = quantity > 0;
  return (hasId && hasQty) || (!hasId && !hasQty);
};

// ============================================
// ID GENERATION
// ============================================

/**
 * Generiert eine eindeutige ID für Buchungen/Konfigurationen
 *
 * @param prefix - Präfix für die ID (z.B. 'pv-config', 'pv-booking')
 * @param projectId - Projekt-ID
 * @returns Eindeutige ID
 */
export const generatePVUniqueId = (prefix: string, projectId: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 11);
  return `${prefix}-${projectId}-${timestamp}-${random}`;
};

// ============================================
// VERSION MANAGEMENT
// ============================================

/**
 * Berechnet die nächste Versionsnummer für eine Projektkonfiguration
 *
 * @param existingConfigs - Bestehende Konfigurationen
 * @param projectId - Projekt-ID
 * @returns Nächste Version (z.B. "2.0")
 */
export const getNextPVConfigVersion = (existingConfigs: PVSavedConfiguration[], projectId: string): string => {
  const projectConfigs = existingConfigs.filter(config => config.projectID === projectId);

  if (projectConfigs.length === 0) return '1.0';

  const versions = projectConfigs
    .map(config => config.pvConfiguration?.configurationVersion || '1.0')
    .map(version => parseFloat(version))
    .filter(version => !isNaN(version));

  const maxVersion = Math.max(...versions, 0);
  return (maxVersion + 1.0).toFixed(1);
};

// ============================================
// CONFIGURATION STATUS
// ============================================

export const PV_STATUS_OPTIONS = [
  { value: 'alle', label: 'Alle Status' },
  { value: 'DRAFT', label: 'Entwurf' },
  { value: 'BOOKED', label: 'Gebucht' },
];

export const getPVStatusColor = (status: string): string => {
  switch (status) {
    case 'BOOKED':
      return 'bg-green-100 text-green-800';
    case 'DRAFT':
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
};

export const getPVStatusLabel = (status: string): string => {
  switch (status) {
    case 'BOOKED':
      return 'Gebucht';
    case 'DRAFT':
    default:
      return 'Entwurf';
  }
};

// ============================================
// COLUMN CONFIGURATION
// ============================================

export const PV_AVAILABLE_COLUMNS = [
  { key: 'status', label: 'Status', alwaysVisible: false },
  { key: 'customer', label: 'Kunde', alwaysVisible: true },
  { key: 'project', label: 'Projekt', alwaysVisible: true },
  { key: 'modules', label: 'Module', alwaysVisible: false },
  { key: 'inverters', label: 'Wechselrichter', alwaysVisible: false },
  { key: 'version', label: 'Version', alwaysVisible: false },
  { key: 'createdAt', label: 'Erstellt', alwaysVisible: false },
  { key: 'actions', label: 'Aktionen', alwaysVisible: true },
];

export const PV_DEFAULT_VISIBLE_COLUMNS: { [key: string]: boolean } = {
  status: true,
  customer: true,
  project: true,
  modules: true,
  inverters: true,
  version: false,
  createdAt: true,
  actions: true,
};
