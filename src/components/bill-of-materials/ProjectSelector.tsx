import React from 'react';
import { Search, Building } from 'lucide-react';
import { getCustomerName } from '@utils';
import type { ProjectSelectorProps } from '@app-types/components/bom.types';

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  customersById,
  filteredProjects,
  projectSearch,
  setProjectSearch,
  onProjectSelect
}) => {
  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="pl-12 sm:pl-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Stückliste</h1>
          <p className="mt-1 text-sm text-gray-600 hidden sm:block">
            Wählen Sie ein Projekt für die Stückliste
          </p>
        </div>
      </div>

      {/* Statistik - Grid Layout */}
      <div className="grid grid-cols-1 gap-1.5 md:gap-4">
        <div className="bg-white p-2 md:p-4 rounded-lg shadow">
          <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Projekte</p>
          <p className="text-base md:text-2xl font-bold text-gray-900">{projects.length}</p>
        </div>
      </div>

      {/* Projektliste */}
      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col">
        {/* Header mit integrierter Suche */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0 space-y-3 sm:space-y-0">
          <div className="flex items-center justify-between sm:gap-3">
            <h3 className="text-lg font-medium text-gray-900 flex-shrink-0">Projekt auswählen</h3>

            {/* Desktop: Suche inline */}
            <div className="hidden sm:flex items-center gap-2 flex-1">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Suchen..."
                  value={projectSearch}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProjectSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Mobile: Suche als zweite Zeile */}
          <div className="flex sm:hidden items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Suchen..."
                value={projectSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProjectSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="divide-y divide-gray-200">
            {filteredProjects.map((project) => {
              const c = customersById.get(project.customerID);
              return (
                <button
                  key={project.id}
                  onClick={() => onProjectSelect(project)}
                  className="w-full text-left flex items-center space-x-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <Building className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {getCustomerName(c)} • {project.status}
                    </p>
                  </div>
                </button>
              );
            })}

            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <Building className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Projekte gefunden</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Versuchen Sie andere Suchbegriffe.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSelector;
