import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Package,
  Edit,
  Eye,
  CheckCircle,
  Send,
  LucideIcon
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOffers, OFFER_STATUS } from '@context/OfferContext';
import { useServiceCatalog, SERVICE_CATEGORIES } from '@context/ServiceCatalogContext';
import { useCalculation } from '@context/CalculationContext';
import { useCustomers } from '@context/CustomerContext';
import { useProjects } from '@context/ProjectContext';
import { useMaterials } from '@context/MaterialContext';
import { useNotification } from '@context/NotificationContext';
import { useCompany } from '@context/CompanyContext';
import { NotificationType } from '@app-types/enums';
import { OfferService } from '@services/firebaseService';
import { storage } from '@config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Hooks
import { useLaborFactors, useAutoSelectProject } from '@hooks';

// Wizard Steps
import {
  CustomerStep,
  ServicesStep,
  PositionsStep,
  PreviewStep
} from './components/wizard';

// Types
import type { OfferItem, Material, ValidationErrors } from '@app-types';
import type { ExtendedServiceCatalogItem } from '@app-types/contexts/serviceCatalog.types';
import type { OfferConditions, OfferTotals } from '@app-types/components/offer.types';

// Wizard Steps Konfiguration
interface WizardStep {
  id: number;
  title: string;
  icon: LucideIcon;
}

const STEPS: WizardStep[] = [
  { id: 0, title: 'Kunde', icon: Users },
  { id: 1, title: 'Leistungen', icon: Package },
  { id: 2, title: 'Positionen', icon: Edit },
  { id: 3, title: 'Zusammenfassung', icon: Eye }
];

interface PVConfigFile {
  id: string;
  name: string;
  path: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

interface OfferFormData {
  offerNumber?: string;
  items: OfferItem[];
  offerDate: string;
  totals: OfferTotals;
  conditions: OfferConditions;
  depositPercent: number;
}

interface ServiceSelections {
  [category: string]: string;
}

interface ServiceQuantities {
  [category: string]: number;
}

// ValidationErrors wird aus @app-types importiert

const OfferConfigurator: React.FC = () => {
  const navigate = useNavigate();
  const { id: offerId } = useParams<{ id: string }>();
  const isEditing = !!offerId;

  // Context Hooks
  const { createOffer, updateOffer, getOfferById } = useOffers();
  const { activeServices, defaultServices } = useServiceCatalog();
  const { calculateOfferTotals, calculateValidUntil, settings: calcSettings } = useCalculation();
  const { customers } = useCustomers();
  const { projects } = useProjects();
  const { materials } = useMaterials();
  const { showNotification } = useNotification();
  const { company, offerTexts, footer, additionalPages } = useCompany();

  // Labor Factors Hook
  const {
    laborFactorSelections,
    setFactorSelection,
    adjustPricesWithFactor
  } = useLaborFactors(calcSettings);

  // Refs
  const defaultsAddedRef = useRef<boolean>(false);

  // State
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Kunde/Projekt
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');

  // Angebotsdaten
  const [offerData, setOfferData] = useState<OfferFormData>({
    items: [],
    offerDate: new Date().toISOString().split('T')[0],
    totals: {
      subtotalNet: 0,
      discountPercent: 0,
      discountAmount: 0,
      netTotal: 0,
      taxRate: 0,
      taxAmount: 0,
      grossTotal: 0
    },
    conditions: {
      validUntil: '',
      paymentTerms: '',
      deliveryTerms: '',
      notes: ''
    },
    depositPercent: 50
  });

  // PV-Konfiguration Datei-Upload State
  const [pvConfigFiles, setPvConfigFiles] = useState<PVConfigFile[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Service-Auswahl State
  const [serviceSearchTerm, setServiceSearchTerm] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<ServiceSelections>({
    'pv-montage': '',
    wechselrichter: '',
    speicher: '',
    wallbox: '',
    notstrom: '',
    optimierer: '',
    energiemanagement: '',
    elektroinstallation: '',
    planung: '',
    geruest: '',
    erdungsanlage: ''
  });
  const [serviceQuantities, setServiceQuantities] = useState<ServiceQuantities>({
    'pv-montage': 10,
    wechselrichter: 1,
    speicher: 1,
    wallbox: 1,
    notstrom: 1,
    optimierer: 0,
    energiemanagement: 1,
    elektroinstallation: 1,
    planung: 1,
    geruest: 1,
    erdungsanlage: 1
  });

  // Service-Name anhand ID finden
  const getServiceById = useCallback((serviceId: string): ExtendedServiceCatalogItem | undefined => {
    return activeServices.find(s => s.id === serviceId);
  }, [activeServices]);

  // Gefilterte Projekte für ausgewählten Kunden
  const customerProjects = useMemo(() => {
    if (!selectedCustomer) return [];
    return projects.filter(p => p.customerID === selectedCustomer);
  }, [projects, selectedCustomer]);

  // Auto-Select Projekt wenn nur eins verfügbar
  useAutoSelectProject({
    customerProjects,
    selectedProject,
    setSelectedProject
  });

  // kWp-Berechnung
  const SPEC_PMAX_DC = 'l5YKWiis3xv1nM5BAawD';
  const totalKwp = useMemo<string | null>(() => {
    const pvItems = offerData.items.filter(item => (item as any).category === 'pv-montage');
    if (pvItems.length === 0) return null;

    let totalWp = 0;
    for (const pvItem of pvItems) {
      const itemMaterials = (pvItem as any).breakdown?.materials || [];
      for (const mat of itemMaterials) {
        const materialData = materials.find((m: Material) => m.id === mat.materialID);
        const pmaxDc = parseFloat((materialData?.specifications as any)?.[SPEC_PMAX_DC]);
        if (pmaxDc && mat.quantity) {
          totalWp += pmaxDc * mat.quantity * pvItem.quantity;
        }
      }
    }

    if (totalWp === 0) return null;
    return (totalWp / 1000).toFixed(2);
  }, [offerData.items, materials]);

  // Services gefiltert nach Kategorie
  const filteredServicesByCategory = useMemo<Record<string, ExtendedServiceCatalogItem[]>>(() => {
    const grouped: Record<string, ExtendedServiceCatalogItem[]> = {};
    SERVICE_CATEGORIES.forEach(cat => {
      const categoryServices = activeServices.filter(s => s.category === cat.id);
      if (serviceSearchTerm.trim()) {
        const term = serviceSearchTerm.toLowerCase();
        grouped[cat.id] = categoryServices.filter(s =>
          s.name?.toLowerCase().includes(term) ||
          s.shortText?.toLowerCase().includes(term)
        );
      } else {
        grouped[cat.id] = categoryServices;
      }
    });
    return grouped;
  }, [activeServices, serviceSearchTerm]);

  // Bestehendes Angebot laden
  useEffect(() => {
    if (isEditing && offerId) {
      const existingOffer = getOfferById(offerId);
      if (existingOffer) {
        setSelectedCustomer(existingOffer.customerID || '');
        setSelectedProject(existingOffer.projectID || '');
        setOfferData({
          offerNumber: existingOffer.offerNumber || '',
          offerDate: existingOffer.offerDate
            ? (typeof existingOffer.offerDate === 'string' && existingOffer.offerDate.includes('T')
                ? existingOffer.offerDate.split('T')[0]
                : existingOffer.offerDate as string)
            : new Date().toISOString().split('T')[0],
          items: existingOffer.items || [],
          totals: existingOffer.totals || {
            subtotalNet: 0,
            discountPercent: 0,
            discountAmount: 0,
            netTotal: 0,
            taxRate: 19,
            taxAmount: 0,
            grossTotal: 0
          },
          conditions: existingOffer.conditions || {},
          depositPercent: existingOffer.depositPercent ?? 50
        });

        // selectedServices und serviceQuantities rekonstruieren
        const reconstructedServices: ServiceSelections = {};
        const reconstructedQuantities: ServiceQuantities = {};
        (existingOffer.items || []).forEach(item => {
          const category = (item as any).category;
          const serviceID = (item as any).serviceID;
          if (category && serviceID) {
            reconstructedServices[category] = serviceID;
            reconstructedQuantities[category] = item.quantity || 1;
          }
        });
        setSelectedServices(prev => ({ ...prev, ...reconstructedServices }));
        setServiceQuantities(prev => ({ ...prev, ...reconstructedQuantities }));

        if ((existingOffer as any).pvConfigFiles) {
          setPvConfigFiles((existingOffer as any).pvConfigFiles);
        }
      }
    } else {
      // Neues Angebot
      const generateOfferNumber = async (): Promise<void> => {
        try {
          const offerNumber = await OfferService.getNextOfferNumber();
          setOfferData(prev => ({ ...prev, offerNumber }));
        } catch (err) {
          console.error('Error generating offer number:', err);
        }
      };
      generateOfferNumber();

      setOfferData(prev => ({
        ...prev,
        conditions: {
          ...prev.conditions,
          validUntil: calculateValidUntil(),
          paymentTerms: calcSettings.offerDefaults?.paymentTerms || '',
          deliveryTerms: calcSettings.offerDefaults?.deliveryTerms || ''
        }
      }));
    }
  }, [isEditing, offerId, getOfferById, calculateValidUntil, calcSettings]);

  // Pflichtpositionen automatisch hinzufügen
  useEffect(() => {
    if (!isEditing && offerData.items.length === 0 && defaultServices.length > 0 && !defaultsAddedRef.current) {
      defaultsAddedRef.current = true;

      const defaultItems: OfferItem[] = defaultServices.map((service, index) => ({
        id: `item-${Date.now()}-${index}`,
        position: index + 1,
        type: 'service',
        serviceID: service.id,
        category: service.category,
        shortText: service.shortText || '',
        longText: service.longText || '',
        quantity: service.defaultQuantity || 1,
        unit: service.unit || 'Stk',
        unitPriceNet: service.calculatedPrices?.unitPriceNet || 0,
        originalUnitPrice: service.calculatedPrices?.unitPriceNet || 0,
        priceOverridden: false,
        discount: 0,
        totalNet: (service.defaultQuantity || 1) * (service.calculatedPrices?.unitPriceNet || 0),
        isDefaultPosition: true,
        breakdown: {
          materials: service.materials,
          labor: service.labor,
          materialCost: service.calculatedPrices?.materialCostVK || 0,
          laborCost: service.calculatedPrices?.laborCost || 0
        }
      } as OfferItem));

      setOfferData(prev => ({ ...prev, items: defaultItems }));

      if (defaultItems.length > 0) {
        showNotification(`${defaultItems.length} Pflichtposition(en) hinzugefügt`, NotificationType.INFO);
      }
    }
  }, [isEditing, defaultServices, showNotification, offerData.items.length]);

  // Totals neu berechnen
  useEffect(() => {
    const totals = calculateOfferTotals(
      offerData.items,
      offerData.totals?.discountPercent || 0,
      offerData.totals?.taxRate ?? 0
    );
    setOfferData(prev => ({ ...prev, totals: { ...totals, taxRate: prev.totals?.taxRate ?? 0 } }));
  }, [offerData.items, offerData.totals?.discountPercent, offerData.totals?.taxRate, calculateOfferTotals]);

  // Dropdown-Items synchronisieren
  useEffect(() => {
    const dropdownItems: OfferItem[] = [];

    Object.entries(selectedServices).forEach(([categoryId, serviceId]) => {
      if (!serviceId || serviceQuantities[categoryId] <= 0) return;

      const service = getServiceById(serviceId);
      if (!service) return;

      const priceData = adjustPricesWithFactor(service, categoryId);
      const quantity = serviceQuantities[categoryId];

      dropdownItems.push({
        id: `item-dropdown-${categoryId}-${serviceId}`,
        position: 0,
        type: 'service',
        sourceType: 'dropdown',
        serviceID: serviceId,
        category: categoryId,
        shortText: service.shortText || '',
        longText: service.longText || '',
        quantity: quantity,
        unit: service.unit || 'Stk',
        discount: 0,
        totalNet: quantity * priceData.unitPriceNet,
        isPackage: (service as any).isPackage || false,
        subItems: (service as any).subItems || [],
        ...priceData
      } as OfferItem);
    });

    setOfferData(prev => {
      const nonDropdownItems = prev.items.filter(item => (item as any).sourceType !== 'dropdown');
      const combinedItems = [...nonDropdownItems, ...dropdownItems];
      const regularItems = combinedItems.filter(item => !(item as any).isDefaultPosition);
      const defaultItems = combinedItems.filter(item => (item as any).isDefaultPosition);
      const allItems = [...regularItems, ...defaultItems].map((item, index) => ({
        ...item,
        position: index + 1
      }));
      return { ...prev, items: allItems };
    });
  }, [selectedServices, serviceQuantities, laborFactorSelections, getServiceById, adjustPricesWithFactor]);

  // Service hinzufügen
  const handleAddService = useCallback((service: ExtendedServiceCatalogItem): void => {
    const priceData = adjustPricesWithFactor(service, service.category || '');

    const newItem: OfferItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: offerData.items.length + 1,
      type: 'service',
      serviceID: service.id,
      category: service.category || '',
      shortText: service.shortText || '',
      longText: service.longText || '',
      quantity: 1,
      unit: service.unit || 'Stk',
      discount: 0,
      totalNet: priceData.unitPriceNet,
      ...priceData
    };

    setOfferData(prev => {
      const regularItems = prev.items.filter(item => !(item as any).isDefaultPosition);
      const defaultItems = prev.items.filter(item => (item as any).isDefaultPosition);
      const allItems = [...regularItems, newItem, ...defaultItems].map((item, index) => ({
        ...item,
        position: index + 1
      }));
      return { ...prev, items: allItems };
    });

    const factorInfo = priceData.laborFactor > 1 ? ` (+${Math.round((priceData.laborFactor - 1) * 100)}% Arbeitszeit)` : '';
    showNotification(`Position hinzugefügt${factorInfo}`, NotificationType.SUCCESS);
  }, [offerData.items.length, adjustPricesWithFactor, showNotification]);

  // Manuelle Position hinzufügen
  const handleAddManualItem = useCallback((): void => {
    const newItem: OfferItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: 0,
      type: 'custom',
      serviceID: '',
      shortText: 'Neue Position',
      longText: '',
      quantity: 1,
      unit: 'Stk',
      unitPriceNet: 0,
      originalUnitPrice: 0,
      priceOverridden: true,
      discount: 0,
      totalNet: 0
    };

    setOfferData(prev => {
      const regularItems = prev.items.filter(item => !(item as any).isDefaultPosition);
      const defaultItems = prev.items.filter(item => (item as any).isDefaultPosition);
      const allItems = [...regularItems, newItem, ...defaultItems].map((item, index) => ({
        ...item,
        position: index + 1
      }));
      return { ...prev, items: allItems };
    });
  }, []);

  // Position aktualisieren
  const handleUpdateItem = useCallback((itemId: string, updates: Partial<OfferItem>): void => {
    setOfferData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, ...updates };
          updatedItem.totalNet = (updatedItem.quantity || 1) * (updatedItem.unitPriceNet || 0) * (1 - (updatedItem.discount || 0) / 100);
          if (updates.unitPriceNet !== undefined && updates.unitPriceNet !== (item as any).originalUnitPrice) {
            (updatedItem as any).priceOverridden = true;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  }, []);

  // Position entfernen
  const handleRemoveItem = useCallback((itemId: string): void => {
    setOfferData(prev => ({
      ...prev,
      items: prev.items
        .filter(item => item.id !== itemId)
        .map((item, index) => ({ ...item, position: index + 1 }))
    }));
  }, []);

  // Service-Auswahl Handler
  const handleServiceSelection = useCallback((categoryId: string, serviceId: string): void => {
    setSelectedServices(prev => ({ ...prev, [categoryId]: serviceId }));

    if (!serviceId) return;

    const selectedService = getServiceById(serviceId);
    if (!selectedService) return;

    // Ersetzungs-Logik
    const replaces = (selectedService as any).replaces || [];
    if (replaces.length > 0) {
      setOfferData(prev => {
        let removedCount = 0;
        const newItems = prev.items
          .map(item => {
            if ((item as any).isPackage && (item as any).subItems?.length > 0) {
              const originalSubCount = (item as any).subItems.length;
              const filteredSubItems = (item as any).subItems.filter(
                (sub: any) => !replaces.includes(sub.serviceId)
              );
              if (filteredSubItems.length < originalSubCount) {
                removedCount += originalSubCount - filteredSubItems.length;
                return { ...item, subItems: filteredSubItems };
              }
            }
            return item;
          })
          .filter(item => {
            const shouldRemove = replaces.includes((item as any).serviceID);
            if (shouldRemove) removedCount++;
            return !shouldRemove;
          })
          .map((item, index) => ({ ...item, position: index + 1 }));

        if (removedCount > 0) {
          showNotification(`${removedCount} Position(en) ersetzt durch ${selectedService.name}`, NotificationType.INFO);
        }

        return { ...prev, items: newItems };
      });
    }
  }, [getServiceById, showNotification]);

  // Mengen-Änderung
  const handleQuantityChange = useCallback((categoryId: string, delta: number): void => {
    setServiceQuantities(prev => ({
      ...prev,
      [categoryId]: Math.max(0, (prev[categoryId] || 0) + delta)
    }));
  }, []);

  // Datei-Upload
  const fixImageOrientation = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const reader = new window.FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const imgElement = document.createElement('img');
        imgElement.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = imgElement.width;
          canvas.height = imgElement.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(imgElement, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) {
              const correctedFile = new window.File([blob], file.name, { type: 'image/jpeg' });
              resolve(correctedFile);
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.92);
        };
        imgElement.onerror = () => resolve(file);
        imgElement.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedFiles: PVConfigFile[] = [];
      const offerNum = offerData.offerNumber || `temp-${Date.now()}`;

      for (const file of Array.from(files)) {
        if (!file.type.match(/^(application\/pdf|image\/.*)$/)) {
          showNotification(`${file.name}: Nur PDF und Bilder erlaubt`, NotificationType.ERROR);
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          showNotification(`${file.name}: Datei zu groß (max 10MB)`, NotificationType.ERROR);
          continue;
        }

        const processedFile = await fixImageOrientation(file);
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `offers/${offerNum}/pv-config/${timestamp}_${safeName}`;
        const storageRef = ref(storage, storagePath);

        await uploadBytes(storageRef, processedFile);
        const downloadURL = await getDownloadURL(storageRef);

        uploadedFiles.push({
          id: `file-${timestamp}`,
          name: file.name,
          path: storagePath,
          url: downloadURL,
          type: processedFile.type,
          size: processedFile.size,
          uploadedAt: new Date().toISOString()
        });
      }

      if (uploadedFiles.length > 0) {
        setPvConfigFiles(prev => [...prev, ...uploadedFiles]);
        showNotification(`${uploadedFiles.length} Datei(en) hochgeladen`, NotificationType.SUCCESS);
      }
    } catch (error) {
      console.error('Upload-Fehler:', error);
      showNotification('Fehler beim Hochladen', NotificationType.ERROR);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleDeleteFile = async (fileToDelete: PVConfigFile): Promise<void> => {
    try {
      const storageRef = ref(storage, fileToDelete.path);
      await deleteObject(storageRef);
      setPvConfigFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
      showNotification('Datei gelöscht', NotificationType.SUCCESS);
    } catch (error) {
      console.error('Löschfehler:', error);
      setPvConfigFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
    }
  };

  // Validierung
  const validateStep = (step: number): boolean => {
    const errors: ValidationErrors = {};

    switch (step) {
      case 0:
        if (!selectedCustomer) errors.customer = 'Bitte Kunde auswählen';
        break;
      case 1:
        if (offerData.items.length === 0) errors.items = 'Mindestens eine Position erforderlich';
        break;
      default:
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navigation
  const handleNext = (): void => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = (): void => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // Speichern
  const handleSave = async (status: string = OFFER_STATUS.DRAFT): Promise<void> => {
    if (!validateStep(currentStep)) return;

    setSaving(true);
    try {
      const saveData = {
        ...offerData,
        customerID: selectedCustomer,
        projectID: selectedProject,
        pvConfigFiles: pvConfigFiles,
        status
      };

      let result;
      if (isEditing && offerId) {
        result = await updateOffer(offerId, saveData as any, 'Angebot aktualisiert');
      } else {
        result = await createOffer(saveData as any);
      }

      if (result.success) {
        showNotification(
          isEditing ? 'Angebot aktualisiert' : `Angebot ${(result as any).offerNumber || ''} erstellt`,
          NotificationType.SUCCESS
        );
        navigate('/offers');
      } else {
        showNotification('Fehler beim Speichern', NotificationType.ERROR);
      }
    } catch (err) {
      showNotification('Fehler beim Speichern', NotificationType.ERROR);
    } finally {
      setSaving(false);
    }
  };

  // Render current step
  const renderStepContent = (): React.ReactNode => {
    switch (currentStep) {
      case 0:
        return (
          <CustomerStep
            customers={customers}
            projects={projects}
            selectedCustomer={selectedCustomer}
            selectedProject={selectedProject}
            customerProjects={customerProjects}
            validationErrors={validationErrors}
            onCustomerChange={(value: string) => {
              setSelectedCustomer(value);
              setSelectedProject('');
              setValidationErrors(prev => ({ ...prev, customer: undefined }));
            }}
            onProjectChange={setSelectedProject}
          />
        );
      case 1:
        return (
          <ServicesStep
            activeServices={activeServices}
            selectedServices={selectedServices}
            serviceQuantities={serviceQuantities}
            onServiceSelection={handleServiceSelection}
            onQuantityChange={handleQuantityChange}
            getServiceById={getServiceById}
            calcSettings={calcSettings}
            laborFactorSelections={laborFactorSelections}
            onLaborFactorChange={setFactorSelection}
            serviceSearchTerm={serviceSearchTerm}
            onSearchChange={setServiceSearchTerm}
            filteredServicesByCategory={filteredServicesByCategory}
            offerData={offerData}
            onAddService={handleAddService as any}
            validationErrors={validationErrors as any}
          />
        );
      case 2:
        return (
          <PositionsStep
            offerData={offerData}
            customers={customers}
            projects={projects}
            selectedCustomer={selectedCustomer}
            selectedProject={selectedProject}
            company={company}
            offerTexts={offerTexts}
            footer={footer}
            totalKwp={totalKwp}
            pvConfigFiles={pvConfigFiles}
            isUploading={isUploading}
            onFileUpload={handleFileUpload}
            onDeleteFile={handleDeleteFile as any}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
            onAddManualItem={handleAddManualItem}
            onUpdateOfferField={(field: string, value: any) => setOfferData(prev => ({ ...prev, [field]: value }))}
            onUpdateConditions={(updates: Partial<OfferConditions>) => setOfferData(prev => ({
              ...prev,
              conditions: { ...prev.conditions, ...updates }
            }))}
            onUpdateTotals={(updates: Partial<OfferTotals>) => setOfferData(prev => ({
              ...prev,
              totals: { ...prev.totals, ...updates }
            }))}
            onGoToServices={() => setCurrentStep(1)}
          />
        );
      case 3:
        return (
          <PreviewStep
            offerData={offerData}
            customers={customers}
            projects={projects}
            selectedCustomer={selectedCustomer}
            selectedProject={selectedProject}
            company={company}
            offerTexts={offerTexts}
            footer={footer}
            additionalPages={additionalPages}
            totalKwp={totalKwp}
            pvConfigFiles={pvConfigFiles}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-dvh flex flex-col bg-gray-50">
      {/* Header mit Steps */}
      <div className="flex-shrink-0 bg-white shadow-sm">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Angebot bearbeiten' : 'Neues Angebot erstellen'}
          </h1>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <React.Fragment key={step.id}>
                  <div
                    className={`flex items-center cursor-pointer ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}
                    onClick={() => index < currentStep && setCurrentStep(index)}
                  >
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2
                      ${isActive ? 'border-blue-600 bg-blue-50' : isCompleted ? 'border-green-600 bg-green-50' : 'border-gray-300'}
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className="ml-2 text-sm font-medium hidden md:block">{step.title}</span>
                  </div>

                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      index < currentStep ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {renderStepContent()}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex-shrink-0 bg-white border-t px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between">
          <button
            onClick={currentStep === 0 ? () => navigate('/offers') : handleBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            {currentStep === 0 ? 'Abbrechen' : 'Zurück'}
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              Weiter
              <ChevronRight className="h-5 w-5 ml-1" />
            </button>
          ) : (
            <button
              onClick={() => handleSave(OFFER_STATUS.SENT)}
              disabled={saving || !selectedCustomer}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Send className="h-5 w-5 mr-2" />
              Angebot speichern
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferConfigurator;
