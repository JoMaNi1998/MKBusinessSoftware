import React from 'react';
import { PageHeader, Section, CheckboxField } from '../components';
import { PageProps, VDEData, CheckboxConfig } from '../types';

const Page3_Besichtigung2 = React.memo(function Page3_Besichtigung2({
  vdeData,
  handleVdeDataChange,
}: PageProps) {
  const acCircuitItems: CheckboxConfig[] = [
    { field: 'acSideDisconnection', label: 'Trennvorrichtungen auf AC-Seite vorhanden' },
    {
      field: 'switchingDevicesConnected',
      label: 'Trenn-/Schalteinrichtungen: PV an Last-, Netz an Quellen-Seite (712 536.2.2.1)',
    },
    {
      field: 'protectionSettingsProgrammed',
      label: 'Schutzeinstellungen des WR gemäß örtlichen Bestimmungen',
    },
  ];

  const labelingItems: CheckboxConfig[] = [
    {
      field: 'allCircuitsLabeled',
      label: 'Alle Stromkreise/Schutzeinrichtungen/Schalter/Klemmen beschriftet',
    },
    {
      field: 'dcJunctionBoxesWarning',
      label:
        'DC-Anschlusskästen mit Warnhinweis (Speisung durch PV, nach Abschaltung ggf. noch Spannung)',
    },
    { field: 'acMainSwitchLabeled', label: 'AC-Haupttrennschalter deutlich beschriftet' },
    {
      field: 'dualSupplyWarnings',
      label: 'Am Zusammenschaltpunkt Warnhinweis Doppelversorgung',
    },
    { field: 'schematicDiagramOnSite', label: 'Prinzipstromlaufplan vor Ort angebracht' },
    {
      field: 'protectionSettingsOnSite',
      label: 'WR-Schutzeinstellungen und Installationsdetails vor Ort',
    },
    {
      field: 'emergencyShutdownProcedures',
      label: 'Verfahren Notabschaltung vor Ort angegeben',
    },
    { field: 'signsSecurelyAttached', label: 'Zeichen/Aufschriften dauerhaft befestigt' },
  ];

  const mechanicalItems: CheckboxConfig[] = [
    {
      field: 'ventilationBehindPV',
      label: 'Belüftung hinter PV-Generator (Überhitzung/Brand vermeiden)',
    },
    { field: 'framesCorrosionResistant', label: 'Rahmen/Werkstoffe korrosionsbeständig' },
    {
      field: 'framesProperlySecured',
      label: 'Rahmen ordnungsgemäß befestigt; Dachteile witterungsbeständig',
    },
    { field: 'cableRoutingWeatherproof', label: 'Kabelführung witterungsbeständig' },
  ];

  return (
    <div
      className="page bg-white p-8 min-h-[297mm] w-[210mm] mx-auto"
      style={{ fontSize: '12px' }}
    >
      <PageHeader
        title="Prüfbericht Besichtigung (2)"
        subtitle="gemäß VDE 0126-23 (DIN EN 62446)"
        customerName={vdeData.projectName || ''}
      />
      <Section title="Besondere Faktoren PV-System – Wechselstromkreis">
        {acCircuitItems.map((item) => (
          <CheckboxField
            key={item.field}
            {...item}
            checked={(vdeData as VDEData)[item.field] as boolean}
            onChange={handleVdeDataChange}
          />
        ))}
      </Section>

      <Section title="Aufschriften und Kennzeichnung des PV-Systems">
        {labelingItems.map((item) => (
          <CheckboxField
            key={item.field}
            {...item}
            checked={(vdeData as VDEData)[item.field] as boolean}
            onChange={handleVdeDataChange}
          />
        ))}
      </Section>

      <Section title="Allgemeine (mechanische) Installation des PV-Systems">
        {mechanicalItems.map((item) => (
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

export default Page3_Besichtigung2;
