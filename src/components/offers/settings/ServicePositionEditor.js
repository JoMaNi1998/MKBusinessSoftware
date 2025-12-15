import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  Package,
  Clock,
  Calculator,
  Search
} from 'lucide-react';
import { useServiceCatalog, SERVICE_CATEGORIES, SERVICE_UNITS } from '../../../context/ServiceCatalogContext';
import { useCalculation } from '../../../context/CalculationContext';
import { useMaterials } from '../../../context/MaterialContext';
import { useNotification } from '../../../context/NotificationContext';
import { BaseModal } from '../../shared';

const ServicePositionEditor = ({ service, isOpen, onClose }) => {
  const { addService, updateService } = useServiceCatalog();
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
    isDefaultPosition: false,
    defaultQuantity: 1,
    sortOrder: 999,
    // Materialaufschlag in %
    materialMarkup: 15
  });

  const [materialSearch, setMaterialSearch] = useState('');
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Refs für Click-Outside-Handler
  const materialDropdownRef = useRef(null);

  // Standard-Materialaufschlag aus Einstellungen
  const defaultMarkup = calcSettings.margins?.defaultMaterialMarkup ?? 15;

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
        isDefaultPosition: service.isDefaultPosition || false,
        defaultQuantity: service.defaultQuantity || 1,
        sortOrder: service.sortOrder || 999,
        materialMarkup: service.materialMarkup ?? defaultMarkup
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
        isDefaultPosition: false,
        defaultQuantity: 1,
        sortOrder: 999,
        materialMarkup: defaultMarkup
      });
    }
    setErrors({});
    setMaterialSearch('');
    setShowMaterialDropdown(false);
  }, [service, isOpen, defaultMarkup]);

  // Click-Outside-Handler für Dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (materialDropdownRef.current && !materialDropdownRef.current.contains(event.target)) {
        setShowMaterialDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  // Kalkulation berechnen
  const calculatedPrices = useMemo(() => {
    return calculateServicePosition(formData.materials, formData.labor, materials, formData.materialMarkup);
  }, [formData.materials, formData.labor, materials, formData.materialMarkup, calculateServicePosition]);

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
    // Ersten verfügbaren Stundensatz als Standard verwenden
    const availableRoles = Object.keys(calcSettings.hourlyRates || {});
    const defaultRole = availableRoles[0] || 'gesellePrivat';

    handleChange('labor', [
      ...formData.labor,
      {
        role: defaultRole,
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
              Interner Name <span className="text-red-500">*</span>
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
            <p className="text-xs text-gray-500 mt-1">Nur zur internen Verwaltung, wird nicht im Angebot angezeigt</p>
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Positionstext im Angebot <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.shortText}
              onChange={(e) => handleChange('shortText', e.target.value)}
              placeholder="z.B. Montage PV-Modul inkl. Befestigung"
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                errors.shortText ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">Dieser Text erscheint als Positionsbeschreibung im Angebot für den Kunden</p>
            {errors.shortText && (
              <p className="text-red-500 text-xs mt-1">{errors.shortText}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Detailbeschreibung (optional)
            </label>
            <textarea
              value={formData.longText}
              onChange={(e) => handleChange('longText', e.target.value)}
              placeholder="Ausführliche Beschreibung für das Angebot..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Optionale Zusatzinformationen, die unter der Position im Angebot angezeigt werden</p>
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
          <div className="relative mb-4" ref={materialDropdownRef}>
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
                    <td colSpan="2" className="px-3 py-2 text-right font-medium text-blue-600">
                      + Aufschlag
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={formData.materialMarkup}
                          onChange={(e) => handleChange('materialMarkup', parseFloat(e.target.value) || 0)}
                          className="w-16 text-right border border-gray-200 rounded px-2 py-1"
                        />
                        <span className="ml-1 text-gray-500">%</span>
                      </div>
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
            <div className="flex justify-between text-base font-bold border-t pt-2 text-blue-600">
              <span>Einheitspreis (netto):</span>
              <span>{formatPrice(calculatedPrices.unitPriceNet)} / {formData.unit}</span>
            </div>
          </div>
        </div>

        {/* Pflichtposition-Schalter */}
        <div className="flex items-center justify-between border-t pt-6">
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
