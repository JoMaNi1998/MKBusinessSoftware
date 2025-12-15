/**
 * InverterStep - Schritt 3: Wechselrichter & Strings konfigurieren
 */

import React from 'react';
import { Trash2, Plus, AlertTriangle } from 'lucide-react';
import { LabeledSelect } from '../shared/FormComponents';

const InverterStep = ({
  configuration,
  setConfiguration,
  availableInverters,
  availableCircuitBreakers,
  availableCables,
  recommendations,
  chosen,
  setOverrideRec,
  addStringToInverter,
  removeStringFromInverter,
  updateStringModules,
  addInverter,
  removeInverter,
  hasFieldError,
  clearFieldError,
}) => {
  return (
    <div className="space-y-6">
      {configuration.inverters.map((inv, i) => (
        <div key={i} className="p-4 border border-gray-200 rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-800">Wechselrichter #{i + 1}</h3>
            {i > 0 && (
              <button onClick={() => removeInverter(i)} className="text-red-500 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <LabeledSelect
            label="Typ"
            value={inv.type}
            onChange={(e) => {
              const v = e.target.value;
              setConfiguration((p) => {
                const next = { ...p, inverters: p.inverters.map((x) => ({ ...x })) };
                next.inverters[i].type = v;
                return next;
              });
              clearFieldError(`Wechselrichter ${i + 1}`);
            }}
            options={availableInverters}
            required
            hasError={hasFieldError(`Wechselrichter ${i + 1}`)}
            placeholder="Wechselrichter auswählen..."
          />

          {/* Empfehlungen (änderbar via Override) */}
          {(recommendations.inverterBreaker || recommendations.inverterCable) && inv.type && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Automatische Empfehlungen</h4>
              <div className="grid grid-cols-2 gap-3">
                {recommendations.inverterBreaker && (
                  <LabeledSelect
                    label="Leitungsschutzschalter (WR)"
                    value={chosen.inverterBreaker || ''}
                    onChange={(e) => setOverrideRec((o) => ({ ...o, inverterBreaker: e.target.value }))}
                    options={availableCircuitBreakers}
                    placeholder="LS auswählen..."
                  />
                )}
                {recommendations.inverterCable && (
                  <LabeledSelect
                    label="Mantelleitung (WR)"
                    value={chosen.inverterCable || ''}
                    onChange={(e) => setOverrideRec((o) => ({ ...o, inverterCable: e.target.value }))}
                    options={availableCables}
                    placeholder="Kabel auswählen..."
                  />
                )}
              </div>
            </div>
          )}

          {/* Strings */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Strings</h4>
            <div className="space-y-2">
              {(inv.strings || []).map((s, sIdx) => (
                <div key={sIdx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="font-mono text-sm">{s.name}</span>
                  <input
                    type="number"
                    min="1"
                    value={s.modules}
                    onChange={(e) => updateStringModules(i, sIdx, e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1"
                  />
                  <button onClick={() => removeStringFromInverter(i, sIdx)} className="text-gray-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => addStringToInverter(i)}
              className="mt-2 flex items-center text-sm text-primary-600 hover:text-primary-800"
            >
              <Plus className="h-4 w-4 mr-1" />
              String hinzufügen
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={addInverter}
        className="w-full flex justify-center items-center py-2 px-4 border border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <Plus className="h-4 w-4 mr-2" />
        Weiteren Wechselrichter hinzufügen
      </button>

      {hasFieldError('String-Module-Anzahl') && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800 font-medium">String-Module-Anzahl stimmt nicht mit der Gesamtsumme überein.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InverterStep;
