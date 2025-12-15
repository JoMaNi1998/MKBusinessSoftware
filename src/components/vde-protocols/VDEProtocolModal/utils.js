import { SPEC } from './constants';

/**
 * Konvertiert einen Wert zu einer Nummer (String-Format)
 */
export const toNum = (v) => {
  if (v == null) return '';
  const s = String(v).replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? s : '';
};

/**
 * Findet ein Material nach ID in einem Array
 */
export const findMaterialById = (materials, id) =>
  Array.isArray(materials) ? materials.find((m) => m.id === id) : undefined;

/**
 * Liest einen Spezifikations-Wert roh aus
 */
export const readSpecRaw = (materials, materialID, specId) => {
  const mat = findMaterialById(materials, materialID);
  return mat?.specifications?.[specId];
};

/**
 * Liest einen Spezifikations-Wert und konvertiert zu Nummer
 */
export const readSpec = (materials, materialID, specId) =>
  toNum(readSpecRaw(materials, materialID, specId));

/**
 * Holt Modul-Spezifikation aus VDE-Daten
 */
export const getModuleSpec = (vdeData, specId) => {
  const modID = vdeData?.projectConfig?.modules?.materialID;
  if (!modID) return '';
  return readSpec(vdeData.materials, modID, specId);
};

/**
 * Holt Wechselrichter-Spezifikation
 */
export const getInverterSpec = (vdeData, inverterMaterialID, specId) => {
  if (!inverterMaterialID) return '';
  return readSpec(vdeData.materials, inverterMaterialID, specId);
};

/**
 * Kleine Helper zur Reduktion redundanter Logik (AC-Messtabelle)
 */
export const getAutoAcRowDefaults = (vdeData, rowIndex) => {
  let auto = {
    nr: '', designation: '', cableType: '', cableInfo: '',
    breakerType: '', breakerCurrent: '', rcdIn: '', rcdIdn: ''
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
      const n = s['hRDtjnTqWu1tuPhqg1Ql'] || '';
      const a = s['qZP1lmJFLNXMyd9pYvcw'] || '';
      const t = s['Yn0WBipreNBAZnaZWWJX'] || '';
      auto.cableType = t || '';
      auto.cableInfo = n && a ? `${n} x ${a}` : '';
    }
    // Schutz
    if (inv?.recommendedBreaker && mats) {
      const br = mats.find((m) => m.id === inv.recommendedBreaker);
      const s = br?.specifications || {};
      auto.breakerType = s['r2lRsnr7SZ5xxGzmcLts'] || '';
      auto.breakerCurrent = s['55ZFekLPfQThKJO0xwFn'] || '';
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
        const n = s['hRDtjnTqWu1tuPhqg1Ql'] || '';
        const a = s['qZP1lmJFLNXMyd9pYvcw'] || '';
        const t = s['Yn0WBipreNBAZnaZWWJX'] || '';
        auto.cableType = t || '';
        auto.cableInfo = n && a ? `${n} x ${a}` : '';
      }
      if (wb?.recommendedBreaker && mats) {
        const br = mats.find((m) => m.id === wb.recommendedBreaker);
        const s = br?.specifications || {};
        auto.breakerType = s['r2lRsnr7SZ5xxGzmcLts'] || '';
        auto.breakerCurrent = s['55ZFekLPfQThKJO0xwFn'] || '';
      }
      if (wb?.recommendedRCD && mats) {
        const rcd = mats.find((m) => m.id === wb.recommendedRCD);
        const s = rcd?.specifications || {};
        auto.rcdIn = s['xeEG32si5hPDky1bsavj'] || '';
        auto.rcdIdn = s['CAwoyaTvY5SyVGTJPHN9'] || '';
      }
      return auto;
    }
  }
  return auto;
};
