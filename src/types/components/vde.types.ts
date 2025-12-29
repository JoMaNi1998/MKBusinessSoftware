/**
 * Type Definitions für VDE Protocol Komponenten
 *
 * Types für VDE-Protokolle, Print Rendering,
 * Page Navigation und Protocol-spezifische Operationen.
 */

// ============================================
// VDE PROTOCOL DATA
// ============================================

export interface VDEProtocolData {
  // Anlagendaten
  customerName: string;
  address: string;
  projectName: string;

  // Modulangaben
  moduleType: string;
  moduleCount: number | string;
  modulePmaxDC: string;
  moduleUoc: string;
  moduleIsc: string;
  moduleUmpp: string;
  installedPower: string;

  // Wechselrichter
  inverterCount: number | string;
  inverterType1?: string;
  inverterPmaxDC1?: string;
  inverterPnomAC1?: string;
  inverterPmaxAC1?: string;
  inverterType2?: string;
  inverterPmaxDC2?: string;
  inverterPnomAC2?: string;
  inverterPmaxAC2?: string;

  // Sicherheitseinrichtungen
  isolationMonitoring?: string;
  spdDC?: string;
  spdAC?: string;
  rcm?: string;
  acOvercurrent?: string;
  acShortCircuit?: string;
  afci?: string;

  // Zusätzliche Felder (dynamisch)
  [key: string]: string | number | boolean | undefined;
}

// ============================================
// VDE PAGE DATA
// ============================================

export interface VDEPageProps {
  vdeData: VDEProtocolData;
  setVdeData: React.Dispatch<React.SetStateAction<VDEProtocolData>>;
  errors: Record<string, string>;
}

export interface VDEPage {
  id: number;
  title: string;
  component: React.ComponentType<VDEPageProps>;
}

// ============================================
// VDE SPECIFICATION MAPPING
// ============================================

export interface SpecificationValue {
  label: string;
  value: string;
  unit?: string;
}

export interface SpecificationMapping {
  MODULE: {
    PMAX_DC: string;
    UOC: string;
    ISC: string;
    UMPP: string;
    IMPP?: string;
    TEMP_COEFF?: string;
  };
  INV: {
    PMAX_DC: string;
    PNOM_AC: string;
    PMAX_AC: string;
    ISO_MON: string;
    SPD_DC: string;
    SPD_AC: string;
    RCM: string;
    AC_OC: string;
    AC_SC: string;
    AFCI: string;
  };
}

// ============================================
// VDE PROTOCOL MODAL PROPS
// ============================================

export interface VDEProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  protocol?: {
    vdeData?: VDEProtocolData;
    customerName?: string;
    address?: string;
    projectName?: string;
    moduleType?: string;
    moduleCount?: number;
    inverterType1?: string;
    inverterType2?: string;
    [key: string]: unknown;
  } | null;
  hideActions?: boolean;
}

// ============================================
// VDE FIELD COMPONENTS
// ============================================

export interface InputFieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: 'text' | 'number';
  unit?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export interface CheckboxFieldProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export interface SectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export interface PageHeaderProps {
  pageNumber: number;
  title: string;
  subtitle?: string;
}

// ============================================
// VDE PRINT RENDERING
// ============================================

export interface PrintPortalProps {
  children: React.ReactNode;
  containerId?: string;
}

export interface UsePrintPortalReturn {
  printMount: HTMLElement | null;
  isPrinting: boolean;
  handlePrint: () => void;
}

// ============================================
// VDE HOOKS
// ============================================

export interface UseVDEDataReturn {
  vdeData: VDEProtocolData;
  setVdeData: React.Dispatch<React.SetStateAction<VDEProtocolData>>;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  validateField: (field: string, value: unknown) => boolean;
  validateAll: () => boolean;
  loadFromProtocol: (protocol: VDEProtocolModalProps['protocol']) => void;
  resetData: () => void;
}

export interface UseVDEPrintReturn {
  printMount: HTMLElement | null;
  isPrinting: boolean;
  print: () => void;
}

// ============================================
// VDE CONSTANTS
// ============================================

export const VDE_SPEC_KEYS = {
  MODULE: {
    PMAX_DC: 'Pmax DC',
    UOC: 'Uoc',
    ISC: 'Isc',
    UMPP: 'Umpp',
    IMPP: 'Impp'
  },
  INV: {
    PMAX_DC: 'Pmax DC',
    PNOM_AC: 'Pnom AC',
    PMAX_AC: 'Pmax AC',
    ISO_MON: 'Isolationsüberwachung',
    SPD_DC: 'Überspannungsschutz DC',
    SPD_AC: 'Überspannungsschutz AC',
    RCM: 'Fehlerstrom-Schutzeinrichtung',
    AC_OC: 'Überstromschutz AC',
    AC_SC: 'Kurzschlussschutz AC',
    AFCI: 'AFCI'
  }
} as const;
