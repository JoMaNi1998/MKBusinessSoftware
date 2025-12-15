import React, { useState, useEffect, useRef } from 'react';
import { Settings } from 'lucide-react';

const ColumnSettings = ({
  visibleColumns,
  availableColumns,
  loadingPreferences,
  onToggleColumn
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const containerRef = useRef(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSettings && containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  return (
    <div className="relative column-settings-container" ref={containerRef}>
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
        title="Spalten anpassen"
      >
        <Settings className="h-5 w-5" />
      </button>
      {showSettings && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-20 border border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Spalten anzeigen</h3>
              {loadingPreferences && (
                <div className="text-xs text-gray-500">Lädt...</div>
              )}
            </div>
            <div className="space-y-2">
              {availableColumns.map(column => (
                <label key={column.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={visibleColumns[column.key]}
                    onChange={() => !column.required && onToggleColumn(column.key)}
                    disabled={column.required || loadingPreferences}
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
