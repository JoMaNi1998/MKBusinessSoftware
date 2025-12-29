import React from 'react';
import {
  Printer,
  RefreshCw,
  FileText
} from 'lucide-react';
import { useBillOfMaterials } from '@hooks';
import { getCustomerName, getCustomerAddress } from '@utils';
import ProjectSelector from './ProjectSelector';
import ProjectInfoCard from './ProjectInfoCard';
import BOMTable from './BOMTable';
import './BillOfMaterials.print.css';

const BillOfMaterials: React.FC = () => {
  const {
    selectedProject,
    projectSearch,
    setProjectSearch,
    bomItems,
    showProjectSelect,
    projects,
    customersById,
    filteredProjects,
    customer,
    handleProjectSelect,
    handleRefreshFromBookings,
    handleRemoveItem,
    handleQuantityChange,
    handlePrint,
    handleNewBOM
  } = useBillOfMaterials();

  // Projektauswahl-Screen
  if (showProjectSelect) {
    return (
      <ProjectSelector
        projects={projects}
        customersById={customersById}
        filteredProjects={filteredProjects}
        projectSearch={projectSearch}
        setProjectSearch={setProjectSearch}
        onProjectSelect={handleProjectSelect}
      />
    );
  }

  // Aufteilen der BOM-Items in 3 Kategorien
  const configuredItems = bomItems.filter(item => item.isConfigured);
  const autoItems = bomItems.filter(item => !item.isConfigured && !item.isManual);
  const manualItems = bomItems.filter(item => item.isManual);

  // Stücklisten-Ansicht
  return (
    <div className="h-full flex flex-col space-y-6 print:bg-white print:space-y-2">
      {/* Header (nicht druckbar) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="pl-12 sm:pl-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Stückliste</h1>
          <p className="mt-1 text-sm text-gray-600 hidden sm:block">
            {selectedProject?.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleNewBOM}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            title="Neues Projekt wählen"
          >
            Zurück
          </button>
          <button
            onClick={handleRefreshFromBookings}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Aus Buchungen aktualisieren"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Aktualisieren</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            title="Drucken"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Drucken</span>
          </button>
        </div>
      </div>

      {/* Projekt-Info Card */}
      <ProjectInfoCard project={selectedProject} customer={customer} />

      {/* Druckbarer Inhalt - Kopf */}
      <div className="hidden print:block print:mb-2">
        <div className="bg-gray-50 print:bg-white print:border print:border-gray-300 rounded-lg p-4 print:p-2">
          <div className="text-sm space-y-1">
            <div>
              <span className="font-semibold">Projekt:</span> {selectedProject?.name || 'Unbekanntes Projekt'} ({selectedProject?.status || 'Unbekannt'})
            </div>
            <div>
              <span className="font-semibold">Kunde:</span> {getCustomerName(customer)}
            </div>
            <div>
              <span className="font-semibold">Adresse:</span> {getCustomerAddress(customer)}
            </div>
          </div>
        </div>
      </div>

      {/* Hauptinhalt - Tabellen */}
      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col print:shadow-none print:rounded-none print:bg-white">
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0 print:hidden">
          <h3 className="text-lg font-medium text-gray-900">Materialliste</h3>
          <p className="text-sm text-gray-500">{bomItems.length} Positionen</p>
        </div>

        <div className="flex-1 overflow-auto print:overflow-visible">
          <div className="p-6 print:p-0 space-y-6 print:space-y-4">
            <BOMTable
              items={configuredItems}
              title="Konfigurierte Komponenten"
              bgColor="bg-primary-50"
              borderColor="border-primary-200"
              startIndex={0}
              onQuantityChange={handleQuantityChange}
              onRemoveItem={handleRemoveItem}
            />
            <BOMTable
              items={autoItems}
              title="Automatisch berechnetes Material"
              bgColor="bg-gray-50"
              borderColor="border-gray-200"
              startIndex={configuredItems.length}
              onQuantityChange={handleQuantityChange}
              onRemoveItem={handleRemoveItem}
            />
            <BOMTable
              items={manualItems}
              title="Manuell hinzugefügt"
              bgColor="bg-green-50"
              borderColor="border-green-200"
              startIndex={configuredItems.length + autoItems.length}
              onQuantityChange={handleQuantityChange}
              onRemoveItem={handleRemoveItem}
            />

            {bomItems.length === 0 && (
              <div className="text-center py-12 print:hidden">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Materialien</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Für dieses Projekt wurden noch keine Materialien gebucht.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillOfMaterials;
