import React, { useMemo } from 'react';
import { Euro, Package } from 'lucide-react';
import { formatCurrency } from '@utils';
import type { ExtendedBooking } from '@app-types/contexts/booking.types';

interface MaterialCostSummary {
  materialID: string;
  materialName: string;
  description?: string;
  totalQuantity: number;
  avgPricePerUnit: number;
  totalCost: number;
}

interface CostBreakdownSectionProps {
  bookings: ExtendedBooking[];
}

const CostBreakdownSection: React.FC<CostBreakdownSectionProps> = ({ bookings }) => {
  // Aggregiere alle Materialien aus OUT-Buchungen
  const { materialSummaries, totalCost, totalItems } = useMemo(() => {
    const materialMap = new Map<string, MaterialCostSummary>();
    let total = 0;
    let items = 0;

    for (const booking of bookings) {
      // Nur OUT-Buchungen (Material wurde für Projekt verwendet)
      if (booking.type !== 'out') continue;

      if (booking.materials && Array.isArray(booking.materials)) {
        // Multi-Material Buchung
        for (const material of booking.materials) {
          const cost = material.totalCost || (material.priceAtBooking || 0) * material.quantity;
          total += cost;
          items += material.quantity;

          const existing = materialMap.get(material.materialID);
          if (existing) {
            existing.totalQuantity += material.quantity;
            existing.totalCost += cost;
            // Durchschnittspreis neu berechnen
            existing.avgPricePerUnit = existing.totalCost / existing.totalQuantity;
          } else {
            materialMap.set(material.materialID, {
              materialID: material.materialID,
              materialName: material.materialName || material.description || material.materialID,
              description: material.description,
              totalQuantity: material.quantity,
              avgPricePerUnit: material.priceAtBooking || 0,
              totalCost: cost
            });
          }
        }
      } else if (booking.materialID) {
        // Single-Material Buchung (Legacy)
        const pricePerUnit = 0; // Alte Buchungen haben keinen Preis gespeichert
        const cost = pricePerUnit * booking.quantity;
        total += cost;
        items += booking.quantity;

        const existing = materialMap.get(booking.materialID);
        if (existing) {
          existing.totalQuantity += booking.quantity;
          existing.totalCost += cost;
          existing.avgPricePerUnit = existing.totalCost / existing.totalQuantity;
        } else {
          materialMap.set(booking.materialID, {
            materialID: booking.materialID,
            materialName: booking.materialName || booking.materialID,
            description: undefined,
            totalQuantity: booking.quantity,
            avgPricePerUnit: pricePerUnit,
            totalCost: cost
          });
        }
      }
    }

    // Sortiere nach Gesamtkosten (höchste zuerst)
    const summaries = Array.from(materialMap.values()).sort((a, b) => b.totalCost - a.totalCost);

    return { materialSummaries: summaries, totalCost: total, totalItems: items };
  }, [bookings]);

  if (materialSummaries.length === 0) {
    return (
      <div className="text-center py-8">
        <Euro className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Kosten</h3>
        <p className="mt-1 text-sm text-gray-500">
          Es wurden noch keine Materialien für dieses Projekt gebucht.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Zusammenfassung */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Euro className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-orange-800">Gesamtkosten</p>
              <p className="text-2xl font-bold text-orange-900">{formatCurrency(totalCost)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-orange-700">{materialSummaries.length} Materialien</p>
            <p className="text-sm text-orange-700">{totalItems} Einheiten gesamt</p>
          </div>
        </div>
      </div>

      {/* Materialliste */}
      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Material
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Menge
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ø Preis/Stk.
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gesamt
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {materialSummaries.map((material) => (
              <tr key={material.materialID} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {material.materialName}
                      </p>
                      <p className="text-xs text-gray-500">{material.materialID}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-medium text-gray-900">{material.totalQuantity}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm text-gray-600">
                    {material.avgPricePerUnit > 0 ? formatCurrency(material.avgPricePerUnit) : '-'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-semibold text-gray-900">
                    {material.totalCost > 0 ? formatCurrency(material.totalCost) : '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                Summe
              </td>
              <td className="px-4 py-3 text-right text-sm font-bold text-orange-600">
                {formatCurrency(totalCost)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Hinweis */}
      <p className="text-xs text-gray-500 text-center">
        Kosten basieren auf den historischen Preisen zum Zeitpunkt der Buchung
      </p>
    </div>
  );
};

export default CostBreakdownSection;
