/**
 * PV-Konfigurator Konstanten
 *
 * Kategorie-IDs und Spezifikations-Keys für die Materialfilterung
 * und automatische BOM-Berechnung
 */

/* -------------------------------------------
 *  Kategorie-IDs (Firebase Material Categories)
 * ------------------------------------------- */
export const CAT = {
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

/* -------------------------------------------
 *  Spezifikations-Keys (Material Specifications)
 * ------------------------------------------- */
export const SPEC = {
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

/* -------------------------------------------
 *  Dachtypen
 * ------------------------------------------- */
export interface RoofType {
  value: string;
  emoji: string;
  desc: string;
}

export const ROOF_TYPES: RoofType[] = [
  { value: 'Ziegel', emoji: '🏠', desc: 'Klassisches Ziegeldach' },
  { value: 'Trapez', emoji: '🏭', desc: 'Gewerbedach' },
  { value: 'Flach', emoji: '🏢', desc: 'Flachdach' },
];

/* -------------------------------------------
 *  Wizard Steps Definition
 * ------------------------------------------- */
export interface WizardStep {
  id: number;
  title: string;
  key: string;
}

export const WIZARD_STEPS: WizardStep[] = [
  { id: 0, title: 'Kunde', key: 'customer' },
  { id: 1, title: 'Layout', key: 'layout' },
  { id: 2, title: 'Montage', key: 'mounting' },
  { id: 3, title: 'Wechselrichter', key: 'inverter' },
  { id: 4, title: 'Zusatz', key: 'extras' },
  { id: 5, title: 'Elektro', key: 'electrical' },
  { id: 6, title: 'Zusammenfassung', key: 'summary' },
];

/* -------------------------------------------
 *  Configuration Types
 * ------------------------------------------- */
export interface ModuleRow {
  modules: number;
}

export interface InverterString {
  name: string;
  modules: number;
}

export interface InverterConfig {
  type: string;
  quantity: number;
  strings: InverterString[];
}

export interface Configuration {
  // Seite 1: Module & Layout
  module: string;
  roofType: string;
  querformatRows: ModuleRow[];
  hochformatRows: ModuleRow[];

  // Seite 2: Montage
  pvMountingSystem: string;
  befestigungPVMountingSystem: string;
  modulEndklemmen: string;
  modulMittelklemmen: string;
  pvSteckerMale: string;
  pvSteckerFemale: string;
  profile: string;
  verbinder: string;
  endkappen: string;

  // Seite 3: Wechselrichter
  inverters: InverterConfig[];

  // Seite 4: Zusätzliche Komponenten
  optimizer: string;
  optimizerQty: number;
  battery: string;
  batteryQty: number;
  wallbox: string;
  wallboxQty: number;
  energiemanagement: string;
  energiemanagementQty: number;
  notstromloesungen: string;
  notstromloesungenQty: number;

  // Seite 5: Elektrisch
  sls: string;
  slsQty: number;
  tiefenerder: string;
  tiefenerderQty: number;
  kombiableiter: string;
  kombiableiterQty: number;
  zaehlerschrank: string;
  zaehlerschrankQty: number;
  generatoranschlusskasten: string;
  generatoranschlusskastenQty: number;
  spannungsversorgungAPZ: string;
  spannungsversorgungAPZQty: number;

  // Smart Dongle
  smartDongle: string;
  smartDongleQty: number;
}

/* -------------------------------------------
 *  Default Configuration State
 * ------------------------------------------- */
export const DEFAULT_CONFIGURATION: Configuration = {
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
