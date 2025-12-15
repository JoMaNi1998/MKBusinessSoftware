/**
 * usePVDefaults Hook
 *
 * Lädt und verwaltet alle PV-Standardeinstellungen aus Firebase
 * Diese Einstellungen werden für die automatische BOM-Berechnung verwendet
 */

import { useState, useEffect } from 'react';
import { FirebaseService } from '../../../services/firebaseService';

/**
 * Hook zum Laden der PV-Default-Einstellungen
 * @returns {Object} - Alle Default-Variablen und Ladestatus
 */
export const usePVDefaults = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Basis pvDefaults Objekt
  const [pvDefaults, setPvDefaults] = useState({});

  // Modulhaken Verhältnis & Kabellänge
  const [modulHakenVerhaeltnis, setModulHakenVerhaeltnis] = useState(null);
  const [defaultCableLength, setDefaultCableLength] = useState(10);

  // Potentialausgleich
  const [potentialausgleichUK, setPotentialausgleichUK] = useState(null);
  const [defaultPotentialausgleich, setDefaultPotentialausgleich] = useState(null);

  // Kabelmanagement
  const [kabelmanagementUK, setKabelmanagementUK] = useState(null);
  const [defaultKabelmanagement, setDefaultKabelmanagement] = useState(null);

  // Aderendhülsen
  const [aderendhuelsenProGeraet, setAderendhuelsenProGeraet] = useState(null);

  // Kabelkanal
  const [kabelkanalStandard, setKabelkanalStandard] = useState(null);
  const [defaultKabelkanalStandard, setDefaultKabelkanalStandard] = useState(null);
  const [kabelkanalGross, setKabelkanalGross] = useState(null);
  const [defaultKabelkanalGross, setDefaultKabelkanalGross] = useState(null);

  // PV-Kabel
  const [pvKabel, setPvKabel] = useState(null);
  const [defaultPvKabel, setDefaultPvKabel] = useState(null);

  // Kabelschuhe
  const [kabelschuh6M8, setKabelschuh6M8] = useState(null);
  const [kabelschuh10M6, setKabelschuh10M6] = useState(null);
  const [kabelschuh16M6, setKabelschuh16M6] = useState(null);
  const [defaultKabelschuh6M8, setDefaultKabelschuh6M8] = useState(null);
  const [defaultKabelschuh10M6, setDefaultKabelschuh10M6] = useState(null);
  const [defaultKabelschuh16M6, setDefaultKabelschuh16M6] = useState(null);

  // Aderendhülsen Material
  const [defaultAderendhuelsen10mm2, setDefaultAderendhuelsen10mm2] = useState(null);
  const [defaultAderendhuelsen16mm2, setDefaultAderendhuelsen16mm2] = useState(null);

  // Befestigung
  const [befestigungPotentialausgleichUKUK, setBefestigungPotentialausgleichUKUK] = useState(null);
  const [defaultBefestigungPotentialausgleichUKUK, setDefaultBefestigungPotentialausgleichUKUK] = useState(null);
  const [befestigungLeistungsoptimierer, setBefestigungLeistungsoptimierer] = useState(null);
  const [defaultBefestigungLeistungsoptimierer, setDefaultBefestigungLeistungsoptimierer] = useState(null);

  // Potentialausgleich HES
  const [potentialausgleichHESUK, setPotentialausgleichHESUK] = useState(null);
  const [defaultPotentialausgleichUKUK, setDefaultPotentialausgleichUKUK] = useState(null);
  const [defaultPotentialausgleichHESUK, setDefaultPotentialausgleichHESUK] = useState(null);

  // Schutzleiter
  const [schutzleiterPV, setSchutzleiterPV] = useState(null);
  const [defaultSchutzleiterPV, setDefaultSchutzleiterPV] = useState(null);

  // Erdung
  const [erdungHES, setErdungHES] = useState(null);
  const [duebel14, setDuebel14] = useState(null);
  const [defaultDuebel14, setDefaultDuebel14] = useState(null);

  // Kabelkanal Befestigung
  const [kabelkanalBefestigungsmaterial, setKabelkanalBefestigungsmaterial] = useState(null);
  const [pvGeraeteBefestigungsmaterial, setPvGeraeteBefestigungsmaterial] = useState(null);
  const [defaultKabelkanalSchrauben, setDefaultKabelkanalSchrauben] = useState(null);
  const [defaultKabelkanalDuebel, setDefaultKabelkanalDuebel] = useState(null);
  const [defaultPvGeraeteSchrauben, setDefaultPvGeraeteSchrauben] = useState(null);
  const [defaultPvGeraeteDuebel, setDefaultPvGeraeteDuebel] = useState(null);

  // Rohre & Rohrschellen
  const [flexrohr, setFlexrohr] = useState(null);
  const [installationsrohr, setInstallationsrohr] = useState(null);
  const [rohrschelle, setRohrschelle] = useState(null);
  const [rohrschelleBefestigungsmaterial, setRohrschelleBefestigungsmaterial] = useState(null);
  const [defaultSchraubenRohrschelle, setDefaultSchraubenRohrschelle] = useState(null);
  const [defaultInstallationsrohr, setDefaultInstallationsrohr] = useState(null);
  const [defaultFlexrohrStandard, setDefaultFlexrohrStandard] = useState(null);
  const [defaultFlexrohrGross, setDefaultFlexrohrGross] = useState(null);
  const [defaultRohrschelleStandard, setDefaultRohrschelleStandard] = useState(null);
  const [defaultRohrschelleGross, setDefaultRohrschelleGross] = useState(null);

  // Outdoor
  const [installationsrohrOutdoor, setInstallationsrohrOutdoor] = useState(null);
  const [rohrschelleOutdoor, setRohrschelleOutdoor] = useState(null);
  const [muffeOutdoor, setMuffeOutdoor] = useState(null);
  const [defaultInstallationsrohrOutdoor, setDefaultInstallationsrohrOutdoor] = useState(null);
  const [defaultRohrschelleOutdoor, setDefaultRohrschelleOutdoor] = useState(null);
  const [defaultMuffeOutdoor, setDefaultMuffeOutdoor] = useState(null);

  // Dübel
  const [dammstoffduebel, setDammstoffduebel] = useState(null);
  const [defaultDammstoffduebel, setDefaultDammstoffduebel] = useState(null);
  const [duebelGeruestanker, setDuebelGeruestanker] = useState(null);
  const [defaultDuebelGeruestanker, setDefaultDuebelGeruestanker] = useState(null);

  // Adernleitung 10mm²
  const [adernleitung10mm2Blau, setAdernleitung10mm2Blau] = useState(null);
  const [adernleitung10mm2Schwarz, setAdernleitung10mm2Schwarz] = useState(null);
  const [adernleitung10mm2GruenGelb, setAdernleitung10mm2GruenGelb] = useState(null);
  const [defaultAdernleitung10mm2Blau, setDefaultAdernleitung10mm2Blau] = useState(null);
  const [defaultAdernleitung10mm2Schwarz, setDefaultAdernleitung10mm2Schwarz] = useState(null);
  const [defaultAdernleitung10mm2GruenGelb, setDefaultAdernleitung10mm2GruenGelb] = useState(null);

  // Adernleitung 16mm²
  const [adernleitung16mm2Blau, setAdernleitung16mm2Blau] = useState(null);
  const [adernleitung16mm2Schwarz, setAdernleitung16mm2Schwarz] = useState(null);
  const [adernleitung16mm2GruenGelb, setAdernleitung16mm2GruenGelb] = useState(null);
  const [defaultAdernleitung16mm2Blau, setDefaultAdernleitung16mm2Blau] = useState(null);
  const [defaultAdernleitung16mm2Schwarz, setDefaultAdernleitung16mm2Schwarz] = useState(null);
  const [defaultAdernleitung16mm2GruenGelb, setDefaultAdernleitung16mm2GruenGelb] = useState(null);

  // Sonstiges
  const [potentialausgleichsschiene, setPotentialausgleichsschiene] = useState(null);
  const [hauptleitungsabzweigklemme, setHauptleitungsabzweigklemme] = useState(null);
  const [sammelschienenklemme, setSammelschienenklemme] = useState(null);
  const [abdeckstreifen, setAbdeckstreifen] = useState(null);
  const [rj45Stecker, setRj45Stecker] = useState(null);
  const [defaultPotentialausgleichsschiene, setDefaultPotentialausgleichsschiene] = useState(null);
  const [defaultHauptleitungsabzweigklemme, setDefaultHauptleitungsabzweigklemme] = useState(null);
  const [defaultSammelschienenklemme, setDefaultSammelschienenklemme] = useState(null);
  const [defaultAbdeckstreifen, setDefaultAbdeckstreifen] = useState(null);
  const [defaultRj45Stecker, setDefaultRj45Stecker] = useState(null);

  // Aufkleber
  const [defaultAufkleberPV, setDefaultAufkleberPV] = useState(null);
  const [defaultAufkleberPVMitSpeicher, setDefaultAufkleberPVMitSpeicher] = useState(null);
  const [defaultAufkleberPVMitNotstrom, setDefaultAufkleberPVMitNotstrom] = useState(null);

  // Stromwandler
  const [defaultStromwandlerValue, setDefaultStromwandlerValue] = useState(1);
  const [defaultStromwandlerMaterial, setDefaultStromwandlerMaterial] = useState(null);

  // Erdung HES
  const [defaultErdungHES, setDefaultErdungHES] = useState(null);

  // Erdung Staberder
  const [defaultErdungStaberderValue, setDefaultErdungStaberderValue] = useState(1);
  const [defaultErdungStaberderMaterial, setDefaultErdungStaberderMaterial] = useState(null);

  // Defaults laden
  useEffect(() => {
    const loadPvDefaults = async () => {
      try {
        setIsLoading(true);
        const defaultsData = await FirebaseService.getDocuments('pv-defaults');
        if (!defaultsData?.length) {
          setIsLoading(false);
          return;
        }
        const d = defaultsData[0];

        // Store complete pvDefaults for recommendations
        setPvDefaults(d);

        // Minimal-invasive Übernahme (wie in der Vorlage)
        setModulHakenVerhaeltnis(d.modulHakenVerhaeltnis ?? null);
        setDefaultCableLength(d.defaultCableLength ?? 10);

        setPotentialausgleichUK(d.PotentialausgleichUK ?? null);
        setDefaultPotentialausgleich(d.defaultPotentialausgleich ?? null);

        setKabelmanagementUK(d.KabelmanagementUK ?? null);
        setDefaultKabelmanagement(d.defaultKabelmanagement ?? null);

        setAderendhuelsenProGeraet(d.AderendhuelsenProGeraet ?? null);

        setKabelkanalStandard(d.KabelkanalStandard ?? null);
        setDefaultKabelkanalStandard(d.defaultKabelkanalStandard ?? null);

        setKabelkanalGross(d.KabelkanalGross ?? null);
        setDefaultKabelkanalGross(d.defaultKabelkanalGross ?? null);

        setPvKabel(d.PvKabel ?? null);
        setDefaultPvKabel(d.defaultPvKabel ?? null);

        setKabelschuh6M8(d.Kabelschuh6M8 ?? null);
        setKabelschuh10M6(d.Kabelschuh10M6 ?? null);
        setKabelschuh16M6(d.Kabelschuh16M6 ?? null);

        setDefaultKabelschuh6M8(d.defaultKabelschuh6M8 ?? null);
        setDefaultKabelschuh10M6(d.defaultKabelschuh10M6 ?? null);
        setDefaultKabelschuh16M6(d.defaultKabelschuh16M6 ?? null);

        setDefaultAderendhuelsen10mm2(d.defaultAderendhuelsen10mm2 ?? null);
        setDefaultAderendhuelsen16mm2(d.defaultAderendhuelsen16mm2 ?? null);

        setBefestigungPotentialausgleichUKUK(d.BefestigungPotentialausgleichUKUK ?? null);
        setDefaultBefestigungPotentialausgleichUKUK(d.defaultBefestigungPotentialausgleichUKUK ?? null);
        setBefestigungLeistungsoptimierer(d.BefestigungLeistungsoptimierer ?? null);
        setDefaultBefestigungLeistungsoptimierer(d.defaultBefestigungLeistungsoptimierer ?? null);

        setPotentialausgleichHESUK(d.PotentialausgleichHESUK ?? null);
        setDefaultPotentialausgleichUKUK(d.defaultPotentialausgleichUKUK ?? null);
        setDefaultPotentialausgleichHESUK(d.defaultPotentialausgleichHESUK ?? null);

        setSchutzleiterPV(d.SchutzleiterPV ?? null);
        setDefaultSchutzleiterPV(d.defaultSchutzleiterPV ?? null);

        setErdungHES(d.ErdungHES ?? null);
        setDuebel14(d.Duebel14 ?? null);
        setDefaultDuebel14(d.defaultDuebel14 ?? null);

        setKabelkanalBefestigungsmaterial(d.KabelkanalBefestigungsmaterial ?? null);
        setPvGeraeteBefestigungsmaterial(d.PvGeraeteBefestigungsmaterial ?? null);
        setDefaultKabelkanalSchrauben(d.defaultKabelkanalSchrauben ?? null);
        setDefaultKabelkanalDuebel(d.defaultKabelkanalDuebel ?? null);
        setDefaultPvGeraeteSchrauben(d.defaultPvGeraeteSchrauben ?? null);
        setDefaultPvGeraeteDuebel(d.defaultPvGeraeteDuebel ?? null);

        setFlexrohr(d.Flexrohr ?? null);
        setInstallationsrohr(d.Installationsrohr ?? null);
        setRohrschelle(d.Rohrschelle ?? null);
        setRohrschelleBefestigungsmaterial(d.RohrschelleBefestigungsmaterial ?? null);
        setDefaultSchraubenRohrschelle(d.defaultSchraubenRohrschelle ?? null);
        setDefaultInstallationsrohr(d.defaultInstallationsrohr ?? null);
        setDefaultFlexrohrStandard(d.defaultFlexrohrStandard ?? null);
        setDefaultFlexrohrGross(d.defaultFlexrohrGross ?? null);
        setDefaultRohrschelleStandard(d.defaultRohrschelleStandard ?? null);
        setDefaultRohrschelleGross(d.defaultRohrschelleGross ?? null);

        setInstallationsrohrOutdoor(d.InstallationsrohrOutdoor ?? null);
        setRohrschelleOutdoor(d.RohrschelleOutdoor ?? null);
        setMuffeOutdoor(d.MuffeOutdoor ?? null);
        setDefaultInstallationsrohrOutdoor(d.defaultInstallationsrohrOutdoor ?? null);
        setDefaultRohrschelleOutdoor(d.defaultRohrschelleOutdoor ?? null);
        setDefaultMuffeOutdoor(d.defaultMuffeOutdoor ?? null);

        setDammstoffduebel(d.Dammstoffduebel ?? null);
        setDefaultDammstoffduebel(d.defaultDammstoffduebel ?? null);

        setDuebelGeruestanker(d.DuebelGeruestanker ?? null);
        setDefaultDuebelGeruestanker(d.defaultDuebelGeruestanker ?? null);

        setAdernleitung10mm2Blau(d.Adernleitung10mm2Blau ?? null);
        setAdernleitung10mm2Schwarz(d.Adernleitung10mm2Schwarz ?? null);
        setAdernleitung10mm2GruenGelb(d.Adernleitung10mm2GruenGelb ?? null);

        setAdernleitung16mm2Blau(d.Adernleitung16mm2Blau ?? null);
        setAdernleitung16mm2Schwarz(d.Adernleitung16mm2Schwarz ?? null);
        setAdernleitung16mm2GruenGelb(d.Adernleitung16mm2GruenGelb ?? null);

        setDefaultAdernleitung10mm2Blau(d.defaultAdernleitung10mm2Blau ?? null);
        setDefaultAdernleitung10mm2Schwarz(d.defaultAdernleitung10mm2Schwarz ?? null);
        setDefaultAdernleitung10mm2GruenGelb(d.defaultAdernleitung10mm2GruenGelb ?? null);
        setDefaultAdernleitung16mm2Blau(d.defaultAdernleitung16mm2Blau ?? null);
        setDefaultAdernleitung16mm2Schwarz(d.defaultAdernleitung16mm2Schwarz ?? null);
        setDefaultAdernleitung16mm2GruenGelb(d.defaultAdernleitung16mm2GruenGelb ?? null);

        setPotentialausgleichsschiene(d.Potentialausgleichsschiene ?? null);
        setHauptleitungsabzweigklemme(d.Hauptleitungsabzweigklemme ?? null);
        setSammelschienenklemme(d.Sammelschienenklemme ?? null);
        setAbdeckstreifen(d.Abdeckstreifen ?? null);
        setRj45Stecker(d.RJ45Stecker ?? null);

        setDefaultPotentialausgleichsschiene(d.defaultPotentialausgleichsschiene ?? null);
        setDefaultHauptleitungsabzweigklemme(d.defaultHauptleitungsabzweigklemme ?? null);
        setDefaultSammelschienenklemme(d.defaultSammelschienenklemme ?? null);
        setDefaultAbdeckstreifen(d.defaultAbdeckstreifen ?? null);
        setDefaultRj45Stecker(d.defaultRJ45Stecker ?? null);

        setDefaultAufkleberPV(d.defaultAufkleberPV ?? null);
        setDefaultAufkleberPVMitSpeicher(d.defaultAufkleberPVMitSpeicher ?? null);
        setDefaultAufkleberPVMitNotstrom(d.defaultAufkleberPVMitNotstrom ?? null);

        setDefaultStromwandlerValue(d.defaultStromwandlerValue ?? 1);
        setDefaultStromwandlerMaterial(d.defaultStromwandler ?? null);

        setDefaultErdungHES(d.defaultErdungHES ?? null);

        setDefaultErdungStaberderValue(d.defaultErdungStaberderValue ?? 1);
        setDefaultErdungStaberderMaterial(d.defaultErdungStaberder ?? null);

        setIsLoading(false);
      } catch (e) {
        console.error('Fehler beim Laden der PV-Standardeinstellungen:', e);
        setError(e.message);
        setIsLoading(false);
      }
    };

    loadPvDefaults();
  }, []);

  // Funktion um Default-Konfiguration anzuwenden
  const getDefaultConfiguration = () => {
    return {
      module: pvDefaults.defaultModule || '',
      roofType: pvDefaults.defaultRoofType || '',
      pvMountingSystem: pvDefaults.defaultPvMountingSystem || '',
      befestigungPVMountingSystem: pvDefaults.defaultBefestigungPVMountingSystem || '',
      modulEndklemmen: pvDefaults.defaultModulEndklemmen || '',
      modulMittelklemmen: pvDefaults.defaultModulMittelklemmen || '',
      pvSteckerMale: pvDefaults.defaultPvSteckerMale || '',
      pvSteckerFemale: pvDefaults.defaultPvSteckerFemale || '',
      profile: pvDefaults.defaultProfile || '',
      verbinder: pvDefaults.defaultVerbinder || '',
      endkappen: pvDefaults.defaultEndkappen || '',
      defaultInverter: pvDefaults.defaultInverter || '',
    };
  };

  return {
    isLoading,
    error,
    pvDefaults,
    getDefaultConfiguration,

    // Basis
    modulHakenVerhaeltnis,
    defaultCableLength,

    // Potentialausgleich
    potentialausgleichUK,
    defaultPotentialausgleich,
    potentialausgleichHESUK,
    defaultPotentialausgleichUKUK,
    defaultPotentialausgleichHESUK,

    // Kabelmanagement
    kabelmanagementUK,
    defaultKabelmanagement,

    // Aderendhülsen
    aderendhuelsenProGeraet,
    defaultAderendhuelsen10mm2,
    defaultAderendhuelsen16mm2,

    // Kabelkanal
    kabelkanalStandard,
    defaultKabelkanalStandard,
    kabelkanalGross,
    defaultKabelkanalGross,

    // PV-Kabel
    pvKabel,
    defaultPvKabel,

    // Kabelschuhe
    kabelschuh6M8,
    kabelschuh10M6,
    kabelschuh16M6,
    defaultKabelschuh6M8,
    defaultKabelschuh10M6,
    defaultKabelschuh16M6,

    // Befestigung
    befestigungPotentialausgleichUKUK,
    defaultBefestigungPotentialausgleichUKUK,
    befestigungLeistungsoptimierer,
    defaultBefestigungLeistungsoptimierer,

    // Schutzleiter
    schutzleiterPV,
    defaultSchutzleiterPV,

    // Erdung
    erdungHES,
    duebel14,
    defaultDuebel14,
    defaultErdungHES,

    // Kabelkanal Befestigung
    kabelkanalBefestigungsmaterial,
    pvGeraeteBefestigungsmaterial,
    defaultKabelkanalSchrauben,
    defaultKabelkanalDuebel,
    defaultPvGeraeteSchrauben,
    defaultPvGeraeteDuebel,

    // Rohre
    flexrohr,
    installationsrohr,
    rohrschelle,
    rohrschelleBefestigungsmaterial,
    defaultSchraubenRohrschelle,
    defaultInstallationsrohr,
    defaultFlexrohrStandard,
    defaultFlexrohrGross,
    defaultRohrschelleStandard,
    defaultRohrschelleGross,

    // Outdoor
    installationsrohrOutdoor,
    rohrschelleOutdoor,
    muffeOutdoor,
    defaultInstallationsrohrOutdoor,
    defaultRohrschelleOutdoor,
    defaultMuffeOutdoor,

    // Dübel
    dammstoffduebel,
    defaultDammstoffduebel,
    duebelGeruestanker,
    defaultDuebelGeruestanker,

    // Adernleitung 10mm²
    adernleitung10mm2Blau,
    adernleitung10mm2Schwarz,
    adernleitung10mm2GruenGelb,
    defaultAdernleitung10mm2Blau,
    defaultAdernleitung10mm2Schwarz,
    defaultAdernleitung10mm2GruenGelb,

    // Adernleitung 16mm²
    adernleitung16mm2Blau,
    adernleitung16mm2Schwarz,
    adernleitung16mm2GruenGelb,
    defaultAdernleitung16mm2Blau,
    defaultAdernleitung16mm2Schwarz,
    defaultAdernleitung16mm2GruenGelb,

    // Sonstiges
    potentialausgleichsschiene,
    hauptleitungsabzweigklemme,
    sammelschienenklemme,
    abdeckstreifen,
    rj45Stecker,
    defaultPotentialausgleichsschiene,
    defaultHauptleitungsabzweigklemme,
    defaultSammelschienenklemme,
    defaultAbdeckstreifen,
    defaultRj45Stecker,

    // Aufkleber
    defaultAufkleberPV,
    defaultAufkleberPVMitSpeicher,
    defaultAufkleberPVMitNotstrom,

    // Stromwandler
    defaultStromwandlerValue,
    defaultStromwandlerMaterial,

    // Erdung Staberder
    defaultErdungStaberderValue,
    defaultErdungStaberderMaterial,

    // Kombiniertes Defaults-Objekt für useBOMCalculation
    defaults: {
      modulHakenVerhaeltnis,
      defaultCableLength,
      potentialausgleichUK,
      defaultPotentialausgleich,
      potentialausgleichHESUK,
      defaultPotentialausgleichUKUK,
      defaultPotentialausgleichHESUK,
      kabelmanagementUK,
      defaultKabelmanagement,
      aderendhuelsenProGeraet,
      defaultAderendhuelsen10mm2,
      defaultAderendhuelsen16mm2,
      kabelkanalStandard,
      defaultKabelkanalStandard,
      kabelkanalGross,
      defaultKabelkanalGross,
      pvKabel,
      defaultPvKabel,
      kabelschuh6M8,
      kabelschuh10M6,
      kabelschuh16M6,
      defaultKabelschuh6M8,
      defaultKabelschuh10M6,
      defaultKabelschuh16M6,
      befestigungPotentialausgleichUKUK,
      defaultBefestigungPotentialausgleichUKUK,
      befestigungLeistungsoptimierer,
      defaultBefestigungLeistungsoptimierer,
      schutzleiterPV,
      defaultSchutzleiterPV,
      erdungHES,
      duebel14,
      defaultDuebel14,
      defaultErdungHES,
      kabelkanalBefestigungsmaterial,
      pvGeraeteBefestigungsmaterial,
      defaultKabelkanalSchrauben,
      defaultKabelkanalDuebel,
      defaultPvGeraeteSchrauben,
      defaultPvGeraeteDuebel,
      flexrohr,
      installationsrohr,
      rohrschelle,
      rohrschelleBefestigungsmaterial,
      defaultSchraubenRohrschelle,
      defaultInstallationsrohr,
      defaultFlexrohrStandard,
      defaultFlexrohrGross,
      defaultRohrschelleStandard,
      defaultRohrschelleGross,
      installationsrohrOutdoor,
      rohrschelleOutdoor,
      muffeOutdoor,
      defaultInstallationsrohrOutdoor,
      defaultRohrschelleOutdoor,
      defaultMuffeOutdoor,
      dammstoffduebel,
      defaultDammstoffduebel,
      duebelGeruestanker,
      defaultDuebelGeruestanker,
      adernleitung10mm2Blau,
      adernleitung10mm2Schwarz,
      adernleitung10mm2GruenGelb,
      defaultAdernleitung10mm2Blau,
      defaultAdernleitung10mm2Schwarz,
      defaultAdernleitung10mm2GruenGelb,
      adernleitung16mm2Blau,
      adernleitung16mm2Schwarz,
      adernleitung16mm2GruenGelb,
      defaultAdernleitung16mm2Blau,
      defaultAdernleitung16mm2Schwarz,
      defaultAdernleitung16mm2GruenGelb,
      potentialausgleichsschiene,
      hauptleitungsabzweigklemme,
      sammelschienenklemme,
      abdeckstreifen,
      rj45Stecker,
      defaultPotentialausgleichsschiene,
      defaultHauptleitungsabzweigklemme,
      defaultSammelschienenklemme,
      defaultAbdeckstreifen,
      defaultRj45Stecker,
      defaultAufkleberPV,
      defaultAufkleberPVMitSpeicher,
      defaultAufkleberPVMitNotstrom,
      defaultStromwandlerValue,
      defaultStromwandlerMaterial,
      defaultErdungStaberderValue,
      defaultErdungStaberderMaterial,
    },
  };
};

export default usePVDefaults;
