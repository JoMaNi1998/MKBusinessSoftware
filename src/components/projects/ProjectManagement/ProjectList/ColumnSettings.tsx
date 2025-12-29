import React, { useEffect, useRef } from 'react';
import { Settings } from 'lucide-react';
import { PROJECT_COLUMNS } from '@utils/projectHelpers';
import type { ProjectColumnConfig } from '@app-types/components/project.types';

interface VisibleColumns {
  [key: string]: boolean;
}

interface ColumnSettingsProps {
  isOpen: boolean;
  onToggle: () => void;
  visibleColumns: VisibleColumns;
  onToggleColumn: (columnKey: string) => void;
  loading: boolean;
}

const ColumnSettings: React.FC<ColumnSettingsProps> = ({
  isOpen,
  onToggle,
  visibleColumns,
  onToggleColumn,
  loading
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (isOpen && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onToggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  return (
    <div className="relative column-settings-container" ref={containerRef}>
      <button
        onClick={onToggle}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
        title="Spalten anpassen"
      >
        <Settings className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-20 border border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Spalten anzeigen</h3>
              {loading && (
                <div className="text-xs text-gray-500">Lädt...</div>
              )}
            </div>
            <div className="space-y-2">
              {PROJECT_COLUMNS.map((column: ProjectColumnConfig) => (
                <label key={column.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={visibleColumns[column.key]}
                    onChange={() => !column.required && onToggleColumn(column.key)}
                    disabled={column.required || loading}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className={`text-sm ${column.required ? 'text-gray-400' : 'text-gray-700'}`}>
                    {column.label}
                    {column.required && ' (erforderlich)'}
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Einstellungen werden automatisch in Firebase gespeichert
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnSettings;
