import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { useMonteurBOM } from './hooks/useMonteurBOM';
import MonteurBOMList from './components/MonteurBOMList';

/**
 * MonteurBOM - Stücklisten-Ansicht für Monteure
 *
 * Mobile-optimierte, read-only Ansicht der Projekt-Stückliste.
 * Zeigt Materialien kategorisiert nach: Konfiguriert, Automatisch, Manuell
 */
const MonteurBOM: React.FC = () => {
  const navigate = useNavigate();
  const {
    project,
    configuredItems,
    autoItems,
    manualItems,
    totalCount,
    loading
  } = useMonteurBOM();

  // Loading State
  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-16 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Projekt nicht gefunden
  if (!project) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Projekt nicht gefunden
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            Das Projekt existiert nicht oder du hast keinen Zugriff.
          </p>
          <button
            onClick={() => navigate('/monteur/projekte')}
            className="text-primary-600 font-medium"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-warning-600" />
              <h1 className="text-lg font-bold text-gray-900">Stückliste</h1>
            </div>
            <p className="text-sm text-gray-500 truncate">
              {project.name || project.projectID}
            </p>
          </div>
          <div className="flex-shrink-0">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {totalCount} Positionen
            </span>
          </div>
        </div>
      </div>

      {/* BOM Liste */}
      <MonteurBOMList
        configuredItems={configuredItems}
        autoItems={autoItems}
        manualItems={manualItems}
      />
    </div>
  );
};

export default MonteurBOM;
