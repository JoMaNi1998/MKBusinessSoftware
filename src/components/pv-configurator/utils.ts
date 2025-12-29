/**
 * PV-Konfigurator Utility-Funktionen
 *
 * Helper-Funktionen für Zahlenformatierung, Spezifikationsauslesen
 * und Strombelastbarkeitstabellen
 */

import { SPEC } from './constants';
import type { Material } from '@app-types';

/**
 * Parst einen Wert zu einer Zahl (unterstützt deutsche Kommaschreibweise)
 * @param v - Zu parsender Wert
 * @returns Geparste Zahl oder 0
 */
export const parseNum = (v: any): number => {
  if (v === null || v === undefined) return 0;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

/**
 * Liest eine Spezifikation aus einem Material aus (unterstützt mehrere Keys)
 * @param mat - Material-Objekt
 * @param keys - Array von Spezifikations-Keys zum Ausprobieren
 * @returns Gefundener Wert oder undefined
 */
export const getSpec = (mat: Material | null | undefined, keys: string[]): any => {
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
 * @param mat - Material-Objekt
 * @returns Sicherungsstrom in Ampere
 */
export const getBreakerCurrent = (mat: Material | null | undefined): number => {
  // Note: SPEC.BREAKER_CURRENT_A_1 and SPEC.BREAKER_CURRENT_A_2 are not defined in constants
  // Using DEV_MAX_I_ as fallback
  return parseNum(getSpec(mat, [SPEC.DEV_MAX_I_1, SPEC.DEV_MAX_I_2]));
};

/**
 * Liest den Kabelquerschnitt eines Materials aus
 * @param mat - Material-Objekt
 * @returns Kabelquerschnitt in mm²
 */
export const getCableMM2 = (_mat: Material | null | undefined): number => {
  // Note: SPEC.CABLE_MM2_ keys are not defined in constants
  // This function may need to be updated with correct specification keys
  return 0;
};

interface PVDefaults {
  strombelastbarkeit15?: number;
  strombelastbarkeit25?: number;
  strombelastbarkeit4?: number;
  strombelastbarkeit6?: number;
  strombelastbarkeit10?: number;
  strombelastbarkeit16?: number;
}

interface CableTableEntry {
  mm2: number;
  maxA: number;
  breaker: number;
}

/**
 * Erstellt eine Strombelastbarkeitstabelle basierend auf pvDefaults
 * @param pvDefaults - PV-Standardeinstellungen aus Firebase
 * @returns Tabelle mit mm², maxA, breaker
 */
export const getCableTable = (pvDefaults: PVDefaults): CableTableEntry[] => [
  { mm2: 1.5, maxA: pvDefaults.strombelastbarkeit15 || 0, breaker: 16 },
  { mm2: 2.5, maxA: pvDefaults.strombelastbarkeit25 || 0, breaker: 20 },
  { mm2: 4, maxA: pvDefaults.strombelastbarkeit4 || 0, breaker: 25 },
  { mm2: 6, maxA: pvDefaults.strombelastbarkeit6 || 0, breaker: 32 },
  { mm2: 10, maxA: pvDefaults.strombelastbarkeit10 || 0, breaker: 50 },
  { mm2: 16, maxA: pvDefaults.strombelastbarkeit16 || 0, breaker: 63 },
];

interface ModuleRow {
  modules: number | string;
}

interface LayoutTotals {
  totalModules: number;
  totalRows: number;
  qCount: number;
  hCount: number;
  qRows: number;
  hRows: number;
}

/**
 * Berechnet Layout-Summen aus Modulreihen
 * @param querformatRows - Array von Querformat-Reihen
 * @param hochformatRows - Array von Hochformat-Reihen
 * @returns Berechnete Summen
 */
export const calculateLayoutTotals = (
  querformatRows: ModuleRow[] = [],
  hochformatRows: ModuleRow[] = []
): LayoutTotals => {
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

interface SelectOption {
  value: string;
  label: string;
}

/**
 * Erstellt Select-Optionen aus einer Material-Liste für eine bestimmte Kategorie
 * @param materials - Array aller Materialien
 * @param categoryId - Kategorie-ID zum Filtern
 * @returns Array von {value, label} Objekten für Select
 */
export const optionsFromCategory = (materials: Material[], categoryId: string): SelectOption[] => {
  return materials
    .filter((m) => m.categoryId === categoryId)
    .map((m) => ({
      value: m.id,
      label: m.description || (m as any).name || m.id
    }));
};

/**
 * Erstellt eine Map von Material-ID zu Material für schnellen Zugriff
 * @param materials - Array aller Materialien
 * @returns Map<string, Material>
 */
export const createMaterialsById = (materials: Material[]): Map<string, Material> => {
  const map = new Map<string, Material>();
  for (const mat of materials) {
    map.set(mat.id, mat);
  }
  return map;
};

/**
 * Prüft ob ein Paar aus Material-ID und Menge gültig ist
 * (entweder beide leer oder beide gefüllt)
 * @param materialId - Material-ID
 * @param quantity - Menge
 * @returns true wenn gültig
 */
export const pairRequired = (materialId: string, quantity: number): boolean => {
  const hasId = Boolean(materialId);
  const hasQty = quantity > 0;
  return (hasId && hasQty) || (!hasId && !hasQty);
};

/**
 * Generiert eine eindeutige ID für Buchungen/Konfigurationen
 * @param prefix - Präfix für die ID (z.B. 'pv-config', 'pv-booking')
 * @param projectId - Projekt-ID
 * @returns Eindeutige ID
 */
export const generateUniqueId = (prefix: string, projectId: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 11);
  return `${prefix}-${projectId}-${timestamp}-${random}`;
};

interface PVConfig {
  projectID?: string;
  pvConfiguration?: {
    configurationVersion?: string;
  };
}

/**
 * Berechnet die nächste Versionsnummer für eine Projektkonfiguration
 * @param existingConfigs - Bestehende Konfigurationen
 * @param projectId - Projekt-ID
 * @returns Nächste Version (z.B. "2.0")
 */
export const getNextConfigVersion = (existingConfigs: PVConfig[], projectId: string): string => {
  const projectConfigs = existingConfigs.filter(config => config.projectID === projectId);

  if (projectConfigs.length === 0) return '1.0';

  const versions = projectConfigs
    .map(config => config.pvConfiguration?.configurationVersion || '1.0')
    .map(version => parseFloat(version))
    .filter(version => !isNaN(version));

  const maxVersion = Math.max(...versions, 0);
  return (maxVersion + 1.0).toFixed(1);
};
