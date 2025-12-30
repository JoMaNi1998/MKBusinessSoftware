import React from 'react';
import type { VDEData } from '@components/vde-protocols/VDEProtocolModal/types';
import { MobileSection, MobileInputField, MobileCheckbox, MobileCheckboxGroup } from './VDEMobileComponents';

interface VDEMobilePageProps {
  vdeData: VDEData;
  handleVdeDataChange: (field: string, value: unknown) => void;
}

// Besichtigen Checkboxen
const INSPECTION_ITEMS = [
  { field: 'selectionOfEquipment', label: 'Auswahl der Betriebsmittel' },
  { field: 'protectionAgainstDirectContact', label: 'Schutz gegen direktes Beruehren' },
  { field: 'cablesLinesbusbars', label: 'Kabel, Leitungen, Stromschienen' },
  { field: 'circuitIdentification', label: 'Kennzeichnung Stromkreis, Betriebsmittel' },
  { field: 'nPeIdentification', label: 'Kennzeichnung N- und PE-Leiter' },
  { field: 'protectionMonitoringDevices', label: 'Schutz- und Ueberwachungseinrichtungen' },
  { field: 'mainEquipotentialBonding', label: 'Hauptpotentialausgleich' },
  { field: 'conductorConnections', label: 'Leiterverbindung' },
  { field: 'isolatingDevices', label: 'Trenn- und Schaltgeraete' }
];

// Erproben Checkboxen
const TEST_ITEMS = [
  { field: 'systemFunctionTest', label: 'Funktionspruefung der Anlage' },
  { field: 'rcdTest', label: 'FI-Schutzschalter (RCD) / wenn vorhanden' }
];

/**
 * VDEMobilePage4 - AC-Seite Pruefbericht (Mobile)
 */
const VDEMobilePage4: React.FC<VDEMobilePageProps> = ({
  vdeData,
  handleVdeDataChange
}) => {
  const handleChange = (field: string, value: boolean) => {
    handleVdeDataChange(field, value);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Pruefung nach */}
      <MobileSection title="Pruefung nach">
        <div className="flex flex-wrap gap-4">
          <MobileCheckbox
            label="DIN VDE 0100-600"
            checked={vdeData.testAccordingVDE0100600}
            onChange={(val) => handleVdeDataChange('testAccordingVDE0100600', val)}
          />
          <MobileCheckbox
            label="DIN VDE 0105-100"
            checked={vdeData.testAccordingVDE0105100}
            onChange={(val) => handleVdeDataChange('testAccordingVDE0105100', val)}
          />
        </div>
      </MobileSection>

      {/* Netzspannung */}
      <MobileSection title="Netzspannung">
        <div className="grid grid-cols-2 gap-3">
          <MobileInputField
            label="Spannung 1 (V)"
            type="number"
            value={vdeData.networkVoltage1}
            onChange={(val) => handleVdeDataChange('networkVoltage1', val)}
            placeholder="230"
          />
          <MobileInputField
            label="Spannung 2 (V)"
            type="number"
            value={vdeData.networkVoltage2}
            onChange={(val) => handleVdeDataChange('networkVoltage2', val)}
            placeholder="400"
          />
        </div>
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Netzform</p>
          <div className="flex flex-wrap gap-3">
            <MobileCheckbox
              label="TN-C"
              checked={vdeData.networkTNC}
              onChange={(val) => handleVdeDataChange('networkTNC', val)}
              small
            />
            <MobileCheckbox
              label="TN-S"
              checked={vdeData.networkTNS}
              onChange={(val) => handleVdeDataChange('networkTNS', val)}
              small
            />
            <MobileCheckbox
              label="TN-C-S"
              checked={vdeData.networkTNCS}
              onChange={(val) => handleVdeDataChange('networkTNCS', val)}
              small
            />
            <MobileCheckbox
              label="TT"
              checked={vdeData.networkTT}
              onChange={(val) => handleVdeDataChange('networkTT', val)}
              small
            />
            <MobileCheckbox
              label="IT"
              checked={vdeData.networkIT}
              onChange={(val) => handleVdeDataChange('networkIT', val)}
              small
            />
          </div>
        </div>
      </MobileSection>

      {/* Besichtigen */}
      <MobileSection title="Besichtigen">
        <MobileCheckboxGroup
          items={INSPECTION_ITEMS}
          vdeData={vdeData as unknown as Record<string, unknown>}
          onChange={handleChange}
        />
      </MobileSection>

      {/* Erproben */}
      <MobileSection title="Erproben">
        <MobileCheckboxGroup
          items={TEST_ITEMS}
          vdeData={vdeData as unknown as Record<string, unknown>}
          onChange={handleChange}
        />
      </MobileSection>

      {/* Messen - Vereinfachte Version fuer Mobile */}
      <MobileSection title="Messen">
        <div className="flex gap-4 mb-3">
          <MobileCheckbox
            label="Ohne Verbraucher"
            checked={vdeData.measurementWithoutLoad}
            onChange={(val) => handleVdeDataChange('measurementWithoutLoad', val)}
          />
          <MobileCheckbox
            label="Mit Verbraucher"
            checked={vdeData.measurementWithLoad}
            onChange={(val) => handleVdeDataChange('measurementWithLoad', val)}
          />
        </div>

        <MobileCheckbox
          label="Durchgaengigkeit Schutzleiter < 1 Ohm"
          checked={vdeData.protectiveConductorContinuity}
          onChange={(val) => handleVdeDataChange('protectiveConductorContinuity', val)}
        />

        <MobileInputField
          label="Erdungswiderstand Re (Ohm)"
          value={vdeData.earthingResistance}
          onChange={(val) => handleVdeDataChange('earthingResistance', val)}
          placeholder="z.B. 2.5"
          className="mt-3"
        />

        {/* AC-Reihen - Erste 6 Reihen fuer Mobile */}
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Stromkreise (erste 6)</p>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg mb-2">
              <p className="text-xs font-medium text-gray-600 mb-2">Zeile {i + 1}</p>
              <div className="grid grid-cols-2 gap-2">
                <MobileInputField
                  label="Nr."
                  value={(vdeData as VDEData)[`ac_row_${i}_nr`] as string}
                  onChange={(val) => handleVdeDataChange(`ac_row_${i}_nr`, val)}
                  placeholder={String(i + 1)}
                />
                <MobileInputField
                  label="Bezeichnung"
                  value={(vdeData as VDEData)[`ac_row_${i}_designation`] as string}
                  onChange={(val) => handleVdeDataChange(`ac_row_${i}_designation`, val)}
                  placeholder="z.B. WR1"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <MobileInputField
                  label="Kabel-Typ"
                  value={(vdeData as VDEData)[`ac_row_${i}_cableType`] as string}
                  onChange={(val) => handleVdeDataChange(`ac_row_${i}_cableType`, val)}
                  placeholder="NYM"
                />
                <MobileInputField
                  label="LS-Art"
                  value={(vdeData as VDEData)[`ac_row_${i}_breakerType`] as string}
                  onChange={(val) => handleVdeDataChange(`ac_row_${i}_breakerType`, val)}
                  placeholder="B"
                />
                <MobileInputField
                  label="In (A)"
                  type="number"
                  value={(vdeData as VDEData)[`ac_row_${i}_breakerCurrent`] as string}
                  onChange={(val) => handleVdeDataChange(`ac_row_${i}_breakerCurrent`, val)}
                  placeholder="16"
                />
              </div>
            </div>
          ))}
        </div>
      </MobileSection>
    </div>
  );
};

export default VDEMobilePage4;
