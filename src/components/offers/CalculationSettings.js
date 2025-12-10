import React, { useState, useEffect } from 'react';
import {
  Clock,
  Percent,
  Receipt,
  FileText,
  RefreshCw,
  Info,
  TrendingDown,
  Plus,
  Trash2,
  Home,
  Zap,
  Layers
} from 'lucide-react';
import { useCalculation } from '../../context/CalculationContext';

// Labels und Icons für Arbeitszeitfaktoren
const LABOR_FACTOR_CONFIG = {
  dach: {
    label: 'Dach',
    description: 'Aufschlag für PV-Montage-Arbeiten',
    icon: Home
  },
  elektro: {
    label: 'Elektro',
    description: 'Aufschlag für Elektroinstallationsarbeiten',
    icon: Zap
  },
  geruest: {
    label: 'Gerüst & Logistik',
    description: 'Aufschlag für Gerüst- und Logistikarbeiten',
    icon: Layers
  }
};

const CalculationSettings = () => {
  const { settings, loading, saveSettings, DEFAULT_SETTINGS } = useCalculation();

  const [localSettings, setLocalSettings] = useState(settings);

  // Lokale Settings aktualisieren wenn Firebase-Settings geladen werden
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Autosave bei Änderungen
  useEffect(() => {
    const changed = JSON.stringify(localSettings) !== JSON.stringify(settings);
    if (changed) {
      const timer = setTimeout(() => {
        saveSettings(localSettings);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [localSettings, settings, saveSettings]);

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
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Kalkulation & Angebote</h2>
        <p className="text-sm text-gray-500">Stundensätze, Zuschläge und Angebotseinstellungen</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          Standardwert für den Materialaufschlag bei neuen Leistungspositionen.
        </p>

        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Standard-Materialaufschlag
            <span className="ml-1 text-gray-400 cursor-help" title="Standardwert für neue Leistungspositionen">
              <Info className="h-3 w-3 inline" />
            </span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              value={localSettings.margins?.defaultMaterialMarkup ?? 15}
              onChange={(e) => handleChange('margins', 'defaultMaterialMarkup', parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
          </div>
        </div>

        {/* Kalkulationsübersicht */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Kalkulationsbeispiel (bei 15% Materialaufschlag)</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Material EK:</span>
              <span className="block font-medium">100,00 €</span>
            </div>
            <div>
              <span className="text-gray-500">+ Aufschlag (15%):</span>
              <span className="block font-medium">115,00 €</span>
            </div>
            <div className="border-l-2 border-blue-500 pl-3">
              <span className="text-gray-500">+ Lohnkosten:</span>
              <span className="block font-bold text-blue-600">= Einheitspreis</span>
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
          Faktoren pro Gewerk für erschwerte Arbeitsbedingungen. Stufen: Normal / Aufwendig / Komplex.
        </p>

        <div className="space-y-6">
          {Object.entries(LABOR_FACTOR_CONFIG).map(([factorType, config]) => {
            const IconComponent = config.icon;
            const factors = localSettings.laborFactors?.[factorType] || DEFAULT_SETTINGS.laborFactors?.[factorType] || [];

            return (
              <div key={factorType}>
                <div className="flex items-center space-x-2 mb-3">
                  <IconComponent className="h-4 w-4 text-gray-500" />
                  <h4 className="text-sm font-medium text-gray-700">{config.label}</h4>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  {config.description}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {factors.map((factor, index) => (
                    <div key={factor.id} className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {factor.label}
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="1"
                          max="3"
                          step="0.05"
                          value={factor.laborFactor}
                          onChange={(e) => {
                            const currentFactors = localSettings.laborFactors?.[factorType] || DEFAULT_SETTINGS.laborFactors?.[factorType] || [];
                            const newFactors = [...currentFactors];
                            newFactors[index] = { ...factor, laborFactor: parseFloat(e.target.value) || 1.0 };
                            setLocalSettings(prev => ({
                              ...prev,
                              laborFactors: {
                                ...prev.laborFactors,
                                [factorType]: newFactors
                              }
                            }));
                          }}
                          className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="ml-3 text-sm text-gray-500">
                          {factor.laborFactor > 1 ? `+${Math.round((factor.laborFactor - 1) * 100)}%` : 'Standard'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info-Box */}
        <div className="mt-6 p-4 bg-amber-50 rounded-lg text-sm">
          <p className="text-amber-800">
            <strong>Zuordnung:</strong> Dach → PV-Montage & Optimierer, Elektro → Wechselrichter, Speicher, Wallbox, Notstrom, Energiemanagement, Elektroinstallation, Gerüst & Logistik → Gerüstarbeiten
          </p>
        </div>
      </div>

      {/* Mengenstaffel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TrendingDown className="h-5 w-5 text-green-600" />
            <h3 className="text-base font-medium text-gray-900">Mengenstaffel (Arbeitszeit)</h3>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.quantityScales?.enabled || false}
              onChange={(e) => {
                setLocalSettings(prev => ({
                  ...prev,
                  quantityScales: {
                    ...prev.quantityScales,
                    enabled: e.target.checked
                  }
                }));
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Staffelrabatte auf Arbeitszeit basierend auf der Anzahl der Module im Angebot (nur PV-Montage).
        </p>

        {localSettings.quantityScales?.enabled && (
          <div className="space-y-4">
            {/* Staffelgrenzen als editierbare Tabelle */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Von (Module)</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Bis (Module)</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Rabatt auf Arbeitszeit</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Bezeichnung</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(localSettings.quantityScales?.tiers || []).map((tier, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="1"
                          value={tier.minQuantity}
                          onChange={(e) => {
                            const newTiers = [...(localSettings.quantityScales?.tiers || [])];
                            newTiers[index] = { ...tier, minQuantity: parseInt(e.target.value) || 1 };
                            setLocalSettings(prev => ({
                              ...prev,
                              quantityScales: { ...prev.quantityScales, tiers: newTiers }
                            }));
                          }}
                          className="w-20 border border-gray-300 rounded px-2 py-1 text-center focus:ring-2 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="1"
                          value={tier.maxQuantity || ''}
                          placeholder="∞"
                          onChange={(e) => {
                            const newTiers = [...(localSettings.quantityScales?.tiers || [])];
                            const val = e.target.value ? parseInt(e.target.value) : null;
                            newTiers[index] = { ...tier, maxQuantity: val };
                            setLocalSettings(prev => ({
                              ...prev,
                              quantityScales: { ...prev.quantityScales, tiers: newTiers }
                            }));
                          }}
                          className="w-20 border border-gray-300 rounded px-2 py-1 text-center focus:ring-2 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={tier.laborDiscount}
                            onChange={(e) => {
                              const newTiers = [...(localSettings.quantityScales?.tiers || [])];
                              newTiers[index] = { ...tier, laborDiscount: parseFloat(e.target.value) || 0 };
                              setLocalSettings(prev => ({
                                ...prev,
                                quantityScales: { ...prev.quantityScales, tiers: newTiers }
                              }));
                            }}
                            className="w-16 border border-gray-300 rounded px-2 py-1 text-center focus:ring-2 focus:ring-green-500"
                          />
                          <span className="ml-2 text-gray-500">%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={tier.label}
                          onChange={(e) => {
                            const newTiers = [...(localSettings.quantityScales?.tiers || [])];
                            newTiers[index] = { ...tier, label: e.target.value };
                            setLocalSettings(prev => ({
                              ...prev,
                              quantityScales: { ...prev.quantityScales, tiers: newTiers }
                            }));
                          }}
                          className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            const newTiers = (localSettings.quantityScales?.tiers || []).filter((_, i) => i !== index);
                            setLocalSettings(prev => ({
                              ...prev,
                              quantityScales: { ...prev.quantityScales, tiers: newTiers }
                            }));
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                          title="Staffel entfernen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Staffel hinzufügen Button */}
            <button
              onClick={() => {
                const currentTiers = localSettings.quantityScales?.tiers || [];
                const lastTier = currentTiers[currentTiers.length - 1];
                const newMin = lastTier ? (lastTier.maxQuantity || lastTier.minQuantity) + 1 : 1;
                const newTier = {
                  minQuantity: newMin,
                  maxQuantity: null,
                  laborDiscount: 0,
                  label: `${newMin}+ Module`
                };
                setLocalSettings(prev => ({
                  ...prev,
                  quantityScales: {
                    ...prev.quantityScales,
                    tiers: [...currentTiers, newTier]
                  }
                }));
              }}
              className="flex items-center px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg border border-dashed border-green-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Staffel hinzufügen
            </button>

            {/* Info-Box */}
            <div className="bg-green-50 rounded-lg p-4 text-sm">
              <p className="text-green-800">
                <strong>Beispiel:</strong> Bei 25 Modulen und einer Staffel "21-30 Module: 10%" wird die Arbeitszeit
                für PV-Montage-Positionen um 10% reduziert. Der Staffelrabatt wird automatisch bei der
                Angebotserstellung angewendet.
              </p>
            </div>
          </div>
        )}
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
                value={localSettings.tax?.defaultRate ?? 0}
                onChange={(e) => handleChange('tax', 'defaultRate', parseFloat(e.target.value) ?? 0)}
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
