/**
 * ElectricalStep - Schritt 5: Elektrische Komponenten
 */

import React, { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { SectionCard, LabeledSelect, LabeledNumber } from '../shared/FormComponents';
import { PV_CAT } from '@utils';
import type { PVConfiguration, PVSelectOption } from '@app-types/components/pvConfigurator.types';

interface ElectricalField {
  key: string;
  label: string;
  category: string;
  errorKey?: string;
}

interface ElectricalStepProps {
  configuration: PVConfiguration;
  setConfiguration: Dispatch<SetStateAction<PVConfiguration>>;
  optionsFromCategory: (category: string) => PVSelectOption[];
  hasFieldError: (field: string) => boolean;
  clearFieldError: (field: string) => void;
}

const ElectricalStep: React.FC<ElectricalStepProps> = ({
  configuration,
  setConfiguration,
  optionsFromCategory,
  hasFieldError,
  clearFieldError,
}) => {
  const electricalFields: ElectricalField[] = [
    { key: 'sls', label: 'SLS', category: PV_CAT.SLS },
    { key: 'tiefenerder', label: 'Tiefenerder', category: PV_CAT.TIEFENERDER },
    { key: 'kombiableiter', label: 'Kombiableiter', category: PV_CAT.KOMBIALEITER },
    { key: 'zaehlerschrank', label: 'Zählerschrank', category: PV_CAT.ZAEHLERSCHRANK },
    { key: 'generatoranschlusskasten', label: 'Generatoranschlusskasten', category: PV_CAT.GENERATORANSCHLUSSKASTEN },
    { key: 'spannungsversorgungAPZ', label: 'Spannungsversorgung APZ', category: PV_CAT.APZ, errorKey: 'SpannungsversorgungAPZ' },
  ];

  return (
    <div className="space-y-6">
      {electricalFields.map(({ key, label, category, errorKey }: ElectricalField) => (
        <SectionCard key={key} title={label}>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <LabeledSelect
                label={label}
                value={configuration[key as keyof PVConfiguration] as string || ''}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                  setConfiguration((p) => ({ ...p, [key]: e.target.value }));
                  clearFieldError(errorKey || label);
                }}
                options={optionsFromCategory(category)}
                placeholder={`${label} auswählen...`}
                hasError={hasFieldError(errorKey || label)}
              />
            </div>
            <LabeledNumber
              label="Anzahl"
              value={configuration[`${key}Qty` as keyof PVConfiguration] as number || 0}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setConfiguration((p) => ({ ...p, [`${key}Qty`]: Math.max(0, parseInt(e.target.value) || 0) }));
                clearFieldError(errorKey || label);
              }}
              min={0}
              hasError={hasFieldError(errorKey || label)}
            />
          </div>
        </SectionCard>
      ))}
    </div>
  );
};

export default ElectricalStep;
