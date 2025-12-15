/**
 * SummaryStep - Schritt 6: Zusammenfassung & BOM
 */

import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

const SummaryStep = ({
  calculatedBOM,
  setCalculatedBOM,
  warnings,
  baseBOMWithWarnings,
  materialsById,
  resetBOMToRecommended,
  setShowAddMaterialModal,
}) => {
  // Gruppiere BOM-Items nach Typ
  const configuredItems = calculatedBOM
    .map((item, index) => ({ ...item, originalIndex: index }))
    .filter(item => item.isConfigured);
  const autoItems = calculatedBOM
    .map((item, index) => ({ ...item, originalIndex: index }))
    .filter(item => !item.isConfigured && !item.isManual);
  const manualItems = calculatedBOM
    .map((item, index) => ({ ...item, originalIndex: index }))
    .filter(item => item.isManual);

  const renderTable = (items, title, bgColor, borderColor) => {
    if (items.length === 0) return null;

    return (
      <div className={`border ${borderColor} rounded-lg overflow-hidden mb-4`}>
        <div className={`${bgColor} px-4 py-2 border-b ${borderColor}`}>
          <h4 className="font-semibold text-gray-800 text-sm flex items-center">
            {title}
            <span className="ml-2 text-xs font-normal text-gray-500">({items.length} Positionen)</span>
          </h4>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Material
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Anzahl
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                Aktion
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={`${item.materialID}-${item.originalIndex}`}>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  <div className="flex items-center space-x-2">
                    <span>{materialsById.get(item.materialID)?.description || item.description}</span>
                    {item.category && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        {item.category}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const newQty = Math.max(1, parseInt(e.target.value) || 1);
                      const idx = item.originalIndex;
                      setCalculatedBOM((prev) => {
                        const next = [...prev];
                        next[idx] = { ...prev[idx], quantity: newQty };
                        return next;
                      });
                    }}
                    className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center">
                  <button
                    onClick={() => {
                      const idx = item.originalIndex;
                      setCalculatedBOM((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Position entfernen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const allWarnings = [...new Set([...(warnings || []), ...(baseBOMWithWarnings?.warnings || [])])];

  return (
    <div className="space-y-6">
      {/* Warnungen */}
      {allWarnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Warnungen</h3>
              <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                {allWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* BOM Tabelle */}
      {calculatedBOM.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Stückliste</h3>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={resetBOMToRecommended}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                title="BOM auf aktuelle Empfehlungen zurücksetzen"
              >
                Neu berechnen
              </button>
              <button
                type="button"
                onClick={() => setShowAddMaterialModal(true)}
                className="px-3 py-2 text-sm bg-primary-600 text-white border border-transparent rounded hover:bg-primary-700"
                title="Material manuell hinzufügen"
              >
                + Material hinzufügen
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {renderTable(configuredItems, 'Konfigurierte Komponenten', 'bg-blue-50', 'border-blue-200')}
            {renderTable(autoItems, 'Automatisch berechnetes Material', 'bg-gray-50', 'border-gray-200')}
            {renderTable(manualItems, 'Manuell hinzugefügt', 'bg-green-50', 'border-green-200')}
          </div>
        </>
      ) : (
        <p className="text-gray-500">Keine Materialien berechnet.</p>
      )}
    </div>
  );
};

export default SummaryStep;
