import React, { useState, ChangeEvent } from 'react';
import { Search, Building } from 'lucide-react';
import ProjectTable from './ProjectTable';
import ProjectCard from './ProjectCard';
import ColumnSettings from './ColumnSettings';
import type { Project, Customer } from '@app-types';
import type { ProjectVisibleColumns, ProjectSortConfig, ProjectColumnFilters } from '@app-types/components/project.types';

interface ProjectListProps {
  projects: Project[];
  customers: Customer[];
  visibleColumns: ProjectVisibleColumns;
  loadingPreferences: boolean;
  onToggleColumn: (columnKey: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortConfig: ProjectSortConfig;
  onSort: (key: string) => void;
  activeColumnFilter: string | null;
  onToggleColumnFilter: (filter: string | null) => void;
  columnFilters: ProjectColumnFilters;
  onColumnFilterChange: (column: string, value: string) => void;
  uniqueStatuses: string[];
  uniqueCustomers: string[];
  editingStatus: string | null;
  onStatusEdit: (projectId: string) => void;
  onStatusSave: (projectId: string, newStatus: string) => void;
  onStatusCancel: () => void;
  dropdownOpen: string | null;
  onDropdownToggle: (projectId: string | null) => void;
  onProjectClick: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  customers,
  visibleColumns,
  loadingPreferences,
  onToggleColumn,
  searchTerm,
  onSearchChange,
  sortConfig,
  onSort,
  activeColumnFilter,
  onToggleColumnFilter,
  columnFilters,
  onColumnFilterChange,
  uniqueStatuses,
  uniqueCustomers,
  editingStatus,
  onStatusEdit,
  onStatusSave,
  onStatusCancel,
  dropdownOpen,
  onDropdownToggle,
  onProjectClick,
  onEditProject,
  onDeleteProject
}) => {
  const [showColumnSettings, setShowColumnSettings] = useState<boolean>(false);

  const isEmpty = projects.length === 0;
  const hasFilters = searchTerm || columnFilters.status !== 'alle' || columnFilters.customer !== 'alle';

  const EmptyState = () => (
    <div className="text-center py-12">
      <Building className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Projekte gefunden</h3>
      <p className="mt-1 text-sm text-gray-500">
        {hasFilters
          ? 'Versuchen Sie andere Suchbegriffe oder Filter.'
          : 'Beginnen Sie mit dem Erstellen Ihres ersten Projekts.'
        }
      </p>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col min-h-0">
      {/* Header mit integrierter Suche */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0 space-y-3 sm:space-y-0">
        <div className="flex items-center justify-between sm:gap-3">
          <h3 className="text-lg font-medium text-gray-900 flex-shrink-0">Projektliste</h3>

          {/* Desktop: Suche inline */}
          <div className="hidden sm:flex items-center gap-2 flex-1">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Suchen..."
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <ColumnSettings
            isOpen={showColumnSettings}
            onToggle={() => setShowColumnSettings(!showColumnSettings)}
            visibleColumns={visibleColumns}
            onToggleColumn={onToggleColumn}
            loading={loadingPreferences}
          />
        </div>

        {/* Mobile: Suche als zweite Zeile */}
        <div className="flex sm:hidden items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Suchen..."
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Scrollbare Tabelle / Mobile Cards */}
      <div className="flex-1 overflow-hidden">
        {/* Mobile: Card-Liste */}
        <div className="md:hidden h-full overflow-auto p-4 space-y-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              customers={customers}
              visibleColumns={visibleColumns}
              onClick={onProjectClick}
            />
          ))}
          {isEmpty && <EmptyState />}
        </div>

        {/* Desktop: Tabelle */}
        <div className="hidden md:block h-full overflow-auto">
          {!isEmpty ? (
            <ProjectTable
              projects={projects}
              customers={customers}
              visibleColumns={visibleColumns}
              sortConfig={sortConfig}
              onSort={onSort}
              activeColumnFilter={activeColumnFilter}
              onToggleColumnFilter={onToggleColumnFilter}
              columnFilters={columnFilters}
              onColumnFilterChange={onColumnFilterChange}
              uniqueStatuses={uniqueStatuses}
              uniqueCustomers={uniqueCustomers}
              editingStatus={editingStatus}
              onStatusEdit={onStatusEdit}
              onStatusSave={onStatusSave}
              onStatusCancel={onStatusCancel}
              dropdownOpen={dropdownOpen}
              onDropdownToggle={onDropdownToggle}
              onProjectClick={onProjectClick}
              onEditProject={onEditProject}
              onDeleteProject={onDeleteProject}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectList;
