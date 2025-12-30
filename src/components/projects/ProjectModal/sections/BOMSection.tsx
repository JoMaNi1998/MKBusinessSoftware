/**
 * BOMSection - Stückliste Section im ProjectModal
 *
 * Zeigt eine read-only Stückliste mit 3 Kategorien:
 * 1. Manuell hinzugefügt (grün)
 * 2. Konfigurierte Komponenten (blau)
 * 3. Automatisch berechnetes Material (grau)
 *
 * Druckfunktion nutzt direktes Print-CSS für mehrseitigen Druck.
 */

import React, { useMemo } from 'react';
import { Printer, ClipboardList } from 'lucide-react';
import { useMaterials } from '@context/MaterialContext';
import { aggregateProjectBookings, splitAggregatedByCategory } from '@services/BookingAggregationService';
import { formatProjectAddressDisplay } from '@utils/projectHelpers';
import type { Project, Customer } from '@app-types';
import type { ExtendedBooking } from '@app-types/contexts/booking.types';
import BOMReadOnlyTable from './BOMReadOnlyTable';
import './BOMSection.print.css';

interface BOMSectionProps {
  project: Project;
  customer: Customer | null;
  bookings: ExtendedBooking[];
}

const BOMSection: React.FC<BOMSectionProps> = ({ project, customer, bookings }) => {
  const { materials } = useMaterials();

  // Aggregation mit neuem Service (OUT - IN)
  const aggregatedItems = useMemo(() =>
    aggregateProjectBookings(project.id, bookings, materials),
    [project.id, bookings, materials]
  );

  // In Kategorien aufteilen
  const { manualItems, configuredItems, autoItems } = useMemo(() =>
    splitAggregatedByCategory(aggregatedItems),
    [aggregatedItems]
  );

  // Einfacher Print-Handler
  const handlePrint = () => {
    window.print();
  };

  // Gesamtanzahl für Count-Badge
  const totalCount = aggregatedItems.length;

  // Empty State
  if (totalCount === 0) {
    return (
      <div className="text-center py-8">
        <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Materialien</h3>
        <p className="mt-1 text-sm text-gray-500">
          Es wurden noch keine Materialien für dieses Projekt gebucht.
        </p>
      </div>
    );
  }

  return (
    <div className="bom-print-container space-y-4">
      {/* Print Header (nur im Druck sichtbar) */}
      <div className="hidden print:block print-header mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Stückliste</h1>
        <div className="grid grid-cols-3 gap-4 text-sm border-b border-gray-300 pb-4">
          <div>
            <span className="font-medium text-gray-600 block">Projekt:</span>
            <p className="text-gray-900">{project.name}</p>
            <p className="text-xs text-gray-500">Status: {project.status}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600 block">Kunde:</span>
            <p className="text-gray-900">{customer?.firmennameKundenname || '-'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600 block">Adresse:</span>
            <p className="text-gray-900">{formatProjectAddressDisplay(project) || '-'}</p>
          </div>
        </div>
      </div>

      {/* Drucken-Button (nur auf Screen) */}
      <div className="flex justify-end print:hidden">
        <button
          onClick={handlePrint}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          <Printer className="h-4 w-4 mr-2" />
          Drucken
        </button>
      </div>

      {/* Tabellen nach Kategorie */}
      {manualItems.length > 0 && (
        <BOMReadOnlyTable
          title="Manuell hinzugefügt"
          items={manualItems}
          startIndex={0}
          colorClass="bg-green-50"
        />
      )}

      {configuredItems.length > 0 && (
        <BOMReadOnlyTable
          title="Konfigurierte Komponenten"
          items={configuredItems}
          startIndex={manualItems.length}
          colorClass="bg-blue-50"
        />
      )}

      {autoItems.length > 0 && (
        <BOMReadOnlyTable
          title="Automatisch berechnetes Material"
          items={autoItems}
          startIndex={manualItems.length + configuredItems.length}
          colorClass="bg-gray-50"
        />
      )}

      {/* Zusammenfassung / Print Footer */}
      <div className="text-xs text-gray-500 text-center print:mt-4 print:border-t print:pt-2">
        Gesamt: {totalCount} Position{totalCount !== 1 ? 'en' : ''} |
        Mengen = Ausgang - Eingang (Netto)
      </div>
    </div>
  );
};

export default BOMSection;
