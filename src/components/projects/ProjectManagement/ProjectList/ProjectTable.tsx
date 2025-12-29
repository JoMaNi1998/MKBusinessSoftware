import React, { MouseEvent, ChangeEvent } from 'react';
import { User, MapPin, FileText, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { PROJECT_STATUS_OPTIONS, getProjectStatusColor, getProjectCustomerDisplayName, findProjectCustomerById, formatProjectAddressDisplay } from '@utils/projectHelpers';
import ProjectTableHeader from './ProjectTableHeader';
import type { Project, Customer } from '@app-types';
import type { ProjectVisibleColumns, ProjectSortConfig, ProjectColumnFilters } from '@app-types/components/project.types';

interface ProjectTableProps {
  projects: Project[];
  customers: Customer[];
  visibleColumns: ProjectVisibleColumns;
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

const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  customers,
  visibleColumns,
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
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <ProjectTableHeader
        visibleColumns={visibleColumns}
        sortConfig={sortConfig}
        onSort={onSort}
        activeColumnFilter={activeColumnFilter}
        onToggleColumnFilter={onToggleColumnFilter}
        columnFilters={columnFilters}
        onColumnFilterChange={onColumnFilterChange}
        uniqueStatuses={uniqueStatuses}
        uniqueCustomers={uniqueCustomers}
      />
      <tbody className="bg-white divide-y divide-gray-200">
        {projects.map((project) => {
          const customer = findProjectCustomerById(customers, project.customerID);

          return (
            <tr
              key={project.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onProjectClick(project)}
            >
              {visibleColumns.name && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{project.name}</div>
                    <div className="text-sm text-gray-500">ID: {project.projectID}</div>
                  </div>
                </td>
              )}

              {visibleColumns.customer && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {getProjectCustomerDisplayName(customer)}
                    </span>
                  </div>
                </td>
              )}

              {visibleColumns.status && (
                <td className="px-6 py-4 whitespace-nowrap" onClick={(e: MouseEvent) => e.stopPropagation()}>
                  {editingStatus === project.id ? (
                    <select
                      value={project.status}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => onStatusSave(project.id, e.target.value)}
                      onBlur={onStatusCancel}
                      className="px-2 py-1 text-xs font-medium border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      autoFocus
                    >
                      {PROJECT_STATUS_OPTIONS.map((opt: { value: string; label: string }) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:ring-2 hover:ring-primary-300 ${getProjectStatusColor(project.status)}`}
                      onClick={() => onStatusEdit(project.id)}
                      title="Klicken zum Bearbeiten"
                    >
                      {project.status}
                    </span>
                  )}
                </td>
              )}

              {visibleColumns.address && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900 truncate max-w-xs">
                    {formatProjectAddressDisplay(project) || 'Nicht angegeben'}
                  </span>
                </td>
              )}

              {visibleColumns.description && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900 truncate max-w-xs">
                    {project.description || 'Keine Beschreibung'}
                  </span>
                </td>
              )}

              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="relative">
                  <button
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation();
                      onDropdownToggle(dropdownOpen === project.id ? null : project.id);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {dropdownOpen === project.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                      <div className="py-1">
                        <button
                          onClick={(e: MouseEvent) => {
                            e.stopPropagation();
                            onEditProject(project);
                          }}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Bearbeiten
                        </button>
                        <button
                          onClick={(e: MouseEvent) => {
                            e.stopPropagation();
                            onDeleteProject(project.id);
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
          );
        })}
      </tbody>
    </table>
  );
};

export default ProjectTable;
