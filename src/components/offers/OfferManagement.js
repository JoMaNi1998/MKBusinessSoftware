import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  FileText,
  Edit,
  Trash2,
  Copy,
  Eye,
  Download,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  ChevronDown,
  TrendingUp,
  Users,
  Euro,
  Settings
} from 'lucide-react';
import { useOffers, OFFER_STATUS, OFFER_STATUS_LABELS } from '../../context/OfferContext';
import { useCustomers } from '../../context/CustomerContext';
import { useProjects } from '../../context/ProjectContext';
import { useNotification } from '../../context/NotificationContext';
import BaseModal from '../BaseModal';
import OfferPDFPreview from './OfferPDFPreview';

const OfferManagement = () => {
  const navigate = useNavigate();
  const { offers, loading, deleteOffer, duplicateOffer, updateOfferStatus, getStatistics } = useOffers();
  const { customers } = useCustomers();
  const { projects } = useProjects();
  const { showNotification } = useNotification();

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');

  // Modal State
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState(null);
  const [showActionsMenu, setShowActionsMenu] = useState(null);

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

      // Kunden Filter
      if (customerFilter !== 'all' && offer.customerID !== customerFilter) return false;

      return true;
    });
  }, [offers, searchTerm, statusFilter, customerFilter, customers, projects]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.firmennameKundenname || customer?.name || '-';
  };

  const getProjectName = (projectId) => {
    if (!projectId) return '-';
    const project = projects.find(p => p.id === projectId);
    return project?.projektname || project?.name || '-';
  };

  const getStatusBadge = (status) => {
    const statusInfo = OFFER_STATUS_LABELS[status] || { label: status, color: 'gray' };
    const colorClasses = {
      gray: 'bg-gray-100 text-gray-700',
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700',
      red: 'bg-red-100 text-red-700',
      orange: 'bg-orange-100 text-orange-700'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses[statusInfo.color]}`}>
        {statusInfo.label}
      </span>
    );
  };

  const handleNewOffer = () => {
    navigate('/offers/new');
  };

  const handleEditOffer = (offer) => {
    navigate(`/offers/${offer.id}`);
  };

  const handleViewOffer = (offer) => {
    setSelectedOffer(offer);
    setShowPDFPreview(true);
  };

  const handleDuplicateOffer = async (offer) => {
    const result = await duplicateOffer(offer.id);
    if (result.success) {
      showNotification('Angebot dupliziert', 'success');
    } else {
      showNotification('Fehler beim Duplizieren', 'error');
    }
    setShowActionsMenu(null);
  };

  const handleDeleteClick = (offer) => {
    setOfferToDelete(offer);
    setShowDeleteModal(true);
    setShowActionsMenu(null);
  };

  const handleDeleteConfirm = async () => {
    if (!offerToDelete) return;

    const result = await deleteOffer(offerToDelete.id);
    if (result.success) {
      showNotification('Angebot gelöscht', 'success');
    } else {
      showNotification('Fehler beim Löschen', 'error');
    }
    setShowDeleteModal(false);
    setOfferToDelete(null);
  };

  const handleStatusChange = async (offer, newStatus) => {
    const result = await updateOfferStatus(offer.id, newStatus);
    if (result.success) {
      showNotification(`Status geändert: ${OFFER_STATUS_LABELS[newStatus].label}`, 'success');
    } else {
      showNotification('Fehler beim Status-Update', 'error');
    }
    setShowActionsMenu(null);
  };

  // Unique customers for filter
  const customersWithOffers = useMemo(() => {
    const customerIds = [...new Set(offers.map(o => o.customerID))];
    return customers.filter(c => customerIds.includes(c.id));
  }, [offers, customers]);

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Angebote</h1>
          <p className="text-sm text-gray-500">
            {filteredOffers.length} von {offers.length} Angeboten
          </p>
        </div>
        <button
          onClick={handleNewOffer}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm font-medium"
        >
          <Plus className="h-4 w-4 mr-2" />
          Neues Angebot
        </button>
      </div>

      {/* Statistik-Karten */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Gesamt</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <FileText className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Offen</p>
              <p className="text-2xl font-bold text-blue-600">
                {(stats.byStatus?.draft || 0) + (stats.byStatus?.sent || 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Angenommen</p>
              <p className="text-2xl font-bold text-green-600">{stats.byStatus?.accepted || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Angenommener Wert</p>
              <p className="text-xl font-bold text-green-600">{formatPrice(stats.acceptedValue)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Euro className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Suche */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Suche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Angebotsnummer, Kunde oder Projekt suchen..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alle Status</option>
              {Object.entries(OFFER_STATUS_LABELS).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>

          {/* Kunden Filter */}
          <div className="w-full md:w-48">
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alle Kunden</option>
              {customersWithOffers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.firmennameKundenname || customer.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Angebotsliste */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
        {/* Titel-Zeile mit Settings-Button */}
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Angebotsliste</h2>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <Settings className="h-5 w-5" />
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Angebote gefunden</h3>
            <p className="text-gray-500 mb-4">
              {offers.length === 0
                ? 'Erstellen Sie Ihr erstes Angebot'
                : 'Passen Sie Ihre Filterkriterien an'}
            </p>
            {offers.length === 0 && (
              <button
                onClick={handleNewOffer}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Erstes Angebot erstellen
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <div className="flex items-center gap-1">
                        Angebot
                        <ChevronDown className="h-3 w-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <div className="flex items-center gap-1">
                        Kunde
                        <ChevronDown className="h-3 w-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Projekt
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Betrag
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      <div className="flex items-center justify-center gap-1">
                        Status
                        <ChevronDown className="h-3 w-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Datum
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Aktionen
                    </th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOffers.map((offer) => (
                  <tr
                    key={offer.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewOffer(offer)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{offer.offerNumber}</span>
                      <span className="text-xs text-gray-500 block">v{offer.version || 1}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        {getCustomerName(offer.customerID)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {getProjectName(offer.projectID)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatPrice(offer.totals?.grossTotal)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(offer.status)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {formatDate(offer.createdAt?.toDate?.() || offer.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block">
                        <button
                          onClick={() => setShowActionsMenu(showActionsMenu === offer.id ? null : offer.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>

                        {/* Actions Dropdown - nur Bearbeiten und Löschen */}
                        {showActionsMenu === offer.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setShowActionsMenu(null)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    handleEditOffer(offer);
                                    setShowActionsMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                  <Edit className="h-4 w-4 mr-3" />
                                  Bearbeiten
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(offer)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center"
                                >
                                  <Trash2 className="h-4 w-4 mr-3" />
                                  Löschen
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <BaseModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setOfferToDelete(null);
        }}
        title="Angebot löschen"
        size="sm"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Möchten Sie das Angebot <strong>{offerToDelete?.offerNumber}</strong> wirklich löschen?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setOfferToDelete(null);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Abbrechen
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Löschen
            </button>
          </div>
        </div>
      </BaseModal>

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
