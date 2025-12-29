import React from 'react';
import { Plus } from 'lucide-react';
import { useCustomerManagement } from '@hooks';
import CustomerStats from './CustomerStats';
import CustomerFilters, { CustomerMobileFilters } from './CustomerFilters';
import CustomerTable from './CustomerTable';
import CustomerCard from './CustomerCard';
import { CustomerDetailModal, AddCustomerModal } from '../CustomerModal';
import { ProjectDetailModal, AddProjectModal } from '@components/projects';

const CustomerManagement: React.FC = () => {
  const {
    customers,
    projects,
    filteredCustomers,
    searchTerm,
    setSearchTerm,
    dropdownOpen,
    setDropdownOpen,
    columnFilters,
    activeColumnFilter,
    setActiveColumnFilter,
    uniqueCities,
    visibleColumns,
    availableColumns,
    showColumnSelector,
    setShowColumnSelector,
    loadingPreferences,
    toggleColumn,
    handleColumnFilterChange,
    resetFilters,
    hasActiveFilters,
    isAddModalOpen,
    setIsAddModalOpen,
    editingCustomer,
    isDetailModalOpen,
    selectedCustomer,
    handleDeleteCustomer,
    handleEditCustomer,
    handleCloseModal,
    handleCustomerClick,
    handleCloseDetailModal,
    isProjectDetailModalOpen,
    setIsProjectDetailModalOpen,
    selectedProject,
    setSelectedProject,
    isProjectEditModalOpen,
    setIsProjectEditModalOpen,
    editingProject,
    handleProjectClick,
    handleProjectEdit,
    handleProjectDelete,
    handleProjectSave
  } = useCustomerManagement();

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="pl-12 sm:pl-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Kunden</h1>
          <p className="mt-1 text-sm text-gray-600 hidden sm:block">
            Verwalten Sie Ihre Kunden und deren Projekte
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Kunde hinzufügen</span>
          <span className="sm:hidden">Neu</span>
        </button>
      </div>

      {/* Statistiken */}
      <CustomerStats totalCustomers={customers.length} />

      {/* Kundenliste */}
      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col">
        {/* Header mit integrierter Suche */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0 space-y-3 sm:space-y-0">
          <div className="flex items-center justify-between sm:gap-3">
            <h3 className="text-lg font-medium text-gray-900 flex-shrink-0">Kundenliste</h3>
            <CustomerFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              hasActiveFilters={hasActiveFilters}
              resetFilters={resetFilters}
              showColumnSelector={showColumnSelector}
              setShowColumnSelector={setShowColumnSelector}
              visibleColumns={visibleColumns}
              availableColumns={availableColumns}
              loadingPreferences={loadingPreferences}
              toggleColumn={toggleColumn}
            />
          </div>

          {/* Mobile: Suche als zweite Zeile */}
          <CustomerMobileFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            hasActiveFilters={hasActiveFilters}
            resetFilters={resetFilters}
          />
        </div>

        {/* Scrollbare Tabelle / Mobile Cards */}
        <div className="flex-1 overflow-hidden">
          {/* Mobile: Card-Liste */}
          <CustomerCard
            filteredCustomers={filteredCustomers}
            visibleColumns={visibleColumns}
            searchTerm={searchTerm}
            handleCustomerClick={handleCustomerClick}
          />

          {/* Desktop: Tabelle */}
          <CustomerTable
            filteredCustomers={filteredCustomers}
            visibleColumns={visibleColumns}
            searchTerm={searchTerm}
            dropdownOpen={dropdownOpen}
            setDropdownOpen={setDropdownOpen}
            activeColumnFilter={activeColumnFilter}
            setActiveColumnFilter={setActiveColumnFilter}
            columnFilters={columnFilters}
            uniqueCities={uniqueCities}
            handleColumnFilterChange={handleColumnFilterChange}
            handleCustomerClick={handleCustomerClick}
            handleEditCustomer={handleEditCustomer}
            handleDeleteCustomer={handleDeleteCustomer}
          />
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
      {selectedCustomer && (
        <CustomerDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          customer={selectedCustomer}
          onEdit={handleEditCustomer}
          onDelete={handleDeleteCustomer}
          onProjectClick={handleProjectClick}
        />
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          isOpen={isProjectDetailModalOpen}
          onClose={() => {
            setIsProjectDetailModalOpen(false);
            setSelectedProject(null);
          }}
          project={selectedProject}
          onEdit={handleProjectEdit}
          onDelete={handleProjectDelete}
        />
      )}

      {/* Project Edit Modal */}
      <AddProjectModal
        isOpen={isProjectEditModalOpen}
        onClose={() => {
          setIsProjectEditModalOpen(false);
        }}
        project={editingProject}
        onSave={handleProjectSave}
        customers={customers}
        projects={projects}
      />
    </div>
  );
};

export default CustomerManagement;
