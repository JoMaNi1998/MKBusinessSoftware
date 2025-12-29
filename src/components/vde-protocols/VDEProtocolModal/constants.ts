import { VDEData, CheckboxConfig } from './types';

/**
 * ZENTRALE SPEZIFIKATIONS-IDs (eine Quelle der Wahrheit)
 */
export const SPEC = {
  MODULE: {
    PMAX_DC: 'l5YKWiis3xv1nM5BAawD',
    UOC:     'YuqUNbkdBZqpeLdqfLWP',
    ISC:     'u41eflH6Ak3AOUMueySE',
    UMPP:    'Irsy90GsYpb5t0IMEo8q',
  },
  INV: {
    ISO_MON: 'gSFt9cxxbLKMFzgmfMGp',
    SPD_DC:  'QaoagxVWqsGmDB5jQ5yQ',
    SPD_AC:  'SMVHZ0IEKCd2rtmzf75d',
    RCM:     'O3cfxHm1deuw6PwrZdDb',
    AC_OC:   'R7THqMHCNV2PN1GFs5c3',
    AC_SC:   '2pYLbsyV2M0bG5snzDsy',
    AFCI:    'P9e994aQn34DacV5jnN3',

    PMAX_DC: 'nYZpbMVkT7GTzgBJuPTo',
    PNOM_AC: '0dytwvoi0zhNVpYhifa0',
    PMAX_AC: '8OGt81iqbClXYtLqXVHy',
  },
  GAK: {
    SPD_TYPE:        'VWQS3uZfdtDsbuFz1GCl',
    RATED_CURRENT:   'lHavHHgqgUnqhGFSMAlx',
    RATED_VOLTAGE:   'BavUAeJxUeOi9dnVjt2p',
  },
  WIRING: {
    WIRING_TYPE:     'be3CMLpLw9QncaZu8uRw',
    PHASE_LEADER:    'LzWhwzGGkxryk7Jyot5B',
    EARTH_LEADER:    'wuKlDRXKCpFu2gTO58CQ',
  },
} as const;

/**
 * Initiale VDE-Daten für ein neues Protokoll
 */
export const initialVdeData: VDEData = {
  // Seite 1
  address: '',
  customerName: '',
  projectName: '',
  contractorName: '',
  inspectorName: 'Matteo Stockmann',
  installedPower: '',
  moduleCount: '',
  moduleType: '',
  modulePmaxDC: '',
  moduleUoc: '',
  moduleIsc: '',
  moduleUmpp: '',
  inverterCount: '',
  inverterType: '',
  inverterManufacturer: '',
  inverterPmaxDC: '',
  inverterPnomAC: '',
  inverterPmaxAC: '',
  commissioningDate: '',
  testEquipment: 'Benning IT130 SN23351174 /Benning PV2 SN09R-0875 / Benning SUN2 SN40Q-0981',
  initialTest: true,
  repeatTest: false,
  testDate: '',
  nextTestDate: '',
  noDefectsFound: true,
  compliesWithStandards: true,
  locationDate: '',
  inspectorSignature: '',
  // Seite 2
  entirePVSystem: true,
  followingCircuits: true,
  pvSystemInspected: true,
  dcSystemGeneral: true,
  dcComponentsRated: true,
  dcComponentsMaxRated: true,
  protectionClass2: true,
  pvCablesSelected: true,
  wiringSystemSelected: true,
  systemsWithoutOvercurrent: true,
  acDcCablesSeparated: true,
  systemsWithOvercurrent: true,
  dcDisconnectorInstalled: true,
  blockingDiodesInstalled: true,
  inverterSimpleSeparation: true,
  alternativeRcdTypeB: false,
  wiringLoopsMinimized: true,
  pvFrameEquipotential: true,
  equipotentialConductors: true,
  // Seite 3
  acSideDisconnection: true,
  switchingDevicesConnected: true,
  protectionSettingsProgrammed: true,
  allCircuitsLabeled: true,
  dcJunctionBoxesWarning: true,
  acMainSwitchLabeled: true,
  dualSupplyWarnings: true,
  schematicDiagramOnSite: true,
  protectionSettingsOnSite: true,
  emergencyShutdownProcedures: true,
  signsSecurelyAttached: true,
  ventilationBehindPV: true,
  framesCorrosionResistant: true,
  framesProperlySecured: true,
  cableRoutingWeatherproof: true,
  // Seite 4
  testAccordingVDE0100600: true,
  testAccordingVDE0105100: false,
  networkVoltage1: 230,
  networkVoltage2: 400,
  networkTNC: false,
  networkTNS: false,
  networkTNCS: false,
  networkTT: false,
  networkIT: false,
  selectionOfEquipment: true,
  protectionAgainstDirectContact: true,
  cablesLinesbusbars: true,
  circuitIdentification: true,
  nPeIdentification: true,
  protectionMonitoringDevices: true,
  mainEquipotentialBonding: true,
  conductorConnections: true,
  isolatingDevices: true,
  systemFunctionTest: true,
  rcdTest: true,
  protectiveConductorContinuity: true,
  earthingResistance: '',
  // Seite 5 / Projektdaten werden per useEffect ergänzt
  measurementWithoutLoad: true,
  measurementWithLoad: false,
  projectConfig: undefined,
  materials: undefined,
  strings: [],
};

/**
 * Seiten-Namen für Navigation
 */
export const pageNames: string[] = [
  'Anlagenübersicht',
  'Besichtigung (1)',
  'Besichtigung (2)',
  'AC-Seite Prüfung',
  'PV-Generator Prüfung'
];

/**
 * Checkbox-Konfigurationen für Seite 2 (Besichtigung 1)
 */
export const PAGE2_LIST: CheckboxConfig[] = [
  { field: 'entirePVSystem', label: 'Gesamte Photovoltaikanlage:' },
  { field: 'followingCircuits', label: 'Folgende Stromkreise:' },
  { field: 'pvSystemInspected', label: 'Besichtigung nach DIN VDE 0100-600 (IEC 60364-6)' },
];

export const PAGE2_CONSTRUCTION: CheckboxConfig[] = [
  { field: 'dcSystemGeneral', label: 'Gleichstromsystem nach DIN VDE 0100 / -712 konstruiert, ausgewählt und errichtet' },
  { field: 'dcComponentsRated', label: 'Gleichstromkomponenten für DC-Betrieb bemessen' },
  { field: 'dcComponentsMaxRated', label: 'Komponenten für max. Strom & Spannung bemessen' },
  { field: 'protectionClass2', label: 'Schutz durch Klasse II oder gleichwertige Isolation' },
  { field: 'pvCablesSelected', label: 'PV-Kabel so ausgewählt, dass Erd-/Kurzschlussrisiko minimiert ist (712 522.8.1)' },
  { field: 'wiringSystemSelected', label: 'Verdrahtungssystem widersteht äußeren Einflüssen (712 522.8.3)' },
  { field: 'systemsWithoutOvercurrent', label: 'Ohne Strang-Überstromschutz: Strangkabel für summierten Fehlerstrom ausgelegt (712 433)' },
  { field: 'acDcCablesSeparated', label: 'AC- und DC-Kabel physikalisch getrennt' },
  { field: 'systemsWithOvercurrent', label: 'Mit Strang-Überstromschutz: korrekt festgelegt (712 433.2)' },
  { field: 'dcDisconnectorInstalled', label: 'DC-Lasttrennschalter auf DC-Seite des WR (712 536.2.2)' },
  { field: 'blockingDiodesInstalled', label: 'Sperrdioden: Rückspannung ≥ 2×Uo, stc (712 512.1.1)' },
];
