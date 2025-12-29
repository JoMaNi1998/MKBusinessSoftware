import React, { useState, useMemo, useEffect, useRef, ChangeEvent, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Sun,
  Edit,
  Trash2,
  Copy,
  MoreVertical,
  Settings,
  Zap,
  Users,
  Package
} from 'lucide-react';
import { useConfigurations, CONFIG_STATUS_LABELS, CONFIG_STATUS } from '@context/ConfiguratorContext';
import { useMaterials } from '@context/MaterialContext';
import { useBookings } from '@context/BookingContext';
import { useCustomers } from '@context/CustomerContext';
import { useProjects } from '@context/ProjectContext';
import { useNotification } from '@context/NotificationContext';
import { useAuth } from '@context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@config/firebase';
import { FirebaseService } from '@services/firebaseService';
import { BaseModal } from '@components/shared';
import ConfigPreview from './ConfigPreview';
import type {
  Customer,
  Project,
  Material
} from '@app-types';
import { NotificationType, BookingType } from '@app-types';
import type {
  Configuration,
  ConfigurationStatus
} from '@app-types/contexts/configurator.types';
import type {
  PVBookingMaterial
} from '@app-types/components/pvConfigurator.types';

// Lokale Types für Configurator Management (spezifisch für diese Ansicht)
interface ColumnConfig {
  key: string;
  label: string;
  required: boolean;
}

interface VisibleColumns {
  config: boolean;
  kunde: boolean;
  projekt: boolean;
  module: boolean;
  kwp: boolean;
  status: boolean;
  datum: boolean;
  aktionen: boolean;
}

interface StatusOption {
  value: string;
  label: string;
}

interface BOMItem {
  materialId?: string;
  name?: string;
  quantity: number;
  unit?: string;
  category?: string;
  isConfigured?: boolean;
  isManual?: boolean;
}

interface InverterConfig {
  type?: string;
  quantity?: number;
  strings?: InverterString[];
}

interface InverterString {
  name?: string;
  modules?: number;
}

interface BookingMaterial {
  materialID: string;
  quantity: number;
  description?: string;
  unit?: string;
  priceAtBooking?: number;
  totalCost?: number;
  isConfigured?: boolean;
  isManual?: boolean;
  category?: string;
  previousStock?: number;
  newStock?: number;
}

// Spalten-Konfiguration für Management-Ansicht
const availableColumns: ColumnConfig[] = [
  { key: 'config', label: 'Konfiguration', required: true },
  { key: 'kunde', label: 'Kunde', required: false },
  { key: 'projekt', label: 'Projekt', required: false },
  { key: 'module', label: 'Module', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'datum', label: 'Datum', required: false },
  { key: 'aktionen', label: 'Aktionen', required: true }
];

interface BookingData {
  id: string;
  customerID: string;
  customerName: string;
  projectID: string;
  projectName: string;
  materials: PVBookingMaterial[];
  type: BookingType;
  referenceType: string;
  referenceId: string;
  configNumber: string;
  timestamp: string;
  createdBy: string;
}

const ConfiguratorManagement: React.FC = () => {
  const navigate = useNavigate();
  const { configurations, loading, deleteConfiguration, duplicateConfiguration, getStatistics, updateConfigurationStatus } = useConfigurations();
  const { customers } = useCustomers();
  const { projects } = useProjects();
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const { materials, updateMaterialStock } = useMaterials();
  const { addBooking } = useBookings();

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Column Settings State
  const [showColumnSettings, setShowColumnSettings] = useState<boolean>(false);
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({
    config: true,
    kunde: true,
    projekt: true,
    module: true,
    kwp: true,
    status: true,
    datum: true,
    aktionen: true
  });
  const [_loadingPreferences, setLoadingPreferences] = useState<boolean>(true);
  const [activeColumnFilter, setActiveColumnFilter] = useState<string | null>(null);
  const columnSettingsRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [configToDelete, setConfigToDelete] = useState<Configuration | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [configToBook, setConfigToBook] = useState<Configuration | null>(null);
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [selectedConfig, setSelectedConfig] = useState<Configuration | null>(null);

  // Unique statuses for filter
  const uniqueStatuses = useMemo((): StatusOption[] => {
    return Object.entries(CONFIG_STATUS_LABELS).map(([key, value]) => ({
      value: key,
      label: value.label
    }));
  }, []);

  // Firebase Preferences laden
  const loadColumnPreferences = async (): Promise<void> => {
    if (!user?.uid) {
      setLoadingPreferences(false);
      return;
    }
    try {
      const prefsDoc = await getDoc(doc(db, 'user-preferences', user.uid));
      if (prefsDoc.exists()) {
        const prefs = prefsDoc.data();
        if (prefs.configuratorColumns) {
          setVisibleColumns(prev => ({ ...prev, ...prefs.configuratorColumns }));
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Spalteneinstellungen:', error);
    } finally {
      setLoadingPreferences(false);
    }
  };

  // Firebase Preferences speichern
  const saveColumnPreferences = async (newColumns: VisibleColumns): Promise<void> => {
    if (!user?.uid) return;
    try {
      const prefsRef = doc(db, 'user-preferences', user.uid);
      const prefsDoc = await getDoc(prefsRef);
      const existingPrefs = prefsDoc.exists() ? prefsDoc.data() : {};
      await setDoc(prefsRef, {
        ...existingPrefs,
        configuratorColumns: newColumns
      });
    } catch (error) {
      console.error('Fehler beim Speichern der Spalteneinstellungen:', error);
    }
  };

  // Spalte ein-/ausblenden
  const toggleColumn = (columnKey: string): void => {
    const column = availableColumns.find(c => c.key === columnKey);
    if (column?.required) return;

    const newColumns: VisibleColumns = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey as keyof VisibleColumns]
    };
    setVisibleColumns(newColumns);
    saveColumnPreferences(newColumns);
  };

  // Filter-Änderung für Spaltenfilter
  const handleColumnFilterChange = (filterType: string, value: string): void => {
    if (filterType === 'status') {
      setStatusFilter(value);
    }
    setActiveColumnFilter(null);
  };

  // Click-outside Handler
  useEffect(() => {
    const handleClickOutside = (event: Event): void => {
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

  // Spalteneinstellungen beim Mount laden
  useEffect(() => {
    loadColumnPreferences();
  }, [user?.uid]);

  // Statistiken
  const stats = useMemo(() => getStatistics(), [getStatistics, configurations]);

  // Gefilterte Konfigurationen
  const filteredConfigurations = useMemo((): Configuration[] => {
    return configurations.filter((config: Configuration) => {
      // Suche
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const customer = customers.find((c: Customer) => c.id === config.customerID);
        const project = projects.find((p: Project) => p.id === config.projectID);

        const matchesSearch =
          String(config.configNumber || '').toLowerCase().includes(term) ||
          config.name?.toLowerCase().includes(term) ||
          customer?.firmennameKundenname?.toLowerCase().includes(term) ||
          project?.name?.toLowerCase().includes(term);

        if (!matchesSearch) return false;
      }

      // Status Filter
      if (statusFilter !== 'all' && config.status !== statusFilter) return false;

      return true;
    });
  }, [configurations, searchTerm, statusFilter, customers, projects]);

  const formatDate = (dateString: any): string => {
    if (!dateString) return '-';
    const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getCustomerName = (customerId?: string): string => {
    if (!customerId) return '-';
    const customer = customers.find((c: Customer) => c.id === customerId);
    return customer?.firmennameKundenname || '-';
  };

  const getProjectName = (projectId?: string): string => {
    if (!projectId) return '-';
    const project = projects.find((p: Project) => p.id === projectId);
    return project?.name || project?.name || '-';
  };

  const getStatusBadge = (status: ConfigurationStatus | string): React.ReactNode => {
    const statusInfo = CONFIG_STATUS_LABELS[status as ConfigurationStatus] || { label: String(status), color: 'gray' as const };
    const colorClasses: { [key: string]: string } = {
      gray: 'bg-gray-100 text-gray-700',
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses[statusInfo.color]}`}>
        {statusInfo.label}
      </span>
    );
  };

  const handleNewConfig = (): void => {
    navigate('/pv-configurator/new');
  };

  const handleEditConfig = (config: Configuration): void => {
    navigate(`/pv-configurator/${config.id}`);
  };

  const handleViewConfig = (config: Configuration): void => {
    setSelectedConfig(config);
    setShowPreview(true);
  };

  const handleDuplicateConfig = async (config: Configuration): Promise<void> => {
    const result = await duplicateConfiguration(config.id);
    if (result.success) {
      showNotification('Konfiguration dupliziert', NotificationType.SUCCESS);
    } else {
      showNotification('Fehler beim Duplizieren', NotificationType.ERROR);
    }
    setShowActionsMenu(null);
  };

  const handleDeleteClick = (config: Configuration): void => {
    setConfigToDelete(config);
    setShowDeleteModal(true);
    setShowActionsMenu(null);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!configToDelete) return;

    const result = await deleteConfiguration(configToDelete.id);
    if (result.success) {
      showNotification('Konfiguration gelöscht', NotificationType.SUCCESS);
    } else {
      showNotification('Fehler beim Löschen', NotificationType.ERROR);
    }
    setShowDeleteModal(false);
    setConfigToDelete(null);
  };

  // Buchung starten
  const handleBookingClick = (config: Configuration): void => {
    // Prüfen ob bereits gebucht
    if (config.status === CONFIG_STATUS.BOOKED) {
      showNotification('Diese Konfiguration wurde bereits gebucht', NotificationType.WARNING);
      setShowActionsMenu(null);
      return;
    }
    setConfigToBook(config);
    setShowBookingModal(true);
    setShowActionsMenu(null);
  };

  // Buchung durchführen
  const handleBookingConfirm = async (): Promise<void> => {
    if (!configToBook) return;

    setIsBooking(true);
    try {
      // Stückliste aus der Konfiguration extrahieren
      const billOfMaterials = configToBook.billOfMaterials || [];

      if (billOfMaterials.length === 0) {
        showNotification('Keine Materialien zum Buchen vorhanden', NotificationType.WARNING);
        setIsBooking(false);
        return;
      }

      // Kunde und Projekt für die Buchung
      const customer = customers.find((c: Customer) => c.id === configToBook.customerID);
      const project = projects.find((p: Project) => p.id === configToBook.projectID);
      const customerName = customer?.firmennameKundenname || 'Unbekannt';
      const projectName = project?.name || project?.name || `Konfiguration ${configToBook.configNumber}`;

      // Materials-Array für die Buchung aufbauen
      const bookingMaterials: BookingMaterial[] = [];

      // Materialien buchen (Bestand reduzieren)
      for (const item of billOfMaterials) {
        const material = materials.find((m: Material) => m.id === item.materialId || m.materialID === item.materialId);
        if (material) {
          const currentStock = parseFloat(String(material.stock || material.bestand || 0));
          const bookingQty = parseFloat(String(item.quantity || 0));
          const newStock = Math.max(0, currentStock - bookingQty);

          // Bestand aktualisieren (negative Menge = Ausgang)
          await updateMaterialStock(material.id, -bookingQty);

          // Preis aus Material ermitteln
          const priceAtBooking = parseFloat(String(material.price || 0));
          const totalCost = priceAtBooking * bookingQty;

          // Material zur Buchungsliste hinzufügen
          bookingMaterials.push({
            materialID: item.materialId,
            description: material.bezeichnung || material.description || item.name,
            quantity: bookingQty,
            unit: item.unit || 'Stk',
            previousStock: currentStock,
            newStock: newStock,
            priceAtBooking: priceAtBooking,
            totalCost: totalCost,
            isConfigured: item.isConfigured || false,
            isManual: item.isManual || false
          });
        }
      }

      // Eine Buchung mit allen Materialien erstellen (korrektes Format für BookingHistory)
      const bookingId = `booking-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const bookingData: BookingData = {
        id: bookingId,
        customerID: configToBook.customerID || '',
        customerName: customerName,
        projectID: configToBook.projectID || '',
        projectName: projectName,
        materials: bookingMaterials,
        type: BookingType.OUT,
        referenceType: 'pv-configuration',
        referenceId: configToBook.id,
        configNumber: String(configToBook.configNumber),
        timestamp: new Date().toISOString(),
        createdBy: user?.uid || 'system'
      };

      await addBooking(bookingData as any);

      // Status der Konfiguration auf "gebucht" setzen
      await updateConfigurationStatus(configToBook.id, CONFIG_STATUS.BOOKED);

      // PV-Konfiguration fur Projekt speichern (fur VDE-Protokoll)
      if (configToBook.projectID) {
        const config = configToBook.configuration || {};

        // Hilfsfunktion: Beschreibung aus BOM holen
        const getBomDescription = (materialId: string | undefined): string => {
          if (!materialId) return 'Unbekannt';
          const bomEntry = billOfMaterials.find((b: BOMItem) => b.materialId === materialId);
          return bomEntry?.name || 'Unbekannt';
        };

        // Hilfsfunktion: Empfohlene Komponenten aus BOM extrahieren
        const getRecommendedFromBom = (category: string, descriptionKeyword: string): string | null => {
          const entry = billOfMaterials.find((b: BOMItem) =>
            b.category === category &&
            b.name?.toLowerCase().includes(descriptionKeyword.toLowerCase())
          );
          return entry?.materialId || null;
        };

        // Empfohlene Sicherungen aus BOM extrahieren
        // Wechselrichter-Sicherungen (erste konfigurierte Schutzschalter/Kabel)
        const inverterBreaker = billOfMaterials.find((b: BOMItem) => b.category === 'Schutzschalter' && b.isConfigured)?.materialId || null;
        const inverterCable = billOfMaterials.find((b: BOMItem) => b.category === 'Kabel' && b.isConfigured)?.materialId || null;

        // Wallbox-Sicherungen (FI-Schutzschalter für Wallbox)
        const wallboxBreaker = getRecommendedFromBom('Schutzschalter', 'Wallbox') || inverterBreaker;
        const wallboxCable = getRecommendedFromBom('Kabel', 'Wallbox') || inverterCable;
        const wallboxRCD = billOfMaterials.find((b: BOMItem) =>
          (b.category === 'Schutzschalter' && b.name?.toLowerCase().includes('fi')) ||
          (b.category === 'Schutzschalter' && b.name?.toLowerCase().includes('fehlerstrom'))
        )?.materialId || null;

        // Backup/Notstrom-Sicherungen
        const backupBreaker = getRecommendedFromBom('Schutzschalter', 'Notstrom') || inverterBreaker;
        const backupCable = getRecommendedFromBom('Kabel', 'Notstrom') || inverterCable;

        // Modul-Details
        const moduleId = config.module;
        const moduleDescription = getBomDescription(moduleId);

        // Wechselrichter mit Beschreibungen und empfohlenen Sicherungen anreichern
        const enrichedInverters = (config.inverters || [])
          .filter((inv: InverterConfig) => inv.type)
          .map((inv: InverterConfig) => ({
            materialID: inv.type,
            description: getBomDescription(inv.type),
            quantity: inv.quantity || 1,
            recommendedBreaker: inverterBreaker,
            recommendedCable: inverterCable,
            strings: (inv.strings || []).map((s: InverterString) => ({
              stringName: s.name,
              moduleCount: s.modules,
              moduleType: moduleId,
              moduleDescription: moduleDescription
            }))
          }));

        // PV-Kabel aus BOM extrahieren
        const pvCable = billOfMaterials.find((b: BOMItem) => b.category === 'PV-Kabel');
        const pvCables = pvCable ? {
          materialID: pvCable.materialId,
          description: pvCable.name,
          quantity: pvCable.quantity
        } : null;

        // Potentialausgleich HES-UK aus BOM
        const paEntry = billOfMaterials.find((b: BOMItem) => b.category === 'Erdung' || b.category === 'Erdkabel');
        const potentialausgleichHESUK = paEntry ? {
          materialID: paEntry.materialId,
          description: paEntry.name,
          quantity: paEntry.quantity
        } : null;

        // Versionierung: Bestehende Konfigurationen für das Projekt abfragen
        const existingConfigs = await FirebaseService.getDocuments('project-configurations');
        const projectConfigs = existingConfigs.filter((c: any) => c.projectID === configToBook.projectID);
        const nextVersion = projectConfigs.length === 0 ? '1.0' :
          (Math.max(...projectConfigs.map((c: any) => parseFloat(c.pvConfiguration?.configurationVersion || '1.0')), 0) + 1.0).toFixed(1);

        const pvConfigData = {
          id: `pv-config-${configToBook.projectID}-${Date.now()}`,
          projectID: configToBook.projectID,
          customerID: configToBook.customerID,
          pvConfiguration: {
            timestamp: new Date().toISOString(),
            configurationVersion: nextVersion,
            configNumber: configToBook.configNumber,

            // Module
            modules: moduleId ? {
              materialID: moduleId,
              description: moduleDescription,
              totalQuantity: configToBook.totals?.moduleCount || 0
            } : null,

            // Wechselrichter (mit empfohlenen Sicherungen)
            inverters: enrichedInverters,

            // Wallbox (mit empfohlenen Sicherungen)
            wallbox: config.wallbox && (config.wallboxQty ?? 0) > 0 ? {
              materialID: config.wallbox,
              description: getBomDescription(config.wallbox),
              quantity: config.wallboxQty ?? 0,
              recommendedBreaker: wallboxBreaker,
              recommendedCable: wallboxCable,
              recommendedRCD: wallboxRCD
            } : null,

            // Notstromlösungen (mit empfohlenen Sicherungen)
            backupSolutions: config.notstromloesungen && (config.notstromloesungenQty ?? 0) > 0 ? {
              materialID: config.notstromloesungen,
              description: getBomDescription(config.notstromloesungen),
              quantity: config.notstromloesungenQty ?? 0,
              recommendedBreaker: backupBreaker,
              recommendedCable: backupCable
            } : null,

            // PV-Kabel
            pvCables: pvCables,

            // Potentialausgleich HES-UK
            potentialausgleichHESUK: potentialausgleichHESUK,

            // Generatoranschlusskasten
            generatoranschlusskasten: config.generatoranschlusskasten && typeof config.generatoranschlusskasten === 'string' ? {
              materialID: config.generatoranschlusskasten,
              description: getBomDescription(config.generatoranschlusskasten),
              quantity: config.generatoranschlusskastenQty || 1
            } : null,

            roofType: config.roofType,
            batteryKwh: configToBook.totals?.batteryKwh || 0,
            powerKwp: configToBook.totals?.powerKwp || '0.00'
          },
          billOfMaterials: billOfMaterials.map((item: BOMItem) => ({
            materialId: item.materialId,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            category: item.category || '',
            isConfigured: item.isConfigured || false,
            isManual: item.isManual || false
          })),
          totals: configToBook.totals,
          createdAt: new Date().toISOString(),
          createdBy: 'PV-Konfigurator',
          type: 'pv-configuration'
        };

        await FirebaseService.addDocument('project-configurations', pvConfigData);
      }

      showNotification(`Stückliste für "${projectName}" erfolgreich gebucht`, NotificationType.SUCCESS);
      setShowBookingModal(false);
      setConfigToBook(null);
    } catch (error) {
      console.error('Fehler beim Buchen:', error);
      showNotification('Fehler beim Buchen der Stückliste', NotificationType.ERROR);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
        <div className="pl-12 sm:pl-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">PV-Konfigurationen</h1>
          <p className="text-sm text-gray-500 hidden sm:block">
            {filteredConfigurations.length} von {configurations.length} Konfigurationen
          </p>
        </div>
        <button
          onClick={handleNewConfig}
          className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Neue Konfiguration</span>
          <span className="sm:hidden">Neu</span>
        </button>
      </div>

      {/* Statistik-Karten */}
      <div className="grid grid-cols-3 md:grid-cols-3 gap-1.5 md:gap-4 flex-shrink-0">
        <div className="bg-white rounded-lg shadow p-2 md:p-4">
          <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Gesamt</p>
          <p className="text-base md:text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-2 md:p-4">
          <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Entwurf</p>
          <p className="text-base md:text-2xl font-bold text-gray-600">{stats.byStatus?.draft || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-2 md:p-4">
          <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Gebucht</p>
          <p className="text-base md:text-2xl font-bold text-green-600">{stats.byStatus?.booked || 0}</p>
        </div>
      </div>

      {/* Konfigurationsliste */}
      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col min-h-0">
        {/* Titel-Zeile mit Suche und Settings-Button */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0 space-y-3 sm:space-y-0">
          <div className="flex items-center justify-between sm:gap-3">
            <h2 className="text-lg font-semibold text-gray-900 flex-shrink-0">Konfigurationsliste</h2>

            {/* Desktop: Suche inline */}
            <div className="hidden sm:flex items-center gap-2 flex-1">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Suchen..."
                  value={searchTerm}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="relative column-settings-container" ref={columnSettingsRef}>
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
                  {availableColumns.map((column: ColumnConfig) => (
                    <label
                      key={column.key}
                      className={`flex items-center px-2 py-1.5 rounded hover:bg-gray-50 ${column.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[column.key as keyof VisibleColumns]}
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

          {/* Mobile: Suche als zweite Zeile */}
          <div className="flex sm:hidden items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Suchen..."
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredConfigurations.length === 0 ? (
          <div className="text-center py-12">
            <Sun className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Konfigurationen gefunden</h3>
            <p className="text-gray-500 mb-4">
              {configurations.length === 0
                ? 'Erstellen Sie Ihre erste PV-Konfiguration'
                : 'Passen Sie Ihre Filterkriterien an'}
            </p>
            {configurations.length === 0 && (
              <button
                onClick={handleNewConfig}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Erste Konfiguration erstellen
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            {/* Mobile: Card-Liste */}
            <div className="md:hidden h-full overflow-auto p-4 space-y-3">
              {filteredConfigurations.map((config: Configuration) => (
                <div
                  key={config.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm active:bg-gray-50"
                  onClick={() => handleViewConfig(config)}
                >
                  {/* Header: Konfiguration + Status */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{config.configNumber}</p>
                      {visibleColumns.kunde && (
                        <p className="text-sm text-gray-500">{getCustomerName(config.customerID)}</p>
                      )}
                    </div>
                    {visibleColumns.status && getStatusBadge(config.status)}
                  </div>

                  {/* Projekt */}
                  {visibleColumns.projekt && config.projectID && (
                    <div className="mt-2 text-sm text-gray-600">
                      {getProjectName(config.projectID)}
                    </div>
                  )}

                  {/* Module */}
                  {visibleColumns.module && (
                    <div className="mt-2 flex gap-4 text-sm">
                      <span className="text-gray-600">
                        <Zap className="h-4 w-4 inline mr-1" />
                        {config.totals?.moduleCount || 0} Module
                      </span>
                    </div>
                  )}

                  {/* Datum */}
                  {visibleColumns.datum && (
                    <div className="mt-2 text-xs text-gray-500">
                      {formatDate(config.createdAt)}
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
                    {visibleColumns.config && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Konfiguration
                      </th>
                    )}
                    {visibleColumns.kunde && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kunde
                      </th>
                    )}
                    {visibleColumns.projekt && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Projekt
                      </th>
                    )}
                    {visibleColumns.module && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Module
                      </th>
                    )}
                    {visibleColumns.status && (
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                        <div className="flex items-center justify-center gap-1">
                          <span>Status</span>
                          <button
                            onClick={(e: MouseEvent<HTMLButtonElement>) => {
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
                              {uniqueStatuses.map((status: StatusOption) => (
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
                    {visibleColumns.datum && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Datum
                      </th>
                    )}
                    {visibleColumns.aktionen && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aktionen
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredConfigurations.map((config: Configuration) => (
                    <tr
                      key={config.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewConfig(config)}
                    >
                      {visibleColumns.config && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{config.configNumber}</span>
                          {config.name && (
                            <span className="text-xs text-gray-500 block">{config.name}</span>
                          )}
                        </td>
                      )}
                      {visibleColumns.kunde && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {getCustomerName(config.customerID)}
                        </td>
                      )}
                      {visibleColumns.projekt && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {getProjectName(config.projectID)}
                        </td>
                      )}
                      {visibleColumns.module && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                          {config.totals?.moduleCount || 0}
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusBadge(config.status)}
                        </td>
                      )}
                      {visibleColumns.datum && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(config.createdAt)}
                        </td>
                      )}
                      {visibleColumns.aktionen && (
                        <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e: MouseEvent<HTMLTableCellElement>) => e.stopPropagation()}>
                          <div className="relative inline-block">
                            <button
                              onClick={() => setShowActionsMenu(showActionsMenu === config.id ? null : config.id)}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>

                            {showActionsMenu === config.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setShowActionsMenu(null)}
                                />
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        handleEditConfig(config);
                                        setShowActionsMenu(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                      <Edit className="h-4 w-4 mr-3" />
                                      Bearbeiten
                                    </button>
                                    <button
                                      onClick={() => handleDuplicateConfig(config)}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                      <Copy className="h-4 w-4 mr-3" />
                                      Duplizieren
                                    </button>
                                    <button
                                      onClick={() => handleBookingClick(config)}
                                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center ${
                                        config.status === CONFIG_STATUS.BOOKED
                                          ? 'text-gray-400 cursor-not-allowed'
                                          : 'text-green-600'
                                      }`}
                                      disabled={config.status === CONFIG_STATUS.BOOKED}
                                    >
                                      <Package className="h-4 w-4 mr-3" />
                                      {config.status === CONFIG_STATUS.BOOKED ? 'Bereits gebucht' : 'Buchen'}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteClick(config)}
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
          setConfigToDelete(null);
        }}
        title="Konfiguration löschen"
        size="sm"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Möchten Sie die Konfiguration <strong>{configToDelete?.configNumber}</strong> wirklich löschen?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setConfigToDelete(null);
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

      {/* Booking Modal */}
      <BaseModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setConfigToBook(null);
        }}
        title="Buchung bestätigen"
        size="sm"
      >
        <div className="p-6">
          {configToBook && (
            <>
              <p className="text-gray-600 mb-6">
                Die Stückliste mit <strong>{configToBook.billOfMaterials?.length || 0} Positionen</strong> wird vom Lagerbestand abgezogen.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setConfigToBook(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  disabled={isBooking}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleBookingConfirm}
                  disabled={isBooking}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  {isBooking ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Wird gebucht...
                    </>
                  ) : (
                    'Jetzt buchen'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </BaseModal>

      {/* Config Preview Modal */}
      {showPreview && selectedConfig && (
        <ConfigPreview
          config={selectedConfig}
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setSelectedConfig(null);
          }}
          onEdit={(config: Configuration) => {
            setShowPreview(false);
            handleEditConfig(config);
          }}
          onBook={(config: Configuration) => {
            setShowPreview(false);
            handleBookingClick(config);
          }}
        />
      )}
    </div>
  );
};

export default ConfiguratorManagement;
