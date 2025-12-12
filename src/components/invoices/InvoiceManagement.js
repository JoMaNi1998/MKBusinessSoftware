import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  FileText,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  MoreVertical,
  ChevronDown,
  Users,
  Euro,
  AlertCircle,
  XCircle,
  Settings
} from 'lucide-react';
import { useInvoices, INVOICE_STATUS, INVOICE_STATUS_LABELS } from '../../context/InvoiceContext';
import { useCustomers } from '../../context/CustomerContext';
import { useProjects } from '../../context/ProjectContext';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import BaseModal from '../BaseModal';
import InvoicePDFPreview from './InvoicePDFPreview';

// Spalten-Konfiguration
const availableColumns = [
  { key: 'rechnung', label: 'Rechnung', required: true },
  { key: 'kunde', label: 'Kunde', required: false },
  { key: 'angebot', label: 'Angebot', required: false },
  { key: 'betrag', label: 'Betrag', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'faellig', label: 'Fällig am', required: false },
  { key: 'aktionen', label: 'Aktionen', required: true }
];

const InvoiceManagement = () => {
  const navigate = useNavigate();
  const { invoices, loading, deleteInvoice, updateInvoiceStatus, getStatistics } = useInvoices();
  const { customers } = useCustomers();
  const { projects } = useProjects();
  const { showNotification } = useNotification();
  const { user } = useAuth();

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');

  // Column Settings State
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    rechnung: true,
    kunde: true,
    angebot: true,
    betrag: true,
    status: true,
    faellig: true,
    aktionen: true
  });
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [activeColumnFilter, setActiveColumnFilter] = useState(null);
  const columnSettingsRef = useRef(null);
  const filterRef = useRef(null);

  // Modal State
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [showActionsMenu, setShowActionsMenu] = useState(null);

  // Unique statuses for filter
  const uniqueStatuses = useMemo(() => {
    return Object.entries(INVOICE_STATUS_LABELS).map(([key, value]) => ({
      value: key,
      label: value.label
    }));
  }, []);

  // Firebase Preferences laden
  const loadColumnPreferences = async () => {
    if (!user?.uid) {
      setLoadingPreferences(false);
      return;
    }
    try {
      const prefsDoc = await getDoc(doc(db, 'user-preferences', user.uid));
      if (prefsDoc.exists()) {
        const prefs = prefsDoc.data();
        if (prefs.invoiceColumns) {
          setVisibleColumns(prev => ({ ...prev, ...prefs.invoiceColumns }));
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Spalteneinstellungen:', error);
    } finally {
      setLoadingPreferences(false);
    }
  };

  // Firebase Preferences speichern
  const saveColumnPreferences = async (newColumns) => {
    if (!user?.uid) return;
    try {
      const prefsRef = doc(db, 'user-preferences', user.uid);
      const prefsDoc = await getDoc(prefsRef);
      const existingPrefs = prefsDoc.exists() ? prefsDoc.data() : {};
      await setDoc(prefsRef, {
        ...existingPrefs,
        invoiceColumns: newColumns
      });
    } catch (error) {
      console.error('Fehler beim Speichern der Spalteneinstellungen:', error);
    }
  };

  // Spalte ein-/ausblenden
  const toggleColumn = (columnKey) => {
    const column = availableColumns.find(c => c.key === columnKey);
    if (column?.required) return;

    const newColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey]
    };
    setVisibleColumns(newColumns);
    saveColumnPreferences(newColumns);
  };

  // Filter-Änderung für Spaltenfilter
  const handleColumnFilterChange = (filterType, value) => {
    if (filterType === 'status') {
      setStatusFilter(value);
    }
    setActiveColumnFilter(null);
  };

  // Click-outside Handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnSettingsRef.current && !columnSettingsRef.current.contains(event.target)) {
        setShowColumnSettings(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setActiveColumnFilter(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Spalteneinstellungen beim Mount laden
  useEffect(() => {
    loadColumnPreferences();
  }, [user?.uid]);

  // Statistiken
  const stats = useMemo(() => getStatistics(), [getStatistics, invoices]);

  // Gefilterte Rechnungen
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      // Suche
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const customer = customers.find(c => c.id === invoice.customerID);
        const project = projects.find(p => p.id === invoice.projectID);

        const matchesSearch =
          invoice.invoiceNumber?.toLowerCase().includes(term) ||
          invoice.offerNumber?.toLowerCase().includes(term) ||
          customer?.firmennameKundenname?.toLowerCase().includes(term) ||
          customer?.name?.toLowerCase().includes(term) ||
          project?.projektname?.toLowerCase().includes(term);

        if (!matchesSearch) return false;
      }

      // Status Filter
      if (statusFilter !== 'all' && invoice.status !== statusFilter) return false;

      // Kunden Filter
      if (customerFilter !== 'all' && invoice.customerID !== customerFilter) return false;

      return true;
    });
  }, [invoices, searchTerm, statusFilter, customerFilter, customers, projects]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString?.toDate?.() || new Date(dateString);
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateString;
    }
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
    const statusInfo = INVOICE_STATUS_LABELS[status] || { label: status, color: 'gray' };
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

  const handleNewInvoice = () => {
    navigate('/invoices/new');
  };

  const handleEditInvoice = (invoice) => {
    navigate(`/invoices/${invoice.id}`);
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPDFPreview(true);
  };

  const handleDeleteClick = (invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
    setShowActionsMenu(null);
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;

    const result = await deleteInvoice(invoiceToDelete.id);
    if (result.success) {
      showNotification('Rechnung gelöscht', 'success');
    } else {
      showNotification('Fehler beim Löschen', 'error');
    }
    setShowDeleteModal(false);
    setInvoiceToDelete(null);
  };

  const handleStatusChange = async (invoice, newStatus) => {
    const result = await updateInvoiceStatus(invoice.id, newStatus);
    if (result.success) {
      showNotification(`Status geändert: ${INVOICE_STATUS_LABELS[newStatus].label}`, 'success');
    } else {
      showNotification('Fehler beim Status-Update', 'error');
    }
    setShowActionsMenu(null);
  };

  // Unique customers for filter
  const customersWithInvoices = useMemo(() => {
    const customerIds = [...new Set(invoices.map(i => i.customerID))];
    return customers.filter(c => customerIds.includes(c.id));
  }, [invoices, customers]);

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
        <div className="pl-12 sm:pl-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Rechnungen</h1>
          <p className="text-sm text-gray-500 hidden sm:block">
            {filteredInvoices.length} von {invoices.length} Rechnungen
          </p>
        </div>
        <button
          onClick={handleNewInvoice}
          className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Neue Rechnung</span>
          <span className="sm:hidden">Neu</span>
        </button>
      </div>

      {/* Statistik-Karten - Kompakt auf Mobile */}
      <div className="grid grid-cols-4 md:grid-cols-4 gap-1.5 md:gap-4 flex-shrink-0">
        <div className="bg-white rounded-lg border border-gray-200 p-2 md:p-4">
          <p className="text-[10px] md:text-sm text-gray-500 truncate">Gesamt</p>
          <p className="text-base md:text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2 md:p-4">
          <p className="text-[10px] md:text-sm text-gray-500 truncate">Offen</p>
          <p className="text-base md:text-2xl font-bold text-blue-600">
            {(stats.byStatus?.sent || 0) + (stats.byStatus?.overdue || 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2 md:p-4">
          <p className="text-[10px] md:text-sm text-gray-500 truncate">Bezahlt</p>
          <p className="text-base md:text-2xl font-bold text-green-600">{stats.byStatus?.paid || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2 md:p-4">
          <p className="text-[10px] md:text-sm text-gray-500 truncate">Offen €</p>
          <p className="text-base md:text-xl font-bold text-orange-600">{formatPrice(stats.openValue)}</p>
        </div>
      </div>

      {/* Filter & Suche */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex-shrink-0">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechnungsnummer, Kunde oder Angebot suchen..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Rechnungsliste */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Rechnungsliste</h2>
          <div className="relative" ref={columnSettingsRef}>
            <button
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Spalteneinstellungen"
            >
              <Settings className="h-5 w-5" />
            </button>
            {showColumnSettings && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
                <div className="p-3 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900">Sichtbare Spalten</h4>
                </div>
                <div className="p-2 max-h-64 overflow-auto">
                  {availableColumns.map((column) => (
                    <label
                      key={column.key}
                      className={`flex items-center px-2 py-1.5 rounded hover:bg-gray-50 ${column.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[column.key]}
                        onChange={() => toggleColumn(column.key)}
                        disabled={column.required}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{column.label}</span>
                      {column.required && (
                        <span className="ml-auto text-xs text-gray-400">Pflicht</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Rechnungen gefunden</h3>
            <p className="text-gray-500 mb-4">
              {invoices.length === 0
                ? 'Erstellen Sie Ihre erste Rechnung'
                : 'Passen Sie Ihre Filterkriterien an'}
            </p>
            {invoices.length === 0 && (
              <button
                onClick={handleNewInvoice}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Erste Rechnung erstellen
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            {/* Mobile: Card-Liste */}
            <div className="md:hidden h-full overflow-auto p-4 space-y-3">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm active:bg-gray-50"
                  onClick={() => handleViewInvoice(invoice)}
                >
                  {/* Header: Rechnung + Status */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                      {visibleColumns.kunde && (
                        <p className="text-sm text-gray-500">{getCustomerName(invoice.customerID)}</p>
                      )}
                    </div>
                    {visibleColumns.status && getStatusBadge(invoice.status)}
                  </div>

                  {/* Betrag + Datum */}
                  {visibleColumns.betrag && (
                    <div className="mt-3 flex justify-between items-center text-sm">
                      <span className="text-gray-500">
                        {formatDate(invoice.invoiceDate)}
                      </span>
                      <span className="font-bold text-gray-900">
                        {formatPrice(invoice.totals?.grossTotal)}
                      </span>
                    </div>
                  )}

                  {/* Angebot */}
                  {visibleColumns.angebot && invoice.offerNumber && (
                    <div className="mt-2 text-xs text-gray-500">
                      Angebot: {invoice.offerNumber}
                    </div>
                  )}

                  {/* Fällig */}
                  {visibleColumns.faellig && invoice.dueDate && (
                    <div className="mt-1 text-xs text-gray-400">
                      Fällig: {formatDate(invoice.dueDate)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: Tabelle */}
            <div className="hidden md:block h-full overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {visibleColumns.rechnung && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Rechnung
                      </th>
                    )}
                    {visibleColumns.kunde && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Kunde
                      </th>
                    )}
                    {visibleColumns.angebot && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Angebot
                      </th>
                    )}
                    {visibleColumns.betrag && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Betrag
                      </th>
                    )}
                    {visibleColumns.status && (
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase relative">
                        <div className="flex items-center justify-center gap-1">
                          <span>Status</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveColumnFilter(activeColumnFilter === 'status' ? null : 'status');
                            }}
                            className={`p-0.5 rounded hover:bg-gray-200 ${statusFilter !== 'all' ? 'text-blue-600' : 'text-gray-400'}`}
                          >
                            <Filter className="h-3 w-3" />
                          </button>
                        </div>
                        {activeColumnFilter === 'status' && (
                          <div ref={filterRef} className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
                            <div className="p-2">
                              <button
                                onClick={() => handleColumnFilterChange('status', 'all')}
                                className={`w-full text-left px-3 py-1.5 text-sm rounded ${statusFilter === 'all' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                              >
                                Alle Status
                              </button>
                              {uniqueStatuses.map((status) => (
                                <button
                                  key={status.value}
                                  onClick={() => handleColumnFilterChange('status', status.value)}
                                  className={`w-full text-left px-3 py-1.5 text-sm rounded ${statusFilter === status.value ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                                >
                                  {status.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </th>
                    )}
                    {visibleColumns.faellig && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fällig am
                      </th>
                    )}
                    {visibleColumns.aktionen && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Aktionen
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewInvoice(invoice)}
                    >
                      {visibleColumns.rechnung && (
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                          <span className="text-xs text-gray-500 block">{formatDate(invoice.invoiceDate)}</span>
                        </td>
                      )}
                      {visibleColumns.kunde && (
                        <td className="px-4 py-3 text-gray-600">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-gray-400" />
                            {getCustomerName(invoice.customerID)}
                          </div>
                        </td>
                      )}
                      {visibleColumns.angebot && (
                        <td className="px-4 py-3 text-gray-600 text-sm">
                          {invoice.offerNumber || '-'}
                        </td>
                      )}
                      {visibleColumns.betrag && (
                        <td className="px-4 py-3 text-right font-medium">
                          {formatPrice(invoice.totals?.grossTotal)}
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className="px-4 py-3 text-center">
                          {getStatusBadge(invoice.status)}
                        </td>
                      )}
                      {visibleColumns.faellig && (
                        <td className="px-4 py-3 text-gray-600 text-sm">
                          {formatDate(invoice.dueDate)}
                        </td>
                      )}
                      {visibleColumns.aktionen && (
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <button
                            onClick={() => setShowActionsMenu(showActionsMenu === invoice.id ? null : invoice.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>

                          {showActionsMenu === invoice.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowActionsMenu(null)}
                              />
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                                <div className="py-1">
                                  {!invoice.offerID && (
                                    <button
                                      onClick={() => {
                                        handleEditInvoice(invoice);
                                        setShowActionsMenu(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                      <Edit className="h-4 w-4 mr-3" />
                                      Bearbeiten
                                    </button>
                                  )}
                                  {invoice.status === INVOICE_STATUS.SENT && (
                                    <button
                                      onClick={() => handleStatusChange(invoice, INVOICE_STATUS.PAID)}
                                      className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-gray-100 flex items-center"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-3" />
                                      Als bezahlt markieren
                                    </button>
                                  )}
                                  {invoice.status === INVOICE_STATUS.DRAFT && (
                                    <button
                                      onClick={() => handleStatusChange(invoice, INVOICE_STATUS.SENT)}
                                      className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-gray-100 flex items-center"
                                    >
                                      <FileText className="h-4 w-4 mr-3" />
                                      Als gesendet markieren
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteClick(invoice)}
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
                      )}
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
          setInvoiceToDelete(null);
        }}
        title="Rechnung löschen"
        size="sm"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Möchten Sie die Rechnung <strong>{invoiceToDelete?.invoiceNumber}</strong> wirklich löschen?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setInvoiceToDelete(null);
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
      {showPDFPreview && selectedInvoice && (
        <InvoicePDFPreview
          invoice={selectedInvoice}
          isOpen={showPDFPreview}
          onClose={() => {
            setShowPDFPreview(false);
            setSelectedInvoice(null);
          }}
          onEdit={(invoice) => {
            setShowPDFPreview(false);
            setSelectedInvoice(null);
            handleEditInvoice(invoice);
          }}
        />
      )}
    </div>
  );
};

export default InvoiceManagement;
