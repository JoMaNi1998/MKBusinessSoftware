/**
 * CalendarView Component
 *
 * Wrapper component for FullCalendar with all required plugins
 * and configuration for project scheduling.
 */

import React, { useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import type { CalendarViewProps } from '@app-types/components/calendar.types';
import { VIEW_CONFIG } from '../utils/calendarHelpers';

const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  currentView,
  currentDate,
  onEventClick,
  onEventDrop,
  onEventResize,
  onDateChange,
  calendarRef
}) => {
  // Update calendar view when currentView changes
  useEffect(() => {
    const calendarApi = (calendarRef.current as { getApi?: () => { changeView: (view: string) => void } })?.getApi?.();
    if (calendarApi) {
      calendarApi.changeView(VIEW_CONFIG[currentView].fullCalendarView);
    }
  }, [currentView, calendarRef]);

  // Update calendar date when currentDate changes
  useEffect(() => {
    const calendarApi = (calendarRef.current as { getApi?: () => { gotoDate: (date: Date) => void } })?.getApi?.();
    if (calendarApi) {
      calendarApi.gotoDate(currentDate);
    }
  }, [currentDate, calendarRef]);

  return (
    <div className="calendar-container bg-white rounded-lg shadow overflow-hidden">
      <FullCalendar
        ref={calendarRef as React.RefObject<FullCalendar>}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, multiMonthPlugin]}
        initialView={VIEW_CONFIG[currentView].fullCalendarView}
        initialDate={currentDate}
        events={events}
        locale="de"
        firstDay={1}
        headerToolbar={false}
        fixedWeekCount={false}
        height="auto"
        contentHeight="auto"
        aspectRatio={1.8}

        // Drag and drop
        editable={true}
        droppable={true}
        eventDrop={onEventDrop}
        eventResize={onEventResize}
        eventStartEditable={true}
        eventDurationEditable={true}
        eventResizableFromStart={true}

        // Click handling
        eventClick={onEventClick}

        // Date navigation callback - nur bei echten Änderungen (verhindert Endlosschleife)
        datesSet={(dateInfo) => {
          const newDateStr = dateInfo.start.toISOString().split('T')[0];
          const currentDateStr = currentDate.toISOString().split('T')[0];
          if (newDateStr !== currentDateStr) {
            onDateChange(dateInfo.start);
          }
        }}

        // Event display settings
        eventDisplay="block"
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          meridiem: false,
          hour12: false
        }}

        // All-day events settings
        allDaySlot={true}
        allDayText="Ganztägig"

        // Weekday header format
        dayHeaderFormat={{
          weekday: 'short'
        }}

        // German month names
        buttonText={{
          today: 'Heute',
          month: 'Monat',
          week: 'Woche',
          day: 'Tag',
          year: 'Jahr'
        }}

        // Event class names for styling
        eventClassNames="cursor-pointer hover:opacity-90 transition-opacity"

        // Year view specific settings
        multiMonthMaxColumns={3}
      />

      {/* Custom styles for FullCalendar */}
      <style>{`
        .fc {
          font-family: inherit;
        }
        .fc .fc-toolbar {
          display: none;
        }
        .fc .fc-daygrid-day-frame {
          min-height: 80px;
        }
        .fc .fc-daygrid-day-number {
          padding: 4px 8px;
          font-size: 0.875rem;
        }
        .fc .fc-col-header-cell-cushion {
          padding: 8px;
          font-weight: 500;
        }
        .fc .fc-event {
          border-radius: 4px;
          padding: 2px 4px;
          font-size: 0.75rem;
          border-width: 2px;
          border-left-width: 4px;
        }
        .fc .fc-event-title {
          font-weight: 500;
        }
        .fc .fc-daygrid-event {
          margin: 1px 2px;
        }
        .fc .fc-day-today {
          background-color: rgba(59, 130, 246, 0.1) !important;
        }
        .fc .fc-highlight {
          background-color: rgba(59, 130, 246, 0.15) !important;
        }
        .fc .fc-multimonth {
          border: none;
        }
        .fc .fc-multimonth-month {
          padding: 0.5rem;
        }
        .fc .fc-multimonth-header {
          background: transparent;
        }
        .fc .fc-multimonth-title {
          font-weight: 600;
          font-size: 1rem;
          padding: 0.5rem;
        }
        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: #e5e7eb;
        }
        .fc-timegrid-slot {
          height: 2.5rem;
        }
        /* Wochenend-Header (Spaltenüberschriften Sa/So) */
        .fc .fc-col-header-cell.fc-day-sat,
        .fc .fc-col-header-cell.fc-day-sun {
          background-color: #f3f4f6;
        }
        /* Wochenend-Zellen (Tage) */
        .fc .fc-daygrid-day.fc-day-sat,
        .fc .fc-daygrid-day.fc-day-sun {
          background-color: #f9fafb;
        }
      `}</style>
    </div>
  );
};

export default CalendarView;
