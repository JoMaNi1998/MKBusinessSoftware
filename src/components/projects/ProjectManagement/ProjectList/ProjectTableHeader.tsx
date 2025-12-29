import React, { ChangeEvent, ReactNode } from 'react';
import { Filter } from 'lucide-react';
import type { ProjectVisibleColumns, ProjectSortConfig, ProjectColumnFilters } from '@app-types/components/project.types';

interface ProjectTableHeaderProps {
  visibleColumns: ProjectVisibleColumns;
  sortConfig: ProjectSortConfig;
  onSort: (key: string) => void;
  activeColumnFilter: string | null;
  onToggleColumnFilter: (filter: string | null) => void;
  columnFilters: ProjectColumnFilters;
  onColumnFilterChange: (column: string, value: string) => void;
  uniqueStatuses: string[];
  uniqueCustomers: string[];
}

const ProjectTableHeader: React.FC<ProjectTableHeaderProps> = ({
  visibleColumns,
  sortConfig,
  onSort,
  activeColumnFilter,
  onToggleColumnFilter,
  columnFilters,
  onColumnFilterChange,
  uniqueStatuses,
  uniqueCustomers
}) => {
  const renderSortIcon = (key: string): ReactNode => {
    if (sortConfig.key === key) {
      return (
        <span className="text-gray-400 hover:text-gray-600 text-lg font-bold">
          {sortConfig.direction === 'asc' ? '↑' : '↓'}
        </span>
      );
    }
    return <Filter className="h-3 w-3 text-gray-400 hover:text-gray-600" />;
  };

  const renderFilterDropdown = (column: string, options: string[]): ReactNode => (
    activeColumnFilter === column && (
      <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-30 border border-gray-200">
        <div className="p-2">
          <select
            value={columnFilters[column]}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => onColumnFilterChange(column, e.target.value)}
            className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
          >
            {options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
    )
  );

  return (
    <thead className="bg-gray-50 sticky top-0 z-10">
      <tr>
        {visibleColumns.name && (
          <th
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
            onClick={() => onSort('name')}
          >
            <div className="flex items-center space-x-1">
              <span>PROJEKT</span>
              <div className="relative">
                {renderSortIcon('name')}
              </div>
            </div>
          </th>
        )}

        {visibleColumns.customer && (
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="flex items-center space-x-1">
              <span>Kunde</span>
              <div className="relative">
                <button
                  onClick={() => onToggleColumnFilter(activeColumnFilter === 'customer' ? null : 'customer')}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <Filter className="h-3 w-3" />
                </button>
                {renderFilterDropdown('customer', uniqueCustomers)}
              </div>
            </div>
          </th>
        )}

        {visibleColumns.status && (
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="flex items-center space-x-1">
              <span>Status</span>
              <div className="relative">
                <button
                  onClick={() => onToggleColumnFilter(activeColumnFilter === 'status' ? null : 'status')}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <Filter className="h-3 w-3" />
                </button>
                {renderFilterDropdown('status', uniqueStatuses)}
              </div>
            </div>
          </th>
        )}

        {visibleColumns.address && (
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Adresse
          </th>
        )}

        {visibleColumns.description && (
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Beschreibung
          </th>
        )}

        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Aktionen
        </th>
      </tr>
    </thead>
  );
};

export default ProjectTableHeader;
