/**
 * BOMSection - Stückliste Section im ProjectModal
 *
 * Zeigt eine read-only Stückliste mit 3 Kategorien:
 * 1. Manuell hinzugefügt (grün)
 * 2. Konfigurierte Komponenten (blau)
 * 3. Automatisch berechnetes Material (grau)
 *
 * Druckfunktion nutzt Portal für korrekten mehrseitigen Druck.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Printer, ClipboardList } from 'lucide-react';
import { useMaterials } from '@context/MaterialContext';
import { aggregateProjectBookings, splitAggregatedByCategory } from '@services/BookingAggregationService';
import { formatProjectAddressDisplay } from '@utils/projectHelpers';
import type { Project, Customer } from '@app-types';
import type { ExtendedBooking } from '@app-types/contexts/booking.types';
import type { AggregatedMaterial } from '@services/BookingAggregationService';
import BOMReadOnlyTable from './BOMReadOnlyTable';
import './BOMSection.print.css';

interface BOMSectionProps {
  project: Project;
  customer: Customer | null;
  bookings: ExtendedBooking[];
}

/**
 * Print-Content Komponente - wird im Portal gerendert
 */
interface PrintContentProps {
  project: Project;
  customer: Customer | null;
  manualItems: AggregatedMaterial[];
  configuredItems: AggregatedMaterial[];
  autoItems: AggregatedMaterial[];
}

const PrintContent: React.FC<PrintContentProps> = ({
  project,
  customer,
  manualItems,
  configuredItems,
  autoItems
}) => {
  const totalCount = manualItems.length + configuredItems.length + autoItems.length;

  return (
    <div className="bom-print-page">
      {/* Header */}
      <div className="bom-print-header">
        <h1>Stückliste</h1>
        <div className="bom-header-grid">
          <div>
            <span className="bom-label">Projekt:</span>
            <p className="bom-value">{project.name}</p>
            <p className="bom-sub">Status: {project.status}</p>
          </div>
          <div>
            <span className="bom-label">Kunde:</span>
            <p className="bom-value">{customer?.firmennameKundenname || '-'}</p>
          </div>
          <div>
            <span className="bom-label">Adresse:</span>
            <p className="bom-value">{formatProjectAddressDisplay(project) || '-'}</p>
          </div>
        </div>
      </div>

      {/* Tabellen */}
      {manualItems.length > 0 && (
        <div className="bom-category">
          <h3>Manuell hinzugefügt ({manualItems.length})</h3>
          <table className="bom-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Pos.</th>
                <th>Material</th>
                <th style={{ width: '100px' }}>Stk/Einheit</th>
                <th style={{ width: '80px' }}>Anzahl</th>
              </tr>
            </thead>
            <tbody>
              {manualItems.map((item, index) => (
                <tr key={item.materialId || item.materialID}>
                  <td style={{ textAlign: 'center' }}>{index + 1}</td>
                  <td>
                    <div className="bom-material-name">{item.description}</div>
                    <div className="bom-material-id">{item.materialID}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>{item.itemsPerUnit || 1} {item.unit}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.netQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {configuredItems.length > 0 && (
        <div className="bom-category">
          <h3>Konfigurierte Komponenten ({configuredItems.length})</h3>
          <table className="bom-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Pos.</th>
                <th>Material</th>
                <th style={{ width: '100px' }}>Stk/Einheit</th>
                <th style={{ width: '80px' }}>Anzahl</th>
              </tr>
            </thead>
            <tbody>
              {configuredItems.map((item, index) => (
                <tr key={item.materialId || item.materialID}>
                  <td style={{ textAlign: 'center' }}>{manualItems.length + index + 1}</td>
                  <td>
                    <div className="bom-material-name">{item.description}</div>
                    <div className="bom-material-id">{item.materialID}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>{item.itemsPerUnit || 1} {item.unit}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.netQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {autoItems.length > 0 && (
        <div className="bom-category">
          <h3>Automatisch berechnetes Material ({autoItems.length})</h3>
          <table className="bom-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Pos.</th>
                <th>Material</th>
                <th style={{ width: '100px' }}>Stk/Einheit</th>
                <th style={{ width: '80px' }}>Anzahl</th>
              </tr>
            </thead>
            <tbody>
              {autoItems.map((item, index) => (
                <tr key={item.materialId || item.materialID}>
                  <td style={{ textAlign: 'center' }}>{manualItems.length + configuredItems.length + index + 1}</td>
                  <td>
                    <div className="bom-material-name">{item.description}</div>
                    <div className="bom-material-id">{item.materialID}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>{item.itemsPerUnit || 1} {item.unit}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.netQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="bom-print-footer">
        Gesamt: {totalCount} Position{totalCount !== 1 ? 'en' : ''} |
        Mengen = Ausgang - Eingang (Netto)
      </div>
    </div>
  );
};

const BOMSection: React.FC<BOMSectionProps> = ({ project, customer, bookings }) => {
  const { materials } = useMaterials();
  const [printPortal, setPrintPortal] = useState<HTMLElement | null>(null);

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

  // Portal-basierter Print-Handler
  const handlePrint = useCallback(() => {
    // Portal-Element erstellen und an body anhängen
    const portalEl = document.createElement('div');
    portalEl.id = 'bom-print-portal';
    document.body.appendChild(portalEl);
    setPrintPortal(portalEl);

    // Warten bis Portal gerendert, dann drucken
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();

        // Nach Druck aufräumen
        setTimeout(() => {
          if (document.body.contains(portalEl)) {
            document.body.removeChild(portalEl);
          }
          setPrintPortal(null);
        }, 500);
      }, 100);
    });
  }, []);

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
    <div className="space-y-4">
      {/* Drucken-Button */}
      <div className="flex justify-end">
        <button
          onClick={handlePrint}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          <Printer className="h-4 w-4 mr-2" />
          Drucken
        </button>
      </div>

      {/* Tabellen nach Kategorie (Screen-Ansicht) */}
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

      {/* Zusammenfassung */}
      <div className="text-xs text-gray-500 text-center">
        Gesamt: {totalCount} Position{totalCount !== 1 ? 'en' : ''} |
        Mengen = Ausgang - Eingang (Netto)
      </div>

      {/* Print Portal - außerhalb #root gerendert */}
      {printPortal && createPortal(
        <PrintContent
          project={project}
          customer={customer}
          manualItems={manualItems}
          configuredItems={configuredItems}
          autoItems={autoItems}
        />,
        printPortal
      )}
    </div>
  );
};

export default BOMSection;
