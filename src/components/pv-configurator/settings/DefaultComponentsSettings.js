import React from 'react';
import { Package, Zap, Home, Cable, Wrench, Sun, Battery, Car, Cpu } from 'lucide-react';
import { CAT } from '../constants';

/**
 * Standard-Komponenten Einstellungen für den PV-Konfigurator
 * Ermöglicht die Auswahl von Standardmaterialien für verschiedene Kategorien
 */
const DefaultComponentsSettings = ({ pvDefaults, handlePvDefaultChange, materials }) => {

  // Hilfsfunktion für Material-Select
  const MaterialSelect = ({ label, value, onChange, categoryIds, filterFn }) => {
    let filteredMaterials = [];

    if (filterFn) {
      filteredMaterials = materials.filter(filterFn);
    } else if (Array.isArray(categoryIds)) {
      filteredMaterials = materials.filter(m => categoryIds.includes(m.categoryId));
    } else {
      filteredMaterials = materials.filter(m => m.categoryId === categoryIds);
    }

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Kein Standard</option>
          {filteredMaterials.map(m => (
            <option key={m.id} value={m.id}>
              {m.name} {m.description ? m.description : ''}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // Section Header Komponente
  const SectionHeader = ({ icon: Icon, title, color = 'blue' }) => (
    <div className="col-span-2">
      <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2 flex items-center gap-2">
        {Icon && <Icon className={`h-5 w-5 text-${color}-600`} />}
        {title}
      </h4>
    </div>
  );

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* PV Komponenten */}
        <SectionHeader icon={Sun} title="PV Komponenten" />

        <MaterialSelect
          label="PV-Modul"
          value={pvDefaults.defaultModule}
          onChange={(val) => handlePvDefaultChange('defaultModule', val)}
          categoryIds={CAT.MODULES}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dachtyp
          </label>
          <select
            value={pvDefaults.defaultRoofType || ''}
            onChange={(e) => handlePvDefaultChange('defaultRoofType', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Kein Standard</option>
            <option value="Ziegel">Ziegeldach</option>
            <option value="Trapez">Trapezblechdach</option>
            <option value="Flach">Flachdach</option>
          </select>
        </div>

        <MaterialSelect
          label="PV-Stecker Male"
          value={pvDefaults.defaultPvSteckerMale}
          onChange={(val) => handlePvDefaultChange('defaultPvSteckerMale', val)}
          categoryIds={CAT.CONNECTORS}
        />

        <MaterialSelect
          label="PV-Stecker Female"
          value={pvDefaults.defaultPvSteckerFemale}
          onChange={(val) => handlePvDefaultChange('defaultPvSteckerFemale', val)}
          categoryIds={CAT.CONNECTORS}
        />

        <MaterialSelect
          label="Smart Dongle-WLAN-FE"
          value={pvDefaults.defaultSmartDongle}
          onChange={(val) => handlePvDefaultChange('defaultSmartDongle', val)}
          categoryIds={CAT.SMART_DONGLE}
        />

        {/* Ziegeldach */}
        <SectionHeader icon={Home} title="Ziegeldach" />

        <MaterialSelect
          label="Montagesystem"
          value={pvDefaults.defaultPvMountingSystem}
          onChange={(val) => handlePvDefaultChange('defaultPvMountingSystem', val)}
          categoryIds={CAT.PV_MOUNTING}
        />

        <MaterialSelect
          label="Modulendklemmen"
          value={pvDefaults.defaultModulEndklemmen}
          onChange={(val) => handlePvDefaultChange('defaultModulEndklemmen', val)}
          categoryIds={CAT.CLAMPS}
        />

        <MaterialSelect
          label="Modulklemmen"
          value={pvDefaults.defaultModulMittelklemmen}
          onChange={(val) => handlePvDefaultChange('defaultModulMittelklemmen', val)}
          categoryIds={CAT.CLAMPS}
        />

        <MaterialSelect
          label="Profile"
          value={pvDefaults.defaultProfile}
          onChange={(val) => handlePvDefaultChange('defaultProfile', val)}
          categoryIds={CAT.PROFILES}
        />

        <MaterialSelect
          label="Standard Potentialausgleich"
          value={pvDefaults.defaultPotentialausgleich}
          onChange={(val) => handlePvDefaultChange('defaultPotentialausgleich', val)}
          categoryIds={CAT.POTENTIALAUSGLEICH}
        />

        <MaterialSelect
          label="Potentialausgleich UK-UK"
          value={pvDefaults.defaultPotentialausgleichUKUK}
          onChange={(val) => handlePvDefaultChange('defaultPotentialausgleichUKUK', val)}
          filterFn={(m) => m.categoryId === CAT.POTENTIALAUSGLEICH || (m.description && m.description.toLowerCase().includes('potentialausgleich'))}
        />

        {/* Befestigungsmaterial */}
        <SectionHeader icon={Wrench} title="Befestigungsmaterial" />

        <MaterialSelect
          label="BefestigungPotentialausgleich UK-UK"
          value={pvDefaults.defaultBefestigungPotentialausgleichUKUK}
          onChange={(val) => handlePvDefaultChange('defaultBefestigungPotentialausgleichUKUK', val)}
          categoryIds="6Solbg6r30Ms1esXD8Jn"
        />

        <MaterialSelect
          label="Befestigung Leistungsoptimierer"
          value={pvDefaults.defaultBefestigungLeistungsoptimierer}
          onChange={(val) => handlePvDefaultChange('defaultBefestigungLeistungsoptimierer', val)}
          categoryIds="6Solbg6r30Ms1esXD8Jn"
        />

        <MaterialSelect
          label="Dammstoffdübel"
          value={pvDefaults.defaultDammstoffduebel}
          onChange={(val) => handlePvDefaultChange('defaultDammstoffduebel', val)}
          categoryIds="dzWCk1eQz8uIFf71U5VR"
        />

        <MaterialSelect
          label="Kabelkanal Schrauben"
          value={pvDefaults.defaultKabelkanalSchrauben}
          onChange={(val) => handlePvDefaultChange('defaultKabelkanalSchrauben', val)}
          categoryIds="eFnOPVhYKeqBjNhq6Dm0"
        />

        <MaterialSelect
          label="Standard Kabelkanal Dübel"
          value={pvDefaults.defaultKabelkanalDuebel}
          onChange={(val) => handlePvDefaultChange('defaultKabelkanalDuebel', val)}
          categoryIds="dzWCk1eQz8uIFf71U5VR"
        />

        <MaterialSelect
          label="Standard PV-Geräte Schrauben"
          value={pvDefaults.defaultPvGeraeteSchrauben}
          onChange={(val) => handlePvDefaultChange('defaultPvGeraeteSchrauben', val)}
          categoryIds="NAuknAtWDNE89AM6btz8"
        />

        <MaterialSelect
          label="PV-Geräte Dübel"
          value={pvDefaults.defaultPvGeraeteDuebel}
          onChange={(val) => handlePvDefaultChange('defaultPvGeraeteDuebel', val)}
          categoryIds="dzWCk1eQz8uIFf71U5VR"
        />

        <MaterialSelect
          label="Schrauben Rohrschelle"
          value={pvDefaults.defaultSchraubenRohrschelle}
          onChange={(val) => handlePvDefaultChange('defaultSchraubenRohrschelle', val)}
          categoryIds="uILovgnrVbnz0i8D5lBx"
        />

        <MaterialSelect
          label="Dübel Rohrschelle"
          value={pvDefaults.defaultDuebelRohrschelle}
          onChange={(val) => handlePvDefaultChange('defaultDuebelRohrschelle', val)}
          categoryIds="dzWCk1eQz8uIFf71U5VR"
        />

        <MaterialSelect
          label="Dübel Gerüstanker"
          value={pvDefaults.defaultDuebelGeruestanker}
          onChange={(val) => handlePvDefaultChange('defaultDuebelGeruestanker', val)}
          categoryIds="dzWCk1eQz8uIFf71U5VR"
        />

        {/* Aufkleber Standardkomponenten */}
        <SectionHeader icon={Package} title="Aufkleber Standardkomponenten" />

        <MaterialSelect
          label="Aufkleber PV (Standard)"
          value={pvDefaults.defaultAufkleberPV}
          onChange={(val) => handlePvDefaultChange('defaultAufkleberPV', val)}
          categoryIds="zy6rEAiGDjyG0Ox3CBN8"
        />

        <MaterialSelect
          label="Aufkleber PV mit Speicher"
          value={pvDefaults.defaultAufkleberPVMitSpeicher}
          onChange={(val) => handlePvDefaultChange('defaultAufkleberPVMitSpeicher', val)}
          categoryIds="zy6rEAiGDjyG0Ox3CBN8"
        />

        <MaterialSelect
          label="Aufkleber PV mit Notstrom"
          value={pvDefaults.defaultAufkleberPVMitNotstrom}
          onChange={(val) => handlePvDefaultChange('defaultAufkleberPVMitNotstrom', val)}
          categoryIds="zy6rEAiGDjyG0Ox3CBN8"
        />

        {/* Rohrschelle Komponenten */}
        <SectionHeader title="Rohrschelle Komponenten" />

        <MaterialSelect
          label="Rohrschelle Standard"
          value={pvDefaults.defaultRohrschelleStandard}
          onChange={(val) => handlePvDefaultChange('defaultRohrschelleStandard', val)}
          categoryIds="Lby5LiXgEG5KJTo6NEia"
        />

        <MaterialSelect
          label="Rohrschelle Groß"
          value={pvDefaults.defaultRohrschelleGross}
          onChange={(val) => handlePvDefaultChange('defaultRohrschelleGross', val)}
          categoryIds="Lby5LiXgEG5KJTo6NEia"
        />

        <MaterialSelect
          label="Rohrschelle Outdoor"
          value={pvDefaults.defaultRohrschelleOutdoor}
          onChange={(val) => handlePvDefaultChange('defaultRohrschelleOutdoor', val)}
          categoryIds="Lby5LiXgEG5KJTo6NEia"
        />

        {/* Kabelverlegung */}
        <SectionHeader icon={Cable} title="Kabelverlegung" />

        <MaterialSelect
          label="Kabelmanagement"
          value={pvDefaults.defaultKabelmanagement}
          onChange={(val) => handlePvDefaultChange('defaultKabelmanagement', val)}
          categoryIds={CAT.KABELMANAGEMENT}
        />

        <MaterialSelect
          label="Installationsrohr"
          value={pvDefaults.defaultInstallationsrohr}
          onChange={(val) => handlePvDefaultChange('defaultInstallationsrohr', val)}
          categoryIds="Lby5LiXgEG5KJTo6NEia"
        />

        <MaterialSelect
          label="Flexrohr"
          value={pvDefaults.defaultFlexrohrStandard}
          onChange={(val) => handlePvDefaultChange('defaultFlexrohrStandard', val)}
          categoryIds="Lby5LiXgEG5KJTo6NEia"
        />

        <MaterialSelect
          label="Flexrohr Groß"
          value={pvDefaults.defaultFlexrohrGross}
          onChange={(val) => handlePvDefaultChange('defaultFlexrohrGross', val)}
          categoryIds="Lby5LiXgEG5KJTo6NEia"
        />

        <MaterialSelect
          label="InstallationsrohrOutdoor"
          value={pvDefaults.defaultInstallationsrohrOutdoor}
          onChange={(val) => handlePvDefaultChange('defaultInstallationsrohrOutdoor', val)}
          categoryIds="Lby5LiXgEG5KJTo6NEia"
        />

        <MaterialSelect
          label="Muffe Outdoor"
          value={pvDefaults.defaultMuffeOutdoor}
          onChange={(val) => handlePvDefaultChange('defaultMuffeOutdoor', val)}
          categoryIds="Lby5LiXgEG5KJTo6NEia"
        />

        <MaterialSelect
          label="Kabelkanal Standard"
          value={pvDefaults.defaultKabelkanalStandard}
          onChange={(val) => handlePvDefaultChange('defaultKabelkanalStandard', val)}
          categoryIds="Lby5LiXgEG5KJTo6NEia"
        />

        <MaterialSelect
          label="Kabelkanal Groß"
          value={pvDefaults.defaultKabelkanalGross}
          onChange={(val) => handlePvDefaultChange('defaultKabelkanalGross', val)}
          categoryIds="Lby5LiXgEG5KJTo6NEia"
        />

        {/* Kabel Standardkomponenten */}
        <SectionHeader icon={Cable} title="Kabel Standardkomponenten" />

        <MaterialSelect
          label="Kabel 5x1,5mm²"
          value={pvDefaults.defaultKabel5x15}
          onChange={(val) => handlePvDefaultChange('defaultKabel5x15', val)}
          categoryIds={[CAT.CABLES, '9wGooeSxShvDIs2bJAwF']}
        />

        <MaterialSelect
          label="Kabel 5x2,5mm²"
          value={pvDefaults.defaultKabel5x25}
          onChange={(val) => handlePvDefaultChange('defaultKabel5x25', val)}
          categoryIds={[CAT.CABLES, '9wGooeSxShvDIs2bJAwF']}
        />

        <MaterialSelect
          label="Kabel 5x4mm²"
          value={pvDefaults.defaultKabel5x4}
          onChange={(val) => handlePvDefaultChange('defaultKabel5x4', val)}
          categoryIds={[CAT.CABLES, '9wGooeSxShvDIs2bJAwF']}
        />

        <MaterialSelect
          label="Kabel 5x6mm²"
          value={pvDefaults.defaultKabel5x6}
          onChange={(val) => handlePvDefaultChange('defaultKabel5x6', val)}
          categoryIds={[CAT.CABLES, '9wGooeSxShvDIs2bJAwF']}
        />

        <MaterialSelect
          label="Kabel 5x10mm²"
          value={pvDefaults.defaultKabel5x10}
          onChange={(val) => handlePvDefaultChange('defaultKabel5x10', val)}
          categoryIds={[CAT.CABLES, '9wGooeSxShvDIs2bJAwF']}
        />

        <MaterialSelect
          label="Kabel 5x16mm²"
          value={pvDefaults.defaultKabel5x16}
          onChange={(val) => handlePvDefaultChange('defaultKabel5x16', val)}
          categoryIds={[CAT.CABLES, '9wGooeSxShvDIs2bJAwF']}
        />

        <MaterialSelect
          label="Adernleitung 10mm² Blau"
          value={pvDefaults.defaultAdernleitung10mm2Blau}
          onChange={(val) => handlePvDefaultChange('defaultAdernleitung10mm2Blau', val)}
          categoryIds="fVXEVA2ecyaSx72cgafl"
        />

        <MaterialSelect
          label="Adernleitung 10mm² Schwarz"
          value={pvDefaults.defaultAdernleitung10mm2Schwarz}
          onChange={(val) => handlePvDefaultChange('defaultAdernleitung10mm2Schwarz', val)}
          categoryIds="fVXEVA2ecyaSx72cgafl"
        />

        <MaterialSelect
          label="Adernleitung 10mm² Grün/Gelb"
          value={pvDefaults.defaultAdernleitung10mm2GruenGelb}
          onChange={(val) => handlePvDefaultChange('defaultAdernleitung10mm2GruenGelb', val)}
          categoryIds="fVXEVA2ecyaSx72cgafl"
        />

        <MaterialSelect
          label="Adernleitung 16mm² Blau"
          value={pvDefaults.defaultAdernleitung16mm2Blau}
          onChange={(val) => handlePvDefaultChange('defaultAdernleitung16mm2Blau', val)}
          categoryIds="fVXEVA2ecyaSx72cgafl"
        />

        <MaterialSelect
          label="Adernleitung 16mm² Schwarz"
          value={pvDefaults.defaultAdernleitung16mm2Schwarz}
          onChange={(val) => handlePvDefaultChange('defaultAdernleitung16mm2Schwarz', val)}
          categoryIds="fVXEVA2ecyaSx72cgafl"
        />

        <MaterialSelect
          label="Adernleitung 16mm² Grün/Gelb"
          value={pvDefaults.defaultAdernleitung16mm2GruenGelb}
          onChange={(val) => handlePvDefaultChange('defaultAdernleitung16mm2GruenGelb', val)}
          categoryIds="fVXEVA2ecyaSx72cgafl"
        />

        <MaterialSelect
          label="PV-Kabel"
          value={pvDefaults.defaultPvKabel}
          onChange={(val) => handlePvDefaultChange('defaultPvKabel', val)}
          filterFn={(m) => m.categoryId === 'b2Bf0YkhAA6x0T65W9hZ' || (m.description && m.description.toLowerCase().includes('pv') && m.description.toLowerCase().includes('kabel'))}
        />

        <MaterialSelect
          label="ErdungHES"
          value={pvDefaults.defaultErdungHES}
          onChange={(val) => handlePvDefaultChange('defaultErdungHES', val)}
          categoryIds={[CAT.CABLES, '9wGooeSxShvDIs2bJAwF']}
        />

        <MaterialSelect
          label="Potentialausgleich HES-UK"
          value={pvDefaults.defaultPotentialausgleichHESUK}
          onChange={(val) => handlePvDefaultChange('defaultPotentialausgleichHESUK', val)}
          categoryIds="9wGooeSxShvDIs2bJAwF"
        />

        <MaterialSelect
          label="SchutzleiterPV"
          value={pvDefaults.defaultSchutzleiterPV}
          onChange={(val) => handlePvDefaultChange('defaultSchutzleiterPV', val)}
          categoryIds={[CAT.CABLES, '9wGooeSxShvDIs2bJAwF']}
        />

        <MaterialSelect
          label="ErdungStaberder"
          value={pvDefaults.defaultErdungStaberder}
          onChange={(val) => handlePvDefaultChange('defaultErdungStaberder', val)}
          categoryIds="9wGooeSxShvDIs2bJAwF"
        />

        {/* Sicherung Standardkomponenten */}
        <SectionHeader icon={Zap} title="Sicherung Standardkomponenten" />

        <MaterialSelect
          label="Sicherung 16A"
          value={pvDefaults.defaultSicherung16A}
          onChange={(val) => handlePvDefaultChange('defaultSicherung16A', val)}
          categoryIds={CAT.CIRCUIT_BREAKERS}
        />

        <MaterialSelect
          label="Sicherung 20A"
          value={pvDefaults.defaultSicherung20A}
          onChange={(val) => handlePvDefaultChange('defaultSicherung20A', val)}
          categoryIds={CAT.CIRCUIT_BREAKERS}
        />

        <MaterialSelect
          label="Sicherung 25A"
          value={pvDefaults.defaultSicherung25A}
          onChange={(val) => handlePvDefaultChange('defaultSicherung25A', val)}
          categoryIds={CAT.CIRCUIT_BREAKERS}
        />

        <MaterialSelect
          label="Sicherung 32A"
          value={pvDefaults.defaultSicherung32A}
          onChange={(val) => handlePvDefaultChange('defaultSicherung32A', val)}
          categoryIds={CAT.CIRCUIT_BREAKERS}
        />

        <MaterialSelect
          label="Sicherung 50A"
          value={pvDefaults.defaultSicherung50A}
          onChange={(val) => handlePvDefaultChange('defaultSicherung50A', val)}
          categoryIds={CAT.CIRCUIT_BREAKERS}
        />

        <MaterialSelect
          label="Sicherung 63A"
          value={pvDefaults.defaultSicherung63A}
          onChange={(val) => handlePvDefaultChange('defaultSicherung63A', val)}
          categoryIds={CAT.CIRCUIT_BREAKERS}
        />

        <MaterialSelect
          label="FI Schutzschalter Wallbox"
          value={pvDefaults.defaultFehlerstromschutzschalterWallbox}
          onChange={(val) => handlePvDefaultChange('defaultFehlerstromschutzschalterWallbox', val)}
          categoryIds={CAT.RCDS}
        />

        {/* Elektro */}
        <SectionHeader icon={Zap} title="Elektro" />

        <MaterialSelect
          label="Potentialausgleichsschiene"
          value={pvDefaults.defaultPotentialausgleichsschiene}
          onChange={(val) => handlePvDefaultChange('defaultPotentialausgleichsschiene', val)}
          categoryIds="YUmVpnyibpJVq1Eo3Rf2"
        />

        <MaterialSelect
          label="Hauptleitungsabzweigklemme"
          value={pvDefaults.defaultHauptleitungsabzweigklemme}
          onChange={(val) => handlePvDefaultChange('defaultHauptleitungsabzweigklemme', val)}
          categoryIds="YUmVpnyibpJVq1Eo3Rf2"
        />

        <MaterialSelect
          label="RJ45-Stecker"
          value={pvDefaults.defaultRJ45Stecker}
          onChange={(val) => handlePvDefaultChange('defaultRJ45Stecker', val)}
          categoryIds="YUmVpnyibpJVq1Eo3Rf2"
        />

        <MaterialSelect
          label="Sammelschienenklemme"
          value={pvDefaults.defaultSammelschienenklemme}
          onChange={(val) => handlePvDefaultChange('defaultSammelschienenklemme', val)}
          categoryIds="YUmVpnyibpJVq1Eo3Rf2"
        />

        <MaterialSelect
          label="Abdeckstreifen"
          value={pvDefaults.defaultAbdeckstreifen}
          onChange={(val) => handlePvDefaultChange('defaultAbdeckstreifen', val)}
          categoryIds="YUmVpnyibpJVq1Eo3Rf2"
        />

        <MaterialSelect
          label="Kabelschuh 6xM8"
          value={pvDefaults.defaultKabelschuh6M8}
          onChange={(val) => handlePvDefaultChange('defaultKabelschuh6M8', val)}
          categoryIds="YUmVpnyibpJVq1Eo3Rf2"
        />

        <MaterialSelect
          label="Kabelschuh 10xM6"
          value={pvDefaults.defaultKabelschuh10M6}
          onChange={(val) => handlePvDefaultChange('defaultKabelschuh10M6', val)}
          categoryIds="YUmVpnyibpJVq1Eo3Rf2"
        />

        <MaterialSelect
          label="Kabelschuh 16xM6"
          value={pvDefaults.defaultKabelschuh16M6}
          onChange={(val) => handlePvDefaultChange('defaultKabelschuh16M6', val)}
          categoryIds="YUmVpnyibpJVq1Eo3Rf2"
        />

        <MaterialSelect
          label="Aderendhülsen 10mm²"
          value={pvDefaults.defaultAderendhuelsen10mm2}
          onChange={(val) => handlePvDefaultChange('defaultAderendhuelsen10mm2', val)}
          categoryIds={CAT.ADERENDHUESEN}
        />

        <MaterialSelect
          label="Aderendhülsen 16mm²"
          value={pvDefaults.defaultAderendhuelsen16mm2}
          onChange={(val) => handlePvDefaultChange('defaultAderendhuelsen16mm2', val)}
          categoryIds={CAT.ADERENDHUESEN}
        />

      </div>
    </div>
  );
};

export default DefaultComponentsSettings;
