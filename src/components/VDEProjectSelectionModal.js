import React, { useState, useEffect } from 'react';
import { X, User, Building, FileText } from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { useCustomers } from '../context/CustomerContext';
import { FirebaseService } from '../services/firebaseService';
import BaseModal from './BaseModal';

const VDEProjectSelectionModal = ({ isOpen, onClose, onSelectConfiguration }) => {
  const { projects } = useProjects();
  const { customers } = useCustomers();
  
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedConfiguration, setSelectedConfiguration] = useState('');
  const [customerProjects, setCustomerProjects] = useState([]);
  const [projectConfigurations, setProjectConfigurations] = useState([]);
  const [loadingConfigurations, setLoadingConfigurations] = useState(false);

  // Reset selections when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCustomer('');
      setSelectedProject('');
      setSelectedConfiguration('');
      setCustomerProjects([]);
      setProjectConfigurations([]);
    }
  }, [isOpen]);

  // Load projects for selected customer
  useEffect(() => {
    if (selectedCustomer) {
      const filteredProjects = projects.filter(p => p.customerID === selectedCustomer);
      setCustomerProjects(filteredProjects);
      setSelectedProject('');
      setSelectedConfiguration('');
      setProjectConfigurations([]);
    } else {
      setCustomerProjects([]);
    }
  }, [selectedCustomer, projects]);

  // Load configurations for selected project
  useEffect(() => {
    const loadProjectConfigurations = async () => {
      if (!selectedProject) {
        setProjectConfigurations([]);
        setSelectedConfiguration('');
        return;
      }
      
      setLoadingConfigurations(true);
      try {
        const configurations = await FirebaseService.getDocuments('project-configurations');
        const projectConfigs = configurations.filter(config => config.projectID === selectedProject);
        
        // Sort by creation date (newest first)
        projectConfigs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setProjectConfigurations(projectConfigs);
        setSelectedConfiguration('');
      } catch (error) {
        console.error('Fehler beim Laden der Projektkonfigurationen:', error);
        setProjectConfigurations([]);
      } finally {
        setLoadingConfigurations(false);
      }
    };

    loadProjectConfigurations();
  }, [selectedProject]);

  const handleGenerate = () => {
    if (!selectedCustomer || !selectedProject || !selectedConfiguration) {
      alert('Bitte wählen Sie Kunde, Projekt und Konfiguration aus!');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomer);
    const project = projects.find(p => p.id === selectedProject);
    const configuration = projectConfigurations.find(c => c.id === selectedConfiguration);

    onSelectConfiguration({
      customer,
      project,
      configuration,
      selectedProject,
      selectedCustomer
    });
    
    onClose();
  };

  const footerButtons = (
    <>
      <button
        onClick={onClose}
        className="px-4 py-2 text-gray-600 hover:text-gray-800"
      >
        Abbrechen
      </button>
      <button
        onClick={handleGenerate}
        disabled={!selectedCustomer || !selectedProject || !selectedConfiguration}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        VDE-Protokoll generieren
      </button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="VDE-Protokoll aus Projekt generieren"
      icon={FileText}
      footerButtons={footerButtons}
    >
      <div className="space-y-6">
        
        {/* Kunde auswählen */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <User className="h-4 w-4 mr-2" />
            Kunde auswählen
          </label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">-- Kunde wählen --</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.firmennameKundenname}
              </option>
            ))}
          </select>
        </div>

        {/* Projekt auswählen */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Building className="h-4 w-4 mr-2" />
            Projekt auswählen
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            disabled={!selectedCustomer}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">-- Projekt wählen --</option>
            {customerProjects.map(project => (
              <option key={project.id} value={project.id}>
                {project.projectName || project.name || project.title || project.projektName || project.address || project.id}
              </option>
            ))}
          </select>
          {selectedCustomer && customerProjects.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">Keine Projekte für diesen Kunden gefunden.</p>
          )}
        </div>

        {/* Konfiguration auswählen */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <FileText className="h-4 w-4 mr-2" />
            Konfiguration auswählen
          </label>
          {loadingConfigurations ? (
            <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500">
              Lade Konfigurationen...
            </div>
          ) : (
            <select
              value={selectedConfiguration}
              onChange={(e) => setSelectedConfiguration(e.target.value)}
              disabled={!selectedProject}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">-- Konfiguration wählen --</option>
              {projectConfigurations.map(config => {
                const formatDate = (dateValue) => {
                  if (!dateValue) return 'Unbekanntes Datum';
                  
                  // Handle Firebase Timestamp object
                  if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
                    const date = new Date(dateValue.seconds * 1000);
                    return date.toLocaleDateString('de-DE') + ' ' + date.toLocaleTimeString('de-DE');
                  }
                  
                  // Check if it's already a formatted German date string
                  if (typeof dateValue === 'string' && dateValue.includes('um') && dateValue.includes('UTC')) {
                    return dateValue.replace(' UTC+2', '').replace(' um ', ' ');
                  }
                  
                  try {
                    const date = new Date(dateValue);
                    if (isNaN(date.getTime())) return String(dateValue); // Convert to string if can't parse
                    return date.toLocaleDateString('de-DE') + ' ' + date.toLocaleTimeString('de-DE');
                  } catch (error) {
                    return String(dateValue); // Convert to string if error
                  }
                };
                
                return (
                  <option key={config.id} value={config.id}>
                    {formatDate(config.createdAt)}
                  </option>
                );
              })}
            </select>
          )}
          {selectedProject && !loadingConfigurations && projectConfigurations.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">Keine Konfigurationen für dieses Projekt gefunden.</p>
          )}
        </div>

      </div>
    </BaseModal>
  );
};

export default VDEProjectSelectionModal;
