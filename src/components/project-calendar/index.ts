// Main Component
export { default as ProjectCalendar } from './ProjectCalendar';
export { default } from './ProjectCalendar';

// Components
export { CalendarView, CalendarHeader } from './components';

// Modals
export { ProjectDateEditModal, ProjectQuickViewModal } from './modals';

// Hooks
export { useProjectCalendar } from './hooks';

// Utils
export {
  STATUS_COLORS,
  VIEW_CONFIG,
  STATUS_OPTIONS,
  projectToCalendarEvent,
  projectsToCalendarEvents,
  getStatusLabel,
  formatCalendarDate,
  getHeaderTitle
} from './utils';
