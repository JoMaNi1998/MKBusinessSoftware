/**
 * CalendarHeader Component
 *
 * Header section with title, view switcher, and navigation controls.
 */

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import type { CalendarHeaderProps, CalendarViewType } from '@app-types/components/calendar.types';
import { VIEW_CONFIG, getHeaderTitle } from '../utils/calendarHelpers';

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentView,
  currentDate,
  onViewChange,
  onNavigate
}) => {
  const viewTypes: CalendarViewType[] = ['month', 'year'];

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
      {/* Title and Today button */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Calendar className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {getHeaderTitle(currentDate, currentView)}
            </h1>
            <p className="text-sm text-gray-500">Projektkalender</p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('today')}
          className="px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
        >
          Heute
        </button>
      </div>

      {/* Navigation and View Switcher */}
      <div className="flex items-center gap-4">
        {/* Navigation arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigate('prev')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Zurück"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => onNavigate('next')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Vorwärts"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-gray-100 p-1 rounded-lg">
          {viewTypes.map((viewType) => (
            <button
              key={viewType}
              onClick={() => onViewChange(viewType)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === viewType
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {VIEW_CONFIG[viewType].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;
