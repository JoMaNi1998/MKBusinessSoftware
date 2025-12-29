/**
 * useInvoiceConfigurator Hook
 *
 * Zentrale State- und Logik-Verwaltung für den Invoice-Konfigurator.
 * Verwaltet den mehrstufigen Workflow zur Erstellung und Bearbeitung von Rechnungen.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useInvoice, INVOICE_STATUS } from '@context/InvoiceContext';
import { useOffers } from '@context/OfferContext';
import { useServiceCatalog, SERVICE_CATEGORIES } from '@context/ServiceCatalogContext';
import { useCalculation } from '@context/CalculationContext';
import { useCustomers } from '@context/CustomerContext';
import { useProjects } from '@context/ProjectContext';
import { useNotification } from '@context/NotificationContext';
import { useCompany } from '@context/CompanyContext';
import { useAutoSelectProject } from './useAutoSelectProject';
import { NotificationType } from '@app-types';
import type {
  InvoiceItem,
  InvoiceFormData,
  ValidationErrors,
  SelectedServices,
  ServiceQuantities,
  InvoiceService,
  InvoiceServiceCategory,
  InvoiceCalcSettings,
  UseInvoiceConfiguratorReturn
} from '@app-types/components/invoice.types';
import type { LaborFactorSelections } from '@app-types/components/offer.types';
import type { Project } from '@app-types';
import type { ExtendedServiceCatalogItem, ServiceCategoryConfig } from '@app-types/contexts/serviceCatalog.types';

// Alias für lokale Verwendung
type Service = InvoiceService;
type ServiceCategory = InvoiceServiceCategory;
type CalcSettings = InvoiceCalcSettings;

export const useInvoiceConfigurator = (): UseInvoiceConfiguratorReturn => {
  const navigate = useNavigate();
  const { id: invoiceId } = useParams<{ id: string }>();
  const location = useLocation();
  const isEditing = !!invoiceId;

  // URL Query Parameter für Angebots-Referenz
  const queryParams = new URLSearchParams(location.search);
  const fromOfferId = queryParams.get('fromOffer');

  const { createInvoice, updateInvoice, getInvoiceById } = useInvoice();
  const { getOfferById } = useOffers();
  const { activeServices } = useServiceCatalog();
  const { calculateOfferTotals, settings: calcSettings } = useCalculation();
  const { customers } = useCustomers();
  const { projects } = useProjects();
  const { showNotification } = useNotification();
  const { company, invoiceTexts, footer } = useCompany();

  // State
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);

  // Kunde/Projekt
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');

  // Rechnungsdaten
  const [invoiceData, setInvoiceData] = useState<InvoiceFormData>({
    items: [],
    totals: {
      subtotalNet: 0,
      discountPercent: 0,
      discountAmount: 0,
      netTotal: 0,
      taxRate: 19,
      taxAmount: 0,
      grossTotal: 0
    },
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    paymentTerms: '',
    notes: '',
    offerID: undefined,
    offerNumber: undefined
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Arbeitszeitfaktoren pro Gewerk
  const [laborFactorSelections, setLaborFactorSelections] = useState<LaborFactorSelections>({
    dach: 'normal',
    elektro: 'normal',
    geruest: 'normal'
  });

  const [serviceSearchTerm, setServiceSearchTerm] = useState<string>('');

  // Dropdown-basierte Auswahl für Hauptkategorien
  const [selectedServices, setSelectedServices] = useState<SelectedServices>({
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

  // Dropdown-Kategorien (nur Kategorien mit isDropdown=true)
  const dropdownCategories: ServiceCategoryConfig[] = SERVICE_CATEGORIES.filter((c: ServiceCategory) => c.isDropdown);

  // Generische Faktor-Lookup Funktion
  const getLaborFactor = useCallback((factorType: string): number => {
    const factors = (calcSettings as CalcSettings).laborFactors?.[factorType] || [];
    const selected = laborFactorSelections[factorType];
    const factor = factors.find(f => f.id === selected);
    return factor?.laborFactor || 1.0;
  }, [laborFactorSelections, calcSettings]);

  // Service-Name anhand ID finden
  const getServiceById = useCallback((serviceId: string): ExtendedServiceCatalogItem | undefined => {
    return activeServices.find((s: Service) => s.id === serviceId);
  }, [activeServices]);

  // Ausgewählten Service für Kategorie holen
  const getSelectedService = useCallback((categoryId: string): ExtendedServiceCatalogItem | null => {
    const serviceId = selectedServices[categoryId];
    return serviceId ? getServiceById(serviceId) || null : null;
  }, [selectedServices, getServiceById]);

  // Services nach Kategorie gruppiert und gefiltert
  const filteredServicesByCategory = useMemo((): Record<string, ExtendedServiceCatalogItem[]> => {
    const grouped: Record<string, ExtendedServiceCatalogItem[]> = {};
    SERVICE_CATEGORIES.forEach((cat: ServiceCategory) => {
      const categoryServices = activeServices.filter((s: Service) => s.category === cat.id);
      if (serviceSearchTerm.trim()) {
        const term = serviceSearchTerm.toLowerCase();
        grouped[cat.id] = categoryServices.filter((s: Service) =>
          s.name?.toLowerCase().includes(term) ||
          s.shortText?.toLowerCase().includes(term)
        );
      } else {
        grouped[cat.id] = categoryServices;
      }
    });
    return grouped;
  }, [activeServices, serviceSearchTerm]);

  // Aus Angebot laden
  useEffect(() => {
    if (fromOfferId && !isEditing) {
      const offer = getOfferById(fromOfferId);
      if (offer) {
        setSelectedCustomer(offer.customerID || '');
        setSelectedProject(offer.projectID || '');

        // Fälligkeitsdatum berechnen
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        setInvoiceData({
          items: (offer.items || []).map((item: any) => ({
            ...item,
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          })),
          totals: offer.totals || {
            subtotalNet: 0,
            discountPercent: 0,
            discountAmount: 0,
            netTotal: 0,
            taxRate: 19,
            taxAmount: 0,
            grossTotal: 0
          },
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: dueDate.toISOString().split('T')[0],
          paymentTerms: (calcSettings as CalcSettings).offerDefaults?.paymentTerms || '14 Tage netto',
          notes: `Basierend auf Angebot ${offer.offerNumber}`,
          offerID: offer.id,
          offerNumber: offer.offerNumber
        });

        // selectedServices und serviceQuantities aus Angebot-Items rekonstruieren
        const reconstructedServices: Partial<SelectedServices> = {};
        const reconstructedQuantities: Partial<ServiceQuantities> = {};

        (offer.items || []).forEach((item: any) => {
          if (item.category && item.serviceID) {
            reconstructedServices[item.category] = item.serviceID;
            reconstructedQuantities[item.category] = item.quantity || 1;
          }
        });

        setSelectedServices(prev => ({ ...prev, ...reconstructedServices }));
        setServiceQuantities(prev => ({ ...prev, ...reconstructedQuantities }));

        showNotification(`Daten aus Angebot ${offer.offerNumber} übernommen`, NotificationType.INFO);
      }
    }
  }, [fromOfferId, isEditing, getOfferById, calcSettings, showNotification]);

  // Bestehende Rechnung laden
  useEffect(() => {
    if (isEditing && invoiceId) {
      const existingInvoice = getInvoiceById(invoiceId);
      if (existingInvoice) {
        setSelectedCustomer(existingInvoice.customerID || '');
        setSelectedProject(existingInvoice.projectID || '');
        setInvoiceData({
          items: existingInvoice.items || [],
          totals: existingInvoice.totals || {
            subtotalNet: 0,
            discountPercent: 0,
            discountAmount: 0,
            netTotal: 0,
            taxRate: 19,
            taxAmount: 0,
            grossTotal: 0
          },
          invoiceDate: existingInvoice.invoiceDate || '',
          dueDate: existingInvoice.dueDate || '',
          paymentTerms: existingInvoice.paymentTerms || '',
          notes: existingInvoice.notes || '',
          offerID: existingInvoice.offerID,
          offerNumber: existingInvoice.offerNumber
        });

        // selectedServices und serviceQuantities aus Items rekonstruieren
        const reconstructedServices: Partial<SelectedServices> = {};
        const reconstructedQuantities: Partial<ServiceQuantities> = {};

        (existingInvoice.items || []).forEach((item: any) => {
          if (item.category && item.serviceID) {
            reconstructedServices[item.category] = item.serviceID;
            reconstructedQuantities[item.category] = item.quantity || 1;
          }
        });

        setSelectedServices(prev => ({ ...prev, ...reconstructedServices }));
        setServiceQuantities(prev => ({ ...prev, ...reconstructedQuantities }));
      }
    } else if (!fromOfferId) {
      // Defaults für neue Rechnung
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      setInvoiceData(prev => ({
        ...prev,
        dueDate: dueDate.toISOString().split('T')[0],
        paymentTerms: (calcSettings as CalcSettings).offerDefaults?.paymentTerms || '14 Tage netto'
      }));
    }
  }, [isEditing, invoiceId, getInvoiceById, fromOfferId, calcSettings]);

  // Projekte für ausgewählten Kunden
  const customerProjects = useMemo((): Project[] => {
    if (!selectedCustomer) return [];
    return projects.filter((p: Project) => p.customerID === selectedCustomer);
  }, [projects, selectedCustomer]);

  // Auto-Select Projekt wenn nur eins verfügbar
  useAutoSelectProject({
    customerProjects,
    selectedProject,
    setSelectedProject
  });

  // Totals neu berechnen
  useEffect(() => {
    const totals = calculateOfferTotals(
      invoiceData.items as any,
      invoiceData.totals?.discountPercent || 0,
      invoiceData.totals?.taxRate ?? 19
    );
    setInvoiceData(prev => ({ ...prev, totals: { ...totals, taxRate: prev.totals?.taxRate ?? 19 } as any }));
  }, [invoiceData.items, invoiceData.totals?.discountPercent, invoiceData.totals?.taxRate, calculateOfferTotals]);

  // Position aktualisieren (TODO: für zukünftige Features)
  const _handleUpdateItem = useCallback((itemId: string, updates: Partial<InvoiceItem>) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, ...updates };
          updatedItem.totalNet = (updatedItem.quantity || 1) * (updatedItem.unitPriceNet || 0) * (1 - (updatedItem.discount || 0) / 100);
          return updatedItem;
        }
        return item;
      })
    }));
  }, []);

  // Position entfernen (TODO: für zukünftige Features)
  const _handleRemoveItem = useCallback((itemId: string) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items
        .filter(item => item.id !== itemId)
        .map((item, index) => ({ ...item, position: index + 1 }))
    }));
  }, []);

  // Manuelle Position hinzufügen (TODO: für zukünftige Features)
  const _handleAddManualItem = useCallback(() => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: 0,
      type: 'manual',
      serviceID: undefined,
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

    setInvoiceData(prev => {
      const regularItems = prev.items.filter(item => !item.isDefaultPosition);
      const defaultItems = prev.items.filter(item => item.isDefaultPosition);
      const allItems = [...regularItems, newItem, ...defaultItems].map((item, index) => ({
        ...item,
        position: index + 1
      }));
      return { ...prev, items: allItems };
    });
  }, []);

  // Leistung zur Rechnung hinzufügen (aus Katalog-Suche)
  const handleAddService = useCallback((service: ExtendedServiceCatalogItem) => {
    let laborFactor = 1.0;
    const appliedFactors: Record<string, number> = {};

    if (service.category === 'pv-montage' || service.category === 'optimierer') {
      const dachFactor = getLaborFactor('dach');
      laborFactor = dachFactor;
      if (dachFactor > 1) appliedFactors.dach = dachFactor;
    } else if (['elektroinstallation', 'wechselrichter', 'speicher', 'wallbox', 'notstrom', 'energiemanagement', 'erdungsanlage'].includes(service.category || '')) {
      const elektroFactor = getLaborFactor('elektro');
      laborFactor = elektroFactor;
      if (elektroFactor > 1) appliedFactors.elektro = elektroFactor;
    } else if (service.category === 'geruest') {
      const geruestFactor = getLaborFactor('geruest');
      laborFactor = geruestFactor;
      if (geruestFactor > 1) appliedFactors.geruest = geruestFactor;
    }

    const originalLaborCost = service.calculatedPrices?.laborCost || 0;
    const adjustedLaborCost = originalLaborCost * laborFactor;
    const materialCost = service.calculatedPrices?.materialCostVK || 0;
    const originalUnitPrice = service.calculatedPrices?.unitPriceNet || 0;
    const laborDiff = adjustedLaborCost - originalLaborCost;
    const adjustedUnitPrice = originalUnitPrice + laborDiff;

    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: invoiceData.items.length + 1,
      type: 'service',
      serviceID: service.id,
      category: service.category || '',
      shortText: service.shortText || '',
      longText: service.longText || '',
      quantity: 1,
      unit: service.unit || 'Stk',
      unitPriceNet: adjustedUnitPrice,
      originalUnitPrice: originalUnitPrice,
      priceOverridden: laborFactor !== 1.0,
      discount: 0,
      totalNet: adjustedUnitPrice,
      laborFactor: laborFactor,
      appliedFactors: appliedFactors,
      breakdown: {
        materials: service.materials || [],
        labor: service.labor || [],
        materialCost: materialCost,
        laborCost: adjustedLaborCost,
        originalLaborCost: originalLaborCost
      }
    };

    setInvoiceData(prev => {
      const regularItems = prev.items.filter(item => !item.isDefaultPosition);
      const defaultItems = prev.items.filter(item => item.isDefaultPosition);
      const allItems = [...regularItems, newItem, ...defaultItems].map((item, index) => ({
        ...item,
        position: index + 1
      }));
      return { ...prev, items: allItems };
    });

    const factorInfo = laborFactor > 1 ? ` (+${Math.round((laborFactor - 1) * 100)}% Arbeitszeit)` : '';
    showNotification(`Position hinzugefügt${factorInfo}`, NotificationType.SUCCESS);
  }, [invoiceData.items.length, getLaborFactor, showNotification]);

  // Dropdown-Service-Auswahl mit Ersetzungs-Logik
  const handleServiceSelection = useCallback((categoryId: string, serviceId: string) => {
    setSelectedServices(prev => ({ ...prev, [categoryId]: serviceId }));

    if (!serviceId) return;

    const selectedService = getServiceById(serviceId);
    if (!selectedService) return;

    // Ersetzungs-Logik anwenden
    if (selectedService.replaces?.length && selectedService.replaces.length > 0) {
      setInvoiceData(prev => {
        let removedCount = 0;
        const newItems = prev.items
          .map(item => {
            if (item.isPackage && item.subItems?.length && item.subItems.length > 0) {
              const originalSubCount = item.subItems.length;
              const filteredSubItems = item.subItems.filter(
                sub => !(selectedService.replaces || []).includes(sub.serviceId)
              );
              if (filteredSubItems.length < originalSubCount) {
                removedCount += originalSubCount - filteredSubItems.length;
                return { ...item, subItems: filteredSubItems };
              }
            }
            return item;
          })
          .filter(item => {
            const shouldRemove = (selectedService.replaces || []).includes(item.serviceID || '');
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

  // Dropdown-Menge ändern
  const handleQuantityChange = useCallback((categoryId: string, quantity: number) => {
    setServiceQuantities(prev => ({
      ...prev,
      [categoryId]: Math.max(0, quantity)
    }));
  }, []);

  // Synchronisiere Dropdown-Auswahl mit Items (inkl. Arbeitszeitfaktoren)
  useEffect(() => {
    const dropdownItems: InvoiceItem[] = [];

    Object.entries(selectedServices).forEach(([categoryId, serviceId]) => {
      const qty = serviceQuantities[categoryId] ?? 0;
      if (!serviceId || qty <= 0) return;

      const service = getServiceById(serviceId);
      if (!service) return;

      let laborFactor = 1.0;
      const appliedFactors: Record<string, number> = {};

      if (categoryId === 'pv-montage' || categoryId === 'optimierer') {
        const dachFactor = getLaborFactor('dach');
        laborFactor = dachFactor;
        if (dachFactor > 1) appliedFactors.dach = dachFactor;
      } else if (['elektroinstallation', 'wechselrichter', 'speicher', 'wallbox', 'notstrom', 'energiemanagement', 'erdungsanlage'].includes(categoryId)) {
        const elektroFactor = getLaborFactor('elektro');
        laborFactor = elektroFactor;
        if (elektroFactor > 1) appliedFactors.elektro = elektroFactor;
      } else if (categoryId === 'geruest') {
        const geruestFactor = getLaborFactor('geruest');
        laborFactor = geruestFactor;
        if (geruestFactor > 1) appliedFactors.geruest = geruestFactor;
      }

      const originalLaborCost = service.calculatedPrices?.laborCost || 0;
      const adjustedLaborCost = originalLaborCost * laborFactor;
      const materialCost = service.calculatedPrices?.materialCostVK || 0;
      const originalUnitPrice = service.calculatedPrices?.unitPriceNet || 0;
      const laborDiff = adjustedLaborCost - originalLaborCost;
      const adjustedUnitPrice = originalUnitPrice + laborDiff;

      dropdownItems.push({
        id: `item-dropdown-${categoryId}-${serviceId}`,
        position: 0,
        type: 'service',
        sourceType: 'dropdown',
        serviceID: serviceId,
        category: categoryId,
        shortText: service.shortText || '',
        longText: service.longText || '',
        quantity: qty,
        unit: service.unit || 'Stk',
        unitPriceNet: adjustedUnitPrice,
        originalUnitPrice: originalUnitPrice,
        priceOverridden: laborFactor !== 1.0,
        discount: 0,
        totalNet: qty * adjustedUnitPrice,
        laborFactor: laborFactor,
        appliedFactors: appliedFactors,
        isPackage: service.isPackage || false,
        subItems: service.subItems || [],
        breakdown: {
          materials: service.materials || [],
          labor: service.labor || [],
          materialCost: materialCost,
          laborCost: adjustedLaborCost,
          originalLaborCost: originalLaborCost
        }
      });
    });

    setInvoiceData(prev => {
      const nonDropdownItems = prev.items.filter(item => item.sourceType !== 'dropdown');
      const combinedItems = [...nonDropdownItems, ...dropdownItems];

      const regularItems = combinedItems.filter(item => !item.isDefaultPosition);
      const defaultItems = combinedItems.filter(item => item.isDefaultPosition);
      const allItems = [...regularItems, ...defaultItems].map((item, index) => ({
        ...item,
        position: index + 1
      }));
      return { ...prev, items: allItems };
    });
  }, [selectedServices, serviceQuantities, laborFactorSelections, getServiceById, getLaborFactor]);

  // Aktualisiere alle Positionen bei Änderung der Arbeitszeitfaktoren
  useEffect(() => {
    setInvoiceData(prev => {
      const updatedItems = prev.items.map(item => {
        if (!item.serviceID || item.sourceType === 'dropdown') return item;

        let laborFactor = 1.0;
        const appliedFactors: Record<string, number> = {};
        const categoryId = item.category;

        if (categoryId === 'pv-montage' || categoryId === 'optimierer') {
          const dachFactor = getLaborFactor('dach');
          laborFactor = dachFactor;
          if (dachFactor > 1) appliedFactors.dach = dachFactor;
        } else if (['elektroinstallation', 'wechselrichter', 'speicher', 'wallbox', 'notstrom', 'energiemanagement', 'erdungsanlage'].includes(categoryId || '')) {
          const elektroFactor = getLaborFactor('elektro');
          laborFactor = elektroFactor;
          if (elektroFactor > 1) appliedFactors.elektro = elektroFactor;
        } else if (categoryId === 'geruest') {
          const geruestFactor = getLaborFactor('geruest');
          laborFactor = geruestFactor;
          if (geruestFactor > 1) appliedFactors.geruest = geruestFactor;
        }

        const originalLaborCost = item.breakdown?.originalLaborCost || item.breakdown?.laborCost || 0;
        const adjustedLaborCost = originalLaborCost * laborFactor;
        const originalUnitPrice = item.originalUnitPrice || item.unitPriceNet;
        const laborDiff = adjustedLaborCost - originalLaborCost;
        const adjustedUnitPrice = originalUnitPrice + laborDiff;

        return {
          ...item,
          unitPriceNet: adjustedUnitPrice,
          originalUnitPrice: originalUnitPrice,
          totalNet: item.quantity * adjustedUnitPrice * (1 - (item.discount || 0) / 100),
          laborFactor: laborFactor,
          appliedFactors: appliedFactors,
          priceOverridden: laborFactor !== 1.0,
          breakdown: {
            ...item.breakdown,
            laborCost: adjustedLaborCost,
            originalLaborCost: originalLaborCost
          }
        };
      });

      return { ...prev, items: updatedItems };
    });
  }, [laborFactorSelections, getLaborFactor]);

  // Validierung
  const validateStep = useCallback((step: number): boolean => {
    const errors: ValidationErrors = {};

    switch (step) {
      case 0:
        if (!selectedCustomer) errors.customer = 'Bitte Kunde auswählen';
        break;
      case 1:
        if (invoiceData.items.length === 0) errors.items = 'Mindestens eine Position erforderlich';
        break;
      case 2:
      case 3:
        break;
      default:
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [selectedCustomer, invoiceData.items.length]);

  // Navigation
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const handleCancel = useCallback(() => {
    navigate('/invoices');
  }, [navigate]);

  // Speichern
  const handleSave = useCallback(async () => {
    if (!validateStep(currentStep)) return;

    setSaving(true);
    try {
      const saveData = {
        ...invoiceData,
        customerID: selectedCustomer,
        projectID: selectedProject,
        status: INVOICE_STATUS.DRAFT
      };

      let result: any;
      if (isEditing && invoiceId) {
        result = await updateInvoice(invoiceId, saveData as any, 'Rechnung aktualisiert');
      } else {
        result = await createInvoice(saveData as any);
      }

      if (result.success) {
        showNotification(
          isEditing ? 'Rechnung aktualisiert' : `Rechnung ${result.invoiceNumber || ''} erstellt`,
          NotificationType.SUCCESS
        );
        navigate('/invoices');
      } else {
        showNotification('Fehler beim Speichern', NotificationType.ERROR);
      }
    } catch (err) {
      showNotification('Fehler beim Speichern', NotificationType.ERROR);
    } finally {
      setSaving(false);
    }
  }, [currentStep, validateStep, invoiceData, selectedCustomer, selectedProject, isEditing, invoiceId, updateInvoice, createInvoice, showNotification, navigate]);

  // Item Handler
  const handleUpdateItem = useCallback((itemId: string, updates: Partial<InvoiceItem>) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    }));
  }, []);

  const handleRemoveItem = useCallback((itemId: string) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  }, []);

  const handleAddManualItem = useCallback(() => {
    const newItem: InvoiceItem = {
      id: `manual-${Date.now()}`,
      position: invoiceData.items.length + 1,
      type: 'custom',
      serviceID: undefined,
      shortText: 'Neue Position',
      longText: '',
      quantity: 1,
      unit: 'Stk',
      unitPriceNet: 0,
      originalUnitPrice: 0,
      discount: 0,
      totalNet: 0
    };
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  }, [invoiceData.items.length]);

  return {
    // Navigation
    currentStep,
    setCurrentStep,
    saving,
    isEditing,
    navigate,

    // Customer/Project
    selectedCustomer,
    setSelectedCustomer,
    selectedProject,
    setSelectedProject,
    customers,
    projects,
    customerProjects,

    // Invoice Data
    invoiceData,
    setInvoiceData,
    validationErrors,
    setValidationErrors,

    // Labor Factors
    laborFactorSelections,
    setLaborFactorSelections,

    // Services
    activeServices,
    selectedServices,
    serviceQuantities,
    dropdownCategories,
    serviceSearchTerm,
    setServiceSearchTerm,
    filteredServicesByCategory,

    // Settings
    calcSettings,
    company: company as any,
    invoiceTexts: invoiceTexts as any,
    footer: footer as any,

    // Handlers
    handleServiceSelection,
    handleQuantityChange,
    handleAddService,
    getSelectedService,
    getServiceById,
    handleUpdateItem,
    handleRemoveItem,
    handleAddManualItem,

    // Actions
    handleNext,
    handleBack,
    handleSave,
    handleCancel
  };
};

export default useInvoiceConfigurator;
