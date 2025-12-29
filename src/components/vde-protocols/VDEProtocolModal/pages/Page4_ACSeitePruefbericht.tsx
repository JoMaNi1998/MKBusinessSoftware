import React, { ChangeEvent } from 'react';
import { PageHeader, Section, CheckboxField } from '../components';
import { getAutoAcRowDefaults } from '../utils';
import { PageProps, VDEData } from '../types';

const Page4_ACSeitePruefbericht = React.memo(function Page4_ACSeitePruefbericht({
  vdeData,
  handleVdeDataChange,
}: PageProps) {
  const networkTypes = ['TNC', 'TNS', 'TNCS', 'TT', 'IT'] as const;

  const formatNetworkLabel = (tn: string): string =>
    tn.replace('TNCS', 'TN-C-S').replace('TNC', 'TN-C').replace('TNS', 'TN-S');

  return (
    <div
      className="page bg-white p-6 min-h-[297mm] w-[210mm] mx-auto"
      style={{ fontSize: '10px' }}
    >
      <PageHeader
        title="Prüfbericht der elektrischen Prüfung der AC-Seite der PV-Anlage"
        subtitle="gemäß ZVEH-Vorlage"
        customerName={vdeData.projectName || ''}
      />

      <div className="mb-4">
        <div className="flex items-center mb-2">
          <span className="font-bold mr-4">Prüfung nach:</span>
          <CheckboxField
            small
            field="testAccordingVDE0100600"
            label="DIN VDE 0100-600"
            checked={vdeData.testAccordingVDE0100600}
            onChange={handleVdeDataChange}
          />
          <div className="w-3" />
          <CheckboxField
            small
            field="testAccordingVDE0105100"
            label="DIN VDE 0105-100"
            checked={vdeData.testAccordingVDE0105100}
            onChange={handleVdeDataChange}
          />
        </div>

        <div className="flex items-center mb-2">
          <span className="font-bold mr-4">Netz</span>
          <input
            type="number"
            value={vdeData.networkVoltage1 ?? 230}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleVdeDataChange('networkVoltage1', e.target.value)
            }
            className="w-12 px-1 mr-1 text-xs border-b border-gray-400 bg-transparent"
          />
          <span className="mr-2">/</span>
          <input
            type="number"
            value={vdeData.networkVoltage2 ?? 400}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleVdeDataChange('networkVoltage2', e.target.value)
            }
            className="w-12 px-1 mr-2 text-xs border-b border-gray-400 bg-transparent"
          />
          <span className="mr-4">V</span>

          <div className="flex items-center space-x-4">
            {networkTypes.map((tn) => (
              <CheckboxField
                key={tn}
                small
                field={`network${tn}`}
                label={formatNetworkLabel(tn)}
                checked={(vdeData as VDEData)[`network${tn}`] as boolean}
                onChange={handleVdeDataChange}
              />
            ))}
          </div>
        </div>
      </div>

      <Section title="Besichtigen">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <CheckboxField
              small
              field="selectionOfEquipment"
              label="Auswahl der Betriebsmittel"
              checked={vdeData.selectionOfEquipment}
              onChange={handleVdeDataChange}
            />
            <CheckboxField
              small
              field="protectionAgainstDirectContact"
              label="Schutz gegen direktes Berühren"
              checked={vdeData.protectionAgainstDirectContact}
              onChange={handleVdeDataChange}
            />
            <CheckboxField
              small
              field="cablesLinesbusbars"
              label="Kabel, Leitungen, Stromschienen"
              checked={vdeData.cablesLinesbusbars}
              onChange={handleVdeDataChange}
            />
          </div>
          <div>
            <CheckboxField
              small
              field="circuitIdentification"
              label="Kennzeichnung Stromkreis, Betriebsmittel"
              checked={vdeData.circuitIdentification}
              onChange={handleVdeDataChange}
            />
            <CheckboxField
              small
              field="nPeIdentification"
              label="Kennzeichnung N- und PE-Leiter"
              checked={vdeData.nPeIdentification}
              onChange={handleVdeDataChange}
            />
            <CheckboxField
              small
              field="protectionMonitoringDevices"
              label="Schutz- und Überwachungseinrichtungen"
              checked={vdeData.protectionMonitoringDevices}
              onChange={handleVdeDataChange}
            />
          </div>
          <div>
            <CheckboxField
              small
              field="mainEquipotentialBonding"
              label="Hauptpotentialausgleich"
              checked={vdeData.mainEquipotentialBonding}
              onChange={handleVdeDataChange}
            />
            <CheckboxField
              small
              field="conductorConnections"
              label="Leiterverbindung"
              checked={vdeData.conductorConnections}
              onChange={handleVdeDataChange}
            />
            <CheckboxField
              small
              field="isolatingDevices"
              label="Trenn- und Schaltgeräte"
              checked={vdeData.isolatingDevices}
              onChange={handleVdeDataChange}
            />
          </div>
        </div>
      </Section>

      <Section title="Erproben">
        <div className="grid grid-cols-2 gap-8">
          <CheckboxField
            small
            field="systemFunctionTest"
            label="Funktionsprüfung der Anlage"
            checked={vdeData.systemFunctionTest}
            onChange={handleVdeDataChange}
          />
          <CheckboxField
            small
            field="rcdTest"
            label="FI-Schutzschalter (RCD) / wenn vorhanden"
            checked={vdeData.rcdTest}
            onChange={handleVdeDataChange}
          />
        </div>
      </Section>

      <Section title="Messen">
        <table className="w-full border-collapse border border-gray-400 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-1 text-left" colSpan={2}>
                Stromkreis
              </th>
              <th className="border p-1 text-left" colSpan={2}>
                Leitung/Kabel
              </th>
              <th className="border p-1 text-left" colSpan={3}>
                Überstrom-Schutzeinrichtung
              </th>
              <th className="border p-1 text-left">Riso (MΩ)</th>
              <th className="border p-1 text-left" colSpan={5}>
                Fehlerstrom-Schutzeinrichtung (RCD)
              </th>
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
                  <CheckboxField
                    small
                    field="measurementWithoutLoad"
                    label="ohne"
                    checked={vdeData.measurementWithoutLoad}
                    onChange={handleVdeDataChange}
                  />
                  <CheckboxField
                    small
                    field="measurementWithLoad"
                    label="mit Verbraucher"
                    checked={vdeData.measurementWithLoad}
                    onChange={handleVdeDataChange}
                  />
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
                      value={((vdeData as VDEData)[`ac_row_${i}_nr`] as string) ?? auto.nr}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleVdeDataChange(`ac_row_${i}_nr`, e.target.value)
                      }
                    />
                  </td>
                  {/* Zielbezeichnung */}
                  <td className="border p-1 h-6">
                    <input
                      className="w-full bg-transparent text-xs"
                      value={
                        ((vdeData as VDEData)[`ac_row_${i}_designation`] as string) ??
                        auto.designation
                      }
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleVdeDataChange(`ac_row_${i}_designation`, e.target.value)
                      }
                    />
                  </td>
                  {/* Typ */}
                  <td className="border p-1 h-6">
                    <input
                      className="w-full bg-transparent text-xs"
                      value={
                        ((vdeData as VDEData)[`ac_row_${i}_cableType`] as string) ?? auto.cableType
                      }
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleVdeDataChange(`ac_row_${i}_cableType`, e.target.value)
                      }
                    />
                  </td>
                  {/* Leiter Anzahl × Querschnitt */}
                  <td className="border p-1 h-6">
                    <input
                      className="w-full bg-transparent text-xs"
                      value={
                        ((vdeData as VDEData)[`ac_row_${i}_cableInfo`] as string) ?? auto.cableInfo
                      }
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleVdeDataChange(`ac_row_${i}_cableInfo`, e.target.value)
                      }
                    />
                  </td>
                  {/* Art */}
                  <td className="border p-1 h-6">
                    <input
                      className="w-full bg-transparent text-xs"
                      value={
                        ((vdeData as VDEData)[`ac_row_${i}_breakerType`] as string) ??
                        auto.breakerType
                      }
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleVdeDataChange(`ac_row_${i}_breakerType`, e.target.value)
                      }
                    />
                  </td>
                  {/* In (A) */}
                  <td className="border p-1 h-6">
                    <input
                      className="w-full bg-transparent text-xs"
                      value={
                        ((vdeData as VDEData)[`ac_row_${i}_breakerCurrent`] as string) ??
                        auto.breakerCurrent
                      }
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleVdeDataChange(`ac_row_${i}_breakerCurrent`, e.target.value)
                      }
                    />
                  </td>
                  {/* Zs (Ω) */}
                  <td className="border p-1 h-6">
                    <input
                      className="w-full bg-transparent text-xs"
                      value={((vdeData as VDEData)[`ac_row_${i}_zs`] as string) ?? ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleVdeDataChange(`ac_row_${i}_zs`, e.target.value)
                      }
                    />
                  </td>
                  {/* ohne/mit Verbraucher – Checkboxen sind global */}
                  <td className="border p-1 h-6" />
                  {/* RCD In (A) */}
                  <td className="border p-1 h-6">
                    <input
                      className="w-full bg-transparent text-xs"
                      value={((vdeData as VDEData)[`ac_row_${i}_rcdIn`] as string) ?? auto.rcdIn}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleVdeDataChange(`ac_row_${i}_rcdIn`, e.target.value)
                      }
                    />
                  </td>
                  {/* RCD IΔn (mA) */}
                  <td className="border p-1 h-6">
                    <input
                      className="w-full bg-transparent text-xs"
                      value={((vdeData as VDEData)[`ac_row_${i}_rcdIdn`] as string) ?? auto.rcdIdn}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleVdeDataChange(`ac_row_${i}_rcdIdn`, e.target.value)
                      }
                    />
                  </td>
                  {/* Imess / tA / Umess */}
                  {(['rcdImess', 'rcdTa', 'uMess'] as const).map((k, j) => (
                    <td key={j} className="border p-1 h-6">
                      <input
                        className="w-full bg-transparent text-xs"
                        value={((vdeData as VDEData)[`ac_row_${i}_${k}`] as string) ?? ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleVdeDataChange(`ac_row_${i}_${k}`, e.target.value)
                        }
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
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleVdeDataChange('protectiveConductorContinuity', e.target.checked)
            }
            className="mr-4"
          />
          <span className="text-xs mr-4">Erdungswiderstand Re</span>
          <input
            type="text"
            value={vdeData.earthingResistance ?? ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleVdeDataChange('earthingResistance', e.target.value)
            }
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

export default Page4_ACSeitePruefbericht;
