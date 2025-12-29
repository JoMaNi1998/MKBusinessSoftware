/**
 * MountingStep - Schritt 2: Montage konfigurieren
 */

import React, { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { Wrench, Anchor, Plug, Home } from 'lucide-react';
import { SectionCard, LabeledSelect } from '../shared/FormComponents';
import { PV_CAT } from '@utils';
import type { PVConfiguration, PVSelectOption } from '@app-types/components/pvConfigurator.types';

interface MountingStepProps {
  configuration: PVConfiguration;
  setConfiguration: Dispatch<SetStateAction<PVConfiguration>>;
  availablePVMounting: PVSelectOption[];
  availableClamps: PVSelectOption[];
  availableProfiles: PVSelectOption[];
  availableConnectors: PVSelectOption[];
  optionsFromCategory: (category: string) => PVSelectOption[];
  hasFieldError: (field: string) => boolean;
  clearFieldError: (field: string) => void;
}

const MountingStep: React.FC<MountingStepProps> = ({
  configuration,
  setConfiguration,
  availablePVMounting,
  availableClamps,
  availableProfiles,
  availableConnectors,
  optionsFromCategory,
  hasFieldError,
  clearFieldError,
}) => {
  return (
    <div className="space-y-6">
      {/* Montagesystem */}
      <SectionCard titleIcon={Wrench} title="Montagesystem">
        <LabeledSelect
          label="Montagesystem"
          value={configuration.pvMountingSystem}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            setConfiguration((p) => ({ ...p, pvMountingSystem: e.target.value }));
            clearFieldError('Montagesystem');
          }}
          options={availablePVMounting}
          required
          hasError={hasFieldError('Montagesystem')}
          placeholder="System auswählen..."
        />
      </SectionCard>

      {/* Befestigung */}
      <SectionCard titleIcon={Anchor} title="Befestigung">
        <LabeledSelect
          label="Befestigung für Montagesystem"
          value={configuration.befestigungPVMountingSystem}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            setConfiguration((p) => ({ ...p, befestigungPVMountingSystem: e.target.value }));
            clearFieldError('Befestigung');
          }}
          options={optionsFromCategory(PV_CAT.BEFESTIGUNG_PV_MOUNTING)}
          required
          hasError={hasFieldError('Befestigung')}
          placeholder="Befestigung auswählen..."
        />
      </SectionCard>

      {/* Modulklemmen */}
      <SectionCard titleIcon={Plug} title="Modulklemmen">
        <div className="grid grid-cols-2 gap-4">
          <LabeledSelect
            label="Endklemmen"
            value={configuration.modulEndklemmen}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              setConfiguration((p) => ({ ...p, modulEndklemmen: e.target.value }));
              clearFieldError('Endklemmen');
            }}
            options={availableClamps}
            required
            hasError={hasFieldError('Endklemmen')}
            placeholder="Klemme auswählen..."
          />
          <LabeledSelect
            label="Mittelklemmen"
            value={configuration.modulMittelklemmen}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              setConfiguration((p) => ({ ...p, modulMittelklemmen: e.target.value }));
              clearFieldError('Mittelklemmen');
            }}
            options={availableClamps}
            required
            hasError={hasFieldError('Mittelklemmen')}
            placeholder="Klemme auswählen..."
          />
        </div>
      </SectionCard>

      {/* Ziegeldach-spezifische Felder */}
      {configuration.roofType === 'Ziegel' && (
        <SectionCard titleIcon={Home} title="Zusätzlich für Ziegeldach">
          <div className="space-y-4">
            <LabeledSelect
              label="Profile"
              value={configuration.profile}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                setConfiguration((p) => ({ ...p, profile: e.target.value }));
                clearFieldError('Profil');
              }}
              options={availableProfiles}
              required
              hasError={hasFieldError('Profil')}
              placeholder="Profil auswählen..."
            />
            <div className="grid grid-cols-2 gap-4">
              <LabeledSelect
                label="Verbinder"
                value={configuration.verbinder}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                  setConfiguration((p) => ({ ...p, verbinder: e.target.value }));
                  clearFieldError('Verbinder');
                }}
                options={optionsFromCategory(PV_CAT.VERBINDER)}
                required
                hasError={hasFieldError('Verbinder')}
                placeholder="Verbinder auswählen..."
              />
              <LabeledSelect
                label="Endkappen"
                value={configuration.endkappen}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                  setConfiguration((p) => ({ ...p, endkappen: e.target.value }));
                  clearFieldError('Endkappen');
                }}
                options={optionsFromCategory(PV_CAT.ENDKAPPEN)}
                required
                hasError={hasFieldError('Endkappen')}
                placeholder="Endkappen auswählen..."
              />
            </div>
          </div>
        </SectionCard>
      )}

      {/* PV-Stecker */}
      <SectionCard titleIcon={Plug} title="PV‑Stecker">
        <div className="grid grid-cols-2 gap-4">
          <LabeledSelect
            label="PV‑Stecker (Male)"
            value={configuration.pvSteckerMale}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              setConfiguration((p) => ({ ...p, pvSteckerMale: e.target.value }));
              clearFieldError('PV-Stecker Male');
            }}
            options={availableConnectors}
            required
            hasError={hasFieldError('PV-Stecker Male')}
            placeholder="Stecker auswählen..."
          />
          <LabeledSelect
            label="PV‑Stecker (Female)"
            value={configuration.pvSteckerFemale}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              setConfiguration((p) => ({ ...p, pvSteckerFemale: e.target.value }));
              clearFieldError('PV-Stecker Female');
            }}
            options={availableConnectors}
            required
            hasError={hasFieldError('PV-Stecker Female')}
            placeholder="Stecker auswählen..."
          />
        </div>
      </SectionCard>
    </div>
  );
};

export default MountingStep;
