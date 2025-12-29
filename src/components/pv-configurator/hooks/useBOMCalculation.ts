/**
 * useBOMCalculation - BOM-Berechnung für PV-Konfigurator
 */

import { useMemo } from 'react';
import { PV_CAT, PV_SPEC, parsePVNum, getPVSpec } from '@utils';
import type { Material } from '@app-types';
import type {
  PVBOMItem,
  UseBOMCalculationParams,
  UseBOMCalculationReturn
} from '@app-types/components/pvConfigurator.types';

/**
 * Hook für die BOM-Berechnung
 */
export const useBOMCalculation = ({
  configuration,
  layoutTotals,
  materials,
  materialsById,
  chosen,
  defaults,
}: UseBOMCalculationParams): UseBOMCalculationReturn => {
  return useMemo((): UseBOMCalculationReturn => {
    const bom: PVBOMItem[] = [];
    const warnings: string[] = [];
    const { totalModules, totalRows } = layoutTotals;

    if (totalModules === 0) {
      return { bom, warnings };
    }

    // Helper-Funktionen
    const addIfConfigured = (id: string | undefined, qty: number, desc: string, cat: string): void => {
      if (id && qty > 0) {
        const materialDesc = materialsById.get(id)?.description || desc;
        bom.push({ materialID: id, quantity: qty, description: materialDesc, category: cat, isConfigured: true });
      }
    };

    const pushFlat = (id: string | null | undefined, qty: number | null | undefined, desc: string, cat: string): void => {
      if (id && qty && qty > 0) {
        const materialDesc = materialsById.get(id)?.description || desc;
        bom.push({ materialID: id, quantity: qty, description: materialDesc, category: cat });
      }
    };

    // 1. Module
    if (configuration.module) {
      bom.push({
        materialID: configuration.module,
        quantity: totalModules,
        description: materialsById.get(configuration.module)?.description || 'PV-Module',
        category: 'Module',
        isConfigured: true
      });
    }

    // 2. Wechselrichter + String Plausibilität
    let totalModulesInStrings = 0;
    configuration.inverters.forEach((inv, idx) => {
      if (inv.type && inv.quantity > 0) {
        bom.push({
          materialID: inv.type,
          quantity: inv.quantity,
          description: materialsById.get(inv.type)?.description || `Wechselrichter ${idx + 1}`,
          category: 'Wechselrichter',
          isConfigured: true,
        });
      }
      (inv.strings || []).forEach((s) => (totalModulesInStrings += (parseInt(String(s.modules)) || 0)));
    });

    if (totalModules !== totalModulesInStrings) {
      warnings.push(
        `Die Anzahl der Module in den Strings (${totalModulesInStrings}) stimmt nicht mit der Gesamtanzahl (${totalModules}) überein.`
      );
    }

    // 3. Montagesystem je Dachtyp
    if (configuration.roofType) {
      const mountingCount = Math.ceil(totalModules * (defaults.modulHakenVerhaeltnis ?? 0));
      if (configuration.pvMountingSystem && mountingCount > 0) {
        bom.push({
          materialID: configuration.pvMountingSystem,
          quantity: mountingCount,
          description: materialsById.get(configuration.pvMountingSystem)?.description || 'PV-Montagesystem',
          category: 'Montagesystem',
          isConfigured: true,
        });
      }
      if (configuration.befestigungPVMountingSystem && mountingCount > 0) {
        bom.push({
          materialID: configuration.befestigungPVMountingSystem,
          quantity: mountingCount * 2,
          description: materialsById.get(configuration.befestigungPVMountingSystem)?.description || 'Befestigung',
          category: 'Befestigung',
          isConfigured: true,
        });
      }

      // Klemmen (Endklemmen = Reihen*4, Mittelklemmen = (Module-Reihen)*2)
      const endClampQty = totalRows * 4;
      const midClampQty = (totalModules - totalRows) * 2;

      if (configuration.modulEndklemmen && endClampQty > 0) {
        bom.push({
          materialID: configuration.modulEndklemmen,
          quantity: endClampQty,
          description: materialsById.get(configuration.modulEndklemmen)?.description || 'Modul-Endklemmen',
          category: 'Klemmen',
          isConfigured: true,
        });
      }
      if (configuration.modulMittelklemmen && midClampQty > 0) {
        bom.push({
          materialID: configuration.modulMittelklemmen,
          quantity: midClampQty,
          description: materialsById.get(configuration.modulMittelklemmen)?.description || 'Modul-Mittelklemmen',
          category: 'Klemmen',
          isConfigured: true,
        });
      }

      // Profile/Verbinder/Endkappen für Ziegeldach
      if (configuration.roofType === 'Ziegel' && configuration.profile) {
        const mod = materialsById.get(configuration.module);
        const prof = materialsById.get(configuration.profile);
        const modWidth = parsePVNum(getPVSpec(mod, [PV_SPEC.MODULE_WIDTH_MM]));
        const modLen = parsePVNum(getPVSpec(mod, [PV_SPEC.MODULE_LENGTH_MM]));
        const profLen = parsePVNum(getPVSpec(prof, [PV_SPEC.PROFILE_LENGTH_MM]));

        const endClampWidth = parsePVNum(getPVSpec(materialsById.get(configuration.modulEndklemmen), [PV_SPEC.MODULE_WIDTH_MM]));
        const midClampWidth = parsePVNum(getPVSpec(materialsById.get(configuration.modulMittelklemmen), [PV_SPEC.MODULE_WIDTH_MM]));

        let profileQty = 0;
        let verbinderQty = 0;

        const calcRow = (modulesInRow: number, unitLen: number): { p: number, v: number } => {
          if (!modulesInRow || !profLen) return { p: 0, v: 0 };
          const endQty = 2 * 2;
          const midQty = Math.max(0, (modulesInRow - 1) * 2);
          const lengthTotal = modulesInRow * unitLen * 2 + endQty * 50 + endQty * endClampWidth + midQty * midClampWidth;
          const profilesNeeded = Math.ceil(lengthTotal / profLen);
          const connectors = Math.max(0, profilesNeeded - 1) * 2;
          return { p: profilesNeeded, v: connectors };
        };

        (configuration.querformatRows || []).forEach((r) => {
          const { p, v } = calcRow(parseInt(String(r.modules)) || 0, modLen);
          profileQty += p;
          verbinderQty += v;
        });
        (configuration.hochformatRows || []).forEach((r) => {
          const { p, v } = calcRow(parseInt(String(r.modules)) || 0, modWidth);
          profileQty += p;
          verbinderQty += v;
        });

        if (profileQty > 0) {
          bom.push({
            materialID: configuration.profile,
            quantity: profileQty,
            description: materialsById.get(configuration.profile)?.description || 'Profile',
            category: 'Profile',
            isConfigured: true,
          });
        }
        if (configuration.verbinder && verbinderQty > 0) {
          bom.push({
            materialID: configuration.verbinder,
            quantity: verbinderQty,
            description: materialsById.get(configuration.verbinder)?.description || 'Verbinder',
            category: 'Verbinder',
            isConfigured: true,
          });
        }
        if (configuration.endkappen && endClampQty > 0) {
          bom.push({
            materialID: configuration.endkappen,
            quantity: endClampQty,
            description: materialsById.get(configuration.endkappen)?.description || 'Endkappen',
            category: 'Endkappen',
            isConfigured: true,
          });
        }
      }
    }

    // 4. PV-Stecker je String
    const totalStrings = configuration.inverters.reduce((t, inv) => t + ((inv.strings || []).length), 0);
    if (configuration.pvSteckerMale && totalStrings > 0) {
      bom.push({
        materialID: configuration.pvSteckerMale,
        quantity: totalStrings,
        description: materialsById.get(configuration.pvSteckerMale)?.description || 'PV-Stecker (Male)',
        category: 'PV-Stecker',
        isConfigured: true,
      });
    }
    if (configuration.pvSteckerFemale && totalStrings > 0) {
      bom.push({
        materialID: configuration.pvSteckerFemale,
        quantity: totalStrings,
        description: materialsById.get(configuration.pvSteckerFemale)?.description || 'PV-Stecker (Female)',
        category: 'PV-Stecker',
        isConfigured: true,
      });
    }

    // PV-Kabel (DC)
    if (totalStrings > 0 && defaults.pvKabel > 0 && defaults.defaultPvKabel) {
      bom.push({
        materialID: defaults.defaultPvKabel,
        quantity: totalStrings * defaults.pvKabel * 2,
        description: materialsById.get(defaults.defaultPvKabel)?.description || `PV-Kabel (${defaults.pvKabel}m × 2 × ${totalStrings} Strings)`,
        category: 'PV-Kabel',
      });
    }

    // 5. Optionale Komponenten
    addIfConfigured(configuration.optimizer, configuration.optimizerQty, 'Leistungsoptimierer', 'Optimierer');
    addIfConfigured(configuration.battery, configuration.batteryQty, 'Batteriespeicher', 'Speicher');
    addIfConfigured(configuration.wallbox, configuration.wallboxQty, 'Wallbox', 'Wallbox');
    addIfConfigured(configuration.energiemanagement, configuration.energiemanagementQty, 'Energiemanagement', 'Energiemanagement');
    addIfConfigured(configuration.smartDongle, configuration.smartDongleQty, 'Smart Dongle-WLAN-FE', 'Smart Dongle');

    // 6. Elektrische Komponenten
    addIfConfigured(configuration.sls, configuration.slsQty, 'SLS', 'Elektrische Komponenten');
    addIfConfigured(configuration.tiefenerder, configuration.tiefenerderQty, 'Tiefenerder', 'Elektrische Komponenten');
    addIfConfigured(configuration.kombiableiter, configuration.kombiableiterQty, 'Kombiableiter', 'Elektrische Komponenten');
    addIfConfigured(configuration.zaehlerschrank, configuration.zaehlerschrankQty, 'Zählerschrank', 'Elektrische Komponenten');
    addIfConfigured(configuration.generatoranschlusskasten, configuration.generatoranschlusskastenQty, 'Generatoranschlusskasten', 'Elektrische Komponenten');
    addIfConfigured(configuration.spannungsversorgungAPZ, configuration.spannungsversorgungAPZQty, 'Spannungsversorgung APZ', 'Elektrische Komponenten');

    // Smart Dongle Logik
    let energiemanagementErsetzt = false;
    if (configuration.energiemanagement) {
      const energieMaterial = materials.find((m: Material) => m.id === configuration.energiemanagement);
      if (energieMaterial?.categoryId === PV_CAT.ENERGY_MGMT) {
        const smartDongleErsatz = energieMaterial?.specifications?.[PV_SPEC.ENERGIEMANAGEMENT_SMART_DONGLE_ERSATZ];
        if (smartDongleErsatz === 'Ja') {
          energiemanagementErsetzt = true;
        }
      }
    }

    let autoSmartDongleCount = 0;
    if (!energiemanagementErsetzt) {
      configuration.inverters.forEach(inv => {
        if (inv.type) {
          const inverterMaterial = materials.find((m: Material) => m.id === inv.type);
          const requiresSmartDongle = inverterMaterial?.specifications?.[PV_SPEC.SMART_DONGLE_REQUIRED];
          if (requiresSmartDongle === 'Nein') {
            autoSmartDongleCount += inv.quantity || 1;
          }
        }
      });
    }

    if (autoSmartDongleCount > 0 && !configuration.smartDongle) {
      const smartDongleMaterials = materials.filter((m: Material) => m.categoryId === PV_CAT.SMART_DONGLE);
      const defaultSmartDongle = smartDongleMaterials.find((m: Material) => m.description?.includes('Smart Dongle-WLAN-FE')) || smartDongleMaterials[0];
      if (defaultSmartDongle) {
        bom.push({
          materialID: defaultSmartDongle.id,
          quantity: autoSmartDongleCount,
          description: materialsById.get(defaultSmartDongle.id)?.description || `Smart Dongle-WLAN-FE (automatisch für ${autoSmartDongleCount} WR)`,
          category: 'Smart Dongle',
          isConfigured: true,
        });
      }
    }

    // Erdung Staberder
    let autoErdungStaberderCount = 0;
    if (configuration.tiefenerder) {
      const tiefenerderMaterial = materials.find((m: Material) => m.id === configuration.tiefenerder);
      if (tiefenerderMaterial?.categoryId === PV_CAT.TIEFENERDER) {
        autoErdungStaberderCount = configuration.tiefenerderQty || 1;
      }
    }

    if (autoErdungStaberderCount > 0 && defaults.defaultErdungStaberderMaterial) {
      bom.push({
        materialID: defaults.defaultErdungStaberderMaterial,
        quantity: autoErdungStaberderCount * (defaults.defaultErdungStaberderValue || 1),
        description: materialsById.get(defaults.defaultErdungStaberderMaterial)?.description || `ErdungStaberder (automatisch für ${autoErdungStaberderCount} Tiefenerder × ${defaults.defaultErdungStaberderValue || 1})`,
        category: 'Erdung',
      });
    }

    addIfConfigured(configuration.notstromloesungen, configuration.notstromloesungenQty, 'Notstromlösungen', 'Notstromlösungen');

    // 7. Empfohlene Komponenten
    const inverterCount = configuration.inverters
      .filter((inv) => inv.type && inv.quantity > 0)
      .reduce((t, inv) => t + (parseInt(String(inv.quantity)) || 1), 0);

    if (chosen.inverterBreaker && inverterCount > 0) {
      bom.push({
        materialID: chosen.inverterBreaker,
        quantity: inverterCount,
        description: materialsById.get(chosen.inverterBreaker)?.description || 'Leitungsschutzschalter (Wechselrichter)',
        category: 'Schutzschalter',
        isConfigured: true,
      });
    }
    if (chosen.inverterCable && inverterCount > 0) {
      const cableLength = defaults.defaultCableLength || 5;
      bom.push({
        materialID: chosen.inverterCable,
        quantity: inverterCount * cableLength,
        description: materialsById.get(chosen.inverterCable)?.description || `Mantelleitung (Wechselrichter) - ${cableLength}m pro WR`,
        category: 'Kabel',
        isConfigured: true,
      });
    }
    if (chosen.wallboxBreaker && configuration.wallboxQty > 0) {
      bom.push({
        materialID: chosen.wallboxBreaker,
        quantity: configuration.wallboxQty,
        description: materialsById.get(chosen.wallboxBreaker)?.description || 'Leitungsschutzschalter (Wallbox)',
        category: 'Schutzschalter',
        isConfigured: true,
      });
    }
    if (chosen.wallboxCable && configuration.wallboxQty > 0) {
      const cableLengthWallbox = defaults.defaultCableLength || 5;
      bom.push({
        materialID: chosen.wallboxCable,
        quantity: configuration.wallboxQty * cableLengthWallbox,
        description: materialsById.get(chosen.wallboxCable)?.description || `Mantelleitung (Wallbox) - ${cableLengthWallbox}m pro Wallbox`,
        category: 'Kabel',
        isConfigured: true,
      });
    }
    if (chosen.wallboxRCD && configuration.wallboxQty > 0) {
      bom.push({
        materialID: chosen.wallboxRCD,
        quantity: configuration.wallboxQty,
        description: materialsById.get(chosen.wallboxRCD)?.description || 'FI-Schutzschalter (Wallbox)',
        category: 'Schutzschalter',
        isConfigured: true,
      });
    }
    if (chosen.backupBreaker && configuration.notstromloesungenQty > 0) {
      bom.push({
        materialID: chosen.backupBreaker,
        quantity: configuration.notstromloesungenQty,
        description: materialsById.get(chosen.backupBreaker)?.description || 'Leitungsschutzschalter (Notstrom)',
        category: 'Schutzschalter',
        isConfigured: true,
      });
    }
    if (chosen.backupCable && configuration.notstromloesungenQty > 0) {
      const cableLengthBackup = defaults.defaultCableLength || 5;
      bom.push({
        materialID: chosen.backupCable,
        quantity: configuration.notstromloesungenQty * cableLengthBackup,
        description: materialsById.get(chosen.backupCable)?.description || `Mantelleitung (Notstrom) - ${cableLengthBackup}m pro Gerät`,
        category: 'Kabel',
        isConfigured: true,
      });
    }

    // 8. Standard-/Flat-Rate-Komponenten
    pushFlat(defaults.defaultPotentialausgleich, defaults.potentialausgleichUK, 'Potentialausgleich UK (Standard)', 'Potentialausgleich');
    pushFlat(defaults.defaultKabelmanagement, defaults.kabelmanagementUK, 'Kabelmanagement UK (Standard)', 'Kabelmanagement');

    // Aderendhülsen
    const devicesForAderendhuelsen =
      (chosen.inverterBreaker ? inverterCount : 0) +
      (configuration.wallbox && chosen.wallboxBreaker ? configuration.wallboxQty || 1 : 0) +
      (configuration.battery ? (configuration.batteryQty || 1) : 0) +
      (configuration.notstromloesungen && chosen.backupBreaker ? configuration.notstromloesungenQty || 0 : 0);

    if (defaults.defaultAderendhuelsen10mm2 && defaults.aderendhuelsenProGeraet > 0 && devicesForAderendhuelsen > 0) {
      bom.push({
        materialID: defaults.defaultAderendhuelsen10mm2,
        quantity: devicesForAderendhuelsen * defaults.aderendhuelsenProGeraet,
        description: materialsById.get(defaults.defaultAderendhuelsen10mm2)?.description || `Aderendhülsen 10mm² (${devicesForAderendhuelsen} Geräte × ${defaults.aderendhuelsenProGeraet})`,
        category: 'Aderendhülsen',
      });
    }

    // Kabelschuhe
    pushFlat(defaults.defaultKabelschuh6M8, defaults.kabelschuh6M8, 'Kabelschuh 6xM8 (Flat Rate)', 'Kabelschuh');

    const dev10m6 = (configuration.batteryQty || 0) + inverterCount;
    if (defaults.defaultKabelschuh10M6 && defaults.kabelschuh10M6 > 0 && dev10m6 > 0) {
      bom.push({
        materialID: defaults.defaultKabelschuh10M6,
        quantity: dev10m6 * defaults.kabelschuh10M6,
        description: materialsById.get(defaults.defaultKabelschuh10M6)?.description || `Kabelschuh 10xM6 (${dev10m6} Geräte × ${defaults.kabelschuh10M6})`,
        category: 'Kabelschuh',
      });
    }

    if (defaults.defaultKabelschuh16M6 && defaults.kabelschuh16M6 > 0 && configuration.notstromloesungenQty > 0 && configuration.notstromloesungen === 'MAT-080') {
      bom.push({
        materialID: defaults.defaultKabelschuh16M6,
        quantity: configuration.notstromloesungenQty * defaults.kabelschuh16M6,
        description: materialsById.get(defaults.defaultKabelschuh16M6)?.description || `Kabelschuh 16xM6 (${configuration.notstromloesungenQty} × ${defaults.kabelschuh16M6})`,
        category: 'Kabelschuh',
      });
    }

    pushFlat(defaults.defaultDammstoffduebel, defaults.dammstoffduebel, 'Dämmstoffdübel (Standard)', 'Befestigungsmaterial');
    pushFlat(defaults.defaultDuebelGeruestanker, defaults.duebelGeruestanker, 'Dübel Gerüstanker (Standard)', 'Dübel');

    pushFlat(defaults.defaultAdernleitung10mm2Blau, defaults.adernleitung10mm2Blau, 'Adernleitung 10mm² Blau', 'Kabel');
    pushFlat(defaults.defaultAdernleitung10mm2Schwarz, defaults.adernleitung10mm2Schwarz, 'Adernleitung 10mm² Schwarz', 'Kabel');
    pushFlat(defaults.defaultAdernleitung10mm2GruenGelb, defaults.adernleitung10mm2GruenGelb, 'Adernleitung 10mm² Grün/Gelb', 'Kabel');

    pushFlat(defaults.defaultAdernleitung16mm2Blau, defaults.adernleitung16mm2Blau, 'Adernleitung 16mm² Blau', 'Kabel');
    pushFlat(defaults.defaultAdernleitung16mm2Schwarz, defaults.adernleitung16mm2Schwarz, 'Adernleitung 16mm² Schwarz', 'Kabel');
    pushFlat(defaults.defaultAdernleitung16mm2GruenGelb, defaults.adernleitung16mm2GruenGelb, 'Adernleitung 16mm² Grün/Gelb', 'Kabel');

    pushFlat(defaults.defaultPotentialausgleichsschiene, defaults.potentialausgleichsschiene, 'Potentialausgleichsschiene', 'Potentialausgleich');
    pushFlat(defaults.defaultHauptleitungsabzweigklemme, defaults.hauptleitungsabzweigklemme, 'Hauptleitungsabzweigklemme', 'Klemmen');
    pushFlat(defaults.defaultSammelschienenklemme, defaults.sammelschienenklemme, 'Sammelschienenklemme', 'Klemmen');
    pushFlat(defaults.defaultAbdeckstreifen, defaults.abdeckstreifen, 'Abdeckstreifen', 'Abdeckung');

    if (defaults.defaultRj45Stecker && defaults.rj45Stecker > 0 && configuration.wallboxQty > 0) {
      bom.push({
        materialID: defaults.defaultRj45Stecker,
        quantity: configuration.wallboxQty * defaults.rj45Stecker,
        description: materialsById.get(defaults.defaultRj45Stecker)?.description || `RJ45-Stecker (${configuration.wallboxQty} × ${defaults.rj45Stecker})`,
        category: 'Stecker',
      });
    }

    if (defaults.defaultBefestigungPotentialausgleichUKUK) {
      const qty = defaults.befestigungPotentialausgleichUKUK || 0;
      if (qty > 0) {
        bom.push({
          materialID: defaults.defaultBefestigungPotentialausgleichUKUK,
          quantity: qty,
          description: materialsById.get(defaults.defaultBefestigungPotentialausgleichUKUK)?.description || `BefestigungsmaterialPotentialausgleich UK-UK (${qty})`,
          category: 'Befestigungsmaterial',
        });
      }
    }

    if (defaults.defaultBefestigungLeistungsoptimierer && configuration.optimizerQty > 0) {
      const qty = defaults.befestigungLeistungsoptimierer || 0;
      const totalQty = qty * configuration.optimizerQty;
      if (totalQty > 0) {
        bom.push({
          materialID: defaults.defaultBefestigungLeistungsoptimierer,
          quantity: totalQty,
          description: materialsById.get(defaults.defaultBefestigungLeistungsoptimierer)?.description || `Befestigung Leistungsoptimierer (${configuration.optimizerQty} × ${qty})`,
          category: 'Befestigungsmaterial',
        });
      }
    }

    if (defaults.defaultPotentialausgleichUKUK && defaults.potentialausgleichUK > 0) {
      bom.push({
        materialID: defaults.defaultPotentialausgleichUKUK,
        quantity: defaults.potentialausgleichUK,
        description: materialsById.get(defaults.defaultPotentialausgleichUKUK)?.description || `Potentialausgleich UK-UK (${defaults.potentialausgleichUK}m)`,
        category: 'Potentialausgleich',
      });
    }
    if (defaults.defaultPotentialausgleichHESUK && defaults.potentialausgleichHESUK > 0) {
      bom.push({
        materialID: defaults.defaultPotentialausgleichHESUK,
        quantity: defaults.potentialausgleichHESUK,
        description: materialsById.get(defaults.defaultPotentialausgleichHESUK)?.description || `Potentialausgleich HES-UK (${defaults.potentialausgleichHESUK}m)`,
        category: 'Erdkabel',
      });
    }

    if (defaults.defaultSchutzleiterPV && defaults.schutzleiterPV > 0) {
      const devs = inverterCount + (configuration.batteryQty || 0);
      if (devs > 0) {
        bom.push({
          materialID: defaults.defaultSchutzleiterPV,
          quantity: devs * defaults.schutzleiterPV,
          description: materialsById.get(defaults.defaultSchutzleiterPV)?.description || `SchutzleiterPV (${devs} Geräte × ${defaults.schutzleiterPV}m)`,
          category: 'Mantelleitung',
        });
      }
    }

    pushFlat(defaults.defaultErdungHES, defaults.erdungHES, 'ErdungHES', 'Mantelleitung');
    pushFlat(defaults.defaultDuebel14, defaults.duebel14, '14mm Dübel (Standard)', 'Dübel');

    // Kabelkanal Befestigungsmaterial
    if (defaults.kabelkanalBefestigungsmaterial > 0 && defaults.kabelkanalStandard > 0) {
      const total = Math.ceil(defaults.kabelkanalStandard * defaults.kabelkanalBefestigungsmaterial);
      if (defaults.defaultKabelkanalSchrauben) {
        bom.push({
          materialID: defaults.defaultKabelkanalSchrauben,
          quantity: total,
          description: materialsById.get(defaults.defaultKabelkanalSchrauben)?.description || `Kabelkanal Schrauben (${defaults.kabelkanalStandard}m × ${defaults.kabelkanalBefestigungsmaterial})`,
          category: 'Schrauben',
        });
      }
      if (defaults.defaultKabelkanalDuebel) {
        bom.push({
          materialID: defaults.defaultKabelkanalDuebel,
          quantity: total,
          description: materialsById.get(defaults.defaultKabelkanalDuebel)?.description || `Kabelkanal Dübel (${defaults.kabelkanalStandard}m × ${defaults.kabelkanalBefestigungsmaterial})`,
          category: 'Dübel',
        });
      }
    }

    // PV-Geräte Befestigungsmaterial
    if (defaults.pvGeraeteBefestigungsmaterial > 0) {
      const totalPvDevices =
        inverterCount +
        (configuration.batteryQty || 0) +
        (configuration.wallbox ? 1 : 0) +
        (configuration.notstromloesungenQty || 0);
      const totalQty = totalPvDevices * defaults.pvGeraeteBefestigungsmaterial;

      if (defaults.defaultPvGeraeteSchrauben && totalQty > 0) {
        bom.push({
          materialID: defaults.defaultPvGeraeteSchrauben,
          quantity: totalQty,
          description: materialsById.get(defaults.defaultPvGeraeteSchrauben)?.description || `PV-Geräte Schrauben (${totalPvDevices} × ${defaults.pvGeraeteBefestigungsmaterial})`,
          category: 'Schrauben',
        });
      }
      if (defaults.defaultPvGeraeteDuebel && totalQty > 0) {
        bom.push({
          materialID: defaults.defaultPvGeraeteDuebel,
          quantity: totalQty,
          description: materialsById.get(defaults.defaultPvGeraeteDuebel)?.description || `PV-Geräte Dübel (${totalPvDevices} × ${defaults.pvGeraeteBefestigungsmaterial})`,
          category: 'Dübel',
        });
      }
    }

    // Flex-/Installationsrohre & Schellen
    const pushLen = (id: string | null | undefined, qty: number | null | undefined, name: string): void => {
      if (!id || !qty) return;
      const materialDesc = materialsById.get(id)?.description || `${name} (${qty}${name.includes('Stück') ? '' : 'm'})`;
      pushFlat(id, qty, materialDesc, 'Kabelverlegung');
    };
    pushLen(defaults.defaultFlexrohrStandard, defaults.flexrohr, 'Flexrohr Standard');
    pushLen(defaults.defaultInstallationsrohr, defaults.installationsrohr, 'Installationsrohr');
    pushLen(defaults.defaultRohrschelleStandard, defaults.rohrschelle, 'Rohrschelle (Stück)');
    pushLen(defaults.defaultFlexrohrGross, defaults.flexrohr, 'Flexrohr Groß');
    pushLen(defaults.defaultRohrschelleGross, defaults.rohrschelle, 'Rohrschelle Groß (Stück)');
    pushLen(defaults.defaultInstallationsrohrOutdoor, defaults.installationsrohrOutdoor, 'Installationsrohr Outdoor');
    pushLen(defaults.defaultRohrschelleOutdoor, defaults.rohrschelleOutdoor, 'Rohrschelle Outdoor (Stück)');
    pushLen(defaults.defaultMuffeOutdoor, defaults.muffeOutdoor, 'Muffe Outdoor (Stück)');

    // Aufkleber
    const hasSpeicher = configuration.battery && configuration.batteryQty > 0;
    const hasNotstrom = configuration.notstromloesungen && configuration.notstromloesungenQty > 0;
    if (hasNotstrom && defaults.defaultAufkleberPVMitNotstrom) {
      bom.push({
        materialID: defaults.defaultAufkleberPVMitNotstrom,
        quantity: 1,
        description: materialsById.get(defaults.defaultAufkleberPVMitNotstrom)?.description || 'Aufkleber PV mit Notstrom',
        category: 'Aufkleber',
        isConfigured: true,
      });
    } else if (hasSpeicher && defaults.defaultAufkleberPVMitSpeicher) {
      bom.push({
        materialID: defaults.defaultAufkleberPVMitSpeicher,
        quantity: 1,
        description: materialsById.get(defaults.defaultAufkleberPVMitSpeicher)?.description || 'Aufkleber PV mit Speicher',
        category: 'Aufkleber',
        isConfigured: true,
      });
    } else if (defaults.defaultAufkleberPV) {
      bom.push({
        materialID: defaults.defaultAufkleberPV,
        quantity: 1,
        description: materialsById.get(defaults.defaultAufkleberPV)?.description || 'Aufkleber PV',
        category: 'Aufkleber',
        isConfigured: true,
      });
    }

    // BOM konsolidieren
    const consolidatedBom: PVBOMItem[] = [];
    const bomMap = new Map<string, PVBOMItem>();

    bom.forEach((item: PVBOMItem) => {
      if (bomMap.has(item.materialID)) {
        const existing = bomMap.get(item.materialID)!;
        existing.quantity += item.quantity;
        if (existing.description !== item.description) {
          if (item.description.length > existing.description.length) {
            existing.description = item.description;
          }
        }
      } else {
        bomMap.set(item.materialID, { ...item });
      }
    });

    bomMap.forEach((item: PVBOMItem) => {
      consolidatedBom.push(item);
    });

    return { bom: consolidatedBom, warnings };
  }, [configuration, layoutTotals, materials, materialsById, chosen, defaults]);
};

export default useBOMCalculation;
