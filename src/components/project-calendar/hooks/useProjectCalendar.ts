/**
 * useProjectCalendar Hook
 *
 * Manages state and operations for the Project Calendar component.
 * Handles view switching, filtering, drag-drop events, and modal states.
 */

import { useState, useMemo, useCallback, useRef } from 'react';
import { useProjects } from '@context/ProjectContext';
import { useNotification } from '@context/NotificationContext';
import { NotificationType } from '@app-types';
import type { Project } from '@app-types';
import type {
  CalendarViewType,
  UseProjectCalendarReturn,
  CalendarProject
} from '@app-types/components/calendar.types';
import type { EventClickArg, EventDropArg } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import { projectsToCalendarEvents } from '../utils/calendarHelpers';

// Helper: Format date as YYYY-MM-DD in local timezone (avoids UTC conversion issues)
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useProjectCalendar = (): UseProjectCalendarReturn => {
  const { projects, updateProject, loading } = useProjects();
  const { showNotification } = useNotification();

  // Calendar ref for API access
  const calendarRef = useRef<unknown>(null);

  // View State
  const [currentView, setCurrentView] = useState<CalendarViewType>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Modal State
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDateEditModalOpen, setIsDateEditModalOpen] = useState(false);
  const [isQuickViewModalOpen, setIsQuickViewModalOpen] = useState(false);

  // Transform projects to calendar events
  const calendarEvents = useMemo((): CalendarProject[] =>
    projectsToCalendarEvents(projects),
    [projects]
  );

  // Projects without dates (for separate list)
  const projectsWithoutDates = useMemo(() =>
    projects.filter(p => !p.startDate),
    [projects]
  );

  // Event click handler - show quick view modal
  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const project = clickInfo.event.extendedProps.originalProject;
    setSelectedProject(project);
    setIsQuickViewModalOpen(true);
  }, []);

  // Event drop handler - update project dates after drag
  const handleEventDrop = useCallback(async (dropInfo: EventDropArg) => {
    const { event, revert } = dropInfo;
    const projectId = event.extendedProps.projectId;
    const originalProject = event.extendedProps.originalProject;

    // Calculate new dates using local timezone
    const newStartDate = event.start ? formatLocalDate(event.start) : undefined;

    // For end date, subtract one day because FullCalendar uses exclusive end
    let newEndDate: string | undefined;
    if (event.end) {
      const endDate = new Date(event.end);
      endDate.setDate(endDate.getDate() - 1);
      newEndDate = formatLocalDate(endDate);
    } else if (originalProject.endDate) {
      // If there was an original end date, calculate new end based on duration
      const originalStart = new Date(originalProject.startDate || '');
      const originalEnd = new Date(originalProject.endDate);
      const duration = Math.round((originalEnd.getTime() - originalStart.getTime()) / (1000 * 60 * 60 * 24));
      if (event.start) {
        const newEnd = new Date(event.start);
        newEnd.setDate(newEnd.getDate() + duration);
        newEndDate = formatLocalDate(newEnd);
      }
    }

    if (!newStartDate) {
      revert();
      showNotification('Ungültiges Datum', NotificationType.ERROR);
      return;
    }

    try {
      await updateProject(projectId, {
        startDate: newStartDate,
        endDate: newEndDate
      });
      showNotification('Projekttermin aktualisiert', NotificationType.SUCCESS);
    } catch (error) {
      console.error('Error updating project dates:', error);
      revert();
      showNotification('Fehler beim Aktualisieren des Termins', NotificationType.ERROR);
    }
  }, [updateProject, showNotification]);

  // Event resize handler - update project start and/or end date
  const handleEventResize = useCallback(async (resizeInfo: EventResizeDoneArg) => {
    const { event, revert, startDelta, endDelta } = resizeInfo;
    const projectId = event.extendedProps.projectId;
    const originalProject = event.extendedProps.originalProject;

    // Berechne neue Daten basierend auf den Deltas (nicht aus event.start/end)
    let newStartDate = originalProject.startDate;
    let newEndDate = originalProject.endDate;

    // Wenn startDelta existiert und nicht 0 ist, wurde der Anfang verschoben
    if (startDelta && (startDelta.days !== 0 || startDelta.months !== 0)) {
      const start = new Date(originalProject.startDate || '');
      start.setDate(start.getDate() + (startDelta.days || 0));
      start.setMonth(start.getMonth() + (startDelta.months || 0));
      newStartDate = formatLocalDate(start);
    }

    // Wenn endDelta existiert und nicht 0 ist, wurde das Ende verschoben
    if (endDelta && (endDelta.days !== 0 || endDelta.months !== 0)) {
      const end = new Date(originalProject.endDate || originalProject.startDate || '');
      end.setDate(end.getDate() + (endDelta.days || 0));
      end.setMonth(end.getMonth() + (endDelta.months || 0));
      newEndDate = formatLocalDate(end);
    }

    // Validierung
    if (!newStartDate) {
      revert();
      showNotification('Ungültiges Datum', NotificationType.ERROR);
      return;
    }

    try {
      await updateProject(projectId, {
        startDate: newStartDate,
        endDate: newEndDate
      });
      showNotification('Projektdauer aktualisiert', NotificationType.SUCCESS);
    } catch (error) {
      console.error('Error updating project dates:', error);
      revert();
      showNotification('Fehler beim Aktualisieren der Projektdauer', NotificationType.ERROR);
    }
  }, [updateProject, showNotification]);

  // Open date edit modal
  const openDateEditModal = useCallback((project: Project) => {
    setSelectedProject(project);
    setIsQuickViewModalOpen(false);
    setIsDateEditModalOpen(true);
  }, []);

  // Close date edit modal
  const closeDateEditModal = useCallback(() => {
    setIsDateEditModalOpen(false);
    setSelectedProject(null);
  }, []);

  // Close quick view modal
  const closeQuickViewModal = useCallback(() => {
    setIsQuickViewModalOpen(false);
    setSelectedProject(null);
  }, []);

  // Save dates from modal
  const handleSaveDates = useCallback(async (
    projectId: string,
    startDate: string,
    endDate?: string
  ) => {
    try {
      await updateProject(projectId, {
        startDate,
        endDate: endDate || undefined
      });
      showNotification('Projekttermine aktualisiert', NotificationType.SUCCESS);
      closeDateEditModal();
    } catch (error) {
      console.error('Error saving project dates:', error);
      showNotification('Fehler beim Speichern der Termine', NotificationType.ERROR);
    }
  }, [updateProject, showNotification, closeDateEditModal]);

  // Navigate to today
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  return {
    // View State
    currentView,
    setCurrentView,
    currentDate,
    setCurrentDate,

    // Data
    calendarEvents,
    filteredEvents: calendarEvents, // No filtering - return all events
    projectsWithoutDates,
    isLoading: loading,

    // Modal State
    selectedProject,
    isDateEditModalOpen,
    isQuickViewModalOpen,

    // Handlers
    handleEventClick,
    handleEventDrop,
    handleEventResize,
    openDateEditModal,
    closeDateEditModal,
    closeQuickViewModal,
    handleSaveDates,

    // Navigation
    goToToday,
    calendarRef
  };
};

export default useProjectCalendar;
