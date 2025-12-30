import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Save, Loader2, AlertCircle, Check } from 'lucide-react';
import { useVDEEdit } from './hooks';
import { useNotification } from '@context/NotificationContext';
import { NotificationType } from '@app-types/enums';
import VDEMobilePage1 from './components/VDEMobilePage1';
import VDEMobilePage2 from './components/VDEMobilePage2';
import VDEMobilePage3 from './components/VDEMobilePage3';
import VDEMobilePage4 from './components/VDEMobilePage4';
import VDEMobilePage5 from './components/VDEMobilePage5';

const PAGE_NAMES = [
  'Anlagenuebersicht',
  'Besichtigung (1)',
  'Besichtigung (2)',
  'AC-Seite Pruefung',
  'PV-Generator'
];

/**
 * MonteurVDEEdit - Mobile VDE-Protokoll Bearbeitung
 *
 * Features:
 * - 5-seitiges Formular mit Navigation
 * - Touch-optimierte Inputs
 * - Auto-Save beim Seitenwechsel oder manuell
 */
const MonteurVDEEdit: React.FC = () => {
  const { id: projectId, protocolId } = useParams<{ id: string; protocolId: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const {
    protocol,
    vdeData,
    loading,
    saving,
    error,
    updateField,
    saveProtocol,
    hasChanges
  } = useVDEEdit(protocolId);

  const [currentPage, setCurrentPage] = useState(0);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Seite wechseln
  const goToPage = useCallback((page: number) => {
    if (page >= 0 && page < 5) {
      setCurrentPage(page);
    }
  }, []);

  // Speichern
  const handleSave = useCallback(async () => {
    const success = await saveProtocol();
    if (success) {
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    }
  }, [saveProtocol]);

  // Zurueck zur Liste
  const handleBack = useCallback(() => {
    if (hasChanges) {
      // Bei Aenderungen erst speichern
      saveProtocol().then(success => {
        if (success) {
          navigate(`/monteur/projekt/${projectId}/vde`);
        }
      });
    } else {
      navigate(`/monteur/projekt/${projectId}/vde`);
    }
  }, [hasChanges, saveProtocol, navigate, projectId]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-3" />
          <p className="text-gray-500">Protokoll wird geladen...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !vdeData) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-red-900 mb-2">
            {error || 'Protokoll nicht gefunden'}
          </h3>
          <button
            onClick={() => navigate(`/monteur/projekt/${projectId}/vde`)}
            className="text-red-600 font-medium"
          >
            Zurueck zur Liste
          </button>
        </div>
      </div>
    );
  }

  // Aktuelle Seite rendern
  const renderCurrentPage = () => {
    const pageProps = {
      vdeData,
      handleVdeDataChange: updateField
    };

    switch (currentPage) {
      case 0:
        return <VDEMobilePage1 {...pageProps} />;
      case 1:
        return <VDEMobilePage2 {...pageProps} />;
      case 2:
        return <VDEMobilePage3 {...pageProps} />;
      case 3:
        return <VDEMobilePage4 {...pageProps} />;
      case 4:
        return <VDEMobilePage5 {...pageProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100dvh-64px)]">
      {/* Sticky Header mit Speichern */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="w-10" />

          <div className="text-center flex-1">
            <h2 className="font-medium text-gray-900 text-sm">
              {protocol?.protocolNumber || 'VDE-Protokoll'}
            </h2>
            <p className="text-xs text-gray-500">
              Seite {currentPage + 1} von 5
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`p-2 rounded-lg transition-colors touch-manipulation flex items-center gap-1 ${
              showSaveSuccess
                ? 'bg-green-100 text-green-600'
                : hasChanges
                ? 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : showSaveSuccess ? (
              <Check className="h-5 w-5" />
            ) : (
              <Save className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mt-3">
          {PAGE_NAMES.map((name, index) => (
            <button
              key={index}
              onClick={() => goToPage(index)}
              className={`h-2 rounded-full transition-all touch-manipulation ${
                index === currentPage
                  ? 'w-6 bg-primary-600'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
              title={name}
            />
          ))}
        </div>
      </div>

      {/* Seiten-Titel */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
        <h3 className="font-medium text-gray-900">{PAGE_NAMES[currentPage]}</h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {renderCurrentPage()}
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 safe-area-bottom z-30">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors touch-manipulation ${
              currentPage === 0
                ? 'bg-gray-100 text-gray-400'
                : 'bg-gray-100 text-gray-700 active:bg-gray-200'
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
            Zurueck
          </button>

          {currentPage < 4 ? (
            <button
              onClick={() => goToPage(currentPage + 1)}
              className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 active:bg-primary-700 transition-colors touch-manipulation"
            >
              Weiter
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 px-4 bg-green-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 active:bg-green-700 transition-colors touch-manipulation disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Check className="h-5 w-5" />
              )}
              Speichern
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonteurVDEEdit;
