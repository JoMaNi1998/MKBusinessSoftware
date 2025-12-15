import React, { useState } from 'react';
import { Building, Edit, Trash2, Save } from 'lucide-react';
import { BaseModal } from '../../shared';
import { VDEProtocolModal } from '../../vde-protocols';
import { useProjectModal } from '../hooks/useProjectModal';
import ProjectForm from './ProjectForm';
import ProjectViewDetails from './ProjectViewDetails';
import ProjectViewStats from './ProjectViewStats';
import { PVConfigurationSection, VDEProtocolsSection, BookingsSection } from './sections';

/**
 * Unified Project Modal Component
 * Supports three modes: view, create, edit
 */
const ProjectModal = ({
  isOpen,
  onClose,
  mode = 'view',
  project = null,
  onSave,
  onEdit,
  onDelete,
  customers: customersProp = [],
  projects: projectsProp = []
}) => {
  const [isVdeProtocolModalOpen, setIsVdeProtocolModalOpen] = useState(false);
  const [selectedVdeProtocol, setSelectedVdeProtocol] = useState(null);

  const {
    // Mode flags
    isView,
    isEdit,
    isCreate,

    // Data
    customersList,
    projectBookings,
    customerOfProject,

    // View-specific data
    projectConfigurations,
    loadingConfigurations,
    deletingConfigId,
    vdeProtocols,
    loadingVdeProtocols,
    projectCosts,
    loadingCosts,

    // Form data
    formData,
    errors,
    selectedCustomerContacts,

    // Handlers
    handleInputChange,
    handleCustomerChange,
    handleContactPersonChange,
    handleSubmit,
    deleteConfiguration,
    loadVdeProtocols
  } = useProjectModal({
    isOpen,
    mode,
    project,
    customersProp,
    projectsProp,
    onSave,
    onClose
  });

  const handleVdeProtocolClick = (protocol) => {
    setSelectedVdeProtocol(protocol);
    setIsVdeProtocolModalOpen(true);
  };

  const handleVdeProtocolClose = async () => {
    setIsVdeProtocolModalOpen(false);
    setSelectedVdeProtocol(null);
    await loadVdeProtocols();
  };

  // Footer buttons
  const footerView = (
    <>
      <button
        onClick={() => onEdit?.(project)}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
      >
        <Edit className="h-4 w-4" />
        <span>Bearbeiten</span>
      </button>
      <button
        onClick={() => {
          onDelete?.(project?.id);
          onClose?.();
        }}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
      >
        <Trash2 className="h-4 w-4" />
        <span>Löschen</span>
      </button>
    </>
  );

  const footerForm = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
      >
        Abbrechen
      </button>
      <button
        type="submit"
        form="project-form"
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
      >
        <Save className="h-4 w-4" />
        <span>{isEdit ? 'Aktualisieren' : 'Hinzufügen'}</span>
      </button>
    </>
  );

  if (!isOpen) return null;

  // VIEW MODE
  if (isView && project) {
    return (
      <>
        <BaseModal
          isOpen={isOpen}
          onClose={onClose}
          title="Projektdetails"
          icon={Building}
          footerButtons={footerView}
        >
          <div className="space-y-6">
            <ProjectViewDetails
              project={project}
              customerOfProject={customerOfProject}
            />

            <ProjectViewStats
              projectBookings={projectBookings}
              projectCosts={projectCosts}
              loadingCosts={loadingCosts}
            />

            <PVConfigurationSection
              configurations={projectConfigurations}
              loading={loadingConfigurations}
              deletingConfigId={deletingConfigId}
              onDeleteConfiguration={deleteConfiguration}
            />

            <VDEProtocolsSection
              protocols={vdeProtocols}
              loading={loadingVdeProtocols}
              onProtocolClick={handleVdeProtocolClick}
            />

            <BookingsSection bookings={projectBookings} />
          </div>
        </BaseModal>

        {/* VDE Protocol Modal */}
        {isVdeProtocolModalOpen && (
          <VDEProtocolModal
            isOpen={isVdeProtocolModalOpen}
            onClose={handleVdeProtocolClose}
            protocol={selectedVdeProtocol}
            hideActions={false}
          />
        )}
      </>
    );
  }

  // CREATE/EDIT MODE
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Projekt bearbeiten' : 'Projekt hinzufügen'}
      icon={Building}
      footerButtons={footerForm}
    >
      <ProjectForm
        formData={formData}
        errors={errors}
        customersList={customersList}
        selectedCustomerContacts={selectedCustomerContacts}
        onInputChange={handleInputChange}
        onCustomerChange={handleCustomerChange}
        onContactPersonChange={handleContactPersonChange}
        onSubmit={handleSubmit}
      />
    </BaseModal>
  );
};

export default ProjectModal;

// Compatibility wrappers for existing code
export const ProjectDetailModal = ({ isOpen, onClose, project, onEdit, onDelete }) => (
  <ProjectModal
    isOpen={isOpen}
    onClose={onClose}
    mode="view"
    project={project}
    onEdit={onEdit}
    onDelete={onDelete}
  />
);

export const AddProjectModal = ({ isOpen, onClose, onSave, project = null, customers = [], projects = [] }) => (
  <ProjectModal
    isOpen={isOpen}
    onClose={onClose}
    mode={project ? 'edit' : 'create'}
    project={project}
    onSave={onSave}
    customers={customers}
    projects={projects}
  />
);
