import { useState, useEffect } from 'react';
import { useCustomers } from '../../../context/CustomerContext';
import { useProjects } from '../../../context/ProjectContext';
import { useNotification } from '../../../context/NotificationContext';
import { FirebaseService } from '../../../services/firebaseService';

const useCustomerManagement = () => {
  const { customers, deleteCustomer } = useCustomers();
  const { projects, updateProject, deleteProject } = useProjects();
  const { showNotification } = useNotification();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isProjectDetailModalOpen, setIsProjectDetailModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isProjectEditModalOpen, setIsProjectEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // Column & Filter States
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [activeColumnFilter, setActiveColumnFilter] = useState(null);
  const [columnFilters, setColumnFilters] = useState({
    city: 'alle',
    dateRange: 'alle'
  });
  const [visibleColumns, setVisibleColumns] = useState({
    kunde: true,
    adresse: true,
    telefon: false,
    email: false,
    aktionen: true
  });

  // Verfügbare Spalten
  const availableColumns = [
    { key: 'kunde', label: 'Kunde', required: true },
    { key: 'adresse', label: 'Adresse' },
    { key: 'telefon', label: 'Telefon' },
    { key: 'email', label: 'Email' },
    { key: 'aktionen', label: 'Aktionen', required: true }
  ];

  // Unique values für Filter
  const uniqueCities = ['alle', ...new Set(customers.map(customer => customer.city).filter(Boolean))];
  const dateRangeOptions = [
    { value: 'alle', label: 'Alle Zeiträume' },
    { value: 'heute', label: 'Heute' },
    { value: '7tage', label: 'Letzte 7 Tage' },
    { value: '30tage', label: 'Letzte 30 Tage' },
    { value: '90tage', label: 'Letzte 90 Tage' },
    { value: 'jahr', label: 'Letztes Jahr' }
  ];

  // Filter-Logik
  const filterByDateRange = (date, range) => {
    if (!date || range === 'alle') return true;

    const now = new Date();
    const customerDate = date.toDate ? date.toDate() : new Date(date);
    const diffTime = Math.abs(now - customerDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (range) {
      case 'heute': return diffDays === 0;
      case '7tage': return diffDays <= 7;
      case '30tage': return diffDays <= 30;
      case '90tage': return diffDays <= 90;
      case 'jahr': return diffDays <= 365;
      default: return true;
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.firmennameKundenname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customerID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCity = columnFilters.city === 'alle' || customer.city === columnFilters.city;
    const matchesDateRange = filterByDateRange(customer.createdAt, columnFilters.dateRange);

    return matchesSearch && matchesCity && matchesDateRange;
  });

  // Customer Handlers
  const handleDeleteCustomer = (customerId) => {
    if (window.confirm('Kunde wirklich löschen?')) {
      deleteCustomer(customerId);
      showNotification('Kunde erfolgreich gelöscht', 'success');
    }
    setDropdownOpen(null);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setIsAddModalOpen(true);
    setDropdownOpen(null);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingCustomer(null);
  };

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedCustomer(null);
  };

  // Column Handlers
  const toggleColumn = async (columnKey) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey]
    };
    setVisibleColumns(newVisibleColumns);
    await saveColumnPreferences(newVisibleColumns);
  };

  const loadColumnPreferences = async () => {
    try {
      setLoadingPreferences(true);
      const preferences = await FirebaseService.getDocuments('user-preferences');
      const columnPrefs = preferences.find(pref => pref.type === 'customerColumns');

      if (columnPrefs && columnPrefs.columns) {
        setVisibleColumns(columnPrefs.columns);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Spalteneinstellungen:', error);
    } finally {
      setLoadingPreferences(false);
    }
  };

  const saveColumnPreferences = async (columns) => {
    try {
      const preferences = await FirebaseService.getDocuments('user-preferences');
      const existingPref = preferences.find(pref => pref.type === 'customerColumns');

      const prefData = {
        type: 'customerColumns',
        columns: columns,
        updatedAt: new Date()
      };

      if (existingPref) {
        await FirebaseService.updateDocument('user-preferences', existingPref.id, prefData);
      } else {
        await FirebaseService.addDocument('user-preferences', {
          ...prefData,
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Spalteneinstellungen:', error);
      showNotification('Fehler beim Speichern der Spalteneinstellungen', 'error');
    }
  };

  const resetColumns = () => {
    setVisibleColumns({
      kunde: true,
      adresse: true,
      telefon: false,
      email: false,
      aktionen: true
    });
  };

  // Filter Handlers
  const handleColumnFilterChange = (column, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const resetFilters = () => {
    setColumnFilters({
      city: 'alle',
      dateRange: 'alle'
    });
    setActiveColumnFilter(null);
  };

  const hasActiveFilters = () => {
    return columnFilters.city !== 'alle' || columnFilters.dateRange !== 'alle';
  };

  // Load preferences on mount
  useEffect(() => {
    loadColumnPreferences();
  }, []);

  // Click outside handler for column settings
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColumnSelector && !event.target.closest('.column-settings-container')) {
        setShowColumnSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnSelector]);

  // Project Handlers
  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setIsProjectDetailModalOpen(true);
    setIsDetailModalOpen(false);
  };

  const handleProjectEdit = (project) => {
    setEditingProject(project);
    setIsProjectEditModalOpen(true);
    setIsProjectDetailModalOpen(false);
  };

  const handleProjectDelete = async (projectId) => {
    if (window.confirm('Sind Sie sicher, dass Sie dieses Projekt löschen möchten?')) {
      try {
        await deleteProject(projectId);
        showNotification('Projekt erfolgreich gelöscht', 'success');
        setIsProjectDetailModalOpen(false);
        setSelectedProject(null);
      } catch (error) {
        showNotification('Fehler beim Löschen des Projekts', 'error');
      }
    }
  };

  const handleProjectSave = async (projectData) => {
    try {
      await updateProject(editingProject.id, projectData);
      showNotification('Projekt erfolgreich aktualisiert', 'success');
      setIsProjectEditModalOpen(false);
      setEditingProject(null);
      setIsProjectDetailModalOpen(true);
      if (selectedProject && selectedProject.id === editingProject.id) {
        setSelectedProject({ ...selectedProject, ...projectData });
      }
    } catch (error) {
      showNotification('Fehler beim Aktualisieren des Projekts', 'error');
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
    dateRangeOptions,

    // Columns
    visibleColumns,
    availableColumns,
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
