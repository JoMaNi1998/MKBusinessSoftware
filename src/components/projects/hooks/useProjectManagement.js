import { useState, useMemo, useCallback } from 'react';
import { useProjects } from '../../../context/ProjectContext';
import { useCustomers } from '../../../context/CustomerContext';
import { useNotification } from '../../../context/NotificationContext';
import { DEFAULT_COLUMN_FILTERS } from '../constants';
import { getCustomerDisplayName, findCustomerById } from '../utils';

/**
 * Hook for managing project list state and operations
 */
export const useProjectManagement = () => {
  const { projects, addProject, updateProject, deleteProject } = useProjects();
  const { customers } = useCustomers();
  const { showNotification } = useNotification();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState(DEFAULT_COLUMN_FILTERS);
  const [activeColumnFilter, setActiveColumnFilter] = useState(null);

  // Sort State
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // UI State
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [editingStatus, setEditingStatus] = useState(null);

  // Unique values for filters
  const uniqueStatuses = useMemo(() => {
    return ['alle', ...new Set(projects.map(p => p.status).filter(Boolean))];
  }, [projects]);

  const uniqueCustomers = useMemo(() => {
    return ['alle', ...new Set(projects.map(p => {
      const customer = findCustomerById(customers, p.customerID);
      return getCustomerDisplayName(customer);
    }).filter(Boolean))];
  }, [projects, customers]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = searchTerm === '' ||
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.projectID && project.projectID.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = columnFilters.status === 'alle' || project.status === columnFilters.status;

      const customer = findCustomerById(customers, project.customerID);
      const customerName = getCustomerDisplayName(customer);
      const matchesCustomer = columnFilters.customer === 'alle' || customerName === columnFilters.customer;

      return matchesSearch && matchesStatus && matchesCustomer;
    });
  }, [projects, customers, searchTerm, columnFilters]);

  // Sorted projects
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      if (!sortConfig.key) return 0;

      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'customer') {
        const customerA = findCustomerById(customers, a.customerID);
        const customerB = findCustomerById(customers, b.customerID);
        aValue = getCustomerDisplayName(customerA);
        bValue = getCustomerDisplayName(customerB);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredProjects, sortConfig, customers]);

  // Statistics
  const stats = useMemo(() => ({
    total: projects.length,
    active: projects.filter(p => p.status === 'Aktiv').length,
    planned: projects.filter(p => p.status === 'Geplant').length,
    completed: projects.filter(p => p.status === 'Abgeschlossen').length
  }), [projects]);

  // Handlers
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handleColumnFilterChange = useCallback((column, value) => {
    setColumnFilters(prev => ({ ...prev, [column]: value }));
    setActiveColumnFilter(null);
  }, []);

  const handleAddProject = useCallback(() => {
    setEditingProject(null);
    setIsAddModalOpen(true);
  }, []);

  const handleEditProject = useCallback((project) => {
    setEditingProject(project);
    setIsAddModalOpen(true);
    setDropdownOpen(null);
    setIsDetailModalOpen(false);
  }, []);

  const handleProjectClick = useCallback((project) => {
    setSelectedProject(project);
    setIsDetailModalOpen(true);
  }, []);

  const handleSaveProject = useCallback(async (projectData) => {
    try {
      if (editingProject) {
        await updateProject(editingProject.id, projectData);
        showNotification('Projekt erfolgreich aktualisiert', 'success');
      } else {
        await addProject(projectData);
        showNotification('Projekt erfolgreich erstellt', 'success');
      }
      setIsAddModalOpen(false);
      setEditingProject(null);
    } catch (error) {
      showNotification('Fehler beim Speichern des Projekts', 'error');
    }
  }, [editingProject, updateProject, addProject, showNotification]);

  const handleDeleteProject = useCallback(async (projectId) => {
    if (window.confirm('Sind Sie sicher, dass Sie dieses Projekt löschen möchten?')) {
      try {
        await deleteProject(projectId);
        showNotification('Projekt erfolgreich gelöscht', 'success');
      } catch (error) {
        showNotification('Fehler beim Löschen des Projekts', 'error');
      }
    }
    setDropdownOpen(null);
  }, [deleteProject, showNotification]);

  const handleCloseModal = useCallback(() => {
    setIsAddModalOpen(false);
    setEditingProject(null);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedProject(null);
  }, []);

  // Inline Status Editing
  const handleStatusEdit = useCallback((projectId) => {
    setEditingStatus(projectId);
  }, []);

  const handleStatusSave = useCallback(async (projectId, newStatus) => {
    try {
      await updateProject(projectId, { status: newStatus });
      showNotification('Status erfolgreich aktualisiert', 'success');
      setEditingStatus(null);
    } catch (error) {
      console.error('Fehler beim Speichern des Status:', error);
      showNotification('Fehler beim Aktualisieren des Status', 'error');
    }
  }, [updateProject, showNotification]);

  const handleStatusCancel = useCallback(() => {
    setEditingStatus(null);
  }, []);

  return {
    // Data
    projects,
    customers,
    sortedProjects,
    stats,
    uniqueStatuses,
    uniqueCustomers,

    // Search & Filter
    searchTerm,
    setSearchTerm,
    columnFilters,
    activeColumnFilter,
    setActiveColumnFilter,
    handleColumnFilterChange,

    // Sort
    sortConfig,
    handleSort,

    // Modal State
    isAddModalOpen,
    isDetailModalOpen,
    editingProject,
    selectedProject,

    // UI State
    dropdownOpen,
    setDropdownOpen,
    editingStatus,

    // Handlers
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
