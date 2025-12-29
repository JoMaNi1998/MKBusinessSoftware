/**
 * useCustomerManagement Hook
 * Zentraler Hook für Kundenverwaltungs-Management
 */

import { useState, useEffect } from 'react';
import { useCustomers } from '@context/CustomerContext';
import { useProjects } from '@context/ProjectContext';
import { useNotification } from '@context/NotificationContext';
import { useConfirm } from '@context/ConfirmContext';
import {
  saveCustomerColumnPreferences,
  loadCustomerColumnPreferences
} from '../services/CustomerService';
import {
  filterByDateRange,
  DEFAULT_CUSTOMER_COLUMNS,
  CUSTOMER_AVAILABLE_COLUMNS,
  DATE_RANGE_OPTIONS
} from '../utils';
import { NotificationType } from '@app-types/enums';
import type { Customer, Project } from '@app-types';
import type {
  UseCustomerManagementReturn,
  VisibleColumns,
  CustomerColumnFilters,
  DateRangeType
} from '@app-types/components/customer.types';

/**
 * Hook für Kundenverwaltung mit Filterung, Spalten-Präferenzen und Modal-Management
 *
 * @returns Hook-Return mit State, abgeleiteten Daten und Aktionen
 *
 * @example
 * const {
 *   filteredCustomers,
 *   handleCustomerClick,
 *   toggleColumn
 * } = useCustomerManagement();
 */
export const useCustomerManagement = (): UseCustomerManagementReturn => {
  const { customers, deleteCustomer } = useCustomers();
  const { projects, updateProject, deleteProject } = useProjects();
  const { showNotification } = useNotification();
  const { confirmDelete } = useConfirm();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isProjectDetailModalOpen, setIsProjectDetailModalOpen] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectEditModalOpen, setIsProjectEditModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Column & Filter States
  const [loadingPreferences, setLoadingPreferences] = useState<boolean>(true);
  const [showColumnSelector, setShowColumnSelector] = useState<boolean>(false);
  const [activeColumnFilter, setActiveColumnFilter] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<CustomerColumnFilters>({
    city: 'alle',
    dateRange: 'alle'
  });
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(DEFAULT_CUSTOMER_COLUMNS);

  // Unique values für Filter
  const uniqueCities: string[] = [
    'alle',
    ...new Set(customers.map(customer => customer.ort).filter((ort): ort is string => Boolean(ort)))
  ];

  // Filter-Logik
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.firmennameKundenname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customerID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.ort?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCity = columnFilters.city === 'alle' || customer.ort === columnFilters.city;
    const matchesDateRange = filterByDateRange(
      customer.createdAt,
      columnFilters.dateRange as DateRangeType
    );

    return matchesSearch && matchesCity && matchesDateRange;
  });

  // Customer Handlers
  const handleDeleteCustomer = async (customerId: string): Promise<void> => {
    const customer = customers.find(c => c.id === customerId);
    const customerName = customer?.firmennameKundenname || 'diesen Kunden';

    const confirmed = await confirmDelete(customerName, 'Kunde');
    if (confirmed) {
      deleteCustomer(customerId);
      showNotification('Kunde erfolgreich gelöscht', NotificationType.SUCCESS);
    }
    setDropdownOpen(null);
  };

  const handleEditCustomer = (customer: Customer): void => {
    setEditingCustomer(customer);
    setIsAddModalOpen(true);
    setDropdownOpen(null);
  };

  const handleCloseModal = (): void => {
    setIsAddModalOpen(false);
    setEditingCustomer(null);
  };

  const handleCustomerClick = (customer: Customer): void => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = (): void => {
    setIsDetailModalOpen(false);
    setSelectedCustomer(null);
  };

  // Column Handlers
  const toggleColumn = async (columnKey: string): Promise<void> => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey]
    };
    setVisibleColumns(newVisibleColumns);

    try {
      await saveCustomerColumnPreferences(newVisibleColumns);
    } catch (error) {
      showNotification('Fehler beim Speichern der Spalteneinstellungen', NotificationType.ERROR);
    }
  };

  const resetColumns = (): void => {
    setVisibleColumns(DEFAULT_CUSTOMER_COLUMNS);
  };

  // Filter Handlers
  const handleColumnFilterChange = (column: string, value: string): void => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const resetFilters = (): void => {
    setColumnFilters({
      city: 'alle',
      dateRange: 'alle'
    });
    setActiveColumnFilter(null);
  };

  const hasActiveFilters = (): boolean => {
    return columnFilters.city !== 'alle' || columnFilters.dateRange !== 'alle';
  };

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      setLoadingPreferences(true);
      const prefs = await loadCustomerColumnPreferences();
      if (prefs) {
        setVisibleColumns(prefs);
      }
      setLoadingPreferences(false);
    };
    loadPreferences();
  }, []);

  // Click outside handler for column settings
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (showColumnSelector && !(event.target as HTMLElement).closest('.column-settings-container')) {
        setShowColumnSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnSelector]);

  // Project Handlers
  const handleProjectClick = (project: Project): void => {
    setSelectedProject(project);
    setIsProjectDetailModalOpen(true);
    setIsDetailModalOpen(false);
  };

  const handleProjectEdit = (project: Project): void => {
    setEditingProject(project);
    setIsProjectEditModalOpen(true);
    setIsProjectDetailModalOpen(false);
  };

  const handleProjectDelete = async (projectId: string): Promise<void> => {
    const project = projects.find(p => p.id === projectId);
    const projectName = project?.name || 'dieses Projekt';

    const confirmed = await confirmDelete(projectName, 'Projekt');
    if (confirmed) {
      try {
        await deleteProject(projectId);
        showNotification('Projekt erfolgreich gelöscht', NotificationType.SUCCESS);
        setIsProjectDetailModalOpen(false);
        setSelectedProject(null);
      } catch (error) {
        showNotification('Fehler beim Löschen des Projekts', NotificationType.ERROR);
      }
    }
  };

  const handleProjectSave = async (projectData: Partial<Project>): Promise<void> => {
    try {
      if (!editingProject) return;

      await updateProject(editingProject.id, projectData);
      showNotification('Projekt erfolgreich aktualisiert', NotificationType.SUCCESS);
      setIsProjectEditModalOpen(false);
      setEditingProject(null);
      setIsProjectDetailModalOpen(true);
      if (selectedProject && selectedProject.id === editingProject.id) {
        setSelectedProject({ ...selectedProject, ...projectData } as Project);
      }
    } catch (error) {
      showNotification('Fehler beim Aktualisieren des Projekts', NotificationType.ERROR);
    }
  };

  return {
    // Data
    customers,
    projects,
    filteredCustomers,

    // Search & Filter
    searchTerm,
    setSearchTerm,
    dropdownOpen,
    setDropdownOpen,
    columnFilters,
    activeColumnFilter,
    setActiveColumnFilter,
    uniqueCities,
    dateRangeOptions: DATE_RANGE_OPTIONS,

    // Columns
    visibleColumns,
    availableColumns: CUSTOMER_AVAILABLE_COLUMNS,
    showColumnSelector,
    setShowColumnSelector,
    loadingPreferences,
    toggleColumn,
    resetColumns,

    // Filter Actions
    handleColumnFilterChange,
    resetFilters,
    hasActiveFilters,

    // Customer Modal States
    isAddModalOpen,
    setIsAddModalOpen,
    editingCustomer,
    isDetailModalOpen,
    selectedCustomer,

    // Customer Actions
    handleDeleteCustomer,
    handleEditCustomer,
    handleCloseModal,
    handleCustomerClick,
    handleCloseDetailModal,

    // Project Modal States
    isProjectDetailModalOpen,
    setIsProjectDetailModalOpen,
    selectedProject,
    setSelectedProject,
    isProjectEditModalOpen,
    setIsProjectEditModalOpen,
    editingProject,

    // Project Actions
    handleProjectClick,
    handleProjectEdit,
    handleProjectDelete,
    handleProjectSave
  };
};

export default useCustomerManagement;
