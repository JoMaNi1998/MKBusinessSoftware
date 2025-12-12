import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreVertical,
  MapPin,
  Calendar,
  Building,
  Settings,
  Filter,
  X
} from 'lucide-react';
import { useCustomers } from '../context/CustomerContext';
import { useProjects } from '../context/ProjectContext';
import { useNotification } from '../context/NotificationContext';
import { FirebaseService } from '../services/firebaseService';
import CustomerDetailModal, { AddCustomerModal } from './CustomerDetailModal';
import ProjectDetailModal, { AddProjectModal } from './ProjectDetailModal';

const CustomerManagement = () => {
  const { customers, deleteCustomer } = useCustomers();
  const { projects, updateProject, deleteProject } = useProjects();
  const { showNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isProjectDetailModalOpen, setIsProjectDetailModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isProjectEditModalOpen, setIsProjectEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  
  // Spalten- und Filter-States
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
  
  // Verfügbare Spalten definieren
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

  // Hilfsfunktion für Datumsformatierung
  const formatDate = (dateValue) => {
    if (!dateValue) return '-';
    
    try {
      let date;
      
      // Firebase Timestamp
      if (dateValue && typeof dateValue.toDate === 'function') {
        date = dateValue.toDate();
      }
      // ISO String
      else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      }
      // Date object
      else if (dateValue instanceof Date) {
        date = dateValue;
      }
      // Fallback
      else {
        return '-';
      }
      
      // Prüfen ob gültiges Datum
      if (isNaN(date.getTime())) {
        return '-';
      }
      
      return date.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Fehler beim Formatieren des Datums:', error);
      return '-';
    }
  };

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

  // Spalten-Handler
  const toggleColumn = async (columnKey) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey]
    };
    setVisibleColumns(newVisibleColumns);
    await saveColumnPreferences(newVisibleColumns);
  };

  // Load column preferences from Firebase
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

  // Save column preferences to Firebase
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

  // Filter-Handler
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

  // Load preferences on component mount
  React.useEffect(() => {
    loadColumnPreferences();
  }, []);

  // Click outside handler for column settings
  React.useEffect(() => {
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



  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Kundenverwaltung</h1>
          <p className="mt-1 text-sm text-gray-600">
            Verwalten Sie Ihre Kunden und deren Projekte
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Kunde hinzufügen</span>
        </button>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamt Kunden</p>
              <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
            </div>
            <Users className="h-8 w-8 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Suchleiste und Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col space-y-4">
          {/* Suchleiste */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Kunde suchen (Name, ID, Stadt)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filter-Reset Button */}
          {hasActiveFilters() && (
            <div className="flex items-center space-x-2">
              <button
                onClick={resetFilters}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 flex items-center space-x-1"
              >
                <X className="h-3 w-3" />
                <span>Filter zurücksetzen</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Kundenliste */}
      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col">
        {/* Fixierter Header mit Spaltenauswahl */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-medium text-gray-900">Kundenliste</h3>
          <div className="relative column-settings-container">
            <button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Spalten auswählen"
            >
              <Settings className="h-5 w-5" />
            </button>
            
            {/* Spaltenauswahl-Dropdown */}
            {showColumnSelector && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">Spalten auswählen</h4>
                    {loadingPreferences && (
                      <div className="text-xs text-gray-500">Lädt...</div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {availableColumns.map(column => (
                      <label key={column.key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={visibleColumns[column.key]}
                          onChange={() => !column.required && toggleColumn(column.key)}
                          disabled={column.required || loadingPreferences}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
                        />
                        <span className={`text-sm ${
                          column.required ? 'text-gray-400' : 'text-gray-700'
                        }`}>
                          {column.label}
                          {column.required && ' (erforderlich)'}
                        </span>
                      </label>
                    ))}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      💾 Einstellungen werden automatisch in Firebase gespeichert
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Scrollbare Tabelle */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {visibleColumns.kunde && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kunde
                  </th>
                )}
                {visibleColumns.adresse && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>Adresse</span>
                      <div className="relative">
                        <button
                          onClick={() => setActiveColumnFilter(activeColumnFilter === 'city' ? null : 'city')}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <Filter className="h-3 w-3" />
                        </button>
                        {activeColumnFilter === 'city' && (
                          <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-30 border border-gray-200">
                            <div className="p-2">
                              <select
                                value={columnFilters.city}
                                onChange={(e) => handleColumnFilterChange('city', e.target.value)}
                                className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                              >
                                {uniqueCities.map(city => (
                                  <option key={city} value={city}>
                                    {city === 'alle' ? 'Alle Städte' : city}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                )}
                {visibleColumns.telefon && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefon
                  </th>
                )}
                {visibleColumns.email && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                )}
                {visibleColumns.aktionen && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr 
                  key={customer.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleCustomerClick(customer)}
                >
                  {visibleColumns.kunde && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {customer.firmennameKundenname}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {customer.customerID}
                        </div>
                      </div>
                    </td>
                  )}
                  {visibleColumns.adresse && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                        {customer.street} {customer.houseNumber}, {customer.postalCode} {customer.city}
                      </div>
                    </td>
                  )}
                  {visibleColumns.telefon && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.phone || '-'}
                    </td>
                  )}
                  {visibleColumns.email && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.email || '-'}
                    </td>
                  )}
                  {visibleColumns.aktionen && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDropdownOpen(dropdownOpen === customer.id ? null : customer.id);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {dropdownOpen === customer.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                            <div className="py-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditCustomer(customer);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Bearbeiten
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCustomer(customer.id);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Löschen
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              </tbody>
            </table>
            
            {filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Kunden gefunden</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm 
                    ? 'Versuchen Sie andere Suchbegriffe.'
                    : 'Beginnen Sie mit dem Hinzufügen Ihres ersten Kunden.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside handler */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setDropdownOpen(null)}
        />
      )}

      {/* Add/Edit Customer Modal */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        customer={editingCustomer}
      />

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        customer={selectedCustomer}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
        onProjectClick={(project) => {
          setSelectedProject(project);
          setIsProjectDetailModalOpen(true);
          setIsDetailModalOpen(false);
        }}
      />

      {/* Project Detail Modal */}
      <ProjectDetailModal
        isOpen={isProjectDetailModalOpen}
        onClose={() => {
          setIsProjectDetailModalOpen(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        onEdit={(project) => {
          setEditingProject(project);
          setIsProjectEditModalOpen(true);
          setIsProjectDetailModalOpen(false);
        }}
        onDelete={async (projectId) => {
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
        }}
      />

      {/* Project Edit Modal */}
      <AddProjectModal
        isOpen={isProjectEditModalOpen}
        onClose={() => {
          setIsProjectEditModalOpen(false);
          setEditingProject(null);
        }}
        project={editingProject}
        onSave={async (projectData) => {
          try {
            await updateProject(editingProject.id, projectData);
            showNotification('Projekt erfolgreich aktualisiert', 'success');
            setIsProjectEditModalOpen(false);
            setEditingProject(null);
            setIsProjectDetailModalOpen(true);
            // Update selected project if it's the same one being edited
            if (selectedProject && selectedProject.id === editingProject.id) {
              setSelectedProject({ ...selectedProject, ...projectData });
            }
          } catch (error) {
            showNotification('Fehler beim Aktualisieren des Projekts', 'error');
          }
        }}
        customers={customers}
        projects={projects}
      />
    </div>
  );
};

export default CustomerManagement;
