import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, Plus, Info, ChevronRight } from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { useProjects } from '@context/ProjectContext';
import { ProjectStatus } from '@app-types/enums';

/**
 * MonteurDashboard - Startseite für Monteure
 *
 * Mobile-First Layout mit vertikalen Kacheln:
 * - Projekte
 * - Material Einbuchen
 * - Material Ausbuchen
 * - Material Info
 */
const MonteurDashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects, loading } = useProjects();

  // Nur Projekte wo der aktuelle User zugewiesen ist
  const myProjects = useMemo(() => {
    if (!user) return [];
    return projects.filter(p => p.assignedUsers?.includes(user.uid));
  }, [projects, user]);

  // Aktive Projekte zählen (deutsche + englische Status-Werte)
  const activeCount = useMemo(() => {
    return myProjects.filter(p => {
      const status = p.status as string;
      return status === ProjectStatus.ACTIVE ||
             status === ProjectStatus.PLANNING ||
             status === 'Aktiv' ||
             status === 'Geplant';
    }).length;
  }, [myProjects]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Projekte Kachel */}
      <Link
        to="/monteur/projekte"
        className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:bg-gray-50 transition-colors touch-manipulation flex items-center gap-4"
      >
        <div className="p-3 bg-primary-100 rounded-xl">
          <FolderOpen className="h-7 w-7 text-primary-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">Projekte</h3>
          <p className="text-sm text-gray-500">
            {activeCount} aktiv
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </Link>

      {/* Material Einbuchen Kachel */}
      <Link
        to="/monteur/material/einbuchen"
        className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:bg-gray-50 transition-colors touch-manipulation flex items-center gap-4"
      >
        <div className="p-3 bg-green-100 rounded-xl">
          <Plus className="h-7 w-7 text-green-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">Einbuchen</h3>
          <p className="text-sm text-gray-500">
            Material ins Lager
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </Link>

      {/* Material Info Kachel */}
      <Link
        to="/monteur/material/info"
        className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:bg-gray-50 transition-colors touch-manipulation flex items-center gap-4"
      >
        <div className="p-3 bg-blue-100 rounded-xl">
          <Info className="h-7 w-7 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">Material Info</h3>
          <p className="text-sm text-gray-500">
            Details und Bestand
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </Link>
    </div>
  );
};

export default MonteurDashboard;
