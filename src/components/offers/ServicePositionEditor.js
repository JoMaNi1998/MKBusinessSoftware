import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  Package,
  Clock,
  Calculator,
  Search,
  ChevronDown,
  AlertCircle,
  Layers,
  RefreshCcw
} from 'lucide-react';
import { useServiceCatalog, SERVICE_CATEGORIES, SERVICE_UNITS } from '../../context/ServiceCatalogContext';
import { useCalculation } from '../../context/CalculationContext';
import { useMaterials } from '../../context/MaterialContext';
import { useNotification } from '../../context/NotificationContext';
import BaseModal from '../BaseModal';

const ServicePositionEditor = ({ service, isOpen, onClose }) => {
  const { addService, updateService, services: allServices, activeServices } = useServiceCatalog();
  const { settings: calcSettings, calculateServicePosition } = useCalculation();
  const { materials } = useMaterials();
  const { showNotification } = useNotification();

  const isEditing = !!service;

  // Formular-State
  const [formData, setFormData] = useState({
    name: '',
    shortText: '',
    longText: '',
    category: 'pv-montage',
    unit: 'Stk',
    materials: [],
    labor: [],
    isActive: true,
    isDefaultPosition: false,
    defaultQuantity: 1,
    sortOrder: 999,
    // Paket-Struktur
    isPackage: false,
    subItems: [],  // [{serviceId: string, quantity: number}]
    // Ersetzungs-Logik
    replaces: []  // Array von Service-IDs die ersetzt werden
  });

  const [materialSearch, setMaterialSearch] = useState('');
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [subItemSearch, setSubItemSearch] = useState('');
  const [showSubItemDropdown, setShowSubItemDropdown] = useState(false);
  const [replacesSearch, setReplacesSearch] = useState('');
  const [showReplacesDropdown, setShowReplacesDropdown] = useState(false);

  // Formular mit Service-Daten befüllen
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        shortText: service.shortText || '',
        longText: service.longText || '',
        category: service.category || 'pv-montage',
        unit: service.unit || 'Stk',
        materials: service.materials || [],
        labor: service.labor || [],
        isActive: service.isActive !== false,
        isDefaultPosition: service.isDefaultPosition || false,
        defaultQuantity: service.defaultQuantity || 1,
        sortOrder: service.sortOrder || 999,
        isPackage: service.isPackage || false,
        subItems: service.subItems || [],
        replaces: service.replaces || []
      });
    } else {
      setFormData({
        name: '',
        shortText: '',
        longText: '',
        category: 'pv-montage',
        unit: 'Stk',
        materials: [],
        labor: [],
        isActive: true,
        isDefaultPosition: false,
        defaultQuantity: 1,
        sortOrder: 999,
        isPackage: false,
        subItems: [],
        replaces: []
      });
    }
    setErrors({});
    setSubItemSearch('');
    setShowSubItemDropdown(false);
    setReplacesSearch('');
    setShowReplacesDropdown(false);
  }, [service, isOpen]);

  // Gefilterte Materialien für Dropdown
  const filteredMaterials = useMemo(() => {
    if (!materialSearch.trim()) return materials.slice(0, 20);

    const term = materialSearch.toLowerCase();
    return materials
      .filter(m =>
        m.description?.toLowerCase().includes(term) ||
        m.name?.toLowerCase().includes(term) ||
        m.materialID?.toLowerCase().includes(term)
      )
      .slice(0, 20);
  }, [materials, materialSearch]);

  // Gefilterte Services für SubItems Dropdown (nicht sich selbst, nicht bereits hinzugefügt)
  const filteredSubItemServices = useMemo(() => {
    const existingIds = formData.subItems.map(s => s.serviceId);
    const currentId = service?.id;

    let filtered = activeServices.filter(s =>
      s.id !== currentId && !existingIds.includes(s.id)
    );

    if (subItemSearch.trim()) {
      const term = subItemSearch.toLowerCase();
      filtered = filtered.filter(s =>
        s.name?.toLowerCase().includes(term) ||
        s.shortText?.toLowerCase().includes(term)
      );
    }

    return filtered.slice(0, 20);
  }, [activeServices, subItemSearch, formData.subItems, service?.id]);

  // Gefilterte Services für Replaces Dropdown (nicht sich selbst, nicht bereits hinzugefügt)
  const filteredReplacesServices = useMemo(() => {
    const existingIds = formData.replaces;
    const currentId = service?.id;

    let filtered = activeServices.filter(s =>
      s.id !== currentId && !existingIds.includes(s.id)
    );

    if (replacesSearch.trim()) {
      const term = replacesSearch.toLowerCase();
      filtered = filtered.filter(s =>
        s.name?.toLowerCase().includes(term) ||
        s.shortText?.toLowerCase().includes(term)
      );
    }

    return filtered.slice(0, 20);
  }, [activeServices, replacesSearch, formData.replaces, service?.id]);

  // Service-Name anhand ID finden
  const getServiceName = (serviceId) => {
    const svc = allServices.find(s => s.id === serviceId);
    return svc?.name || serviceId;
  };

  // Kalkulation berechnen
  const calculatedPrices = useMemo(() => {
    return calculateServicePosition(formData.materials, formData.labor, materials);
  }, [formData.materials, formData.labor, materials, calculateServicePosition]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Material hinzufügen
  const handleAddMaterial = (material) => {
    const existingIndex = formData.materials.findIndex(m => m.materialID === material.id);

    if (existingIndex >= 0) {
      // Menge erhöhen
      const updatedMaterials = [...formData.materials];
      updatedMaterials[existingIndex].quantity += 1;
      handleChange('materials', updatedMaterials);
    } else {
      // Neues Material
      handleChange('materials', [
        ...formData.materials,
        {
          materialID: material.id,
          description: material.description || material.name,
          quantity: 1,
          isVariable: false
        }
      ]);
    }
    setMaterialSearch('');
    setShowMaterialDropdown(false);
  };

  // Material-Menge ändern
  const handleMaterialQuantityChange = (index, quantity) => {
    const updatedMaterials = [...formData.materials];
    updatedMaterials[index].quantity = parseFloat(quantity) || 0;
    handleChange('materials', updatedMaterials);
  };

  // Material entfernen
  const handleRemoveMaterial = (index) => {
    handleChange('materials', formData.materials.filter((_, i) => i !== index));
  };

  // Arbeitszeit hinzufügen
  const handleAddLabor = () => {
    handleChange('labor', [
      ...formData.labor,
      {
        role: 'geselle',
        description: 'Arbeitszeit',
        minutes: 30
      }
    ]);
  };

  // Arbeitszeit ändern
  const handleLaborChange = (index, field, value) => {
    const updatedLabor = [...formData.labor];
    updatedLabor[index][field] = field === 'minutes' ? parseInt(value) || 0 : value;
    handleChange('labor', updatedLabor);
  };

  // Arbeitszeit entfernen
  const handleRemoveLabor = (index) => {
    handleChange('labor', formData.labor.filter((_, i) => i !== index));
  };

  // SubItem (Unterleistung) hinzufügen
  const handleAddSubItem = (selectedService) => {
    handleChange('subItems', [
      ...formData.subItems,
      {
        serviceId: selectedService.id,
        quantity: 1
      }
    ]);
    setSubItemSearch('');
    setShowSubItemDropdown(false);
  };

  // SubItem Menge ändern
  const handleSubItemQuantityChange = (index, quantity) => {
    const updated = [...formData.subItems];
    updated[index].quantity = parseInt(quantity) || 1;
    handleChange('subItems', updated);
  };

  // SubItem entfernen
  const handleRemoveSubItem = (index) => {
    handleChange('subItems', formData.subItems.filter((_, i) => i !== index));
  };

  // Replaces Service hinzufügen
  const handleAddReplaces = (selectedService) => {
    handleChange('replaces', [...formData.replaces, selectedService.id]);
    setReplacesSearch('');
    setShowReplacesDropdown(false);
  };

  // Replaces Service entfernen
  const handleRemoveReplaces = (serviceId) => {
    handleChange('replaces', formData.replaces.filter(id => id !== serviceId));
  };

  // Validierung
  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }
    if (!formData.shortText.trim()) {
      newErrors.shortText = 'Kurztext ist erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Speichern
  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const result = isEditing
        ? await updateService(service.id, formData)
        : await addService(formData);

      if (result.success) {
        showNotification(
          isEditing ? 'Position aktualisiert' : 'Position erstellt',
          'success'
        );
        onClose();
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

  // Material-EK-Preis finden
  const getMaterialPrice = (materialID) => {
    const mat = materials.find(m => m.id === materialID);
    return mat?.purchasePrice || mat?.price || 0;
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Leistungsposition bearbeiten' : 'Neue Leistungsposition'}
      size="xl"
    >
      <div className="space-y-6">
        {/* Grunddaten */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="z.B. PV-Modul montieren (Ziegeldach)"
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kurztext <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.shortText}
              onChange={(e) => handleChange('shortText', e.target.value)}
              placeholder="Erscheint im Angebot"
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                errors.shortText ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.shortText && (
              <p className="text-red-500 text-xs mt-1">{errors.shortText}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Langtext (optional)
            </label>
            <textarea
              value={formData.longText}
              onChange={(e) => handleChange('longText', e.target.value)}
              placeholder="Detaillierte Beschreibung der Leistung..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategorie
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                {SERVICE_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Einheit
              </label>
              <select
                value={formData.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                {SERVICE_UNITS.map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.label} ({unit.id})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Materialstückliste */}
        <div className="border-t pt-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium text-gray-900">Materialstückliste</h3>
            </div>
          </div>

          {/* Material-Suche */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={materialSearch}
              onChange={(e) => {
                setMaterialSearch(e.target.value);
                setShowMaterialDropdown(true);
              }}
              onFocus={() => setShowMaterialDropdown(true)}
              placeholder="Material suchen und hinzufügen..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />

            {/* Material-Dropdown */}
            {showMaterialDropdown && filteredMaterials.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredMaterials.map(mat => (
                  <button
                    key={mat.id}
                    onClick={() => handleAddMaterial(mat)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span className="truncate">{mat.description || mat.name}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {formatPrice(mat.purchasePrice || mat.price)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Material-Liste */}
          {formData.materials.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm bg-gray-50 rounded-lg">
              Noch keine Materialien hinzugefügt
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-600">Material</th>
                    <th className="px-3 py-2 text-right text-gray-600 w-24">Menge</th>
                    <th className="px-3 py-2 text-right text-gray-600 w-28">EK-Preis</th>
                    <th className="px-3 py-2 text-right text-gray-600 w-28">Gesamt</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {formData.materials.map((mat, index) => {
                    const ekPrice = getMaterialPrice(mat.materialID);
                    return (
                      <tr key={index}>
                        <td className="px-3 py-2 truncate max-w-xs">{mat.description}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={mat.quantity}
                            onChange={(e) => handleMaterialQuantityChange(index, e.target.value)}
                            className="w-full text-right border border-gray-200 rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600">
                          {formatPrice(ekPrice)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {formatPrice(ekPrice * mat.quantity)}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => handleRemoveMaterial(index)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="3" className="px-3 py-2 text-right font-medium">
                      Materialkosten (EK):
                    </td>
                    <td className="px-3 py-2 text-right font-bold">
                      {formatPrice(calculatedPrices.materialCostEK)}
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="px-3 py-2 text-right font-medium text-blue-600">
                      + Aufschlag ({calcSettings.margins?.materialMarkup}%):
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-blue-600">
                      {formatPrice(calculatedPrices.materialCostVK)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Arbeitszeiten */}
        <div className="border-t pt-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <h3 className="font-medium text-gray-900">Arbeitszeiten</h3>
            </div>
            <button
              onClick={handleAddLabor}
              className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Arbeitszeit
            </button>
          </div>

          {formData.labor.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm bg-gray-50 rounded-lg">
              Noch keine Arbeitszeiten hinzugefügt
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-600">Tätigkeit</th>
                    <th className="px-3 py-2 text-left text-gray-600 w-32">Qualifikation</th>
                    <th className="px-3 py-2 text-right text-gray-600 w-24">Minuten</th>
                    <th className="px-3 py-2 text-right text-gray-600 w-24">€/Std</th>
                    <th className="px-3 py-2 text-right text-gray-600 w-28">Kosten</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {formData.labor.map((item, index) => {
                    const hourlyRate = calcSettings.hourlyRates?.[item.role]?.rate || 0;
                    const cost = (item.minutes / 60) * hourlyRate;
                    return (
                      <tr key={index}>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleLaborChange(index, 'description', e.target.value)}
                            className="w-full border border-gray-200 rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.role}
                            onChange={(e) => handleLaborChange(index, 'role', e.target.value)}
                            className="w-full border border-gray-200 rounded px-2 py-1"
                          >
                            {Object.entries(calcSettings.hourlyRates || {}).map(([role, data]) => (
                              <option key={role} value={role}>{data.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={item.minutes}
                            onChange={(e) => handleLaborChange(index, 'minutes', e.target.value)}
                            className="w-full text-right border border-gray-200 rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600">
                          {formatPrice(hourlyRate)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {formatPrice(cost)}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => handleRemoveLabor(index)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="4" className="px-3 py-2 text-right font-medium">
                      Lohnkosten:
                    </td>
                    <td className="px-3 py-2 text-right font-bold">
                      {formatPrice(calculatedPrices.laborCost)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Kalkulation */}
        <div className="border-t pt-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Calculator className="h-5 w-5 text-purple-600" />
            <h3 className="font-medium text-gray-900">Kalkulation</h3>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Materialkosten (VK):</span>
              <span>{formatPrice(calculatedPrices.materialCostVK)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Lohnkosten:</span>
              <span>{formatPrice(calculatedPrices.laborCost)}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-gray-600">Selbstkosten:</span>
              <span>{formatPrice(calculatedPrices.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">+ Gewinn ({calcSettings.margins?.profitMargin}%):</span>
              <span>{formatPrice(calculatedPrices.subtotal * (calcSettings.margins?.profitMargin || 0) / 100)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">+ Wagnis ({calcSettings.margins?.riskMargin}%):</span>
              <span>{formatPrice(calculatedPrices.subtotal * (calcSettings.margins?.riskMargin || 0) / 100)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t pt-2 text-blue-600">
              <span>Einheitspreis (netto):</span>
              <span>{formatPrice(calculatedPrices.unitPriceNet)} / {formData.unit}</span>
            </div>
          </div>
        </div>

        {/* Aktiv-Schalter */}
        <div className="flex items-center justify-between border-t pt-6">
          <div>
            <span className="font-medium text-gray-900">Position aktiv</span>
            <p className="text-sm text-gray-500">Nur aktive Positionen erscheinen in der Auswahl</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Pflichtposition-Schalter */}
        <div className="flex items-center justify-between border-t pt-6 mt-6">
          <div>
            <span className="font-medium text-gray-900">Standardmäßig zu Angeboten hinzufügen</span>
            <p className="text-sm text-gray-500">Position wird automatisch zu jedem neuen Angebot hinzugefügt</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isDefaultPosition}
              onChange={(e) => handleChange('isDefaultPosition', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Standard-Menge bei Pflichtposition */}
        {formData.isDefaultPosition && (
          <div className="mt-4 pl-4 border-l-2 border-blue-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Standard-Menge
            </label>
            <input
              type="number"
              min="1"
              value={formData.defaultQuantity}
              onChange={(e) => handleChange('defaultQuantity', parseInt(e.target.value) || 1)}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Menge beim automatischen Hinzufügen</p>
          </div>
        )}

        {/* Paket-Schalter */}
        <div className="flex items-center justify-between border-t pt-6 mt-6">
          <div>
            <span className="font-medium text-gray-900">Ist ein Paket</span>
            <p className="text-sm text-gray-500">Dieses Paket enthält mehrere Unterleistungen</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPackage}
              onChange={(e) => handleChange('isPackage', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {/* Unterleistungen (nur wenn isPackage = true) */}
        {formData.isPackage && (
          <div className="mt-4 pl-4 border-l-2 border-purple-200">
            <div className="flex items-center space-x-2 mb-3">
              <Layers className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-gray-700 text-sm">Enthaltene Unterleistungen</span>
            </div>

            {/* Unterleistung suchen & hinzufügen */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={subItemSearch}
                onChange={(e) => {
                  setSubItemSearch(e.target.value);
                  setShowSubItemDropdown(true);
                }}
                onFocus={() => setShowSubItemDropdown(true)}
                placeholder="Unterleistung suchen und hinzufügen..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
              />

              {showSubItemDropdown && filteredSubItemServices.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredSubItemServices.map(svc => (
                    <button
                      key={svc.id}
                      onClick={() => handleAddSubItem(svc)}
                      className="w-full px-4 py-2 text-left hover:bg-purple-50 flex items-center justify-between text-sm"
                    >
                      <span className="truncate">{svc.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {SERVICE_CATEGORIES.find(c => c.id === svc.category)?.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Liste der hinzugefügten Unterleistungen */}
            {formData.subItems.length === 0 ? (
              <div className="text-center py-3 text-gray-500 text-sm bg-gray-50 rounded-lg">
                Noch keine Unterleistungen hinzugefügt
              </div>
            ) : (
              <div className="space-y-2">
                {formData.subItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-purple-50 px-3 py-2 rounded-lg">
                    <span className="text-sm text-gray-900 truncate flex-1">{getServiceName(item.serviceId)}</span>
                    <div className="flex items-center space-x-2 ml-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleSubItemQuantityChange(index, e.target.value)}
                        className="w-16 text-center text-sm border border-gray-200 rounded px-2 py-1"
                      />
                      <button
                        onClick={() => handleRemoveSubItem(index)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ersetzungs-Logik */}
        <div className="border-t pt-6 mt-6">
          <div className="flex items-center space-x-2 mb-3">
            <RefreshCcw className="h-5 w-5 text-orange-600" />
            <h3 className="font-medium text-gray-900">Ersetzungs-Logik</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Diese Leistung ersetzt automatisch die folgenden anderen Leistungen (z.B. Emma ersetzt Smartmeter)
          </p>

          {/* Ersetzt-Leistung suchen & hinzufügen */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={replacesSearch}
              onChange={(e) => {
                setReplacesSearch(e.target.value);
                setShowReplacesDropdown(true);
              }}
              onFocus={() => setShowReplacesDropdown(true)}
              placeholder="Leistung suchen die ersetzt werden soll..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
            />

            {showReplacesDropdown && filteredReplacesServices.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredReplacesServices.map(svc => (
                  <button
                    key={svc.id}
                    onClick={() => handleAddReplaces(svc)}
                    className="w-full px-4 py-2 text-left hover:bg-orange-50 flex items-center justify-between text-sm"
                  >
                    <span className="truncate">{svc.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {SERVICE_CATEGORIES.find(c => c.id === svc.category)?.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Liste der ersetzten Leistungen (als Tags) */}
          {formData.replaces.length === 0 ? (
            <div className="text-center py-3 text-gray-500 text-sm bg-gray-50 rounded-lg">
              Ersetzt keine anderen Leistungen
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {formData.replaces.map((serviceId) => (
                <span
                  key={serviceId}
                  className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                >
                  {getServiceName(serviceId)}
                  <button
                    onClick={() => handleRemoveReplaces(serviceId)}
                    className="ml-2 text-orange-600 hover:text-orange-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end space-x-3 px-6 py-4 border-t bg-gray-50">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Abbrechen
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Speichern...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Speichern
            </>
          )}
        </button>
      </div>
    </BaseModal>
  );
};

export default ServicePositionEditor;
