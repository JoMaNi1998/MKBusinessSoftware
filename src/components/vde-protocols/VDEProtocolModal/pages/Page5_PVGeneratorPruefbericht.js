import React, { useMemo } from 'react';
import { PageHeader } from '../components';
import { SPEC } from '../constants';
import { getModuleSpec, findMaterialById } from '../utils';

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
      { label: 'DC-Überspannungsschutz', field: 'dcOvervoltageProtection', spec: SPEC.INV.SPD_DC },
      { label: 'AC-Überspannungsschutz', field: 'acOvervoltageProtection', spec: SPEC.INV.SPD_AC },
      { label: 'Fehlerstromüberwachung', field: 'residualCurrentMonitoring', spec: SPEC.INV.RCM },
      { label: 'AC-Überstromschutz', field: 'acOvercurrentProtection', spec: SPEC.INV.AC_OC },
      { label: 'AC-Kurzschlussschutz', field: 'acShortCircuitProtection', spec: SPEC.INV.AC_SC },
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
        title="Prüfbericht der elektrischen Prüfung des PV-Generators"
        subtitle="gemäß VDE 0126-23 (DIN EN 62446)"
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
              <td className="border p-2 font-semibold bg-gray-100">Bestimmungsgemäße WR-Funktion</td>
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
              <td className="border p-1 font-semibold bg-gray-50 w-20">PV-Generator</td>
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
                    PV-Generator-Parameter
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

export default Page5_PVGeneratorPruefbericht;
