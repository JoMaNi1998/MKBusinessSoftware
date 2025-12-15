/**
 * useRecommendations - Empfehlungen für Schutzschalter/Kabel
 */

import { useState, useMemo, useCallback } from 'react';
import { SPEC } from '../constants';
import { parseNum, getSpec, getCableTable } from '../utils';

/**
 * Hook für automatische Empfehlungen (LS, Kabel, RCD)
 * @param {Object} params
 * @returns {{ recommendations, chosen, overrideRec, setOverrideRec }}
 */
export const useRecommendations = ({
  configuration,
  materialsById,
  pvDefaults,
}) => {
  // Override-State für Empfehlungen (User kann ändern)
  const [overrideRec, setOverrideRec] = useState({});

  // LS für Strom auswählen
  const pickBreakerForCurrent = useCallback(
    (maxA) => {
      const standardBreakers = {
        16: pvDefaults.defaultSicherung16A,
        20: pvDefaults.defaultSicherung20A,
        25: pvDefaults.defaultSicherung25A,
        32: pvDefaults.defaultSicherung32A,
        50: pvDefaults.defaultSicherung50A,
        63: pvDefaults.defaultSicherung63A,
      };

      const cableTable = getCableTable(pvDefaults);
      const tableEntry = cableTable.find((t) => t.maxA >= maxA) || cableTable[cableTable.length - 1];
      const target = tableEntry.breaker;
      return standardBreakers[target] || null;
    },
    [pvDefaults]
  );

  // Kabel für Strom auswählen
  const pickCableForCurrent = useCallback(
    (maxA) => {
      const standardCables = {
        1.5: pvDefaults.defaultKabel5x15,
        2.5: pvDefaults.defaultKabel5x25,
        4: pvDefaults.defaultKabel5x4,
        6: pvDefaults.defaultKabel5x6,
        10: pvDefaults.defaultKabel5x10,
        16: pvDefaults.defaultKabel5x16,
      };

      const cableTable = getCableTable(pvDefaults);
      const tableEntry = cableTable.find((t) => t.maxA >= maxA) || cableTable[cableTable.length - 1];
      const targetMM2 = tableEntry.mm2;
      return standardCables[targetMM2] || null;
    },
    [pvDefaults]
  );

  // RCD für Wallbox
  const pickRCDWallbox = useCallback(() => {
    return pvDefaults.defaultFehlerstromschutzschalterWallbox || null;
  }, [pvDefaults]);

  // Max. Gerätestrom auslesen
  const deviceMaxCurrent = useCallback(
    (matId) => {
      const m = materialsById.get(matId);
      if (!m) return 0;
      return parseNum(getSpec(m, [SPEC.DEV_MAX_I_1, SPEC.DEV_MAX_I_2, SPEC.DEV_MAX_I_3]));
    },
    [materialsById]
  );

  // Empfehlungen berechnen
  const recommendations = useMemo(() => {
    const rec = {
      inverterBreaker: null,
      inverterCable: null,
      wallboxBreaker: null,
      wallboxCable: null,
      wallboxRCD: null,
      backupBreaker: null,
      backupCable: null,
    };

    // WR: nimm ersten WR-Typ als Referenz für Dimensionierung
    const firstInv = configuration.inverters?.[0]?.type;
    if (firstInv) {
      const iMax = deviceMaxCurrent(firstInv);
      if (iMax > 0) {
        rec.inverterBreaker = pickBreakerForCurrent(iMax);
        rec.inverterCable = pickCableForCurrent(iMax);
      }
    }

    // Wallbox
    if (configuration.wallbox) {
      const iMax = deviceMaxCurrent(configuration.wallbox);
      if (iMax > 0) {
        rec.wallboxBreaker = pickBreakerForCurrent(iMax);
        rec.wallboxCable = pickCableForCurrent(iMax);
      }
      rec.wallboxRCD = pickRCDWallbox();
    }

    // Notstromlösungen
    if (configuration.notstromloesungen) {
      const iMax = deviceMaxCurrent(configuration.notstromloesungen);
      if (iMax > 0) {
        rec.backupBreaker = pickBreakerForCurrent(iMax);
        rec.backupCable = pickCableForCurrent(iMax);
      }
    }

    return rec;
  }, [
    configuration.inverters,
    configuration.wallbox,
    configuration.notstromloesungen,
    deviceMaxCurrent,
    pickBreakerForCurrent,
    pickCableForCurrent,
    pickRCDWallbox,
  ]);

  // Kombiniere Empfehlungen mit User-Overrides
  const chosen = useMemo(() => ({
    inverterBreaker: overrideRec.inverterBreaker ?? recommendations.inverterBreaker,
    inverterCable: overrideRec.inverterCable ?? recommendations.inverterCable,
    wallboxBreaker: overrideRec.wallboxBreaker ?? recommendations.wallboxBreaker,
    wallboxCable: overrideRec.wallboxCable ?? recommendations.wallboxCable,
    wallboxRCD: overrideRec.wallboxRCD ?? recommendations.wallboxRCD,
    backupBreaker: overrideRec.backupBreaker ?? recommendations.backupBreaker,
    backupCable: overrideRec.backupCable ?? recommendations.backupCable,
  }), [recommendations, overrideRec]);

  return {
    recommendations,
    chosen,
    overrideRec,
    setOverrideRec,
  };
};

export default useRecommendations;
