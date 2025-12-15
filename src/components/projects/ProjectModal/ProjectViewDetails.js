import React from 'react';
import { Building, Hash, User, UserCheck, MapPin, Mail, Phone } from 'lucide-react';
import { cn, getStatusColor, addressFromParts, parseAddress } from '../utils';

const ProjectViewDetails = ({ project, customerOfProject }) => {
  const addr = project.address || addressFromParts(parseAddress(project.address || ''));

  // Get contact person details
  const contactPerson = project.contactPersonId
    ? customerOfProject?.contacts?.find((c) => c.id === project.contactPersonId)
    : null;

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Projektinformationen</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Projektname */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Building className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Projektname</span>
          </div>
          <p className="text-gray-900 ml-6">{project.name}</p>
        </div>

        {/* Projekt-ID */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Hash className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Projekt-ID</span>
          </div>
          <p className="text-gray-900 ml-6">{project.projectID || project.id}</p>
        </div>

        {/* Status */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Hash className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Status</span>
          </div>
          <div className="ml-6">
            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColor(project.status))}>
              {project.status}
            </span>
          </div>
        </div>

        {/* Kunde */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Kunde</span>
          </div>
          <p className="text-gray-900 ml-6">
            {customerOfProject?.firmennameKundenname || project.customerName || 'Unbekannter Kunde'}
          </p>
        </div>

        {/* Ansprechpartner */}
        {project.contactPersonId && contactPerson && (
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-2">
              <UserCheck className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Ansprechpartner</span>
            </div>
            <div className="ml-6 bg-white p-3 rounded border">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-gray-900">{contactPerson.name}</span>
                {contactPerson.position && (
                  <span className="text-sm text-gray-500">({contactPerson.position})</span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {contactPerson.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-600">{contactPerson.email}</span>
                  </div>
                )}
                {contactPerson.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-600">{contactPerson.phone}</span>
                  </div>
                )}
              </div>
              {contactPerson.notes && (
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">Notizen:</span> {contactPerson.notes}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fallback für nicht mehr verfügbaren Kontakt */}
        {project.contactPersonId && !contactPerson && project.contactPersonName && (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <UserCheck className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Ansprechpartner</span>
            </div>
            <p className="text-gray-900 ml-6">
              {project.contactPersonName}{' '}
              <span className="text-sm text-gray-500">(Kontakt nicht mehr verfügbar)</span>
            </p>
          </div>
        )}

        {/* Adresse */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Adresse</span>
          </div>
          <p className="text-gray-900 ml-6">{addr || 'Nicht angegeben'}</p>
        </div>
      </div>

      {/* Beschreibung */}
      {project.description && (
        <div className="mt-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-gray-700">Beschreibung</span>
          </div>
          <p className="text-gray-900 bg-white p-3 rounded border">{project.description}</p>
        </div>
      )}

      {/* Notizen */}
      {project.notes && (
        <div className="mt-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-gray-700">Notizen</span>
          </div>
          <p className="text-gray-900 bg-white p-3 rounded border">{project.notes}</p>
        </div>
      )}
    </div>
  );
};

export default ProjectViewDetails;
