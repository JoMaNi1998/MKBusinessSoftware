import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Save,
  Building,
  MapPin,
  User,
  FileText,
  UserCheck,
  Package,
  TrendingDown,
  Edit,
  Trash2,
  Hash,
  Eye,
  Settings,
  Car,
  Shield,
  Mail,
  Phone,
  Euro
} from 'lucide-react';
import BaseModal from './BaseModal';
import { useBookings } from '../context/BookingContext';
import { useCustomers } from '../context/CustomerContext';
import { useNotification } from '../context/NotificationContext';
import { FirebaseService } from '../services/firebaseService';
import VDEProtocolModal from './VDEProtocolModal';

/* ------------------------ Utils ------------------------ */
const cn = (...c) => c.filter(Boolean).join(' ');

const formatPrice = (price) => {
  if (price === null || price === undefined || price === '') return '0,00 €';
  const num = Number(price);
  if (Number.isNaN(num)) return '0,00 €';
  return `${num.toFixed(2).replace('.', ',')} €`;
};

const calculateProjectCosts = async (projectBookings) => {
  if (!projectBookings || projectBookings.length === 0) return 0;
  
  let totalCost = 0;
  
  // Berechne Gesamtkosten basierend auf historischen Preisen
  projectBookings.forEach(booking => {
    booking.materials?.forEach(bookingMaterial => {
      // Prüfe zuerst ob historischer Preis vorhanden ist (neue Buchungen)
      if (bookingMaterial.totalCost !== undefined) {
        const cost = Number(bookingMaterial.totalCost);
        if (!isNaN(cost)) {
          totalCost += cost;
        }
      } 
      // Fallback für alte Buchungen ohne historische Preise
      else if (bookingMaterial.priceAtBooking && bookingMaterial.quantity) {
        const price = Number(bookingMaterial.priceAtBooking);
        const quantity = Number(bookingMaterial.quantity);
        if (!isNaN(price) && !isNaN(quantity)) {
          totalCost += price * quantity;
        }
      }
      // Für sehr alte Buchungen ohne Preisinformationen - keine Berechnung möglich
      else if (bookingMaterial.quantity) {
        // Keine Preisinformation verfügbar - wird nicht zu den Gesamtkosten hinzugefügt
      }
    });
  });
  
  return totalCost;
};

const formatDate = (date) => {
  if (!date) return 'Nicht gesetzt';
  try {
    let d;
    if (date instanceof Date) d = date;
    else if (typeof date === 'string' || typeof date === 'number') d = new Date(date);
    else if (date?.seconds) d = new Date(date.seconds * 1000);
    else return 'Ungültiges Datum';
    if (isNaN(d.getTime())) return 'Ungültiges Datum';
    return d.toLocaleDateString('de-DE');
  } catch {
    return 'Ungültiges Datum';
  }
};

const formatDateTime = (date) => {
  if (!date) return 'Unbekannt';
  try {
    let d;
    if (date instanceof Date) d = date;
    else if (typeof date === 'string' || typeof date === 'number') d = new Date(date);
    else if (date?.seconds) d = new Date(date.seconds * 1000);
    else return 'Ungültiges Datum';
    if (isNaN(d.getTime())) return 'Ungültiges Datum';
    return d.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Ungültiges Datum';
  }
};

const computeNextProjectId = (projects = []) => {
  const regex = /^PRO-(\d{3,})$/;
  const max = projects.reduce((acc, p) => {
    const id = p?.projectID;
    if (!id || typeof id !== 'string') return acc;
    const m = id.match(regex);
    if (!m) return acc;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `PRO-${String(max + 1).padStart(3, '0')}`;
};

const random4 = () => String(Math.floor(Math.random() * 10000)).padStart(4, '0');

const sanitizeCustomerName = (s) => (s || '').replace(/\s+/g, '');

const addressFromParts = ({ street, houseNumber, postalCode, city }) =>
  `${(street || '').trim()} ${(houseNumber || '').trim()}, ${(postalCode || '').trim()} ${(city || '').trim()}`
    .replace(/\s+,/g, ',')
    .replace(/,\s*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

const parseAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return { street: '', houseNumber: '', postalCode: '', city: '' };
  }
  const [streetPart = '', cityPart = ''] = address.split(', ');
  const streetMatch = streetPart.match(/^(.+?)\s+(\d+.*)$/);
  const street = streetMatch ? streetMatch[1] : streetPart;
  const houseNumber = streetMatch ? streetMatch[2] : '';
  const cityMatch = cityPart.match(/^(\d+)\s+(.+)$/);
  const postalCode = cityMatch ? cityMatch[1] : '';
  const city = cityMatch ? cityMatch[2] : cityPart;
  return { street: street.trim(), houseNumber: houseNumber.trim(), postalCode: postalCode.trim(), city: city.trim() };
};

const STATUS_OPTIONS = [
  { value: 'Aktiv', label: 'Aktiv' },
  { value: 'Geplant', label: 'Geplant' },
  { value: 'Pausiert', label: 'Pausiert' },
  { value: 'Abgeschlossen', label: 'Abgeschlossen' },
  { value: 'Storniert', label: 'Storniert' }
];

const statusPill = (status) => {
  switch (status) {
    case 'Aktiv':
      return 'bg-green-100 text-green-800';
    case 'Abgeschlossen':
      return 'bg-gray-100 text-gray-800';
    case 'Geplant':
      return 'bg-blue-100 text-blue-800';
    case 'Pausiert':
      return 'bg-yellow-100 text-yellow-800';
    case 'Storniert':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const vdeStatusPill = (status) => {
  switch (status) {
    case 'Erstellt':
      return 'bg-blue-100 text-blue-800';
    case 'Geprüft':
      return 'bg-green-100 text-green-800';
    case 'Abgeschlossen':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/* --------------------- Hauptkomponente --------------------- */
const ProjectModal = ({
  isOpen,
  onClose,
  mode = 'view', // "view" | "create" | "edit"
  project = null,
  onSave,          // nur create/edit
  onEdit,          // nur view
  onDelete,        // nur view
  customers: customersProp = [],  // nur create/edit (Kompatibilität zu deinem AddProjectModal)
  projects: projectsProp = []     // nur create/edit (für ID-Generierung)
}) => {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  // Contexts wie bisher im Detail-Modal
  const { bookings = [] } = useBookings();
  const { customers: customersCtx = [] } = useCustomers();
  const { showNotification } = useNotification();

  // Für create/edit nehmen wir bevorzugt die per Prop übergebenen Kunden/Projekte
  const customersList = (isCreate || isEdit) && customersProp.length ? customersProp : customersCtx;
  const projectsList = (isCreate || isEdit) ? projectsProp : [];

  /* ---------- View-spezifische States ---------- */
  const [projectConfigurations, setProjectConfigurations] = useState([]);
  const [loadingConfigurations, setLoadingConfigurations] = useState(false);
  const [deletingConfigId, setDeletingConfigId] = useState(null);

  const [vdeProtocols, setVdeProtocols] = useState([]);
  const [loadingVdeProtocols, setLoadingVdeProtocols] = useState(false);
  const [isVdeProtocolModalOpen, setIsVdeProtocolModalOpen] = useState(false);
  const [selectedVdeProtocol, setSelectedVdeProtocol] = useState(null);

  const [projectCosts, setProjectCosts] = useState(0);
  const [loadingCosts, setLoadingCosts] = useState(false);

  /* ---------- Form-spezifische States ---------- */
  const [formData, setFormData] = useState({
    projectID: '',
    name: '',
    description: '',
    customerID: '',
    customerName: '',
    contactPersonId: '',
    contactPersonName: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    status: 'Aktiv',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [selectedCustomerContacts, setSelectedCustomerContacts] = useState([]);

  /* ---------- Initialisierung ---------- */
  useEffect(() => {
    if (!isOpen) return;

    // View: Daten laden
    if (isView && project?.id) {
      // PV-Konfigurationen
      (async () => {
        try {
          setLoadingConfigurations(true);
          const configs = await FirebaseService.getDocuments('project-configurations');
          setProjectConfigurations(configs.filter((c) => c.projectID === project.id));
        } catch (e) {
          console.error('Fehler beim Laden der Projektkonfigurationen:', e);
        } finally {
          setLoadingConfigurations(false);
        }
      })();

      // VDE-Protokolle
      loadVdeProtocols();

      // Projektkosten berechnen
      loadProjectCosts();
    }

    // Form: initiale Werte
    if (isCreate) {
      let projectID = 'PRO-001';
      try {
        projectID = computeNextProjectId(projectsList);
      } catch (e) {
        console.error('Fehler bei ID-Generierung, Fallback auf PRO-001:', e);
      }
      setFormData((prev) => ({
        ...prev,
        projectID,
        name: random4(), // wird bei Kundenauswahl durch Kundenpräfix + Random ersetzt
        description: '',
        customerID: '',
        customerName: '',
        contactPersonId: '',
        contactPersonName: '',
        street: '',
        houseNumber: '',
        postalCode: '',
        city: '',
        status: 'Aktiv',
        notes: ''
      }));
      setSelectedCustomerContacts([]);
      setErrors({});
    } else if (isEdit && project) {
      const { street, houseNumber, postalCode, city } = parseAddress(project.address || '');
      setFormData({
        projectID: project.projectID || project.id || '',
        name: project.name || '',
        description: project.description || '',
        customerID: project.customerID || '',
        customerName: project.customerName || '',
        contactPersonId: project.contactPersonId || '',
        contactPersonName: project.contactPersonName || '',
        street,
        houseNumber,
        postalCode,
        city,
        status: project.status || 'Aktiv',
        notes: project.notes || ''
      });

      const cust = customersList.find((c) => c.id === (project.customerID || ''));
      setSelectedCustomerContacts(cust?.contacts || []);
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, project?.id]);

  /* ---------- VDE-Protokolle laden (View) ---------- */
  const loadVdeProtocols = useCallback(async () => {
    if (!project?.id) return;
    setLoadingVdeProtocols(true);
    try {
      const protocols = await FirebaseService.getDocuments('vde-protocols');
      const customerOfProject =
        customersCtx.find((c) => c.id === project.customerID) || null;

      const filtered = (protocols || []).filter((protocol) => {
        const matchesProject = protocol.projectID === project.id;
        const matchesCustomer = protocol.customerID === project.customerID;
        const matchesProjectName = protocol.projectName === project.name;
        const matchesCustomerName =
          protocol.customerName === customerOfProject?.firmennameKundenname ||
          protocol.customerName === project.customerName;
        return matchesProject || matchesCustomer || matchesProjectName || matchesCustomerName;
      });

      setVdeProtocols(filtered);
    } catch (e) {
      console.error('Fehler beim Laden der VDE-Protokolle:', e);
      setVdeProtocols([]);
    } finally {
      setLoadingVdeProtocols(false);
    }
  }, [project?.id, project?.customerID, project?.name, project?.customerName, customersCtx]);

  /* ---------- Form-Handler ---------- */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleCustomerChange = (e) => {
    const customerID = e.target.value;
    const selectedCustomer = customersList.find((c) => c.id === customerID);

    const customerName = selectedCustomer
      ? selectedCustomer.name || selectedCustomer.firmennameKundenname || ''
      : '';

    const newProjectName = selectedCustomer
      ? `${sanitizeCustomerName(customerName)}${random4()}`
      : formData.name || random4();

    // Kontakte updaten
    setSelectedCustomerContacts(selectedCustomer?.contacts || []);

    setFormData((prev) => ({
      ...prev,
      customerID,
      customerName,
      contactPersonId: '',
      contactPersonName: '',
      name: newProjectName,
      street: selectedCustomer?.street || '',
      houseNumber: selectedCustomer?.houseNumber || '',
      postalCode: selectedCustomer?.postalCode || '',
      city: selectedCustomer?.city || ''
    }));

    if (errors.customerID && customerID) {
      setErrors((p) => {
        const cp = { ...p };
        delete cp.customerID;
        return cp;
      });
    }
  };

  const handleContactPersonChange = (e) => {
    const contactPersonId = e.target.value;
    const selectedContact = selectedCustomerContacts.find((c) => c.id === contactPersonId);
    setFormData((prev) => ({
      ...prev,
      contactPersonId,
      contactPersonName: selectedContact ? selectedContact.name : ''
    }));
  };

  const validateForm = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Projektname ist erforderlich';
    if (!formData.customerID) e.customerID = 'Kunde ist erforderlich';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (evt) => {
    evt?.preventDefault?.();
    if (!validateForm()) return;

    const address = addressFromParts({
      street: formData.street,
      houseNumber: formData.houseNumber,
      postalCode: formData.postalCode,
      city: formData.city
    });

    const projectData = { ...formData, address };
    onSave?.(projectData);
    onClose?.();
  };

  /* ---------- Ableitungen für View ---------- */
  const projectBookings = useMemo(() => {
    if (!project?.id) return [];
    return bookings.filter((b) => b.projectID === project.id);
  }, [bookings, project?.id]);

  const customerOfProject = useMemo(() => {
    if (!project?.customerID) return null;
    return customersCtx.find((c) => c.id === project.customerID) || null;
  }, [customersCtx, project?.customerID]);

  /* ---------- Projektkosten laden (View) ---------- */
  const loadProjectCosts = useCallback(async () => {
    if (!project?.id) return;
    setLoadingCosts(true);
    try {
      const costs = await calculateProjectCosts(projectBookings);
      setProjectCosts(costs);
    } catch (e) {
      console.error('Fehler beim Berechnen der Projektkosten:', e);
      setProjectCosts(0);
    } finally {
      setLoadingCosts(false);
    }
  }, [project?.id, projectBookings]);

  // Kosten neu laden wenn sich Buchungen ändern
  useEffect(() => {
    if (isView && project?.id && projectBookings.length >= 0) {
      loadProjectCosts();
    }
  }, [isView, project?.id, projectBookings, loadProjectCosts]);

  /* ---------- Footer ---------- */
  const footerView = (
    <>
      <button
        onClick={() => onEdit?.(project)}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
      >
        <Edit className="h-4 w-4" />
        <span>Bearbeiten</span>
      </button>
      <button
        onClick={() => {
          onDelete?.(project?.id);
          onClose?.();
        }}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
      >
        <Trash2 className="h-4 w-4" />
        <span>Löschen</span>
      </button>
    </>
  );

  const footerForm = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
      >
        Abbrechen
      </button>
      <button
        type="submit"
        form="project-form"
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
      >
        <Save className="h-4 w-4" />
        <span>{isEdit ? 'Aktualisieren' : 'Hinzufügen'}</span>
      </button>
    </>
  );

  if (!isOpen) return null;

  /* ------------------------ RENDER: VIEW ------------------------ */
  if (isView && project) {
    const addr =
      project.address ||
      addressFromParts(parseAddress(project.address || ''));

    return (
      <>
        <BaseModal
          isOpen={isOpen}
          onClose={onClose}
          title="Projektdetails"
          icon={Building}
          footerButtons={footerView}
        >
          <div className="space-y-6">
            {/* Projektinformationen */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Projektinformationen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Projektname</span>
                  </div>
                  <p className="text-gray-900 ml-6">{project.name}</p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Hash className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Projekt-ID</span>
                  </div>
                  <p className="text-gray-900 ml-6">{project.projectID || project.id}</p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Hash className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Status</span>
                  </div>
                  <div className="ml-6">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusPill(project.status))}>
                      {project.status}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Kunde</span>
                  </div>
                  <p className="text-gray-900 ml-6">{customerOfProject?.firmennameKundenname || project.customerName || 'Unbekannter Kunde'}</p>
                </div>

                {/* Ansprechpartner */}
                {project.contactPersonId && (() => {
                  const contact = customerOfProject?.contacts?.find((c) => c.id === project.contactPersonId);
                  return contact ? (
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <UserCheck className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Ansprechpartner</span>
                      </div>
                      <div className="ml-6 bg-white p-3 rounded border">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="h-4 w-4 text-blue-500" />
                          <span className="font-medium text-gray-900">{contact.name}</span>
                          {contact.position && <span className="text-sm text-gray-500">({contact.position})</span>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {contact.email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">{contact.email}</span>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">{contact.phone}</span>
                            </div>
                          )}
                        </div>
                        {contact.notes && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Notizen:</span> {contact.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : project.contactPersonName ? (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <UserCheck className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Ansprechpartner</span>
                      </div>
                      <p className="text-gray-900 ml-6">
                        {project.contactPersonName}{' '}
                        <span className="text-sm text-gray-500">(Kontakt nicht mehr verfügbar)</span>
                      </p>
                    </div>
                  ) : null;
                })()}

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Adresse</span>
                  </div>
                  <p className="text-gray-900 ml-6">{addr || 'Nicht angegeben'}</p>
                </div>
              </div>

              {project.description && (
                <div className="mt-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">Beschreibung</span>
                  </div>
                  <p className="text-gray-900 bg-white p-3 rounded border">{project.description}</p>
                </div>
              )}

              {project.notes && (
                <div className="mt-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">Notizen</span>
                  </div>
                  <p className="text-gray-900 bg-white p-3 rounded border">{project.notes}</p>
                </div>
              )}
            </div>

            {/* Statistiken */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Materialbuchungen</p>
                    <p className="text-2xl font-bold text-blue-600">{projectBookings.length}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Materialien gesamt</p>
                    <p className="text-2xl font-bold text-green-600">
                      {projectBookings.reduce(
                        (sum, booking) =>
                          sum +
                          booking.materials.reduce((matSum, material) => matSum + (material.quantity || 0), 0),
                        0
                      )}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Projektkosten</p>
                    {loadingCosts ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                        <span className="text-sm text-gray-500">Berechne...</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-orange-600">
                          {formatPrice(projectCosts)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Basierend auf historischen Preisen
                        </p>
                      </>
                    )}
                  </div>
                  <Euro className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* PV-Konfigurationen */}
            {projectConfigurations.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                  PV-Konfigurationen ({projectConfigurations.length})
                </h3>

                {loadingConfigurations ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Lade Konfigurationen...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projectConfigurations.map((configWrapper, index) => {
                      const config = configWrapper.pvConfiguration || configWrapper;
                      const configId = configWrapper.id;
                      return (
                        <div key={index} className="bg-white border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <Settings className="h-5 w-5 text-yellow-500" />
                              <span className="text-lg font-medium text-gray-900">PV-Konfiguration</span>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                v{config.configurationVersion || '1.0'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">
                                {formatDateTime(configWrapper.createdAt || config.timestamp)}
                              </span>
                              <button
                                onClick={async () => {
                                  if (!window.confirm('Diese PV-Konfiguration wirklich löschen?')) return;
                                  try {
                                    setDeletingConfigId(configId);
                                    await FirebaseService.deleteDocument('project-configurations', configId);
                                    setProjectConfigurations((prev) => prev.filter((c) => c.id !== configId));
                                  } catch (e) {
                                    console.error('Fehler beim Löschen:', e);
                                    showNotification('Fehler beim Löschen der Konfiguration!', 'error');
                                  } finally {
                                    setDeletingConfigId(null);
                                  }
                                }}
                                disabled={deletingConfigId === configId}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-50"
                                title="Konfiguration löschen"
                              >
                                {deletingConfigId === configId ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Wechselrichter */}
                          {config.inverters?.length > 0 && (
                            <div className="mb-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <Settings className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-700">Wechselrichter</span>
                              </div>
                              <div className="ml-6 space-y-2">
                                {config.inverters.map((inv, idx) => (
                                  <div key={idx} className="bg-gray-50 rounded p-3">
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="font-medium text-gray-900">{inv.description}</span>
                                      <span className="text-sm text-gray-600">{inv.quantity}x</span>
                                    </div>

                                    {(inv.recommendedBreaker || inv.recommendedCable) && (
                                      <div className="mb-2 p-2 bg-blue-50 rounded">
                                        <span className="text-xs font-medium text-blue-800">Empfohlene Komponenten:</span>
                                        <div className="text-xs text-blue-700 mt-1 space-y-1">
                                          {inv.recommendedBreaker && <div>• Leitungsschutzschalter: {inv.recommendedBreaker}</div>}
                                          {inv.recommendedCable && <div>• Mantelleitung: {inv.recommendedCable}</div>}
                                        </div>
                                      </div>
                                    )}

                                    {inv.strings?.length > 0 && (
                                      <div className="space-y-1">
                                        <span className="text-xs font-medium text-gray-600">Strings:</span>
                                        {inv.strings.map((s, si) => (
                                          <div key={si} className="text-xs text-gray-600 ml-2">
                                            {s.stringName}: {s.moduleCount}x {s.moduleDescription}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Module */}
                          {config.modules && (
                            <div className="mb-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <Package className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-700">Module</span>
                              </div>
                              <div className="ml-6 bg-gray-50 rounded p-3">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-gray-900">{config.modules.description}</span>
                                  <span className="text-sm text-gray-600">{config.modules.totalQuantity}x</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Wallbox */}
                          {config.wallbox && (
                            <div className="mb-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <Car className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-700">Wallbox</span>
                              </div>
                              <div className="ml-6 bg-gray-50 rounded p-3">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium text-gray-900">{config.wallbox.description}</span>
                                  <span className="text-sm text-gray-600">{config.wallbox.quantity}x</span>
                                </div>
                                {(config.wallbox.recommendedBreaker ||
                                  config.wallbox.recommendedCable ||
                                  config.wallbox.recommendedRCD) && (
                                  <div className="p-2 bg-blue-50 rounded">
                                    <span className="text-xs font-medium text-blue-800">Empfohlene Komponenten:</span>
                                    <div className="text-xs text-blue-700 mt-1 space-y-1">
                                      {config.wallbox.recommendedBreaker && (
                                        <div>• Leitungsschutzschalter: {config.wallbox.recommendedBreaker}</div>
                                      )}
                                      {config.wallbox.recommendedCable && (
                                        <div>• Mantelleitung: {config.wallbox.recommendedCable}</div>
                                      )}
                                      {config.wallbox.recommendedRCD && <div>• FI-Schutzschalter: {config.wallbox.recommendedRCD}</div>}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Notstromlösungen */}
                          {config.backupSolutions && (
                            <div className="mb-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <Shield className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-700">Notstromlösungen</span>
                              </div>
                              <div className="ml-6 bg-gray-50 rounded p-3">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium text-gray-900">{config.backupSolutions.description}</span>
                                  <span className="text-sm text-gray-600">{config.backupSolutions.quantity}x</span>
                                </div>
                                {(config.backupSolutions.recommendedBreaker ||
                                  config.backupSolutions.recommendedCable) && (
                                  <div className="p-2 bg-blue-50 rounded">
                                    <span className="text-xs font-medium text-blue-800">Empfohlene Komponenten:</span>
                                    <div className="text-xs text-blue-700 mt-1 space-y-1">
                                      {config.backupSolutions.recommendedBreaker && (
                                        <div>• Leitungsschutzschalter: {config.backupSolutions.recommendedBreaker}</div>
                                      )}
                                      {config.backupSolutions.recommendedCable && (
                                        <div>• Mantelleitung: {config.backupSolutions.recommendedCable}</div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* PV-Kabel */}
                          {config.pvCables && (
                            <div className="mb-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <Package className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-700">PV-Kabel</span>
                              </div>
                              <div className="ml-6 bg-gray-50 rounded p-3">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-gray-900">{config.pvCables.description}</span>
                                  <span className="text-sm text-gray-600">{config.pvCables.quantity}m</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Potentialausgleich HES-UK */}
                          {config.potentialausgleichHESUK && (
                            <div className="mb-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <Settings className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-700">Potentialausgleich HES-UK</span>
                              </div>
                              <div className="ml-6 bg-gray-50 rounded p-3">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-gray-900">
                                    {config.potentialausgleichHESUK.description}
                                  </span>
                                  <span className="text-sm text-gray-600">{config.potentialausgleichHESUK.quantity}m</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Generatoranschlusskasten */}
                          {config.generatoranschlusskasten && (
                            <div className="mb-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <Settings className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-700">Generatoranschlusskasten</span>
                              </div>
                              <div className="ml-6 bg-gray-50 rounded p-3">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-gray-900">{config.generatoranschlusskasten.description}</span>
                                  <span className="text-sm text-gray-600">{config.generatoranschlusskasten.quantity}x</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* VDE-Protokolle */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                VDE-Protokolle ({vdeProtocols.length})
              </h3>

              {loadingVdeProtocols ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Lade VDE-Protokolle...</p>
                </div>
              ) : vdeProtocols.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Keine VDE-Protokolle</h3>
                  <p className="mt-1 text-sm text-gray-500">Für dieses Projekt wurden noch keine VDE-Protokolle erstellt.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {vdeProtocols.map((protocol, idx) => (
                    <div
                      key={idx}
                      className="bg-white border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
                      onClick={() => {
                        setSelectedVdeProtocol(protocol);
                        setIsVdeProtocolModalOpen(true);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-gray-900">
                          {protocol.protocolNumber || 'VDE-Protokoll'}
                        </span>
                        {protocol.status && (
                          <span className={cn('px-2 py-0.5 rounded-full text-xs', vdeStatusPill(protocol.status))}>
                            {protocol.status}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{formatDate(protocol.createdAt || protocol.createdDate)}</span>
                        <Eye className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Materialbuchungen */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Materialbuchungen ({projectBookings.length})
              </h3>

              {projectBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Buchungen</h3>
                  <p className="mt-1 text-sm text-gray-500">Für dieses Projekt wurden noch keine Materialbuchungen durchgeführt.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projectBookings.map((booking, index) => (
                    <div key={index} className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium text-gray-900">{booking.type}</span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Abgeschlossen</span>
                        </div>
                        <span className="text-sm text-gray-500">{formatDateTime(booking.timestamp)}</span>
                      </div>

                      <div className="space-y-2">
                        {booking.materials.map((m, mi) => (
                          <div key={mi} className="flex justify-between items-center text-sm">
                            <div>
                              <span className="font-medium text-gray-900">{m.description}</span>
                              <p className="text-gray-500 text-xs">{m.materialID}</p>
                            </div>
                            <span className="font-medium text-gray-900">{m.quantity}x</span>
                          </div>
                        ))}
                      </div>

                      {booking.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Notiz:</span> {booking.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </BaseModal>

        {/* VDE Modal */}
        {isVdeProtocolModalOpen && (
          <VDEProtocolModal
            isOpen={isVdeProtocolModalOpen}
            onClose={async () => {
              setIsVdeProtocolModalOpen(false);
              setSelectedVdeProtocol(null);
              await loadVdeProtocols();
            }}
            protocol={selectedVdeProtocol}
            hideActions={false}
          />
        )}
      </>
    );
  }

  /* --------------------- RENDER: FORM (create/edit) --------------------- */
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Projekt bearbeiten' : 'Projekt hinzufügen'}
      icon={Building}
      footerButtons={footerForm}
    >
      <form id="project-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Projekt-ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Projekt-ID *</label>
          <input
            type="text"
            value={formData.projectID}
            readOnly
            placeholder="Wird automatisch generiert"
            className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
          />
        </div>

        {/* Projektname – readOnly, wird automatisch generiert */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building className="h-4 w-4 inline mr-1" />
            Projektname *
          </label>
          <input
            type="text"
            value={formData.name}
            readOnly
            placeholder="Wird automatisch generiert"
            className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Kunde */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="h-4 w-4 inline mr-1" />
            Kunde *
          </label>
          <select
            name="customerID"
            value={formData.customerID}
            onChange={handleCustomerChange}
            className={cn(
              'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              errors.customerID ? 'border-red-300' : 'border-gray-300'
            )}
          >
            <option value="">Kunde auswählen...</option>
            {customersList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || c.firmennameKundenname || 'Unbekannter Kunde'}
              </option>
            ))}
          </select>
          {errors.customerID && <p className="mt-1 text-sm text-red-600">{errors.customerID}</p>}
        </div>

        {/* Ansprechpartner */}
        {formData.customerID && selectedCustomerContacts.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <UserCheck className="h-4 w-4 inline mr-1" />
              Ansprechpartner
            </label>
            <select
              name="contactPersonId"
              value={formData.contactPersonId}
              onChange={handleContactPersonChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Ansprechpartner auswählen...</option>
              {selectedCustomerContacts.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name} {ct.position ? `(${ct.position})` : ''} - {ct.email}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Hinweis wenn keine Kontakte vorhanden */}
        {formData.customerID && selectedCustomerContacts.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center">
              <UserCheck className="h-4 w-4 text-yellow-600 mr-2" />
              <p className="text-sm text-yellow-800">
                Für diesen Kunden sind noch keine Ansprechpartner hinterlegt. Fügen Sie Kontakte in den Kundendetails hinzu.
              </p>
            </div>
          </div>
        )}

        {/* Beschreibung */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="h-4 w-4 inline mr-1" />
            Beschreibung
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Projektbeschreibung..."
          />
        </div>

        {/* Adresse */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="h-4 w-4 inline mr-1" />
            Projektadresse
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Straße"
              />
            </div>
            <div>
              <input
                type="text"
                name="houseNumber"
                value={formData.houseNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Nr."
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="PLZ"
                maxLength={5}
                inputMode="numeric"
              />
            </div>
            <div className="col-span-2">
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ort"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notizen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notizen</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Zusätzliche Notizen..."
          />
        </div>
      </form>
    </BaseModal>
  );
};

export default ProjectModal;

/* ---------------- Kompatibilitäts-Wrapper (Drop-in) ---------------- */

export const ProjectDetailModal = ({ isOpen, onClose, project, onEdit, onDelete }) => (
  <ProjectModal
    isOpen={isOpen}
    onClose={onClose}
    mode="view"
    project={project}
    onEdit={onEdit}
    onDelete={onDelete}
  />
);

export const AddProjectModal = ({ isOpen, onClose, onSave, project = null, customers = [], projects = [] }) => (
  <ProjectModal
    isOpen={isOpen}
    onClose={onClose}
    mode={project ? 'edit' : 'create'}
    project={project}
    onSave={onSave}
    customers={customers}
    projects={projects}
  />
);
