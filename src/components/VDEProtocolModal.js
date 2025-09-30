import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, FileText, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMaterials } from '../context/MaterialContext';
import { useNotification } from '../context/NotificationContext';
import { FirebaseService } from '../services/firebaseService';

/** =========================================================================
 *  ZENTRALE SPEZIFIKATIONS-IDs (eine Quelle der Wahrheit)
 *  ========================================================================= */
const SPEC = {
  MODULE: {
    PMAX_DC: 'l5YKWiis3xv1nM5BAawD',
    UOC:     'YuqUNbkdBZqpeLdqfLWP',
    ISC:     'u41eflH6Ak3AOUMueySE',
    UMPP:    'Irsy90GsYpb5t0IMEo8q',
  },
  INV: {
    ISO_MON: 'gSFt9cxxbLKMFzgmfMGp',
    SPD_DC:  'QaoagxVWqsGmDB5jQ5yQ',
    SPD_AC:  'SMVHZ0IEKCd2rtmzf75d',
    RCM:     'O3cfxHm1deuw6PwrZdDb',
    AC_OC:   'R7THqMHCNV2PN1GFs5c3',
    AC_SC:   '2pYLbsyV2M0bG5snzDsy',
    AFCI:    'P9e994aQn34DacV5jnN3',

    PMAX_DC: 'nYZpbMVkT7GTzgBJuPTo',
    PNOM_AC: '0dytwvoi0zhNVpYhifa0',
    PMAX_AC: '8OGt81iqbClXYtLqXVHy',
  },
  GAK: {
    SPD_TYPE:        'VWQS3uZfdtDsbuFz1GCl',
    RATED_CURRENT:   'lHavHHgqgUnqhGFSMAlx',
    RATED_VOLTAGE:   'BavUAeJxUeOi9dnVjt2p',
  },
  WIRING: {
    WIRING_TYPE:     'be3CMLpLw9QncaZu8uRw',
    PHASE_LEADER:    'LzWhwzGGkxryk7Jyot5B',
    EARTH_LEADER:    'wuKlDRXKCpFu2gTO58CQ',
  },
};

/** =========================================================================
 *  UTILITIES
 *  ========================================================================= */
const toNum = (v) => {
  if (v == null) return '';
  const s = String(v).replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? s : '';
};

const findMaterialById = (materials, id) =>
  Array.isArray(materials) ? materials.find((m) => m.id === id) : undefined;

const readSpecRaw = (materials, materialID, specId) => {
  const mat = findMaterialById(materials, materialID);
  return mat?.specifications?.[specId];
};
const readSpec = (materials, materialID, specId) => toNum(readSpecRaw(materials, materialID, specId));

const getModuleSpec = (vdeData, specId) => {
  const modID = vdeData?.projectConfig?.modules?.materialID;
  if (!modID) return '';
  return readSpec(vdeData.materials, modID, specId);
};

const getInverterSpec = (vdeData, inverterMaterialID, specId) => {
  if (!inverterMaterialID) return '';
  return readSpec(vdeData.materials, inverterMaterialID, specId);
};

/** Kleine Helper zur Reduktion redundanter Logik (AC-Messtabelle) */
const getAutoAcRowDefaults = (vdeData, rowIndex) => {
  let auto = {
    nr: '', designation: '', cableType: '', cableInfo: '',
    breakerType: '', breakerCurrent: '', rcdIn: '', rcdIdn: ''
  };

  const mats = vdeData.materials;
  const cfg = vdeData.projectConfig || {};
  const inverters = cfg.inverters || [];
  const invCount = inverters.length;

  // WR-Reihe
  if (rowIndex < invCount) {
    const inv = inverters[rowIndex];
    auto.nr = String(rowIndex + 1);
    auto.designation = `${inv?.description || 'WR'}_${rowIndex}`;
    // Kabel
    if (inv?.recommendedCable && mats) {
      const cab = mats.find((m) => m.id === inv.recommendedCable);
      const s = cab?.specifications || {};
      const n = s['hRDtjnTqWu1tuPhqg1Ql'] || '';
      const a = s['qZP1lmJFLNXMyd9pYvcw'] || '';
      const t = s['Yn0WBipreNBAZnaZWWJX'] || '';
      auto.cableType = t || '';
      auto.cableInfo = n && a ? `${n} x ${a}` : '';
    }
    // Schutz
    if (inv?.recommendedBreaker && mats) {
      const br = mats.find((m) => m.id === inv.recommendedBreaker);
      const s = br?.specifications || {};
      auto.breakerType = s['r2lRsnr7SZ5xxGzmcLts'] || '';
      auto.breakerCurrent = s['55ZFekLPfQThKJO0xwFn'] || '';
    }
    return auto;
  }

  // Wallbox‑Reihe(n)
  if (cfg.wallbox) {
    const start = invCount;
    const qty = cfg.wallbox.quantity || 1;
    const end = start + qty;
    if (rowIndex >= start && rowIndex < end) {
      const wbIndex = rowIndex - start;
      const wb = cfg.wallbox;
      auto.nr = String(rowIndex + 1);
      auto.designation = `${wb?.description || 'Wallbox'}_${wbIndex}`;

      if (wb?.recommendedCable && mats) {
        const cab = mats.find((m) => m.id === wb.recommendedCable);
        const s = cab?.specifications || {};
        const n = s['hRDtjnTqWu1tuPhqg1Ql'] || '';
        const a = s['qZP1lmJFLNXMyd9pYvcw'] || '';
        const t = s['Yn0WBipreNBAZnaZWWJX'] || '';
        auto.cableType = t || '';
        auto.cableInfo = n && a ? `${n} x ${a}` : '';
      }
      if (wb?.recommendedBreaker && mats) {
        const br = mats.find((m) => m.id === wb.recommendedBreaker);
        const s = br?.specifications || {};
        auto.breakerType = s['r2lRsnr7SZ5xxGzmcLts'] || '';
        auto.breakerCurrent = s['55ZFekLPfQThKJO0xwFn'] || '';
      }
      if (wb?.recommendedRCD && mats) {
        const rcd = mats.find((m) => m.id === wb.recommendedRCD);
        const s = rcd?.specifications || {};
        auto.rcdIn = s['xeEG32si5hPDky1bsavj'] || '';
        auto.rcdIdn = s['CAwoyaTvY5SyVGTJPHN9'] || '';
      }
      return auto;
    }
  }
  return auto;
};

/** =========================================================================
 *  GEMEINSAME UI-Bausteine
 *  ========================================================================= */
const PageHeader = React.memo(function PageHeader({ title, subtitle, customerName }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold mb-1">{title}</h1>
      {subtitle && <p className="text-sm mb-2">{subtitle}</p>}
      {customerName ? (
        <div className="text-sm border-b border-gray-300 pb-1">
          <span className="font-medium">Kunde:&nbsp;</span>
          {customerName}
        </div>
      ) : null}
    </div>
  );
});

const Section = React.memo(function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h3 className="font-bold mb-3 pb-2 border-b-2 border-gray-800">{title}</h3>
      {children}
    </div>
  );
});

const CheckboxField = React.memo(function CheckboxField({ field, label, checked, onChange, small = false }) {
  return (
    <label className={`flex items-start ${small ? 'mb-1' : 'mb-2'}`}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(field, e.target.checked)}
        className={`${small ? 'mr-2' : 'mt-1 mr-3'} flex-shrink-0`}
      />
      <span className={small ? 'text-xs' : 'text-sm'}>{label}</span>
    </label>
  );
});

const InputField = React.memo(function InputField({
  type = 'text',
  value,
  onChange,
  placeholder = '',
  className = '',
  align = 'left',
}) {
  const base = 'border-b border-gray-400 bg-transparent';
  const alignCls = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${base} ${alignCls} ${className}`}
    />
  );
});

/** =========================================================================
 *  SEITE 1: Anlagenübersicht
 *  ========================================================================= */
const Page1_Anlagenuebersicht = React.memo(function Page1_Anlagenuebersicht({ vdeData, handleVdeDataChange }) {
  return (
    <div className="page bg-white p-8 min-h-[297mm] w-[210mm] mx-auto" style={{ fontSize: '12px' }}>
      <div className="text-left mb-2">
        <h1 className="text-xl font-bold mb-4">Anlagenübersicht</h1>
        <div className="text-lg font-semibold border-b border-gray-400 pb-1">{vdeData.projectName || ''}</div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-8">
        <div>
          <h3 className="font-bold mb-2">Prüfer</h3>
          <div className="flex">
            <span className="w-20">Name:</span>
            <InputField
              value={vdeData.inspectorName}
              onChange={(val) => handleVdeDataChange('inspectorName', val)}
              className="flex-1"
            />
          </div>
        </div>
        <div>
          <h3 className="font-bold mb-2">Anlagenstandort</h3>
          <div className="flex">
            <span className="w-20">Adresse</span>
            <InputField
              value={vdeData.address}
              onChange={(val) => handleVdeDataChange('address', val)}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-8">
        <div>
        

<h3 className="font-bold mb-2">PV-Module</h3>
          <div className="flex">
            <span className="w-20">Anzahl</span>
            <InputField
              type="number"
              value={vdeData.moduleCount}
              onChange={(val) => handleVdeDataChange('moduleCount', val)}
              className="w-16 text-center"
            />
          </div>
        </div>
        <div>
        <h3 className="font-bold mb-2">Leistung</h3>
          <div className="flex">
            <span className="w-40">Installierte Leistung (kWp)</span>
            <InputField
              type="number"
              value={vdeData.installedPower}
              onChange={(val) => handleVdeDataChange('installedPower', val)}
              className="w-24 text-center"
            />
          </div>
        </div>
      </div>

      {/* PV-Module Tabelle */}
      <div className="mb-8">
        <table className="w-full border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left">Typ</th>
              <th className="border border-gray-400 p-2 text-left">Pmax DC (Wp)</th>
              <th className="border border-gray-400 p-2 text-left">Uoc (V)</th>
              <th className="border border-gray-400 p-2 text-left">Isc (A)</th>
              <th className="border border-gray-400 p-2 text-left">Umpp (V)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 p-2">
                <InputField
                  value={vdeData.moduleType}
                  onChange={(val) => handleVdeDataChange('moduleType', val)}
                  className="w-full"
                />
              </td>
              <td className="border border-gray-400 p-2">
                <InputField
                  type="number"
                  value={vdeData.modulePmaxDC}
                  onChange={(val) => handleVdeDataChange('modulePmaxDC', val)}
                  className="w-full text-center"
                />
              </td>
              <td className="border border-gray-400 p-2">
                <InputField
                  type="number"
                  value={vdeData.moduleUoc}
                  onChange={(val) => handleVdeDataChange('moduleUoc', val)}
                  className="w-full text-center"
                />
              </td>
              <td className="border border-gray-400 p-2">
                <InputField
                  type="number"
                  value={vdeData.moduleIsc}
                  onChange={(val) => handleVdeDataChange('moduleIsc', val)}
                  className="w-full text-center"
                />
              </td>
              <td className="border border-gray-400 p-2">
                <InputField
                  type="number"
                  value={vdeData.moduleUmpp}
                  onChange={(val) => handleVdeDataChange('moduleUmpp', val)}
                  className="w-full text-center"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Wechselrichter */}
      <div className="mb-8">
        <h3 className="font-bold mb-2">PV‑Wechselrichter</h3>
        <div className="flex mb-2">
          <span className="w-20">Anzahl</span>
          <InputField
            type="number"
            value={vdeData.inverterCount}
            onChange={(val) => handleVdeDataChange('inverterCount', val)}
            className="w-16 text-center"
          />
        </div>

        <table className="w-full border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-left">Typ</th>
              <th className="border border-gray-400 p-2 text-left">Pmax DC (Wp)</th>
              <th className="border border-gray-400 p-2 text-left">Pnom AC (W)</th>
              <th className="border border-gray-400 p-2 text-left">Pmax AC (VA)</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 3 }, (_, i) => (
              <tr key={i}>
                <td className="border border-gray-400 p-2">
                  <InputField
                    value={vdeData[`inverterType${i + 1}`]}
                    onChange={(val) => handleVdeDataChange(`inverterType${i + 1}`, val)}
                    className="w-full"
                  />
                </td>
                <td className="border border-gray-400 p-2">
                  <InputField
                    type="number"
                    value={vdeData[`inverterPmaxDC${i + 1}`]}
                    onChange={(val) => handleVdeDataChange(`inverterPmaxDC${i + 1}`, val)}
                    className="w-full text-center"
                  />
                </td>
                <td className="border border-gray-400 p-2">
                  <InputField
                    type="number"
                    value={vdeData[`inverterPnomAC${i + 1}`]}
                    onChange={(val) => handleVdeDataChange(`inverterPnomAC${i + 1}`, val)}
                    className="w-full text-center"
                  />
                </td>
                <td className="border border-gray-400 p-2">
                  <InputField
                    type="number"
                    value={vdeData[`inverterPmaxAC${i + 1}`]}
                    onChange={(val) => handleVdeDataChange(`inverterPmaxAC${i + 1}`, val)}
                    className="w-full text-center"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Zähler + Prüfergebnis */}
      <div className="mb-8">
        <h3 className="font-bold mb-4">Einspeise‑Stromzähler</h3>
        <div className="flex mb-4">
          <span className="w-40">Datum Inbetriebnahme:</span>
          <InputField
            type="date"
            value={vdeData.commissioningDate}
            onChange={(val) => handleVdeDataChange('commissioningDate', val)}
            className="flex-1"
          />
        </div>

        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="grid grid-cols-2 gap-8 mb-4">
            <div className="flex">
              <span className="w-36">Stromzähler {i + 1} Nr.:</span>
              <InputField
                value={vdeData[`meterNumber${i + 1}`]}
                onChange={(val) => handleVdeDataChange(`meterNumber${i + 1}`, val)}
                className="flex-1"
              />
            </div>
            <div className="flex">
              <span className="w-36">Zählerstand {i + 1}:</span>
              <InputField
                value={vdeData[`meterReading${i + 1}`]}
                onChange={(val) => handleVdeDataChange(`meterReading${i + 1}`, val)}
                className="flex-1"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h3 className="font-bold mb-4">Konstruktion, Aufbau, Besichtigung sowie Prüfung</h3>
        <p className="mb-4 text-sm">
          Ich/Wir bestätigen, dass alle Arbeiten fachgerecht und nach bestem Wissen ausgeführt wurden.
        </p>
        <div className="mb-4 flex">
          <span className="w-28">Prüfgeräte:</span>
          <InputField
            value={vdeData.testEquipment}
            onChange={(val) => handleVdeDataChange('testEquipment', val)}
            className="flex-1"
            placeholder="Benning IT130 ... / PV2 ... / SUN2 ..."
          />
        </div>

        <div className="grid grid-cols-2 gap-8 mb-4">
          <CheckboxField field="initialTest" label="Erstprüfung" checked={vdeData.initialTest} onChange={handleVdeDataChange} />
          <CheckboxField field="repeatTest" label="Wiederholungsprüfung" checked={vdeData.repeatTest} onChange={handleVdeDataChange} />
        </div>

        <div className="grid grid-cols-2 gap-8 mb-4">
          <div className="flex">
            <span className="w-36">Datum der Prüfung:</span>
            <InputField type="date" value={vdeData.testDate} onChange={(val) => handleVdeDataChange('testDate', val)} className="flex-1" />
          </div>
          <div className="flex">
            <span className="w-36">Nächster Prüftermin:</span>
            <InputField type="date" value={vdeData.nextTestDate} onChange={(val) => handleVdeDataChange('nextTestDate', val)} className="flex-1" />
          </div>
        </div>

        <div className="space-y-2">
          <CheckboxField field="noDefectsFound" label="Es wurden keine Mängel festgestellt" checked={vdeData.noDefectsFound} onChange={handleVdeDataChange} />
          <CheckboxField
            field="compliesWithStandards"
            label="Die PV‑Anlage entspricht den anerkannten Regeln der Elektrotechnik"
            checked={vdeData.compliesWithStandards}
            onChange={handleVdeDataChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-8 mt-8">
          <div className="flex">
            <span className="w-28">Ort/Datum:</span>
            <InputField value={vdeData.locationDate} onChange={(val) => handleVdeDataChange('locationDate', val)} className="flex-1" />
          </div>
          <div className="flex">
            <span className="w-40">Unterschrift/Prüfer:</span>
            <InputField value={vdeData.inspectorSignature} onChange={(val) => handleVdeDataChange('inspectorSignature', val)} className="flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
});

/** =========================================================================
 *  SEITE 2/3: Besichtigung
 *  ========================================================================= */
const PAGE2_LIST = [
  { field: 'entirePVSystem', label: 'Gesamte Photovoltaikanlage:' },
  { field: 'followingCircuits', label: 'Folgende Stromkreise:' },
  { field: 'pvSystemInspected', label: 'Besichtigung nach DIN VDE 0100-600 (IEC 60364-6)' },
];

const PAGE2_CONSTRUCTION = [
  { field: 'dcSystemGeneral', label: 'Gleichstromsystem nach DIN VDE 0100 / -712 konstruiert, ausgewählt und errichtet' },
  { field: 'dcComponentsRated', label: 'Gleichstromkomponenten für DC-Betrieb bemessen' },
  { field: 'dcComponentsMaxRated', label: 'Komponenten für max. Strom & Spannung bemessen' },
  { field: 'protectionClass2', label: 'Schutz durch Klasse II oder gleichwertige Isolation' },
  { field: 'pvCablesSelected', label: 'PV-Kabel so ausgewählt, dass Erd-/Kurzschlussrisiko minimiert ist (712 522.8.1)' },
  { field: 'wiringSystemSelected', label: 'Verdrahtungssystem widersteht äußeren Einflüssen (712 522.8.3)' },
  { field: 'systemsWithoutOvercurrent', label: 'Ohne Strang‑Überstromschutz: Strangkabel für summierten Fehlerstrom ausgelegt (712 433)' },
  { field: 'acDcCablesSeparated', label: 'AC- und DC‑Kabel physikalisch getrennt' },
  { field: 'systemsWithOvercurrent', label: 'Mit Strang‑Überstromschutz: korrekt festgelegt (712 433.2)' },
  { field: 'dcDisconnectorInstalled', label: 'DC‑Lasttrennschalter auf DC‑Seite des WR (712 536.2.2)' },
  { field: 'blockingDiodesInstalled', label: 'Sperrdioden: Rückspannung ≥ 2×Uo, stc (712 512.1.1)' },
];

const Page2_Besichtigung1 = React.memo(function Page2_Besichtigung1({ vdeData, handleVdeDataChange }) {
  return (
    <div className="page bg-white p-8 min-h-[297mm] w-[210mm] mx-auto" style={{ fontSize: '12px' }}>
      <PageHeader title="Prüfbericht Besichtigung (1)" subtitle="gemäß VDE 0126‑23 (DIN EN 62446)" customerName={vdeData.projectName || ''} />
      <Section title="Besichtigte Stromkreise">
        {PAGE2_LIST.map((item) => (
          <CheckboxField key={item.field} {...item} checked={vdeData[item.field]} onChange={handleVdeDataChange} />
        ))}
      </Section>
      <Section title="Konstruktion und Installation des PV‑Generators">
        {PAGE2_CONSTRUCTION.map((item) => (
          <CheckboxField key={item.field} {...item} checked={vdeData[item.field]} onChange={handleVdeDataChange} />
        ))}
      </Section>
      <Section title="PV‑System / Schutz gegen Überspannung / elektrischen Schlag">
        {[
          { field: 'inverterSimpleSeparation', label: 'Wechselrichter mit einfacher Trennung (AC/DC)' },
          { field: 'alternativeRcdTypeB', label: 'Alternative: RCD Typ B im Kreis (712 413.1.1.1.2)' },
          { field: 'wiringLoopsMinimized', label: 'Verdrahtungsschleifen möglichst klein (712 54)' },
          { field: 'pvFrameEquipotential', label: 'Rahmen des PV‑Generators mit Potentialausgleich' },
          { field: 'equipotentialConductors', label: 'PA‑Leiter parallel & nahe an DC‑Kabeln' },
        ].map((item) => (
          <CheckboxField key={item.field} {...item} checked={vdeData[item.field]} onChange={handleVdeDataChange} />
        ))}
      </Section>
    </div>
  );
});

const Page3_Besichtigung2 = React.memo(function Page3_Besichtigung2({ vdeData, handleVdeDataChange }) {
  return (
    <div className="page bg-white p-8 min-h-[297mm] w-[210mm] mx-auto" style={{ fontSize: '12px' }}>
      <PageHeader title="Prüfbericht Besichtigung (2)" subtitle="gemäß VDE 0126‑23 (DIN EN 62446)" customerName={vdeData.projectName || ''} />
      <Section title="Besondere Faktoren PV‑System – Wechselstromkreis">
        {[
          { field: 'acSideDisconnection', label: 'Trennvorrichtungen auf AC‑Seite vorhanden' },
          { field: 'switchingDevicesConnected', label: 'Trenn-/Schalteinrichtungen: PV an Last‑, Netz an Quellen‑Seite (712 536.2.2.1)' },
          { field: 'protectionSettingsProgrammed', label: 'Schutzeinstellungen des WR gemäß örtlichen Bestimmungen' },
        ].map((item) => (
          <CheckboxField key={item.field} {...item} checked={vdeData[item.field]} onChange={handleVdeDataChange} />
        ))}
      </Section>

      <Section title="Aufschriften und Kennzeichnung des PV‑Systems">
        {[
          { field: 'allCircuitsLabeled', label: 'Alle Stromkreise/Schutzeinrichtungen/Schalter/Klemmen beschriftet' },
          { field: 'dcJunctionBoxesWarning', label: 'DC‑Anschlusskästen mit Warnhinweis (Speisung durch PV, nach Abschaltung ggf. noch Spannung)' },
          { field: 'acMainSwitchLabeled', label: 'AC‑Haupttrennschalter deutlich beschriftet' },
          { field: 'dualSupplyWarnings', label: 'Am Zusammenschaltpunkt Warnhinweis Doppelversorgung' },
          { field: 'schematicDiagramOnSite', label: 'Prinzipstromlaufplan vor Ort angebracht' },
          { field: 'protectionSettingsOnSite', label: 'WR‑Schutzeinstellungen und Installationsdetails vor Ort' },
          { field: 'emergencyShutdownProcedures', label: 'Verfahren Notabschaltung vor Ort angegeben' },
          { field: 'signsSecurelyAttached', label: 'Zeichen/Aufschriften dauerhaft befestigt' },
        ].map((item) => (
          <CheckboxField key={item.field} {...item} checked={vdeData[item.field]} onChange={handleVdeDataChange} />
        ))}
      </Section>

      <Section title="Allgemeine (mechanische) Installation des PV‑Systems">
        {[
          { field: 'ventilationBehindPV', label: 'Belüftung hinter PV‑Generator (Überhitzung/Brand vermeiden)' },
          { field: 'framesCorrosionResistant', label: 'Rahmen/Werkstoffe korrosionsbeständig' },
          { field: 'framesProperlySecured', label: 'Rahmen ordnungsgemäß befestigt; Dachteile witterungsbeständig' },
          { field: 'cableRoutingWeatherproof', label: 'Kabelführung witterungsbeständig' },
        ].map((item) => (
          <CheckboxField key={item.field} {...item} checked={vdeData[item.field]} onChange={handleVdeDataChange} />
        ))}
      </Section>
    </div>
  );
});

/** =========================================================================
 *  SEITE 4: AC-Seite Prüfbericht
 *  ========================================================================= */
const Page4_ACSeitePruefbericht = React.memo(function Page4_ACSeitePruefbericht({ vdeData, handleVdeDataChange }) {
  return (
    <div className="page bg-white p-6 min-h-[297mm] w-[210mm] mx-auto" style={{ fontSize: '10px' }}>
      <PageHeader
        title="Prüfbericht der elektrischen Prüfung der AC‑Seite der PV‑Anlage"
        subtitle="gemäß ZVEH‑Vorlage"
        customerName={vdeData.projectName || ''}
      />

      <div className="mb-4">
        <div className="flex items-center mb-2">
          <span className="font-bold mr-4">Prüfung nach:</span>
          <CheckboxField small field="testAccordingVDE0100600" label="DIN VDE 0100‑600" checked={vdeData.testAccordingVDE0100600} onChange={handleVdeDataChange} />
          <div className="w-3" />
          <CheckboxField small field="testAccordingVDE0105100" label="DIN VDE 0105‑100" checked={vdeData.testAccordingVDE0105100} onChange={handleVdeDataChange} />
        </div>

        <div className="flex items-center mb-2">
          <span className="font-bold mr-4">Netz</span>
          <InputField type="number" value={vdeData.networkVoltage1 ?? 230} onChange={(val) => handleVdeDataChange('networkVoltage1', val)} className="w-12 px-1 mr-1 text-xs" />
          <span className="mr-2">/</span>
          <InputField type="number" value={vdeData.networkVoltage2 ?? 400} onChange={(val) => handleVdeDataChange('networkVoltage2', val)} className="w-12 px-1 mr-2 text-xs" />
          <span className="mr-4">V</span>

          <div className="flex items-center space-x-4">
            {['TNC', 'TNS', 'TNCS', 'TT', 'IT'].map((tn) => (
              <CheckboxField
                key={tn}
                small
                field={`network${tn}`}
                label={tn.replace('TNCS', 'TN-C-S').replace('TNC', 'TN-C').replace('TNS', 'TN-S')}
                checked={vdeData[`network${tn}`]}
                onChange={handleVdeDataChange}
              />
            ))}
          </div>
        </div>
      </div>

      <Section title="Besichtigen">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <CheckboxField small field="selectionOfEquipment" label="Auswahl der Betriebsmittel" checked={vdeData.selectionOfEquipment} onChange={handleVdeDataChange} />
            <CheckboxField small field="protectionAgainstDirectContact" label="Schutz gegen direktes Berühren" checked={vdeData.protectionAgainstDirectContact} onChange={handleVdeDataChange} />
            <CheckboxField small field="cablesLinesbusbars" label="Kabel, Leitungen, Stromschienen" checked={vdeData.cablesLinesbusbars} onChange={handleVdeDataChange} />
          </div>
          <div>
            <CheckboxField small field="circuitIdentification" label="Kennzeichnung Stromkreis, Betriebsmittel" checked={vdeData.circuitIdentification} onChange={handleVdeDataChange} />
            <CheckboxField small field="nPeIdentification" label="Kennzeichnung N‑ und PE‑Leiter" checked={vdeData.nPeIdentification} onChange={handleVdeDataChange} />
            <CheckboxField small field="protectionMonitoringDevices" label="Schutz- und Überwachungseinrichtungen" checked={vdeData.protectionMonitoringDevices} onChange={handleVdeDataChange} />
          </div>
          <div>
            <CheckboxField small field="mainEquipotentialBonding" label="Hauptpotentialausgleich" checked={vdeData.mainEquipotentialBonding} onChange={handleVdeDataChange} />
            <CheckboxField small field="conductorConnections" label="Leiterverbindung" checked={vdeData.conductorConnections} onChange={handleVdeDataChange} />
            <CheckboxField small field="isolatingDevices" label="Trenn- und Schaltgeräte" checked={vdeData.isolatingDevices} onChange={handleVdeDataChange} />
          </div>
        </div>
      </Section>

      <Section title="Erproben">
        <div className="grid grid-cols-2 gap-8">
          <CheckboxField small field="systemFunctionTest" label="Funktionsprüfung der Anlage" checked={vdeData.systemFunctionTest} onChange={handleVdeDataChange} />
          <CheckboxField small field="rcdTest" label="FI‑Schutzschalter (RCD) / wenn vorhanden" checked={vdeData.rcdTest} onChange={handleVdeDataChange} />
        </div>
      </Section>

      <Section title="Messen">
        <table className="w-full border-collapse border border-gray-400 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-1 text-left" colSpan="2">Stromkreis</th>
              <th className="border p-1 text-left" colSpan="2">Leitung/Kabel</th>
              <th className="border p-1 text-left" colSpan="3">Überstrom‑Schutzeinrichtung</th>
              <th className="border p-1 text-left">Riso (MΩ)</th>
              <th className="border p-1 text-left" colSpan="5">Fehlerstrom‑Schutzeinrichtung (RCD)</th>
            </tr>
            <tr className="bg-gray-50">
              <th className="border p-1 text-xs">Nr.</th>
              <th className="border p-1 text-xs">Zielbezeichnung</th>
              <th className="border p-1 text-xs">Typ</th>
              <th className="border p-1 text-xs">Leiter Anzahl × Quers. (mm²)</th>
              <th className="border p-1 text-xs">Art</th>
              <th className="border p-1 text-xs">In (A)</th>
              <th className="border p-1 text-xs">Zs (Ω)</th>
              <th className="border p-1 text-xs">
                <div className="flex flex-col space-y-1">
                  <CheckboxField small field="measurementWithoutLoad" label="ohne" checked={vdeData.measurementWithoutLoad} onChange={handleVdeDataChange} />
                  <CheckboxField small field="measurementWithLoad" label="mit Verbraucher" checked={vdeData.measurementWithLoad} onChange={handleVdeDataChange} />
                </div>
              </th>
              <th className="border p-1 text-xs">In (A)</th>
              <th className="border p-1 text-xs">IΔn (mA)</th>
              <th className="border p-1 text-xs">Imess (mA) (IΔn)</th>
              <th className="border p-1 text-xs">Ausl. Zeit (ms) tA</th>
              <th className="border p-1 text-xs">Umess (V)</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 12 }, (_, i) => {
              const auto = getAutoAcRowDefaults(vdeData, i);

              return (
                <tr key={i}>
                  {/* Nr. */}
                  <td className="border p-1 h-6">
                    <input
                      className="w-full bg-transparent text-xs text-center"
                      value={vdeData[`ac_row_${i}_nr`] ?? auto.nr}
                      onChange={(e) => handleVdeDataChange(`ac_row_${i}_nr`, e.target.value)}
                    />
                  </td>
                  {/* Zielbezeichnung */}
                  <td className="border p-1 h-6">
                    <input
                      className="w-full bg-transparent text-xs"
                      value={vdeData[`ac_row_${i}_designation`] ?? auto.designation}
                      onChange={(e) => handleVdeDataChange(`ac_row_${i}_designation`, e.target.value)}
                    />
                  </td>
                  {/* Typ */}
                  <td className="border p-1 h-6">
                    <input
                      className="w-full bg-transparent text-xs"
                      value={vdeData[`ac_row_${i}_cableType`] ?? auto.cableType}
                      onChange={(e) => handleVdeDataChange(`ac_row_${i}_cableType`, e.target.value)}
                    />
                  </td>
                  {/* Leiter Anzahl × Querschnitt */}
                  <td className="border p-1 h-6">
                    <input
                      className="w-full bg-transparent text-xs"
                      value={vdeData[`ac_row_${i}_cableInfo`] ?? auto.cableInfo}
                      onChange={(e) => handleVdeDataChange(`ac_row_${i}_cableInfo`, e.target.value)}
                    />
                  </td>
                  {/* Art */}
                  <td className="border p-1 h-6">
                    <input
                      className="w-full bg-transparent text-xs"
                      value={vdeData[`ac_row_${i}_breakerType`] ?? auto.breakerType}
                      onChange={(e) => handleVdeDataChange(`ac_row_${i}_breakerType`, e.target.value)}
                    />
                  </td>
                  {/* In (A) */}
                  <td className="border p-1 h-6">
                    <input
                      className="w-full bg-transparent text-xs"
                      value={vdeData[`ac_row_${i}_breakerCurrent`] ?? auto.breakerCurrent}
                      onChange={(e) => handleVdeDataChange(`ac_row_${i}_breakerCurrent`, e.target.value)}
                    />
                  </td>
                  {/* Zs (Ω) */}
                  <td className="border p-1 h-6">
                    <input
                      className="w-full bg-transparent text-xs"
                      value={vdeData[`ac_row_${i}_zs`] ?? ''}
                      onChange={(e) => handleVdeDataChange(`ac_row_${i}_zs`, e.target.value)}
                    />
                  </td>
                  {/* ohne/mit Verbraucher – Checkboxen sind global */}
                  <td className="border p-1 h-6" />
                  {/* RCD In (A) */}
                  <td className="border p-1 h-6">
                    <input
                      className="w-full bg-transparent text-xs"
                      value={vdeData[`ac_row_${i}_rcdIn`] ?? auto.rcdIn}
                      onChange={(e) => handleVdeDataChange(`ac_row_${i}_rcdIn`, e.target.value)}
                    />
                  </td>
                  {/* RCD IΔn (mA) */}
                  <td className="border p-1 h-6">
                    <input
                      className="w-full bg-transparent text-xs"
                      value={vdeData[`ac_row_${i}_rcdIdn`] ?? auto.rcdIdn}
                      onChange={(e) => handleVdeDataChange(`ac_row_${i}_rcdIdn`, e.target.value)}
                    />
                  </td>
                  {/* Imess / tA / Umess */}
                  {['rcdImess', 'rcdTa', 'uMess'].map((k, j) => (
                    <td key={j} className="border p-1 h-6">
                      <input
                        className="w-full bg-transparent text-xs"
                        value={vdeData[`ac_row_${i}_${k}`] ?? ''}
                        onChange={(e) => handleVdeDataChange(`ac_row_${i}_${k}`, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>

      <div className="mt-4 grid grid-cols-2 gap-8">
        <div className="flex items-center">
          <span className="text-xs mr-4">Durchgängigkeit Schutzleiter:</span>
          <span className="text-xs mr-2">&lt; 1 Ω</span>
          <input
            type="checkbox"
            checked={!!vdeData.protectiveConductorContinuity}
            onChange={(e) => handleVdeDataChange('protectiveConductorContinuity', e.target.checked)}
            className="mr-4"
          />
          <span className="text-xs mr-4">Erdungswiderstand Re</span>
          <input
            type="text"
            value={vdeData.earthingResistance ?? ''}
            onChange={(e) => handleVdeDataChange('earthingResistance', e.target.value)}
            className="w-16 border border-gray-400 px-1 text-xs mr-1 bg-transparent"
          />
          <span className="text-xs">Ω</span>
        </div>
        <div className="flex items-center">
          <span className="text-xs mr-4">Durchgängigkeit Potentialausgleich:</span>
          <span className="text-xs">(&lt; 1 Ω nachgewiesen)</span>
        </div>
      </div>
    </div>
  );
});

/** =========================================================================
 *  SEITE 5: PV‑Generator Prüfbericht
 *  ========================================================================= */
const Page5PVGeneratorPruefberichtSingle = React.memo(function Page5PVGeneratorPruefberichtSingle({
  vdeData,
  handleVdeDataChange,
  inverterData,
  inverterIndex,
  stringNames = [],
  pageNumber = 1,
}) {
  const pageOffset = (pageNumber - 1) * 9;

  const getInverterSpecValue = (field) => vdeData[`inverter${inverterIndex}_${field}`] || '';
  const getModuleSpecValue = (specId) => getModuleSpec(vdeData, specId);

  const inverterTypeDesignation =
    `${(inverterData?.type || findMaterialById(vdeData.materials, inverterData?.materialID)?.type || 'WR')}_${inverterIndex}`;

  const generatorParamRows = useMemo(
    () => [
      { label: 'Isc (STC)', field: 'stringIsc', spec: SPEC.MODULE.ISC },
      { label: 'Uoc (STC)', field: 'stringUoc', spec: SPEC.MODULE.UOC },
    ],
    []
  );

  const wrProtectionRows = useMemo(
    () => [
      { label: 'Isolationsüberwachung', field: 'isolationMonitoring', spec: SPEC.INV.ISO_MON },
      { label: 'DC‑Überspannungsschutz', field: 'dcOvervoltageProtection', spec: SPEC.INV.SPD_DC },
      { label: 'AC‑Überspannungsschutz', field: 'acOvervoltageProtection', spec: SPEC.INV.SPD_AC },
      { label: 'Fehlerstromüberwachung', field: 'residualCurrentMonitoring', spec: SPEC.INV.RCM },
      { label: 'AC‑Überstromschutz', field: 'acOvercurrentProtection', spec: SPEC.INV.AC_OC },
      { label: 'AC‑Kurzschlussschutz', field: 'acShortCircuitProtection', spec: SPEC.INV.AC_SC },
      { label: 'Lichtbogenerkennung', field: 'arcFaultDetection', spec: SPEC.INV.AFCI },
    ],
    []
  );

  const branchProtectionRows = useMemo(
    () => [
      { label: 'SPD Typ', field: 'spdType', spec: SPEC.GAK.SPD_TYPE },
      { label: 'Bemessungsstrom (A)', field: 'ratedCurrent', spec: SPEC.GAK.RATED_CURRENT },
      { label: 'Bemessungsspannung (V)', field: 'ratedVoltage', spec: SPEC.GAK.RATED_VOLTAGE },
    ],
    []
  );

  const wiringRows = useMemo(
    () => [
      { label: 'Typ', field: 'wiringType', spec: SPEC.WIRING.WIRING_TYPE },
      { label: 'Phasenleiter (mm²)', field: 'phaseLeader', spec: SPEC.WIRING.PHASE_LEADER },
      { label: 'Erdleiter (mm²)', field: 'earthLeader', spec: SPEC.WIRING.EARTH_LEADER },
    ],
    []
  );

  const measurementRows = useMemo(
    () => [
      { label: 'Uoc (V)', field: 'measurementUoc' },
      { label: 'Isc (A)', field: 'measurementIsc' },
    ],
    []
  );

  const insulationRows = useMemo(
    () => [
      { label: 'Prüfspannung', field: 'testVoltage' },
      { label: '(+) & (–) Elektrode Erde (MΩ)', field: 'positiveNegativeElectrode' },
      { label: 'opt. (+) Elektrode Erde (MΩ)', field: 'optionalPositiveElectrode' },
      { label: 'opt. (–) Elektrode Erde (MΩ)', field: 'optionalNegativeElectrode' },
    ],
    []
  );

  return (
    <div className="page bg-white p-6 min-h-[297mm] w-[210mm] mx-auto" style={{ fontSize: '10px' }}>
      <PageHeader
        title="Prüfbericht der elektrischen Prüfung des PV‑Generators"
        subtitle="gemäß VDE 0126‑23 (DIN EN 62446)"
        customerName={vdeData.projectName || ''}
      />

      {/* WR-Infos */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-gray-400 text-xs">
          <tbody>
            <tr>
              <td className="border p-2 font-semibold bg-gray-100 w-1/3">Marke/ Modell des Wechselrichters</td>
              <td className="border p-2" colSpan={2}>
                <input
                  type="text"
                  value={
                    inverterData?.description ||
                    `${inverterData?.manufacturer ?? ''} ${inverterData?.type ?? ''}`.trim() ||
                    vdeData[`inverterBrandModel_${inverterIndex}`] ||
                    ''
                  }
                  onChange={(e) => handleVdeDataChange(`inverterBrandModel_${inverterIndex}`, e.target.value)}
                  className="w-full bg-transparent"
                />
              </td>
            </tr>
            <tr>
              <td className="border p-2 font-semibold bg-gray-100">Wechselrichter Typenkennzeichnung</td>
              <td className="border p-2" colSpan={2}>
                <input
                  type="text"
                  value={inverterTypeDesignation}
                  onChange={(e) => handleVdeDataChange(`inverterTypeDesignation_${inverterIndex}`, e.target.value)}
                  className="w-full bg-transparent"
                />
              </td>
            </tr>
            <tr>
              <td className="border p-2 font-semibold bg-gray-100">Bestimmungsgemäße WR‑Funktion</td>
              <td className="border p-2 text-center" colSpan={2}>
                <input
                  type="checkbox"
                  checked={vdeData[`inverterProperFunction_${inverterIndex}`] ?? true}
                  onChange={(e) => handleVdeDataChange(`inverterProperFunction_${inverterIndex}`, e.target.checked)}
                  className="mr-1"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Strang-Tabelle */}
      <div className="mb-4">
        <table className="w-full border-collapse border border-gray-400 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-1 text-left font-semibold w-32" colSpan={2}>Strang</th>
              {stringNames.map((name, i) => (
                <th key={i} className="border p-1 text-center w-15" title={name}>{name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* PV-Generator Anzahl */}
            <tr>
              <td className="border p-1 font-semibold bg-gray-50 w-20">PV‑Generator</td>
              <td className="border p-1 text-xs w-16">Anzahl</td>
              {stringNames.map((_, i) => {
                const gIdx = pageOffset + i;
                const fallbackCount =
                  inverterData?.strings?.[gIdx]?.moduleCount ?? vdeData.projectConfig?.modules?.totalQuantity ?? '';
                return (
                  <td key={i} className="border p-1">
                    <input
                      type="number"
                      value={vdeData[`stringCount_${inverterIndex}_${gIdx + 1}`] ?? fallbackCount}
                      onChange={(e) => handleVdeDataChange(`stringCount_${inverterIndex}_${gIdx + 1}`, e.target.value)}
                      className="w-full bg-transparent text-center text-xs"
                    />
                  </td>
                );
              })}
            </tr>

            {/* PV-Generator-Parameter */}
            {generatorParamRows.map((row, ri) => (
              <tr key={row.field}>
                {ri === 0 && (
                  <td className="border p-1 font-semibold bg-gray-50 w-20" rowSpan={generatorParamRows.length}>
                    PV‑Generator‑Parameter
                  </td>
                )}
                <td className="border p-1 text-xs w-16">{row.label}</td>
                {stringNames.map((_, i) => {
                  const gIdx = pageOffset + i;
                  return (
                    <td key={i} className="border p-1">
                      <input
                        type="number"
                        value={vdeData[`${row.field}_${inverterIndex}_${gIdx + 1}`] ?? getModuleSpecValue(row.spec)}
                        onChange={(e) => handleVdeDataChange(`${row.field}_${inverterIndex}_${gIdx + 1}`, e.target.value)}
                        className="w-full bg-transparent text-center text-xs"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Schutzeinrichtung (WR) */}
            {wrProtectionRows.map((row, ri) => (
              <tr key={row.field}>
                {ri === 0 && (
                  <td className="border p-1 font-semibold bg-gray-50" rowSpan={wrProtectionRows.length}>
                    Schutzeinrichtung (WR)
                  </td>
                )}
                <td className="border p-1 text-xs">{row.label}</td>
                {stringNames.map((_, i) => {
                  const gIdx = pageOffset + i;
                  return (
                    <td key={i} className="border p-1">
                      <input
                        type="text"
                        value={vdeData[`string${row.field}_${inverterIndex}_${gIdx + 1}`] ?? getInverterSpecValue(row.field)}
                        onChange={(e) => handleVdeDataChange(`string${row.field}_${inverterIndex}_${gIdx + 1}`, e.target.value)}
                        className="w-full bg-transparent text-center text-xs"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Schutzeinrichtung (Zweigsicherung) */}
            {branchProtectionRows.map((row, ri) => (
              <tr key={row.field}>
                {ri === 0 && (
                  <td className="border p-1 font-semibold bg-gray-50" rowSpan={branchProtectionRows.length}>
                    Schutzeinrichtung (Zweigsicherung)
                  </td>
                )}
                <td className="border p-1 text-xs">{row.label}</td>
                {stringNames.map((_, i) => {
                  const gIdx = pageOffset + i;
                  return (
                    <td key={i} className="border p-1">
                      <input
                        type="text"
                        value={vdeData[`string${row.field}_${inverterIndex}_${gIdx + 1}`] ?? (getInverterSpecValue(row.field) || '-') }
                        onChange={(e) => handleVdeDataChange(`string${row.field}_${inverterIndex}_${gIdx + 1}`, e.target.value)}
                        className="w-full bg-transparent text-center text-xs"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Verdrahtung */}
            {wiringRows.map((row, ri) => (
              <tr key={row.field}>
                {ri === 0 && (
                  <td className="border p-1 font-semibold bg-gray-50" rowSpan={wiringRows.length}>
                    Verdrahtung
                  </td>
                )}
                <td className="border p-1 text-xs">{row.label}</td>
                {stringNames.map((_, i) => {
                  const gIdx = pageOffset + i;
                  const stringKey = `string${row.field}_${inverterIndex}_${gIdx + 1}`;
                  const inverterKey = `inverter${inverterIndex}_${row.field}`;
                  const value = vdeData[stringKey] || vdeData[inverterKey] || getInverterSpecValue(row.field) || '';

                  return (
                    <td key={i} className="border p-1">
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleVdeDataChange(stringKey, e.target.value)}
                        className="w-full bg-transparent text-center text-xs"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Erprobung & Messung */}
            {measurementRows.map((row, ri) => (
              <tr key={row.field}>
                {ri === 0 && (
                  <td className="border p-1 font-semibold bg-gray-50" rowSpan={measurementRows.length}>
                    Erprobung und Messung des Stranges
                  </td>
                )}
                <td className="border p-1 text-xs">{row.label}</td>
                {stringNames.map((_, i) => {
                  const gIdx = pageOffset + i;
                  return (
                    <td key={i} className="border p-1">
                      <input
                        type="text"
                        value={vdeData[`string${row.field}_${inverterIndex}_${gIdx + 1}`] ?? ''}
                        onChange={(e) => handleVdeDataChange(`string${row.field}_${inverterIndex}_${gIdx + 1}`, e.target.value)}
                        className="w-full bg-transparent text-center text-xs"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Polarität */}
            <tr>
              <td className="border p-1 font-semibold bg-gray-50" colSpan={2}>Kontrolle der Polarität</td>
              {stringNames.map((_, i) => {
                const gIdx = pageOffset + i;
                return (
                  <td key={i} className="border p-1">
                    <input
                      type="text"
                      value={vdeData[`stringPolarityControl_${inverterIndex}_${gIdx + 1}`] ?? 'i.O'}
                      onChange={(e) => handleVdeDataChange(`stringPolarityControl_${inverterIndex}_${gIdx + 1}`, e.target.value)}
                      className="w-full bg-transparent text-center text-xs"
                    />
                  </td>
                );
              })}
            </tr>

            {/* Isolationswiderstand */}
            {insulationRows.map((row, ri) => (
              <tr key={row.field}>
                {ri === 0 && (
                  <td className="border p-1 font-semibold bg-gray-50" rowSpan={insulationRows.length}>
                    Isolationswiderstand des Stranges
                  </td>
                )}
                <td className="border p-1 text-xs">{row.label}</td>
                {stringNames.map((_, i) => {
                  const gIdx = pageOffset + i;
                  const isOptional = row.field === 'optionalPositiveElectrode' || row.field === 'optionalNegativeElectrode';
                  return (
                    <td key={i} className="border p-1">
                      {isOptional ? (
                        <div className="w-full text-center text-xs">-</div>
                      ) : (
                        <input
                          type="text"
                          value={vdeData[`string${row.field}_${inverterIndex}_${gIdx + 1}`] ?? (row.field === 'testVoltage' ? '1000' : '')}
                          onChange={(e) => handleVdeDataChange(`string${row.field}_${inverterIndex}_${gIdx + 1}`, e.target.value)}
                          className="w-full bg-transparent text-center text-xs"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

const Page5_PVGeneratorPruefbericht = React.memo(function Page5_PVGeneratorPruefbericht({ vdeData, handleVdeDataChange }) {
  const inverters = useMemo(() => {
    const list = [];
    const cfg = vdeData.projectConfig?.inverters ?? [];
    cfg.forEach((inv, idx) => {
      for (let i = 0; i < (inv.quantity ?? 0); i++) {
        list.push({
          ...inv,
          originalIndex: idx,
          instanceIndex: i,
          globalIndex: list.length,
          strings: inv.strings ?? [],
        });
      }
    });

    if (list.length === 0) {
      const count = parseInt(vdeData.inverterCount ?? '1', 10) || 1;
      const stringConfig = vdeData.strings ?? [];
      for (let i = 0; i < count; i++) {
        list.push({
          type: vdeData[`inverterType${i + 1}`] || vdeData.inverterType || 'Unbekannt',
          manufacturer: vdeData.inverterManufacturer || 'Unbekannt',
          quantity: 1,
          originalIndex: i,
          instanceIndex: 0,
          globalIndex: i,
          strings: stringConfig.length ? stringConfig : [{ stringName: 'String 1' }],
        });
      }
    }
    return list;
  }, [vdeData]);

  const pages = [];
  inverters.forEach((inv, invIdx) => {
    const names = (inv.strings ?? []).map((s) => s.stringName || s.name || 'String');
    const total = names.length;
    const perPage = 9;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    for (let p = 1; p <= totalPages; p++) {
      const start = (p - 1) * perPage;
      const end = Math.min(start + perPage, total);
      pages.push(
        <Page5PVGeneratorPruefberichtSingle
          key={`inv-${invIdx}-p-${p}`}
          vdeData={vdeData}
          handleVdeDataChange={handleVdeDataChange}
          inverterData={inv}
          inverterIndex={invIdx}
          stringNames={names.slice(start, end)}
          pageNumber={p}
        />
      );
    }
  });

  return <>{pages}</>;
});

/** =========================================================================
 *  MODAL + STATE + PRINT
 *  ========================================================================= */
const pageComponents = [
  Page1_Anlagenuebersicht,
  Page2_Besichtigung1,
  Page3_Besichtigung2,
  Page4_ACSeitePruefbericht,
  Page5_PVGeneratorPruefbericht,
];
const pageNames = ['Anlagenübersicht', 'Besichtigung (1)', 'Besichtigung (2)', 'AC‑Seite Prüfung', 'PV‑Generator Prüfung'];

const initialVdeData = {
  // Seite 1
  address: '',
  customerName: '',
  projectName: '',
  contractorName: '',
  inspectorName: 'Matteo Stockmann',
  installedPower: '',
  moduleCount: '',
  moduleType: '',
  modulePmaxDC: '',
  moduleUoc: '',
  moduleIsc: '',
  moduleUmpp: '',
  inverterCount: '',
  inverterType: '',
  inverterManufacturer: '',
  inverterPmaxDC: '',
  inverterPnomAC: '',
  inverterPmaxAC: '',
  commissioningDate: '',
  testEquipment: 'Benning IT130 SN23351174 /Benning PV2 SN09R-0875 / Benning SUN2 SN40Q-0981',
  initialTest: true,
  repeatTest: false,
  testDate: '',
  nextTestDate: '',
  noDefectsFound: true,
  compliesWithStandards: true,
  locationDate: '',
  inspectorSignature: '',
  // Seite 2
  entirePVSystem: true,
  followingCircuits: true,
  pvSystemInspected: true,
  dcSystemGeneral: true,
  dcComponentsRated: true,
  dcComponentsMaxRated: true,
  protectionClass2: true,
  pvCablesSelected: true,
  wiringSystemSelected: true,
  systemsWithoutOvercurrent: true,
  acDcCablesSeparated: true,
  systemsWithOvercurrent: true,
  dcDisconnectorInstalled: true,
  blockingDiodesInstalled: true,
  inverterSimpleSeparation: true,
  alternativeRcdTypeB: false,
  wiringLoopsMinimized: true,
  pvFrameEquipotential: true,
  equipotentialConductors: true,
  // Seite 3
  acSideDisconnection: true,
  switchingDevicesConnected: true,
  protectionSettingsProgrammed: true,
  allCircuitsLabeled: true,
  dcJunctionBoxesWarning: true,
  acMainSwitchLabeled: true,
  dualSupplyWarnings: true,
  schematicDiagramOnSite: true,
  protectionSettingsOnSite: true,
  emergencyShutdownProcedures: true,
  signsSecurelyAttached: true,
  ventilationBehindPV: true,
  framesCorrosionResistant: true,
  framesProperlySecured: true,
  cableRoutingWeatherproof: true,
  // Seite 4
  testAccordingVDE0100600: true,
  testAccordingVDE0105100: false,
  networkVoltage1: 230,
  networkVoltage2: 400,
  networkTNC: false,
  networkTNS: false,
  networkTNCS: false,
  networkTT: false,
  networkIT: false,
  selectionOfEquipment: true,
  protectionAgainstDirectContact: true,
  cablesLinesbusbars: true,
  circuitIdentification: true,
  nPeIdentification: true,
  protectionMonitoringDevices: true,
  mainEquipotentialBonding: true,
  conductorConnections: true,
  isolatingDevices: true,
  systemFunctionTest: true,
  rcdTest: true,
  protectiveConductorContinuity: true,
  earthingResistance: '',
  // Seite 5 / Projektdaten werden per useEffect ergänzt
  measurementWithoutLoad: true,
  measurementWithLoad: false,
  projectConfig: undefined,
  materials: undefined,
  strings: [],
};

const VDEProtocolModal = ({ isOpen, onClose, protocol = null, hideActions = false }) => {
  const { materials } = useMaterials();
  const { showNotification } = useNotification();

  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [vdeData, setVdeData] = useState(initialVdeData);
  const [errors, setErrors] = useState({});
  const [printMount, setPrintMount] = useState(null);

  // Einen dedizierten Knoten für den Druck an <body> erzeugen (nur wenn Modal offen)
  useEffect(() => {
    if (!isOpen) return;
    const el = document.createElement('div');
    el.id = 'vde-print-root';
    el.style.display = 'none'; // am Bildschirm versteckt – wird per @media print überschrieben
    document.body.appendChild(el);
    setPrintMount(el);
    return () => {
      document.body.removeChild(el);
      setPrintMount(null);
    };
  }, [isOpen]);

  // Ableitungen aus Projekt- oder Protokolldaten
  useEffect(() => {
    if (!isOpen) return;

    // Gespeichertes Protokoll?
    if (protocol?.vdeData) {
      setVdeData((prev) => ({ ...prev, ...protocol.vdeData }));
      return;
    }

    // Projektkonfiguration als Quelle
    const cfg = protocol || {};
    const next = { ...initialVdeData };

    next.customerName = cfg.customerName || '';
    next.address = cfg.address || '';
    next.projectName = cfg.projectName || '';

    // Module
    if (cfg.modules?.materialID && Array.isArray(materials)) {
      const mat = materials.find((m) => m.id === cfg.modules.materialID);
      const get = (id) => (mat?.specifications?.[id] ?? '')?.toString().replace(',', '.');

      next.moduleType = cfg.modules?.description || '';
      next.moduleCount = cfg.modules?.totalQuantity || '';
      next.modulePmaxDC = get(SPEC.MODULE.PMAX_DC);
      next.moduleUoc = get(SPEC.MODULE.UOC);
      next.moduleIsc = get(SPEC.MODULE.ISC);
      next.moduleUmpp = get(SPEC.MODULE.UMPP);

      const pWp = parseFloat(next.modulePmaxDC || '0');
      const cnt = parseFloat(String(next.moduleCount || '0'));
      if (pWp && cnt) next.installedPower = ((pWp * cnt) / 1000).toFixed(2);
    }

    // Wechselrichter
    if (Array.isArray(cfg.inverters)) {
      next.inverterCount = cfg.inverters.reduce((sum, i) => sum + (i.quantity || 0), 0) || '';

      // eindeutige materialIDs
      const seen = new Set();
      const unique = cfg.inverters.filter((i) => {
        if (seen.has(i.materialID)) return false;
        seen.add(i.materialID);
        return true;
      });

      unique.forEach((inv, idx) => {
        const invNum = idx + 1;
        next[`inverterType${invNum}`] = inv.description || '';
        if (inv.materialID && Array.isArray(materials)) {
          const mat = materials.find((m) => m.id === inv.materialID);
          const get = (id) => (mat?.specifications?.[id] ?? '')?.toString().replace(',', '.');
          next[`inverterPmaxDC${invNum}`] = get(SPEC.INV.PMAX_DC);
          next[`inverterPnomAC${invNum}`] = get(SPEC.INV.PNOM_AC);
          next[`inverterPmaxAC${invNum}`] = get(SPEC.INV.PMAX_AC);

          // Seite 5 Schutzangaben
          next[`inverter${idx}_isolationMonitoring`] = get(SPEC.INV.ISO_MON);
          next[`inverter${idx}_dcOvervoltageProtection`] = get(SPEC.INV.SPD_DC);
          next[`inverter${idx}_acOvervoltageProtection`] = get(SPEC.INV.SPD_AC);
          next[`inverter${idx}_residualCurrentMonitoring`] = get(SPEC.INV.RCM);
          next[`inverter${idx}_acOvercurrentProtection`] = get(SPEC.INV.AC_OC);
          next[`inverter${idx}_acShortCircuitProtection`] = get(SPEC.INV.AC_SC);
          next[`inverter${idx}_arcFaultDetection`] = get(SPEC.INV.AFCI);
        }
      });
    }

    // GAK
    if (cfg?.generatoranschlusskasten?.materialID && Array.isArray(materials)) {
      const gakMaterial = materials.find((m) => m.id === cfg.generatoranschlusskasten.materialID);
      if (gakMaterial?.specifications) {
        const getGak = (id) => (gakMaterial.specifications[id] ?? '')?.toString().replace(',', '.');
        if (Array.isArray(cfg.inverters)) {
          const uniqueInverters = cfg.inverters.filter((inv, idx, arr) =>
            arr.findIndex(i => i.materialID === inv.materialID) === idx
          );
          uniqueInverters.forEach((inv, idx) => {
            next[`inverter${idx}_spdType`] = getGak(SPEC.GAK.SPD_TYPE);
            next[`inverter${idx}_ratedCurrent`] = getGak(SPEC.GAK.RATED_CURRENT);
            next[`inverter${idx}_ratedVoltage`] = getGak(SPEC.GAK.RATED_VOLTAGE);
          });
        }
      }
    }

    // Verdrahtung
    if (cfg?.pvCables?.materialID && Array.isArray(materials)) {
      const pvCableMaterial = materials.find((m) => m.id === cfg.pvCables.materialID);
      if (pvCableMaterial?.specifications) {
        const getPv = (id) => (pvCableMaterial.specifications[id] ?? '')?.toString().replace(',', '.');
        if (Array.isArray(cfg.inverters)) {
          const uniqueInverters = cfg.inverters.filter((inv, idx, arr) =>
            arr.findIndex(i => i.materialID === inv.materialID) === idx
          );
          uniqueInverters.forEach((inv, idx) => {
            next[`inverter${idx}_wiringType`] = getPv(SPEC.WIRING.WIRING_TYPE);
            next[`inverter${idx}_phaseLeader`] = getPv(SPEC.WIRING.PHASE_LEADER);
          });
        }
      }
    }

    // Potentialausgleich
    if (cfg?.potentialausgleichHESUK?.materialID && Array.isArray(materials)) {
      const hesukMaterial = materials.find((m) => m.id === cfg.potentialausgleichHESUK.materialID);
      if (hesukMaterial?.specifications) {
        const getPA = (id) => (hesukMaterial.specifications[id] ?? '')?.toString().replace(',', '.');
        if (Array.isArray(cfg.inverters)) {
          const uniqueInverters = cfg.inverters.filter((inv, idx, arr) =>
            arr.findIndex(i => i.materialID === inv.materialID) === idx
          );
          uniqueInverters.forEach((inv, idx) => {
            next[`inverter${idx}_earthLeader`] = getPA(SPEC.WIRING.EARTH_LEADER);
          });
        }
      }
    }

    // Strings (Fallback)
    next.strings =
      cfg?.inverters?.[0]?.strings?.map((s, i) => ({
        id: i + 1,
        name: s.stringName || `String ${i + 1}`,
        moduleCount: cfg.modules?.totalQuantity || 0,
      })) || [];

    next.projectConfig = cfg;
    next.materials = materials;

    setVdeData(next);
  }, [isOpen, protocol, materials]);

  const handleVdeDataChange = (field, value) => {
    setVdeData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const errs = {};
    if (!vdeData.customerName) errs.customerName = 'Kundenname ist erforderlich';
    if (!vdeData.address) errs.address = 'Adresse ist erforderlich';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const protocolNumber = protocol?.protocolNumber || `VDE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      // Leistung (kWp) berechnen, wenn möglich
      let powerKwp = parseFloat(vdeData.installedPower) || 0;
      if (vdeData.projectConfig?.modules?.materialID && vdeData.materials) {
        const moduleMat = vdeData.materials.find((m) => m.id === vdeData.projectConfig.modules.materialID);
        const pWp =
          parseFloat(String(moduleMat?.specifications?.[SPEC.MODULE.PMAX_DC] ?? '').replace(',', '.')) || 0;
        const cnt = vdeData.projectConfig?.modules?.totalQuantity || 0;
        powerKwp = pWp && cnt ? parseFloat(((pWp * cnt) / 1000).toFixed(2)) : powerKwp;
      }

      const protocolData = {
        protocolNumber,
        customerName: vdeData.customerName || '',
        address: vdeData.address,
        projectName: protocol?.projectName || vdeData.projectName || '-',
        vdeData, // vollständiger Zustand
        power: powerKwp,
        moduleCount:
          vdeData.projectConfig?.modules?.totalQuantity ||
          parseInt(vdeData.moduleCount || '0', 10) || 0,
        stringCount:
          (vdeData.projectConfig?.inverters || []).reduce((t, inv) => t + (inv.strings?.length || 0), 0) ||
          vdeData.strings?.length || 1,
        inverterModel: vdeData.projectConfig?.inverters?.[0]?.description || vdeData.inverterType || 'Unbekannt',
        status: protocol?.status || 'Erstellt',
        createdDate: protocol?.createdDate || new Date(),
        updatedDate: new Date(),
      };

      if (protocol?.id) {
        await FirebaseService.updateDocument('vde-protocols', protocol.id, protocolData);
        showNotification('VDE‑Protokoll aktualisiert', 'success');
      } else {
        await FirebaseService.addDocument('vde-protocols', protocolData);
        showNotification('VDE‑Protokoll erstellt', 'success');
      }

      onClose();
    } catch (err) {
      console.error('Error saving VDE protocol:', err);
      showNotification('Fehler beim Speichern des Protokolls', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  /** PRINT: Rendert alle Seiten im Print-Container und ruft den Browser‑Dialog auf */
  const handlePrintAll = () => {
    // einen Frame warten, damit das Portal sicher gemountet ist
    requestAnimationFrame(() => window.print());
  };

  const CurrentPage = useMemo(
    () => pageComponents[Math.min(Math.max(currentPage, 1), pageComponents.length) - 1],
    [currentPage]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 !m-0 !top-0">
      {/* PRINT STYLES (robust): Keine doppelten Ränder mehr */}
      <style>{`
        @media print {
          /* 1) Keine doppelten Ränder mehr auf @page */
          @page { size: A4 portrait; margin: 0; }

          /* 2) Nur den Portal-Root drucken (wie zuvor) */
          body > *:not(#vde-print-root) { display: none !important; }
          #vde-print-root { display: block !important; }

          /* 3) A4-Layout: Padding = Seitenrand, Höhe exakt A4 (inkl. Padding) */
          #vde-print-root .page {
            width: 210mm !important;
            min-height: calc(297mm - 0.1mm) !important; /* kleine Toleranz gegen Rundungsfehler */
            padding: 12mm !important;                   /* Innenrand statt @page margin */
            box-sizing: border-box !important;          /* Padding in Höhe mitrechnen */
            margin: 0 auto !important;
            break-after: page;                          /* moderner Umbruch */
          }
          #vde-print-root .page:last-child { break-after: auto; }

          /* 4) Tailwind-Padding/-Höhen überschreiben, damit nichts doppelt zählt */
          #vde-print-root .page.p-6,
          #vde-print-root .page.p-8 { padding: 12mm !important; }
          
          /* 5) Typografie-Margins zurücksetzen */
          #vde-print-root h1, 
          #vde-print-root h2, 
          #vde-print-root h3 { margin-top: 0; }
        }
      `}</style>

      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto no-print">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            {protocol ? 'VDE‑Protokoll bearbeiten' : 'VDE‑Protokoll erstellen'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Seite {currentPage} von {pageComponents.length}:</span>
            <span className="text-sm text-gray-600">{pageNames[currentPage - 1]}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Zurück
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pageComponents.length, p + 1))}
              disabled={currentPage === pageComponents.length}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              Weiter
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Content (nur aktuelle Seite sichtbar im Screen) */}
          <div className="overflow-auto max-h-[60vh]">
            <CurrentPage vdeData={vdeData} handleVdeDataChange={handleVdeDataChange} />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
            {!hideActions && (
              <div className="flex space-x-3 mr-auto">
                <button
                  type="button"
                  onClick={handlePrintAll}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                  title="Drucken oder als PDF speichern"
                >
                  <Printer className="h-4 w-4" />
                  <span>Drucken / PDF</span>
                </button>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isLoading ? 'Speichert…' : protocol?.id ? 'Aktualisieren' : 'Speichern'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Validierungs-Hinweis */}
        {Object.keys(errors).length > 0 && (
          <div className="px-6 pb-6 text-sm text-red-700">
            {errors.customerName && <div>• {errors.customerName}</div>}
            {errors.address && <div>• {errors.address}</div>}
          </div>
        )}
      </div>

      {/* PRINT PORTAL: rendert ALLE Seiten direkt an <body> (außerhalb des Modals) */}
      {printMount && createPortal(
        <>
          {pageComponents.map((Comp, idx) => (
            <Comp
              key={idx}
              vdeData={vdeData}
              handleVdeDataChange={handleVdeDataChange}
            />
          ))}
        </>,
        printMount
      )}
    </div>
  );
};

export default VDEProtocolModal;
