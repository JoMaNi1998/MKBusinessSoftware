/**
 * ExtrasStep - Schritt 4: Zusätzliche Komponenten (Wallbox, Speicher, etc.)
 */

import React, { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { SectionCard, LabeledSelect, LabeledNumber } from '../shared/FormComponents';
import { PV_CAT } from '@utils';
import type {
  PVConfiguration,
  PVSelectOption,
  PVRecommendations,
  PVOverrideRecommendations
} from '@app-types/components/pvConfigurator.types';

interface ExtrasStepProps {
  configuration: PVConfiguration;
  setConfiguration: Dispatch<SetStateAction<PVConfiguration>>;
  availableWallboxes: PVSelectOption[];
  availableBatteries: PVSelectOption[];
  availableOptimizers: PVSelectOption[];
  availableCircuitBreakers: PVSelectOption[];
  availableCables: PVSelectOption[];
  availableRCDs: PVSelectOption[];
  optionsFromCategory: (category: string) => PVSelectOption[];
  recommendations: PVRecommendations;
  chosen: PVRecommendations;
  setOverrideRec: Dispatch<SetStateAction<PVOverrideRecommendations>>;
  hasFieldError: (field: string) => boolean;
  clearFieldError: (field: string) => void;
}

const ExtrasStep: React.FC<ExtrasStepProps> = ({
  configuration,
  setConfiguration,
  availableWallboxes,
  availableBatteries,
  availableOptimizers,
  availableCircuitBreakers,
  availableCables,
  availableRCDs,
  optionsFromCategory,
  recommendations: _recommendations,
  chosen,
  setOverrideRec,
  hasFieldError,
  clearFieldError,
}) => {
  return (
    <div className="space-y-6">
      {/* Wallbox + Empfehlungen */}
      <SectionCard>
        <div className="grid grid-cols-2 gap-4">
          <LabeledSelect
            label="Wallbox"
            value={configuration.wallbox}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              setConfiguration((p) => ({ ...p, wallbox: e.target.value }));
              clearFieldError('Wallbox');
            }}
            options={availableWallboxes}
            placeholder="Keine Wallbox"
            hasError={hasFieldError('Wallbox')}
          />
          <LabeledNumber
            label="Anzahl"
            value={configuration.wallboxQty}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setConfiguration((p) => ({ ...p, wallboxQty: Math.max(0, parseInt(e.target.value) || 0) }));
              clearFieldError('Wallbox');
            }}
            min={0}
            hasError={hasFieldError('Wallbox')}
          />
        </div>

        {configuration.wallbox && (
          <div className="bg-blue-50 p-3 rounded-lg mt-3">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Automatische Empfehlungen</h4>
            <div className="grid grid-cols-3 gap-3">
              <LabeledSelect
                label="Leitungsschutzschalter"
                value={chosen.wallboxBreaker || ''}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setOverrideRec((o: any) => ({ ...o, wallboxBreaker: e.target.value }))}
                options={availableCircuitBreakers}
                placeholder="LS auswählen..."
              />
              <LabeledSelect
                label="Mantelleitung"
                value={chosen.wallboxCable || ''}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setOverrideRec((o: any) => ({ ...o, wallboxCable: e.target.value }))}
                options={availableCables}
                placeholder="Kabel auswählen..."
              />
              <LabeledSelect
                label="FI‑Schutzschalter"
                value={chosen.wallboxRCD || ''}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setOverrideRec((o: any) => ({ ...o, wallboxRCD: e.target.value }))}
                options={availableRCDs}
                placeholder="RCD auswählen..."
              />
            </div>
          </div>
        )}
      </SectionCard>

      {/* Speicher */}
      <SectionCard title="Speicher">
        <div className="grid grid-cols-2 gap-4">
          <LabeledSelect
            label="Speicher"
            value={configuration.battery}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              setConfiguration((p) => ({ ...p, battery: e.target.value }));
              clearFieldError('Speicher');
            }}
            options={availableBatteries}
            placeholder="Kein Speicher"
            hasError={hasFieldError('Speicher')}
          />
          <LabeledNumber
            label="Anzahl"
            value={configuration.batteryQty}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setConfiguration((p) => ({ ...p, batteryQty: Math.max(0, parseInt(e.target.value) || 0) }));
              clearFieldError('Speicher');
            }}
            min={0}
            hasError={hasFieldError('Speicher')}
          />
        </div>
      </SectionCard>

      {/* Energiemanagement */}
      <SectionCard title="Energiemanagement">
        <div className="grid grid-cols-2 gap-4">
          <LabeledSelect
            label="Energiemanagement"
            value={configuration.energiemanagement}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              setConfiguration((p) => ({ ...p, energiemanagement: e.target.value }));
              clearFieldError('Energiemanagement');
            }}
            options={optionsFromCategory(PV_CAT.ENERGY_MGMT)}
            placeholder="Kein Energiemanagement"
            hasError={hasFieldError('Energiemanagement')}
          />
          <LabeledNumber
            label="Anzahl"
            value={configuration.energiemanagementQty}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setConfiguration((p) => ({
                ...p,
                energiemanagementQty: Math.max(0, parseInt(e.target.value) || 0),
              }));
              clearFieldError('Energiemanagement');
            }}
            min={0}
            hasError={hasFieldError('Energiemanagement')}
          />
        </div>
      </SectionCard>

      {/* Notstromlösungen + Empfehlungen */}
      <SectionCard title="Notstromlösungen">
        <div className="grid grid-cols-2 gap-4">
          <LabeledSelect
            label="Notstromlösung"
            value={configuration.notstromloesungen}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              setConfiguration((p) => ({ ...p, notstromloesungen: e.target.value }));
              clearFieldError('Notstromlösungen');
            }}
            options={optionsFromCategory(PV_CAT.BACKUP_BOXES)}
            placeholder="Keine Notstromlösung"
            hasError={hasFieldError('Notstromlösungen')}
          />
          <LabeledNumber
            label="Anzahl"
            value={configuration.notstromloesungenQty}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setConfiguration((p) => ({
                ...p,
                notstromloesungenQty: Math.max(0, parseInt(e.target.value) || 0),
              }));
              clearFieldError('Notstromlösungen');
            }}
            min={0}
            hasError={hasFieldError('Notstromlösungen')}
          />
        </div>

        {configuration.notstromloesungen && (
          <div className="bg-blue-50 p-3 rounded-lg mt-3">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Automatische Empfehlungen</h4>
            <div className="grid grid-cols-2 gap-3">
              <LabeledSelect
                label="Leitungsschutzschalter"
                value={chosen.backupBreaker || ''}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setOverrideRec((o: any) => ({ ...o, backupBreaker: e.target.value }))}
                options={availableCircuitBreakers}
                placeholder="LS auswählen..."
              />
              <LabeledSelect
                label="Mantelleitung"
                value={chosen.backupCable || ''}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setOverrideRec((o: any) => ({ ...o, backupCable: e.target.value }))}
                options={availableCables}
                placeholder="Kabel auswählen..."
              />
            </div>
          </div>
        )}
      </SectionCard>

      {/* Optimierer */}
      <SectionCard title="Optimierer">
        <div className="grid grid-cols-2 gap-4">
          <LabeledSelect
            label="Optimierer"
            value={configuration.optimizer}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              setConfiguration((p) => ({ ...p, optimizer: e.target.value }));
              clearFieldError('Optimierer');
            }}
            options={availableOptimizers}
            placeholder="Kein Optimierer"
            hasError={hasFieldError('Optimierer')}
          />
          <LabeledNumber
            label="Anzahl"
            value={configuration.optimizerQty}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setConfiguration((p) => ({ ...p, optimizerQty: Math.max(0, parseInt(e.target.value) || 0) }));
              clearFieldError('Optimierer');
            }}
            min={0}
            hasError={hasFieldError('Optimierer')}
          />
        </div>
      </SectionCard>
    </div>
  );
};

export default ExtrasStep;
