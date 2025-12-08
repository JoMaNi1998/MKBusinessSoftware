import React, { useState, useEffect } from 'react';
import {
  Clock,
  Percent,
  Receipt,
  FileText,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  Mountain,
  Cable,
  LayoutGrid,
  Car
} from 'lucide-react';
import { useCalculation } from '../../context/CalculationContext';
import { useNotification } from '../../context/NotificationContext';

// Default-Kategorien für Arbeitszeitfaktoren
const DEFAULT_ROOF_PITCH_CATEGORIES = [
  { id: 'standard', label: 'Standard (0-25°)', laborFactor: 1.0 },
  { id: 'medium', label: 'Mittel (25-35°)', laborFactor: 1.15 },
  { id: 'steep', label: 'Steil (>35°)', laborFactor: 1.30 }
];

const DEFAULT_CABLE_LENGTH_CATEGORIES = [
  { id: 'standard', label: 'Standard (<15m)', laborFactor: 1.0 },
  { id: 'medium', label: 'Mittel (15-30m)', laborFactor: 1.20 },
  { id: 'long', label: 'Lang (>30m)', laborFactor: 1.40 }
];

const DEFAULT_PV_LAYOUT_CATEGORIES = [
  { id: 'standard', label: 'Standard (einfach)', laborFactor: 1.0 },
  { id: 'medium', label: 'Mittel (mehrere Flächen)', laborFactor: 1.15 },
  { id: 'complex', label: 'Komplex (Gauben/Verschattung)', laborFactor: 1.30 }
];

const DEFAULT_TRAVEL_CATEGORIES = [
  { id: 'standard', label: 'Standard (<30km)', laborFactor: 1.0 },
  { id: 'medium', label: 'Mittel (30-60km)', laborFactor: 1.15 },
  { id: 'far', label: 'Weit (>60km)', laborFactor: 1.30 }
];

const CalculationSettings = () => {
  const { settings, loading, saving, saveSettings, DEFAULT_SETTINGS } = useCalculation();
  const { showNotification } = useNotification();

  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  // Lokale Settings aktualisieren wenn Firebase-Settings geladen werden
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Änderungen tracken
  useEffect(() => {
    const changed = JSON.stringify(localSettings) !== JSON.stringify(settings);
    setHasChanges(changed);
  }, [localSettings, settings]);

  const handleChange = (section, key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: typeof prev[section][key] === 'object' && key !== 'rate'
          ? { ...prev[section][key], ...value }
          : value
      }
    }));
  };

  const handleHourlyRateChange = (role, value) => {
    setLocalSettings(prev => ({
      ...prev,
      hourlyRates: {
        ...prev.hourlyRates,
        [role]: {
          ...prev.hourlyRates[role],
          rate: parseFloat(value) || 0
        }
      }
    }));
  };

  const handleSave = async () => {
    const result = await saveSettings(localSettings);
    if (result.success) {
      showNotification('Kalkulationseinstellungen gespeichert', 'success');
    } else {
      showNotification('Fehler beim Speichern', 'error');
    }
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_SETTINGS);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Kalkulation & Angebote</h2>
          <p className="text-sm text-gray-500">Stundensätze, Zuschläge und Angebotseinstellungen</p>
        </div>
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <span className="flex items-center text-sm text-amber-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              Ungespeicherte Änderungen
            </span>
          )}
          <button
            onClick={handleReset}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <RefreshCw className="h-4 w-4 inline mr-1" />
            Zurücksetzen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`px-4 py-2 rounded-lg flex items-center text-sm font-medium ${
              hasChanges
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Speichern
          </button>
        </div>
      </div>

      {/* Stundensätze */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-medium text-gray-900">Stundensätze (netto)</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Diese Stundensätze werden für die Kalkulation von Arbeitszeiten in Leistungspositionen verwendet.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(localSettings.hourlyRates || {}).map(([role, data]) => (
            <div key={role}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {data.label}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={data.rate}
                  onChange={(e) => handleHourlyRateChange(role, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  €/Std
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zuschläge & Margen */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Percent className="h-5 w-5 text-green-600" />
          <h3 className="text-base font-medium text-gray-900">Zuschläge & Margen</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Aufschläge für Material und Gewinnmargen auf Selbstkosten.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Materialaufschlag
              <span className="ml-1 text-gray-400 cursor-help" title="Aufschlag auf Einkaufspreise">
                <Info className="h-3 w-3 inline" />
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={localSettings.margins?.materialMarkup || 0}
                onChange={(e) => handleChange('margins', 'materialMarkup', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gewinnmarge
              <span className="ml-1 text-gray-400 cursor-help" title="Aufschlag auf Selbstkosten">
                <Info className="h-3 w-3 inline" />
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={localSettings.margins?.profitMargin || 0}
                onChange={(e) => handleChange('margins', 'profitMargin', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wagnis/Risiko
              <span className="ml-1 text-gray-400 cursor-help" title="Risikoaufschlag auf Selbstkosten">
                <Info className="h-3 w-3 inline" />
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={localSettings.margins?.riskMargin || 0}
                onChange={(e) => handleChange('margins', 'riskMargin', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skonto-Puffer
              <span className="ml-1 text-gray-400 cursor-help" title="Optionaler Puffer für Skontogewährung">
                <Info className="h-3 w-3 inline" />
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={localSettings.margins?.discountBuffer || 0}
                onChange={(e) => handleChange('margins', 'discountBuffer', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            </div>
          </div>
        </div>

        {/* Kalkulationsübersicht */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Kalkulationsbeispiel</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Material EK:</span>
              <span className="block font-medium">100,00 €</span>
            </div>
            <div>
              <span className="text-gray-500">+ Aufschlag ({localSettings.margins?.materialMarkup || 0}%):</span>
              <span className="block font-medium">{(100 * (localSettings.margins?.materialMarkup || 0) / 100).toFixed(2)} €</span>
            </div>
            <div>
              <span className="text-gray-500">Lohnkosten:</span>
              <span className="block font-medium">50,00 €</span>
            </div>
            <div className="border-l-2 border-blue-500 pl-3">
              <span className="text-gray-500">Einheitspreis:</span>
              <span className="block font-bold text-blue-600">
                {(
                  (100 * (1 + (localSettings.margins?.materialMarkup || 0) / 100) + 50) *
                  (1 + (localSettings.margins?.profitMargin || 0) / 100 + (localSettings.margins?.riskMargin || 0) / 100)
                ).toFixed(2)} €
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Arbeitszeitfaktoren */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="h-5 w-5 text-amber-600" />
          <h3 className="text-base font-medium text-gray-900">Arbeitszeitfaktoren</h3>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Faktoren für erschwerte Arbeitsbedingungen bei PV-Montage und Elektroinstallation.
        </p>

        {/* Dachneigung */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Mountain className="h-4 w-4 text-gray-500" />
            <h4 className="text-sm font-medium text-gray-700">Dachneigung (PV-Montage)</h4>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Je steiler das Dach, desto mehr Arbeitszeit für die PV-Montage
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(localSettings.laborFactors?.roofPitchCategories || DEFAULT_ROOF_PITCH_CATEGORIES).map((cat, index) => (
              <div key={cat.id} className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {cat.label}
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="3"
                    step="0.05"
                    value={cat.laborFactor}
                    onChange={(e) => {
                      const currentCategories = localSettings.laborFactors?.roofPitchCategories || DEFAULT_ROOF_PITCH_CATEGORIES;
                      const newCategories = [...currentCategories];
                      newCategories[index] = { ...cat, laborFactor: parseFloat(e.target.value) || 1.0 };
                      setLocalSettings(prev => ({
                        ...prev,
                        laborFactors: {
                          ...prev.laborFactors,
                          roofPitchCategories: newCategories
                        }
                      }));
                    }}
                    className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-500">
                    {cat.laborFactor > 1 ? `+${Math.round((cat.laborFactor - 1) * 100)}%` : 'Standard'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kabelweg */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Cable className="h-4 w-4 text-gray-500" />
            <h4 className="text-sm font-medium text-gray-700">Kabelweg (Elektroinstallation)</h4>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Je länger der Kabelweg, desto mehr Arbeitszeit für die Elektroinstallation
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(localSettings.laborFactors?.cableLengthCategories || DEFAULT_CABLE_LENGTH_CATEGORIES).map((cat, index) => (
              <div key={cat.id} className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {cat.label}
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="3"
                    step="0.05"
                    value={cat.laborFactor}
                    onChange={(e) => {
                      const currentCategories = localSettings.laborFactors?.cableLengthCategories || DEFAULT_CABLE_LENGTH_CATEGORIES;
                      const newCategories = [...currentCategories];
                      newCategories[index] = { ...cat, laborFactor: parseFloat(e.target.value) || 1.0 };
                      setLocalSettings(prev => ({
                        ...prev,
                        laborFactors: {
                          ...prev.laborFactors,
                          cableLengthCategories: newCategories
                        }
                      }));
                    }}
                    className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-500">
                    {cat.laborFactor > 1 ? `+${Math.round((cat.laborFactor - 1) * 100)}%` : 'Standard'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PV Layout */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <LayoutGrid className="h-4 w-4 text-gray-500" />
            <h4 className="text-sm font-medium text-gray-700">PV Layout (Planungsaufwand)</h4>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Komplexere Dachlayouts erfordern mehr Planungs- und Montagezeit
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(localSettings.laborFactors?.pvLayoutCategories || DEFAULT_PV_LAYOUT_CATEGORIES).map((cat, index) => (
              <div key={cat.id} className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {cat.label}
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="3"
                    step="0.05"
                    value={cat.laborFactor}
                    onChange={(e) => {
                      const currentCategories = localSettings.laborFactors?.pvLayoutCategories || DEFAULT_PV_LAYOUT_CATEGORIES;
                      const newCategories = [...currentCategories];
                      newCategories[index] = { ...cat, laborFactor: parseFloat(e.target.value) || 1.0 };
                      setLocalSettings(prev => ({
                        ...prev,
                        laborFactors: {
                          ...prev.laborFactors,
                          pvLayoutCategories: newCategories
                        }
                      }));
                    }}
                    className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-500">
                    {cat.laborFactor > 1 ? `+${Math.round((cat.laborFactor - 1) * 100)}%` : 'Standard'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Anfahrt */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Car className="h-4 w-4 text-gray-500" />
            <h4 className="text-sm font-medium text-gray-700">Anfahrt (Entfernung)</h4>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Weitere Anfahrtswege erhöhen die Gesamtkosten
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(localSettings.laborFactors?.travelCategories || DEFAULT_TRAVEL_CATEGORIES).map((cat, index) => (
              <div key={cat.id} className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {cat.label}
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="3"
                    step="0.05"
                    value={cat.laborFactor}
                    onChange={(e) => {
                      const currentCategories = localSettings.laborFactors?.travelCategories || DEFAULT_TRAVEL_CATEGORIES;
                      const newCategories = [...currentCategories];
                      newCategories[index] = { ...cat, laborFactor: parseFloat(e.target.value) || 1.0 };
                      setLocalSettings(prev => ({
                        ...prev,
                        laborFactors: {
                          ...prev.laborFactors,
                          travelCategories: newCategories
                        }
                      }));
                    }}
                    className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-500">
                    {cat.laborFactor > 1 ? `+${Math.round((cat.laborFactor - 1) * 100)}%` : 'Standard'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Steuereinstellungen */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Receipt className="h-5 w-5 text-purple-600" />
          <h3 className="text-base font-medium text-gray-900">Steuereinstellungen</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Standard-MwSt-Satz
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={localSettings.tax?.defaultRate || 19}
                onChange={(e) => handleChange('tax', 'defaultRate', parseFloat(e.target.value) || 19)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ermäßigter Satz (optional)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={localSettings.tax?.reducedRate || 7}
                onChange={(e) => handleChange('tax', 'reducedRate', parseFloat(e.target.value) || 7)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Angebotseinstellungen */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="h-5 w-5 text-orange-600" />
          <h3 className="text-base font-medium text-gray-900">Angebotseinstellungen</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gültigkeit (Tage)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={localSettings.offerDefaults?.validityDays || 30}
              onChange={(e) => handleChange('offerDefaults', 'validityDays', parseInt(e.target.value) || 30)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zahlungsbedingungen
            </label>
            <input
              type="text"
              value={localSettings.offerDefaults?.paymentTerms || ''}
              onChange={(e) => handleChange('offerDefaults', 'paymentTerms', e.target.value)}
              placeholder="z.B. 14 Tage netto"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lieferbedingungen
            </label>
            <input
              type="text"
              value={localSettings.offerDefaults?.deliveryTerms || ''}
              onChange={(e) => handleChange('offerDefaults', 'deliveryTerms', e.target.value)}
              placeholder="z.B. Nach Vereinbarung"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nummernformat
            </label>
            <input
              type="text"
              value={localSettings.offerDefaults?.numberFormat || 'ANG-{YEAR}-{NUMBER}'}
              onChange={(e) => handleChange('offerDefaults', 'numberFormat', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Vorschau: ANG-{new Date().getFullYear()}-0001
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculationSettings;
