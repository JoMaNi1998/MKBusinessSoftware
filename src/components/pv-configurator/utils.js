/**
 * PV-Konfigurator Utility-Funktionen
 *
 * Helper-Funktionen für Zahlenformatierung, Spezifikationsauslesen
 * und Strombelastbarkeitstabellen
 */

import { SPEC } from './constants';

/**
 * Parst einen Wert zu einer Zahl (unterstützt deutsche Kommaschreibweise)
 * @param {any} v - Zu parsender Wert
 * @returns {number} - Geparste Zahl oder 0
 */
export const parseNum = (v) => {
  if (v === null || v === undefined) return 0;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

/**
 * Liest eine Spezifikation aus einem Material aus (unterstützt mehrere Keys)
 * @param {Object} mat - Material-Objekt
 * @param {string[]} keys - Array von Spezifikations-Keys zum Ausprobieren
 * @returns {any} - Gefundener Wert oder undefined
 */
export const getSpec = (mat, keys) => {
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
 * @param {Object} mat - Material-Objekt
 * @returns {number} - Sicherungsstrom in Ampere
 */
export const getBreakerCurrent = (mat) => {
  return parseNum(getSpec(mat, [SPEC.BREAKER_CURRENT_A_1, SPEC.BREAKER_CURRENT_A_2]));
};

/**
 * Liest den Kabelquerschnitt eines Materials aus
 * @param {Object} mat - Material-Objekt
 * @returns {number} - Kabelquerschnitt in mm²
 */
export const getCableMM2 = (mat) => {
  return parseNum(getSpec(mat, [SPEC.CABLE_MM2_1, SPEC.CABLE_MM2_2, SPEC.CABLE_MM2_3]));
};

/**
 * Erstellt eine Strombelastbarkeitstabelle basierend auf pvDefaults
 * @param {Object} pvDefaults - PV-Standardeinstellungen aus Firebase
 * @returns {Array} - Tabelle mit mm², maxA, breaker
 */
export const getCableTable = (pvDefaults) => [
  { mm2: 1.5, maxA: pvDefaults.strombelastbarkeit15, breaker: 16 },
  { mm2: 2.5, maxA: pvDefaults.strombelastbarkeit25, breaker: 20 },
  { mm2: 4, maxA: pvDefaults.strombelastbarkeit4, breaker: 25 },
  { mm2: 6, maxA: pvDefaults.strombelastbarkeit6, breaker: 32 },
  { mm2: 10, maxA: pvDefaults.strombelastbarkeit10, breaker: 50 },
  { mm2: 16, maxA: pvDefaults.strombelastbarkeit16, breaker: 63 },
];

/**
 * Berechnet Layout-Summen aus Modulreihen
 * @param {Array} querformatRows - Array von Querformat-Reihen
 * @param {Array} hochformatRows - Array von Hochformat-Reihen
 * @returns {Object} - Berechnete Summen
 */
export const calculateLayoutTotals = (querformatRows = [], hochformatRows = []) => {
  const qCount = querformatRows.reduce((s, r) => s + (parseInt(r.modules) || 0), 0);
  const hCount = hochformatRows.reduce((s, r) => s + (parseInt(r.modules) || 0), 0);
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

/**
 * Erstellt Select-Optionen aus einer Material-Liste für eine bestimmte Kategorie
 * @param {Array} materials - Array aller Materialien
 * @param {string} categoryId - Kategorie-ID zum Filtern
 * @returns {Array} - Array von {value, label} Objekten für Select
 */
export const optionsFromCategory = (materials, categoryId) => {
  return materials
    .filter((m) => m.categoryId === categoryId)
    .map((m) => ({
      value: m.id,
      label: m.description || m.name || m.id
    }));
};

/**
 * Erstellt eine Map von Material-ID zu Material für schnellen Zugriff
 * @param {Array} materials - Array aller Materialien
 * @returns {Map} - Map<string, Material>
 */
export const createMaterialsById = (materials) => {
  const map = new Map();
  for (const mat of materials) {
    map.set(mat.id, mat);
  }
  return map;
};

/**
 * Prüft ob ein Paar aus Material-ID und Menge gültig ist
 * (entweder beide leer oder beide gefüllt)
 * @param {string} materialId - Material-ID
 * @param {number} quantity - Menge
 * @returns {boolean} - true wenn gültig
 */
export const pairRequired = (materialId, quantity) => {
  const hasId = Boolean(materialId);
  const hasQty = quantity > 0;
  return (hasId && hasQty) || (!hasId && !hasQty);
};

/**
 * Generiert eine eindeutige ID für Buchungen/Konfigurationen
 * @param {string} prefix - Präfix für die ID (z.B. 'pv-config', 'pv-booking')
 * @param {string} projectId - Projekt-ID
 * @returns {string} - Eindeutige ID
 */
export const generateUniqueId = (prefix, projectId) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 11);
  return `${prefix}-${projectId}-${timestamp}-${random}`;
};

/**
 * Berechnet die nächste Versionsnummer für eine Projektkonfiguration
 * @param {Array} existingConfigs - Bestehende Konfigurationen
 * @param {string} projectId - Projekt-ID
 * @returns {string} - Nächste Version (z.B. "2.0")
 */
export const getNextConfigVersion = (existingConfigs, projectId) => {
  const projectConfigs = existingConfigs.filter(config => config.projectID === projectId);

  if (projectConfigs.length === 0) return '1.0';

  const versions = projectConfigs
    .map(config => config.pvConfiguration?.configurationVersion || '1.0')
    .map(version => parseFloat(version))
    .filter(version => !isNaN(version));

  const maxVersion = Math.max(...versions, 0);
  return (maxVersion + 1.0).toFixed(1);
};
