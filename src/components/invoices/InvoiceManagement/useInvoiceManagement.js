import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useInvoices, INVOICE_STATUS, INVOICE_STATUS_LABELS } from '../../../context/InvoiceContext';
import { useCustomers } from '../../../context/CustomerContext';
import { useProjects } from '../../../context/ProjectContext';
import { useNotification } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';

// Spalten-Konfiguration
export const availableColumns = [
  { key: 'rechnung', label: 'Rechnung', required: true },
  { key: 'kunde', label: 'Kunde', required: false },
  { key: 'angebot', label: 'Angebot', required: false },
  { key: 'betrag', label: 'Betrag', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'faellig', label: 'Fällig am', required: false },
  { key: 'aktionen', label: 'Aktionen', required: true }
];

export const useInvoiceManagement = () => {
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
  const loadColumnPreferences = useCallback(async () => {
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
  }, [user?.uid]);

  // Firebase Preferences speichern
  const saveColumnPreferences = useCallback(async (newColumns) => {
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
  }, [user?.uid]);

  // Spalte ein-/ausblenden
  const toggleColumn = useCallback((columnKey) => {
    const column = availableColumns.find(c => c.key === columnKey);
    if (column?.required) return;

    const newColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey]
    };
    setVisibleColumns(newColumns);
    saveColumnPreferences(newColumns);
  }, [visibleColumns, saveColumnPreferences]);

  // Filter-Änderung für Spaltenfilter
  const handleColumnFilterChange = useCallback((filterType, value) => {
    if (filterType === 'status') {
      setStatusFilter(value);
    }
    setActiveColumnFilter(null);
  }, []);

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
  }, [loadColumnPreferences]);

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
  const handleNewInvoice = useCallback(() => {
    navigate('/invoices/new');
  }, [navigate]);

  const handleEditInvoice = useCallback((invoice) => {
    navigate(`/invoices/${invoice.id}`);
  }, [navigate]);

  const handleViewInvoice = useCallback((invoice) => {
    setSelectedInvoice(invoice);
    setShowPDFPreview(true);
  }, []);

  const handleDeleteClick = useCallback((invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
    setShowActionsMenu(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!invoiceToDelete) return;

    const result = await deleteInvoice(invoiceToDelete.id);
    if (result.success) {
      showNotification('Rechnung gelöscht', 'success');
    } else {
      showNotification('Fehler beim Löschen', 'error');
    }
    setShowDeleteModal(false);
    setInvoiceToDelete(null);
  }, [invoiceToDelete, deleteInvoice, showNotification]);

  const handleStatusChange = useCallback(async (invoice, newStatus) => {
    const result = await updateInvoiceStatus(invoice.id, newStatus);
    if (result.success) {
      showNotification(`Status geändert: ${INVOICE_STATUS_LABELS[newStatus].label}`, 'success');
    } else {
      showNotification('Fehler beim Status-Update', 'error');
    }
    setShowActionsMenu(null);
  }, [updateInvoiceStatus, showNotification]);

  const handleClosePDFPreview = useCallback(() => {
    setShowPDFPreview(false);
    setSelectedInvoice(null);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setInvoiceToDelete(null);
  }, []);

  // Unique customers for filter
  const customersWithInvoices = useMemo(() => {
    const customerIds = [...new Set(invoices.map(i => i.customerID))];
    return customers.filter(c => customerIds.includes(c.id));
  }, [invoices, customers]);

  return {
    // Data
    invoices,
    filteredInvoices,
    loading,
    stats,
    customers,
    customersWithInvoices,

    // Filter State
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    customerFilter,
    setCustomerFilter,
    uniqueStatuses,

    // Column Settings
    visibleColumns,
    showColumnSettings,
    setShowColumnSettings,
    toggleColumn,
    columnSettingsRef,
    filterRef,
    activeColumnFilter,
    setActiveColumnFilter,
    handleColumnFilterChange,

    // Modal State
    selectedInvoice,
    showDeleteModal,
    showPDFPreview,
    invoiceToDelete,
    showActionsMenu,
    setShowActionsMenu,

    // Handlers
    handleNewInvoice,
    handleEditInvoice,
    handleViewInvoice,
    handleDeleteClick,
    handleDeleteConfirm,
    handleStatusChange,
    handleClosePDFPreview,
    handleCloseDeleteModal,

    // Helper Functions
    getCustomerName,
    getProjectName,

    // Constants
    INVOICE_STATUS,
    INVOICE_STATUS_LABELS
  };
};

export default useInvoiceManagement;
