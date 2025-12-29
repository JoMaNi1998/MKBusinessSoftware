/**
 * ProjectQuickViewModal Component
 *
 * Quick view modal showing project details when clicking on a calendar event.
 */

import React from 'react';
import { Building, User, Calendar, MapPin, FileText, Edit } from 'lucide-react';
import { BaseModal } from '@components/shared';
import type { ProjectQuickViewModalProps } from '@app-types/components/calendar.types';
import { getStatusLabel, STATUS_COLORS } from '../utils/calendarHelpers';

const ProjectQuickViewModal: React.FC<ProjectQuickViewModalProps> = ({
  isOpen,
  project,
  onClose,
  onEditDates
}) => {
  if (!project) return null;

  const statusColors = STATUS_COLORS[project.status];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const footerButtons = (
    <>
      <button
        onClick={onClose}
        className="px-4 py-2 text-gray-600 hover:text-gray-800"
      >
        Schließen
      </button>
      <button
        onClick={() => onEditDates(project)}
        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
      >
        <Edit className="h-4 w-4" />
        Termine bearbeiten
      </button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Projektdetails"
      icon={Building}
      footerButtons={footerButtons}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {/* Project Name and Status */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {project.name || project.projectName || 'Unbenanntes Projekt'}
            </h3>
            {project.customerName && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <User className="h-4 w-4" />
                {project.customerName}
              </p>
            )}
          </div>
          <span
            className="px-3 py-1 text-sm font-medium rounded-full"
            style={{
              backgroundColor: statusColors?.bg || '#f3f4f6',
              color: statusColors?.text || '#374151',
              borderWidth: '1px',
              borderColor: statusColors?.border || '#6b7280'
            }}
          >
            {getStatusLabel(project.status)}
          </span>
        </div>

        {/* Dates */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-700 mb-3">
            <Calendar className="h-5 w-5 text-primary-600" />
            <span className="font-medium">Zeitraum</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Start</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(project.startDate)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Ende</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(project.endDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Address */}
        {project.address && (project.address.strasse || project.address.ort) && (
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">
                {project.address.strasse && <span>{project.address.strasse}</span>}
                {project.address.strasse && project.address.plz && ', '}
                {project.address.plz && <span>{project.address.plz} </span>}
                {project.address.ort && <span>{project.address.ort}</span>}
              </p>
            </div>
          </div>
        )}

        {/* Description */}
        {project.description && (
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
            <p className="text-sm text-gray-600">{project.description}</p>
          </div>
        )}

        {/* Tip */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700">
            <strong>Tipp:</strong> Sie können Projekte im Kalender per Drag &amp; Drop verschieben
            oder durch Ziehen der Kanten die Dauer ändern.
          </p>
        </div>
      </div>
    </BaseModal>
  );
};

export default ProjectQuickViewModal;
