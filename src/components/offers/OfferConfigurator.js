import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Building,
  Package,
  FileText,
  CheckCircle,
  Plus,
  Trash2,
  Edit,
  Search,
  GripVertical,
  AlertCircle,
  Save,
  Send,
  Download,
  Eye
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOffers, OFFER_STATUS } from '../../context/OfferContext';
import { useServiceCatalog, SERVICE_CATEGORIES } from '../../context/ServiceCatalogContext';
import { useCalculation } from '../../context/CalculationContext';
import { useCustomers } from '../../context/CustomerContext';
import { useProjects } from '../../context/ProjectContext';
import { useMaterials } from '../../context/MaterialContext';
import { useNotification } from '../../context/NotificationContext';
import BaseModal from '../BaseModal';

// Wizard Steps - Kunde/Projekt am Ende (wie PVConfigurator)
const STEPS = [
  { id: 0, title: 'Leistungen', icon: Package },
  { id: 1, title: 'Positionen', icon: Edit },
  { id: 2, title: 'Konditionen', icon: FileText },
  { id: 3, title: 'Abschluss', icon: CheckCircle }
];

const OfferConfigurator = () => {
  const navigate = useNavigate();
  const { id: offerId } = useParams();
  const isEditing = !!offerId;

  const { createOffer, updateOffer, getOfferById } = useOffers();
  const { activeServices, getServicesByCategory } = useServiceCatalog();
  const { calculateOfferTotals, calculateValidUntil, settings: calcSettings } = useCalculation();
  const { customers } = useCustomers();
  const { projects } = useProjects();
  const { materials } = useMaterials();
  const { showNotification } = useNotification();

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Kunde/Projekt separat (wie PVConfigurator - am Ende auswählen)
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  // Angebotsdaten
  const [offerData, setOfferData] = useState({
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
    conditions: {
      validUntil: '',
      paymentTerms: '',
      deliveryTerms: '',
      notes: ''
    }
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Arbeitszeitfaktoren für Preisanpassungen - Standard als Default
  const [roofPitchCategory, setRoofPitchCategory] = useState('standard');
  const [cableLengthCategory, setCableLengthCategory] = useState('standard');
  const [pvLayoutCategory, setPvLayoutCategory] = useState('standard');
  const [travelCategory, setTravelCategory] = useState('standard');

  // Kategorien aus CalculationContext (calcSettings.laborFactors)
  const roofPitchCategories = calcSettings.laborFactors?.roofPitchCategories || [
    { id: 'standard', label: 'Standard (0-25°)', laborFactor: 1.0 },
    { id: 'medium', label: 'Mittel (25-35°)', laborFactor: 1.15 },
    { id: 'steep', label: 'Steil (>35°)', laborFactor: 1.30 }
  ];

  const cableLengthCategories = calcSettings.laborFactors?.cableLengthCategories || [
    { id: 'standard', label: 'Standard (<15m)', laborFactor: 1.0 },
    { id: 'medium', label: 'Mittel (15-30m)', laborFactor: 1.20 },
    { id: 'long', label: 'Lang (>30m)', laborFactor: 1.40 }
  ];

  const pvLayoutCategories = calcSettings.laborFactors?.pvLayoutCategories || [
    { id: 'standard', label: 'Standard (einfach)', laborFactor: 1.0 },
    { id: 'medium', label: 'Mittel (mehrere Flächen)', laborFactor: 1.15 },
    { id: 'complex', label: 'Komplex (Gauben/Verschattung)', laborFactor: 1.30 }
  ];

  const travelCategories = calcSettings.laborFactors?.travelCategories || [
    { id: 'standard', label: 'Standard (<30km)', laborFactor: 1.0 },
    { id: 'medium', label: 'Mittel (30-60km)', laborFactor: 1.15 },
    { id: 'far', label: 'Weit (>60km)', laborFactor: 1.30 }
  ];

  // Hilfsfunktionen für Faktor-Lookup
  const getRoofPitchFactor = useCallback(() => {
    const cat = roofPitchCategories.find(c => c.id === roofPitchCategory);
    return cat?.laborFactor || 1.0;
  }, [roofPitchCategory, roofPitchCategories]);

  const getCableLengthFactor = useCallback(() => {
    const cat = cableLengthCategories.find(c => c.id === cableLengthCategory);
    return cat?.laborFactor || 1.0;
  }, [cableLengthCategory, cableLengthCategories]);

  const getPvLayoutFactor = useCallback(() => {
    const cat = pvLayoutCategories.find(c => c.id === pvLayoutCategory);
    return cat?.laborFactor || 1.0;
  }, [pvLayoutCategory, pvLayoutCategories]);

  const getTravelFactor = useCallback(() => {
    const cat = travelCategories.find(c => c.id === travelCategory);
    return cat?.laborFactor || 1.0;
  }, [travelCategory, travelCategories]);

  const [serviceSearchTerm, setServiceSearchTerm] = useState('');

  // Bestehendes Angebot laden
  useEffect(() => {
    if (isEditing && offerId) {
      const existingOffer = getOfferById(offerId);
      if (existingOffer) {
        setSelectedCustomer(existingOffer.customerID || '');
        setSelectedProject(existingOffer.projectID || '');
        setOfferData({
          items: existingOffer.items || [],
          totals: existingOffer.totals || {},
          conditions: existingOffer.conditions || {}
        });
      }
    } else {
      // Defaults setzen
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

  // Gefilterte Projekte für ausgewählten Kunden
  const customerProjects = useMemo(() => {
    if (!selectedCustomer) return [];
    return projects.filter(p => p.customerID === selectedCustomer);
  }, [projects, selectedCustomer]);

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

  // Totals neu berechnen wenn Items ändern
  useEffect(() => {
    const totals = calculateOfferTotals(offerData.items, offerData.totals?.discountPercent || 0);
    setOfferData(prev => ({ ...prev, totals }));
  }, [offerData.items, offerData.totals?.discountPercent, calculateOfferTotals]);

  // Leistung zum Angebot hinzufügen
  const handleAddService = (service) => {
    // Arbeitszeitfaktoren basierend auf Service-Kategorie bestimmen
    let laborFactor = 1.0;
    const appliedFactors = {};

    // Dachneigung für PV-Montage
    if (service.category === 'pv-montage') {
      const roofFactor = getRoofPitchFactor();
      const pvLayoutFactor = getPvLayoutFactor();
      laborFactor = roofFactor * pvLayoutFactor;
      if (roofFactor > 1) appliedFactors.roofPitch = roofFactor;
      if (pvLayoutFactor > 1) appliedFactors.pvLayout = pvLayoutFactor;
    }
    // Kabelweg für Elektroinstallation
    else if (service.category === 'elektroinstallation') {
      laborFactor = getCableLengthFactor();
      if (laborFactor > 1) appliedFactors.cableLength = laborFactor;
    }

    // Anfahrt gilt für alle Leistungen
    const travelFactor = getTravelFactor();
    if (travelFactor > 1) {
      laborFactor *= travelFactor;
      appliedFactors.travel = travelFactor;
    }

    // Preise mit Faktor anpassen
    const originalLaborCost = service.calculatedPrices?.laborCost || 0;
    const adjustedLaborCost = originalLaborCost * laborFactor;
    const materialCost = service.calculatedPrices?.materialCostVK || 0;

    // Neuen Einheitspreis berechnen (Material + angepasste Arbeitszeit)
    const originalUnitPrice = service.calculatedPrices?.unitPriceNet || 0;
    const laborDiff = adjustedLaborCost - originalLaborCost;
    const adjustedUnitPrice = originalUnitPrice + laborDiff;

    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: offerData.items.length + 1,
      type: 'service',
      serviceID: service.id,
      category: service.category,
      shortText: service.shortText,
      longText: service.longText,
      quantity: 1,
      unit: service.unit,
      unitPriceNet: adjustedUnitPrice,
      originalUnitPrice: originalUnitPrice,
      priceOverridden: laborFactor !== 1.0,
      discount: 0,
      totalNet: adjustedUnitPrice,
      laborFactor: laborFactor,
      appliedFactors: appliedFactors,
      breakdown: {
        materials: service.materials,
        labor: service.labor,
        materialCost: materialCost,
        laborCost: adjustedLaborCost,
        originalLaborCost: originalLaborCost
      }
    };

    setOfferData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    const factorInfo = laborFactor > 1 ? ` (+${Math.round((laborFactor - 1) * 100)}% Arbeitszeit)` : '';
    showNotification(`Position hinzugefügt${factorInfo}`, 'success');
  };

  // Manuelle Position hinzufügen
  const handleAddManualItem = () => {
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: offerData.items.length + 1,
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

    setOfferData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  // Position aktualisieren
  const handleUpdateItem = (itemId, updates) => {
    setOfferData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, ...updates };
          // Total neu berechnen
          updatedItem.totalNet = (updatedItem.quantity || 1) * (updatedItem.unitPriceNet || 0) * (1 - (updatedItem.discount || 0) / 100);
          // Preis-Override markieren
          if (updates.unitPriceNet !== undefined && updates.unitPriceNet !== item.originalUnitPrice) {
            updatedItem.priceOverridden = true;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  // Position entfernen
  const handleRemoveItem = (itemId) => {
    setOfferData(prev => ({
      ...prev,
      items: prev.items
        .filter(item => item.id !== itemId)
        .map((item, index) => ({ ...item, position: index + 1 }))
    }));
  };

  // Validierung
  const validateStep = (step) => {
    const errors = {};

    switch (step) {
      case 0: // Leistungen
        if (offerData.items.length === 0) errors.items = 'Mindestens eine Position erforderlich';
        break;
      case 1: // Positionen - keine Validierung nötig
        break;
      case 2: // Konditionen - keine Validierung nötig
        break;
      case 3: // Abschluss
        if (!selectedCustomer) errors.customer = 'Bitte Kunde auswählen';
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
  const handleSave = async (status = OFFER_STATUS.DRAFT) => {
    if (!validateStep(currentStep)) return;

    setSaving(true);
    try {
      const saveData = {
        ...offerData,
        customerID: selectedCustomer,
        projectID: selectedProject,
        status
      };

      let result;
      if (isEditing) {
        result = await updateOffer(offerId, saveData, 'Angebot aktualisiert');
      } else {
        result = await createOffer(saveData);
      }

      if (result.success) {
        showNotification(
          isEditing ? 'Angebot aktualisiert' : `Angebot ${result.offerNumber} erstellt`,
          'success'
        );
        navigate('/offers');
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

  // Step 0: Leistungen auswählen
  const renderServicesStep = () => (
    <div className="space-y-6">
      {/* Arbeitszeitfaktoren */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-medium text-amber-900 mb-3">Arbeitszeitfaktoren</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Dachneigung */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dachneigung
            </label>
            <select
              value={roofPitchCategory}
              onChange={(e) => setRoofPitchCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              {roofPitchCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.label} {cat.laborFactor > 1 ? `(+${Math.round((cat.laborFactor - 1) * 100)}%)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Kabelweg */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kabelweg
            </label>
            <select
              value={cableLengthCategory}
              onChange={(e) => setCableLengthCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              {cableLengthCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.label} {cat.laborFactor > 1 ? `(+${Math.round((cat.laborFactor - 1) * 100)}%)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* PV Layout */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PV Layout
            </label>
            <select
              value={pvLayoutCategory}
              onChange={(e) => setPvLayoutCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              {pvLayoutCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.label} {cat.laborFactor > 1 ? `(+${Math.round((cat.laborFactor - 1) * 100)}%)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Anfahrt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anfahrt
            </label>
            <select
              value={travelCategory}
              onChange={(e) => setTravelCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              {travelCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.label} {cat.laborFactor > 1 ? `(+${Math.round((cat.laborFactor - 1) * 100)}%)` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2">Faktoren beeinflussen die Arbeitszeit je nach Leistungskategorie</p>
      </div>

      {/* Suche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={serviceSearchTerm}
          onChange={(e) => setServiceSearchTerm(e.target.value)}
          placeholder="Leistungen suchen..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {validationErrors.items && (
        <div className="flex items-center space-x-2 text-red-500 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{validationErrors.items}</span>
        </div>
      )}

      {/* Hinzugefügte Positionen */}
      {offerData.items.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-blue-900">
              {offerData.items.length} Position(en) hinzugefügt
            </span>
            <span className="text-blue-700 font-bold">
              {formatPrice(offerData.totals?.netTotal)}
            </span>
          </div>
          <div className="text-sm text-blue-700">
            {offerData.items.map(item => item.shortText).join(', ').substring(0, 100)}
            {offerData.items.map(item => item.shortText).join(', ').length > 100 && '...'}
          </div>
        </div>
      )}

      {/* Leistungskatalog */}
      <div className="space-y-4">
        {SERVICE_CATEGORIES.map(category => {
          const categoryServices = filteredServicesByCategory[category.id] || [];
          if (categoryServices.length === 0) return null;

          return (
            <div key={category.id} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 font-medium text-gray-700">
                {category.label}
              </div>
              <div className="divide-y divide-gray-100">
                {categoryServices.map(service => (
                  <div
                    key={service.id}
                    className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="font-medium text-gray-900 truncate">{service.name}</p>
                      <p className="text-sm text-gray-500 truncate">{service.shortText}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-900">
                        {formatPrice(service.calculatedPrices?.unitPriceNet)} / {service.unit}
                      </span>
                      <button
                        onClick={() => handleAddService(service)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Manuelle Position */}
      <button
        onClick={handleAddManualItem}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 flex items-center justify-center"
      >
        <Plus className="h-5 w-5 mr-2" />
        Manuelle Position hinzufügen
      </button>
    </div>
  );

  // Step 1: Positionen bearbeiten
  const renderPositionsStep = () => (
    <div className="space-y-6">
      {offerData.items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Noch keine Positionen hinzugefügt</p>
          <button
            onClick={() => setCurrentStep(1)}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Leistungen hinzufügen
          </button>
        </div>
      ) : (
        <>
          {/* Positionsliste */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-8">Pos</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Beschreibung</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-20">Menge</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-16">Einheit</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-28">EP (netto)</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-16">Rabatt</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-28">Gesamt</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {offerData.items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500">{item.position}</td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.shortText}
                        onChange={(e) => handleUpdateItem(item.id, { shortText: e.target.value })}
                        className="w-full border-0 bg-transparent focus:ring-0 p-0"
                      />
                      {item.laborFactor > 1 && (
                        <span className="text-xs text-amber-600">
                          +{Math.round((item.laborFactor - 1) * 100)}% Arbeitszeit
                          ({item.appliedFactorType === 'roofPitch' ? 'Dachneigung' : 'Kabelweg'})
                        </span>
                      )}
                      {item.priceOverridden && !item.laborFactor && (
                        <span className="text-xs text-amber-600">Preis angepasst</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                        className="w-full text-right border border-gray-200 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2 text-center text-gray-600">{item.unit}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPriceNet}
                        onChange={(e) => handleUpdateItem(item.id, { unitPriceNet: parseFloat(e.target.value) || 0 })}
                        className="w-full text-right border border-gray-200 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) => handleUpdateItem(item.id, { discount: parseFloat(e.target.value) || 0 })}
                          className="w-full text-right border border-gray-200 rounded px-2 py-1"
                        />
                        <span className="ml-1 text-gray-500">%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatPrice(item.totalNet)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summen */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Zwischensumme (netto):</span>
              <span>{formatPrice(offerData.totals?.subtotalNet)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Gesamtrabatt:</span>
              <div className="flex items-center">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={offerData.totals?.discountPercent || 0}
                  onChange={(e) => setOfferData(prev => ({
                    ...prev,
                    totals: { ...prev.totals, discountPercent: parseFloat(e.target.value) || 0 }
                  }))}
                  className="w-16 text-right border border-gray-300 rounded px-2 py-1 mr-1"
                />
                <span className="text-gray-500">%</span>
                <span className="ml-4">- {formatPrice(offerData.totals?.discountAmount)}</span>
              </div>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-gray-600">Netto:</span>
              <span className="font-medium">{formatPrice(offerData.totals?.netTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">MwSt ({offerData.totals?.taxRate}%):</span>
              <span>{formatPrice(offerData.totals?.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Gesamtbetrag (brutto):</span>
              <span className="text-blue-600">{formatPrice(offerData.totals?.grossTotal)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Step 2: Konditionen
  const renderConditionsStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gültig bis
          </label>
          <input
            type="date"
            value={offerData.conditions?.validUntil || ''}
            onChange={(e) => setOfferData(prev => ({
              ...prev,
              conditions: { ...prev.conditions, validUntil: e.target.value }
            }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zahlungsbedingungen
          </label>
          <input
            type="text"
            value={offerData.conditions?.paymentTerms || ''}
            onChange={(e) => setOfferData(prev => ({
              ...prev,
              conditions: { ...prev.conditions, paymentTerms: e.target.value }
            }))}
            placeholder="z.B. 14 Tage netto"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lieferbedingungen
        </label>
        <input
          type="text"
          value={offerData.conditions?.deliveryTerms || ''}
          onChange={(e) => setOfferData(prev => ({
            ...prev,
            conditions: { ...prev.conditions, deliveryTerms: e.target.value }
          }))}
          placeholder="z.B. Nach Vereinbarung"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Anmerkungen / Notizen
        </label>
        <textarea
          value={offerData.conditions?.notes || ''}
          onChange={(e) => setOfferData(prev => ({
            ...prev,
            conditions: { ...prev.conditions, notes: e.target.value }
          }))}
          rows={5}
          placeholder="Zusätzliche Informationen zum Angebot..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  // Step 3: Abschluss (mit Kunde/Projekt-Auswahl)
  const renderSummaryStep = () => {
    const customer = customers.find(c => c.id === selectedCustomer);
    const project = projects.find(p => p.id === selectedProject);

    return (
      <div className="space-y-6">
        {/* Kunde & Projekt Auswahl */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-gray-500" />
            Kunde & Projekt zuweisen
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kunde <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => {
                  setSelectedCustomer(e.target.value);
                  setSelectedProject(''); // Reset project when customer changes
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

            {/* Kundeninfo-Preview */}
            {customer && (
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray-500 mb-1">Ausgewählter Kunde:</p>
                <p className="font-medium">{customer.firmennameKundenname || customer.name}</p>
                {customer.strasse && <p className="text-sm text-gray-600">{customer.strasse}</p>}
                {customer.plz && customer.ort && (
                  <p className="text-sm text-gray-600">{customer.plz} {customer.ort}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Zusammenfassung */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-4">Angebots-Zusammenfassung</h3>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Anzahl Positionen:</span>
              <span>{offerData.items.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Netto-Summe:</span>
              <span>{formatPrice(offerData.totals?.netTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">MwSt ({offerData.totals?.taxRate}%):</span>
              <span>{formatPrice(offerData.totals?.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Gesamtbetrag:</span>
              <span className="text-blue-600">{formatPrice(offerData.totals?.grossTotal)}</span>
            </div>
          </div>

          <div className="border-t mt-4 pt-4 text-sm text-gray-600">
            <p>Gültig bis: {offerData.conditions?.validUntil || '-'}</p>
            <p>Zahlungsbedingungen: {offerData.conditions?.paymentTerms || '-'}</p>
          </div>
        </div>

      </div>
    );
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderServicesStep();
      case 1:
        return renderPositionsStep();
      case 2:
        return renderConditionsStep();
      case 3:
        return renderSummaryStep();
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
