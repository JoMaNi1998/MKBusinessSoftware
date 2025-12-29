/**
 * LayoutStep - Schritt 1: Modul & Layout konfigurieren
 */

import React, { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { Sun, Building, Layers, Target, Plus, Trash2 } from 'lucide-react';
import { SectionCard, LabeledSelect } from '../shared/FormComponents';
import type {
  PVConfiguration,
  PVModuleRow,
  PVLayoutTotals,
  PVSelectOption,
  PVRoofType
} from '@app-types/components/pvConfigurator.types';

interface LayoutStepProps {
  configuration: PVConfiguration;
  setConfiguration: Dispatch<SetStateAction<PVConfiguration>>;
  availableModules: PVSelectOption[];
  layoutTotals: PVLayoutTotals;
  hasFieldError: (field: string) => boolean;
  clearFieldError: (field: string) => void;
}

const LayoutStep: React.FC<LayoutStepProps> = ({
  configuration,
  setConfiguration,
  availableModules,
  layoutTotals,
  hasFieldError,
  clearFieldError,
}) => {
  const roofTypes: PVRoofType[] = [
    { value: 'Ziegel', emoji: '🏠', desc: 'Klassisches Ziegeldach' },
    { value: 'Trapez', emoji: '🏭', desc: 'Gewerbedach' },
    { value: 'Flach', emoji: '🏢', desc: 'Flachdach' },
  ];

  return (
    <div className="space-y-4">
      {/* PV-Modul Auswahl */}
      <SectionCard titleIcon={Sun} title="PV‑Modul">
        <LabeledSelect
          label="PV‑Modul"
          value={configuration.module}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            setConfiguration((p) => ({ ...p, module: e.target.value }));
            clearFieldError('PV-Modul');
          }}
          options={availableModules}
          required
          hasError={hasFieldError('PV-Modul')}
          placeholder="Modul auswählen..."
        />
      </SectionCard>

      {/* Dachtyp Auswahl */}
      <SectionCard titleIcon={Building} title="Dachtyp">
        {hasFieldError('Dachtyp') && (
          <p className="text-red-600 text-xs mb-3">Dachtyp muss ausgewählt werden</p>
        )}
        <div className="grid grid-cols-3 gap-3">
          {roofTypes.map((r: PVRoofType) => (
            <div
              key={r.value}
              onClick={() => {
                setConfiguration((p) => ({ ...p, roofType: r.value }));
                clearFieldError('Dachtyp');
              }}
              className={`p-3 rounded-lg border cursor-pointer text-center transition-all ${
                configuration.roofType === r.value
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 bg-white hover:border-gray-400'
              }`}
            >
              <div className="text-2xl mb-1">{r.emoji}</div>
              <div className="font-medium text-gray-900 text-sm">{r.value}dach</div>
              <div className="text-xs text-gray-600">{r.desc}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Modulanordnung */}
      <SectionCard titleIcon={Layers} title="Modulanordnung">
        {hasFieldError('Modulanordnung') && (
          <p className="text-red-600 text-xs mb-3">Mindestens eine Reihe hinzufügen</p>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Querformat */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-800 flex items-center text-sm">
              <Target className="h-4 w-4 mr-2 text-gray-600" />
              Querformat
            </h3>
            {(configuration.querformatRows || []).map((row: PVModuleRow, idx: number) => (
              <div
                key={idx}
                className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-medium">
                  {idx + 1}
                </div>
                <input
                  type="number"
                  min="1"
                  value={row.modules}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setConfiguration((p) => {
                      const rows = [...(p.querformatRows || [])];
                      rows[idx] = { ...rows[idx], modules: Math.max(1, parseInt(e.target.value) || 1) };
                      return { ...p, querformatRows: rows };
                    })
                  }
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium"
                />
                <span className="text-sm text-gray-700 font-medium">Module</span>
                <button
                  onClick={() =>
                    setConfiguration((p) => ({
                      ...p,
                      querformatRows: (p.querformatRows || []).filter((_, i) => i !== idx),
                    }))
                  }
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded ml-auto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                setConfiguration((p) => ({
                  ...p,
                  querformatRows: [...(p.querformatRows || []), { modules: 1 }],
                }));
                clearFieldError('Modulanordnung');
              }}
              className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Reihe hinzufügen
            </button>
          </div>

          {/* Hochformat */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-800 flex items-center text-sm">
              <Target className="h-4 w-4 mr-2 text-gray-600" />
              Hochformat
            </h3>
            {(configuration.hochformatRows || []).map((row: PVModuleRow, idx: number) => (
              <div
                key={idx}
                className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm font-medium">
                  {idx + 1}
                </div>
                <input
                  type="number"
                  min="1"
                  value={row.modules}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setConfiguration((p) => {
                      const rows = [...(p.hochformatRows || [])];
                      rows[idx] = { ...rows[idx], modules: Math.max(1, parseInt(e.target.value) || 1) };
                      return { ...p, hochformatRows: rows };
                    })
                  }
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium"
                />
                <span className="text-sm text-gray-700 font-medium">Module</span>
                <button
                  onClick={() =>
                    setConfiguration((p) => ({
                      ...p,
                      hochformatRows: (p.hochformatRows || []).filter((_, i) => i !== idx),
                    }))
                  }
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded ml-auto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                setConfiguration((p) => ({
                  ...p,
                  hochformatRows: [...(p.hochformatRows || []), { modules: 1 }],
                }));
                clearFieldError('Modulanordnung');
              }}
              className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Reihe hinzufügen
            </button>
          </div>
        </div>

        {/* Zusammenfassung */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-800 text-sm mb-2">Zusammenfassung</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Anzahl Reihen:</span>
              <div className="font-bold text-gray-900">{layoutTotals.totalRows}</div>
            </div>
            <div>
              <span className="text-gray-600">Querformat Module:</span>
              <div className="font-bold text-blue-900">{layoutTotals.qCount}</div>
            </div>
            <div>
              <span className="text-gray-600">Hochformat Module:</span>
              <div className="font-bold text-green-900">{layoutTotals.hCount}</div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-300">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">Summe Module:</span>
              <span className="text-lg font-bold text-gray-900">{layoutTotals.totalModules}</span>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

export default LayoutStep;
