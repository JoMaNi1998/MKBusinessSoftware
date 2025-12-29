/**
 * useInvoiceManagement Hook
 *
 * Zentrale State- und Logik-Verwaltung für die Invoice-Verwaltung.
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoice, INVOICE_STATUS, INVOICE_STATUS_LABELS } from '@context/InvoiceContext';
import { useCustomers } from '@context/CustomerContext';
import { useProjects } from '@context/ProjectContext';
import { useNotification } from '@context/NotificationContext';
import { useAuth } from '@context/AuthContext';
import { NotificationType, InvoiceStatus } from '@app-types';
import type { Customer, Project } from '@app-types';
import type {
  InvoiceRecord,
  InvoiceVisibleColumns,
  InvoiceStatistics,
  InvoiceStatusOption,
  UseInvoiceManagementReturn
} from '@app-types/components/invoice.types';
import {
  INVOICE_AVAILABLE_COLUMNS,
  DEFAULT_INVOICE_COLUMNS,
  toggleInvoiceColumn
} from '@utils/invoiceHelpers';
import {
  loadInvoiceColumnPreferences,
  saveInvoiceColumnPreferences
} from '@services/InvoiceService';

export const useInvoiceManagement = (): UseInvoiceManagementReturn => {
  const navigate = useNavigate();
  const { invoices, loading, deleteInvoice, updateInvoiceStatus, getStatistics } = useInvoice();
  const { customers } = useCustomers();
  const { projects } = useProjects();
  const { showNotification } = useNotification();
  const { user } = useAuth();

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');

  // Column Settings State
  const [showColumnSettings, setShowColumnSettings] = useState<boolean>(false);
  const [visibleColumns, setVisibleColumns] = useState<InvoiceVisibleColumns>(DEFAULT_INVOICE_COLUMNS);
  const [_loadingPreferences, setLoadingPreferences] = useState<boolean>(true);
  const [activeColumnFilter, setActiveColumnFilter] = useState<string | null>(null);
  const columnSettingsRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showPDFPreview, setShowPDFPreview] = useState<boolean>(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<InvoiceRecord | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);

  // Unique statuses for filter
  const uniqueStatuses = useMemo((): InvoiceStatusOption[] => {
    return Object.entries(INVOICE_STATUS_LABELS).map(([key, value]) => ({
      value: key,
      label: value.label
    }));
  }, []);

  // Spalteneinstellungen beim Mount laden
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await loadInvoiceColumnPreferences(user?.uid);
        setVisibleColumns(prefs);
      } catch (error) {
        console.error('Fehler beim Laden der Spalteneinstellungen:', error);
      } finally {
        setLoadingPreferences(false);
      }
    };

    loadPreferences();
  }, [user?.uid]);

  // Spalte ein-/ausblenden
  const toggleColumn = useCallback((columnKey: string) => {
    const column = INVOICE_AVAILABLE_COLUMNS.find(c => c.key === columnKey);
    if (column?.required) return;

    const newColumns = toggleInvoiceColumn(visibleColumns, columnKey);
    setVisibleColumns(newColumns);
    saveInvoiceColumnPreferences(user?.uid, newColumns);
  }, [visibleColumns, user?.uid]);

  // Filter-Änderung für Spaltenfilter
  const handleColumnFilterChange = useCallback((filterType: string, value: string) => {
    if (filterType === 'status') {
      setStatusFilter(value);
    }
    setActiveColumnFilter(null);
  }, []);

  // Click-outside Handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnSettingsRef.current && !columnSettingsRef.current.contains(event.target as Node)) {
        setShowColumnSettings(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setActiveColumnFilter(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Statistiken
  const stats = useMemo((): InvoiceStatistics => getStatistics() as InvoiceStatistics, [getStatistics, invoices]);

  // Gefilterte Rechnungen
  const filteredInvoices = useMemo(() => {
    return (invoices as InvoiceRecord[]).filter((invoice: InvoiceRecord) => {
      // Suche
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const customer = customers.find((c: Customer) => c.id === invoice.customerID);
        const project = projects.find((p: Project) => p.id === invoice.projectID);

        const matchesSearch =
          invoice.invoiceNumber?.toLowerCase().includes(term) ||
          invoice.offerNumber?.toLowerCase().includes(term) ||
          customer?.firmennameKundenname?.toLowerCase().includes(term) ||
          (customer as any)?.name?.toLowerCase().includes(term) ||
          project?.name?.toLowerCase().includes(term);

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
  const getCustomerName = useCallback((customerId: string): string => {
    const customer = customers.find((c: Customer) => c.id === customerId);
    return customer?.firmennameKundenname || (customer as any)?.name || '-';
  }, [customers]);

  const getProjectName = useCallback((projectId: string | null | undefined): string => {
    if (!projectId) return '-';
    const project = projects.find((p: Project) => p.id === projectId);
    return project?.name || '-';
  }, [projects]);

  // Handlers
  const handleNewInvoice = useCallback(() => {
    navigate('/invoices/new');
  }, [navigate]);

  const handleEditInvoice = useCallback((invoice: InvoiceRecord) => {
    navigate(`/invoices/${invoice.id}`);
  }, [navigate]);

  const handleViewInvoice = useCallback((invoice: InvoiceRecord) => {
    setSelectedInvoice(invoice);
    setShowPDFPreview(true);
  }, []);

  const handleDeleteClick = useCallback((invoice: InvoiceRecord) => {
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
    setShowActionsMenu(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!invoiceToDelete) return;

    const result = await deleteInvoice(invoiceToDelete.id);
    if (result.success) {
      showNotification('Rechnung gelöscht', NotificationType.SUCCESS);
    } else {
      showNotification('Fehler beim Löschen', NotificationType.ERROR);
    }
    setShowDeleteModal(false);
    setInvoiceToDelete(null);
  }, [invoiceToDelete, deleteInvoice, showNotification]);

  const handleStatusChange = useCallback(async (invoice: InvoiceRecord, newStatus: string) => {
    const result = await updateInvoiceStatus(invoice.id, newStatus as InvoiceStatus);
    if (result.success) {
      showNotification(`Status geändert: ${(INVOICE_STATUS_LABELS as Record<string, { label: string; color: string }>)[newStatus]?.label || newStatus}`, NotificationType.SUCCESS);
    } else {
      showNotification('Fehler beim Status-Update', NotificationType.ERROR);
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
    const customerIds = [...new Set((invoices as InvoiceRecord[]).map((i: InvoiceRecord) => i.customerID))];
    return customers.filter((c: Customer) => customerIds.includes(c.id));
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
