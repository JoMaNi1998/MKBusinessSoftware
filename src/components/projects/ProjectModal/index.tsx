import React, { useState } from 'react';
import { Building, Edit, Trash2, Save, Settings, FileText, Package, Euro } from 'lucide-react';
import { BaseModal, CollapsibleSection } from '@components/shared';
import { VDEProtocolModal } from '@components/vde-protocols';
import { useProjectModal } from '@hooks';
import { useConfirm } from '@context/ConfirmContext';
import { useBookings } from '@context/BookingContext';
import ProjectForm from './ProjectForm';
import ProjectViewDetails from './ProjectViewDetails';
import ProjectViewStats from './ProjectViewStats';
import { PVConfigurationSection, VDEProtocolsSection, BookingsSection, CostBreakdownSection } from './sections';
import type { Project, Customer } from '@app-types';
import type { ProjectModalMode, VDEProtocol } from '@app-types/components/project.types';
import { ConfirmVariant, NotificationType } from '@app-types/enums';

interface ProjectModalProps {
  isOpen: boolean;
  onClose?: () => void;
  mode?: ProjectModalMode;
  project?: Project | null;
  onSave?: (projectData: any) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  customers?: Customer[];
  projects?: Project[];
}

/**
 * Unified Project Modal Component
 * Supports three modes: view, create, edit
 */
const ProjectModal: React.FC<ProjectModalProps> = ({
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
  const [isVdeProtocolModalOpen, setIsVdeProtocolModalOpen] = useState<boolean>(false);
  const [selectedVdeProtocol, setSelectedVdeProtocol] = useState<VDEProtocol | null>(null);

  const { confirm } = useConfirm();
  const { undoBooking } = useBookings();

  const {
    // Mode flags
    isView,
    isEdit,

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
    loadVdeProtocols,
    showNotification
  } = useProjectModal({
    isOpen,
    mode,
    project,
    customersProp,
    projectsProp,
    onSave,
    onClose
  });

  const handleVdeProtocolClick = (protocol: VDEProtocol): void => {
    setSelectedVdeProtocol(protocol);
    setIsVdeProtocolModalOpen(true);
  };

  const handleVdeProtocolClose = async (): Promise<void> => {
    setIsVdeProtocolModalOpen(false);
    setSelectedVdeProtocol(null);
    await loadVdeProtocols();
  };

  const handleUndoBooking = async (bookingId: string): Promise<void> => {
    const booking = projectBookings.find(b => b.id === bookingId);
    if (!booking) return;

    // ExtendedBooking hat customerName und projectName
    const bookingName = (booking as any).customerName || (booking as any).projectName || 'diese Buchung';

    await confirm({
      title: 'Buchung rückgängig machen',
      message: `Möchten Sie die Buchung "${bookingName}" wirklich rückgängig machen?`,
      variant: ConfirmVariant.DANGER,
      confirmText: 'Rückgängig machen',
      onConfirmAsync: async () => {
        const result = await undoBooking(bookingId);
        if (result.success) {
          showNotification('Buchung erfolgreich rückgängig gemacht', NotificationType.SUCCESS);
        } else {
          showNotification(result.error || 'Fehler beim Rückgängig machen', NotificationType.ERROR);
        }
      }
    });
  };

  // Footer buttons
  const footerView = (
    <>
      <button
        onClick={() => onEdit?.(project!)}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
      >
        <Edit className="h-4 w-4" />
        <span>Bearbeiten</span>
      </button>
      <button
        onClick={() => {
          onDelete?.(project?.id!);
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
          onClose={onClose || (() => {})}
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

            <CollapsibleSection
              title="Kostenübersicht"
              count={`${projectCosts > 0 ? '€' : ''}`}
              icon={Euro}
              defaultOpen={false}
            >
              <CostBreakdownSection bookings={projectBookings} />
            </CollapsibleSection>

            <CollapsibleSection
              title="PV-Konfigurationen"
              count={projectConfigurations.length}
              icon={Settings}
              defaultOpen={false}
            >
              <PVConfigurationSection
                configurations={projectConfigurations}
                loading={loadingConfigurations}
                deletingConfigId={deletingConfigId}
                onDeleteConfiguration={deleteConfiguration}
              />
            </CollapsibleSection>

            <CollapsibleSection
              title="VDE-Protokolle"
              count={vdeProtocols.length}
              icon={FileText}
              defaultOpen={false}
            >
              <VDEProtocolsSection
                protocols={vdeProtocols as any}
                loading={loadingVdeProtocols}
                onProtocolClick={handleVdeProtocolClick as any}
              />
            </CollapsibleSection>

            <CollapsibleSection
              title="Materialbuchungen"
              count={`${projectBookings.length} Buchungen`}
              icon={Package}
              defaultOpen={false}
            >
              <BookingsSection bookings={projectBookings} onUndoBooking={handleUndoBooking} />
            </CollapsibleSection>
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
      onClose={onClose || (() => {})}
      title={isEdit ? 'Projekt bearbeiten' : 'Projekt hinzufügen'}
      icon={Building}
      footerButtons={footerForm}
    >
      <ProjectForm
        formData={formData}
        errors={errors}
        customersList={customersList}
        selectedCustomerContacts={selectedCustomerContacts as any}
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
interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose?: () => void;
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ isOpen, onClose, project, onEdit, onDelete }) => (
  <ProjectModal
    isOpen={isOpen}
    onClose={onClose}
    mode="view"
    project={project}
    onEdit={onEdit}
    onDelete={onDelete}
  />
);

interface AddProjectModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSave?: (projectData: any) => void;
  project?: Project | null;
  customers?: Customer[];
  projects?: Project[];
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose, onSave, project = null, customers = [], projects = [] }) => (
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
