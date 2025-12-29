import React from 'react';
import { Building, User, MapPin } from 'lucide-react';
import { getCustomerName, getCustomerAddress } from '@utils';
import type { ProjectInfoCardProps } from '@app-types/components/bom.types';

const ProjectInfoCard: React.FC<ProjectInfoCardProps> = ({ project, customer }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 print:hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-start space-x-3">
          <Building className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Projekt</p>
            <p className="font-medium text-gray-900">{project?.name || 'Unbekannt'}</p>
            <p className="text-sm text-gray-500">Status: {project?.status || 'Unbekannt'}</p>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <User className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Kunde</p>
            <p className="font-medium text-gray-900">{getCustomerName(customer)}</p>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <MapPin className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Adresse</p>
            <p className="font-medium text-gray-900">{getCustomerAddress(customer)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectInfoCard;
