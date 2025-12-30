import React from 'react';
import type { VDEData } from '@components/vde-protocols/VDEProtocolModal/types';
import { MobileSection, MobileCheckboxGroup } from './VDEMobileComponents';

interface VDEMobilePageProps {
  vdeData: VDEData;
  handleVdeDataChange: (field: string, value: unknown) => void;
}

// Wechselstromkreis
const AC_CIRCUIT_ITEMS = [
  { field: 'acSideDisconnection', label: 'Trennvorrichtungen auf AC-Seite vorhanden' },
  { field: 'switchingDevicesConnected', label: 'Trenn-/Schalteinrichtungen: PV an Last-, Netz an Quellen-Seite (712 536.2.2.1)' },
  { field: 'protectionSettingsProgrammed', label: 'Schutzeinstellungen des WR gemaess oertlichen Bestimmungen' }
];

// Aufschriften und Kennzeichnung
const LABELING_ITEMS = [
  { field: 'allCircuitsLabeled', label: 'Alle Stromkreise/Schutzeinrichtungen/Schalter/Klemmen beschriftet' },
  { field: 'dcJunctionBoxesWarning', label: 'DC-Anschlusskaesten mit Warnhinweis (Speisung durch PV, nach Abschaltung ggf. noch Spannung)' },
  { field: 'acMainSwitchLabeled', label: 'AC-Haupttrennschalter deutlich beschriftet' },
  { field: 'dualSupplyWarnings', label: 'Am Zusammenschaltpunkt Warnhinweis Doppelversorgung' },
  { field: 'schematicDiagramOnSite', label: 'Prinzipstromlaufplan vor Ort angebracht' },
  { field: 'protectionSettingsOnSite', label: 'WR-Schutzeinstellungen und Installationsdetails vor Ort' },
  { field: 'emergencyShutdownProcedures', label: 'Verfahren Notabschaltung vor Ort angegeben' },
  { field: 'signsSecurelyAttached', label: 'Zeichen/Aufschriften dauerhaft befestigt' }
];

// Mechanische Installation
const MECHANICAL_ITEMS = [
  { field: 'ventilationBehindPV', label: 'Belueftung hinter PV-Generator (Ueberhitzung/Brand vermeiden)' },
  { field: 'framesCorrosionResistant', label: 'Rahmen/Werkstoffe korrosionsbestaendig' },
  { field: 'framesProperlySecured', label: 'Rahmen ordnungsgemaess befestigt; Dachteile witterungsbestaendig' },
  { field: 'cableRoutingWeatherproof', label: 'Kabelfuehrung witterungsbestaendig' }
];

/**
 * VDEMobilePage3 - Besichtigung Teil 2 (Mobile)
 */
const VDEMobilePage3: React.FC<VDEMobilePageProps> = ({
  vdeData,
  handleVdeDataChange
}) => {
  const handleChange = (field: string, value: boolean) => {
    handleVdeDataChange(field, value);
  };

  return (
    <div className="p-4 space-y-4">
      <MobileSection title="Besondere Faktoren PV-System - Wechselstromkreis">
        <MobileCheckboxGroup
          items={AC_CIRCUIT_ITEMS}
          vdeData={vdeData as unknown as Record<string, unknown>}
          onChange={handleChange}
        />
      </MobileSection>

      <MobileSection title="Aufschriften und Kennzeichnung">
        <MobileCheckboxGroup
          items={LABELING_ITEMS}
          vdeData={vdeData as unknown as Record<string, unknown>}
          onChange={handleChange}
        />
      </MobileSection>

      <MobileSection title="Mechanische Installation">
        <MobileCheckboxGroup
          items={MECHANICAL_ITEMS}
          vdeData={vdeData as unknown as Record<string, unknown>}
          onChange={handleChange}
        />
      </MobileSection>
    </div>
  );
};

export default VDEMobilePage3;
