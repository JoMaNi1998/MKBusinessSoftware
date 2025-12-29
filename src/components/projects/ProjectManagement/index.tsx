import React from 'react';
import ProjectHeader from './ProjectHeader';
import ProjectStats from './ProjectStats';
import ProjectList from './ProjectList';
import { useProjectManagement, useProjectColumnPrefs } from '@hooks';
import { ProjectDetailModal, AddProjectModal } from '../ProjectModal';

const ProjectManagement: React.FC = () => {
  const {
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
  } = useProjectManagement();

  const {
    visibleColumns,
    loading: loadingPreferences,
    toggleColumn
  } = useProjectColumnPrefs('projectColumns');

  return (
    <div className="h-full flex flex-col space-y-6">
      <ProjectHeader onAddProject={handleAddProject} />

      <ProjectStats stats={stats} />

      <ProjectList
        projects={sortedProjects}
        customers={customers}
        visibleColumns={visibleColumns}
        loadingPreferences={loadingPreferences}
        onToggleColumn={toggleColumn}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortConfig={sortConfig}
        onSort={handleSort}
        activeColumnFilter={activeColumnFilter}
        onToggleColumnFilter={setActiveColumnFilter}
        columnFilters={columnFilters}
        onColumnFilterChange={handleColumnFilterChange}
        uniqueStatuses={uniqueStatuses}
        uniqueCustomers={uniqueCustomers}
        editingStatus={editingStatus}
        onStatusEdit={handleStatusEdit}
        onStatusSave={handleStatusSave}
        onStatusCancel={handleStatusCancel}
        dropdownOpen={dropdownOpen}
        onDropdownToggle={setDropdownOpen}
        onProjectClick={handleProjectClick}
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteProject}
      />

      {/* Modals */}
      <AddProjectModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProject}
        project={editingProject}
        customers={customers}
        projects={projects}
      />

      {selectedProject && (
        <ProjectDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          project={selectedProject}
          onEdit={handleEditProject}
          onDelete={handleDeleteProject}
        />
      )}
    </div>
  );
};

export default ProjectManagement;
