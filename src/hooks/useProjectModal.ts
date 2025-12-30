import { useState, useEffect, useCallback, useMemo, ChangeEvent, FormEvent } from 'react';
import { useBookings } from '@context/BookingContext';
import { useCustomers } from '@context/CustomerContext';
import { useNotification } from '@context/NotificationContext';
import { useConfirm } from '@context/ConfirmContext';
import { FirebaseService } from '@services/firebaseService';
import {
  computeNextProjectId,
  sanitizeProjectCustomerName,
  buildProjectAddress,
  calculateProjectCosts
} from '@utils/projectHelpers';
import { random4 } from '@utils/customerHelpers';
import { NotificationType } from '@app-types/enums';
import type { Customer } from '@app-types';
import type { ExtendedBooking } from '@app-types/contexts/booking.types';
import type {
  ProjectFormData,
  ProjectFormErrors,
  ProjectContact,
  ProjectConfiguration,
  VDEProtocol,
  UseProjectModalProps,
  UseProjectModalReturn
} from '@app-types/components/project.types';

const INITIAL_FORM_DATA: ProjectFormData = {
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
  notes: '',
  startDate: '',
  endDate: '',
  assignedUsers: []
};

/**
 * Hook für Projekt-Modal-Zustand und Operationen
 */
export const useProjectModal = ({
  isOpen,
  mode = 'view',
  project = null,
  customersProp = [],
  projectsProp = [],
  onSave,
  onClose
}: UseProjectModalProps): UseProjectModalReturn => {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  // Contexts
  const { bookings = [] } = useBookings();
  const { customers: customersCtx = [] } = useCustomers();
  const { showNotification } = useNotification();
  const { confirmDelete } = useConfirm();

  // Kundenliste basierend auf Modus
  const customersList = (isCreate || isEdit) && customersProp.length ? customersProp : customersCtx;
  const projectsList = (isCreate || isEdit) ? projectsProp : [];

  // Ansicht-spezifische Zustände
  const [projectConfigurations, setProjectConfigurations] = useState<ProjectConfiguration[]>([]);
  const [loadingConfigurations, setLoadingConfigurations] = useState<boolean>(false);
  const [deletingConfigId, setDeletingConfigId] = useState<string | null>(null);

  const [vdeProtocols, setVdeProtocols] = useState<VDEProtocol[]>([]);
  const [loadingVdeProtocols, setLoadingVdeProtocols] = useState<boolean>(false);

  const [projectCosts, setProjectCosts] = useState<number>(0);
  const [loadingCosts, setLoadingCosts] = useState<boolean>(false);

  // Formular-spezifische Zustände
  const [formData, setFormData] = useState<ProjectFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [selectedCustomerContacts, setSelectedCustomerContacts] = useState<ProjectContact[]>([]);

  // Abgeleitete Daten für Ansichtsmodus
  const projectBookings = useMemo((): ExtendedBooking[] => {
    if (!project?.id) return [];
    return bookings.filter((b) => b.projectID === project.id);
  }, [bookings, project?.id]);

  const customerOfProject = useMemo((): Customer | null => {
    if (!project?.customerID) return null;
    return customersCtx.find((c) => c.id === project.customerID) || null;
  }, [customersCtx, project?.customerID]);

  // VDE-Protokolle laden
  const customerName = customerOfProject?.firmennameKundenname;
  const loadVdeProtocols = useCallback(async (): Promise<void> => {
    if (!project?.id) {
      setLoadingVdeProtocols(false);
      setVdeProtocols([]);
      return;
    }
    setLoadingVdeProtocols(true);
    try {
      const protocols = await FirebaseService.getDocuments('vde-protocols') as VDEProtocol[];

      const filtered = (protocols || []).filter((protocol) => {
        const matchesProject = protocol.projectID === project.id;
        const matchesCustomer = protocol.customerID === project.customerID;
        const matchesProjectName = protocol.projectName === project.name;
        const matchesCustomerName =
          protocol.customerName === customerName ||
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
  }, [project?.id, project?.customerID, project?.name, project?.customerName, customerName]);

  // Projektkosten laden
  const loadProjectCosts = useCallback(async (): Promise<void> => {
    if (!project?.id) return;
    setLoadingCosts(true);
    try {
      const costs = calculateProjectCosts(projectBookings);
      setProjectCosts(costs.totalCost);
    } catch (e) {
      console.error('Fehler beim Berechnen der Projektkosten:', e);
      setProjectCosts(0);
    } finally {
      setLoadingCosts(false);
    }
  }, [project?.id, projectBookings]);

  // Projektkonfigurationen laden
  const loadConfigurations = useCallback(async (): Promise<void> => {
    if (!project?.id) return;
    try {
      setLoadingConfigurations(true);
      const configs = await FirebaseService.getDocuments('project-configurations') as ProjectConfiguration[];
      setProjectConfigurations(configs.filter((c) => c.projectID === project.id));
    } catch (e) {
      console.error('Fehler beim Laden der Projektkonfigurationen:', e);
    } finally {
      setLoadingConfigurations(false);
    }
  }, [project?.id]);

  // Konfiguration löschen
  const deleteConfiguration = useCallback(async (configId: string): Promise<void> => {
    const configuration = projectConfigurations.find(c => c.id === configId);
    const configName = configuration?.name || 'diese PV-Konfiguration';

    const confirmed = await confirmDelete(configName, 'PV-Konfiguration');
    if (!confirmed) return;

    try {
      setDeletingConfigId(configId);
      await FirebaseService.deleteDocument('project-configurations', configId);
      setProjectConfigurations((prev) => prev.filter((c) => c.id !== configId));
    } catch (e) {
      console.error('Fehler beim Löschen:', e);
      showNotification('Fehler beim Löschen der Konfiguration!', NotificationType.ERROR);
    } finally {
      setDeletingConfigId(null);
    }
  }, [projectConfigurations, confirmDelete, showNotification]);

  // Modal-Daten initialisieren
  useEffect(() => {
    if (!isOpen) return;

    if (isCreate) {
      let projectID = 'PRO-001';
      try {
        projectID = computeNextProjectId(projectsList);
      } catch (e) {
        console.error('Fehler bei ID-Generierung, Fallback auf PRO-001:', e);
      }
      setFormData({
        ...INITIAL_FORM_DATA,
        projectID,
        name: random4()
      });
      setSelectedCustomerContacts([]);
      setErrors({});
    } else if (isEdit && project) {
      // Handle both address formats: object with strasse/plz/ort or string properties
      const street = project.street || project.address?.strasse || '';
      const houseNumber = project.houseNumber || '';
      const postalCode = project.postalCode || project.address?.plz || '';
      const city = project.city || project.address?.ort || '';

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
        notes: project.notes || '',
        startDate: project.startDate || '',
        endDate: project.endDate || '',
        assignedUsers: project.assignedUsers || []
      });

      const cust = customersList.find((c) => c.id === (project.customerID || ''));
      setSelectedCustomerContacts((cust?.contacts as ProjectContact[]) || []);
      setErrors({});
    }
  }, [isOpen, mode, project?.id, isCreate, isEdit, projectsList, customersList, project]);

  // Ansichtsdaten separat laden
  useEffect(() => {
    if (!isOpen || !isView || !project?.id) return;

    loadConfigurations();
    loadVdeProtocols();
    loadProjectCosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isView, project?.id]);

  // Kosten bei Buchungsänderungen neu laden
  useEffect(() => {
    if (isView && project?.id && projectBookings.length >= 0) {
      loadProjectCosts();
    }
  }, [isView, project?.id, projectBookings, loadProjectCosts]);

  // Formular-Handler
  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleCustomerChange = useCallback((e: ChangeEvent<HTMLSelectElement>): void => {
    const customerID = e.target.value;
    const selectedCustomer = customersList.find((c) => c.id === customerID);

    const customerName = selectedCustomer
      ? (selectedCustomer as any).name || selectedCustomer.firmennameKundenname || ''
      : '';

    const newProjectName = selectedCustomer
      ? `${sanitizeProjectCustomerName(customerName)}${random4()}`
      : formData.name || random4();

    setSelectedCustomerContacts((selectedCustomer?.contacts as ProjectContact[]) || []);

    setFormData((prev) => ({
      ...prev,
      customerID,
      customerName,
      contactPersonId: '',
      contactPersonName: '',
      name: newProjectName,
      street: selectedCustomer?.strasse || '',
      houseNumber: selectedCustomer?.hausnummer || '',
      postalCode: selectedCustomer?.plz || '',
      city: selectedCustomer?.ort || ''
    }));

    if (errors.customerID && customerID) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.customerID;
        return copy;
      });
    }
  }, [customersList, formData.name, errors]);

  const handleContactPersonChange = useCallback((e: ChangeEvent<HTMLSelectElement>): void => {
    const contactPersonId = e.target.value;
    const selectedContact = selectedCustomerContacts.find((c) => c.id === contactPersonId);
    setFormData((prev) => ({
      ...prev,
      contactPersonId,
      contactPersonName: selectedContact ? selectedContact.name : ''
    }));
  }, [selectedCustomerContacts]);

  const handleAssignedUsersChange = useCallback((userIds: string[]): void => {
    setFormData((prev) => ({ ...prev, assignedUsers: userIds }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: ProjectFormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Projektname ist erforderlich';
    if (!formData.customerID) newErrors.customerID = 'Kunde ist erforderlich';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback((evt?: FormEvent<HTMLFormElement>): void => {
    evt?.preventDefault?.();
    if (!validateForm()) return;

    const address = buildProjectAddress({
      street: formData.street,
      houseNumber: formData.houseNumber,
      postalCode: formData.postalCode,
      city: formData.city
    });

    const projectData = { ...formData, address };
    onSave?.(projectData);
    onClose?.();
  }, [validateForm, formData, onSave, onClose]);

  return {
    // Modus-Flags
    isView,
    isEdit,
    isCreate,

    // Daten
    customersList,
    customersCtx,
    projectBookings,
    customerOfProject,

    // Ansicht-spezifische Daten
    projectConfigurations,
    loadingConfigurations,
    deletingConfigId,
    vdeProtocols,
    loadingVdeProtocols,
    projectCosts,
    loadingCosts,

    // Formulardaten
    formData,
    errors,
    selectedCustomerContacts,

    // Handler
    handleInputChange,
    handleCustomerChange,
    handleContactPersonChange,
    handleAssignedUsersChange,
    handleSubmit,
    deleteConfiguration,
    loadVdeProtocols,

    // Notifications
    showNotification
  };
};

export default useProjectModal;
