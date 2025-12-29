/**
 * Calendar Helper Functions
 *
 * Utility functions for transforming project data to calendar events
 * and managing calendar-specific operations.
 */

import { Project, ProjectStatus } from '@app-types';
import type { CalendarProject, StatusColorsMap, CalendarViewConfig, CalendarViewType } from '@app-types/components/calendar.types';

// ============================================
// STATUS COLOR CONFIGURATION
// ============================================

export const STATUS_COLORS: StatusColorsMap = {
  [ProjectStatus.PLANNING]: {
    bg: '#fef3c7',
    border: '#f59e0b',
    text: '#92400e'
  },
  [ProjectStatus.ACTIVE]: {
    bg: '#dbeafe',
    border: '#3b82f6',
    text: '#1e40af'
  },
  [ProjectStatus.COMPLETED]: {
    bg: '#dcfce7',
    border: '#22c55e',
    text: '#166534'
  },
  [ProjectStatus.ON_HOLD]: {
    bg: '#f3f4f6',
    border: '#6b7280',
    text: '#374151'
  },
  [ProjectStatus.CANCELLED]: {
    bg: '#fee2e2',
    border: '#ef4444',
    text: '#991b1b'
  }
};

// ============================================
// VIEW CONFIGURATION
// ============================================

export const VIEW_CONFIG: Record<CalendarViewType, CalendarViewConfig> = {
  month: {
    type: 'month',
    label: 'Monat',
    fullCalendarView: 'dayGridMonth'
  },
  year: {
    type: 'year',
    label: 'Jahr',
    fullCalendarView: 'multiMonthYear'
  }
};

// ============================================
// STATUS OPTIONS FOR LEGEND
// ============================================

export const STATUS_OPTIONS = [
  { value: ProjectStatus.PLANNING, label: 'Planung', color: STATUS_COLORS[ProjectStatus.PLANNING].border },
  { value: ProjectStatus.ACTIVE, label: 'Aktiv', color: STATUS_COLORS[ProjectStatus.ACTIVE].border },
  { value: ProjectStatus.COMPLETED, label: 'Abgeschlossen', color: STATUS_COLORS[ProjectStatus.COMPLETED].border },
  { value: ProjectStatus.ON_HOLD, label: 'Pausiert', color: STATUS_COLORS[ProjectStatus.ON_HOLD].border },
  { value: ProjectStatus.CANCELLED, label: 'Storniert', color: STATUS_COLORS[ProjectStatus.CANCELLED].border }
];

// ============================================
// TRANSFORMATION FUNCTIONS
// ============================================

/**
 * Transform a single project to a calendar event
 */
export const projectToCalendarEvent = (project: Project): CalendarProject => {
  const colors = STATUS_COLORS[project.status] || STATUS_COLORS[ProjectStatus.PLANNING];

  // Use startDate or default to today
  const startDate = project.startDate || new Date().toISOString().split('T')[0];

  // Calculate end date - if no endDate, make it same as start (single day)
  let endDate = project.endDate;
  if (endDate) {
    // FullCalendar expects end date to be exclusive, so add one day
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);
    endDate = end.toISOString().split('T')[0];
  }

  return {
    id: project.id,
    title: project.name || project.projectName || project.projektName || 'Unbenanntes Projekt',
    start: startDate,
    end: endDate,
    allDay: true,
    extendedProps: {
      projectId: project.id,
      customerName: project.customerName,
      status: project.status,
      description: project.description,
      originalProject: project
    },
    backgroundColor: colors.bg,
    borderColor: colors.border,
    textColor: colors.text
  };
};

/**
 * Transform multiple projects to calendar events
 * Only includes projects with startDate defined
 */
export const projectsToCalendarEvents = (projects: Project[]): CalendarProject[] => {
  return projects
    .filter(p => p.startDate)
    .map(projectToCalendarEvent);
};

/**
 * Get status label in German
 */
export const getStatusLabel = (status: ProjectStatus): string => {
  const option = STATUS_OPTIONS.find(o => o.value === status);
  return option?.label || status;
};

/**
 * Format date for display
 */
export const formatCalendarDate = (date: Date): string => {
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Get month/year header text
 */
export const getHeaderTitle = (date: Date, view: CalendarViewType): string => {
  switch (view) {
    case 'month':
      return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    case 'year':
      return date.getFullYear().toString();
    default:
      return '';
  }
};
