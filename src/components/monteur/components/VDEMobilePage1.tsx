import React from 'react';
import type { VDEData } from '@components/vde-protocols/VDEProtocolModal/types';
import { MobileInputField, MobileCheckbox, MobileSection } from './VDEMobileComponents';

interface VDEMobilePageProps {
  vdeData: VDEData;
  handleVdeDataChange: (field: string, value: unknown) => void;
}

/**
 * VDEMobilePage1 - Anlagenuebersicht (Mobile)
 */
const VDEMobilePage1: React.FC<VDEMobilePageProps> = ({
  vdeData,
  handleVdeDataChange
}) => {
  return (
    <div className="p-4 space-y-4">
      {/* Pruefer & Standort */}
      <MobileSection title="Pruefer & Standort">
        <MobileInputField
          label="Pruefer Name"
          value={vdeData.inspectorName}
          onChange={(val) => handleVdeDataChange('inspectorName', val)}
          placeholder="Name des Pruefers"
        />
        <MobileInputField
          label="Anlagenstandort"
          value={vdeData.address}
          onChange={(val) => handleVdeDataChange('address', val)}
          placeholder="Adresse der Anlage"
        />
      </MobileSection>

      {/* PV-Module */}
      <MobileSection title="PV-Module">
        <div className="grid grid-cols-2 gap-3">
          <MobileInputField
            label="Anzahl"
            type="number"
            value={vdeData.moduleCount}
            onChange={(val) => handleVdeDataChange('moduleCount', val)}
            placeholder="0"
          />
          <MobileInputField
            label="Leistung (kWp)"
            type="number"
            value={vdeData.installedPower}
            onChange={(val) => handleVdeDataChange('installedPower', val)}
            placeholder="0.00"
          />
        </div>
        <MobileInputField
          label="Modul-Typ"
          value={vdeData.moduleType}
          onChange={(val) => handleVdeDataChange('moduleType', val)}
          placeholder="z.B. JA Solar JAM54S30-410/MR"
        />
        <div className="grid grid-cols-2 gap-3">
          <MobileInputField
            label="Pmax DC (Wp)"
            type="number"
            value={vdeData.modulePmaxDC}
            onChange={(val) => handleVdeDataChange('modulePmaxDC', val)}
            placeholder="0"
          />
          <MobileInputField
            label="Uoc (V)"
            type="number"
            value={vdeData.moduleUoc}
            onChange={(val) => handleVdeDataChange('moduleUoc', val)}
            placeholder="0"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MobileInputField
            label="Isc (A)"
            type="number"
            value={vdeData.moduleIsc}
            onChange={(val) => handleVdeDataChange('moduleIsc', val)}
            placeholder="0"
          />
          <MobileInputField
            label="Umpp (V)"
            type="number"
            value={vdeData.moduleUmpp}
            onChange={(val) => handleVdeDataChange('moduleUmpp', val)}
            placeholder="0"
          />
        </div>
      </MobileSection>

      {/* Wechselrichter */}
      <MobileSection title="Wechselrichter">
        <MobileInputField
          label="Anzahl"
          type="number"
          value={vdeData.inverterCount}
          onChange={(val) => handleVdeDataChange('inverterCount', val)}
          placeholder="0"
        />
        {/* Wechselrichter 1 */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-500 mb-2">Wechselrichter 1</p>
          <MobileInputField
            label="Typ"
            value={(vdeData as VDEData)['inverterType1'] as string}
            onChange={(val) => handleVdeDataChange('inverterType1', val)}
            placeholder="z.B. Huawei SUN2000-10KTL-M1"
          />
          <div className="grid grid-cols-3 gap-2 mt-2">
            <MobileInputField
              label="Pmax DC"
              type="number"
              value={(vdeData as VDEData)['inverterPmaxDC1'] as string}
              onChange={(val) => handleVdeDataChange('inverterPmaxDC1', val)}
              placeholder="W"
            />
            <MobileInputField
              label="Pnom AC"
              type="number"
              value={(vdeData as VDEData)['inverterPnomAC1'] as string}
              onChange={(val) => handleVdeDataChange('inverterPnomAC1', val)}
              placeholder="W"
            />
            <MobileInputField
              label="Pmax AC"
              type="number"
              value={(vdeData as VDEData)['inverterPmaxAC1'] as string}
              onChange={(val) => handleVdeDataChange('inverterPmaxAC1', val)}
              placeholder="VA"
            />
          </div>
        </div>
        {/* Wechselrichter 2 */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-500 mb-2">Wechselrichter 2 (optional)</p>
          <MobileInputField
            label="Typ"
            value={(vdeData as VDEData)['inverterType2'] as string}
            onChange={(val) => handleVdeDataChange('inverterType2', val)}
            placeholder="z.B. Huawei SUN2000-10KTL-M1"
          />
          <div className="grid grid-cols-3 gap-2 mt-2">
            <MobileInputField
              label="Pmax DC"
              type="number"
              value={(vdeData as VDEData)['inverterPmaxDC2'] as string}
              onChange={(val) => handleVdeDataChange('inverterPmaxDC2', val)}
              placeholder="W"
            />
            <MobileInputField
              label="Pnom AC"
              type="number"
              value={(vdeData as VDEData)['inverterPnomAC2'] as string}
              onChange={(val) => handleVdeDataChange('inverterPnomAC2', val)}
              placeholder="W"
            />
            <MobileInputField
              label="Pmax AC"
              type="number"
              value={(vdeData as VDEData)['inverterPmaxAC2'] as string}
              onChange={(val) => handleVdeDataChange('inverterPmaxAC2', val)}
              placeholder="VA"
            />
          </div>
        </div>
      </MobileSection>

      {/* Zaehler */}
      <MobileSection title="Einspeise-Stromzaehler">
        <MobileInputField
          label="Datum Inbetriebnahme"
          type="date"
          value={vdeData.commissioningDate}
          onChange={(val) => handleVdeDataChange('commissioningDate', val)}
        />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <MobileInputField
            label="Zaehler 1 Nr."
            value={(vdeData as VDEData)['meterNumber1'] as string}
            onChange={(val) => handleVdeDataChange('meterNumber1', val)}
            placeholder="Zaehler-Nr."
          />
          <MobileInputField
            label="Zaehlerstand 1"
            value={(vdeData as VDEData)['meterReading1'] as string}
            onChange={(val) => handleVdeDataChange('meterReading1', val)}
            placeholder="kWh"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <MobileInputField
            label="Zaehler 2 Nr."
            value={(vdeData as VDEData)['meterNumber2'] as string}
            onChange={(val) => handleVdeDataChange('meterNumber2', val)}
            placeholder="Zaehler-Nr."
          />
          <MobileInputField
            label="Zaehlerstand 2"
            value={(vdeData as VDEData)['meterReading2'] as string}
            onChange={(val) => handleVdeDataChange('meterReading2', val)}
            placeholder="kWh"
          />
        </div>
      </MobileSection>

      {/* Pruefung */}
      <MobileSection title="Pruefung">
        <MobileInputField
          label="Pruefgeraete"
          value={vdeData.testEquipment}
          onChange={(val) => handleVdeDataChange('testEquipment', val)}
          placeholder="z.B. Benning IT130..."
        />
        <div className="flex gap-4 mt-3">
          <MobileCheckbox
            label="Erstpruefung"
            checked={vdeData.initialTest}
            onChange={(val) => handleVdeDataChange('initialTest', val)}
          />
          <MobileCheckbox
            label="Wiederholungspruefung"
            checked={vdeData.repeatTest}
            onChange={(val) => handleVdeDataChange('repeatTest', val)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <MobileInputField
            label="Datum der Pruefung"
            type="date"
            value={vdeData.testDate}
            onChange={(val) => handleVdeDataChange('testDate', val)}
          />
          <MobileInputField
            label="Naechster Prueftermin"
            type="date"
            value={vdeData.nextTestDate}
            onChange={(val) => handleVdeDataChange('nextTestDate', val)}
          />
        </div>
      </MobileSection>

      {/* Ergebnis */}
      <MobileSection title="Pruefergebnis">
        <MobileCheckbox
          label="Es wurden keine Maengel festgestellt"
          checked={vdeData.noDefectsFound}
          onChange={(val) => handleVdeDataChange('noDefectsFound', val)}
        />
        <MobileCheckbox
          label="Die PV-Anlage entspricht den anerkannten Regeln der Elektrotechnik"
          checked={vdeData.compliesWithStandards}
          onChange={(val) => handleVdeDataChange('compliesWithStandards', val)}
        />
        <MobileInputField
          label="Ort/Datum"
          value={vdeData.locationDate}
          onChange={(val) => handleVdeDataChange('locationDate', val)}
          placeholder="z.B. Muenchen, 15.01.2025"
          className="mt-3"
        />
      </MobileSection>
    </div>
  );
};

export default VDEMobilePage1;
