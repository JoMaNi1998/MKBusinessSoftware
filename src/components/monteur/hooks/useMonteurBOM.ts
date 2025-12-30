/**
 * useMonteurBOM Hook
 * Read-only Hook für Monteur-Stückliste
 */

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProjects } from '@context/ProjectContext';
import { useBookings } from '@context/BookingContext';
import { useMaterials } from '@context/MaterialContext';
import { computeBOMFromBookings } from '@services/BOMService';
import type { BOMItem } from '@app-types/components/bom.types';
import type { Project } from '@app-types';

export interface UseMonteurBOMReturn {
  project: Project | null;
  bomItems: BOMItem[];
  configuredItems: BOMItem[];
  autoItems: BOMItem[];
  manualItems: BOMItem[];
  totalCount: number;
  loading: boolean;
}

/**
 * Hook für read-only Stücklisten-Anzeige im Monteur-Bereich
 *
 * Lädt die Stückliste für das aktuelle Projekt basierend auf der URL-ID.
 *
 * @returns Projekt, BOM-Items (gesamt und kategorisiert), Loading-Status
 */
export const useMonteurBOM = (): UseMonteurBOMReturn => {
  const { id } = useParams<{ id: string }>();
  const { getProjectById, loading: projectLoading } = useProjects();
  const { bookings, loading: bookingsLoading } = useBookings();
  const { materials, loading: materialsLoading } = useMaterials();

  const [bomItems, setBomItems] = useState<BOMItem[]>([]);

  // Projekt laden
  const project = useMemo(() => {
    return id ? getProjectById(id) ?? null : null;
  }, [id, getProjectById]);

  // Loading-Status kombinieren
  const loading = projectLoading || bookingsLoading || materialsLoading;

  // BOM berechnen wenn alle Daten geladen sind
  useEffect(() => {
    if (!project || loading) return;

    const items = computeBOMFromBookings(project, bookings, materials);
    setBomItems(items);
  }, [project, bookings, materials, loading]);

  // Items in Kategorien aufteilen
  const configuredItems = useMemo(() => {
    return bomItems.filter(item => item.isConfigured);
  }, [bomItems]);

  const autoItems = useMemo(() => {
    return bomItems.filter(item => !item.isConfigured && !item.isManual);
  }, [bomItems]);

  const manualItems = useMemo(() => {
    return bomItems.filter(item => item.isManual);
  }, [bomItems]);

  return {
    project,
    bomItems,
    configuredItems,
    autoItems,
    manualItems,
    totalCount: bomItems.length,
    loading
  };
};

export default useMonteurBOM;
