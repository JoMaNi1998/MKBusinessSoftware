import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, MapPin, ChevronRight, Search } from 'lucide-react';
import { useMonteurProjects } from './hooks';
import { getProjectStatusColor } from '@components/projects';
import type { Project } from '@app-types';

/**
 * MonteurProjectList - Mobile-optimierte Projektliste für Monteure
 *
 * Features:
 * - Nur zugewiesene Projekte
 * - Suchfunktion
 * - Gruppierung nach Status (aktiv/abgeschlossen)
 * - Touch-optimierte Karten
 */
const MonteurProjectList: React.FC = () => {
  const { activeProjects, completedProjects, onHoldProjects, loading } = useMonteurProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  // Suchfilter
  const filterProjects = (projects: Project[]) => {
    if (!searchTerm.trim()) return projects;
    const term = searchTerm.toLowerCase();
    return projects.filter(
      p =>
        p.name?.toLowerCase().includes(term) ||
        p.projectID?.toLowerCase().includes(term) ||
        p.customerName?.toLowerCase().includes(term) ||
        p.city?.toLowerCase().includes(term) ||
        p.address?.ort?.toLowerCase().includes(term)
    );
  };

  const filteredActive = filterProjects([...activeProjects, ...onHoldProjects]);
  const filteredCompleted = filterProjects(completedProjects);

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const renderProjectCard = (project: Project) => {
    const statusColor = getProjectStatusColor(project.status);
    const address = project.city || project.address?.ort;

    return (
      <Link
        key={project.id}
        to={`/monteur/projekt/${project.id}`}
        className="block bg-white rounded-xl shadow-sm border border-gray-200 p-4 active:bg-gray-50 touch-manipulation transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-gray-100 rounded-lg flex-shrink-0">
            <FolderOpen className="h-5 w-5 text-gray-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-gray-900 truncate">
                  {project.name || project.projectID}
                </h3>
                <p className="text-sm text-gray-500 truncate mt-0.5">
                  {project.customerName || 'Kein Kunde'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
            </div>

            <div className="flex items-center gap-3 mt-2">
              {address && (
                <div className="flex items-center text-xs text-gray-400">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span className="truncate max-w-[120px]">{address}</span>
                </div>
              )}
              <span
                className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColor}`}
              >
                {project.status}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="p-4 space-y-4">
      {/* Suchfeld */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Projekt suchen..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Aktive Projekte */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Aktive Projekte ({filteredActive.length})
        </h2>

        {filteredActive.length > 0 ? (
          <div className="space-y-3">{filteredActive.map(renderProjectCard)}</div>
        ) : (
          <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
            <p className="text-gray-500 text-sm">
              {searchTerm ? 'Keine aktiven Projekte gefunden' : 'Keine aktiven Projekte zugewiesen'}
            </p>
          </div>
        )}
      </div>

      {/* Abgeschlossene Projekte (Toggle) */}
      {completedProjects.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center justify-between w-full py-2 text-sm font-semibold text-gray-500 uppercase tracking-wide"
          >
            <span>Abgeschlossen ({filteredCompleted.length})</span>
            <ChevronRight
              className={`h-4 w-4 transition-transform ${showCompleted ? 'rotate-90' : ''}`}
            />
          </button>

          {showCompleted && (
            <div className="space-y-3 mt-3">
              {filteredCompleted.length > 0 ? (
                filteredCompleted.map(renderProjectCard)
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">
                  Keine abgeschlossenen Projekte gefunden
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MonteurProjectList;
