/**
 * useAutoSelectProject Hook
 *
 * Generischer Hook für automatische Projektauswahl wenn nur ein Projekt verfügbar ist.
 * Wird verwendet bei Buchungen, PV-Konfigurator, Rechnungen, VDE-Protokollen, etc.
 */

import { useEffect } from 'react';
import type { Project } from '@app-types';

interface UseAutoSelectProjectOptions {
  /** Liste der verfügbaren Projekte für den ausgewählten Kunden */
  customerProjects: Project[];
  /** Aktuell ausgewähltes Projekt (ID) */
  selectedProject: string;
  /** Setter für das ausgewählte Projekt */
  setSelectedProject: (projectId: string) => void;
  /** Optionaler Callback nach Auto-Select (z.B. für Error-Clearing) */
  onAutoSelect?: (projectId: string) => void;
  /** Ob Auto-Select aktiviert ist (default: true) */
  enabled?: boolean;
}

interface UseAutoSelectProjectReturn {
  /** Ob das Projekt automatisch ausgewählt wurde */
  wasAutoSelected: boolean;
  /** Anzahl der verfügbaren Projekte */
  projectCount: number;
  /** Ob nur ein Projekt verfügbar ist */
  hasSingleProject: boolean;
}

/**
 * Hook für automatische Projektauswahl
 *
 * Wählt automatisch das Projekt aus, wenn:
 * - Genau ein Projekt für den Kunden verfügbar ist
 * - Noch kein Projekt ausgewählt wurde
 *
 * @example
 * ```tsx
 * const { hasSingleProject } = useAutoSelectProject({
 *   customerProjects,
 *   selectedProject,
 *   setSelectedProject,
 *   onAutoSelect: (id) => clearFieldError('Projekt')
 * });
 * ```
 */
export const useAutoSelectProject = ({
  customerProjects,
  selectedProject,
  setSelectedProject,
  onAutoSelect,
  enabled = true
}: UseAutoSelectProjectOptions): UseAutoSelectProjectReturn => {
  const projectCount = customerProjects.length;
  const hasSingleProject = projectCount === 1;

  // Auto-Select wenn nur ein Projekt verfügbar
  useEffect(() => {
    if (!enabled) return;

    // Nur auto-select wenn:
    // 1. Genau ein Projekt existiert
    // 2. Noch kein Projekt ausgewählt ist
    if (hasSingleProject && !selectedProject) {
      const singleProject = customerProjects[0];
      setSelectedProject(singleProject.id);
      onAutoSelect?.(singleProject.id);
    }
  }, [customerProjects, selectedProject, setSelectedProject, onAutoSelect, enabled, hasSingleProject]);

  return {
    wasAutoSelected: hasSingleProject && selectedProject === customerProjects[0]?.id,
    projectCount,
    hasSingleProject
  };
};

export default useAutoSelectProject;
