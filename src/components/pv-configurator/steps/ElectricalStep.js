/**
 * ElectricalStep - Schritt 5: Elektrische Komponenten
 */

import React from 'react';
import { SectionCard, LabeledSelect, LabeledNumber } from '../shared/FormComponents';
import { CAT } from '../constants';

const ElectricalStep = ({
  configuration,
  setConfiguration,
  optionsFromCategory,
  hasFieldError,
  clearFieldError,
}) => {
  const electricalFields = [
    { key: 'sls', label: 'SLS', category: CAT.SLS },
    { key: 'tiefenerder', label: 'Tiefenerder', category: CAT.TIEFENERDER },
    { key: 'kombiableiter', label: 'Kombiableiter', category: CAT.KOMBIALEITER },
    { key: 'zaehlerschrank', label: 'Zählerschrank', category: CAT.ZAEHLERSCHRANK },
    { key: 'generatoranschlusskasten', label: 'Generatoranschlusskasten', category: CAT.GENERATORANSCHLUSSKASTEN },
    { key: 'spannungsversorgungAPZ', label: 'Spannungsversorgung APZ', category: CAT.APZ, errorKey: 'SpannungsversorgungAPZ' },
  ];

  return (
    <div className="space-y-6">
      {electricalFields.map(({ key, label, category, errorKey }) => (
        <SectionCard key={key} title={label}>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <LabeledSelect
                label={label}
                value={configuration[key]}
                onChange={(e) => {
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
              value={configuration[`${key}Qty`]}
              onChange={(e) => {
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
