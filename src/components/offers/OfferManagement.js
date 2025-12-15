import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOffers } from '../../context/OfferContext';
import { useCustomers } from '../../context/CustomerContext';
import { useProjects } from '../../context/ProjectContext';
import { useNotification } from '../../context/NotificationContext';
import { useInvoices } from '../../context/InvoiceContext';

// Hooks
import { useOfferColumnPrefs } from './hooks';

// Components
import {
  OfferStats,
  OfferHeader,
  OfferListHeader,
  OfferTable,
  OfferCards,
  OfferEmptyState
} from './components';

// Modals
import { DeleteOfferModal } from './modals';
import OfferPDFPreview from './OfferPDFPreview';

const OfferManagement = () => {
  const navigate = useNavigate();
  const { offers, loading, deleteOffer, getStatistics } = useOffers();
  const { customers } = useCustomers();
  const { projects } = useProjects();
  const { showNotification } = useNotification();
  const { createInvoiceFromOffer, hasDepositInvoice } = useInvoices();

  // Custom Hooks
  const { visibleColumns, loading: loadingPreferences, toggleColumn, availableColumns } = useOfferColumnPrefs();

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState(null);

  // Statistiken
  const stats = useMemo(() => getStatistics(), [getStatistics, offers]);

  // Gefilterte Angebote
  const filteredOffers = useMemo(() => {
    return offers.filter(offer => {
      // Suche
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const customer = customers.find(c => c.id === offer.customerID);
        const project = projects.find(p => p.id === offer.projectID);

        const matchesSearch =
          offer.offerNumber?.toLowerCase().includes(term) ||
          customer?.firmennameKundenname?.toLowerCase().includes(term) ||
          customer?.name?.toLowerCase().includes(term) ||
          project?.projektname?.toLowerCase().includes(term);

        if (!matchesSearch) return false;
      }

      // Status Filter
      if (statusFilter !== 'all' && offer.status !== statusFilter) return false;

      return true;
    });
  }, [offers, searchTerm, statusFilter, customers, projects]);

  // Helper Functions
  const getCustomerName = useCallback((customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.firmennameKundenname || customer?.name || '-';
  }, [customers]);

  const getProjectName = useCallback((projectId) => {
    if (!projectId) return '-';
    const project = projects.find(p => p.id === projectId);
    return project?.projektname || project?.name || '-';
  }, [projects]);

  // Handlers
  const handleNewOffer = useCallback(() => {
    navigate('/offers/new');
  }, [navigate]);

  const handleEditOffer = useCallback((offer) => {
    navigate(`/offers/${offer.id}`);
  }, [navigate]);

  const handleViewOffer = useCallback((offer) => {
    setSelectedOffer(offer);
    setShowPDFPreview(true);
  }, []);

  const handleDeleteClick = useCallback((offer) => {
    setOfferToDelete(offer);
    setShowDeleteModal(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!offerToDelete) return;

    const result = await deleteOffer(offerToDelete.id);
    if (result.success) {
      showNotification('Angebot gelöscht', 'success');
    } else {
      showNotification('Fehler beim Löschen', 'error');
    }
    setShowDeleteModal(false);
    setOfferToDelete(null);
  }, [offerToDelete, deleteOffer, showNotification]);

  const handleCreateInvoice = useCallback(async (offer) => {
    try {
      const result = await createInvoiceFromOffer(offer);
      if (result.success) {
        showNotification(
          `${hasDepositInvoice(offer.id) ? 'Schlussrechnung' : 'Anzahlungsrechnung'} wurde erstellt`,
          'success'
        );
        navigate('/invoices');
      } else {
        showNotification('Fehler beim Erstellen der Rechnung', 'error');
      }
    } catch (err) {
      showNotification('Fehler beim Erstellen der Rechnung', 'error');
    }
  }, [createInvoiceFromOffer, hasDepositInvoice, showNotification, navigate]);

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <OfferHeader onNewOffer={handleNewOffer} />

      {/* Statistiken */}
      <OfferStats stats={stats} />

      {/* Angebotsliste */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
        <OfferListHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          visibleColumns={visibleColumns}
          availableColumns={availableColumns}
          loadingPreferences={loadingPreferences}
          onToggleColumn={toggleColumn}
        />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredOffers.length === 0 ? (
          <OfferEmptyState
            hasOffers={offers.length > 0}
            onNewOffer={handleNewOffer}
          />
        ) : (
          <div className="flex-1 overflow-hidden">
            {/* Mobile: Cards */}
            <OfferCards
              offers={filteredOffers}
              visibleColumns={visibleColumns}
              getCustomerName={getCustomerName}
              getProjectName={getProjectName}
              onView={handleViewOffer}
            />

            {/* Desktop: Table */}
            <OfferTable
              offers={filteredOffers}
              visibleColumns={visibleColumns}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              getCustomerName={getCustomerName}
              getProjectName={getProjectName}
              onView={handleViewOffer}
              onEdit={handleEditOffer}
              onDelete={handleDeleteClick}
              onCreateInvoice={handleCreateInvoice}
              hasDepositInvoice={hasDepositInvoice}
            />
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <DeleteOfferModal
        isOpen={showDeleteModal}
        offer={offerToDelete}
        onClose={() => {
          setShowDeleteModal(false);
          setOfferToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />

      {/* PDF Preview Modal */}
      {showPDFPreview && selectedOffer && (
        <OfferPDFPreview
          offer={selectedOffer}
          isOpen={showPDFPreview}
          onClose={() => {
            setShowPDFPreview(false);
            setSelectedOffer(null);
          }}
          onEdit={(offer) => {
            setShowPDFPreview(false);
            setSelectedOffer(null);
            handleEditOffer(offer);
          }}
        />
      )}
    </div>
  );
};

export default OfferManagement;
