/**
 * useMonteurBOM Hook
 * Read-only Hook für Monteur-Stückliste mit Durchstreichen-Funktion
 *
 * Nutzt den BookingAggregationService für korrekte OUT-IN Berechnung.
 */

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useProjects } from '@context/ProjectContext';
import { useBookings } from '@context/BookingContext';
import { useMaterials } from '@context/MaterialContext';
import { useAuth } from '@context/AuthContext';
import { aggregateProjectBookings, splitAggregatedByCategory, type AggregatedMaterial } from '@services/BookingAggregationService';
import { subscribeToCompletedItems, toggleCompleted } from '@services/BOMCompletedService';
import type { Project } from '@app-types';

export interface UseMonteurBOMReturn {
  project: Project | null;
  bomItems: AggregatedMaterial[];
  configuredItems: AggregatedMaterial[];
  autoItems: AggregatedMaterial[];
  manualItems: AggregatedMaterial[];
  totalCount: number;
  loading: boolean;
  completedItems: Set<string>;
  toggleItemCompleted: (materialId: string) => Promise<void>;
}

/**
 * Hook für read-only Stücklisten-Anzeige im Monteur-Bereich
 *
 * Lädt die Stückliste für das aktuelle Projekt basierend auf der URL-ID.
 * Nutzt aggregateProjectBookings für korrekte OUT-IN Berechnung.
 * Unterstützt Durchstreichen-Funktion (persistent in Firebase).
 *
 * @returns Projekt, BOM-Items (gesamt und kategorisiert), Loading-Status, completedItems
 */
export const useMonteurBOM = (): UseMonteurBOMReturn => {
  const { id } = useParams<{ id: string }>();
  const { getProjectById, loading: projectLoading } = useProjects();
  const { bookings, loading: bookingsLoading } = useBookings();
  const { materials, loading: materialsLoading } = useMaterials();
  const { user } = useAuth();

  // State für durchgestrichene Items
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  // Projekt laden
  const project = useMemo(() => {
    return id ? getProjectById(id) ?? null : null;
  }, [id, getProjectById]);

  // Loading-Status kombinieren
  const loading = projectLoading || bookingsLoading || materialsLoading;

  // Firebase Subscription für completed items
  useEffect(() => {
    if (!id) return;

    const unsubscribe = subscribeToCompletedItems(id, (items) => {
      const materialIds = new Set(items.map(item => item.materialId));
      setCompletedItems(materialIds);
    });

    return () => unsubscribe();
  }, [id]);

  // Toggle completed status
  const toggleItemCompleted = useCallback(async (materialId: string): Promise<void> => {
    if (!id || !user?.uid) return;

    const isCurrentlyCompleted = completedItems.has(materialId);
    await toggleCompleted(id, materialId, user.uid, isCurrentlyCompleted);
  }, [id, user?.uid, completedItems]);

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
    loading,
    completedItems,
    toggleItemCompleted
  };
};

export default useMonteurBOM;
