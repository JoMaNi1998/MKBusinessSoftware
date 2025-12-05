import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  MoreVertical,
  Building,
  User,
  Calendar,
  MapPin,
  FileText,
  Package,
  Settings,
  Eye,
  EyeOff,
  Hash
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { useCustomers } from '../context/CustomerContext';
import { useNotification } from '../context/NotificationContext';
import { FirebaseService } from '../services/firebaseService';
import ProjectDetailModal, { AddProjectModal } from './ProjectDetailModal';

const ProjectManagement = () => {
  const { projects, addProject, updateProject, deleteProject } = useProjects();
  const { customers } = useCustomers();
  const { showNotification } = useNotification();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('alle');
  const [selectedCustomer, setSelectedCustomer] = useState('alle');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    customer: true,
    status: true,
    address: false,
    description: false
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [columnFilters, setColumnFilters] = useState({
    status: 'alle',
    customer: 'alle'
  });
  const [activeColumnFilter, setActiveColumnFilter] = useState(null);
  const [loadingPreferences, setLoadingPreferences] = useState(true);

  const availableColumns = [
    { key: 'name', label: 'Projekt', required: true },
    { key: 'customer', label: 'Kunde', required: false },
    { key: 'status', label: 'Status', required: false },
    { key: 'address', label: 'Adresse', required: false },
    { key: 'description', label: 'Beschreibung', required: false }
  ];

  const statusOptions = [
    { value: 'alle', label: 'Alle Status' },
    { value: 'Aktiv', label: 'Aktiv', color: 'bg-green-100 text-green-800' },
    { value: 'Geplant', label: 'Geplant', color: 'bg-blue-100 text-blue-800' },
    { value: 'Pausiert', label: 'Pausiert', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'Abgeschlossen', label: 'Abgeschlossen', color: 'bg-gray-100 text-gray-800' },
    { value: 'Storniert', label: 'Storniert', color: 'bg-red-100 text-red-800' }
  ];

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption?.color || 'bg-gray-100 text-gray-800';
  };

  // Unique values für Filter
  const uniqueStatuses = ['alle', ...new Set(projects.map(p => p.status).filter(Boolean))];
  const uniqueCustomers = ['alle', ...new Set(projects.map(p => {
    const customer = customers.find(c => c.id === p.customerID);
    return customer ? (customer.firmennameKundenname || customer.name) : 'Unbekannt';
  }).filter(Boolean))];

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleColumnFilterChange = (column, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
    setActiveColumnFilter(null);
  };

  const toggleColumnVisibility = async (column) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [column]: !visibleColumns[column]
    };
    setVisibleColumns(newVisibleColumns);
    await saveColumnPreferences(newVisibleColumns);
  };

  // Load column preferences from Firebase
  const loadColumnPreferences = async () => {
    try {
      setLoadingPreferences(true);
      const preferences = await FirebaseService.getDocuments('user-preferences');
      const columnPrefs = preferences.find(pref => pref.type === 'projectColumns');
      
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
      const existingPref = preferences.find(pref => pref.type === 'projectColumns');
      
      const prefData = {
        type: 'projectColumns',
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

  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchTerm === '' || 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.projectID && project.projectID.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = columnFilters.status === 'alle' || project.status === columnFilters.status;
    
    const customer = customers.find(c => c.id === project.customerID);
    const customerName = customer ? (customer.firmennameKundenname || customer.name) : 'Unbekannt';
    const matchesCustomer = columnFilters.customer === 'alle' || customerName === columnFilters.customer;
    
    return matchesSearch && matchesStatus && matchesCustomer;
  });

  // Sortierung anwenden
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    
    if (sortConfig.key === 'customer') {
      const customerA = customers.find(c => c.id === a.customerID);
      const customerB = customers.find(c => c.id === b.customerID);
      aValue = customerA ? (customerA.firmennameKundenname || customerA.name) : 'Unbekannt';
      bValue = customerB ? (customerB.firmennameKundenname || customerB.name) : 'Unbekannt';
    }
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleAddProject = () => {
    setEditingProject(null);
    setIsAddModalOpen(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setIsAddModalOpen(true);
    setDropdownOpen(null);
    setIsDetailModalOpen(false);
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setIsDetailModalOpen(true);
  };

  const handleUpdateProject = async (projectData) => {
    try {
      await updateProject(editingProject.id, projectData);
      showNotification('Projekt erfolgreich aktualisiert', 'success');
      setIsAddModalOpen(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Error updating project:', error);
      showNotification('Fehler beim Aktualisieren des Projekts', 'error');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Sind Sie sicher, dass Sie dieses Projekt löschen möchten?')) {
      try {
        await deleteProject(projectId);
        showNotification('Projekt erfolgreich gelöscht', 'success');
      } catch (error) {
        showNotification('Fehler beim Löschen des Projekts', 'error');
      }
    }
    setDropdownOpen(null);
  };

  const handleSaveProject = async (projectData) => {
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
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingProject(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  // Load preferences on component mount
  React.useEffect(() => {
    loadColumnPreferences();
  }, []);

  // Click outside handler for column settings
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColumnSettings && !event.target.closest('.column-settings-container')) {
        setShowColumnSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnSettings]);

  // Statistiken berechnen
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'Aktiv').length;
  const plannedProjects = projects.filter(p => p.status === 'Geplant').length;
  const completedProjects = projects.filter(p => p.status === 'Abgeschlossen').length;

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Projekte</h1>
          <p className="text-gray-600">Verwalten Sie Ihre Kundenprojekte</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Package className="h-4 w-4 mr-2" />
            Exportieren
          </button>
          <button
            onClick={handleAddProject}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Projekt hinzufügen
          </button>
        </div>
      </div>

      {/* Suchleiste */}
      <div className="bg-white rounded-lg shadow p-6 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Projekt suchen (ID, Beschreibung, Hersteller)..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamt Projekte</p>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
            </div>
            <Building className="h-8 w-8 text-primary-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktiv</p>
              <p className="text-2xl font-bold text-green-600">{projects.filter(p => p.status === 'Aktiv').length}</p>
            </div>
            <Package className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Geplant</p>
              <p className="text-2xl font-bold text-yellow-600">{projects.filter(p => p.status === 'Geplant').length}</p>
            </div>
            <Calendar className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Abgeschlossen</p>
              <p className="text-2xl font-bold text-gray-600">{projects.filter(p => p.status === 'Abgeschlossen').length}</p>
            </div>
            <FileText className="h-8 w-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Projektliste */}
      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Projektliste</h3>
            <div className="relative column-settings-container">
              <button
                onClick={() => setShowColumnSettings(!showColumnSettings)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Spalten anpassen"
              >
                <Settings className="h-5 w-5" />
              </button>
              
              {showColumnSettings && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">Spalten anzeigen</h3>
                      {loadingPreferences && (
                        <div className="text-xs text-gray-500">Lädt...</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {availableColumns.map(column => (
                        <label key={column.key} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={visibleColumns[column.key]}
                            onChange={() => !column.required && toggleColumnVisibility(column.key)}
                            disabled={column.required || loadingPreferences}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
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
        </div>

        {/* Scrollbare Tabelle */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {visibleColumns.name && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50" onClick={() => handleSort('name')}>
                      <div className="flex items-center space-x-1">
                        <span>PROJEKT</span>
                        <div className="relative">
                          {sortConfig.key === 'name' ? (
                            <span className="text-gray-400 hover:text-gray-600 text-lg font-bold">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          ) : (
                            <Filter className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                          )}
                        </div>
                      </div>
                    </th>
                  )}
                  {visibleColumns.customer && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>Kunde</span>
                        <div className="relative">
                          <button
                            onClick={() => setActiveColumnFilter(activeColumnFilter === 'customer' ? null : 'customer')}
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            <Filter className="h-3 w-3" />
                          </button>
                          {activeColumnFilter === 'customer' && (
                            <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-30 border border-gray-200">
                              <div className="p-2">
                                <select
                                  value={columnFilters.customer}
                                  onChange={(e) => handleColumnFilterChange('customer', e.target.value)}
                                  className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                  {uniqueCustomers.map(customer => (
                                    <option key={customer} value={customer}>{customer}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </th>
                  )}
                  {visibleColumns.status && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        <div className="relative">
                          <button
                            onClick={() => setActiveColumnFilter(activeColumnFilter === 'status' ? null : 'status')}
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            <Filter className="h-3 w-3" />
                          </button>
                          {activeColumnFilter === 'status' && (
                            <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-30 border border-gray-200">
                              <div className="p-2">
                                <select
                                  value={columnFilters.status}
                                  onChange={(e) => handleColumnFilterChange('status', e.target.value)}
                                  className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                  {uniqueStatuses.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </th>
                  )}
                  {visibleColumns.address && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adresse
                    </th>
                  )}
                  {visibleColumns.description && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Beschreibung
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleProjectClick(project)}>
                    {visibleColumns.name && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{project.name}</div>
                          <div className="text-sm text-gray-500">ID: {project.projectID}</div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.customer && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{customers.find(c => c.id === project.customerID)?.firmennameKundenname || 'Unbekannter Kunde'}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </td>
                    )}
                    {visibleColumns.address && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 truncate max-w-xs">{project.address || 'Nicht angegeben'}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.description && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 truncate max-w-xs">{project.description || 'Keine Beschreibung'}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDropdownOpen(dropdownOpen === project.id ? null : project.id);
                          }}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {dropdownOpen === project.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                            <div className="py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditProject(project);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Bearbeiten
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProject(project.id);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Löschen
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {sortedProjects.length === 0 && (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Projekte gefunden</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || columnFilters.status !== 'alle' || columnFilters.customer !== 'alle'
                ? 'Versuchen Sie andere Suchbegriffe oder Filter.'
                : 'Beginnen Sie mit dem Erstellen Ihres ersten Projekts.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddProjectModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onSave={editingProject ? handleUpdateProject : handleSaveProject}
        project={editingProject}
        customers={customers}
        projects={projects}
      />

      <ProjectDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        project={selectedProject}
        onEdit={handleEditProject}
        onDelete={handleDeleteProject}
      />
    </div>
  );
};

export default ProjectManagement;
