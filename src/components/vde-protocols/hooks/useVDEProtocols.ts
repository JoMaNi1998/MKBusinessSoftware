import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNotification } from '../../../context/NotificationContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { FirebaseService } from '../../../services/firebaseService';
import { NotificationType } from '../../../types/enums';
import {
  VDEProtocol,
  SortConfig,
  ColumnFilters,
  VisibleColumns,
  ColumnConfig,
  ProtocolStats,
  UseVDEProtocolsReturn,
} from '../VDEProtocolModal/types';

interface UserPreference {
  id: string;
  type: string;
  columns?: VisibleColumns;
  updatedAt?: Date;
  createdAt?: Date;
}

const useVDEProtocols = (): UseVDEProtocolsReturn => {
  const { showNotification } = useNotification();
  const { confirmDelete } = useConfirm();

  // State
  const [protocols, setProtocols] = useState<VDEProtocol[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    status: 'alle',
    customer: 'alle',
  });
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({
    protocolNumber: true,
    customerName: true,
    projectName: true,
    power: true,
    moduleCount: true,
    stringCount: true,
    inverterModel: true,
    createdDate: true,
  });
  const [loadingPreferences, setLoadingPreferences] = useState<boolean>(true);

  // Available columns configuration
  const availableColumns: ColumnConfig[] = [
    { key: 'protocolNumber', label: 'Protokoll-Nr.', required: true },
    { key: 'customerName', label: 'Kunde', required: false },
    { key: 'projectName', label: 'Projekt', required: false },
    { key: 'power', label: 'Leistung (kWp)', required: false },
    { key: 'moduleCount', label: 'Module', required: false },
    { key: 'stringCount', label: 'Strings', required: false },
    { key: 'inverterModel', label: 'Wechselrichter', required: false },
    { key: 'createdDate', label: 'Erstellt', required: false },
  ];

  // Load protocols
  const loadProtocols = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const protocolsData = await FirebaseService.getDocuments('vde-protocols');
      setProtocols((protocolsData as VDEProtocol[]) || []);
    } catch (error) {
      console.error('Fehler beim Laden der VDE-Protokolle:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load column preferences
  const loadColumnPreferences = useCallback(async (): Promise<void> => {
    try {
      setLoadingPreferences(true);
      const preferences = (await FirebaseService.getDocuments(
        'user-preferences'
      )) as UserPreference[];
      const columnPrefs = preferences.find((pref) => pref.type === 'vdeProtocolColumns');

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
  const saveColumnPreferences = useCallback(
    async (columns: VisibleColumns): Promise<void> => {
      try {
        const preferences = (await FirebaseService.getDocuments(
          'user-preferences'
        )) as UserPreference[];
        const existingPref = preferences.find((pref) => pref.type === 'vdeProtocolColumns');

        const prefData = {
          type: 'vdeProtocolColumns',
          columns: columns,
          updatedAt: new Date(),
        };

        if (existingPref) {
          await FirebaseService.updateDocument('user-preferences', existingPref.id, prefData);
        } else {
          await FirebaseService.addDocument('user-preferences', {
            ...prefData,
            createdAt: new Date(),
          });
        }
      } catch (error) {
        console.error('Fehler beim Speichern der Spalteneinstellungen:', error);
        showNotification('Fehler beim Speichern der Spalteneinstellungen', NotificationType.ERROR);
      }
    },
    [showNotification]
  );

  // Toggle column visibility
  const toggleColumnVisibility = useCallback(
    async (column: keyof VisibleColumns): Promise<void> => {
      const newVisibleColumns: VisibleColumns = {
        ...visibleColumns,
        [column]: !visibleColumns[column],
      };
      setVisibleColumns(newVisibleColumns);
      await saveColumnPreferences(newVisibleColumns);
    },
    [visibleColumns, saveColumnPreferences]
  );

  // Handle sort
  const handleSort = useCallback(
    (key: string): void => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
      }
      setSortConfig({ key, direction });
    },
    [sortConfig]
  );

  // Handle column filter change
  const handleColumnFilterChange = useCallback((column: string, value: string): void => {
    setColumnFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
  }, []);

  // Delete protocol
  const handleDeleteProtocol = useCallback(
    async (protocolId: string): Promise<void> => {
      const protocol = protocols.find((p) => p.id === protocolId);
      const protocolName = protocol?.protocolNumber || 'dieses Protokoll';

      const confirmed = await confirmDelete(protocolName, 'VDE-Protokoll');
      if (confirmed) {
        try {
          await FirebaseService.deleteDocument('vde-protocols', protocolId);
          await loadProtocols();
          showNotification('Protokoll erfolgreich gelöscht', NotificationType.SUCCESS);
        } catch (error) {
          console.error('Fehler beim Löschen des Protokolls:', error);
          showNotification('Fehler beim Löschen des Protokolls', NotificationType.ERROR);
        }
      }
    },
    [protocols, confirmDelete, loadProtocols, showNotification]
  );

  // Inline editing
  const saveEdit = useCallback(
    async (protocolId: string, field: string, value: unknown): Promise<void> => {
      try {
        await FirebaseService.updateDocument('vde-protocols', protocolId, {
          [field]: value,
        });

        setProtocols((prev) =>
          prev.map((p) => (p.id === protocolId ? { ...p, [field]: value } : p))
        );

        showNotification('Protokoll aktualisiert', NotificationType.SUCCESS);
      } catch (error) {
        console.error('Fehler beim Aktualisieren:', error);
        showNotification('Fehler beim Aktualisieren', NotificationType.ERROR);
      }
    },
    [showNotification]
  );

  // Derived data
  const uniqueStatuses = useMemo<string[]>(
    () => ['alle', ...new Set(protocols.map((p) => p.status).filter(Boolean))],
    [protocols]
  );

  const uniqueCustomers = useMemo<string[]>(
    () => ['alle', ...new Set(protocols.map((p) => p.customerName).filter(Boolean))],
    [protocols]
  );

  const filteredProtocols = useMemo<VDEProtocol[]>(() => {
    return protocols.filter((protocol) => {
      const matchesSearch =
        searchTerm === '' ||
        protocol.protocolNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        protocol.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        protocol.customerID?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        columnFilters.status === 'alle' || protocol.status === columnFilters.status;
      const matchesCustomer =
        columnFilters.customer === 'alle' || protocol.customerName === columnFilters.customer;

      return matchesSearch && matchesStatus && matchesCustomer;
    });
  }, [protocols, searchTerm, columnFilters]);

  const sortedProtocols = useMemo<VDEProtocol[]>(() => {
    return [...filteredProtocols].sort((a, b) => {
      if (!sortConfig.key) return 0;

      let aValue: unknown = a[sortConfig.key as keyof VDEProtocol];
      let bValue: unknown = b[sortConfig.key as keyof VDEProtocol];

      if (
        sortConfig.key === 'power' ||
        sortConfig.key === 'moduleCount' ||
        sortConfig.key === 'stringCount'
      ) {
        aValue = parseFloat(String(aValue)) || 0;
        bValue = parseFloat(String(bValue)) || 0;
      }

      if ((aValue as number | string) < (bValue as number | string))
        return sortConfig.direction === 'asc' ? -1 : 1;
      if ((aValue as number | string) > (bValue as number | string))
        return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredProtocols, sortConfig]);

  // Stats
  const stats = useMemo<ProtocolStats>(
    () => ({
      total: protocols.length,
      created: protocols.filter((p) => p.status === 'Erstellt').length,
      checked: protocols.filter((p) => p.status === 'Geprüft').length,
      completed: protocols.filter((p) => p.status === 'Abgeschlossen').length,
    }),
    [protocols]
  );

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
