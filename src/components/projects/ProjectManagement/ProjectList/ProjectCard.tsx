import React from 'react';
import { User, MapPin, FileText } from 'lucide-react';
import { getProjectStatusColor, getProjectCustomerDisplayName, findProjectCustomerById, formatProjectAddressDisplay } from '@utils/projectHelpers';
import type { Project, Customer } from '@app-types';

interface VisibleColumns {
  [key: string]: boolean;
}

interface ProjectCardProps {
  project: Project;
  customers: Customer[];
  visibleColumns: VisibleColumns;
  onClick: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  customers,
  visibleColumns,
  onClick
}) => {
  const customer = findProjectCustomerById(customers, project.customerID);

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm active:bg-gray-50"
      onClick={() => onClick(project)}
    >
      {/* Header: Projekt + Status */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{project.name}</p>
          <p className="text-sm text-gray-500">{project.projectID}</p>
        </div>
        {visibleColumns.status && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getProjectStatusColor(project.status)}`}>
            {project.status}
          </span>
        )}
      </div>

      {/* Kunde */}
      {visibleColumns.customer && (
        <div className="mt-2 flex items-center text-sm text-gray-600">
          <User className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0" />
          <span className="truncate">{getProjectCustomerDisplayName(customer)}</span>
        </div>
      )}

      {/* Adresse */}
      {visibleColumns.address && formatProjectAddressDisplay(project) && (
        <div className="mt-1 flex items-center text-sm text-gray-500">
          <MapPin className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0" />
          <span className="truncate">{formatProjectAddressDisplay(project)}</span>
        </div>
      )}

      {/* Beschreibung */}
      {visibleColumns.description && project.description && (
        <div className="mt-2 text-xs text-gray-500">
          <FileText className="h-3 w-3 inline mr-1" />
          <span className="truncate">{project.description}</span>
        </div>
      )}
    </div>
  );
};

export default ProjectCard;
