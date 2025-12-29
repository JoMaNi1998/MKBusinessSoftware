/**
 * useBillOfMaterials Hook
 * Zentraler Hook für Stücklisten-Management
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useCustomers } from '@context/CustomerContext';
import { useProjects } from '@context/ProjectContext';
import { useBookings } from '@context/BookingContext';
import { useMaterials } from '@context/MaterialContext';
import { computeBOMFromBookings } from '../services/BOMService';
import { normalize, toNumber } from '../utils';
import type { UseBillOfMaterialsReturn, BOMItem } from '@app-types/components/bom.types';
import type { Customer, Project } from '@app-types';
import { getCustomerName } from '../utils';

/**
 * Hook für Stücklisten-Management
 *
 * Stellt alle notwendigen Daten und Aktionen für die Stücklisten-Komponente bereit.
 *
 * @returns Hook-Return mit State, abgeleiteten Daten und Aktionen
 *
 * @example
 * const {
 *   selectedProject,
 *   bomItems,
 *   handleProjectSelect,
 *   handleRefreshFromBookings
 * } = useBillOfMaterials();
 */
export const useBillOfMaterials = (): UseBillOfMaterialsReturn => {
  const { customers } = useCustomers();
  const { projects } = useProjects();
  const { bookings } = useBookings();
  const { materials } = useMaterials();

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectSearch, setProjectSearch] = useState<string>('');
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [showProjectSelect, setShowProjectSelect] = useState<boolean>(true);
  const [rebuildVersion, setRebuildVersion] = useState<number>(0);

  // Memoisierte Hilfen
  const customersById = useMemo<Map<string, Customer>>(() => {
    const map = new Map<string, Customer>();
    customers.forEach((c) => map.set(c.id, c));
    return map;
  }, [customers]);

  const filteredProjects = useMemo<Project[]>(() => {
    const query = normalize(projectSearch);
    if (!query) return projects;

    return projects.filter((p) => {
      if (!p) return false;
      const customer = customersById.get(p.customerID);
      return (
        normalize(p.name).includes(query) ||
        normalize(p.status).includes(query) ||
        normalize(p.customerName).includes(query) ||
        normalize(getCustomerName(customer)).includes(query)
      );
    });
  }, [projectSearch, projects, customersById]);

  // Initial/erzwungenes Rebuild der BOM
  const initialBuild = useRef<boolean>(true);

  useEffect(() => {
    if (!selectedProject) return;
    if (!initialBuild.current && rebuildVersion === 0) return;

    const next = computeBOMFromBookings(selectedProject, bookings, materials);
    setBomItems(next);
    initialBuild.current = false;
  }, [selectedProject, rebuildVersion, bookings, materials]);

  // Aktionen
  const handleProjectSelect = (project: Project): void => {
    setSelectedProject(project);
    setShowProjectSelect(false);
    setRebuildVersion(0);
    initialBuild.current = true;
  };

  const handleRefreshFromBookings = (): void => {
    setRebuildVersion((v) => v + 1);
    const next = computeBOMFromBookings(selectedProject, bookings, materials);
    setBomItems(next);
  };

  const handleRemoveItem = (itemId: string): void => {
    setBomItems((prev) => prev.filter((x) => x.id !== itemId));
  };

  const handleQuantityChange = (itemId: string, newQuantity: number | string): void => {
    const quantity = Math.max(0, toNumber(newQuantity, 0));

    if (quantity === 0) {
      handleRemoveItem(itemId);
      return;
    }

    setBomItems((prev) =>
      prev.map((x) =>
        x.id === itemId
          ? { ...x, quantity, totalUnits: (x.itemsPerUnit || 1) * quantity }
          : x
      )
    );
  };

  const handlePrint = (): void => {
    window.print();
  };

  const handleNewBOM = (): void => {
    setSelectedProject(null);
    setBomItems([]);
    setShowProjectSelect(true);
    setProjectSearch('');
    setRebuildVersion(0);
    initialBuild.current = true;
  };

  // Ableitungen
  const customer = selectedProject
    ? customersById.get(selectedProject.customerID) || null
    : null;

  return {
    // State
    selectedProject,
    projectSearch,
    setProjectSearch,
    bomItems,
    showProjectSelect,
    // Abgeleitete Daten
    projects,
    customersById,
    filteredProjects,
    customer,
    // Aktionen
    handleProjectSelect,
    handleRefreshFromBookings,
    handleRemoveItem,
    handleQuantityChange,
    handlePrint,
    handleNewBOM
  };
};

export default useBillOfMaterials;
