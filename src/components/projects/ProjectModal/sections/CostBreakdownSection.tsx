import React, { useMemo } from 'react';
import { Euro, Package } from 'lucide-react';
import { formatCurrency } from '@utils';
import { useMaterials } from '@context/MaterialContext';
import { aggregateProjectBookings } from '@services/BookingAggregationService';
import type { ExtendedBooking } from '@app-types/contexts/booking.types';

interface CostBreakdownSectionProps {
  bookings: ExtendedBooking[];
  projectId?: string;
}

const CostBreakdownSection: React.FC<CostBreakdownSectionProps> = ({ bookings, projectId }) => {
  const { materials } = useMaterials();

  // Aggregiere mit neuem Service (OUT - IN)
  const { materialSummaries, totalCost, totalItems } = useMemo(() => {
    // ProjectId aus erstem Booking ermitteln falls nicht übergeben
    const pid = projectId || bookings.find(b => b.projectID)?.projectID || '';

    if (!pid) {
      return { materialSummaries: [], totalCost: 0, totalItems: 0 };
    }

    // Neue Aggregation mit OUT - IN Berechnung
    const aggregated = aggregateProjectBookings(pid, bookings, materials);

    // Zu MaterialCostSummary Format konvertieren
    const summaries = aggregated.map(item => ({
      materialID: item.materialID,
      materialName: item.description,
      description: item.description,
      totalQuantity: item.netQuantity,      // Netto = OUT - IN
      avgPricePerUnit: item.avgPricePerUnit,
      totalCost: item.netCost               // Netto Kosten
    }));

    // Nach Kosten sortieren (höchste zuerst)
    summaries.sort((a, b) => b.totalCost - a.totalCost);

    const total = aggregated.reduce((sum, item) => sum + item.netCost, 0);
    const items = aggregated.reduce((sum, item) => sum + item.netQuantity, 0);

    return { materialSummaries: summaries, totalCost: total, totalItems: items };
  }, [bookings, materials, projectId]);

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
