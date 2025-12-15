import React from 'react';
import { Calculator, Home, Wrench, Cable, Zap, Settings } from 'lucide-react';

/**
 * Berechnungsparameter Einstellungen für den PV-Konfigurator
 * Ermöglicht die Konfiguration von Mengen, Verhältnissen und Standardwerten für Berechnungen
 */
const CalculationParamsSettings = ({ pvDefaults, handlePvDefaultChange }) => {

  // Hilfsfunktion für Number-Input
  const NumberInput = ({ label, value, onChange, step = 1, min = 0, max, unit }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          step={step}
          min={min}
          max={max}
          value={value || ''}
          onChange={(e) => {
            const val = step === 1 || Number.isInteger(step)
              ? parseInt(e.target.value) || null
              : parseFloat(e.target.value) || null;
            onChange(val);
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            {unit}
          </span>
        )}
      </div>
    </div>
  );

  // Section Header Komponente
  const SectionHeader = ({ icon: Icon, title }) => (
    <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2 flex items-center gap-2">
      {Icon && <Icon className="h-5 w-5 text-blue-600" />}
      {title}
    </h4>
  );

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="space-y-8">

        {/* PV Komponenten */}
        <div>
          <SectionHeader icon={Settings} title="PV Komponenten" />
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Smart Dongle Value"
              value={pvDefaults.smartDongleValue}
              onChange={(val) => handlePvDefaultChange('smartDongleValue', val)}
              step={0.1}
            />
          </div>
        </div>

        {/* Ziegeldach */}
        <div>
          <SectionHeader icon={Home} title="Ziegeldach" />
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Modul-Haken Verhältnis"
              value={pvDefaults.modulHakenVerhaeltnis}
              onChange={(val) => handlePvDefaultChange('modulHakenVerhaeltnis', val)}
              step={0.1}
            />
            <NumberInput
              label="Potentialausgleich UK-UK (m)"
              value={pvDefaults.PotentialausgleichUK}
              onChange={(val) => handlePvDefaultChange('PotentialausgleichUK', val)}
              step={0.1}
              unit="m"
            />
          </div>
        </div>

        {/* Befestigungsmaterial */}
        <div>
          <SectionHeader icon={Wrench} title="Befestigungsmaterial" />
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="RohrschelleBefestigungsmaterial"
              value={pvDefaults.RohrschelleBefestigungsmaterial}
              onChange={(val) => handlePvDefaultChange('RohrschelleBefestigungsmaterial', val)}
            />
            <NumberInput
              label="BefestigungPotentialausgleich UK-UK"
              value={pvDefaults.BefestigungPotentialausgleichUKUK}
              onChange={(val) => handlePvDefaultChange('BefestigungPotentialausgleichUKUK', val)}
            />
            <NumberInput
              label="Befestigung Leistungsoptimierer"
              value={pvDefaults.BefestigungLeistungsoptimierer}
              onChange={(val) => handlePvDefaultChange('BefestigungLeistungsoptimierer', val)}
            />
            <NumberInput
              label="Kabelkanal Befestigungsmaterial (Schrauben/Dübel)"
              value={pvDefaults.KabelkanalBefestigungsmaterial}
              onChange={(val) => handlePvDefaultChange('KabelkanalBefestigungsmaterial', val)}
            />
            <NumberInput
              label="PV-Geräte Befestigungsmaterial"
              value={pvDefaults.PvGeraeteBefestigungsmaterial}
              onChange={(val) => handlePvDefaultChange('PvGeraeteBefestigungsmaterial', val)}
            />
            <NumberInput
              label="Dämmstoffdübel"
              value={pvDefaults.Dammstoffduebel}
              onChange={(val) => handlePvDefaultChange('Dammstoffduebel', val)}
            />
            <NumberInput
              label="Dübel Gerüstanker"
              value={pvDefaults.DuebelGeruestanker}
              onChange={(val) => handlePvDefaultChange('DuebelGeruestanker', val)}
            />
            <NumberInput
              label="Aufkleber Brandschutzzeichen (Anzahl)"
              value={pvDefaults.AufkleberBrandschutzzeichen}
              onChange={(val) => handlePvDefaultChange('AufkleberBrandschutzzeichen', val)}
            />
          </div>
        </div>

        {/* Rohrschelle */}
        <div>
          <SectionHeader title="Rohrschelle" />
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Rohrschelle Standard"
              value={pvDefaults.RohrschelleStandard}
              onChange={(val) => handlePvDefaultChange('RohrschelleStandard', val)}
            />
            <NumberInput
              label="Rohrschelle Groß"
              value={pvDefaults.RohrschelleGross}
              onChange={(val) => handlePvDefaultChange('RohrschelleGross', val)}
            />
          </div>
        </div>

        {/* Kabelverlegung */}
        <div>
          <SectionHeader icon={Cable} title="Kabelverlegung" />
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="InstallationsrohrOutdoor Wert"
              value={pvDefaults.InstallationsrohrOutdoor}
              onChange={(val) => handlePvDefaultChange('InstallationsrohrOutdoor', val)}
              step={0.1}
            />
            <NumberInput
              label="Kabelkanal Standard Wert"
              value={pvDefaults.KabelkanalStandard}
              onChange={(val) => handlePvDefaultChange('KabelkanalStandard', val)}
              step={0.1}
            />
            <NumberInput
              label="Kabelkanal Groß Wert"
              value={pvDefaults.KabelkanalGross}
              onChange={(val) => handlePvDefaultChange('KabelkanalGross', val)}
              step={0.1}
            />
            <NumberInput
              label="Muffe Outdoor Wert"
              value={pvDefaults.MuffeOutdoor}
              onChange={(val) => handlePvDefaultChange('MuffeOutdoor', val)}
            />
            <NumberInput
              label="Flexrohr Wert"
              value={pvDefaults.Flexrohr}
              onChange={(val) => handlePvDefaultChange('Flexrohr', val)}
              step={0.1}
            />
            <NumberInput
              label="Installationsrohr Wert"
              value={pvDefaults.Installationsrohr}
              onChange={(val) => handlePvDefaultChange('Installationsrohr', val)}
              step={0.1}
            />
          </div>
        </div>

        {/* Kabel */}
        <div>
          <SectionHeader icon={Cable} title="Kabel" />
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Kabellänge pro Gerät (m)"
              value={pvDefaults.defaultCableLength}
              onChange={(val) => handlePvDefaultChange('defaultCableLength', val || 10)}
              min={1}
              max={100}
              unit="m"
            />
            <NumberInput
              label="SchutzleiterPV pro Gerät (m)"
              value={pvDefaults.SchutzleiterPV}
              onChange={(val) => handlePvDefaultChange('SchutzleiterPV', val)}
              step={0.1}
              unit="m"
            />
            <NumberInput
              label="ErdungHES (m)"
              value={pvDefaults.ErdungHES}
              onChange={(val) => handlePvDefaultChange('ErdungHES', val)}
              step={0.1}
              unit="m"
            />
            <NumberInput
              label="Potentialausgleich HES-UK (m)"
              value={pvDefaults.PotentialausgleichHESUK}
              onChange={(val) => handlePvDefaultChange('PotentialausgleichHESUK', val)}
              step={0.1}
              unit="m"
            />
            <NumberInput
              label="PV-Kabel Wert (m)"
              value={pvDefaults.PvKabel}
              onChange={(val) => handlePvDefaultChange('PvKabel', val)}
              step={0.1}
              unit="m"
            />
            <NumberInput
              label="Kabelmanagement UK Wert"
              value={pvDefaults.KabelmanagementUK}
              onChange={(val) => handlePvDefaultChange('KabelmanagementUK', val)}
              step={0.1}
            />
            <NumberInput
              label="Adernleitung16mm²Blau"
              value={pvDefaults.Adernleitung16mm2Blau}
              onChange={(val) => handlePvDefaultChange('Adernleitung16mm2Blau', val)}
              step={0.1}
            />
            <NumberInput
              label="Adernleitung16mm²Schwarz"
              value={pvDefaults.Adernleitung16mm2Schwarz}
              onChange={(val) => handlePvDefaultChange('Adernleitung16mm2Schwarz', val)}
              step={0.1}
            />
            <NumberInput
              label="Adernleitung16mm²GrünGelb"
              value={pvDefaults.Adernleitung16mm2GruenGelb}
              onChange={(val) => handlePvDefaultChange('Adernleitung16mm2GruenGelb', val)}
              step={0.1}
            />
            <NumberInput
              label="Adernleitung10mm²Blau"
              value={pvDefaults.Adernleitung10mm2Blau}
              onChange={(val) => handlePvDefaultChange('Adernleitung10mm2Blau', val)}
              step={0.1}
            />
            <NumberInput
              label="Adernleitung10mm²Schwarz"
              value={pvDefaults.Adernleitung10mm2Schwarz}
              onChange={(val) => handlePvDefaultChange('Adernleitung10mm2Schwarz', val)}
              step={0.1}
            />
            <NumberInput
              label="Adernleitung10mm²GrünGelb"
              value={pvDefaults.Adernleitung10mm2GruenGelb}
              onChange={(val) => handlePvDefaultChange('Adernleitung10mm2GruenGelb', val)}
              step={0.1}
            />
            <NumberInput
              label="ErdungStaberder Value"
              value={pvDefaults.defaultErdungStaberderValue}
              onChange={(val) => handlePvDefaultChange('defaultErdungStaberderValue', val || 1)}
              min={1}
            />
          </div>
        </div>

        {/* Strombelastbarkeit Werte */}
        <div>
          <SectionHeader icon={Zap} title="Strombelastbarkeit Werte" />
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Strombelastbarkeit 1,5mm² (A)"
              value={pvDefaults.strombelastbarkeit15}
              onChange={(val) => handlePvDefaultChange('strombelastbarkeit15', val)}
              min={1}
              max={100}
              unit="A"
            />
            <NumberInput
              label="Strombelastbarkeit 2,5mm² (A)"
              value={pvDefaults.strombelastbarkeit25}
              onChange={(val) => handlePvDefaultChange('strombelastbarkeit25', val)}
              min={1}
              max={100}
              unit="A"
            />
            <NumberInput
              label="Strombelastbarkeit 4mm² (A)"
              value={pvDefaults.strombelastbarkeit4}
              onChange={(val) => handlePvDefaultChange('strombelastbarkeit4', val)}
              min={1}
              max={100}
              unit="A"
            />
            <NumberInput
              label="Strombelastbarkeit 6mm² (A)"
              value={pvDefaults.strombelastbarkeit6}
              onChange={(val) => handlePvDefaultChange('strombelastbarkeit6', val)}
              min={1}
              max={100}
              unit="A"
            />
            <NumberInput
              label="Strombelastbarkeit 10mm² (A)"
              value={pvDefaults.strombelastbarkeit10}
              onChange={(val) => handlePvDefaultChange('strombelastbarkeit10', val)}
              min={1}
              max={100}
              unit="A"
            />
            <NumberInput
              label="Strombelastbarkeit 16mm² (A)"
              value={pvDefaults.strombelastbarkeit16}
              onChange={(val) => handlePvDefaultChange('strombelastbarkeit16', val)}
              min={1}
              max={100}
              unit="A"
            />
          </div>
        </div>

        {/* Elektro */}
        <div>
          <SectionHeader icon={Zap} title="Elektro" />
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Aderendhülsen pro Gerät"
              value={pvDefaults.AderendhuelsenProGeraet}
              onChange={(val) => handlePvDefaultChange('AderendhuelsenProGeraet', val)}
            />
            <NumberInput
              label="Kabelschuh 6xM8 Anzahl"
              value={pvDefaults.Kabelschuh6M8}
              onChange={(val) => handlePvDefaultChange('Kabelschuh6M8', val)}
            />
            <NumberInput
              label="Kabelschuh 10xM6 pro Gerät"
              value={pvDefaults.Kabelschuh10M6}
              onChange={(val) => handlePvDefaultChange('Kabelschuh10M6', val)}
            />
            <NumberInput
              label="Kabelschuh 16xM6 pro Notstromlösung"
              value={pvDefaults.Kabelschuh16M6}
              onChange={(val) => handlePvDefaultChange('Kabelschuh16M6', val)}
            />
            <NumberInput
              label="Potentialausgleichsschiene"
              value={pvDefaults.Potentialausgleichsschiene}
              onChange={(val) => handlePvDefaultChange('Potentialausgleichsschiene', val)}
            />
            <NumberInput
              label="Hauptleitungsabzweigklemme"
              value={pvDefaults.Hauptleitungsabzweigklemme}
              onChange={(val) => handlePvDefaultChange('Hauptleitungsabzweigklemme', val)}
            />
            <NumberInput
              label="RJ45-Stecker"
              value={pvDefaults.RJ45Stecker}
              onChange={(val) => handlePvDefaultChange('RJ45Stecker', val)}
            />
            <NumberInput
              label="Sammelschienenklemme"
              value={pvDefaults.Sammelschienenklemme}
              onChange={(val) => handlePvDefaultChange('Sammelschienenklemme', val)}
            />
            <NumberInput
              label="Abdeckstreifen"
              value={pvDefaults.Abdeckstreifen}
              onChange={(val) => handlePvDefaultChange('Abdeckstreifen', val)}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default CalculationParamsSettings;
