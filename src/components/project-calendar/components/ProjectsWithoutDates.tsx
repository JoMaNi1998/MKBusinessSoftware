/**
 * ProjectsWithoutDates Component
 *
 * Displays a list of projects that don't have a start date set.
 * Allows users to set dates directly from the calendar view.
 */

import React from 'react';
import { CalendarPlus, User, FolderOpen } from 'lucide-react';
import type { Project, ProjectStatus } from '@app-types';
import { STATUS_COLORS } from '../utils/calendarHelpers';

interface ProjectsWithoutDatesProps {
  projects: Project[];
  onSetDate: (project: Project) => void;
}

const getStatusLabel = (status: ProjectStatus): string => {
  const labels: Record<ProjectStatus, string> = {
    planning: 'Planung',
    active: 'Aktiv',
    completed: 'Abgeschlossen',
    'on-hold': 'Pausiert',
    cancelled: 'Storniert'
  };
  return labels[status] || status;
};

const ProjectsWithoutDates: React.FC<ProjectsWithoutDatesProps> = ({
  projects,
  onSetDate
}) => {
  if (projects.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow mt-4 p-4">
      <div className="flex items-center gap-2 mb-4">
        <FolderOpen className="h-5 w-5 text-amber-500" />
        <h3 className="font-medium text-gray-900">
          Projekte ohne Termin ({projects.length})
        </h3>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Diese Projekte haben noch kein Startdatum und erscheinen daher nicht im Kalender.
      </p>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {projects.map((project) => {
          const colors = STATUS_COLORS[project.status] || STATUS_COLORS.planning;

          return (
            <div
              key={project.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 truncate">
                    {project.name || project.projectName || 'Unbenanntes Projekt'}
                  </p>
                  <span
                    className="px-2 py-0.5 text-xs rounded-full whitespace-nowrap"
                    style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderColor: colors.border,
                      borderWidth: '1px'
                    }}
                  >
                    {getStatusLabel(project.status)}
                  </span>
                </div>
                {project.customerName && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                    <User className="h-3 w-3" />
                    <span className="truncate">{project.customerName}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => onSetDate(project)}
                className="flex items-center gap-1.5 px-3 py-1.5 ml-3 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors whitespace-nowrap"
              >
                <CalendarPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Termin festlegen</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectsWithoutDates;
