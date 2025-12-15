import React from 'react';
import { InputField, CheckboxField } from '../components';

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
        <h3 className="font-bold mb-2">PV-Wechselrichter</h3>
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
        <h3 className="font-bold mb-4">Einspeise-Stromzähler</h3>
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
            label="Die PV-Anlage entspricht den anerkannten Regeln der Elektrotechnik"
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

export default Page1_Anlagenuebersicht;
