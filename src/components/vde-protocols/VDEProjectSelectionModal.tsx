import React, { useState, useEffect, ChangeEvent } from 'react';
import { User, Building, FileText } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useCustomers } from '../../context/CustomerContext';
import { useNotification } from '../../context/NotificationContext';
import { useAutoSelectProject } from '../../hooks/useAutoSelectProject';
import { FirebaseService } from '../../services/firebaseService';
import { BaseModal } from '../shared';
import { NotificationType } from '../../types/enums';
import {
  VDEProjectSelectionModalProps,
  ProjectSelectionResult,
  ProjectConfiguration,
  DateValue,
  FirebaseTimestamp,
} from './VDEProtocolModal/types';
import type { Project, Customer } from '@app-types';

interface ProjectConfigurationWithId extends ProjectConfiguration {
  id: string;
}

const VDEProjectSelectionModal: React.FC<VDEProjectSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectConfiguration,
}) => {
  const { projects } = useProjects() as { projects: Project[] };
  const { customers } = useCustomers() as { customers: Customer[] };
  const { showNotification } = useNotification();

  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedConfiguration, setSelectedConfiguration] = useState<string>('');
  const [customerProjects, setCustomerProjects] = useState<Project[]>([]);
  const [projectConfigurations, setProjectConfigurations] = useState<ProjectConfigurationWithId[]>(
    []
  );
  const [loadingConfigurations, setLoadingConfigurations] = useState<boolean>(false);

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
      const filteredProjects = projects.filter((p) => p.customerID === selectedCustomer);
      setCustomerProjects(filteredProjects);
      setSelectedProject('');
      setSelectedConfiguration('');
      setProjectConfigurations([]);
    } else {
      setCustomerProjects([]);
    }
  }, [selectedCustomer, projects]);

  // Auto-Select Projekt wenn nur eins verfügbar
  useAutoSelectProject({
    customerProjects,
    selectedProject,
    setSelectedProject
  });

  // Load configurations for selected project
  useEffect(() => {
    const loadProjectConfigurations = async (): Promise<void> => {
      if (!selectedProject) {
        setProjectConfigurations([]);
        setSelectedConfiguration('');
        return;
      }

      setLoadingConfigurations(true);
      try {
        const configurations = (await FirebaseService.getDocuments(
          'project-configurations'
        )) as ProjectConfigurationWithId[];
        const projectConfigs = configurations.filter(
          (config) => config.projectID === selectedProject
        );

        // Sort by creation date (newest first)
        projectConfigs.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
          return dateB - dateA;
        });

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

  const handleGenerate = (): void => {
    if (!selectedCustomer || !selectedProject || !selectedConfiguration) {
      showNotification('Bitte wählen Sie Kunde, Projekt und Konfiguration aus!', NotificationType.WARNING);
      return;
    }

    const customer = customers.find((c) => c.id === selectedCustomer);
    const project = projects.find((p) => p.id === selectedProject);
    const configuration = projectConfigurations.find((c) => c.id === selectedConfiguration);

    const result: ProjectSelectionResult = {
      customer,
      project,
      configuration,
      selectedProject,
      selectedCustomer,
    };

    onSelectConfiguration(result);
    onClose();
  };

  const formatDate = (dateValue: DateValue): string => {
    if (!dateValue) return 'Unbekanntes Datum';

    // Handle Firebase Timestamp object
    if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
      const date = new Date((dateValue as FirebaseTimestamp).seconds * 1000);
      return date.toLocaleDateString('de-DE') + ' ' + date.toLocaleTimeString('de-DE');
    }

    // Check if it's already a formatted German date string
    if (typeof dateValue === 'string' && dateValue.includes('um') && dateValue.includes('UTC')) {
      return dateValue.replace(' UTC+2', '').replace(' um ', ' ');
    }

    try {
      const date = new Date(dateValue as string | Date);
      if (isNaN(date.getTime())) return String(dateValue);
      return date.toLocaleDateString('de-DE') + ' ' + date.toLocaleTimeString('de-DE');
    } catch (error) {
      return String(dateValue);
    }
  };

  const footerButtons = (
    <>
      <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
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
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedCustomer(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">-- Kunde wählen --</option>
            {customers.map((customer) => (
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
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedProject(e.target.value)}
            disabled={!selectedCustomer}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">-- Projekt wählen --</option>
            {customerProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.projectName ||
                  project.name ||
                  project.title ||
                  project.projektName ||
                  (typeof project.address === 'string' ? project.address : project.address?.strasse) ||
                  project.id}
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
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setSelectedConfiguration(e.target.value)
              }
              disabled={!selectedProject}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">-- Konfiguration wählen --</option>
              {projectConfigurations.map((config) => (
                <option key={config.id} value={config.id}>
                  {formatDate(config.createdAt || '')}
                </option>
              ))}
            </select>
          )}
          {selectedProject && !loadingConfigurations && projectConfigurations.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Keine Konfigurationen für dieses Projekt gefunden.
            </p>
          )}
        </div>
      </div>
    </BaseModal>
  );
};

export default VDEProjectSelectionModal;
