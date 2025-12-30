import React, { useMemo } from 'react';
import type { VDEData, InverterConfig } from '@components/vde-protocols/VDEProtocolModal/types';
import { MobileSection, MobileInputField, MobileCheckbox } from './VDEMobileComponents';

interface VDEMobilePageProps {
  vdeData: VDEData;
  handleVdeDataChange: (field: string, value: unknown) => void;
}

interface InverterWithMeta extends InverterConfig {
  originalIndex: number;
  instanceIndex: number;
  globalIndex: number;
}

/**
 * VDEMobilePage5 - PV-Generator Pruefbericht (Mobile)
 *
 * Vereinfachte Version fuer Mobile:
 * - Zeigt Wechselrichter-Infos
 * - String-Messungen (Uoc, Isc)
 * - Isolationswiderstand
 */
const VDEMobilePage5: React.FC<VDEMobilePageProps> = ({
  vdeData,
  handleVdeDataChange
}) => {
  // Wechselrichter aus Konfiguration oder manuell
  const inverters: InverterWithMeta[] = useMemo(() => {
    const list: InverterWithMeta[] = [];
    const cfg = vdeData.projectConfig?.inverters ?? [];

    cfg.forEach((inv, idx) => {
      for (let i = 0; i < (inv.quantity ?? 0); i++) {
        list.push({
          ...inv,
          originalIndex: idx,
          instanceIndex: i,
          globalIndex: list.length,
          strings: inv.strings ?? []
        });
      }
    });

    // Fallback wenn keine Konfiguration
    if (list.length === 0) {
      const count = parseInt(String(vdeData.inverterCount ?? '1'), 10) || 1;
      const stringConfig = vdeData.strings ?? [];
      for (let i = 0; i < count; i++) {
        list.push({
          type: ((vdeData as VDEData)[`inverterType${i + 1}`] as string) || vdeData.inverterType || 'WR',
          manufacturer: vdeData.inverterManufacturer || '',
          quantity: 1,
          originalIndex: i,
          instanceIndex: 0,
          globalIndex: i,
          strings: stringConfig.length ? stringConfig : [{ stringName: 'String 1', moduleCount: 0 }]
        });
      }
    }

    return list;
  }, [vdeData]);

  return (
    <div className="p-4 space-y-4">
      {/* Info-Hinweis */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <p className="text-sm text-blue-700">
          Trage hier die Messwerte fuer jeden Wechselrichter und dessen Strings ein.
        </p>
      </div>

      {/* Fuer jeden Wechselrichter */}
      {inverters.map((inv, invIdx) => {
        const strings = inv.strings ?? [];
        const invType = inv.description || `${inv.manufacturer ?? ''} ${inv.type ?? ''}`.trim() || `Wechselrichter ${invIdx + 1}`;

        return (
          <MobileSection key={invIdx} title={`WR ${invIdx + 1}: ${invType}`}>
            {/* WR Grunddaten */}
            <MobileInputField
              label="Marke/Modell"
              value={(vdeData as VDEData)[`inverterBrandModel_${invIdx}`] as string || invType}
              onChange={(val) => handleVdeDataChange(`inverterBrandModel_${invIdx}`, val)}
              placeholder="z.B. Huawei SUN2000-10KTL-M1"
            />

            <MobileCheckbox
              label="Bestimmungsgemaesse WR-Funktion geprueft"
              checked={((vdeData as VDEData)[`inverterProperFunction_${invIdx}`] as boolean) ?? true}
              onChange={(val) => handleVdeDataChange(`inverterProperFunction_${invIdx}`, val)}
            />

            {/* Strings */}
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 mb-2">
                String-Messungen ({strings.length} Strings)
              </p>

              {strings.length > 0 ? (
                strings.map((str, strIdx) => {
                  const stringName = str.stringName || str.name || `String ${strIdx + 1}`;
                  const gIdx = strIdx + 1;

                  return (
                    <div key={strIdx} className="p-3 bg-gray-50 rounded-lg mb-2">
                      <p className="text-xs font-medium text-gray-600 mb-2">
                        {stringName} ({str.moduleCount || '?'} Module)
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        <MobileInputField
                          label="Uoc gemessen (V)"
                          type="number"
                          value={(vdeData as VDEData)[`stringmeasurementUoc_${invIdx}_${gIdx}`] as string}
                          onChange={(val) => handleVdeDataChange(`stringmeasurementUoc_${invIdx}_${gIdx}`, val)}
                          placeholder="z.B. 450"
                        />
                        <MobileInputField
                          label="Isc gemessen (A)"
                          type="number"
                          value={(vdeData as VDEData)[`stringmeasurementIsc_${invIdx}_${gIdx}`] as string}
                          onChange={(val) => handleVdeDataChange(`stringmeasurementIsc_${invIdx}_${gIdx}`, val)}
                          placeholder="z.B. 11.5"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <MobileInputField
                          label="Polaritaet"
                          value={(vdeData as VDEData)[`stringPolarityControl_${invIdx}_${gIdx}`] as string || 'i.O'}
                          onChange={(val) => handleVdeDataChange(`stringPolarityControl_${invIdx}_${gIdx}`, val)}
                          placeholder="i.O"
                        />
                        <MobileInputField
                          label="Isolation (+)(-) Erde (MOhm)"
                          value={(vdeData as VDEData)[`stringpositiveNegativeElectrode_${invIdx}_${gIdx}`] as string}
                          onChange={(val) => handleVdeDataChange(`stringpositiveNegativeElectrode_${invIdx}_${gIdx}`, val)}
                          placeholder="> 40"
                        />
                      </div>

                      <MobileInputField
                        label="Pruefspannung (V)"
                        type="number"
                        value={(vdeData as VDEData)[`stringtestVoltage_${invIdx}_${gIdx}`] as string || '1000'}
                        onChange={(val) => handleVdeDataChange(`stringtestVoltage_${invIdx}_${gIdx}`, val)}
                        placeholder="1000"
                        className="mt-2"
                      />
                    </div>
                  );
                })
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-sm">
                  Keine Strings konfiguriert
                </div>
              )}
            </div>

            {/* Schnell-Eingabe fuer 1-2 Strings wenn keine Konfiguration */}
            {strings.length === 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Manuelle String-Eingabe
                </p>
                {[1, 2].map((strIdx) => (
                  <div key={strIdx} className="p-3 bg-gray-50 rounded-lg mb-2">
                    <p className="text-xs font-medium text-gray-600 mb-2">String {strIdx}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <MobileInputField
                        label="Uoc (V)"
                        type="number"
                        value={(vdeData as VDEData)[`stringmeasurementUoc_${invIdx}_${strIdx}`] as string}
                        onChange={(val) => handleVdeDataChange(`stringmeasurementUoc_${invIdx}_${strIdx}`, val)}
                        placeholder="V"
                      />
                      <MobileInputField
                        label="Isc (A)"
                        type="number"
                        value={(vdeData as VDEData)[`stringmeasurementIsc_${invIdx}_${strIdx}`] as string}
                        onChange={(val) => handleVdeDataChange(`stringmeasurementIsc_${invIdx}_${strIdx}`, val)}
                        placeholder="A"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <MobileInputField
                        label="Polaritaet"
                        value={(vdeData as VDEData)[`stringPolarityControl_${invIdx}_${strIdx}`] as string || 'i.O'}
                        onChange={(val) => handleVdeDataChange(`stringPolarityControl_${invIdx}_${strIdx}`, val)}
                        placeholder="i.O"
                      />
                      <MobileInputField
                        label="Isolation (MOhm)"
                        value={(vdeData as VDEData)[`stringpositiveNegativeElectrode_${invIdx}_${strIdx}`] as string}
                        onChange={(val) => handleVdeDataChange(`stringpositiveNegativeElectrode_${invIdx}_${strIdx}`, val)}
                        placeholder="> 40"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </MobileSection>
        );
      })}

      {/* Leerer Zustand */}
      {inverters.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <p className="text-gray-500">Keine Wechselrichter konfiguriert</p>
          <p className="text-xs text-gray-400 mt-1">
            Pruefe die Anlagenuebersicht auf Seite 1
          </p>
        </div>
      )}
    </div>
  );
};

export default VDEMobilePage5;
