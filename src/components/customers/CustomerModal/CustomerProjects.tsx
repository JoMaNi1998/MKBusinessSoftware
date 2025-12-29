import React from 'react';
import { Building } from 'lucide-react';
import { cn, formatDate } from '@utils';
import { ProjectStatus } from '@app-types/enums';
import type { Project } from '@app-types';

interface CustomerProjectsProps {
  customerProjects: Project[];
  onProjectClick?: (project: Project) => void;
}

const CustomerProjects: React.FC<CustomerProjectsProps> = ({ customerProjects, onProjectClick }) => {
  if (customerProjects.length === 0) {
    return (
      <div className="text-center py-8">
        <Building className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Projekte</h3>
        <p className="mt-1 text-sm text-gray-500">
          Für diesen Kunden wurden noch keine Projekte angelegt.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {customerProjects.map((project, index) => (
        <div
          key={index}
          className="bg-white border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => onProjectClick?.(project)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-900">{project.name}</span>
              <span
                className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  project.status === ProjectStatus.ACTIVE
                    ? 'bg-green-100 text-green-800'
                    : project.status === ProjectStatus.COMPLETED
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-yellow-100 text-yellow-800'
                )}
              >
                {project.status}
              </span>
            </div>
            {project.startDate && (
              <span className="text-sm text-gray-500">{formatDate(project.startDate)}</span>
            )}
          </div>

          {project.description && (
            <p className="text-sm text-gray-600 mb-2">{project.description}</p>
          )}

          {project.endDate && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Ende: {formatDate(project.endDate)}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CustomerProjects;
