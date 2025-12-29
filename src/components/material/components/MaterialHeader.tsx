import React from 'react';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { BookingType } from '@app-types';
import type { MaterialHeaderProps } from '@app-types/components/material.types';

const MaterialHeader: React.FC<MaterialHeaderProps> = ({ onOpenBooking, onAddMaterial }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="pl-12 sm:pl-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Materialien</h1>
        <p className="mt-1 text-sm text-gray-600 hidden sm:block">
          Verwalten Sie Ihre PV-Materialien und Bestände
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onOpenBooking(BookingType.IN)}
          className="flex-1 sm:flex-none bg-green-600 text-white px-3 sm:px-4 py-2 text-sm font-medium rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          <span className="hidden sm:inline">Einbuchen</span>
          <span className="sm:hidden">Ein</span>
        </button>
        <button
          onClick={() => onOpenBooking(BookingType.OUT)}
          className="flex-1 sm:flex-none bg-red-600 text-white px-3 sm:px-4 py-2 text-sm font-medium rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
        >
          <TrendingDown className="h-4 w-4" />
          <span className="hidden sm:inline">Ausbuchen</span>
          <span className="sm:hidden">Aus</span>
        </button>
        <button
          onClick={onAddMaterial}
          className="flex-1 sm:flex-none bg-primary-600 text-white px-3 sm:px-4 py-2 text-sm font-medium rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Material hinzufügen</span>
          <span className="sm:hidden">Neu</span>
        </button>
      </div>
    </div>
  );
};

export default MaterialHeader;
