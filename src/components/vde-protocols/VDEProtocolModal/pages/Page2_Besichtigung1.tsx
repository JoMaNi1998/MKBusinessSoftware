import React from 'react';
import { PageHeader, Section, CheckboxField } from '../components';
import { PAGE2_LIST, PAGE2_CONSTRUCTION } from '../constants';
import { PageProps, VDEData, CheckboxConfig } from '../types';

const Page2_Besichtigung1 = React.memo(function Page2_Besichtigung1({
  vdeData,
  handleVdeDataChange,
}: PageProps) {
  const protectionItems: CheckboxConfig[] = [
    { field: 'inverterSimpleSeparation', label: 'Wechselrichter mit einfacher Trennung (AC/DC)' },
    { field: 'alternativeRcdTypeB', label: 'Alternative: RCD Typ B im Kreis (712 413.1.1.1.2)' },
    { field: 'wiringLoopsMinimized', label: 'Verdrahtungsschleifen möglichst klein (712 54)' },
    { field: 'pvFrameEquipotential', label: 'Rahmen des PV-Generators mit Potentialausgleich' },
    { field: 'equipotentialConductors', label: 'PA-Leiter parallel & nahe an DC-Kabeln' },
  ];

  return (
    <div
      className="page bg-white p-8 min-h-[297mm] w-[210mm] mx-auto"
      style={{ fontSize: '12px' }}
    >
      <PageHeader
        title="Prüfbericht Besichtigung (1)"
        subtitle="gemäß VDE 0126-23 (DIN EN 62446)"
        customerName={vdeData.projectName || ''}
      />
      <Section title="Besichtigte Stromkreise">
        {PAGE2_LIST.map((item) => (
          <CheckboxField
            key={item.field}
            {...item}
            checked={(vdeData as VDEData)[item.field] as boolean}
            onChange={handleVdeDataChange}
          />
        ))}
      </Section>
      <Section title="Konstruktion und Installation des PV-Generators">
        {PAGE2_CONSTRUCTION.map((item) => (
          <CheckboxField
            key={item.field}
            {...item}
            checked={(vdeData as VDEData)[item.field] as boolean}
            onChange={handleVdeDataChange}
          />
        ))}
      </Section>
      <Section title="PV-System / Schutz gegen Überspannung / elektrischen Schlag">
        {protectionItems.map((item) => (
          <CheckboxField
            key={item.field}
            {...item}
            checked={(vdeData as VDEData)[item.field] as boolean}
            onChange={handleVdeDataChange}
          />
        ))}
      </Section>
    </div>
  );
});

export default Page2_Besichtigung1;
