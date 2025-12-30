import React from 'react';
import type { VDEData } from '@components/vde-protocols/VDEProtocolModal/types';
import { MobileSection, MobileCheckboxGroup } from './VDEMobileComponents';

interface VDEMobilePageProps {
  vdeData: VDEData;
  handleVdeDataChange: (field: string, value: unknown) => void;
}

// Besichtigte Stromkreise
const INSPECTED_CIRCUITS = [
  { field: 'entirePVSystem', label: 'Gesamte Photovoltaikanlage' },
  { field: 'followingCircuits', label: 'Folgende Stromkreise' },
  { field: 'pvSystemInspected', label: 'Besichtigung nach DIN VDE 0100-600' }
];

// Konstruktion und Installation
const CONSTRUCTION_ITEMS = [
  { field: 'dcSystemGeneral', label: 'DC-System nach DIN VDE 0100 / -712 konstruiert, ausgewaehlt und errichtet' },
  { field: 'dcComponentsRated', label: 'DC-Komponenten fuer DC-Betrieb bemessen' },
  { field: 'dcComponentsMaxRated', label: 'Komponenten fuer max. Strom & Spannung bemessen' },
  { field: 'protectionClass2', label: 'Schutz durch Klasse II oder gleichwertige Isolation' },
  { field: 'pvCablesSelected', label: 'PV-Kabel so ausgewaehlt, dass Erd-/Kurzschlussrisiko minimiert ist (712 522.8.1)' },
  { field: 'wiringSystemSelected', label: 'Verdrahtungssystem widersteht aeusseren Einfluessen (712 522.8.3)' },
  { field: 'systemsWithoutOvercurrent', label: 'Ohne Strang-Ueberstromschutz: Strangkabel fuer summierten Fehlerstrom ausgelegt (712 433)' },
  { field: 'acDcCablesSeparated', label: 'AC- und DC-Kabel physikalisch getrennt' },
  { field: 'systemsWithOvercurrent', label: 'Mit Strang-Ueberstromschutz: korrekt festgelegt (712 433.2)' },
  { field: 'dcDisconnectorInstalled', label: 'DC-Lasttrennschalter auf DC-Seite des WR (712 536.2.2)' },
  { field: 'blockingDiodesInstalled', label: 'Sperrdioden: Rueckspannung >= 2x Uo, stc (712 512.1.1)' }
];

// Schutz gegen Ueberspannung
const PROTECTION_ITEMS = [
  { field: 'inverterSimpleSeparation', label: 'Wechselrichter mit einfacher Trennung (AC/DC)' },
  { field: 'alternativeRcdTypeB', label: 'Alternative: RCD Typ B im Kreis (712 413.1.1.1.2)' },
  { field: 'wiringLoopsMinimized', label: 'Verdrahtungsschleifen moeglichst klein (712 54)' },
  { field: 'pvFrameEquipotential', label: 'Rahmen des PV-Generators mit Potentialausgleich' },
  { field: 'equipotentialConductors', label: 'PA-Leiter parallel & nahe an DC-Kabeln' }
];

/**
 * VDEMobilePage2 - Besichtigung Teil 1 (Mobile)
 */
const VDEMobilePage2: React.FC<VDEMobilePageProps> = ({
  vdeData,
  handleVdeDataChange
}) => {
  const handleChange = (field: string, value: boolean) => {
    handleVdeDataChange(field, value);
  };

  return (
    <div className="p-4 space-y-4">
      <MobileSection title="Besichtigte Stromkreise">
        <MobileCheckboxGroup
          items={INSPECTED_CIRCUITS}
          vdeData={vdeData as unknown as Record<string, unknown>}
          onChange={handleChange}
        />
      </MobileSection>

      <MobileSection title="Konstruktion und Installation des PV-Generators">
        <MobileCheckboxGroup
          items={CONSTRUCTION_ITEMS}
          vdeData={vdeData as unknown as Record<string, unknown>}
          onChange={handleChange}
        />
      </MobileSection>

      <MobileSection title="Schutz gegen Ueberspannung / elektrischen Schlag">
        <MobileCheckboxGroup
          items={PROTECTION_ITEMS}
          vdeData={vdeData as unknown as Record<string, unknown>}
          onChange={handleChange}
        />
      </MobileSection>
    </div>
  );
};

export default VDEMobilePage2;
