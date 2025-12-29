/**
 * Type Definitions for Project Calendar Components
 */

import type { Project, ProjectStatus } from '../base.types';
import type { EventInput, EventClickArg, EventDropArg } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';

// ============================================
// CALENDAR VIEW TYPES
// ============================================

export type CalendarViewType = 'month' | 'year';

export interface CalendarViewConfig {
  type: CalendarViewType;
  label: string;
  fullCalendarView: string;
}

// ============================================
// CALENDAR EVENT TYPES
// ============================================

export interface CalendarProject extends EventInput {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  extendedProps: {
    projectId: string;
    customerName?: string;
    status: ProjectStatus;
    description?: string;
    originalProject: Project;
  };
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
}

export interface CalendarDateRange {
  start: Date;
  end: Date;
}

// ============================================
// FILTER TYPES
// ============================================

export interface CalendarFilters {
  status: ProjectStatus | 'all';
  customerID: string;
  searchTerm: string;
}

// ============================================
// DRAG-DROP TYPES
// ============================================

export interface ProjectDropInfo {
  projectId: string;
  newStartDate: string;
  newEndDate?: string;
  delta: {
    years: number;
    months: number;
    days: number;
  };
}

export interface ProjectResizeInfo {
  projectId: string;
  newEndDate: string;
  delta: {
    years: number;
    months: number;
    days: number;
  };
}

// ============================================
// HOOK RETURN TYPES
// ============================================

export interface UseProjectCalendarReturn {
  // View State
  currentView: CalendarViewType;
  setCurrentView: (view: CalendarViewType) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;

  // Data
  calendarEvents: CalendarProject[];
  filteredEvents: CalendarProject[];
  projectsWithoutDates: Project[];
  isLoading: boolean;

  // Modal State
  selectedProject: Project | null;
  isDateEditModalOpen: boolean;
  isQuickViewModalOpen: boolean;

  // Handlers
  handleEventClick: (eventInfo: EventClickArg) => void;
  handleEventDrop: (dropInfo: EventDropArg) => Promise<void>;
  handleEventResize: (resizeInfo: EventResizeDoneArg) => Promise<void>;
  openDateEditModal: (project: Project) => void;
  closeDateEditModal: () => void;
  closeQuickViewModal: () => void;
  handleSaveDates: (projectId: string, startDate: string, endDate?: string) => Promise<void>;

  // Navigation
  goToToday: () => void;
  calendarRef: React.RefObject<unknown>;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface CalendarHeaderProps {
  currentView: CalendarViewType;
  currentDate: Date;
  onViewChange: (view: CalendarViewType) => void;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
}

export interface CalendarViewProps {
  events: CalendarProject[];
  currentView: CalendarViewType;
  currentDate: Date;
  onEventClick: (eventInfo: EventClickArg) => void;
  onEventDrop: (dropInfo: EventDropArg) => void;
  onEventResize: (resizeInfo: EventResizeDoneArg) => void;
  onDateChange: (date: Date) => void;
  calendarRef: React.RefObject<unknown>;
}

export interface ProjectDateEditModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onSave: (projectId: string, startDate: string, endDate?: string) => Promise<void>;
}

export interface ProjectQuickViewModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onEditDates: (project: Project) => void;
}

// ============================================
// STATUS COLORS
// ============================================

export interface StatusColorConfig {
  bg: string;
  border: string;
  text: string;
}

export type StatusColorsMap = Record<ProjectStatus, StatusColorConfig>;
