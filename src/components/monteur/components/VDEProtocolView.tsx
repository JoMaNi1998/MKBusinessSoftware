import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ChevronRight, Loader2, Edit3 } from 'lucide-react';
import { FirebaseService } from '@services/firebaseService';
import { useNotification } from '@context/NotificationContext';
import { NotificationType } from '@app-types/enums';
import type { VDEProtocol } from '@app-types';

interface VDEProtocolViewProps {
  projectId: string;
}

/**
 * VDEProtocolView - VDE-Protokoll Ansicht fuer Monteure
 *
 * Features:
 * - Liste der VDE-Protokolle fuer das Projekt
 * - Navigiert zur mobilen Bearbeitungsseite
 * - Status-Anzeige
 */
const VDEProtocolView: React.FC<VDEProtocolViewProps> = ({ projectId }) => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [protocols, setProtocols] = useState<VDEProtocol[]>([]);
  const [loading, setLoading] = useState(true);

  // Protokolle laden
  useEffect(() => {
    const loadProtocols = async () => {
      try {
        setLoading(true);
        const data = await FirebaseService.queryDocuments(
          'vde-protocols',
          'projectID',
          '==',
          projectId
        );
        setProtocols(data as VDEProtocol[]);
      } catch (error) {
        console.error('Fehler beim Laden der VDE-Protokolle:', error);
        showNotification('VDE-Protokolle konnten nicht geladen werden', NotificationType.ERROR);
      } finally {
        setLoading(false);
      }
    };

    loadProtocols();
  }, [projectId, showNotification]);

  // Protokoll zum Bearbeiten oeffnen
  const handleEditProtocol = (protocol: VDEProtocol) => {
    navigate(`/monteur/projekt/${projectId}/vde/${protocol.id}/edit`);
  };

  // Status-Farbe
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Erstellt':
        return 'bg-yellow-100 text-yellow-700';
      case 'Geprüft':
        return 'bg-blue-100 text-blue-700';
      case 'Abgeschlossen':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Datum formatieren
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Protokoll-Liste */}
      {protocols.length > 0 ? (
        <div className="space-y-2">
          {protocols.map(protocol => (
            <button
              key={protocol.id}
              onClick={() => handleEditProtocol(protocol)}
              className="w-full bg-white rounded-lg p-4 text-left border border-gray-200 hover:border-gray-300 active:bg-gray-50 transition-colors touch-manipulation"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {protocol.protocolNumber || 'Ohne Nummer'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(protocol.createdDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                      protocol.status
                    )}`}
                  >
                    {protocol.status}
                  </span>
                  <Edit3 className="h-4 w-4 text-primary-600" />
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="h-10 w-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">Keine VDE-Protokolle vorhanden</p>
          <p className="text-xs text-gray-400 mt-1">
            Protokolle werden vom Projektleiter erstellt
          </p>
        </div>
      )}
    </div>
  );
};

export default VDEProtocolView;
