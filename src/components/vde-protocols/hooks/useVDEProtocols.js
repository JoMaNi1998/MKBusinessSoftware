import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNotification } from '../../../context/NotificationContext';
import { FirebaseService } from '../../../services/firebaseService';

const useVDEProtocols = () => {
  const { showNotification } = useNotification();

  // State
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [columnFilters, setColumnFilters] = useState({
    status: 'alle',
    customer: 'alle'
  });
  const [visibleColumns, setVisibleColumns] = useState({
    protocolNumber: true,
    customerName: true,
    projectName: true,
    power: true,
    moduleCount: true,
    stringCount: true,
    inverterModel: true,
    createdDate: true
  });
  const [loadingPreferences, setLoadingPreferences] = useState(true);

  // Available columns configuration
  const availableColumns = [
    { key: 'protocolNumber', label: 'Protokoll-Nr.', required: true },
    { key: 'customerName', label: 'Kunde', required: false },
    { key: 'projectName', label: 'Projekt', required: false },
    { key: 'power', label: 'Leistung (kWp)', required: false },
    { key: 'moduleCount', label: 'Module', required: false },
    { key: 'stringCount', label: 'Strings', required: false },
    { key: 'inverterModel', label: 'Wechselrichter', required: false },
    { key: 'createdDate', label: 'Erstellt', required: false }
  ];

  // Load protocols
  const loadProtocols = useCallback(async () => {
    try {
      setLoading(true);
      const protocolsData = await FirebaseService.getDocuments('vde-protocols');
      setProtocols(protocolsData || []);
    } catch (error) {
      console.error('Fehler beim Laden der VDE-Protokolle:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load column preferences
  const loadColumnPreferences = useCallback(async () => {
    try {
      setLoadingPreferences(true);
      const preferences = await FirebaseService.getDocuments('user-preferences');
      const columnPrefs = preferences.find(pref => pref.type === 'vdeProtocolColumns');

      if (columnPrefs && columnPrefs.columns) {
        setVisibleColumns(columnPrefs.columns);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Spalteneinstellungen:', error);
    } finally {
      setLoadingPreferences(false);
    }
  }, []);

  // Save column preferences
  const saveColumnPreferences = useCallback(async (columns) => {
    try {
      const preferences = await FirebaseService.getDocuments('user-preferences');
      const existingPref = preferences.find(pref => pref.type === 'vdeProtocolColumns');

      const prefData = {
        type: 'vdeProtocolColumns',
        columns: columns,
        updatedAt: new Date()
      };

      if (existingPref) {
        await FirebaseService.updateDocument('user-preferences', existingPref.id, prefData);
      } else {
        await FirebaseService.addDocument('user-preferences', {
          ...prefData,
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Spalteneinstellungen:', error);
      showNotification('Fehler beim Speichern der Spalteneinstellungen', 'error');
    }
  }, [showNotification]);

  // Toggle column visibility
  const toggleColumnVisibility = useCallback(async (column) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [column]: !visibleColumns[column]
    };
    setVisibleColumns(newVisibleColumns);
    await saveColumnPreferences(newVisibleColumns);
  }, [visibleColumns, saveColumnPreferences]);

  // Handle sort
  const handleSort = useCallback((key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  // Handle column filter change
  const handleColumnFilterChange = useCallback((column, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  }, []);

  // Delete protocol
  const handleDeleteProtocol = useCallback(async (protocolId) => {
    if (window.confirm('Protokoll wirklich löschen?')) {
      try {
        await FirebaseService.deleteDocument('vde-protocols', protocolId);
        await loadProtocols();
        showNotification('Protokoll erfolgreich gelöscht', 'success');
      } catch (error) {
        console.error('Fehler beim Löschen des Protokolls:', error);
        showNotification('Fehler beim Löschen des Protokolls', 'error');
      }
    }
  }, [loadProtocols, showNotification]);

  // Inline editing
  const saveEdit = useCallback(async (protocolId, field, value) => {
    try {
      await FirebaseService.updateDocument('vde-protocols', protocolId, {
        [field]: value
      });

      setProtocols(prev => prev.map(p =>
        p.id === protocolId ? { ...p, [field]: value } : p
      ));

      showNotification('Protokoll aktualisiert', 'success');
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
      showNotification('Fehler beim Aktualisieren', 'error');
    }
  }, [showNotification]);

  // Derived data
  const uniqueStatuses = useMemo(() =>
    ['alle', ...new Set(protocols.map(p => p.status).filter(Boolean))],
    [protocols]
  );

  const uniqueCustomers = useMemo(() =>
    ['alle', ...new Set(protocols.map(p => p.customerName).filter(Boolean))],
    [protocols]
  );

  const filteredProtocols = useMemo(() => {
    return protocols.filter(protocol => {
      const matchesSearch = searchTerm === '' ||
        protocol.protocolNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        protocol.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        protocol.customerID?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = columnFilters.status === 'alle' || protocol.status === columnFilters.status;
      const matchesCustomer = columnFilters.customer === 'alle' || protocol.customerName === columnFilters.customer;

      return matchesSearch && matchesStatus && matchesCustomer;
    });
  }, [protocols, searchTerm, columnFilters]);

  const sortedProtocols = useMemo(() => {
    return [...filteredProtocols].sort((a, b) => {
      if (!sortConfig.key) return 0;

      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'power' || sortConfig.key === 'moduleCount' || sortConfig.key === 'stringCount') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredProtocols, sortConfig]);

  // Stats
  const stats = useMemo(() => ({
    total: protocols.length,
    created: protocols.filter(p => p.status === 'Erstellt').length,
    checked: protocols.filter(p => p.status === 'Geprüft').length,
    completed: protocols.filter(p => p.status === 'Abgeschlossen').length,
  }), [protocols]);

  // Load data on mount
  useEffect(() => {
    loadProtocols();
    loadColumnPreferences();
  }, [loadProtocols, loadColumnPreferences]);

  return {
    // State
    protocols,
    loading,
    searchTerm,
    setSearchTerm,
    sortConfig,
    columnFilters,
    visibleColumns,
    loadingPreferences,

    // Configuration
    availableColumns,

    // Derived data
    uniqueStatuses,
    uniqueCustomers,
    filteredProtocols,
    sortedProtocols,
    stats,

    // Actions
    loadProtocols,
    handleSort,
    handleColumnFilterChange,
    toggleColumnVisibility,
    handleDeleteProtocol,
    saveEdit,
  };
};

export default useVDEProtocols;
