import { useMemo } from 'react';
import { useProjects } from '@context/ProjectContext';
import { useAuth } from '@context/AuthContext';
import { ProjectStatus } from '@app-types/enums';
import type { Project } from '@app-types';

interface UseMonteurProjectsReturn {
  /** Alle zugewiesenen Projekte */
  assignedProjects: Project[];
  /** Aktive und geplante Projekte */
  activeProjects: Project[];
  /** Abgeschlossene Projekte */
  completedProjects: Project[];
  /** Pausierte Projekte */
  onHoldProjects: Project[];
  /** Loading State */
  loading: boolean;
  /** Error State */
  error: string | null;
}

/**
 * useMonteurProjects - Hook für Monteur-spezifische Projektfilterung
 *
 * Filtert Projekte nach:
 * - assignedUsers enthält aktuelle User-ID
 * - Gruppiert nach Status
 */
export const useMonteurProjects = (): UseMonteurProjectsReturn => {
  const { projects, loading, error } = useProjects();
  const { user } = useAuth();

  // Nur Projekte wo aktueller User in assignedUsers ist
  const assignedProjects = useMemo(() => {
    if (!user) return [];
    return projects.filter(p => p.assignedUsers?.includes(user.uid));
  }, [projects, user]);

  // Aktive Projekte (ACTIVE + PLANNING) - unterstütze deutsche und englische Status
  const activeProjects = useMemo(() => {
    return assignedProjects.filter(p => {
      const status = p.status as string;
      return status === ProjectStatus.ACTIVE ||
             status === ProjectStatus.PLANNING ||
             status === 'Aktiv' ||
             status === 'Geplant';
    });
  }, [assignedProjects]);

  // Abgeschlossene Projekte
  const completedProjects = useMemo(() => {
    return assignedProjects.filter(p => {
      const status = p.status as string;
      return status === ProjectStatus.COMPLETED || status === 'Abgeschlossen';
    });
  }, [assignedProjects]);

  // Pausierte Projekte
  const onHoldProjects = useMemo(() => {
    return assignedProjects.filter(p => {
      const status = p.status as string;
      return status === ProjectStatus.ON_HOLD || status === 'Pausiert';
    });
  }, [assignedProjects]);

  return {
    assignedProjects,
    activeProjects,
    completedProjects,
    onHoldProjects,
    loading,
    error
  };
};

export default useMonteurProjects;
