import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, Save, Users, Grid, Layers, Zap, Battery, Plug, LucideIcon } from 'lucide-react';

import { useMaterials } from '@context/MaterialContext';
import { useCustomers } from '@context/CustomerContext';
import { useProjects } from '@context/ProjectContext';
import { useBookings } from '@context/BookingContext';
import { useNotification } from '@context/NotificationContext';
import { useConfigurations, CONFIG_STATUS } from '@context/ConfiguratorContext';
import { useAutoSelectProject } from '@hooks/useAutoSelectProject';
import { FirebaseService } from '@services/firebaseService';
import { PV_CAT, parsePVNum } from '@utils';

import AddMaterialModal from './shared/AddMaterialModal';
import { usePVDefaults } from './hooks/usePVDefaults';
import { useBOMCalculation } from './hooks/useBOMCalculation';
import { useRecommendations } from './hooks/useRecommendations';
import { CustomerStep, LayoutStep, MountingStep, InverterStep, ExtrasStep, ElectricalStep, SummaryStep } from './steps';
import { NotificationType, BookingType } from '@app-types/enums';
import type { Material, Customer, Project } from '@app-types';
import type {
  PVConfiguration,
  PVBOMItem
} from '@app-types/components/pvConfigurator.types';

interface Step {
  id: number;
  title: string;
  icon: LucideIcon;
}

const STEPS: Step[] = [
  { id: 0, title: 'Kunde', icon: Users },
  { id: 1, title: 'Layout', icon: Grid },
  { id: 2, title: 'Montage', icon: Layers },
  { id: 3, title: 'Wechselrichter', icon: Zap },
  { id: 4, title: 'Zusatz', icon: Battery },
  { id: 5, title: 'Elektro', icon: Plug },
  { id: 6, title: 'Zusammenfassung', icon: CheckCircle },
];

const INITIAL_CONFIG: PVConfiguration = {
  module: '', roofType: '', querformatRows: [], hochformatRows: [],
  pvMountingSystem: '', befestigungPVMountingSystem: '', modulEndklemmen: '', modulMittelklemmen: '',
  pvSteckerMale: '', pvSteckerFemale: '', profile: '', verbinder: '', endkappen: '',
  inverters: [{ type: '', quantity: 1, strings: [{ name: '1.0', modules: 1 }] }],
  optimizer: '', optimizerQty: 0, battery: '', batteryQty: 0, wallbox: '', wallboxQty: 0,
  energiemanagement: '', energiemanagementQty: 0, notstromloesungen: '', notstromloesungenQty: 0,
  sls: '', slsQty: 0, tiefenerder: '', tiefenerderQty: 0, kombiableiter: '', kombiableiterQty: 0,
  zaehlerschrank: '', zaehlerschrankQty: 0, generatoranschlusskasten: '', generatoranschlusskastenQty: 0,
  spannungsversorgungAPZ: '', spannungsversorgungAPZQty: 0, smartDongle: '', smartDongleQty: 0,
};

const PVConfigurator: React.FC = () => {
  const navigate = useNavigate();
  const { id: configId } = useParams<{ id: string }>();
  const isEditMode = Boolean(configId);

  // Contexts
  const { materials, updateMaterialStock } = useMaterials();
  const { customers } = useCustomers();
  const { projects } = useProjects();
  const { addBooking } = useBookings();
  const { showNotification } = useNotification();
  const { createConfiguration, updateConfiguration, getConfiguration } = useConfigurations();

  // Hooks
  const pvDefaultsData = usePVDefaults();
  const { pvDefaults, defaults, defaultPvKabel, defaultPotentialausgleichHESUK, potentialausgleichHESUK } = pvDefaultsData;

  // State
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [customerProjects, setCustomerProjects] = useState<Project[]>([]);
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [configName, setConfigName] = useState<string>('');
  const [configuration, setConfiguration] = useState<PVConfiguration>(INITIAL_CONFIG);
  const [calculatedBOM, setCalculatedBOM] = useState<PVBOMItem[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState<boolean>(false);

  // Ref to track if BOM was already initialized for step 6
  const bomInitializedForStep6 = useRef<boolean>(false);
  // Ref to prevent project reset during initial load in edit mode
  const skipProjectResetRef = useRef<boolean>(isEditMode);

  // Materialien indexieren
  const materialsById = useMemo(() => new Map(materials.map((m: Material) => [m.id, m])), [materials]);

  const optionsFromCategory = useCallback(
    (catId: string) => materials.filter((m: Material) => m.categoryId === catId).map((m: Material) => ({ value: m.id, label: m.description || m.bezeichnung || m.id })),
    [materials]
  );

  // Layout Totals
  const layoutTotals = useMemo(() => {
    const qCount = (configuration.querformatRows || []).reduce((s, r) => s + (parseInt(String(r.modules)) || 0), 0);
    const hCount = (configuration.hochformatRows || []).reduce((s, r) => s + (parseInt(String(r.modules)) || 0), 0);
    return { totalModules: qCount + hCount, totalRows: (configuration.querformatRows?.length || 0) + (configuration.hochformatRows?.length || 0), qCount, hCount, qRows: configuration.querformatRows?.length || 0, hRows: configuration.hochformatRows?.length || 0 };
  }, [configuration.querformatRows, configuration.hochformatRows]);

  // Recommendations Hook
  const { recommendations, chosen, setOverrideRec } = useRecommendations({ configuration, materialsById, pvDefaults });

  // BOM Calculation Hook
  const baseBOMWithWarnings = useBOMCalculation({ configuration, layoutTotals, materials, materialsById, chosen: chosen as any, defaults });

  // Available Options
  const availableModules = useMemo(() => optionsFromCategory(PV_CAT.MODULES), [optionsFromCategory]);
  const availableInverters = useMemo(() => optionsFromCategory(PV_CAT.INVERTERS), [optionsFromCategory]);
  const availableWallboxes = useMemo(() => optionsFromCategory(PV_CAT.WALLBOXES), [optionsFromCategory]);
  const availableBatteries = useMemo(() => optionsFromCategory(PV_CAT.BATTERIES), [optionsFromCategory]);
  const availablePVMounting = useMemo(() => optionsFromCategory(PV_CAT.PV_MOUNTING), [optionsFromCategory]);
  const availableClamps = useMemo(() => optionsFromCategory(PV_CAT.CLAMPS), [optionsFromCategory]);
  const availableConnectors = useMemo(() => optionsFromCategory(PV_CAT.CONNECTORS), [optionsFromCategory]);
  const availableProfiles = useMemo(() => optionsFromCategory(PV_CAT.PROFILES), [optionsFromCategory]);
  const availableOptimizers = useMemo(() => optionsFromCategory(PV_CAT.OPTIMIZERS), [optionsFromCategory]);
  const availableCircuitBreakers = useMemo(() => optionsFromCategory(PV_CAT.CIRCUIT_BREAKERS), [optionsFromCategory]);
  const availableCables = useMemo(() => optionsFromCategory(PV_CAT.CABLES), [optionsFromCategory]);
  const availableRCDs = useMemo(() => optionsFromCategory(PV_CAT.RCDS), [optionsFromCategory]);

  // Kunden -> Projekte
  useEffect(() => {
    if (!selectedCustomer) { setCustomerProjects([]); setSelectedProject(''); return; }
    setCustomerProjects(projects.filter((p: Project) => p.customerID === selectedCustomer));
    // Nur Projekt zurücksetzen wenn NICHT im Edit-Mode initial load
    if (skipProjectResetRef.current) {
      skipProjectResetRef.current = false;
    } else {
      setSelectedProject('');
    }
  }, [selectedCustomer, projects]);

  // Auto-Select Projekt wenn nur eins verfügbar
  useAutoSelectProject({
    customerProjects,
    selectedProject,
    setSelectedProject,
    // Nicht auto-select während Edit-Mode initial load
    enabled: !skipProjectResetRef.current
  });

  // Konfiguration laden (Edit Mode)
  useEffect(() => {
    if (!isEditMode || !configId) return;
    const existingConfig = getConfiguration(configId);
    if (existingConfig) {
      setConfigName(existingConfig.name || '');
      setSelectedCustomer(existingConfig.customerID || '');
      setSelectedProject(existingConfig.projectID || '');
      if (existingConfig.configuration) setConfiguration(existingConfig.configuration as any);
      else if (existingConfig.configData) setConfiguration(existingConfig.configData as any);
      if ((existingConfig.billOfMaterials?.length ?? 0) > 0) {
        setCalculatedBOM((existingConfig.billOfMaterials ?? []).map((item: any) => ({ materialID: item.materialId, description: item.name, quantity: item.quantity, category: item.category, isConfigured: item.isConfigured, isManual: item.isManual })));
      }
    }
  }, [isEditMode, configId, getConfiguration]);

  // Defaults auf Konfiguration anwenden
  useEffect(() => {
    if (!pvDefaults || Object.keys(pvDefaults).length === 0) return;
    setConfiguration(prev => ({
      ...prev,
      module: pvDefaults.defaultModule || prev.module,
      roofType: pvDefaults.defaultRoofType || prev.roofType,
      pvMountingSystem: pvDefaults.defaultPvMountingSystem || prev.pvMountingSystem,
      befestigungPVMountingSystem: pvDefaults.defaultBefestigungPVMountingSystem || prev.befestigungPVMountingSystem,
      modulEndklemmen: pvDefaults.defaultModulEndklemmen || prev.modulEndklemmen,
      modulMittelklemmen: pvDefaults.defaultModulMittelklemmen || prev.modulMittelklemmen,
      pvSteckerMale: pvDefaults.defaultPvSteckerMale || prev.pvSteckerMale,
      pvSteckerFemale: pvDefaults.defaultPvSteckerFemale || prev.pvSteckerFemale,
      profile: pvDefaults.defaultProfile || prev.profile,
      verbinder: pvDefaults.defaultVerbinder || prev.verbinder,
      endkappen: pvDefaults.defaultEndkappen || prev.endkappen,
      inverters: prev.inverters.map((inv, i) => (i === 0 ? { ...inv, type: pvDefaults.defaultInverter || inv.type } : inv)),
    }));
  }, [pvDefaults]);

  // BOM automatisch bei Step 6 aktualisieren (nur einmal beim Betreten von Step 6)
  useEffect(() => {
    if (currentStep === 6 && !bomInitializedForStep6.current) {
      bomInitializedForStep6.current = true;
      setCalculatedBOM(baseBOMWithWarnings.bom);
      setWarnings(baseBOMWithWarnings.warnings);
    } else if (currentStep !== 6) {
      bomInitializedForStep6.current = false;
    }
  }, [currentStep, baseBOMWithWarnings]);

  // Validation
  const pairRequired = (matId: string, qty: number): boolean => (!!matId && qty > 0) || (!matId && !qty);
  const validateStep = (step: number): string[] => {
    const errors: string[] = [];
    if (step === 0) { if (!selectedCustomer) errors.push('Kunde'); if (!selectedProject) errors.push('Projekt'); }
    if (step === 1) { if (!configuration.module) errors.push('PV-Modul'); if (!configuration.roofType) errors.push('Dachtyp'); if ((configuration.querformatRows?.length || 0) + (configuration.hochformatRows?.length || 0) === 0) errors.push('Modulanordnung'); }
    if (step === 2) { if (!configuration.pvMountingSystem) errors.push('Montagesystem'); if (!configuration.befestigungPVMountingSystem) errors.push('Befestigung'); if (!configuration.modulEndklemmen) errors.push('Endklemmen'); if (!configuration.modulMittelklemmen) errors.push('Mittelklemmen'); if (!configuration.pvSteckerMale) errors.push('PV-Stecker Male'); if (!configuration.pvSteckerFemale) errors.push('PV-Stecker Female'); if (configuration.roofType === 'Ziegel') { if (!configuration.profile) errors.push('Profil'); if (!configuration.verbinder) errors.push('Verbinder'); if (!configuration.endkappen) errors.push('Endkappen'); } }
    if (step === 3) { configuration.inverters.forEach((inv, i) => { if (!inv.type) errors.push(`Wechselrichter ${i + 1}`); }); const ts = configuration.inverters.flatMap(inv => inv.strings || []).reduce((s, st) => s + (parseInt(String(st.modules)) || 0), 0); if (layoutTotals.totalModules > 0 && layoutTotals.totalModules !== ts) errors.push('String-Module-Anzahl'); }
    if (step === 4) { if (!pairRequired(configuration.wallbox, configuration.wallboxQty)) errors.push('Wallbox'); if (!pairRequired(configuration.battery, configuration.batteryQty)) errors.push('Speicher'); if (!pairRequired(configuration.energiemanagement, configuration.energiemanagementQty)) errors.push('Energiemanagement'); if (!pairRequired(configuration.notstromloesungen, configuration.notstromloesungenQty)) errors.push('Notstromlösungen'); if (!pairRequired(configuration.optimizer, configuration.optimizerQty)) errors.push('Optimierer'); }
    if (step === 5) { if (!pairRequired(configuration.sls, configuration.slsQty)) errors.push('SLS'); if (!pairRequired(configuration.tiefenerder, configuration.tiefenerderQty)) errors.push('Tiefenerder'); if (!pairRequired(configuration.kombiableiter, configuration.kombiableiterQty)) errors.push('Kombiableiter'); if (!pairRequired(configuration.zaehlerschrank, configuration.zaehlerschrankQty)) errors.push('Zählerschrank'); if (!pairRequired(configuration.generatoranschlusskasten, configuration.generatoranschlusskastenQty)) errors.push('Generatoranschlusskasten'); if (!pairRequired(configuration.spannungsversorgungAPZ, configuration.spannungsversorgungAPZQty)) errors.push('SpannungsversorgungAPZ'); }
    return errors;
  };
  const hasFieldError = (name: string): boolean => validationErrors.includes(name);
  const clearFieldError = (name: string) => setValidationErrors(prev => prev.filter(e => e !== name));
  const handleNext = () => { const errs = validateStep(currentStep); if (errs.length) { setValidationErrors(errs); return; } setValidationErrors([]); if (currentStep < 6) setCurrentStep(s => s + 1); };
  const handleBack = () => currentStep > 0 && setCurrentStep(s => s - 1);
  const handleCancel = () => navigate('/pv-configurator');

  // String/WR Helpers
  const addStringToInverter = (i: number) => setConfiguration(prev => { const next: PVConfiguration = { ...prev, inverters: prev.inverters.map(x => ({ ...x, strings: [...x.strings] })) }; next.inverters[i].strings.push({ name: `${i + 1}.${next.inverters[i].strings.length}`, modules: 1 }); return next; });
  const removeStringFromInverter = (i: number, sIdx: number) => setConfiguration(prev => { const next: PVConfiguration = { ...prev, inverters: prev.inverters.map(x => ({ ...x, strings: [...x.strings] })) }; next.inverters[i].strings.splice(sIdx, 1); next.inverters[i].strings = next.inverters[i].strings.map((s, idx) => ({ ...s, name: `${i + 1}.${idx}` })); return next; });
  const updateStringModules = (i: number, sIdx: number, val: number | string) => { const n = Math.max(1, parseInt(String(val)) || 1); setConfiguration(prev => { const next: PVConfiguration = { ...prev, inverters: prev.inverters.map(x => ({ ...x, strings: [...x.strings] })) }; next.inverters[i].strings[sIdx].modules = n; return next; }); };
  const addInverter = () => setConfiguration(prev => ({ ...prev, inverters: [...prev.inverters, { type: '', quantity: 1, strings: [{ name: `${prev.inverters.length + 1}.0`, modules: 1 }] }] }));
  const removeInverter = (i: number) => setConfiguration(prev => ({ ...prev, inverters: prev.inverters.filter((_, idx) => idx !== i) }));

  // BOM Helpers
  const resetBOMToRecommended = () => { setCalculatedBOM(baseBOMWithWarnings.bom); setWarnings(baseBOMWithWarnings.warnings); };
  const addMaterialToBOM = (materialId: string, quantity: number = 1, isManual: boolean = false) => {
    const material = materialsById.get(materialId);
    if (!material) return;
    const existingIndex = calculatedBOM.findIndex(item => item.materialID === materialId);
    if (existingIndex >= 0) { setCalculatedBOM(prev => { const next = [...prev]; next[existingIndex] = { ...next[existingIndex], quantity: next[existingIndex].quantity + quantity }; return next; }); }
    else { setCalculatedBOM(prev => [...prev, { materialID: materialId, description: material.description || '', quantity, isManual, category: '' }]); }
    if (isManual) setShowAddMaterialModal(false);
  };

  // Speichern
  const handleSaveConfiguration = async (status: string = CONFIG_STATUS.DRAFT) => {
    setIsSaving(true);
    try {
      const selectedMod = materialsById.get(configuration.module);
      const powerWatt = parsePVNum(selectedMod?.specifications?.kvjYqZiEZiB5kCeDQRzx || 0);
      const powerKwp = ((layoutTotals.totalModules * powerWatt) / 1000).toFixed(2);
      const configData: any = {
        name: configName || `Konfiguration ${new Date().toLocaleDateString('de-DE')}`,
        customerID: selectedCustomer || null,
        projectID: selectedProject || null,
        status,
        configuration,
        billOfMaterials: calculatedBOM.map(item => ({
          materialId: item.materialID,
          name: materialsById.get(item.materialID)?.bezeichnung || materialsById.get(item.materialID)?.description || item.description,
          articleNumber: materialsById.get(item.materialID)?.materialID || '',
          quantity: item.quantity,
          unit: materialsById.get(item.materialID)?.einheit || 'Stk',
          category: item.category || '',
          isConfigured: item.isConfigured || false,
          isManual: item.isManual || false
        })),
        totals: {
          moduleCount: layoutTotals.totalModules,
          powerKwp,
          inverterCount: configuration.inverters?.length || 1,
          batteryKwh: (configuration as any).batteryKwh || 0
        }
      };

      console.log('Speichere Konfiguration:', { isEditMode, configId });
      const result = isEditMode && configId
        ? await updateConfiguration(configId, configData)
        : await createConfiguration(configData);
      console.log('Speichern Ergebnis:', result);

      if (result?.success) {
        showNotification(isEditMode ? 'Konfiguration aktualisiert' : 'Konfiguration gespeichert', NotificationType.SUCCESS);
        navigate('/pv-configurator');
      } else {
        showNotification(result?.error || 'Fehler beim Speichern', NotificationType.ERROR);
      }
    } catch (error: any) {
      console.error('Fehler beim Speichern:', error);
      showNotification(`Fehler beim Speichern: ${error.message}`, NotificationType.ERROR);
    } finally {
      setIsSaving(false);
    }
  };

  // Buchen (TODO: Feature noch nicht implementiert in UI)
  const _handleBookToCustomer = async () => {
    if (!selectedCustomer || !selectedProject || calculatedBOM.length === 0) { showNotification('Bitte Kunde und Projekt auswählen und Konfiguration vervollständigen!', NotificationType.WARNING); return; }
    if (isBooking) return;
    setIsBooking(true);
    try {
      const existingConfigs = await FirebaseService.getDocuments('project-configurations');
      const projectConfigs = existingConfigs.filter((config: any) => config.projectID === selectedProject);
      const getNextVersion = () => { if (projectConfigs.length === 0) return '1.0'; const versions = projectConfigs.map((c: any) => parseFloat(c.pvConfiguration?.configurationVersion || '1.0')).filter((v: number) => !isNaN(v)); return (Math.max(...versions, 0) + 1.0).toFixed(1); };
      const nextVersion = getNextVersion();
      const bookingId = `pv-booking-${selectedProject}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const bookingData: any = {
        id: bookingId, customerID: selectedCustomer, customerName: customers.find((c: Customer) => c.id === selectedCustomer)?.firmennameKundenname || 'Unbekannt',
        projectID: selectedProject, projectName: projects.find((p: Project) => p.id === selectedProject)?.name || 'Unbekannt', type: BookingType.OUT,
        materials: calculatedBOM.map((i: PVBOMItem) => { const material = materials.find((m: Material) => m.materialID === i.materialID || m.id === i.materialID); const priceAtBooking = material?.price || 0; return { materialID: i.materialID, quantity: i.quantity, description: i.description, priceAtBooking, totalCost: priceAtBooking * i.quantity, isConfigured: i.isConfigured || false, category: i.category || '' }; }),
        status: 'Abgeschlossen', notes: 'PV-Anlagen-Konfiguration - Automatisch generierte Stückliste',
      };
      const projectConfiguration: any = {
        timestamp: new Date().toISOString(), configurationVersion: nextVersion,
        inverters: configuration.inverters.filter(inv => inv.type).map(inv => ({ materialID: inv.type, description: materialsById.get(inv.type)?.description || 'Unbekannt', quantity: inv.quantity, recommendedBreaker: chosen.inverterBreaker, recommendedCable: chosen.inverterCable, strings: (inv.strings || []).map(s => ({ stringName: s.name, moduleCount: s.modules, moduleType: configuration.module, moduleDescription: materialsById.get(configuration.module)?.description || 'Unbekannt' })) })),
        modules: configuration.module ? { materialID: configuration.module, description: materialsById.get(configuration.module)?.description || 'Unbekannt', totalQuantity: layoutTotals.totalModules } : null,
        wallbox: configuration.wallbox && configuration.wallboxQty > 0 ? { materialID: configuration.wallbox, description: materialsById.get(configuration.wallbox)?.description || 'Unbekannt', quantity: configuration.wallboxQty, recommendedBreaker: chosen.wallboxBreaker, recommendedCable: chosen.wallboxCable, recommendedRCD: chosen.wallboxRCD } : null,
        backupSolutions: configuration.notstromloesungen && configuration.notstromloesungenQty > 0 ? { materialID: configuration.notstromloesungen, description: materialsById.get(configuration.notstromloesungen)?.description || 'Unbekannt', quantity: configuration.notstromloesungenQty, recommendedBreaker: chosen.backupBreaker, recommendedCable: chosen.backupCable } : null,
        pvCables: defaultPvKabel ? { materialID: defaultPvKabel, description: materialsById.get(defaultPvKabel)?.description, quantity: calculatedBOM.find(item => item.materialID === defaultPvKabel)?.quantity || 0 } : null,
        potentialausgleichHESUK: defaultPotentialausgleichHESUK ? { materialID: defaultPotentialausgleichHESUK, description: materialsById.get(defaultPotentialausgleichHESUK)?.description, quantity: potentialausgleichHESUK || 0 } : null,
        generatoranschlusskasten: configuration.generatoranschlusskasten ? { materialID: configuration.generatoranschlusskasten, description: materialsById.get(configuration.generatoranschlusskasten)?.description || 'Unbekannt', quantity: configuration.generatoranschlusskastenQty } : null,
      };
      const configIdNew = `pv-config-${selectedProject}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      await addBooking(bookingData);
      for (const item of calculatedBOM) { const material = materials.find((m: Material) => m.materialID === item.materialID || m.id === item.materialID); if (material) await updateMaterialStock(material.id, -item.quantity); }
      await FirebaseService.addDocument('project-configurations', { id: configIdNew, projectID: selectedProject, customerID: selectedCustomer, pvConfiguration: projectConfiguration, createdAt: new Date().toISOString(), createdBy: 'PV-Konfigurator', type: 'pv-configuration' });
      showNotification('Stückliste und Projektkonfiguration erfolgreich gespeichert!', NotificationType.SUCCESS, 5000);
      setConfiguration(INITIAL_CONFIG); setCurrentStep(0); setSelectedCustomer(''); setCalculatedBOM([]); setWarnings([]);
    } catch (e: any) { console.error('Fehler beim Buchen:', e); showNotification('Fehler beim Buchen der Stückliste!', NotificationType.ERROR); }
    finally { setIsBooking(false); }
  };

  return (
    <div className="h-dvh flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white shadow-sm">
        <div className="px-6 py-4"><h1 className="text-xl font-bold text-gray-900">{isEditMode ? 'Konfiguration bearbeiten' : 'Neue PV-Konfiguration erstellen'}</h1></div>
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              return (
                <React.Fragment key={step.id}>
                  <div className={`flex items-center cursor-pointer ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`} onClick={() => index < currentStep && setCurrentStep(index)}>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${isActive ? 'border-blue-600 bg-blue-50' : isCompleted ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
                      {isCompleted ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span className="ml-2 text-sm font-medium hidden md:block">{step.title}</span>
                  </div>
                  {index < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-4 ${index < currentStep ? 'bg-green-600' : 'bg-gray-200'}`} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {currentStep === 0 && <CustomerStep customers={customers} customerProjects={customerProjects} selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer} selectedProject={selectedProject} setSelectedProject={setSelectedProject} hasFieldError={hasFieldError} clearFieldError={clearFieldError} />}
            {currentStep === 1 && <LayoutStep configuration={configuration} setConfiguration={setConfiguration} availableModules={availableModules} layoutTotals={layoutTotals} hasFieldError={hasFieldError} clearFieldError={clearFieldError} />}
            {currentStep === 2 && <MountingStep configuration={configuration} setConfiguration={setConfiguration} availablePVMounting={availablePVMounting} availableClamps={availableClamps} availableProfiles={availableProfiles} availableConnectors={availableConnectors} optionsFromCategory={optionsFromCategory} hasFieldError={hasFieldError} clearFieldError={clearFieldError} />}
            {currentStep === 3 && <InverterStep configuration={configuration} setConfiguration={setConfiguration} availableInverters={availableInverters} availableCircuitBreakers={availableCircuitBreakers} availableCables={availableCables} recommendations={recommendations} chosen={chosen} setOverrideRec={setOverrideRec} addStringToInverter={addStringToInverter} removeStringFromInverter={removeStringFromInverter} updateStringModules={updateStringModules} addInverter={addInverter} removeInverter={removeInverter} hasFieldError={hasFieldError} clearFieldError={clearFieldError} />}
            {currentStep === 4 && <ExtrasStep configuration={configuration} setConfiguration={setConfiguration} availableWallboxes={availableWallboxes} availableBatteries={availableBatteries} availableOptimizers={availableOptimizers} availableCircuitBreakers={availableCircuitBreakers} availableCables={availableCables} availableRCDs={availableRCDs} optionsFromCategory={optionsFromCategory} recommendations={recommendations} chosen={chosen} setOverrideRec={setOverrideRec} hasFieldError={hasFieldError} clearFieldError={clearFieldError} />}
            {currentStep === 5 && <ElectricalStep configuration={configuration} setConfiguration={setConfiguration} optionsFromCategory={optionsFromCategory} hasFieldError={hasFieldError} clearFieldError={clearFieldError} />}
            {currentStep === 6 && <SummaryStep calculatedBOM={calculatedBOM} setCalculatedBOM={setCalculatedBOM} warnings={warnings} baseBOMWithWarnings={baseBOMWithWarnings} materialsById={materialsById} resetBOMToRecommended={resetBOMToRecommended} setShowAddMaterialModal={setShowAddMaterialModal} />}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 bg-white border-t px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between">
          <button onClick={currentStep === 0 ? handleCancel : handleBack} className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center"><ChevronLeft className="h-5 w-5 mr-1" />{currentStep === 0 ? 'Abbrechen' : 'Zurück'}</button>
          {currentStep < STEPS.length - 1 ? (
            <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">Weiter<ChevronRight className="h-5 w-5 ml-1" /></button>
          ) : (
            <button onClick={() => handleSaveConfiguration(CONFIG_STATUS.DRAFT)} disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"><Save className="h-5 w-5 mr-2" />{isSaving ? 'Speichern...' : 'Konfiguration speichern'}</button>
          )}
        </div>
      </div>

      {showAddMaterialModal && <AddMaterialModal materials={materials} onAddMaterial={(materialId: string, quantity: number) => addMaterialToBOM(materialId, quantity, true)} onClose={() => setShowAddMaterialModal(false)} />}
    </div>
  );
};

export default PVConfigurator;
