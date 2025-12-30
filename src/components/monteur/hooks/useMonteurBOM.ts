/**
 * useMonteurBOM Hook
 * Read-only Hook für Monteur-Stückliste
 *
 * Nutzt den BookingAggregationService für korrekte OUT-IN Berechnung.
 */

import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useProjects } from '@context/ProjectContext';
import { useBookings } from '@context/BookingContext';
import { useMaterials } from '@context/MaterialContext';
import { aggregateProjectBookings, splitAggregatedByCategory, type AggregatedMaterial } from '@services/BookingAggregationService';
import type { Project } from '@app-types';

export interface UseMonteurBOMReturn {
  project: Project | null;
  bomItems: AggregatedMaterial[];
  configuredItems: AggregatedMaterial[];
  autoItems: AggregatedMaterial[];
  manualItems: AggregatedMaterial[];
  totalCount: number;
  loading: boolean;
}

/**
 * Hook für read-only Stücklisten-Anzeige im Monteur-Bereich
 *
 * Lädt die Stückliste für das aktuelle Projekt basierend auf der URL-ID.
 * Nutzt aggregateProjectBookings für korrekte OUT-IN Berechnung.
 *
 * @returns Projekt, BOM-Items (gesamt und kategorisiert), Loading-Status
 */
export const useMonteurBOM = (): UseMonteurBOMReturn => {
  const { id } = useParams<{ id: string }>();
  const { getProjectById, loading: projectLoading } = useProjects();
  const { bookings, loading: bookingsLoading } = useBookings();
  const { materials, loading: materialsLoading } = useMaterials();

  // Projekt laden
  const project = useMemo(() => {
    return id ? getProjectById(id) ?? null : null;
  }, [id, getProjectById]);

  // Loading-Status kombinieren
  const loading = projectLoading || bookingsLoading || materialsLoading;

  // BOM berechnen mit neuem Service (OUT - IN)
  const bomItems = useMemo(() => {
    if (!project || loading) return [];
    return aggregateProjectBookings(project.id, bookings, materials);
  }, [project, bookings, materials, loading]);

  // Items in Kategorien aufteilen
  const { manualItems, configuredItems, autoItems } = useMemo(() => {
    return splitAggregatedByCategory(bomItems);
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
