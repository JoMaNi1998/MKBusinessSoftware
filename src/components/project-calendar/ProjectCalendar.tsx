/**
 * ProjectCalendar Component
 *
 * Main calendar component for visualizing and managing project schedules.
 * Provides week, month, and year views with drag-and-drop support.
 */

import React from 'react';
import { Loader2, CalendarX } from 'lucide-react';
import { CalendarView, CalendarHeader, ProjectsWithoutDates } from './components';
import { ProjectDateEditModal, ProjectQuickViewModal } from './modals';
import { useProjectCalendar } from './hooks';
import type { CalendarViewType } from '@app-types/components/calendar.types';

const ProjectCalendar: React.FC = () => {
  const {
    // View State
    currentView,
    setCurrentView,
    currentDate,
    setCurrentDate,

    // Data
    filteredEvents,
    projectsWithoutDates,
    isLoading,

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
  } = useProjectCalendar();

  // Handle navigation
  const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      goToToday();
      return;
    }

    const newDate = new Date(currentDate);

    switch (currentView) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }

    setCurrentDate(newDate);
  };

  // Handle view change
  const handleViewChange = (view: CalendarViewType) => {
    setCurrentView(view);
  };

  // Handle date change from calendar
  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Lade Projekte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header */}
      <CalendarHeader
        currentView={currentView}
        currentDate={currentDate}
        onViewChange={handleViewChange}
        onNavigate={handleNavigate}
      />

      {/* Calendar or Empty State */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <CalendarX className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Keine Projekte gefunden
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Es gibt noch keine Projekte mit Terminen. Legen Sie Startdaten für Ihre Projekte fest, um sie im Kalender zu sehen.
          </p>
        </div>
      ) : (
        <CalendarView
          events={filteredEvents}
          currentView={currentView}
          currentDate={currentDate}
          onEventClick={handleEventClick}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          onDateChange={handleDateChange}
          calendarRef={calendarRef}
        />
      )}

      {/* Projects without dates */}
      <ProjectsWithoutDates
        projects={projectsWithoutDates}
        onSetDate={openDateEditModal}
      />

      {/* Modals */}
      <ProjectQuickViewModal
        isOpen={isQuickViewModalOpen}
        project={selectedProject}
        onClose={closeQuickViewModal}
        onEditDates={openDateEditModal}
      />

      <ProjectDateEditModal
        isOpen={isDateEditModalOpen}
        project={selectedProject}
        onClose={closeDateEditModal}
        onSave={handleSaveDates}
      />
    </div>
  );
};

export default ProjectCalendar;
