import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Package,
  Edit,
  CheckCircle,
  Plus,
  Trash2,
  Eye,
  TrendingDown,
  Save,
  Send,
  FileText,
  Search,
  Minus,
  Layers,
  RefreshCcw,
  AlertCircle,
  Sun,
  Zap,
  Battery,
  Car,
  Power,
  Target,
  Cpu,
  Plug,
  Truck,
  MoreHorizontal
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useInvoices, INVOICE_STATUS } from '../../context/InvoiceContext';
import { useOffers } from '../../context/OfferContext';
import { useServiceCatalog, SERVICE_CATEGORIES } from '../../context/ServiceCatalogContext';
import { useCalculation } from '../../context/CalculationContext';
import { useCustomers } from '../../context/CustomerContext';
import { useProjects } from '../../context/ProjectContext';
import { useNotification } from '../../context/NotificationContext';
import { useCompany } from '../../context/CompanyContext';

// Wizard Steps - wie bei Offers mit Leistungen-Step
const STEPS = [
  { id: 0, title: 'Kunde', icon: Users },
  { id: 1, title: 'Leistungen', icon: Package },
  { id: 2, title: 'Positionen', icon: Edit },
  { id: 3, title: 'Vorschau', icon: Eye }
];

const InvoiceConfigurator = () => {
  const navigate = useNavigate();
  const { id: invoiceId } = useParams();
  const location = useLocation();
  const isEditing = !!invoiceId;

  // URL Query Parameter für Angebots-Referenz
  const queryParams = new URLSearchParams(location.search);
  const fromOfferId = queryParams.get('fromOffer');

  const { createInvoice, updateInvoice, getInvoiceById } = useInvoices();
  const { getOfferById } = useOffers();
  const { activeServices, defaultServices, getServicesByCategory } = useServiceCatalog();
  const { calculateOfferTotals, settings: calcSettings } = useCalculation();
  const { customers } = useCustomers();
  const { projects } = useProjects();
  const { showNotification } = useNotification();
  const { company, invoiceTexts, footer } = useCompany();

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Kunde/Projekt
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  // Rechnungsdaten
  const [invoiceData, setInvoiceData] = useState({
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
    offerID: null,
    offerNumber: null
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Arbeitszeitfaktoren pro Gewerk (wie bei Offers)
  const [laborFactorSelections, setLaborFactorSelections] = useState({
    dach: 'normal',
    elektro: 'normal',
    geruest: 'normal'
  });

  // Labels für Arbeitszeitfaktoren
  const LABOR_FACTOR_LABELS = {
    dach: 'Dach',
    elektro: 'Elektro',
    geruest: 'Gerüst & Logistik'
  };

  // Icon-Mapping für Dropdown-Kategorien
  const CATEGORY_ICONS = {
    Sun, Zap, Battery, Car, Power, Target, Cpu, Plug, FileText, Truck, MoreHorizontal
  };

  const [serviceSearchTerm, setServiceSearchTerm] = useState('');

  // Dropdown-basierte Auswahl für Hauptkategorien
  const [selectedServices, setSelectedServices] = useState({
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

  const [serviceQuantities, setServiceQuantities] = useState({
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
  const dropdownCategories = SERVICE_CATEGORIES.filter(c => c.isDropdown);

  // Generische Faktor-Lookup Funktion
  const getLaborFactor = useCallback((factorType) => {
    const factors = calcSettings.laborFactors?.[factorType] || [];
    const selected = laborFactorSelections[factorType];
    const factor = factors.find(f => f.id === selected);
    return factor?.laborFactor || 1.0;
  }, [laborFactorSelections, calcSettings.laborFactors]);

  // Service-Name anhand ID finden
  const getServiceById = useCallback((serviceId) => {
    return activeServices.find(s => s.id === serviceId);
  }, [activeServices]);

  // Ausgewählten Service für Kategorie holen
  const getSelectedService = useCallback((categoryId) => {
    const serviceId = selectedServices[categoryId];
    return serviceId ? getServiceById(serviceId) : null;
  }, [selectedServices, getServiceById]);

  // Services nach Kategorie gruppiert und gefiltert
  const filteredServicesByCategory = useMemo(() => {
    const grouped = {};
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
          items: (offer.items || []).map(item => ({
            ...item,
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          })),
          totals: offer.totals || {},
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: dueDate.toISOString().split('T')[0],
          paymentTerms: calcSettings.offerDefaults?.paymentTerms || '14 Tage netto',
          notes: `Basierend auf Angebot ${offer.offerNumber}`,
          offerID: offer.id,
          offerNumber: offer.offerNumber
        });

        // selectedServices und serviceQuantities aus Angebot-Items rekonstruieren
        const reconstructedServices = {};
        const reconstructedQuantities = {};

        (offer.items || []).forEach(item => {
          if (item.category && item.serviceID) {
            reconstructedServices[item.category] = item.serviceID;
            reconstructedQuantities[item.category] = item.quantity || 1;
          }
        });

        setSelectedServices(prev => ({ ...prev, ...reconstructedServices }));
        setServiceQuantities(prev => ({ ...prev, ...reconstructedQuantities }));

        showNotification(`Daten aus Angebot ${offer.offerNumber} übernommen`, 'info');
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
          totals: existingInvoice.totals || {},
          invoiceDate: existingInvoice.invoiceDate || '',
          dueDate: existingInvoice.dueDate || '',
          paymentTerms: existingInvoice.paymentTerms || '',
          notes: existingInvoice.notes || '',
          offerID: existingInvoice.offerID,
          offerNumber: existingInvoice.offerNumber
        });

        // selectedServices und serviceQuantities aus Items rekonstruieren
        const reconstructedServices = {};
        const reconstructedQuantities = {};

        (existingInvoice.items || []).forEach(item => {
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
        paymentTerms: calcSettings.offerDefaults?.paymentTerms || '14 Tage netto'
      }));
    }
  }, [isEditing, invoiceId, getInvoiceById, fromOfferId, calcSettings]);

  // Projekte für ausgewählten Kunden
  const customerProjects = useMemo(() => {
    if (!selectedCustomer) return [];
    return projects.filter(p => p.customerID === selectedCustomer);
  }, [projects, selectedCustomer]);

  // Totals neu berechnen (mit taxRate wie bei Offers)
  useEffect(() => {
    const totals = calculateOfferTotals(
      invoiceData.items,
      invoiceData.totals?.discountPercent || 0,
      invoiceData.totals?.taxRate ?? 19
    );
    setInvoiceData(prev => ({ ...prev, totals: { ...totals, taxRate: prev.totals?.taxRate ?? 19 } }));
  }, [invoiceData.items, invoiceData.totals?.discountPercent, invoiceData.totals?.taxRate, calculateOfferTotals]);

  // Position aktualisieren
  const handleUpdateItem = (itemId, updates) => {
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
  };

  // Position entfernen
  const handleRemoveItem = (itemId) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items
        .filter(item => item.id !== itemId)
        .map((item, index) => ({ ...item, position: index + 1 }))
    }));
  };

  // Manuelle Position hinzufügen
  const handleAddManualItem = () => {
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: 0,
      type: 'manual',
      serviceID: null,
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
  };

  // Leistung zur Rechnung hinzufügen (aus Katalog-Suche)
  const handleAddService = (service) => {
    // Arbeitszeitfaktoren basierend auf Service-Kategorie bestimmen
    let laborFactor = 1.0;
    const appliedFactors = {};

    if (service.category === 'pv-montage' || service.category === 'optimierer') {
      const dachFactor = getLaborFactor('dach');
      laborFactor = dachFactor;
      if (dachFactor > 1) appliedFactors.dach = dachFactor;
    } else if (['elektroinstallation', 'wechselrichter', 'speicher', 'wallbox', 'notstrom', 'energiemanagement', 'erdungsanlage'].includes(service.category)) {
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

    const newItem = {
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
    showNotification(`Position hinzugefügt${factorInfo}`, 'success');
  };

  // Dropdown-Service-Auswahl mit Ersetzungs-Logik
  const handleServiceSelection = useCallback((categoryId, serviceId) => {
    setSelectedServices(prev => ({ ...prev, [categoryId]: serviceId }));

    if (!serviceId) return;

    const selectedService = getServiceById(serviceId);
    if (!selectedService) return;

    // Ersetzungs-Logik anwenden
    if (selectedService.replaces?.length > 0) {
      setInvoiceData(prev => {
        let removedCount = 0;
        const newItems = prev.items
          .map(item => {
            if (item.isPackage && item.subItems?.length > 0) {
              const originalSubCount = item.subItems.length;
              const filteredSubItems = item.subItems.filter(
                sub => !selectedService.replaces.includes(sub.serviceId)
              );
              if (filteredSubItems.length < originalSubCount) {
                removedCount += originalSubCount - filteredSubItems.length;
                return { ...item, subItems: filteredSubItems };
              }
            }
            return item;
          })
          .filter(item => {
            const shouldRemove = selectedService.replaces.includes(item.serviceID);
            if (shouldRemove) removedCount++;
            return !shouldRemove;
          })
          .map((item, index) => ({ ...item, position: index + 1 }));

        if (removedCount > 0) {
          showNotification(`${removedCount} Position(en) ersetzt durch ${selectedService.name}`, 'info');
        }

        return { ...prev, items: newItems };
      });
    }
  }, [getServiceById, showNotification]);

  // Dropdown-Menge ändern
  const handleQuantityChange = useCallback((categoryId, delta) => {
    setServiceQuantities(prev => ({
      ...prev,
      [categoryId]: Math.max(0, (prev[categoryId] || 0) + delta)
    }));
  }, []);

  // Synchronisiere Dropdown-Auswahl mit Items (inkl. Arbeitszeitfaktoren)
  useEffect(() => {
    const dropdownItems = [];

    Object.entries(selectedServices).forEach(([categoryId, serviceId]) => {
      if (!serviceId || serviceQuantities[categoryId] <= 0) return;

      const service = getServiceById(serviceId);
      if (!service) return;

      let laborFactor = 1.0;
      const appliedFactors = {};

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
        unitPriceNet: adjustedUnitPrice,
        originalUnitPrice: originalUnitPrice,
        priceOverridden: laborFactor !== 1.0,
        discount: 0,
        totalNet: quantity * adjustedUnitPrice,
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
        const appliedFactors = {};
        const categoryId = item.category;

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
  const validateStep = (step) => {
    const errors = {};

    switch (step) {
      case 0: // Kunde
        if (!selectedCustomer) errors.customer = 'Bitte Kunde auswählen';
        break;
      case 1: // Leistungen
        if (invoiceData.items.length === 0) errors.items = 'Mindestens eine Position erforderlich';
        break;
      case 2: // Positionen - keine Validierung nötig
        break;
      case 3: // Vorschau - keine Validierung nötig
        break;
      default:
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navigation
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // Speichern
  const handleSave = async (status = INVOICE_STATUS.DRAFT) => {
    if (!validateStep(currentStep)) return;

    setSaving(true);
    try {
      const saveData = {
        ...invoiceData,
        customerID: selectedCustomer,
        projectID: selectedProject,
        status
      };

      let result;
      if (isEditing) {
        result = await updateInvoice(invoiceId, saveData, 'Rechnung aktualisiert');
      } else {
        result = await createInvoice(saveData);
      }

      if (result.success) {
        showNotification(
          isEditing ? 'Rechnung aktualisiert' : `Rechnung ${result.invoiceNumber} erstellt`,
          'success'
        );
        navigate('/invoices');
      } else {
        showNotification('Fehler beim Speichern', 'error');
      }
    } catch (err) {
      showNotification('Fehler beim Speichern', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Kunde-Step
  const renderCustomerStep = () => {
    const customer = customers.find(c => c.id === selectedCustomer);

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kunde <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => {
                setSelectedCustomer(e.target.value);
                setSelectedProject('');
                setValidationErrors(prev => ({ ...prev, customer: null }));
              }}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                validationErrors.customer ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Kunde auswählen...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.firmennameKundenname || c.name}
                </option>
              ))}
            </select>
            {validationErrors.customer && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.customer}</p>
            )}
          </div>

          {selectedCustomer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Projekt (optional)
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Kein Projekt ausgewählt</option>
                {customerProjects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.projektname || p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Angebots-Referenz */}
          {invoiceData.offerNumber && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-600 mb-1">Basierend auf Angebot:</p>
              <p className="font-medium text-blue-900">{invoiceData.offerNumber}</p>
            </div>
          )}

          {/* Kundeninfo */}
          {customer && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-gray-600 mb-1">Rechnungsempfänger:</p>
              <p className="font-medium text-gray-900">{customer.firmennameKundenname || customer.name}</p>
              {customer.strasse && <p className="text-sm text-gray-700">{customer.strasse}</p>}
              {customer.plz && customer.ort && (
                <p className="text-sm text-gray-700">{customer.plz} {customer.ort}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Leistungen-Step (wie bei Offers)
  const renderServicesStep = () => {
    const getServicesForCategory = (categoryId) => {
      return activeServices.filter(s => s.category === categoryId);
    };

    const getCategoryIcon = (iconName) => {
      const IconComponent = CATEGORY_ICONS[iconName];
      return IconComponent ? <IconComponent className="h-5 w-5" /> : <Package className="h-5 w-5" />;
    };

    return (
      <div className="space-y-6">
        {/* Arbeitszeitfaktoren */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-900 mb-3">Arbeitszeitfaktoren</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['dach', 'elektro', 'geruest'].map(factorType => {
              const factors = calcSettings.laborFactors?.[factorType] || [];
              return (
                <div key={factorType}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {LABOR_FACTOR_LABELS[factorType]}
                  </label>
                  <select
                    value={laborFactorSelections[factorType]}
                    onChange={(e) => setLaborFactorSelections(prev => ({
                      ...prev,
                      [factorType]: e.target.value
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    {factors.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.label} {f.laborFactor > 1 ? `(+${Math.round((f.laborFactor - 1) * 100)}%)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-600 mt-2">Faktoren beeinflussen die Arbeitszeit je nach Leistungskategorie</p>
        </div>

        {validationErrors.items && (
          <div className="flex items-center space-x-2 text-red-500 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{validationErrors.items}</span>
          </div>
        )}

        {/* Dropdown-Auswahl für Hauptkategorien */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-4">Leistungen konfigurieren</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dropdownCategories.map(category => {
              const categoryServices = getServicesForCategory(category.id);
              const selectedService = getSelectedService(category.id);
              const quantity = serviceQuantities[category.id] || 0;

              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">
                      {getCategoryIcon(category.icon)}
                    </span>
                    <label className="block text-sm font-medium text-gray-700">
                      {category.label}
                    </label>
                  </div>

                  <select
                    value={selectedServices[category.id] || ''}
                    onChange={(e) => handleServiceSelection(category.id, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Keine Auswahl</option>
                    {categoryServices.map(svc => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name} - {formatPrice(svc.calculatedPrices?.unitPriceNet)}
                      </option>
                    ))}
                  </select>

                  {selectedServices[category.id] && (
                    <div className="flex items-center space-x-3 mt-2">
                      <span className="text-sm text-gray-600">Menge:</span>
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() => handleQuantityChange(category.id, -1)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-l-lg"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-4 py-1 border-x border-gray-300 min-w-[40px] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(category.id, 1)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-r-lg"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedService?.isPackage && selectedService?.subItems?.length > 0 && (
                    <div className="text-xs bg-purple-50 border border-purple-200 p-2 mt-2 rounded-lg">
                      <div className="flex items-center text-purple-700 font-medium mb-1">
                        <Layers className="h-3 w-3 mr-1" />
                        Enthält:
                      </div>
                      <ul className="text-purple-600 space-y-0.5">
                        {selectedService.subItems.map((sub, idx) => {
                          const subService = getServiceById(sub.serviceId);
                          return (
                            <li key={idx}>• {subService?.name || sub.serviceId} (x{sub.quantity})</li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {selectedService?.replaces?.length > 0 && (
                    <div className="text-xs bg-orange-50 border border-orange-200 p-2 mt-2 rounded-lg flex items-start">
                      <RefreshCcw className="h-3 w-3 mr-1 mt-0.5 text-orange-600 flex-shrink-0" />
                      <span className="text-orange-700">
                        Ersetzt: {selectedService.replaces.map(id => getServiceById(id)?.name || id).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Hinzugefügte Positionen Übersicht */}
        {invoiceData.items.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-blue-900">
                {invoiceData.items.length} Position(en) hinzugefügt
              </span>
              <span className="text-blue-700 font-bold">
                {formatPrice(invoiceData.totals?.netTotal)}
              </span>
            </div>
            <div className="text-sm text-blue-700">
              {invoiceData.items.map(item => item.shortText).join(', ').substring(0, 100)}
              {invoiceData.items.map(item => item.shortText).join(', ').length > 100 && '...'}
            </div>
          </div>
        )}

        {/* Katalog-Kategorien ausklappbar */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3">
            <h4 className="font-medium text-gray-700">Weitere Leistungen aus dem Katalog</h4>
            <p className="text-xs text-gray-500">PV-Montage, Elektroinstallation, Planung etc.</p>
          </div>

          <div className="px-4 py-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={serviceSearchTerm}
                onChange={(e) => setServiceSearchTerm(e.target.value)}
                placeholder="Leistungen suchen..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {serviceSearchTerm.trim() && (
            <div className="divide-y divide-gray-100">
              {SERVICE_CATEGORIES.map(category => {
                const categoryServices = filteredServicesByCategory[category.id] || [];
                if (categoryServices.length === 0) return null;

                return (
                  <div key={category.id}>
                    <div className="px-4 py-2 bg-gray-50 text-sm font-medium text-gray-600">
                      {category.label}
                    </div>
                    <div className="divide-y divide-gray-50">
                      {categoryServices.map(service => (
                        <div
                          key={service.id}
                          className="px-4 py-2 flex items-center justify-between hover:bg-gray-50"
                        >
                          <div className="flex-1 min-w-0 mr-4">
                            <p className="text-sm font-medium text-gray-900 truncate">{service.name}</p>
                            <p className="text-xs text-gray-500 truncate">{service.shortText}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-xs font-medium text-gray-700">
                              {formatPrice(service.calculatedPrices?.unitPriceNet)} / {service.unit}
                            </span>
                            <button
                              onClick={() => handleAddService(service)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Positionen-Step (PDF-Layout)
  const renderPositionsStep = () => {
    const customer = customers.find(c => c.id === selectedCustomer);
    const project = projects.find(p => p.id === selectedProject);

    return (
      <div className="bg-gray-100 -m-6 p-6">
        <div className="max-w-[210mm] mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-8">
            {/* Header mit Firmeninfo rechts */}
            <div className="flex justify-between items-start mb-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RECHNUNG</h1>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p className="font-medium text-gray-900">{company.name}</p>
                <p>{company.street}</p>
                <p>{company.zipCode} {company.city}</p>
                <p>Tel: {company.phone}</p>
                <p>{company.email}</p>
              </div>
            </div>

            {/* Kunde & Datum - wie bei Angebot mit Projekt-Adresse */}
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <div className="text-sm">
                  {project?.contactPersonName && (
                    <p className="font-medium text-gray-900">{project.contactPersonName}</p>
                  )}
                  {(project?.street || project?.houseNumber) && (
                    <p>{project.street} {project.houseNumber}</p>
                  )}
                  {(project?.postalCode || project?.city) && (
                    <p>{project.postalCode} {project.city}</p>
                  )}
                  {/* Fallback auf Kundendaten wenn kein Projekt */}
                  {!project && customer && (
                    <>
                      <p className="font-medium text-gray-900">{customer.firmennameKundenname || customer.name}</p>
                      {customer.strasse && <p>{customer.strasse}</p>}
                      {(customer.plz || customer.ort) && (
                        <p>{customer.plz} {customer.ort}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Datum:</span>
                    <input
                      type="date"
                      value={invoiceData.invoiceDate}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                      className="border border-gray-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Fällig bis:</span>
                    <input
                      type="date"
                      value={invoiceData.dueDate}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="border border-gray-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Editierbare Positionstabelle */}
            <div className="mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="py-2 text-left font-medium text-gray-700 w-12">Pos.</th>
                    <th className="py-2 text-left font-medium text-gray-700">Beschreibung</th>
                    <th className="py-2 text-right font-medium text-gray-700 w-20">Menge</th>
                    <th className="py-2 text-center font-medium text-gray-700 w-16">Einheit</th>
                    <th className="py-2 text-right font-medium text-gray-700 w-24">EP (netto)</th>
                    <th className="py-2 text-right font-medium text-gray-700 w-16">Rabatt</th>
                    <th className="py-2 text-right font-medium text-gray-700 w-28">Gesamt</th>
                    <th className="py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item, index) => (
                    <tr key={item.id || index} className="border-b border-gray-100 group">
                      <td className="py-3 text-gray-600 align-top">{item.position || index + 1}</td>
                      <td className="py-3">
                        <input
                          type="text"
                          value={item.shortText}
                          onChange={(e) => handleUpdateItem(item.id, { shortText: e.target.value })}
                          className="w-full bg-transparent border-0 p-0 focus:ring-0 font-medium text-gray-900"
                        />
                        {item.type === 'manual' ? (
                          <textarea
                            value={item.longText || ''}
                            onChange={(e) => handleUpdateItem(item.id, { longText: e.target.value })}
                            placeholder="Beschreibung eingeben..."
                            rows={2}
                            className="w-full bg-transparent border border-gray-200 rounded p-1 mt-1 text-xs text-gray-500 focus:ring-1 focus:ring-blue-500 resize-none"
                          />
                        ) : (
                          item.longText && (
                            <p className="text-xs text-gray-500 mt-1">{item.longText}</p>
                          )
                        )}
                        {item.laborFactor > 1 && (
                          <span className="text-xs text-amber-600 block">
                            +{Math.round((item.laborFactor - 1) * 100)}% Arbeitszeit
                          </span>
                        )}
                        {item.discount > 0 && (
                          <span className="text-xs text-red-600 block">
                            {item.discount}% Rabatt gewährt
                          </span>
                        )}
                      </td>
                      <td className="py-3 align-top">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                          className="w-full text-right bg-transparent border-0 p-0 focus:ring-0"
                        />
                      </td>
                      <td className="py-3 text-center text-gray-600 align-top">{item.unit}</td>
                      <td className="py-3 align-top">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPriceNet}
                          onChange={(e) => handleUpdateItem(item.id, { unitPriceNet: parseFloat(e.target.value) || 0 })}
                          className="w-full text-right bg-transparent border-0 p-0 focus:ring-0"
                        />
                      </td>
                      <td className="py-3 align-top">
                        <div className="flex items-center justify-end">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount || 0}
                            onChange={(e) => handleUpdateItem(item.id, { discount: parseFloat(e.target.value) || 0 })}
                            className="w-12 text-right bg-transparent border-0 p-0 focus:ring-0"
                          />
                          <span className="text-gray-400 ml-0.5">%</span>
                        </div>
                      </td>
                      <td className="py-3 text-right font-medium align-top">{formatPrice(item.totalNet)}</td>
                      <td className="py-3 align-top">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Manuelle Position Button */}
              <button
                onClick={handleAddManualItem}
                className="mt-4 w-full py-2 border-2 border-dashed border-gray-200 rounded text-gray-500 hover:border-blue-400 hover:text-blue-600 text-sm flex items-center justify-center transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Manuelle Position hinzufügen
              </button>
            </div>

            {/* Summen - wie bei Offers */}
            <div className="flex justify-end mb-8">
              <div className="w-72">
                {/* Mengenstaffel Info */}
                {invoiceData.totals?.quantityScaleDiscount > 0 && (
                  <div className="bg-green-50 text-green-700 rounded p-2 mb-3 text-xs">
                    <div className="flex items-center">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Mengenstaffel: {invoiceData.totals.moduleCount} Module ({invoiceData.totals.quantityScaleTier?.label})
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>-{invoiceData.totals.quantityScaleDiscount}% auf Arbeitszeit</span>
                      <span>-{formatPrice(invoiceData.totals.laborReductionTotal)}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Zwischensumme (netto):</span>
                    <span>{formatPrice(invoiceData.totals?.subtotalNet)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Rabatt:</span>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={invoiceData.totals?.discountPercent || 0}
                        onChange={(e) => setInvoiceData(prev => ({
                          ...prev,
                          totals: { ...prev.totals, discountPercent: parseFloat(e.target.value) || 0 }
                        }))}
                        className="w-12 text-right border border-gray-200 rounded px-1 py-0.5 text-xs"
                      />
                      <span className="text-gray-400 ml-1">%</span>
                      {invoiceData.totals?.discountAmount > 0 && (
                        <span className="ml-2 text-red-600">-{formatPrice(invoiceData.totals?.discountAmount)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Netto:</span>
                    <span>{formatPrice(invoiceData.totals?.netTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">MwSt:</span>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={invoiceData.totals?.taxRate ?? 19}
                        onChange={(e) => setInvoiceData(prev => ({
                          ...prev,
                          totals: { ...prev.totals, taxRate: parseFloat(e.target.value) || 0 }
                        }))}
                        className="w-12 text-right border border-gray-200 rounded px-1 py-0.5 text-xs"
                      />
                      <span className="text-gray-400 ml-1">%</span>
                      <span className="ml-2">{formatPrice(invoiceData.totals?.taxAmount)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-lg font-bold">
                    <span>Gesamtbetrag:</span>
                    <span>{formatPrice(invoiceData.totals?.grossTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Zahlungsinformationen */}
            {(company.iban || company.bic) && (
              <div className="border-t pt-6 mb-6 text-sm">
                <h3 className="font-medium text-gray-900 mb-3">Zahlungsinformationen</h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-1">Bankverbindung:</p>
                  {company.bankName && <p>{company.bankName}</p>}
                  {company.iban && <p>IBAN: {company.iban}</p>}
                  {company.bic && <p>BIC: {company.bic}</p>}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t pt-6 text-sm text-gray-600 space-y-3">
              <p>{invoiceTexts.paymentTerms}</p>
              <p>{invoiceTexts.closing}</p>
              <p className="mt-4">{invoiceTexts.signature}</p>
              <p className="mt-2 font-medium text-gray-700">{company.name}</p>
            </div>

            {/* Fußzeile */}
            {(footer?.column1 || footer?.column2 || footer?.column3) && (
              <div className="mt-8 pt-4 border-t border-gray-300">
                <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
                  <div className="whitespace-pre-line">{footer?.column1}</div>
                  <div className="whitespace-pre-line text-center">{footer?.column2}</div>
                  <div className="whitespace-pre-line text-right">{footer?.column3}</div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  };

  // Vorschau-Step
  const renderPreviewStep = () => {
    const customer = customers.find(c => c.id === selectedCustomer);
    const project = projects.find(p => p.id === selectedProject);

    return (
      <div className="bg-gray-100 -m-6 p-6">
        <div className="max-w-[210mm] mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-8">
            {/* Header mit Firmeninfo rechts */}
            <div className="flex justify-between items-start mb-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RECHNUNG</h1>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p className="font-medium text-gray-900">{company.name}</p>
                <p>{company.street}</p>
                <p>{company.zipCode} {company.city}</p>
                <p>Tel: {company.phone}</p>
                <p>{company.email}</p>
              </div>
            </div>

            {/* Kunde & Datum - wie bei Angebot */}
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <div className="text-sm">
                  {project?.contactPersonName && (
                    <p className="font-medium text-gray-900">{project.contactPersonName}</p>
                  )}
                  {(project?.street || project?.houseNumber) && (
                    <p>{project.street} {project.houseNumber}</p>
                  )}
                  {(project?.postalCode || project?.city) && (
                    <p>{project.postalCode} {project.city}</p>
                  )}
                  {/* Fallback auf Kundendaten wenn kein Projekt */}
                  {!project && customer && (
                    <>
                      <p className="font-medium text-gray-900">{customer.firmennameKundenname || customer.name}</p>
                      {customer.strasse && <p>{customer.strasse}</p>}
                      {(customer.plz || customer.ort) && (
                        <p>{customer.plz} {customer.ort}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Datum:</span>
                    <span>{formatDate(invoiceData.invoiceDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fällig bis:</span>
                    <span>{formatDate(invoiceData.dueDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Betreff */}
            <div className="mb-6">
              <h2 className="text-base font-semibold text-gray-900 mb-2">
                Rechnung {invoiceData.offerNumber && <span className="text-sm font-normal text-gray-600">(Ref: {invoiceData.offerNumber})</span>}
              </h2>
              <p className="text-sm text-gray-600">
                {invoiceTexts.greeting}
              </p>
            </div>

            {/* Positionen */}
            <div className="mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="py-2 text-left font-medium text-gray-700 w-12">Pos.</th>
                    <th className="py-2 text-left font-medium text-gray-700">Beschreibung</th>
                    <th className="py-2 text-right font-medium text-gray-700 w-16">Menge</th>
                    <th className="py-2 text-center font-medium text-gray-700 w-16">Einheit</th>
                    <th className="py-2 text-right font-medium text-gray-700 w-24">EP (netto)</th>
                    <th className="py-2 text-right font-medium text-gray-700 w-28">Gesamt</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item, index) => (
                    <tr key={item.id || index} className="border-b border-gray-100">
                      <td className="py-3 text-gray-600">{item.position || index + 1}</td>
                      <td className="py-3">
                        <p className="font-medium text-gray-900">{item.shortText}</p>
                        {item.longText && (
                          <p className="text-xs text-gray-500 mt-1">{item.longText}</p>
                        )}
                        {item.discount > 0 && (
                          <p className="text-xs text-red-600 mt-1">
                            {item.discount}% Rabatt
                          </p>
                        )}
                      </td>
                      <td className="py-3 text-right">{item.quantity}</td>
                      <td className="py-3 text-center text-gray-600">{item.unit}</td>
                      <td className="py-3 text-right">
                        {item.discount > 0 ? (
                          <div>
                            <span className="line-through text-gray-400 text-xs">{formatPrice(item.unitPriceNet)}</span>
                            <span className="block text-red-600">{formatPrice(item.unitPriceNet * (1 - item.discount / 100))}</span>
                          </div>
                        ) : (
                          formatPrice(item.unitPriceNet)
                        )}
                      </td>
                      <td className="py-3 text-right font-medium">{formatPrice(item.totalNet)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summen */}
            <div className="flex justify-end mb-8">
              <div className="w-64">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Zwischensumme (netto):</span>
                    <span>{formatPrice(invoiceData.totals?.subtotalNet)}</span>
                  </div>
                  {invoiceData.totals?.discountPercent > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Rabatt ({invoiceData.totals?.discountPercent}%):</span>
                      <span>- {formatPrice(invoiceData.totals?.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Netto:</span>
                    <span>{formatPrice(invoiceData.totals?.netTotal)}</span>
                  </div>
                  {(invoiceData.totals?.taxRate > 0) ? (
                    <div className="flex justify-between">
                      <span className="text-gray-600">MwSt ({invoiceData.totals?.taxRate}%):</span>
                      <span>{formatPrice(invoiceData.totals?.taxAmount)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-gray-600">0% MwSt. nach §12 UStG</span>
                      <span>{formatPrice(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-lg font-bold">
                    <span>Gesamtbetrag:</span>
                    <span>{formatPrice(invoiceData.totals?.grossTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Zahlungsinformationen */}
            {(company.iban || company.bic) && (
              <div className="border-t pt-6 mb-6 text-sm">
                <h3 className="font-medium text-gray-900 mb-3">Zahlungsinformationen</h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-1">Bankverbindung:</p>
                  {company.bankName && <p>{company.bankName}</p>}
                  {company.iban && <p>IBAN: {company.iban}</p>}
                  {company.bic && <p>BIC: {company.bic}</p>}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t pt-6 text-sm text-gray-600 space-y-3">
              <p>{invoiceTexts.paymentTerms}</p>
              <p>{invoiceTexts.closing}</p>
              <p className="mt-4">{invoiceTexts.signature}</p>
              <p className="mt-2 font-medium text-gray-700">{company.name}</p>
            </div>

            {/* Fußzeile */}
            {(footer?.column1 || footer?.column2 || footer?.column3) && (
              <div className="mt-8 pt-4 border-t border-gray-300">
                <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
                  <div className="whitespace-pre-line">{footer?.column1}</div>
                  <div className="whitespace-pre-line text-center">{footer?.column2}</div>
                  <div className="whitespace-pre-line text-right">{footer?.column3}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderCustomerStep();
      case 1:
        return renderServicesStep();
      case 2:
        return renderPositionsStep();
      case 3:
        return renderPreviewStep();
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
            {isEditing ? 'Rechnung bearbeiten' : 'Neue Rechnung erstellen'}
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
            onClick={currentStep === 0 ? () => navigate('/invoices') : handleBack}
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
              onClick={() => handleSave(INVOICE_STATUS.SENT)}
              disabled={saving || !selectedCustomer}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Send className="h-5 w-5 mr-2" />
              Rechnung speichern
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceConfigurator;
