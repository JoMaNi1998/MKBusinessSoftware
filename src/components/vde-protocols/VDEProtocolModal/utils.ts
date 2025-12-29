import { Material, VDEData, ACRowDefaults } from './types';

/**
 * Konvertiert einen Wert zu einer Nummer (String-Format)
 */
export const toNum = (v: unknown): string => {
  if (v == null) return '';
  const s = String(v).replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? s : '';
};

/**
 * Findet ein Material nach ID in einem Array
 */
export const findMaterialById = (
  materials: Material[] | undefined,
  id: string | undefined
): Material | undefined =>
  Array.isArray(materials) ? materials.find((m) => m.id === id) : undefined;

/**
 * Liest einen Spezifikations-Wert roh aus
 */
export const readSpecRaw = (
  materials: Material[] | undefined,
  materialID: string | undefined,
  specId: string
): string | number | undefined => {
  const mat = findMaterialById(materials, materialID);
  return mat?.specifications?.[specId];
};

/**
 * Liest einen Spezifikations-Wert und konvertiert zu Nummer
 */
export const readSpec = (
  materials: Material[] | undefined,
  materialID: string | undefined,
  specId: string
): string => toNum(readSpecRaw(materials, materialID, specId));

/**
 * Holt Modul-Spezifikation aus VDE-Daten
 */
export const getModuleSpec = (vdeData: VDEData, specId: string): string => {
  const modID = vdeData?.projectConfig?.modules?.materialID;
  if (!modID) return '';
  return readSpec(vdeData.materials, modID, specId);
};

/**
 * Holt Wechselrichter-Spezifikation
 */
export const getInverterSpec = (
  vdeData: VDEData,
  inverterMaterialID: string | undefined,
  specId: string
): string => {
  if (!inverterMaterialID) return '';
  return readSpec(vdeData.materials, inverterMaterialID, specId);
};

// Spezifikations-IDs für Kabel und Schutzgeräte
const CABLE_SPECS = {
  CONDUCTOR_COUNT: 'hRDtjnTqWu1tuPhqg1Ql',
  CROSS_SECTION: 'qZP1lmJFLNXMyd9pYvcw',
  TYPE: 'Yn0WBipreNBAZnaZWWJX',
} as const;

const BREAKER_SPECS = {
  TYPE: 'r2lRsnr7SZ5xxGzmcLts',
  CURRENT: '55ZFekLPfQThKJO0xwFn',
} as const;

const RCD_SPECS = {
  IN: 'xeEG32si5hPDky1bsavj',
  IDN: 'CAwoyaTvY5SyVGTJPHN9',
} as const;

/**
 * Kleine Helper zur Reduktion redundanter Logik (AC-Messtabelle)
 */
export const getAutoAcRowDefaults = (vdeData: VDEData, rowIndex: number): ACRowDefaults => {
  const auto: ACRowDefaults = {
    nr: '',
    designation: '',
    cableType: '',
    cableInfo: '',
    breakerType: '',
    breakerCurrent: '',
    rcdIn: '',
    rcdIdn: '',
  };

  const mats = vdeData.materials;
  const cfg = vdeData.projectConfig || {};
  const inverters = cfg.inverters || [];
  const invCount = inverters.length;

  // WR-Reihe
  if (rowIndex < invCount) {
    const inv = inverters[rowIndex];
    auto.nr = String(rowIndex + 1);
    auto.designation = `${inv?.description || 'WR'}_${rowIndex}`;
    // Kabel
    if (inv?.recommendedCable && mats) {
      const cab = mats.find((m) => m.id === inv.recommendedCable);
      const s = cab?.specifications || {};
      const n = s[CABLE_SPECS.CONDUCTOR_COUNT] || '';
      const a = s[CABLE_SPECS.CROSS_SECTION] || '';
      const t = s[CABLE_SPECS.TYPE] || '';
      auto.cableType = String(t) || '';
      auto.cableInfo = n && a ? `${n} x ${a}` : '';
    }
    // Schutz
    if (inv?.recommendedBreaker && mats) {
      const br = mats.find((m) => m.id === inv.recommendedBreaker);
      const s = br?.specifications || {};
      auto.breakerType = String(s[BREAKER_SPECS.TYPE] || '');
      auto.breakerCurrent = String(s[BREAKER_SPECS.CURRENT] || '');
    }
    return auto;
  }

  // Wallbox-Reihe(n)
  if (cfg.wallbox) {
    const start = invCount;
    const qty = cfg.wallbox.quantity || 1;
    const end = start + qty;
    if (rowIndex >= start && rowIndex < end) {
      const wbIndex = rowIndex - start;
      const wb = cfg.wallbox;
      auto.nr = String(rowIndex + 1);
      auto.designation = `${wb?.description || 'Wallbox'}_${wbIndex}`;

      if (wb?.recommendedCable && mats) {
        const cab = mats.find((m) => m.id === wb.recommendedCable);
        const s = cab?.specifications || {};
        const n = s[CABLE_SPECS.CONDUCTOR_COUNT] || '';
        const a = s[CABLE_SPECS.CROSS_SECTION] || '';
        const t = s[CABLE_SPECS.TYPE] || '';
        auto.cableType = String(t) || '';
        auto.cableInfo = n && a ? `${n} x ${a}` : '';
      }
      if (wb?.recommendedBreaker && mats) {
        const br = mats.find((m) => m.id === wb.recommendedBreaker);
        const s = br?.specifications || {};
        auto.breakerType = String(s[BREAKER_SPECS.TYPE] || '');
        auto.breakerCurrent = String(s[BREAKER_SPECS.CURRENT] || '');
      }
      if (wb?.recommendedRCD && mats) {
        const rcd = mats.find((m) => m.id === wb.recommendedRCD);
        const s = rcd?.specifications || {};
        auto.rcdIn = String(s[RCD_SPECS.IN] || '');
        auto.rcdIdn = String(s[RCD_SPECS.IDN] || '');
      }
      return auto;
    }
  }
  return auto;
};
