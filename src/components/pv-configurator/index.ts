/**
 * PV-Konfigurator Module Exports
 *
 * Zentrale Export-Datei für alle PV-Konfigurator-Komponenten und Hooks
 */

// Konstanten
export { CAT, SPEC, ROOF_TYPES, WIZARD_STEPS, DEFAULT_CONFIGURATION } from './constants';
export type { RoofType, WizardStep, ModuleRow, InverterConfig, Configuration } from './constants';

// Utility-Funktionen
export {
  parseNum,
  getSpec,
  getBreakerCurrent,
  getCableMM2,
  getCableTable,
  calculateLayoutTotals,
  optionsFromCategory,
  createMaterialsById,
  pairRequired,
  generateUniqueId,
  getNextConfigVersion,
} from './utils';

// Shared Components
export {
  SectionCard,
  LabeledSelect,
  LabeledNumber,
  LabeledInput,
  ValidationErrorBox,
  InfoBox,
  GridSelect,
  QuantitySelector,
} from './shared/FormComponents';

export { default as AddMaterialModal } from './shared/AddMaterialModal';

// Hooks
export { usePVDefaults } from './hooks/usePVDefaults';

// Hauptkomponenten
export { default as PVConfigurator } from './PVConfigurator';
export { default as ConfiguratorManagement } from './ConfiguratorManagement';
export { default as ConfigPreview } from './ConfigPreview';
