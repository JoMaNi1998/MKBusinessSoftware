import React from 'react';
import { Plus, FileText } from 'lucide-react';
import { BaseModal } from '@components/shared';
import InvoicePDFPreview from '../InvoicePDFPreview';
import { useInvoiceManagement } from '@hooks/useInvoiceManagement';
import InvoiceStats from './InvoiceStats';
import InvoiceFilters from './InvoiceFilters';
import InvoiceTable from './InvoiceTable';
import InvoiceCard from './InvoiceCard';

const InvoiceManagement: React.FC = () => {
  const hook = useInvoiceManagement();

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
        <div className="pl-12 sm:pl-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Rechnungen</h1>
          <p className="text-sm text-gray-500 hidden sm:block">
            {hook.filteredInvoices.length} von {hook.invoices.length} Rechnungen
          </p>
        </div>
        <button
          onClick={hook.handleNewInvoice}
          className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Neue Rechnung</span>
          <span className="sm:hidden">Neu</span>
        </button>
      </div>

      {/* Statistik-Karten */}
      <InvoiceStats stats={hook.stats} />

      {/* Rechnungsliste */}
      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col min-h-0">
        {/* Filter */}
        <InvoiceFilters
          searchTerm={hook.searchTerm}
          setSearchTerm={hook.setSearchTerm}
          visibleColumns={hook.visibleColumns}
          showColumnSettings={hook.showColumnSettings}
          setShowColumnSettings={hook.setShowColumnSettings}
          toggleColumn={hook.toggleColumn}
          columnSettingsRef={hook.columnSettingsRef}
        />

        {hook.loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : hook.filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Rechnungen gefunden</h3>
            <p className="text-gray-500 mb-4">
              {hook.invoices.length === 0
                ? 'Erstellen Sie Ihre erste Rechnung'
                : 'Passen Sie Ihre Filterkriterien an'}
            </p>
            {hook.invoices.length === 0 && (
              <button
                onClick={hook.handleNewInvoice}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Erste Rechnung erstellen
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            {/* Mobile: Card-Liste */}
            <InvoiceCard
              filteredInvoices={hook.filteredInvoices}
              visibleColumns={hook.visibleColumns}
              handleViewInvoice={hook.handleViewInvoice}
              getCustomerName={hook.getCustomerName}
              INVOICE_STATUS_LABELS={hook.INVOICE_STATUS_LABELS}
            />

            {/* Desktop: Tabelle */}
            <InvoiceTable
              filteredInvoices={hook.filteredInvoices}
              visibleColumns={hook.visibleColumns}
              handleViewInvoice={hook.handleViewInvoice}
              handleEditInvoice={hook.handleEditInvoice}
              handleDeleteClick={hook.handleDeleteClick}
              handleStatusChange={hook.handleStatusChange}
              showActionsMenu={hook.showActionsMenu}
              setShowActionsMenu={hook.setShowActionsMenu}
              getCustomerName={hook.getCustomerName}
              statusFilter={hook.statusFilter}
              setStatusFilter={hook.setStatusFilter}
              activeColumnFilter={hook.activeColumnFilter}
              setActiveColumnFilter={hook.setActiveColumnFilter}
              handleColumnFilterChange={hook.handleColumnFilterChange}
              uniqueStatuses={hook.uniqueStatuses}
              filterRef={hook.filterRef}
              INVOICE_STATUS={hook.INVOICE_STATUS}
              INVOICE_STATUS_LABELS={hook.INVOICE_STATUS_LABELS}
            />
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <BaseModal
        isOpen={hook.showDeleteModal}
        onClose={hook.handleCloseDeleteModal}
        title="Rechnung löschen"
        size="sm"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Möchten Sie die Rechnung <strong>{hook.invoiceToDelete?.invoiceNumber}</strong> wirklich löschen?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={hook.handleCloseDeleteModal}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Abbrechen
            </button>
            <button
              onClick={hook.handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Löschen
            </button>
          </div>
        </div>
      </BaseModal>

      {/* PDF Preview Modal */}
      {hook.showPDFPreview && hook.selectedInvoice && (
        <InvoicePDFPreview
          invoice={hook.selectedInvoice as any}
          isOpen={hook.showPDFPreview}
          onClose={hook.handleClosePDFPreview}
          onEdit={(invoice) => {
            hook.handleClosePDFPreview();
            hook.handleEditInvoice(invoice as any);
          }}
        />
      )}
    </div>
  );
};

export default InvoiceManagement;
