import { useState, useMemo, useCallback } from 'react';
import { useProjects } from '@context/ProjectContext';
import { useCustomers } from '@context/CustomerContext';
import { useNotification } from '@context/NotificationContext';
import { useConfirm } from '@context/ConfirmContext';
import { DEFAULT_PROJECT_FILTERS, findProjectCustomerById, getProjectCustomerDisplayName } from '@utils/projectHelpers';
import { NotificationType } from '@app-types';
import type { Project } from '@app-types';
import type {
  ProjectColumnFilters,
  ProjectSortConfig,
  ProjectStats,
  UseProjectManagementReturn
} from '@app-types/components/project.types';

/**
 * Hook für Projekt-Listen-Zustand und Operationen
 */
export const useProjectManagement = (): UseProjectManagementReturn => {
  const { projects, addProject, updateProject, deleteProject } = useProjects();
  const { customers } = useCustomers();
  const { showNotification } = useNotification();
  const { confirmDelete } = useConfirm();

  // Such- & Filter-Zustand
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [columnFilters, setColumnFilters] = useState<ProjectColumnFilters>(DEFAULT_PROJECT_FILTERS);
  const [activeColumnFilter, setActiveColumnFilter] = useState<string | null>(null);

  // Sortier-Zustand
  const [sortConfig, setSortConfig] = useState<ProjectSortConfig>({ key: null, direction: 'asc' });

  // Modal-Zustand
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // UI-Zustand
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);

  // Eindeutige Werte für Filter
  const uniqueStatuses = useMemo(() => {
    return ['alle', ...new Set(projects.map(p => p.status).filter(Boolean))];
  }, [projects]);

  const uniqueCustomers = useMemo(() => {
    return ['alle', ...new Set(projects.map(p => {
      const customer = findProjectCustomerById(customers, p.customerID);
      return getProjectCustomerDisplayName(customer);
    }).filter(Boolean))];
  }, [projects, customers]);

  // Gefilterte Projekte
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = searchTerm === '' ||
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.projectID && project.projectID.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = columnFilters.status === 'alle' || project.status === columnFilters.status;

      const customer = findProjectCustomerById(customers, project.customerID);
      const customerName = getProjectCustomerDisplayName(customer);
      const matchesCustomer = columnFilters.customer === 'alle' || customerName === columnFilters.customer;

      return matchesSearch && matchesStatus && matchesCustomer;
    });
  }, [projects, customers, searchTerm, columnFilters]);

  // Sortierte Projekte
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      if (!sortConfig.key) return 0;

      let aValue: any = (a as any)[sortConfig.key];
      let bValue: any = (b as any)[sortConfig.key];

      if (sortConfig.key === 'customer') {
        const customerA = findProjectCustomerById(customers, a.customerID);
        const customerB = findProjectCustomerById(customers, b.customerID);
        aValue = getProjectCustomerDisplayName(customerA);
        bValue = getProjectCustomerDisplayName(customerB);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredProjects, sortConfig, customers]);

  // Statistiken - status kann sowohl deutsche als auch englische Werte haben
  const stats: ProjectStats = useMemo(() => ({
    total: projects.length,
    active: projects.filter(p => String(p.status) === 'Aktiv' || p.status === 'active').length,
    planned: projects.filter(p => String(p.status) === 'Geplant' || p.status === 'planning').length,
    completed: projects.filter(p => String(p.status) === 'Abgeschlossen' || p.status === 'completed').length
  }), [projects]);

  // Handler
  const handleSort = useCallback((key: string): void => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handleColumnFilterChange = useCallback((column: string, value: string): void => {
    setColumnFilters(prev => ({ ...prev, [column]: value }));
    setActiveColumnFilter(null);
  }, []);

  const handleAddProject = useCallback((): void => {
    setEditingProject(null);
    setIsAddModalOpen(true);
  }, []);

  const handleEditProject = useCallback((project: Project): void => {
    setEditingProject(project);
    setIsAddModalOpen(true);
    setDropdownOpen(null);
    setIsDetailModalOpen(false);
  }, []);

  const handleProjectClick = useCallback((project: Project): void => {
    setSelectedProject(project);
    setIsDetailModalOpen(true);
  }, []);

  const handleSaveProject = useCallback(async (projectData: Partial<Project>): Promise<void> => {
    try {
      if (editingProject) {
        await updateProject(editingProject.id, projectData);
        showNotification('Projekt erfolgreich aktualisiert', NotificationType.SUCCESS);
      } else {
        await addProject(projectData as any);
        showNotification('Projekt erfolgreich erstellt', NotificationType.SUCCESS);
      }
      setIsAddModalOpen(false);
      setEditingProject(null);
    } catch (error) {
      showNotification('Fehler beim Speichern des Projekts', NotificationType.ERROR);
    }
  }, [editingProject, updateProject, addProject, showNotification]);

  const handleDeleteProject = useCallback(async (projectId: string): Promise<void> => {
    const project = projects.find(p => p.id === projectId);
    const projectName = project?.name || 'dieses Projekt';

    const confirmed = await confirmDelete(projectName, 'Projekt');
    if (confirmed) {
      try {
        await deleteProject(projectId);
        showNotification('Projekt erfolgreich gelöscht', NotificationType.SUCCESS);
      } catch (error) {
        showNotification('Fehler beim Löschen des Projekts', NotificationType.ERROR);
      }
    }
    setDropdownOpen(null);
  }, [projects, confirmDelete, deleteProject, showNotification]);

  const handleCloseModal = useCallback((): void => {
    setIsAddModalOpen(false);
    setEditingProject(null);
  }, []);

  const handleCloseDetailModal = useCallback((): void => {
    setIsDetailModalOpen(false);
    setSelectedProject(null);
  }, []);

  // Inline Status-Bearbeitung
  const handleStatusEdit = useCallback((projectId: string): void => {
    setEditingStatus(projectId);
  }, []);

  const handleStatusSave = useCallback(async (projectId: string, newStatus: string): Promise<void> => {
    try {
      // Cast to any to bypass strict ProjectStatus enum check
      await updateProject(projectId, { status: newStatus as any });
      showNotification('Status erfolgreich aktualisiert', NotificationType.SUCCESS);
      setEditingStatus(null);
    } catch (error) {
      console.error('Fehler beim Speichern des Status:', error);
      showNotification('Fehler beim Aktualisieren des Status', NotificationType.ERROR);
    }
  }, [updateProject, showNotification]);

  const handleStatusCancel = useCallback((): void => {
    setEditingStatus(null);
  }, []);

  return {
    // Daten
    projects,
    customers,
    sortedProjects,
    stats,
    uniqueStatuses,
    uniqueCustomers,

    // Such- & Filter
    searchTerm,
    setSearchTerm,
    columnFilters,
    activeColumnFilter,
    setActiveColumnFilter,
    handleColumnFilterChange,

    // Sortierung
    sortConfig,
    handleSort,

    // Modal-Zustand
    isAddModalOpen,
    isDetailModalOpen,
    editingProject,
    selectedProject,

    // UI-Zustand
    dropdownOpen,
    setDropdownOpen,
    editingStatus,

    // Handler
    handleAddProject,
    handleEditProject,
    handleProjectClick,
    handleSaveProject,
    handleDeleteProject,
    handleCloseModal,
    handleCloseDetailModal,
    handleStatusEdit,
    handleStatusSave,
    handleStatusCancel
  };
};

export default useProjectManagement;
