import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Plus,
  Minus,
  Settings,
  RotateCcw,
  Hash,
  Search,
  Grid,
  Wrench,
  Zap,
  Battery,
  Plug,
  Sun,
  Building,
  Layers,
  Target,
  Anchor,
  Home,
} from 'lucide-react';

import { useMaterials } from '../context/MaterialContext';
import { useCustomers } from '../context/CustomerContext';
import { useProjects } from '../context/ProjectContext';
import { useBookings } from '../context/BookingContext';
import { useNotification } from '../context/NotificationContext';
import { FirebaseService } from '../services/firebaseService';
import BaseModal from './BaseModal';

/* -------------------------------------------
 *  Kategorie-IDs & Spec-Keys (einheitliche Quelle)
 * ------------------------------------------- */
const CAT = {
  MODULES: '1uOB8fBkWQYkPS0LOZxk',
  INVERTERS: 'yGGCjoiZrmbabhCqWSyS',
  WALLBOXES: 'sBUZ1B1IRinmuSPZNh7o',
  BATTERIES: 'CSVTWpEA5NSAIOZVyHTq',
  PV_MOUNTING: 'mHvC6RpkDKFFCqoZjZcW',
  CLAMPS: 'WGfZvGlkrPiTDUC3SqL2',
  CONNECTORS: 'bArNeyutPDFXhpPBTsOw',
  PROFILES: 'aAhBqQFaynXXCf42Ws1H',
  OPTIMIZERS: 'a6eKXo8lJX2RU7Ny8rDW',
  ENERGY_MGMT: 'xcd6LYhzBSV2u6r3lvTH',
  BACKUP_BOXES: 'MhQf6qQNd5I08mqloE7R',
  CIRCUIT_BREAKERS: 'mMfrQeYNHrQJVT4hLAZs',
  CABLES: 'BKL1zeVvHbOvtrD8udg9',
  RCDS: 'cpCa7ZqKiQfX37GvQVQn',
  POTENTIALAUSGLEICH: 'YsKVAMcq3UBWfpEUmuYm',
  KABELMANAGEMENT: 'QVChNHri0HPhXpHW0spy',
  ADERENDHUESEN: '5psqw2EUItL72TMhfSfQ',
  BEFESTIGUNG_PV_MOUNTING: 'SyxjypSzRnCwf5ygddfh',
  VERBINDER: 'b5ipLND4IHvhV59PJdEP',
  ENDKAPPEN: 'FFt4SWvmCjA51fL9JqIo',
  SLS: 'XSJEgR8thn3PGhcH9W4f',
  TIEFENERDER: 'GP8qqjTGy7rb61Ldy4JR',
  KOMBIALEITER: 'GbQ7mvPpvShm8yaXss5R',
  ZAEHLERSCHRANK: 'sPp6SFLYLBt7jqj6ESV8',
  APZ: 'oAkX5Hj0lu3KBVVvVnJv',
  SMART_DONGLE: 'ZlqQZdDkuckVCHmCoU7T',
  STROMWANDLER: 'xcd6LYhzBSV2u6r3lvTH',
  GENERATORANSCHLUSSKASTEN: 'UttktkBYB4PCle22csnr',
};

const SPEC = {




  // Geräte Ströme
  DEV_MAX_I_1: 'Y3pBJPJrkUQMmVtLNOcv',
  DEV_MAX_I_2: 'Hvh5hlfkgPx78maaL72i',
  DEV_MAX_I_3: 'jqU0neeeT3zUIo4Aj9MJ',



  // Modul/Profil Maße
  MODULE_WIDTH_MM: 'wScGOKYdt4X1KdjYmZyy',
  MODULE_LENGTH_MM: 'JI4bqhXSzmm9WGgddTYA',
  PROFILE_LENGTH_MM: '8YZJStJTGnHxZxBU30CP',

  // Sonstiges (ErdungHES)
  CABLE_CORES: 'hRDtjnTqWu1tuPhqg1Ql',
  
  // Smart Dongle Spezifikation
  SMART_DONGLE_REQUIRED: 'fzK2fI7oj4XXbEYZe5tJ',
  

  
  // Energiemanagement Smart Dongle Ersatz Spezifikation
  ENERGIEMANAGEMENT_SMART_DONGLE_ERSATZ: 'vtRsEoszWmDtdPZdKfBB',
};

/* -------------------------------------------
 *  Utilities
 * ------------------------------------------- */
const parseNum = (v) => {
  if (v === null || v === undefined) return 0;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};
const getSpec = (mat, keys) => {
  if (!mat?.specifications) return undefined;
  for (const k of keys) {
    if (mat.specifications[k] !== undefined && mat.specifications[k] !== '') {
      return mat.specifications[k];
    }
  }
  return undefined;
};
const getBreakerCurrent = (mat) => parseNum(getSpec(mat, [SPEC.BREAKER_CURRENT_A_1, SPEC.BREAKER_CURRENT_A_2]));
const getCableMM2 = (mat) =>
  parseNum(getSpec(mat, [SPEC.CABLE_MM2_1, SPEC.CABLE_MM2_2, SPEC.CABLE_MM2_3]));

/* Empfohlener Querschnitt & LS nach konfigurierbarer Tabelle */
const getCableTable = (pvDefaults) => [
  { mm2: 1.5, maxA: pvDefaults.strombelastbarkeit15, breaker: 16 },
  { mm2: 2.5, maxA: pvDefaults.strombelastbarkeit25, breaker: 20 },
  { mm2: 4, maxA: pvDefaults.strombelastbarkeit4, breaker: 25 },
  { mm2: 6, maxA: pvDefaults.strombelastbarkeit6, breaker: 32 },
  { mm2: 10, maxA: pvDefaults.strombelastbarkeit10, breaker: 50 },
  { mm2: 16, maxA: pvDefaults.strombelastbarkeit16, breaker: 63 },
];

/* -------------------------------------------
 *  Kleine UI-Controls (DRY)
 * ------------------------------------------- */
const SectionCard = ({ titleIcon: Icon, title, children, className = '' }) => (
  <div className={`bg-white p-4 rounded-lg border border-gray-200 ${className}`}>
    {title && (
      <div className="flex items-center space-x-2 mb-3">
        {Icon ? <Icon className="h-4 w-4 text-gray-600" /> : null}
        <h3 className="text-base font-medium text-gray-900">{title}</h3>
      </div>
    )}
    {children}
  </div>
);

const LabeledSelect = ({
  label,
  value,
  onChange,
  options,
  required = false,
  hasError = false,
  placeholder = 'Auswählen...',
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value}
      onChange={onChange}
      className={`w-full border rounded-md px-3 py-2 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 ${
        hasError ? 'border-red-300' : 'border-gray-300'
      }`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    {hasError && <p className="text-red-600 text-xs mt-1">Feld ist erforderlich</p>}
  </div>
);

const LabeledNumber = ({ label, value, onChange, min = 0, hasError = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type="number"
      min={min}
      value={value}
      onChange={onChange}
      className={`w-full border rounded px-3 py-2 ${hasError ? 'border-red-300' : 'border-gray-300'}`}
    />
  </div>
);

/* -------------------------------------------
 *  Hauptkomponente
 * ------------------------------------------- */
const PVConfigurator = () => {
  const { materials, updateMaterialStock } = useMaterials();
  const { customers } = useCustomers();
  const { projects } = useProjects();
  const { addBooking } = useBookings();
  const { showNotification } = useNotification();

  /* ---------------- State: Wizard ---------------- */
  const [currentStep, setCurrentStep] = useState(0);
  const [validationErrors, setValidationErrors] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [customerProjects, setCustomerProjects] = useState([]);
  const [isBooking, setIsBooking] = useState(false);

  /* ---------------- State: Konfiguration (ohne doppelte Felder) ---------------- */
  const [configuration, setConfiguration] = useState({
    // Seite 1
    module: '',
    roofType: '',
    querformatRows: [], // [{modules:number}]
    hochformatRows: [], // [{modules:number}]

    // Seite 2 (dachtypspezifisch)
    pvMountingSystem: '',
    befestigungPVMountingSystem: '',
    modulEndklemmen: '',
    modulMittelklemmen: '',
    pvSteckerMale: '',
    pvSteckerFemale: '',
    profile: '',
    verbinder: '',
    endkappen: '',

    // Seite 3: WR + Strings
    inverters: [{ type: '', quantity: 1, strings: [{ name: '1.0', modules: 1 }] }],

    // Zusätzliche Komponenten
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

    // Elektrisch
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
  });

  /* ---------------- State: Defaults / Settings aus Firebase (bestehend) ---------------- */
  // Beibehalten, damit dein Backend 1:1 weiterläuft (du kannst das später einfach in ein Objekt bündeln)
  const [pvDefaults, setPvDefaults] = useState({});
  const [modulHakenVerhaeltnis, setModulHakenVerhaeltnis] = useState(null);
  const [defaultCableLength, setDefaultCableLength] = useState(10);

  const [potentialausgleichUK, setPotentialausgleichUK] = useState(null);
  const [defaultPotentialausgleich, setDefaultPotentialausgleich] = useState(null);

  const [kabelmanagementUK, setKabelmanagementUK] = useState(null);
  const [defaultKabelmanagement, setDefaultKabelmanagement] = useState(null);

  const [aderendhuelsenProGeraet, setAderendhuelsenProGeraet] = useState(null);

  const [kabelkanalStandard, setKabelkanalStandard] = useState(null);
  const [defaultKabelkanalStandard, setDefaultKabelkanalStandard] = useState(null);

  const [kabelkanalGross, setKabelkanalGross] = useState(null);
  const [defaultKabelkanalGross, setDefaultKabelkanalGross] = useState(null);

  const [pvKabel, setPvKabel] = useState(null);
  const [defaultPvKabel, setDefaultPvKabel] = useState(null);

  const [kabelschuh6M8, setKabelschuh6M8] = useState(null);
  const [kabelschuh10M6, setKabelschuh10M6] = useState(null);
  const [kabelschuh16M6, setKabelschuh16M6] = useState(null);

  const [defaultKabelschuh6M8, setDefaultKabelschuh6M8] = useState(null);
  const [defaultKabelschuh10M6, setDefaultKabelschuh10M6] = useState(null);
  const [defaultKabelschuh16M6, setDefaultKabelschuh16M6] = useState(null);

  const [defaultAderendhuelsen10mm2, setDefaultAderendhuelsen10mm2] = useState(null);
  const [defaultAderendhuelsen16mm2, setDefaultAderendhuelsen16mm2] = useState(null);

  const [befestigungPotentialausgleichUKUK, setBefestigungPotentialausgleichUKUK] = useState(null);
  const [defaultBefestigungPotentialausgleichUKUK, setDefaultBefestigungPotentialausgleichUKUK] = useState(null);
  const [befestigungLeistungsoptimierer, setBefestigungLeistungsoptimierer] = useState(null);
  const [defaultBefestigungLeistungsoptimierer, setDefaultBefestigungLeistungsoptimierer] = useState(null);

  const [potentialausgleichHESUK, setPotentialausgleichHESUK] = useState(null);
  const [defaultPotentialausgleichUKUK, setDefaultPotentialausgleichUKUK] = useState(null);
  const [defaultPotentialausgleichHESUK, setDefaultPotentialausgleichHESUK] = useState(null);

  const [schutzleiterPV, setSchutzleiterPV] = useState(null);
  const [defaultSchutzleiterPV, setDefaultSchutzleiterPV] = useState(null);

  const [erdungHES, setErdungHES] = useState(null);
  const [duebel14, setDuebel14] = useState(null);
  const [defaultDuebel14, setDefaultDuebel14] = useState(null);

  const [kabelkanalBefestigungsmaterial, setKabelkanalBefestigungsmaterial] = useState(null);
  const [pvGeraeteBefestigungsmaterial, setPvGeraeteBefestigungsmaterial] = useState(null);
  const [defaultKabelkanalSchrauben, setDefaultKabelkanalSchrauben] = useState(null);
  const [defaultKabelkanalDuebel, setDefaultKabelkanalDuebel] = useState(null);
  const [defaultPvGeraeteSchrauben, setDefaultPvGeraeteSchrauben] = useState(null);
  const [defaultPvGeraeteDuebel, setDefaultPvGeraeteDuebel] = useState(null);

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

  const [installationsrohrOutdoor, setInstallationsrohrOutdoor] = useState(null);
  const [rohrschelleOutdoor, setRohrschelleOutdoor] = useState(null);
  const [muffeOutdoor, setMuffeOutdoor] = useState(null);
  const [defaultInstallationsrohrOutdoor, setDefaultInstallationsrohrOutdoor] = useState(null);
  const [defaultRohrschelleOutdoor, setDefaultRohrschelleOutdoor] = useState(null);
  const [defaultMuffeOutdoor, setDefaultMuffeOutdoor] = useState(null);

  const [dammstoffduebel, setDammstoffduebel] = useState(null);
  const [defaultDammstoffduebel, setDefaultDammstoffduebel] = useState(null);

  const [duebelGeruestanker, setDuebelGeruestanker] = useState(null);
  const [defaultDuebelGeruestanker, setDefaultDuebelGeruestanker] = useState(null);

  const [adernleitung10mm2Blau, setAdernleitung10mm2Blau] = useState(null);
  const [adernleitung10mm2Schwarz, setAdernleitung10mm2Schwarz] = useState(null);
  const [adernleitung10mm2GruenGelb, setAdernleitung10mm2GruenGelb] = useState(null);

  const [adernleitung16mm2Blau, setAdernleitung16mm2Blau] = useState(null);
  const [adernleitung16mm2Schwarz, setAdernleitung16mm2Schwarz] = useState(null);
  const [adernleitung16mm2GruenGelb, setAdernleitung16mm2GruenGelb] = useState(null);

  const [defaultAdernleitung10mm2Blau, setDefaultAdernleitung10mm2Blau] = useState(null);
  const [defaultAdernleitung10mm2Schwarz, setDefaultAdernleitung10mm2Schwarz] = useState(null);
  const [defaultAdernleitung10mm2GruenGelb, setDefaultAdernleitung10mm2GruenGelb] = useState(null);
  const [defaultAdernleitung16mm2Blau, setDefaultAdernleitung16mm2Blau] = useState(null);
  const [defaultAdernleitung16mm2Schwarz, setDefaultAdernleitung16mm2Schwarz] = useState(null);
  const [defaultAdernleitung16mm2GruenGelb, setDefaultAdernleitung16mm2GruenGelb] = useState(null);

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

  const [defaultAufkleberPV, setDefaultAufkleberPV] = useState(null);
  const [defaultAufkleberPVMitSpeicher, setDefaultAufkleberPVMitSpeicher] = useState(null);
  const [defaultAufkleberPVMitNotstrom, setDefaultAufkleberPVMitNotstrom] = useState(null);
  
  const [defaultStromwandlerValue, setDefaultStromwandlerValue] = useState(1);
  const [defaultStromwandlerMaterial, setDefaultStromwandlerMaterial] = useState(null);
  
  const [defaultErdungHES, setDefaultErdungHES] = useState(null);
  
  const [defaultErdungStaberderValue, setDefaultErdungStaberderValue] = useState(1);
  const [defaultErdungStaberderMaterial, setDefaultErdungStaberderMaterial] = useState(null);

  /* ---------------- Materialien indexieren ---------------- */
  const materialsById = useMemo(() => {
    const m = new Map();
    for (const it of materials) m.set(it.id, it);
    return m;
  }, [materials]);

  const optionsFromCategory = useCallback(
    (catId) =>
      materials
        .filter((m) => m.categoryId === catId)
        .map((m) => ({ value: m.id, label: m.description || m.name || m.id })),
    [materials]
  );

  /* ---------------- Kunden -> Projekte ---------------- */
  useEffect(() => {
    if (!selectedCustomer) {
      setCustomerProjects([]);
      setSelectedProject('');
      return;
    }
    const filtered = projects.filter((p) => p.customerID === selectedCustomer);
    setCustomerProjects(filtered);
    setSelectedProject('');
  }, [selectedCustomer, projects]);

  /* ---------------- Layout Totals (keine doppelten Inhalte) ---------------- */
  const layoutTotals = useMemo(() => {
    const qCount = (configuration.querformatRows || []).reduce((s, r) => s + (parseInt(r.modules) || 0), 0);
    const hCount = (configuration.hochformatRows || []).reduce((s, r) => s + (parseInt(r.modules) || 0), 0);
    const qRows = configuration.querformatRows?.length || 0;
    const hRows = configuration.hochformatRows?.length || 0;
    return {
      totalModules: qCount + hCount,
      totalRows: qRows + hRows,
      qCount,
      hCount,
      qRows,
      hRows,
    };
  }, [configuration.querformatRows, configuration.hochformatRows]);

  /* ---------------- Defaults laden (bestehende Logik) ---------------- */
  useEffect(() => {
    const loadPvDefaults = async () => {
      try {
        const defaultsData = await FirebaseService.getDocuments('pv-defaults');
        if (!defaultsData?.length) return;
        const d = defaultsData[0];

        // Store complete pvDefaults for recommendations
        setPvDefaults(d);
        
        // Minimal-invasive Übernahme (wie in deiner Vorlage)
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

        // Vorkonfiguration anwenden (optional; wie in deinem Code)
        setConfiguration((prev) => ({
          ...prev,
          module: d.defaultModule || prev.module,
          roofType: d.defaultRoofType || prev.roofType,
          pvMountingSystem: d.defaultPvMountingSystem || prev.pvMountingSystem,
          befestigungPVMountingSystem: d.defaultBefestigungPVMountingSystem || prev.befestigungPVMountingSystem,
          modulEndklemmen: d.defaultModulEndklemmen || prev.modulEndklemmen,
          modulMittelklemmen: d.defaultModulMittelklemmen || prev.modulMittelklemmen,
          pvSteckerMale: d.defaultPvSteckerMale || prev.pvSteckerMale,
          pvSteckerFemale: d.defaultPvSteckerFemale || prev.pvSteckerFemale,
          profile: d.defaultProfile || prev.profile,
          verbinder: d.defaultVerbinder || prev.verbinder,
          endkappen: d.defaultEndkappen || prev.endkappen,
          inverters: prev.inverters.map((inv, i) => (i === 0 ? { ...inv, type: d.defaultInverter || inv.type } : inv)),
        }));
      } catch (e) {
        console.error('Fehler beim Laden der PV-Standardeinstellungen:', e);
      }
    };
    loadPvDefaults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- Verfügbare Optionen ---------------- */
  const availableModules = useMemo(() => optionsFromCategory(CAT.MODULES), [optionsFromCategory]);
  const availableInverters = useMemo(() => optionsFromCategory(CAT.INVERTERS), [optionsFromCategory]);
  const availableWallboxes = useMemo(() => optionsFromCategory(CAT.WALLBOXES), [optionsFromCategory]);
  const availableBatteries = useMemo(() => optionsFromCategory(CAT.BATTERIES), [optionsFromCategory]);
  const availablePVMounting = useMemo(() => optionsFromCategory(CAT.PV_MOUNTING), [optionsFromCategory]);
  const availableClamps = useMemo(() => optionsFromCategory(CAT.CLAMPS), [optionsFromCategory]);
  const availableConnectors = useMemo(() => optionsFromCategory(CAT.CONNECTORS), [optionsFromCategory]);
  const availableProfiles = useMemo(() => optionsFromCategory(CAT.PROFILES), [optionsFromCategory]);
  const availableOptimizers = useMemo(() => optionsFromCategory(CAT.OPTIMIZERS), [optionsFromCategory]);
  const availableCircuitBreakers = useMemo(() => optionsFromCategory(CAT.CIRCUIT_BREAKERS), [optionsFromCategory]);
  const availableCables = useMemo(() => optionsFromCategory(CAT.CABLES), [optionsFromCategory]);
  const availableRCDs = useMemo(() => optionsFromCategory(CAT.RCDS), [optionsFromCategory]);

  /* ---------------- Empfehlungen berechnen (memoisiert) ---------------- */
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
      const result = standardBreakers[target] || null;
      
      return result;
    },
    [pvDefaults]
  );

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
      const result = standardCables[targetMM2] || null;

      return result;
    },
    [pvDefaults]
  );

  const pickRCDWallbox = useCallback(() => {
    return pvDefaults.defaultFehlerstromschutzschalterWallbox || null;
  }, [pvDefaults]);

  const deviceMaxCurrent = useCallback(
    (matId) => {
      const m = materialsById.get(matId);
      if (!m) return 0;
      return parseNum(getSpec(m, [SPEC.DEV_MAX_I_1, SPEC.DEV_MAX_I_2, SPEC.DEV_MAX_I_3]));
    },
    [materialsById]
  );

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

    // WR: nimm ersten WR-Typ als Referenz für Dimensionierung (dein bisheriges Verhalten)
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

  /* ---------------- Override-State für Empfehlungen (User kann ändern) ---------------- */
  const [overrideRec, setOverrideRec] = useState({});
  const chosen = {
    inverterBreaker: overrideRec.inverterBreaker ?? recommendations.inverterBreaker,
    inverterCable: overrideRec.inverterCable ?? recommendations.inverterCable,
    wallboxBreaker: overrideRec.wallboxBreaker ?? recommendations.wallboxBreaker,
    wallboxCable: overrideRec.wallboxCable ?? recommendations.wallboxCable,
    wallboxRCD: overrideRec.wallboxRCD ?? recommendations.wallboxRCD,
    backupBreaker: overrideRec.backupBreaker ?? recommendations.backupBreaker,
    backupCable: overrideRec.backupCable ?? recommendations.backupCable,
  };

  /* ---------------- Basis-BOM (memoisiert) + Warnungen ---------------- */
  const baseBOMWithWarnings = useMemo(() => {
    const bom = [];
    const warnings = [];
    const { totalModules, totalRows } = layoutTotals;

    if (totalModules === 0) {
      return { bom, warnings };
    }

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
      (inv.strings || []).forEach((s) => (totalModulesInStrings += (parseInt(s.modules) || 0)));
    });

    if (totalModules !== totalModulesInStrings) {
      warnings.push(
        `Die Anzahl der Module in den Strings (${totalModulesInStrings}) stimmt nicht mit der Gesamtanzahl (${totalModules}) überein.`
      );
    }

    // 3. Montagesystem je Dachtyp
    if (configuration.roofType) {
      const mountingCount = Math.ceil(totalModules * (modulHakenVerhaeltnis ?? 0));
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

      // Profile/Verbinder/Endkappen für Ziegeldach (exakte Längenrechnung)
      if (configuration.roofType === 'Ziegel' && configuration.profile) {
        const mod = materialsById.get(configuration.module);
        const prof = materialsById.get(configuration.profile);
        const modWidth = parseNum(getSpec(mod, [SPEC.MODULE_WIDTH_MM]));
        const modLen = parseNum(getSpec(mod, [SPEC.MODULE_LENGTH_MM]));
        const profLen = parseNum(getSpec(prof, [SPEC.PROFILE_LENGTH_MM]));

        const endClampWidth = parseNum(getSpec(materialsById.get(configuration.modulEndklemmen), [SPEC.MODULE_WIDTH_MM]));
        const midClampWidth = parseNum(getSpec(materialsById.get(configuration.modulMittelklemmen), [SPEC.MODULE_WIDTH_MM]));

        let profileQty = 0;
        let verbinderQty = 0;

        const calcRow = (modulesInRow, unitLen) => {
          if (!modulesInRow || !profLen) return { p: 0, v: 0 };
          const endQty = 2 * 2; // pro Reihe 4 Endklemmen
          const midQty = Math.max(0, (modulesInRow - 1) * 2);
          const lengthTotal = modulesInRow * unitLen * 2 + endQty * 50 + endQty * endClampWidth + midQty * midClampWidth; // 2 Schienen
          const profilesNeeded = Math.ceil(lengthTotal / profLen);
          const connectors = Math.max(0, profilesNeeded - 1) * 2; // 2 Schienen
          return { p: profilesNeeded, v: connectors };
        };

        // Querformat -> Modul-LÄNGE, Hochformat -> Modul-BREITE
        (configuration.querformatRows || []).forEach((r) => {
          const { p, v } = calcRow(parseInt(r.modules) || 0, modLen);
          profileQty += p;
          verbinderQty += v;
        });
        (configuration.hochformatRows || []).forEach((r) => {
          const { p, v } = calcRow(parseInt(r.modules) || 0, modWidth);
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
    // PV-Kabel (DC) flatrate: pro String * pvKabel * 2 (Plus/Minus)
    if (totalStrings > 0 && pvKabel > 0 && defaultPvKabel) {
      bom.push({
        materialID: defaultPvKabel,
        quantity: totalStrings * pvKabel * 2,
        description: materialsById.get(defaultPvKabel)?.description || `PV-Kabel (${pvKabel}m × 2 × ${totalStrings} Strings)`,
        category: 'PV-Kabel',
      });
    }

    // 5. Optionale Komponenten (manuell konfiguriert)
    const addIfConfigured = (id, qty, desc, cat) => {
      if (id && qty > 0) {
        const materialDesc = materialsById.get(id)?.description || desc;
        bom.push({ materialID: id, quantity: qty, description: materialDesc, category: cat, isConfigured: true });
      }
    };
    addIfConfigured(configuration.optimizer, configuration.optimizerQty, 'Leistungsoptimierer', 'Optimierer');
    addIfConfigured(configuration.battery, configuration.batteryQty, 'Batteriespeicher', 'Speicher');
    addIfConfigured(configuration.wallbox, configuration.wallboxQty, 'Wallbox', 'Wallbox');
    addIfConfigured(configuration.energiemanagement, configuration.energiemanagementQty, 'Energiemanagement', 'Energiemanagement');
    addIfConfigured(configuration.smartDongle, configuration.smartDongleQty, 'Smart Dongle-WLAN-FE', 'Smart Dongle');

    // 6. Elektrische Komponenten (manuell konfiguriert)
    addIfConfigured(configuration.sls, configuration.slsQty, 'SLS', 'Elektrische Komponenten');
    addIfConfigured(configuration.tiefenerder, configuration.tiefenerderQty, 'Tiefenerder', 'Elektrische Komponenten');
    addIfConfigured(configuration.kombiableiter, configuration.kombiableiterQty, 'Kombiableiter', 'Elektrische Komponenten');
    addIfConfigured(configuration.zaehlerschrank, configuration.zaehlerschrankQty, 'Zählerschrank', 'Elektrische Komponenten');
    addIfConfigured(configuration.generatoranschlusskasten, configuration.generatoranschlusskastenQty, 'Generatoranschlusskasten', 'Elektrische Komponenten');
    addIfConfigured(configuration.spannungsversorgungAPZ, configuration.spannungsversorgungAPZQty, 'Spannungsversorgung APZ', 'Elektrische Komponenten');
    
    // Prüfung ob Energiemanagement Smart Dongle ersetzt
    let energiemanagementErsetzt = false;
    if (configuration.energiemanagement) {
      const energieMaterial = materials.find(m => m.id === configuration.energiemanagement);
      if (energieMaterial?.categoryId === CAT.ENERGY_MGMT) {
        const smartDongleErsatz = energieMaterial?.specifications?.[SPEC.ENERGIEMANAGEMENT_SMART_DONGLE_ERSATZ];
        if (smartDongleErsatz === 'Ja') {
          energiemanagementErsetzt = true;
        }
      }
    }

    // Automatische Smart Dongle-Erkennung basierend auf Wechselrichter-Spezifikationen
    let autoSmartDongleCount = 0;
    if (!energiemanagementErsetzt) {
      configuration.inverters.forEach(inv => {
        if (inv.type) {
          const inverterMaterial = materials.find(m => m.id === inv.type);
          const requiresSmartDongle = inverterMaterial?.specifications?.[SPEC.SMART_DONGLE_REQUIRED];
          
          if (requiresSmartDongle === 'Nein') {
            autoSmartDongleCount += inv.quantity || 1;
          }
        }
      });
    }
    
    // Smart Dongle automatisch hinzufügen, wenn noch nicht manuell konfiguriert
    if (autoSmartDongleCount > 0 && !configuration.smartDongle) {
      const smartDongleMaterials = materials.filter(m => m.categoryId === CAT.SMART_DONGLE);
      const defaultSmartDongle = smartDongleMaterials.find(m => m.description?.includes('Smart Dongle-WLAN-FE')) || smartDongleMaterials[0];

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
    

    
    // Automatische ErdungStaberder-Erkennung basierend auf Tiefenerder-Auswahl
    let autoErdungStaberderCount = 0;
    if (configuration.tiefenerder) {
      const tiefenerderMaterial = materials.find(m => m.id === configuration.tiefenerder);
      if (tiefenerderMaterial?.categoryId === CAT.TIEFENERDER) {
        autoErdungStaberderCount = configuration.tiefenerderQty || 1;
      }
    }
    
    // ErdungStaberder automatisch hinzufügen
    if (autoErdungStaberderCount > 0 && defaultErdungStaberderMaterial) {
      bom.push({
        materialID: defaultErdungStaberderMaterial,
        quantity: autoErdungStaberderCount * (defaultErdungStaberderValue || 1),
        description: materialsById.get(defaultErdungStaberderMaterial)?.description || `ErdungStaberder (automatisch für ${autoErdungStaberderCount} Tiefenerder × ${defaultErdungStaberderValue || 1})`,
        category: 'Erdung',
      });
    }
    
    addIfConfigured(configuration.notstromloesungen, configuration.notstromloesungenQty, 'Notstromlösungen', 'Notstromlösungen');

    // 7. Empfohlene Komponenten (Schutzschalter/Kabel) - als konfiguriert markieren
    const inverterCount = configuration.inverters
      .filter((inv) => inv.type && inv.quantity > 0)
      .reduce((t, inv) => t + (parseInt(inv.quantity) || 1), 0);

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
      bom.push({
        materialID: chosen.inverterCable,
        quantity: inverterCount * defaultCableLength,
        description: materialsById.get(chosen.inverterCable)?.description || `Mantelleitung (Wechselrichter) - ${defaultCableLength}m pro WR`,
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
      bom.push({
        materialID: chosen.wallboxCable,
        quantity: configuration.wallboxQty * defaultCableLength,
        description: materialsById.get(chosen.wallboxCable)?.description || `Mantelleitung (Wallbox) - ${defaultCableLength}m pro Wallbox`,
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
      bom.push({
        materialID: chosen.backupCable,
        quantity: configuration.notstromloesungenQty * defaultCableLength,
        description: materialsById.get(chosen.backupCable)?.description || `Mantelleitung (Notstrom) - ${defaultCableLength}m pro Gerät`,
        category: 'Kabel',
        isConfigured: true,
      });
    }

    // 8. Standard-/Flat-Rate-Komponenten (unverändert, aber kompakter)
    const pushFlat = (id, qty, desc, cat) => {
      if (id && qty > 0) {
        const materialDesc = materialsById.get(id)?.description || desc;
        bom.push({ materialID: id, quantity: qty, description: materialDesc, category: cat });
      }
    };
    pushFlat(defaultPotentialausgleich, potentialausgleichUK, 'Potentialausgleich UK (Standard)', 'Potentialausgleich');
    pushFlat(defaultKabelmanagement, kabelmanagementUK, 'Kabelmanagement UK (Standard)', 'Kabelmanagement');

    // Aderendhülsen zählen (vereinfacht & nachvollziehbar)
    const devicesForAderendhuelsen =
      (chosen.inverterBreaker ? inverterCount : 0) +
      (configuration.wallbox && chosen.wallboxBreaker ? configuration.wallboxQty || 1 : 0) +
      (configuration.battery ? (configuration.batteryQty || 1) : 0) +
      (configuration.notstromloesungen && chosen.backupBreaker ? configuration.notstromloesungenQty || 0 : 0);

    if (defaultAderendhuelsen10mm2 && aderendhuelsenProGeraet > 0 && devicesForAderendhuelsen > 0) {
      bom.push({
        materialID: defaultAderendhuelsen10mm2,
        quantity: devicesForAderendhuelsen * aderendhuelsenProGeraet,
        description: materialsById.get(defaultAderendhuelsen10mm2)?.description || `Aderendhülsen 10mm² (${devicesForAderendhuelsen} Geräte × ${aderendhuelsenProGeraet})`,
        category: 'Aderendhülsen',
      });
    }

    // 10–27: (gleiches Verhalten wie in deiner Vorlage, aus Platzgründen nicht erneut kommentiert)
    pushFlat(defaultKabelschuh6M8, kabelschuh6M8, 'Kabelschuh 6xM8 (Flat Rate)', 'Kabelschuh');

    const dev10m6 = (configuration.batteryQty || 0) + inverterCount;
    if (defaultKabelschuh10M6 && kabelschuh10M6 > 0 && dev10m6 > 0) {
      bom.push({
        materialID: defaultKabelschuh10M6,
        quantity: dev10m6 * kabelschuh10M6,
        description: materialsById.get(defaultKabelschuh10M6)?.description || `Kabelschuh 10xM6 (${dev10m6} Geräte × ${kabelschuh10M6})`,
        category: 'Kabelschuh',
      });
    }

    if (defaultKabelschuh16M6 && kabelschuh16M6 > 0 && configuration.notstromloesungenQty > 0 && configuration.notstromloesungen === 'MAT-080') {
      bom.push({
        materialID: defaultKabelschuh16M6,
        quantity: configuration.notstromloesungenQty * kabelschuh16M6,
        description: materialsById.get(defaultKabelschuh16M6)?.description || `Kabelschuh 16xM6 (${configuration.notstromloesungenQty} × ${kabelschuh16M6})`,
        category: 'Kabelschuh',
      });
    }

    pushFlat(defaultDammstoffduebel, dammstoffduebel, 'Dämmstoffdübel (Standard)', 'Befestigungsmaterial');
    pushFlat(defaultDuebelGeruestanker, duebelGeruestanker, 'Dübel Gerüstanker (Standard)', 'Dübel');

    pushFlat(defaultAdernleitung10mm2Blau, adernleitung10mm2Blau, 'Adernleitung 10mm² Blau', 'Kabel');
    pushFlat(defaultAdernleitung10mm2Schwarz, adernleitung10mm2Schwarz, 'Adernleitung 10mm² Schwarz', 'Kabel');
    pushFlat(defaultAdernleitung10mm2GruenGelb, adernleitung10mm2GruenGelb, 'Adernleitung 10mm² Grün/Gelb', 'Kabel');

    pushFlat(defaultAdernleitung16mm2Blau, adernleitung16mm2Blau, 'Adernleitung 16mm² Blau', 'Kabel');
    pushFlat(defaultAdernleitung16mm2Schwarz, adernleitung16mm2Schwarz, 'Adernleitung 16mm² Schwarz', 'Kabel');
    pushFlat(defaultAdernleitung16mm2GruenGelb, adernleitung16mm2GruenGelb, 'Adernleitung 16mm² Grün/Gelb', 'Kabel');

    pushFlat(defaultPotentialausgleichsschiene, potentialausgleichsschiene, 'Potentialausgleichsschiene', 'Potentialausgleich');
    pushFlat(defaultHauptleitungsabzweigklemme, hauptleitungsabzweigklemme, 'Hauptleitungsabzweigklemme', 'Klemmen');
    pushFlat(defaultSammelschienenklemme, sammelschienenklemme, 'Sammelschienenklemme', 'Klemmen');
    pushFlat(defaultAbdeckstreifen, abdeckstreifen, 'Abdeckstreifen', 'Abdeckung');

    if (defaultRj45Stecker && rj45Stecker > 0 && configuration.wallboxQty > 0) {
      bom.push({
        materialID: defaultRj45Stecker,
        quantity: configuration.wallboxQty * rj45Stecker,
        description: materialsById.get(defaultRj45Stecker)?.description || `RJ45-Stecker (${configuration.wallboxQty} × ${rj45Stecker})`,
        category: 'Stecker',
      });
    }

    if (defaultBefestigungPotentialausgleichUKUK) {
      const base = befestigungPotentialausgleichUKUK || 0;
      const qty = base;
      if (qty > 0) {
        bom.push({
          materialID: defaultBefestigungPotentialausgleichUKUK,
          quantity: qty,
          description: materialsById.get(defaultBefestigungPotentialausgleichUKUK)?.description || `BefestigungsmaterialPotentialausgleich UK-UK (${qty})`,
          category: 'Befestigungsmaterial',
        });
      }
    }

    if (defaultBefestigungLeistungsoptimierer && configuration.optimizerQty > 0) {
      const qty = befestigungLeistungsoptimierer || 0;
      const totalQty = qty * configuration.optimizerQty;
      if (totalQty > 0) {
        bom.push({
          materialID: defaultBefestigungLeistungsoptimierer,
          quantity: totalQty,
          description: materialsById.get(defaultBefestigungLeistungsoptimierer)?.description || `Befestigung Leistungsoptimierer (${configuration.optimizerQty} × ${qty})`,
          category: 'Befestigungsmaterial',
        });
      }
    }

    if (defaultPotentialausgleichUKUK && potentialausgleichUK > 0) {
      bom.push({
        materialID: defaultPotentialausgleichUKUK,
        quantity: potentialausgleichUK,
        description: materialsById.get(defaultPotentialausgleichUKUK)?.description || `Potentialausgleich UK-UK (${potentialausgleichUK}m)`,
        category: 'Potentialausgleich',
      });
    }
    if (defaultPotentialausgleichHESUK && potentialausgleichHESUK > 0) {
      bom.push({
        materialID: defaultPotentialausgleichHESUK,
        quantity: potentialausgleichHESUK,
        description: materialsById.get(defaultPotentialausgleichHESUK)?.description || `Potentialausgleich HES-UK (${potentialausgleichHESUK}m)`,
        category: 'Erdkabel',
      });
    }

    if (defaultSchutzleiterPV && schutzleiterPV > 0) {
      const devs = inverterCount + (configuration.batteryQty || 0);
      if (devs > 0) {
        bom.push({
          materialID: defaultSchutzleiterPV,
          quantity: devs * schutzleiterPV,
          description: materialsById.get(defaultSchutzleiterPV)?.description || `SchutzleiterPV (${devs} Geräte × ${schutzleiterPV}m)`,
          category: 'Mantelleitung',
        });
      }
    }

    // ErdungHES: Standardkomponente
    pushFlat(defaultErdungHES, erdungHES, 'ErdungHES', 'Mantelleitung');

    pushFlat(defaultDuebel14, duebel14, '14mm Dübel (Standard)', 'Dübel');

    // Kabelkanal Befestigungsmaterial abhängig von KabelkanalStandard
    if (kabelkanalBefestigungsmaterial > 0 && kabelkanalStandard > 0) {
      const total = Math.ceil(kabelkanalStandard * kabelkanalBefestigungsmaterial);
      if (defaultKabelkanalSchrauben) {
        bom.push({
          materialID: defaultKabelkanalSchrauben,
          quantity: total,
          description: materialsById.get(defaultKabelkanalSchrauben)?.description || `Kabelkanal Schrauben (${kabelkanalStandard}m × ${kabelkanalBefestigungsmaterial})`,
          category: 'Schrauben',
        });
      }
      if (defaultKabelkanalDuebel) {
        bom.push({
          materialID: defaultKabelkanalDuebel,
          quantity: total,
          description: materialsById.get(defaultKabelkanalDuebel)?.description || `Kabelkanal Dübel (${kabelkanalStandard}m × ${kabelkanalBefestigungsmaterial})`,
          category: 'Dübel',
        });
      }
    }

    // PV-Geräte Befestigungsmaterial
    if (pvGeraeteBefestigungsmaterial > 0) {
      const totalPvDevices =
        inverterCount +
        (configuration.batteryQty || 0) +
        (configuration.wallbox ? 1 : 0) +
        (configuration.notstromloesungenQty || 0);
      const totalQty = totalPvDevices * pvGeraeteBefestigungsmaterial;

      if (defaultPvGeraeteSchrauben && totalQty > 0) {
        bom.push({
          materialID: defaultPvGeraeteSchrauben,
          quantity: totalQty,
          description: materialsById.get(defaultPvGeraeteSchrauben)?.description || `PV-Geräte Schrauben (${totalPvDevices} × ${pvGeraeteBefestigungsmaterial})`,
          category: 'Schrauben',
        });
      }
      if (defaultPvGeraeteDuebel && totalQty > 0) {
        bom.push({
          materialID: defaultPvGeraeteDuebel,
          quantity: totalQty,
          description: materialsById.get(defaultPvGeraeteDuebel)?.description || `PV-Geräte Dübel (${totalPvDevices} × ${pvGeraeteBefestigungsmaterial})`,
          category: 'Dübel',
        });
      }
    }

    // Flex-/Installationsrohre & Schellen
    const pushLen = (id, qty, name) => {
      const materialDesc = materialsById.get(id)?.description || `${name} (${qty}${name.includes('Stück') ? '' : 'm'})`;
      pushFlat(id, qty, materialDesc, 'Kabelverlegung');
    };
    pushLen(defaultFlexrohrStandard, flexrohr, 'Flexrohr Standard');
    pushLen(defaultInstallationsrohr, installationsrohr, 'Installationsrohr');
    pushLen(defaultRohrschelleStandard, rohrschelle, 'Rohrschelle (Stück)');
    // Outdoor
    pushLen(defaultFlexrohrGross, flexrohr, 'Flexrohr Groß');
    pushLen(defaultRohrschelleGross, rohrschelle, 'Rohrschelle Groß (Stück)');
    pushLen(defaultInstallationsrohrOutdoor, installationsrohrOutdoor, 'Installationsrohr Outdoor');
    pushLen(defaultRohrschelleOutdoor, rohrschelleOutdoor, 'Rohrschelle Outdoor (Stück)');
    pushLen(defaultMuffeOutdoor, muffeOutdoor, 'Muffe Outdoor (Stück)');

    // Aufkleber (Priorität: Notstrom > Speicher > PV) - als konfiguriert markieren
    const hasSpeicher = configuration.battery && configuration.batteryQty > 0;
    const hasNotstrom = configuration.notstromloesungen && configuration.notstromloesungenQty > 0;
    if (hasNotstrom && defaultAufkleberPVMitNotstrom) {
      bom.push({
        materialID: defaultAufkleberPVMitNotstrom,
        quantity: 1,
        description: materialsById.get(defaultAufkleberPVMitNotstrom)?.description || 'Aufkleber PV mit Notstrom',
        category: 'Aufkleber',
        isConfigured: true,
      });
    } else if (hasSpeicher && defaultAufkleberPVMitSpeicher) {
      bom.push({
        materialID: defaultAufkleberPVMitSpeicher,
        quantity: 1,
        description: materialsById.get(defaultAufkleberPVMitSpeicher)?.description || 'Aufkleber PV mit Speicher',
        category: 'Aufkleber',
        isConfigured: true,
      });
    } else if (defaultAufkleberPV) {
      bom.push({
        materialID: defaultAufkleberPV,
        quantity: 1,
        description: materialsById.get(defaultAufkleberPV)?.description || 'Aufkleber PV',
        category: 'Aufkleber',
        isConfigured: true,
      });
    }

    // BOM konsolidieren - identische materialIDs zusammenfassen
    const consolidatedBom = [];
    const bomMap = new Map();

    bom.forEach(item => {
      if (bomMap.has(item.materialID)) {
        // Material bereits vorhanden - Mengen addieren
        const existing = bomMap.get(item.materialID);
        existing.quantity += item.quantity;
        
        // Beschreibung aktualisieren falls nötig
        if (existing.description !== item.description) {
          // Wenn Beschreibungen unterschiedlich sind, die detailliertere nehmen
          if (item.description.length > existing.description.length) {
            existing.description = item.description;
          }
        }
      } else {
        // Neues Material hinzufügen
        bomMap.set(item.materialID, { ...item });
      }
    });

    // Map zurück zu Array konvertieren
    bomMap.forEach(item => {
      consolidatedBom.push(item);
    });

    return { bom: consolidatedBom, warnings };
  }, [
    configuration,
    layoutTotals,
    materials,
    materialsById,
    // defaults used in calculations:
    modulHakenVerhaeltnis,
    pvKabel,
    defaultPvKabel,
    defaultCableLength,
    // alle flatrates:
    potentialausgleichUK,
    defaultPotentialausgleich,
    kabelmanagementUK,
    defaultKabelmanagement,
    aderendhuelsenProGeraet,
    defaultAderendhuelsen10mm2,
    defaultAderendhuelsen16mm2,
    kabelschuh6M8,
    defaultKabelschuh6M8,
    kabelschuh10M6,
    defaultKabelschuh10M6,
    kabelschuh16M6,
    defaultKabelschuh16M6,
    befestigungPotentialausgleichUKUK,
    defaultBefestigungPotentialausgleichUKUK,
    befestigungLeistungsoptimierer,
    defaultBefestigungLeistungsoptimierer,
    potentialausgleichHESUK,
    defaultPotentialausgleichUKUK,
    defaultPotentialausgleichHESUK,
    schutzleiterPV,
    defaultSchutzleiterPV,
    erdungHES,
    duebel14,
    defaultDuebel14,
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
    adernleitung16mm2Blau,
    adernleitung16mm2Schwarz,
    adernleitung16mm2GruenGelb,
    defaultAdernleitung10mm2Blau,
    defaultAdernleitung10mm2Schwarz,
    defaultAdernleitung10mm2GruenGelb,
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
    // Empfehlungen (chosen)
    chosen.inverterBreaker,
    chosen.inverterCable,
    chosen.wallboxBreaker,
    chosen.wallboxCable,
    chosen.wallboxRCD,
    chosen.backupBreaker,
    chosen.backupCable,
  ]);

  /* ---------------- BOM Editing (manuell) ---------------- */
  const [calculatedBOM, setCalculatedBOM] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);

  // Automatische BOM-Neuberechnung beim Wechsel zu Step 5 (Stückliste & Buchung)
  useEffect(() => {
    if (currentStep === 5) {
      setCalculatedBOM(baseBOMWithWarnings.bom);
      setWarnings(baseBOMWithWarnings.warnings);
    }
  }, [currentStep, baseBOMWithWarnings]);

  const resetBOMToRecommended = () => {
    setCalculatedBOM(baseBOMWithWarnings.bom);
    setWarnings(baseBOMWithWarnings.warnings);
  };

  // Material zur Stückliste hinzufügen
  const addMaterialToBOM = (materialId, quantity = 1, isManual = false) => {
    const material = materialsById.get(materialId);
    if (!material) return;

    // Prüfen ob Material bereits in der BOM vorhanden ist
    const existingIndex = calculatedBOM.findIndex(item => item.materialID === materialId);
    
    if (existingIndex >= 0) {
      // Material bereits vorhanden - Menge erhöhen
      setCalculatedBOM(prev => {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity
        };
        return next;
      });
    } else {
      // Neues Material hinzufügen
      const newItem = {
        materialID: materialId,
        description: material.description,
        quantity: quantity,
        isManual: isManual
      };
      setCalculatedBOM(prev => [...prev, newItem]);
    }
    
    // Modal schließen wenn es ein manueller Zusatz war
    if (isManual) {
      setShowAddMaterialModal(false);
    }
  };

  /* ---------------- Validierung ---------------- */
  const pairRequired = (matId, qty) => {
    const filledMat = !!matId;
    const filledQty = !!qty && qty > 0;
    return (filledMat && filledQty) || (!filledMat && !filledQty);
  };

  const validateStep = (step) => {
    const errors = [];

    if (step === 0) {
      if (!configuration.module) errors.push('PV-Modul');
      if (!configuration.roofType) errors.push('Dachtyp');
      const hasRows = (configuration.querformatRows?.length || 0) + (configuration.hochformatRows?.length || 0) > 0;
      if (!hasRows) errors.push('Modulanordnung');
    }

    if (step === 1) {
      if (!configuration.pvMountingSystem) errors.push('Montagesystem');
      if (!configuration.befestigungPVMountingSystem) errors.push('Befestigung');
      if (!configuration.modulEndklemmen) errors.push('Endklemmen');
      if (!configuration.modulMittelklemmen) errors.push('Mittelklemmen');
      if (!configuration.pvSteckerMale) errors.push('PV-Stecker Male');
      if (!configuration.pvSteckerFemale) errors.push('PV-Stecker Female');
      if (configuration.roofType === 'Ziegel') {
        if (!configuration.profile) errors.push('Profil');
        if (!configuration.verbinder) errors.push('Verbinder');
        if (!configuration.endkappen) errors.push('Endkappen');
      }
    }

    if (step === 2) {
      configuration.inverters.forEach((inv, i) => {
        if (!inv.type) errors.push(`Wechselrichter ${i + 1}`);
      });
      const tm = layoutTotals.totalModules;
      const ts = configuration.inverters.flatMap((inv) => inv.strings || []).reduce((s, st) => s + (parseInt(st.modules) || 0), 0);
      if (tm > 0 && tm !== ts) errors.push('String-Module-Anzahl');
    }

    if (step === 3) {
      if (!pairRequired(configuration.wallbox, configuration.wallboxQty)) errors.push('Wallbox');
      if (!pairRequired(configuration.battery, configuration.batteryQty)) errors.push('Speicher');
      if (!pairRequired(configuration.energiemanagement, configuration.energiemanagementQty))
        errors.push('Energiemanagement');
      if (!pairRequired(configuration.notstromloesungen, configuration.notstromloesungenQty))
        errors.push('Notstromlösungen');
      if (!pairRequired(configuration.optimizer, configuration.optimizerQty)) errors.push('Optimierer');
    }

    if (step === 4) {
      if (!pairRequired(configuration.sls, configuration.slsQty)) errors.push('SLS');
      if (!pairRequired(configuration.tiefenerder, configuration.tiefenerderQty)) errors.push('Tiefenerder');
      if (!pairRequired(configuration.kombiableiter, configuration.kombiableiterQty)) errors.push('Kombiableiter');
      if (!pairRequired(configuration.zaehlerschrank, configuration.zaehlerschrankQty)) errors.push('Zählerschrank');
      if (!pairRequired(configuration.generatoranschlusskasten, configuration.generatoranschlusskastenQty)) errors.push('Generatoranschlusskasten');
      if (!pairRequired(configuration.spannungsversorgungAPZ, configuration.spannungsversorgungAPZQty))
        errors.push('SpannungsversorgungAPZ');
    }

    return errors;
  };

  const hasFieldError = (name) => validationErrors.includes(name);
  const clearFieldError = (name) => setValidationErrors((prev) => prev.filter((e) => e !== name));

  const handleNext = () => {
    const errs = validateStep(currentStep);
    if (errs.length) {
      setValidationErrors(errs);
      return;
    }
    setValidationErrors([]);
    if (currentStep < 5) setCurrentStep((s) => s + 1);
  };
  const handleBack = () => currentStep > 0 && setCurrentStep((s) => s - 1);

  /* ---------------- Strings / WR Helpers ---------------- */
  const addStringToInverter = (i) => {
    setConfiguration((prev) => {
      const next = { ...prev, inverters: prev.inverters.map((x) => ({ ...x, strings: [...x.strings] })) };
      const strIdx = next.inverters[i].strings.length;
      next.inverters[i].strings.push({ name: `${i + 1}.${strIdx}`, modules: 1 });
      return next;
    });
  };
  const removeStringFromInverter = (i, sIdx) => {
    setConfiguration((prev) => {
      const next = { ...prev, inverters: prev.inverters.map((x) => ({ ...x, strings: [...x.strings] })) };
      next.inverters[i].strings.splice(sIdx, 1);
      next.inverters[i].strings = next.inverters[i].strings.map((s, idx) => ({ ...s, name: `${i + 1}.${idx}` }));
      return next;
    });
  };
  const updateStringModules = (i, sIdx, val) => {
    const n = Math.max(1, parseInt(val) || 1);
    setConfiguration((prev) => {
      const next = { ...prev, inverters: prev.inverters.map((x) => ({ ...x, strings: [...x.strings] })) };
      next.inverters[i].strings[sIdx].modules = n;
      return next;
    });
  };
  const addInverter = () =>
    setConfiguration((prev) => ({
      ...prev,
      inverters: [...prev.inverters, { type: '', quantity: 1, strings: [{ name: `${prev.inverters.length + 1}.0`, modules: 1 }] }],
    }));
  const removeInverter = (i) =>
    setConfiguration((prev) => ({
      ...prev,
      inverters: prev.inverters.filter((_, idx) => idx !== i),
    }));

  /* ---------------- Booking ---------------- */
  const handleBookToCustomer = async () => {
    if (!selectedCustomer || !selectedProject || calculatedBOM.length === 0) {
      showNotification('Bitte Kunde und Projekt auswählen und Konfiguration vervollständigen!', 'warning');
      return;
    }
    if (isBooking) return; // Doppelklick verhindern

    setIsBooking(true);
    try {
      // Bestehende Konfigurationen für dieses Projekt laden
      const existingConfigs = await FirebaseService.getDocuments('project-configurations');
      const projectConfigs = existingConfigs.filter(config => config.projectID === selectedProject);
      
      // Nächste Versionsnummer bestimmen
      const getNextVersion = () => {
        if (projectConfigs.length === 0) return '1.0';
        
        const versions = projectConfigs
          .map(config => config.pvConfiguration?.configurationVersion || '1.0')
          .map(version => parseFloat(version))
          .filter(version => !isNaN(version));
        
        const maxVersion = Math.max(...versions, 0);
        return (maxVersion + 1.0).toFixed(1);
      };
      
      const nextVersion = getNextVersion();
      const bookingId = `pv-booking-${selectedProject}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const bookingData = {
        id: bookingId,
        customerID: selectedCustomer,
        customerName: customers.find((c) => c.id === selectedCustomer)?.firmennameKundenname || 'Unbekannt',
        projectID: selectedProject,
        projectName: projects.find((p) => p.id === selectedProject)?.projectName || 'Unbekannt',
        type: 'Ausgang',
        materials: calculatedBOM.map((i) => {
          const material = materials.find(m => m.materialID === i.materialID || m.id === i.materialID);
          const priceAtBooking = material?.price || 0;
          const totalCost = priceAtBooking * i.quantity;

          return {
            materialID: i.materialID,
            quantity: i.quantity,
            description: i.description,
            priceAtBooking: priceAtBooking,
            totalCost: totalCost,
            isConfigured: i.isConfigured || false,
            category: i.category || ''
          };
        }),
        status: 'Abgeschlossen',
        notes: 'PV-Anlagen-Konfiguration - Automatisch generierte Stückliste',
      };

      // einfache Projektkonfiguration (für VDE, wie in deiner Vorlage)
      const projectConfiguration = {
        timestamp: new Date().toISOString(),
        configurationVersion: nextVersion,
        inverters: configuration.inverters
          .filter((inv) => inv.type)
          .map((inv) => ({
            materialID: inv.type,
            description: materialsById.get(inv.type)?.description || 'Unbekannt',
            quantity: inv.quantity,
            recommendedBreaker: chosen.inverterBreaker,
            recommendedCable: chosen.inverterCable,
            strings: (inv.strings || []).map((s) => ({
              stringName: s.name,
              moduleCount: s.modules,
              moduleType: configuration.module,
              moduleDescription: materialsById.get(configuration.module)?.description || 'Unbekannt',
            })),
          })),
        modules: configuration.module
          ? {
              materialID: configuration.module,
              description: materialsById.get(configuration.module)?.description || 'Unbekannt',
              totalQuantity: layoutTotals.totalModules,
            }
          : null,
        wallbox:
          configuration.wallbox && configuration.wallboxQty > 0
            ? {
                materialID: configuration.wallbox,
                description: materialsById.get(configuration.wallbox)?.description || 'Unbekannt',
                quantity: configuration.wallboxQty,
                recommendedBreaker: chosen.wallboxBreaker,
                recommendedCable: chosen.wallboxCable,
                recommendedRCD: chosen.wallboxRCD,
              }
            : null,
        backupSolutions:
          configuration.notstromloesungen && configuration.notstromloesungenQty > 0
            ? {
                materialID: configuration.notstromloesungen,
                description: materialsById.get(configuration.notstromloesungen)?.description || 'Unbekannt',
                quantity: configuration.notstromloesungenQty,
                recommendedBreaker: chosen.backupBreaker,
                recommendedCable: chosen.backupCable,
              }
            : null,
        pvCables: defaultPvKabel
          ? {
              materialID: defaultPvKabel,
              description: materialsById.get(defaultPvKabel)?.description,
              quantity: calculatedBOM.find(item => item.materialID === defaultPvKabel)?.quantity || 0,
            }
          : null,
        potentialausgleichHESUK: defaultPotentialausgleichHESUK
          ? {
              materialID: defaultPotentialausgleichHESUK,
              description: materialsById.get(defaultPotentialausgleichHESUK)?.description,
              quantity: potentialausgleichHESUK || 0,
            }
          : null,
        generatoranschlusskasten: configuration.generatoranschlusskasten
          ? {
              materialID: configuration.generatoranschlusskasten,
              description: materialsById.get(configuration.generatoranschlusskasten)?.description || 'Unbekannt',
              quantity: configuration.generatoranschlusskastenQty,
            }
          : null,
      };

      const configId = `pv-config-${selectedProject}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

      await addBooking(bookingData);

      // Bestände für alle Materialien in der BOM aktualisieren (Ausgang = negativ)
      for (const item of calculatedBOM) {
        const material = materials.find(m => m.materialID === item.materialID || m.id === item.materialID);
        if (material) {
          await updateMaterialStock(material.id, -item.quantity);
        }
      }

      await FirebaseService.addDocument('project-configurations', {
        id: configId,
        projectID: selectedProject,
        customerID: selectedCustomer,
        pvConfiguration: projectConfiguration,
        createdAt: new Date().toISOString(),
        createdBy: 'PV-Konfigurator',
        type: 'pv-configuration',
      });

      showNotification('Stückliste und Projektkonfiguration erfolgreich gespeichert!', 'success', 5000);
      // Reset (schlank gehalten)
      setConfiguration({
        module: '',
        roofType: '',
        querformatRows: [],
        hochformatRows: [],
        pvMountingSystem: '',
        befestigungPVMountingSystem: '',
        modulEndklemmen: '',
        modulMittelklemmen: '',
        pvSteckerMale: '',
        pvSteckerFemale: '',
        profile: '',
        verbinder: '',
        endkappen: '',
        inverters: [{ type: '', quantity: 1, strings: [{ name: '1.0', modules: 1 }] }],
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
        smartDongle: '',
        smartDongleQty: 0,
      });
      setCurrentStep(0);
      setSelectedCustomer('');
      setCalculatedBOM([]);
      setWarnings([]);
    } catch (e) {
      console.error('Fehler beim Buchen:', e);
      showNotification('Fehler beim Buchen der Stückliste!', 'error');
    } finally {
      setIsBooking(false);
    }
  };

  /* ---------------- Render ---------------- */
  const steps = [
    { title: 'Layout', icon: Grid },
    { title: 'Montagesystem', icon: Wrench },
    { title: 'Wechselrichter', icon: Zap },
    { title: 'Komponenten', icon: Battery },
    { title: 'Elektrisch', icon: Plug },
    { title: 'Abschluss', icon: CheckCircle },
  ];

  return (
    <div className="h-dvh flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white shadow-sm p-6">
        {currentStep === 0 && (
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Grid className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Layout & Dachkonfiguration</h2>
              <p className="text-gray-600">Definieren Sie die Grundparameter Ihrer PV-Anlage</p>
            </div>
          </div>
        )}
        {currentStep === 1 && (
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Wrench className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">PV-Montagesystem</h2>
              <p className="text-gray-600">Wählen Sie das passende Montagesystem</p>
            </div>
          </div>
        )}
        {currentStep === 2 && (
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Zap className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Wechselrichter & Strings</h2>
              <p className="text-gray-600">Konfigurieren Sie Wechselrichter und String-Aufteilung</p>
            </div>
          </div>
        )}
        {currentStep === 3 && (
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Battery className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Zusätzliche Komponenten</h2>
              <p className="text-gray-600">Optimierer, Speicher, Wallbox usw.</p>
            </div>
          </div>
        )}
        {currentStep === 4 && (
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Plug className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Elektrische Komponenten</h2>
              <p className="text-gray-600">SLS, Kombiableiter & Co.</p>
            </div>
          </div>
        )}
        {currentStep === 5 && (
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-gray-100 p-2 rounded-lg">
              <CheckCircle className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Stückliste & Buchung</h2>
              <p className="text-gray-600">Überprüfen & buchen</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {currentStep === 0 && (
              <div className="space-y-4">
                <SectionCard titleIcon={Sun} title="PV‑Modul">
                  <LabeledSelect
                    label="PV‑Modul"
                    value={configuration.module}
                    onChange={(e) => {
                      setConfiguration((p) => ({ ...p, module: e.target.value }));
                      clearFieldError('PV-Modul');
                    }}
                    options={availableModules}
                    required
                    hasError={hasFieldError('PV-Modul')}
                    placeholder="Modul auswählen..."
                  />
                </SectionCard>

                <SectionCard titleIcon={Building} title="Dachtyp">
                  {hasFieldError('Dachtyp') && (
                    <p className="text-red-600 text-xs mb-3">Dachtyp muss ausgewählt werden</p>
                  )}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'Ziegel', emoji: '🏠', desc: 'Klassisches Ziegeldach' },
                      { value: 'Trapez', emoji: '🏭', desc: 'Gewerbedach' },
                      { value: 'Flach', emoji: '🏢', desc: 'Flachdach' },
                    ].map((r) => (
                      <div
                        key={r.value}
                        onClick={() => {
                          setConfiguration((p) => ({ ...p, roofType: r.value }));
                          clearFieldError('Dachtyp');
                        }}
                        className={`p-3 rounded-lg border cursor-pointer text-center transition-all ${
                          configuration.roofType === r.value
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-200 bg-white hover:border-gray-400'
                        }`}
                      >
                        <div className="text-2xl mb-1">{r.emoji}</div>
                        <div className="font-medium text-gray-900 text-sm">{r.value}dach</div>
                        <div className="text-xs text-gray-600">{r.desc}</div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard titleIcon={Layers} title="Modulanordnung">
                  {hasFieldError('Modulanordnung') && (
                    <p className="text-red-600 text-xs mb-3">Mindestens eine Reihe hinzufügen</p>
                  )}

                  <div className="grid grid-cols-2 gap-6">
                    {/* Querformat */}
                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-800 flex items-center text-sm">
                        <Target className="h-4 w-4 mr-2 text-gray-600" />
                        Querformat
                      </h3>
                      {(configuration.querformatRows || []).map((row, idx) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-medium">
                            {idx + 1}
                          </div>
                          <input
                            type="number"
                            min="1"
                            value={row.modules}
                            onChange={(e) =>
                              setConfiguration((p) => {
                                const rows = [...(p.querformatRows || [])];
                                rows[idx] = { ...rows[idx], modules: Math.max(1, parseInt(e.target.value) || 1) };
                                return { ...p, querformatRows: rows };
                              })
                            }
                            className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium"
                          />
                          <span className="text-sm text-gray-700 font-medium">Module</span>
                          <button
                            onClick={() =>
                              setConfiguration((p) => ({
                                ...p,
                                querformatRows: (p.querformatRows || []).filter((_, i) => i !== idx),
                              }))
                            }
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded ml-auto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setConfiguration((p) => ({
                            ...p,
                            querformatRows: [...(p.querformatRows || []), { modules: 1 }],
                          }));
                          clearFieldError('Modulanordnung');
                        }}
                        className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Reihe hinzufügen
                      </button>
                    </div>

                    {/* Hochformat */}
                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-800 flex items-center text-sm">
                        <Target className="h-4 w-4 mr-2 text-gray-600" />
                        Hochformat
                      </h3>
                      {(configuration.hochformatRows || []).map((row, idx) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200"
                        >
                          <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm font-medium">
                            {idx + 1}
                          </div>
                          <input
                            type="number"
                            min="1"
                            value={row.modules}
                            onChange={(e) =>
                              setConfiguration((p) => {
                                const rows = [...(p.hochformatRows || [])];
                                rows[idx] = { ...rows[idx], modules: Math.max(1, parseInt(e.target.value) || 1) };
                                return { ...p, hochformatRows: rows };
                              })
                            }
                            className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium"
                          />
                          <span className="text-sm text-gray-700 font-medium">Module</span>
                          <button
                            onClick={() =>
                              setConfiguration((p) => ({
                                ...p,
                                hochformatRows: (p.hochformatRows || []).filter((_, i) => i !== idx),
                              }))
                            }
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded ml-auto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setConfiguration((p) => ({
                            ...p,
                            hochformatRows: [...(p.hochformatRows || []), { modules: 1 }],
                          }));
                          clearFieldError('Modulanordnung');
                        }}
                        className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Reihe hinzufügen
                      </button>
                    </div>
                  </div>

                  {/* Zusammenfassung */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-800 text-sm mb-2">Zusammenfassung</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Anzahl Reihen:</span>
                        <div className="font-bold text-gray-900">{layoutTotals.totalRows}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Querformat Module:</span>
                        <div className="font-bold text-blue-900">{layoutTotals.qCount}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Hochformat Module:</span>
                        <div className="font-bold text-green-900">{layoutTotals.hCount}</div>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">Summe Module:</span>
                        <span className="text-lg font-bold text-gray-900">{layoutTotals.totalModules}</span>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <SectionCard titleIcon={Wrench} title="Montagesystem">
                  <LabeledSelect
                    label="Montagesystem"
                    value={configuration.pvMountingSystem}
                    onChange={(e) => {
                      setConfiguration((p) => ({ ...p, pvMountingSystem: e.target.value }));
                      clearFieldError('Montagesystem');
                    }}
                    options={availablePVMounting}
                    required
                    hasError={hasFieldError('Montagesystem')}
                    placeholder="System auswählen..."
                  />
                </SectionCard>

                <SectionCard titleIcon={Anchor} title="Befestigung">
                  <LabeledSelect
                    label="Befestigung für Montagesystem"
                    value={configuration.befestigungPVMountingSystem}
                    onChange={(e) => {
                      setConfiguration((p) => ({ ...p, befestigungPVMountingSystem: e.target.value }));
                      clearFieldError('Befestigung');
                    }}
                    options={optionsFromCategory(CAT.BEFESTIGUNG_PV_MOUNTING)}
                    required
                    hasError={hasFieldError('Befestigung')}
                    placeholder="Befestigung auswählen..."
                  />
                </SectionCard>

                <SectionCard titleIcon={Plug} title="Modulklemmen">
                  <div className="grid grid-cols-2 gap-4">
                    <LabeledSelect
                      label="Endklemmen"
                      value={configuration.modulEndklemmen}
                      onChange={(e) => {
                        setConfiguration((p) => ({ ...p, modulEndklemmen: e.target.value }));
                        clearFieldError('Endklemmen');
                      }}
                      options={availableClamps}
                      required
                      hasError={hasFieldError('Endklemmen')}
                      placeholder="Klemme auswählen..."
                    />
                    <LabeledSelect
                      label="Mittelklemmen"
                      value={configuration.modulMittelklemmen}
                      onChange={(e) => {
                        setConfiguration((p) => ({ ...p, modulMittelklemmen: e.target.value }));
                        clearFieldError('Mittelklemmen');
                      }}
                      options={availableClamps}
                      required
                      hasError={hasFieldError('Mittelklemmen')}
                      placeholder="Klemme auswählen..."
                    />
                  </div>
                </SectionCard>

                {configuration.roofType === 'Ziegel' && (
                  <SectionCard titleIcon={Home} title="Zusätzlich für Ziegeldach">
                    <div className="space-y-4">
                      <LabeledSelect
                        label="Profile"
                        value={configuration.profile}
                        onChange={(e) => {
                          setConfiguration((p) => ({ ...p, profile: e.target.value }));
                          clearFieldError('Profil');
                        }}
                        options={availableProfiles}
                        required
                        hasError={hasFieldError('Profil')}
                        placeholder="Profil auswählen..."
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <LabeledSelect
                          label="Verbinder"
                          value={configuration.verbinder}
                          onChange={(e) => {
                            setConfiguration((p) => ({ ...p, verbinder: e.target.value }));
                            clearFieldError('Verbinder');
                          }}
                          options={optionsFromCategory(CAT.VERBINDER)}
                          required
                          hasError={hasFieldError('Verbinder')}
                          placeholder="Verbinder auswählen..."
                        />
                        <LabeledSelect
                          label="Endkappen"
                          value={configuration.endkappen}
                          onChange={(e) => {
                            setConfiguration((p) => ({ ...p, endkappen: e.target.value }));
                            clearFieldError('Endkappen');
                          }}
                          options={optionsFromCategory(CAT.ENDKAPPEN)}
                          required
                          hasError={hasFieldError('Endkappen')}
                          placeholder="Endkappen auswählen..."
                        />
                      </div>
                    </div>
                  </SectionCard>
                )}

                <SectionCard titleIcon={Plug} title="PV‑Stecker">
                  <div className="grid grid-cols-2 gap-4">
                    <LabeledSelect
                      label="PV‑Stecker (Male)"
                      value={configuration.pvSteckerMale}
                      onChange={(e) => {
                        setConfiguration((p) => ({ ...p, pvSteckerMale: e.target.value }));
                        clearFieldError('PV-Stecker Male');
                      }}
                      options={availableConnectors}
                      required
                      hasError={hasFieldError('PV-Stecker Male')}
                      placeholder="Stecker auswählen..."
                    />
                    <LabeledSelect
                      label="PV‑Stecker (Female)"
                      value={configuration.pvSteckerFemale}
                      onChange={(e) => {
                        setConfiguration((p) => ({ ...p, pvSteckerFemale: e.target.value }));
                        clearFieldError('PV-Stecker Female');
                      }}
                      options={availableConnectors}
                      required
                      hasError={hasFieldError('PV-Stecker Female')}
                      placeholder="Stecker auswählen..."
                    />
                  </div>
                </SectionCard>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                {configuration.inverters.map((inv, i) => (
                  <div key={i} className="p-4 border border-gray-200 rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-800">Wechselrichter #{i + 1}</h3>
                      {i > 0 && (
                        <button onClick={() => removeInverter(i)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <LabeledSelect
                      label="Typ"
                      value={inv.type}
                      onChange={(e) => {
                        const v = e.target.value;
                        setConfiguration((p) => {
                          const next = { ...p, inverters: p.inverters.map((x) => ({ ...x })) };
                          next.inverters[i].type = v;
                          return next;
                        });
                        clearFieldError(`Wechselrichter ${i + 1}`);
                      }}
                      options={availableInverters}
                      required
                      hasError={hasFieldError(`Wechselrichter ${i + 1}`)}
                      placeholder="Wechselrichter auswählen..."
                    />

                    {/* Empfehlungen (änderbar via Override) */}
                    {(recommendations.inverterBreaker || recommendations.inverterCable) && inv.type && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">Automatische Empfehlungen</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {recommendations.inverterBreaker && (
                            <LabeledSelect
                              label="Leitungsschutzschalter (WR)"
                              value={chosen.inverterBreaker || ''}
                              onChange={(e) => setOverrideRec((o) => ({ ...o, inverterBreaker: e.target.value }))}
                              options={availableCircuitBreakers}
                              placeholder="LS auswählen..."
                            />
                          )}
                          {recommendations.inverterCable && (
                            <LabeledSelect
                              label="Mantelleitung (WR)"
                              value={chosen.inverterCable || ''}
                              onChange={(e) => setOverrideRec((o) => ({ ...o, inverterCable: e.target.value }))}
                              options={availableCables}
                              placeholder="Kabel auswählen..."
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Strings */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Strings</h4>
                      <div className="space-y-2">
                        {(inv.strings || []).map((s, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <span className="font-mono text-sm">{s.name}</span>
                            <input
                              type="number"
                              min="1"
                              value={s.modules}
                              onChange={(e) => updateStringModules(i, sIdx, e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1"
                            />
                            <button onClick={() => removeStringFromInverter(i, sIdx)} className="text-gray-500 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => addStringToInverter(i)}
                        className="mt-2 flex items-center text-sm text-primary-600 hover:text-primary-800"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        String hinzufügen
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addInverter}
                  className="w-full flex justify-center items-center py-2 px-4 border border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Weiteren Wechselrichter hinzufügen
                </button>

                {hasFieldError('String-Module-Anzahl') && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                      <p className="text-red-800 font-medium">String-Module-Anzahl stimmt nicht mit der Gesamtsumme überein.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Wallbox + Empfehlungen */}
                <SectionCard>
                  <div className="grid grid-cols-2 gap-4">
                    <LabeledSelect
                      label="Wallbox"
                      value={configuration.wallbox}
                      onChange={(e) => {
                        setConfiguration((p) => ({ ...p, wallbox: e.target.value }));
                        clearFieldError('Wallbox');
                      }}
                      options={availableWallboxes}
                      placeholder="Keine Wallbox"
                      hasError={hasFieldError('Wallbox')}
                    />
                    <LabeledNumber
                      label="Anzahl"
                      value={configuration.wallboxQty}
                      onChange={(e) => {
                        setConfiguration((p) => ({ ...p, wallboxQty: Math.max(0, parseInt(e.target.value) || 0) }));
                        clearFieldError('Wallbox');
                      }}
                      min={0}
                      hasError={hasFieldError('Wallbox')}
                    />
                  </div>

                  {configuration.wallbox && (
                    <div className="bg-blue-50 p-3 rounded-lg mt-3">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Automatische Empfehlungen</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <LabeledSelect
                          label="Leitungsschutzschalter"
                          value={chosen.wallboxBreaker || ''}
                          onChange={(e) => setOverrideRec((o) => ({ ...o, wallboxBreaker: e.target.value }))}
                          options={availableCircuitBreakers}
                          placeholder="LS auswählen..."
                        />
                        <LabeledSelect
                          label="Mantelleitung"
                          value={chosen.wallboxCable || ''}
                          onChange={(e) => setOverrideRec((o) => ({ ...o, wallboxCable: e.target.value }))}
                          options={availableCables}
                          placeholder="Kabel auswählen..."
                        />
                        <LabeledSelect
                          label="FI‑Schutzschalter"
                          value={chosen.wallboxRCD || ''}
                          onChange={(e) => setOverrideRec((o) => ({ ...o, wallboxRCD: e.target.value }))}
                          options={availableRCDs}
                          placeholder="RCD auswählen..."
                        />
                      </div>
                    </div>
                  )}
                </SectionCard>

                {/* Speicher */}
                <SectionCard title="Speicher">
                  <div className="grid grid-cols-2 gap-4">
                    <LabeledSelect
                      label="Speicher"
                      value={configuration.battery}
                      onChange={(e) => {
                        setConfiguration((p) => ({ ...p, battery: e.target.value }));
                        clearFieldError('Speicher');
                      }}
                      options={availableBatteries}
                      placeholder="Kein Speicher"
                      hasError={hasFieldError('Speicher')}
                    />
                    <LabeledNumber
                      label="Anzahl"
                      value={configuration.batteryQty}
                      onChange={(e) => {
                        setConfiguration((p) => ({ ...p, batteryQty: Math.max(0, parseInt(e.target.value) || 0) }));
                        clearFieldError('Speicher');
                      }}
                      min={0}
                      hasError={hasFieldError('Speicher')}
                    />
                  </div>
                </SectionCard>

                {/* Energiemanagement */}
                <SectionCard title="Energiemanagement">
                  <div className="grid grid-cols-2 gap-4">
                    <LabeledSelect
                      label="Energiemanagement"
                      value={configuration.energiemanagement}
                      onChange={(e) => {
                        setConfiguration((p) => ({ ...p, energiemanagement: e.target.value }));
                        clearFieldError('Energiemanagement');
                      }}
                      options={optionsFromCategory(CAT.ENERGY_MGMT)}
                      placeholder="Kein Energiemanagement"
                      hasError={hasFieldError('Energiemanagement')}
                    />
                    <LabeledNumber
                      label="Anzahl"
                      value={configuration.energiemanagementQty}
                      onChange={(e) => {
                        setConfiguration((p) => ({
                          ...p,
                          energiemanagementQty: Math.max(0, parseInt(e.target.value) || 0),
                        }));
                        clearFieldError('Energiemanagement');
                      }}
                      min={0}
                      hasError={hasFieldError('Energiemanagement')}
                    />
                  </div>
                </SectionCard>

                {/* Notstromlösungen + Empfehlungen */}
                <SectionCard title="Notstromlösungen">
                  <div className="grid grid-cols-2 gap-4">
                    <LabeledSelect
                      label="Notstromlösung"
                      value={configuration.notstromloesungen}
                      onChange={(e) => {
                        setConfiguration((p) => ({ ...p, notstromloesungen: e.target.value }));
                        clearFieldError('Notstromlösungen');
                      }}
                      options={optionsFromCategory(CAT.BACKUP_BOXES)}
                      placeholder="Keine Notstromlösung"
                      hasError={hasFieldError('Notstromlösungen')}
                    />
                    <LabeledNumber
                      label="Anzahl"
                      value={configuration.notstromloesungenQty}
                      onChange={(e) => {
                        setConfiguration((p) => ({
                          ...p,
                          notstromloesungenQty: Math.max(0, parseInt(e.target.value) || 0),
                        }));
                        clearFieldError('Notstromlösungen');
                      }}
                      min={0}
                      hasError={hasFieldError('Notstromlösungen')}
                    />
                  </div>

                  {configuration.notstromloesungen && (
                    <div className="bg-blue-50 p-3 rounded-lg mt-3">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Automatische Empfehlungen</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <LabeledSelect
                          label="Leitungsschutzschalter"
                          value={chosen.backupBreaker || ''}
                          onChange={(e) => setOverrideRec((o) => ({ ...o, backupBreaker: e.target.value }))}
                          options={availableCircuitBreakers}
                          placeholder="LS auswählen..."
                        />
                        <LabeledSelect
                          label="Mantelleitung"
                          value={chosen.backupCable || ''}
                          onChange={(e) => setOverrideRec((o) => ({ ...o, backupCable: e.target.value }))}
                          options={availableCables}
                          placeholder="Kabel auswählen..."
                        />
                      </div>
                    </div>
                  )}
                </SectionCard>

                {/* Optimierer */}
                <SectionCard title="Optimierer">
                  <div className="grid grid-cols-2 gap-4">
                    <LabeledSelect
                      label="Optimierer"
                      value={configuration.optimizer}
                      onChange={(e) => {
                        setConfiguration((p) => ({ ...p, optimizer: e.target.value }));
                        clearFieldError('Optimierer');
                      }}
                      options={availableOptimizers}
                      placeholder="Kein Optimierer"
                      hasError={hasFieldError('Optimierer')}
                    />
                    <LabeledNumber
                      label="Anzahl"
                      value={configuration.optimizerQty}
                      onChange={(e) => {
                        setConfiguration((p) => ({ ...p, optimizerQty: Math.max(0, parseInt(e.target.value) || 0) }));
                        clearFieldError('Optimierer');
                      }}
                      min={0}
                      hasError={hasFieldError('Optimierer')}
                    />
                  </div>
                </SectionCard>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                {/* SLS */}
                <SectionCard title="SLS">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <LabeledSelect
                        label="SLS"
                        value={configuration.sls}
                        onChange={(e) => {
                          setConfiguration((p) => ({ ...p, sls: e.target.value }));
                          clearFieldError('SLS');
                        }}
                        options={optionsFromCategory(CAT.SLS)}
                        placeholder="SLS auswählen..."
                        hasError={hasFieldError('SLS')}
                      />
                    </div>
                    <LabeledNumber
                      label="Anzahl"
                      value={configuration.slsQty}
                      onChange={(e) => {
                        setConfiguration((p) => ({ ...p, slsQty: Math.max(0, parseInt(e.target.value) || 0) }));
                        clearFieldError('SLS');
                      }}
                      min={0}
                      hasError={hasFieldError('SLS')}
                    />
                  </div>
                </SectionCard>

                {/* Tiefenerder */}
                <SectionCard title="Tiefenerder">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <LabeledSelect
                        label="Tiefenerder"
                        value={configuration.tiefenerder}
                        onChange={(e) => {
                          setConfiguration((p) => ({ ...p, tiefenerder: e.target.value }));
                          clearFieldError('Tiefenerder');
                        }}
                        options={optionsFromCategory(CAT.TIEFENERDER)}
                        placeholder="Tiefenerder auswählen..."
                        hasError={hasFieldError('Tiefenerder')}
                      />
                    </div>
                    <LabeledNumber
                      label="Anzahl"
                      value={configuration.tiefenerderQty}
                      onChange={(e) => {
                        setConfiguration((p) => ({ ...p, tiefenerderQty: Math.max(0, parseInt(e.target.value) || 0) }));
                        clearFieldError('Tiefenerder');
                      }}
                      min={0}
                      hasError={hasFieldError('Tiefenerder')}
                    />
                  </div>
                </SectionCard>

                {/* Kombiableiter */}
                <SectionCard title="Kombiableiter">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <LabeledSelect
                        label="Kombiableiter"
                        value={configuration.kombiableiter}
                        onChange={(e) => {
                          setConfiguration((p) => ({ ...p, kombiableiter: e.target.value }));
                          clearFieldError('Kombiableiter');
                        }}
                        options={optionsFromCategory(CAT.KOMBIALEITER)}
                        placeholder="Kombiableiter auswählen..."
                        hasError={hasFieldError('Kombiableiter')}
                      />
                    </div>
                    <LabeledNumber
                      label="Anzahl"
                      value={configuration.kombiableiterQty}
                      onChange={(e) => {
                        setConfiguration((p) => ({ ...p, kombiableiterQty: Math.max(0, parseInt(e.target.value) || 0) }));
                        clearFieldError('Kombiableiter');
                      }}
                      min={0}
                      hasError={hasFieldError('Kombiableiter')}
                    />
                  </div>
                </SectionCard>

                {/* Zählerschrank */}
                <SectionCard title="Zählerschrank">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <LabeledSelect
                        label="Zählerschrank"
                        value={configuration.zaehlerschrank}
                        onChange={(e) => {
                          setConfiguration((p) => ({ ...p, zaehlerschrank: e.target.value }));
                          clearFieldError('Zählerschrank');
                        }}
                        options={optionsFromCategory(CAT.ZAEHLERSCHRANK)}
                        placeholder="Zählerschrank auswählen..."
                        hasError={hasFieldError('Zählerschrank')}
                      />
                    </div>
                    <LabeledNumber
                      label="Anzahl"
                      value={configuration.zaehlerschrankQty}
                      onChange={(e) => {
                        setConfiguration((p) => ({ ...p, zaehlerschrankQty: Math.max(0, parseInt(e.target.value) || 0) }));
                        clearFieldError('Zählerschrank');
                      }}
                      min={0}
                      hasError={hasFieldError('Zählerschrank')}
                    />
                  </div>
                </SectionCard>

                {/* Generatoranschlusskasten */}
                <SectionCard title="Generatoranschlusskasten">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <LabeledSelect
                        label="Generatoranschlusskasten"
                        value={configuration.generatoranschlusskasten}
                        onChange={(e) => {
                          setConfiguration((p) => ({ ...p, generatoranschlusskasten: e.target.value }));
                          clearFieldError('Generatoranschlusskasten');
                        }}
                        options={optionsFromCategory(CAT.GENERATORANSCHLUSSKASTEN)}
                        placeholder="Generatoranschlusskasten auswählen..."
                        hasError={hasFieldError('Generatoranschlusskasten')}
                      />
                    </div>
                    <LabeledNumber
                      label="Anzahl"
                      value={configuration.generatoranschlusskastenQty}
                      onChange={(e) => {
                        setConfiguration((p) => ({ ...p, generatoranschlusskastenQty: Math.max(0, parseInt(e.target.value) || 0) }));
                        clearFieldError('Generatoranschlusskasten');
                      }}
                      min={0}
                      hasError={hasFieldError('Generatoranschlusskasten')}
                    />
                  </div>
                </SectionCard>

                {/* APZ */}
                <SectionCard title="Spannungsversorgung APZ">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <LabeledSelect
                        label="Spannungsversorgung APZ"
                        value={configuration.spannungsversorgungAPZ}
                        onChange={(e) => {
                          setConfiguration((p) => ({ ...p, spannungsversorgungAPZ: e.target.value }));
                          clearFieldError('SpannungsversorgungAPZ');
                        }}
                        options={optionsFromCategory(CAT.APZ)}
                        placeholder="APZ auswählen..."
                        hasError={hasFieldError('SpannungsversorgungAPZ')}
                      />
                    </div>
                    <LabeledNumber
                      label="Anzahl"
                      value={configuration.spannungsversorgungAPZQty}
                      onChange={(e) => {
                        setConfiguration((p) => ({
                          ...p,
                          spannungsversorgungAPZQty: Math.max(0, parseInt(e.target.value) || 0),
                        }));
                        clearFieldError('SpannungsversorgungAPZ');
                      }}
                      min={0}
                      hasError={hasFieldError('SpannungsversorgungAPZ')}
                    />
                  </div>
                </SectionCard>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                {/* Warnungen */}
                {(warnings.length > 0 || baseBOMWithWarnings.warnings.length > 0) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Warnungen</h3>
                        <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                          {[...new Set([...(warnings || []), ...(baseBOMWithWarnings.warnings || [])])].map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* BOM Tabelle */}
                {calculatedBOM.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">Stückliste</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={resetBOMToRecommended}
                          className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                          title="BOM auf aktuelle Empfehlungen zurücksetzen"
                        >
                          Neu berechnen
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddMaterialModal(true)}
                          className="px-3 py-2 text-sm bg-primary-600 text-white border border-transparent rounded hover:bg-primary-700"
                          title="Material manuell hinzufügen"
                        >
                          + Material hinzufügen
                        </button>
                      </div>
                    </div>
                    {/* Konfigurierte Komponenten */}
                    {(() => {
                      const configuredItems = calculatedBOM
                        .map((item, index) => ({ ...item, originalIndex: index }))
                        .filter(item => item.isConfigured);
                      const autoItems = calculatedBOM
                        .map((item, index) => ({ ...item, originalIndex: index }))
                        .filter(item => !item.isConfigured && !item.isManual);
                      const manualItems = calculatedBOM
                        .map((item, index) => ({ ...item, originalIndex: index }))
                        .filter(item => item.isManual);

                      const renderTable = (items, title, bgColor, borderColor) => (
                        items.length > 0 && (
                          <div className={`border ${borderColor} rounded-lg overflow-hidden mb-4`}>
                            <div className={`${bgColor} px-4 py-2 border-b ${borderColor}`}>
                              <h4 className="font-semibold text-gray-800 text-sm flex items-center">
                                {title}
                                <span className="ml-2 text-xs font-normal text-gray-500">({items.length} Positionen)</span>
                              </h4>
                            </div>
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Material
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                    Anzahl
                                  </th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                                    Aktion
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {items.map((item) => (
                                  <tr key={`${item.materialID}-${item.originalIndex}`}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                      <div className="flex items-center space-x-2">
                                        <span>{materialsById.get(item.materialID)?.description || item.description}</span>
                                        {item.category && (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                            {item.category}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                      <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => {
                                          const newQty = Math.max(1, parseInt(e.target.value) || 1);
                                          const idx = item.originalIndex;
                                          setCalculatedBOM((prev) => {
                                            const next = [...prev];
                                            next[idx] = { ...prev[idx], quantity: newQty };
                                            return next;
                                          });
                                        }}
                                        className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                                      />
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-center">
                                      <button
                                        onClick={() => {
                                          const idx = item.originalIndex;
                                          setCalculatedBOM((prev) => prev.filter((_, i) => i !== idx));
                                        }}
                                        className="text-red-600 hover:text-red-800 transition-colors"
                                        title="Position entfernen"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      );

                      return (
                        <div className="space-y-4">
                          {renderTable(configuredItems, 'Konfigurierte Komponenten', 'bg-blue-50', 'border-blue-200')}
                          {renderTable(autoItems, 'Automatisch berechnetes Material', 'bg-gray-50', 'border-gray-200')}
                          {renderTable(manualItems, 'Manuell hinzugefügt', 'bg-green-50', 'border-green-200')}
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <p className="text-gray-500">Keine Materialien berechnet.</p>
                )}

                {/* Kundenbuchung */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Kundenbuchung</h3>
                  <div className="mt-2">
                    <LabeledSelect
                      label="Kunde"
                      value={selectedCustomer}
                      onChange={(e) => setSelectedCustomer(e.target.value)}
                      options={customers.map((c) => ({ value: c.id, label: c.firmennameKundenname }))}
                      placeholder="Kunde auswählen..."
                    />
                  </div>
                  {selectedCustomer && (
                    <div className="mt-4">
                      <LabeledSelect
                        label="Projekt"
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        options={
                          customerProjects.length
                            ? customerProjects.map((p) => ({
                                value: p.id,
                                label: `${p.name || p.projectName} (${p.status})`,
                              }))
                            : []
                        }
                        placeholder="Projekt auswählen..."
                      />
                      {customerProjects.length === 0 && (
                        <p className="text-sm text-gray-500 mt-1">Keine Projekte für diesen Kunden gefunden</p>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleBookToCustomer}
                    disabled={!selectedCustomer || !selectedProject || calculatedBOM.length === 0 || warnings.length > 0 || isBooking}
                    className="mt-4 w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isBooking ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Wird gebucht...
                      </>
                    ) : (
                      'Stückliste an Projekt buchen'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex-shrink-0 bg-white shadow-lg border-t border-gray-200 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Zurück
            </button>

            <div className="text-sm text-gray-500">Schritt {currentStep + 1} von {steps.length}</div>

            <button
              onClick={handleNext}
              disabled={currentStep === 5}
              className="flex items-center px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {currentStep === 5 ? 'Fertig' : 'Weiter'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      </div>

      {/* Material hinzufügen Modal */}
      {showAddMaterialModal && (
        <AddMaterialModal
          materials={materials}
          onAddMaterial={(materialId, quantity) => addMaterialToBOM(materialId, quantity, true)}
          onClose={() => setShowAddMaterialModal(false)}
        />
      )}
    </div>
  );
};


// Modal zum Hinzufügen von Materialien mit Suchfunktion
const AddMaterialModal = ({ materials, onAddMaterial, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState([]);

  const filteredMaterials = materials.filter(material => 
    material.materialID && material.description &&
    (material.materialID.toLowerCase().includes(searchTerm.toLowerCase()) ||
     material.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addToSelection = (material) => {
    const existing = selectedMaterials.find(item => item.materialID === material.materialID);
    if (existing) {
      setSelectedMaterials(prev => 
        prev.map(item => 
          item.materialID === material.materialID 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedMaterials(prev => [...prev, {
        materialID: material.materialID || material.id,
        description: material.description,
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (materialID, quantity) => {
    if (quantity <= 0) {
      setSelectedMaterials(prev => prev.filter(item => item.materialID !== materialID));
    } else {
      setSelectedMaterials(prev => 
        prev.map(item => 
          item.materialID === materialID 
            ? { ...item, quantity: quantity }
            : item
        )
      );
    }
  };

  const handleAddAll = () => {
    selectedMaterials.forEach(item => {
      onAddMaterial(item.materialID, item.quantity);
    });
    onClose();
  };

  const footerButtons = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        Abbrechen
      </button>
      <button
        type="button"
        onClick={handleAddAll}
        disabled={selectedMaterials.length === 0}
        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Hinzufügen ({selectedMaterials.length})
      </button>
    </>
  );

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Material hinzufügen"
      icon={Plus}
      footerButtons={footerButtons}
      maxWidth="max-w-4xl"
    >
      {/* Suchfeld */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Material suchen..."
          />
        </div>
      </div>

      {/* Materialien Liste */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Verfügbare Materialien</h4>
        <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-md">
          {filteredMaterials.map((material) => (
            <div key={material.id} className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {material.description}
                </div>
                <div className="text-sm text-gray-500">
                  {material.materialID} | Lager: {material.stock || 0} Stück
                </div>
              </div>
              <button
                onClick={() => addToSelection(material)}
                className="ml-3 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ))}
          {filteredMaterials.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              Keine Materialien gefunden
            </div>
          )}
        </div>
      </div>

      {/* Ausgewählte Materialien */}
      {selectedMaterials.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Ausgewählte Materialien</h4>
          <div className="space-y-2">
            {selectedMaterials.map((item) => (
              <div key={item.materialID} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{item.description}</div>
                  <div className="text-xs text-gray-500">{item.materialID}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.materialID, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.materialID, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => updateQuantity(item.materialID, 0)}
                    className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-100 rounded ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </BaseModal>
  );
};

export default PVConfigurator;
