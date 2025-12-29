import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOffers } from '@context/OfferContext';
import { useCustomers } from '@context/CustomerContext';
import { useProjects } from '@context/ProjectContext';
import { useNotification } from '@context/NotificationContext';
import { useInvoice } from '@context/InvoiceContext';
import { NotificationType } from '@app-types/enums';
import type { Offer } from '@app-types';

// Hooks
import { useOfferColumnPrefs } from '@hooks';

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

const OfferManagement: React.FC = () => {
  const navigate = useNavigate();
  const { offers, loading, deleteOffer, getStatistics } = useOffers();
  const { customers } = useCustomers();
  const { projects } = useProjects();
  const { showNotification } = useNotification();
  const { createInvoiceFromOffer, hasDepositInvoice } = useInvoice();

  // Custom Hooks
  const { visibleColumns, loading: loadingPreferences, toggleColumn, availableColumns } = useOfferColumnPrefs();

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showPDFPreview, setShowPDFPreview] = useState<boolean>(false);
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);

  // Statistiken
  const stats = useMemo(() => getStatistics(), [getStatistics]);

  // Gefilterte Angebote
  const filteredOffers = useMemo<Offer[]>(() => {
    return offers.filter(offer => {
      // Suche
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const customer = customers.find(c => c.id === offer.customerID);
        const project = projects.find(p => p.id === offer.projectID);

        const matchesSearch =
          offer.offerNumber?.toLowerCase().includes(term) ||
          customer?.firmennameKundenname?.toLowerCase().includes(term) ||
          (customer as any)?.name?.toLowerCase().includes(term) ||
          project?.name?.toLowerCase().includes(term);

        if (!matchesSearch) return false;
      }

      // Status Filter
      if (statusFilter !== 'all' && offer.status !== statusFilter) return false;

      return true;
    });
  }, [offers, searchTerm, statusFilter, customers, projects]);

  // Helper Functions
  const getCustomerName = useCallback((customerId: string): string => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.firmennameKundenname || (customer as any)?.name || '-';
  }, [customers]);

  const getProjectName = useCallback((projectId?: string): string => {
    if (!projectId) return '-';
    const project = projects.find(p => p.id === projectId);
    return project?.name || (project as any)?.name || '-';
  }, [projects]);

  // Handlers
  const handleNewOffer = useCallback((): void => {
    navigate('/offers/new');
  }, [navigate]);

  const handleEditOffer = useCallback((offer: Offer): void => {
    navigate(`/offers/${offer.id}`);
  }, [navigate]);

  const handleViewOffer = useCallback((offer: Offer): void => {
    setSelectedOffer(offer);
    setShowPDFPreview(true);
  }, []);

  const handleDeleteClick = useCallback((offer: Offer): void => {
    setOfferToDelete(offer);
    setShowDeleteModal(true);
  }, []);

  const handleDeleteConfirm = useCallback(async (): Promise<void> => {
    if (!offerToDelete) return;

    const result = await deleteOffer(offerToDelete.id);
    if (result.success) {
      showNotification('Angebot gelöscht', NotificationType.SUCCESS);
    } else {
      showNotification('Fehler beim Löschen', NotificationType.ERROR);
    }
    setShowDeleteModal(false);
    setOfferToDelete(null);
  }, [offerToDelete, deleteOffer, showNotification]);

  const handleCreateInvoice = useCallback(async (offer: Offer): Promise<void> => {
    try {
      const result = await createInvoiceFromOffer(offer);
      if (result.success) {
        showNotification(
          `${hasDepositInvoice(offer.id) ? 'Schlussrechnung' : 'Anzahlungsrechnung'} wurde erstellt`,
          NotificationType.SUCCESS
        );
        navigate('/invoices');
      } else {
        showNotification('Fehler beim Erstellen der Rechnung', NotificationType.ERROR);
      }
    } catch (err) {
      showNotification('Fehler beim Erstellen der Rechnung', NotificationType.ERROR);
    }
  }, [createInvoiceFromOffer, hasDepositInvoice, showNotification, navigate]);

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <OfferHeader onNewOffer={handleNewOffer} />

      {/* Statistiken */}
      <OfferStats stats={stats} />

      {/* Angebotsliste */}
      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col min-h-0">
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
          onEdit={(offer: Offer) => {
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
