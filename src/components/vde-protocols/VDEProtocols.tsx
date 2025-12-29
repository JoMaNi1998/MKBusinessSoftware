import React, { useState, useEffect, useCallback, MouseEvent } from 'react';
import {
  FileText,
  Search,
  Edit,
  Trash2,
  Building,
  Zap,
  Filter,
  MoreVertical,
  Settings,
  Package,
  Download,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useCustomers } from '../../context/CustomerContext';

import { useVDEProtocols } from './hooks';
import VDEProtocolModal from './VDEProtocolModal';
import VDEProjectSelectionModal from './VDEProjectSelectionModal';
import {
  VDEProtocol,
  ProjectSelectionResult,
  ProjectConfiguration,
  VisibleColumns,
} from './VDEProtocolModal/types';

interface ProtocolDataForModal extends ProjectConfiguration {
  projectID?: string;
  customerID?: string;
  customerName?: string;
  projectName?: string;
  contractorName?: string;
  address?: string;
  strings?: number;
  totalModules?: number;
  createdAt?: string;
}

const VDEProtocols: React.FC = () => {
  // Context data - TODO: may be needed for future features
  useProjects();
  useCustomers();

  const {
    // State
    loading,
    searchTerm,
    setSearchTerm,
    sortConfig,
    columnFilters,
    visibleColumns,
    loadingPreferences,

    // Configuration
    availableColumns,

    // Derived data
    uniqueStatuses,
    sortedProtocols,
    stats,

    // Actions
    loadProtocols,
    handleSort,
    handleColumnFilterChange,
    toggleColumnVisibility,
    handleDeleteProtocol,
  } = useVDEProtocols();

  // Modal States
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState<boolean>(false);
  const [editingProtocol, setEditingProtocol] = useState<
    VDEProtocol | ProtocolDataForModal | null
  >(null);
  const [isProjectSelectionModalOpen, setIsProjectSelectionModalOpen] = useState<boolean>(false);
  const [isGeneratedFromProject, setIsGeneratedFromProject] = useState<boolean>(false);
  const [showColumnSettings, setShowColumnSettings] = useState<boolean>(false);
  const [activeColumnFilter, setActiveColumnFilter] = useState<string | null>(null);

  // Click outside handler for column settings
  useEffect(() => {
    const handleClickOutside = (event: Event): void => {
      if (
        showColumnSettings &&
        !(event.target as HTMLElement).closest('.column-settings-container')
      ) {
        setShowColumnSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnSettings]);

  const formatDate = (date: unknown): string => {
    if (!date) return '-';
    const d = new Date(date as string | number | Date);
    return isNaN(d.getTime())
      ? '-'
      : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getStatusColor = (status: string | undefined): string => {
    switch (status) {
      case 'Erstellt':
        return 'bg-blue-100 text-blue-800';
      case 'Geprüft':
        return 'bg-green-100 text-green-800';
      case 'Fehler':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleGenerateFromProject = (): void => {
    setIsProjectSelectionModalOpen(true);
  };

  const handleProjectConfigurationSelected = ({
    customer,
    project,
    configuration,
    selectedProject,
    selectedCustomer,
  }: ProjectSelectionResult): void => {
    const config = (configuration as ProjectConfiguration & { pvConfiguration?: ProjectConfiguration })?.pvConfiguration || configuration;

    const protocolData: ProtocolDataForModal = {
      projectID: selectedProject,
      customerID: selectedCustomer,
      customerName: customer?.firmennameKundenname || 'Unbekannt',
      projectName: project?.name || project?.projektName || 'Unbekanntes Projekt',
      contractorName: customer?.firmennameKundenname || 'Unbekannt',
      address: project?.address?.strasse
        ? `${project.address.strasse}, ${project.address.plz || ''} ${project.address.ort || ''}`.trim()
        : (customer?.strasse
          ? `${customer.strasse}${customer.hausnummer ? ' ' + customer.hausnummer : ''}, ${customer.plz || ''} ${customer.ort || ''}`.trim()
          : 'Nicht angegeben'),

      inverters: config?.inverters || [],
      modules: config?.modules,
      wallbox: config?.wallbox,
      generatoranschlusskasten: config?.generatoranschlusskasten,
      pvCables: config?.pvCables,
      potentialausgleichHESUK: config?.potentialausgleichHESUK,
      strings:
        config?.inverters?.reduce(
          (total: number, inv) => total + (inv.strings?.length || 0),
          0
        ) || 0,
      totalModules: config?.modules?.totalQuantity || 0,
      createdAt: new Date().toISOString(),
      configurationVersion: config?.configurationVersion || '1.0',
    };

    setEditingProtocol(protocolData);
    setIsProtocolModalOpen(true);
    setIsGeneratedFromProject(true);
  };

  const handleDownloadProtocol = (protocolId: string): void => {
    console.log('Download protocol:', protocolId);
    setDropdownOpen(null);
  };

  const handleEditProtocol = useCallback(
    (protocolId: string): void => {
      const protocol = sortedProtocols.find((p) => p.id === protocolId);
      if (protocol) {
        setEditingProtocol(protocol);
        setIsProtocolModalOpen(true);
        setIsGeneratedFromProject(false);
      }
      setDropdownOpen(null);
    },
    [sortedProtocols]
  );

  const onDeleteProtocol = useCallback(
    (protocolId: string): void => {
      handleDeleteProtocol(protocolId);
      setDropdownOpen(null);
    },
    [handleDeleteProtocol]
  );

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 flex-shrink-0">
        <div className="pl-12 sm:pl-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">VDE Protokolle</h1>
          <p className="mt-1 text-sm text-gray-600 hidden sm:block">
            Erstellen und verwalten Sie VDE-Prüfprotokolle
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="flex-1 sm:flex-none flex items-center justify-center px-3 sm:px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Package className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportieren</span>
          </button>
          <button
            onClick={handleGenerateFromProject}
            className="flex-1 sm:flex-none flex items-center justify-center px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Zap className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Aus Projekt generieren</span>
            <span className="sm:hidden">Neu</span>
          </button>
        </div>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-4 md:grid-cols-4 gap-1.5 md:gap-4 flex-shrink-0">
        <div className="bg-white p-2 md:p-4 rounded-lg shadow">
          <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Gesamt</p>
          <p className="text-base md:text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-2 md:p-4 rounded-lg shadow">
          <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Erstellt</p>
          <p className="text-base md:text-2xl font-bold text-blue-600">{stats.created}</p>
        </div>
        <div className="bg-white p-2 md:p-4 rounded-lg shadow">
          <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Geprüft</p>
          <p className="text-base md:text-2xl font-bold text-green-600">{stats.checked}</p>
        </div>
        <div className="bg-white p-2 md:p-4 rounded-lg shadow">
          <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Fertig</p>
          <p className="text-base md:text-2xl font-bold text-gray-600">{stats.completed}</p>
        </div>
      </div>

      {/* Protokoll-Liste */}
      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col min-h-0">
        {/* Titel-Zeile mit Suche und Settings-Button */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0 space-y-3 sm:space-y-0">
          <div className="flex items-center justify-between sm:gap-3">
            <h3 className="text-lg font-medium text-gray-900 flex-shrink-0">Protokoll-Liste</h3>

            {/* Desktop: Suche inline */}
            <div className="hidden sm:flex items-center gap-2 flex-1">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="relative column-settings-container">
              <button
                onClick={() => setShowColumnSettings(!showColumnSettings)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Spalten anpassen"
              >
                <Settings className="h-5 w-5" />
              </button>

              {showColumnSettings && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">Spalten anzeigen</h3>
                      {loadingPreferences && <div className="text-xs text-gray-500">Lädt...</div>}
                    </div>
                    <div className="space-y-2">
                      {availableColumns.map((column) => (
                        <label key={column.key} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={visibleColumns[column.key]}
                            onChange={() =>
                              !column.required &&
                              toggleColumnVisibility(column.key as keyof VisibleColumns)
                            }
                            disabled={column.required || loadingPreferences}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span
                            className={`text-sm ${column.required ? 'text-gray-400' : 'text-gray-700'}`}
                          >
                            {column.label}
                            {column.required && ' (erforderlich)'}
                          </span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Einstellungen werden automatisch in Firebase gespeichert
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile: Suche als zweite Zeile */}
          <div className="flex sm:hidden items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Scrollbare Tabelle / Mobile Cards */}
        <div className="flex-1 overflow-hidden">
          {/* Mobile: Card-Liste */}
          <div className="md:hidden h-full overflow-auto p-4 space-y-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Lade VDE-Protokolle...</p>
              </div>
            ) : sortedProtocols.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Protokolle gefunden</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ||
                  columnFilters.status !== 'alle' ||
                  columnFilters.customer !== 'alle'
                    ? 'Versuchen Sie andere Suchbegriffe oder Filter.'
                    : 'Beginnen Sie mit der Erstellung Ihres ersten VDE-Protokolls.'}
                </p>
              </div>
            ) : (
              sortedProtocols.map((protocol) => (
                <div
                  key={protocol.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm active:bg-gray-50"
                  onClick={() => handleEditProtocol(protocol.id)}
                >
                  {/* Header: Protokoll-Nr + Kunde + Status */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{protocol.protocolNumber}</p>
                      {visibleColumns.customerName && (
                        <p className="text-sm text-gray-500">
                          {protocol.customerName || 'Kein Kunde'}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(protocol.status)}`}
                    >
                      {protocol.status || 'Erstellt'}
                    </span>
                  </div>

                  {/* Projekt */}
                  {visibleColumns.projectName && (
                    <div className="mt-2 text-sm text-gray-600">
                      <Building className="h-4 w-4 inline mr-1 text-gray-400" />
                      {protocol.projectName || 'Kein Projekt'}
                    </div>
                  )}

                  {/* Technische Daten */}
                  {(visibleColumns.power ||
                    visibleColumns.moduleCount ||
                    visibleColumns.stringCount) && (
                    <div className="mt-2 flex flex-wrap gap-3 text-sm">
                      {visibleColumns.power && (
                        <div>
                          <span className="text-gray-500">kWp:</span>
                          <span className="ml-1 font-medium text-gray-900">
                            {protocol.power || '-'}
                          </span>
                        </div>
                      )}
                      {visibleColumns.moduleCount && (
                        <div>
                          <span className="text-gray-500">Module:</span>
                          <span className="ml-1 font-medium text-gray-900">
                            {protocol.moduleCount || '-'}
                          </span>
                        </div>
                      )}
                      {visibleColumns.stringCount && (
                        <div>
                          <span className="text-gray-500">Strings:</span>
                          <span className="ml-1 font-medium text-gray-900">
                            {protocol.stringCount || '-'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Zusätzliche Felder */}
                  {(visibleColumns.inverterModel || visibleColumns.createdDate) && (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                      {visibleColumns.inverterModel && protocol.inverterModel && (
                        <span className="bg-gray-100 px-2 py-0.5 rounded">
                          WR: {protocol.inverterModel}
                        </span>
                      )}
                      {visibleColumns.createdDate && (
                        <span className="bg-gray-100 px-2 py-0.5 rounded">
                          {formatDate(protocol.createdDate)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop: Tabelle */}
          <div className="hidden md:block h-full overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {visibleColumns.protocolNumber && (
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('protocolNumber')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>PROTOKOLL-NR.</span>
                        <div className="relative">
                          {sortConfig.key === 'protocolNumber' ? (
                            <span className="text-gray-400 hover:text-gray-600 text-lg font-bold">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          ) : (
                            <Filter className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                          )}
                        </div>
                      </div>
                    </th>
                  )}
                  {visibleColumns.customerName && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>KUNDE</span>
                      </div>
                    </th>
                  )}
                  {visibleColumns.projectName && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>PROJEKT</span>
                      </div>
                    </th>
                  )}
                  {visibleColumns.status && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>STATUS</span>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActiveColumnFilter(activeColumnFilter === 'status' ? null : 'status')
                            }
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            <Filter className="h-3 w-3" />
                          </button>
                          {activeColumnFilter === 'status' && (
                            <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-30 border border-gray-200">
                              <div className="p-2">
                                <select
                                  value={columnFilters.status}
                                  onChange={(e) =>
                                    handleColumnFilterChange('status', e.target.value)
                                  }
                                  className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                  {uniqueStatuses.map((status) => (
                                    <option key={status} value={status}>
                                      {status}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </th>
                  )}
                  {visibleColumns.power && (
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('power')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>LEISTUNG (kWp)</span>
                        {sortConfig.key === 'power' && (
                          <span className="text-gray-400 hover:text-gray-600 text-lg font-bold">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  )}
                  {visibleColumns.moduleCount && (
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('moduleCount')}
                    >
                      MODULE
                    </th>
                  )}
                  {visibleColumns.stringCount && (
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('stringCount')}
                    >
                      STRINGS
                    </th>
                  )}
                  {visibleColumns.inverterModel && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      WECHSELRICHTER
                    </th>
                  )}
                  {visibleColumns.createdDate && (
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('createdDate')}
                    >
                      ERSTELLT
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AKTIONEN
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedProtocols.map((protocol) => (
                  <tr
                    key={protocol.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleEditProtocol(protocol.id)}
                  >
                    {visibleColumns.protocolNumber && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {protocol.protocolNumber}
                        </div>
                      </td>
                    )}
                    {visibleColumns.customerName && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {protocol.customerName || '-'}
                        </div>
                      </td>
                    )}
                    {visibleColumns.projectName && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{protocol.projectName || '-'}</div>
                      </td>
                    )}
                    {visibleColumns.power && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{protocol.power} kWp</div>
                      </td>
                    )}
                    {visibleColumns.moduleCount && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{protocol.moduleCount}</div>
                      </td>
                    )}
                    {visibleColumns.stringCount && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{protocol.stringCount}</div>
                      </td>
                    )}
                    {visibleColumns.inverterModel && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{protocol.inverterModel || '-'}</div>
                      </td>
                    )}
                    {visibleColumns.createdDate && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(protocol.createdDate)}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={(e: MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            setDropdownOpen(dropdownOpen === protocol.id ? null : protocol.id);
                          }}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {dropdownOpen === protocol.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                            <div className="py-1">
                              <button
                                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                  e.stopPropagation();
                                  handleDownloadProtocol(protocol.id);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                PDF herunterladen
                              </button>
                              <button
                                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                  e.stopPropagation();
                                  handleEditProtocol(protocol.id);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Bearbeiten
                              </button>
                              <button
                                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                  e.stopPropagation();
                                  onDeleteProtocol(protocol.id);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Löschen
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Desktop: Loading/Empty State */}
        <div className="hidden md:block">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Lade VDE-Protokolle...</p>
            </div>
          ) : sortedProtocols.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Protokolle gefunden</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ||
                columnFilters.status !== 'alle' ||
                columnFilters.customer !== 'alle'
                  ? 'Versuchen Sie andere Suchbegriffe oder Filter.'
                  : 'Beginnen Sie mit der Erstellung Ihres ersten VDE-Protokolls.'}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Click outside handler */}
      {dropdownOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setDropdownOpen(null)} />
      )}

      {/* VDE Protocol Modal */}
      <VDEProtocolModal
        isOpen={isProtocolModalOpen}
        onClose={() => {
          setIsProtocolModalOpen(false);
          setEditingProtocol(null);
          setIsGeneratedFromProject(false);
          loadProtocols();
        }}
        protocol={editingProtocol}
        hideActions={isGeneratedFromProject}
      />

      {/* Project Selection Modal */}
      <VDEProjectSelectionModal
        isOpen={isProjectSelectionModalOpen}
        onClose={() => setIsProjectSelectionModalOpen(false)}
        onSelectConfiguration={handleProjectConfigurationSelected}
      />
    </div>
  );
};

export default VDEProtocols;
