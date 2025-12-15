import { useState, useEffect, useCallback, useMemo } from 'react';
import { useBookings } from '../../../context/BookingContext';
import { useCustomers } from '../../../context/CustomerContext';
import { useNotification } from '../../../context/NotificationContext';
import { FirebaseService } from '../../../services/firebaseService';
import {
  computeNextProjectId,
  random4,
  sanitizeCustomerName,
  addressFromParts,
  parseAddress,
  calculateProjectCosts
} from '../utils';

const INITIAL_FORM_DATA = {
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
};

/**
 * Hook for managing project modal state and operations
 */
export const useProjectModal = ({
  isOpen,
  mode = 'view', // "view" | "create" | "edit"
  project = null,
  customersProp = [],
  projectsProp = [],
  onSave,
  onClose
}) => {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  // Contexts
  const { bookings = [] } = useBookings();
  const { customers: customersCtx = [] } = useCustomers();
  const { showNotification } = useNotification();

  // Customer list based on mode
  const customersList = (isCreate || isEdit) && customersProp.length ? customersProp : customersCtx;
  const projectsList = (isCreate || isEdit) ? projectsProp : [];

  // View-specific states
  const [projectConfigurations, setProjectConfigurations] = useState([]);
  const [loadingConfigurations, setLoadingConfigurations] = useState(false);
  const [deletingConfigId, setDeletingConfigId] = useState(null);

  const [vdeProtocols, setVdeProtocols] = useState([]);
  const [loadingVdeProtocols, setLoadingVdeProtocols] = useState(false);

  const [projectCosts, setProjectCosts] = useState(0);
  const [loadingCosts, setLoadingCosts] = useState(false);

  // Form-specific states
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [selectedCustomerContacts, setSelectedCustomerContacts] = useState([]);

  // Derived data for view mode
  const projectBookings = useMemo(() => {
    if (!project?.id) return [];
    return bookings.filter((b) => b.projectID === project.id);
  }, [bookings, project?.id]);

  const customerOfProject = useMemo(() => {
    if (!project?.customerID) return null;
    return customersCtx.find((c) => c.id === project.customerID) || null;
  }, [customersCtx, project?.customerID]);

  // Load VDE protocols
  const loadVdeProtocols = useCallback(async () => {
    if (!project?.id) return;
    setLoadingVdeProtocols(true);
    try {
      const protocols = await FirebaseService.getDocuments('vde-protocols');

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
  }, [project?.id, project?.customerID, project?.name, project?.customerName, customerOfProject]);

  // Load project costs
  const loadProjectCosts = useCallback(async () => {
    if (!project?.id) return;
    setLoadingCosts(true);
    try {
      const costs = calculateProjectCosts(projectBookings);
      setProjectCosts(costs);
    } catch (e) {
      console.error('Fehler beim Berechnen der Projektkosten:', e);
      setProjectCosts(0);
    } finally {
      setLoadingCosts(false);
    }
  }, [project?.id, projectBookings]);

  // Load project configurations
  const loadConfigurations = useCallback(async () => {
    if (!project?.id) return;
    try {
      setLoadingConfigurations(true);
      const configs = await FirebaseService.getDocuments('project-configurations');
      setProjectConfigurations(configs.filter((c) => c.projectID === project.id));
    } catch (e) {
      console.error('Fehler beim Laden der Projektkonfigurationen:', e);
    } finally {
      setLoadingConfigurations(false);
    }
  }, [project?.id]);

  // Delete configuration
  const deleteConfiguration = useCallback(async (configId) => {
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
  }, [showNotification]);

  // Initialize modal data
  useEffect(() => {
    if (!isOpen) return;

    if (isView && project?.id) {
      loadConfigurations();
      loadVdeProtocols();
      loadProjectCosts();
    }

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
  }, [isOpen, mode, project?.id, isView, isCreate, isEdit, projectsList, customersList, loadConfigurations, loadVdeProtocols, loadProjectCosts]);

  // Reload costs when bookings change
  useEffect(() => {
    if (isView && project?.id && projectBookings.length >= 0) {
      loadProjectCosts();
    }
  }, [isView, project?.id, projectBookings, loadProjectCosts]);

  // Form handlers
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleCustomerChange = useCallback((e) => {
    const customerID = e.target.value;
    const selectedCustomer = customersList.find((c) => c.id === customerID);

    const customerName = selectedCustomer
      ? selectedCustomer.name || selectedCustomer.firmennameKundenname || ''
      : '';

    const newProjectName = selectedCustomer
      ? `${sanitizeCustomerName(customerName)}${random4()}`
      : formData.name || random4();

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
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.customerID;
        return copy;
      });
    }
  }, [customersList, formData.name, errors]);

  const handleContactPersonChange = useCallback((e) => {
    const contactPersonId = e.target.value;
    const selectedContact = selectedCustomerContacts.find((c) => c.id === contactPersonId);
    setFormData((prev) => ({
      ...prev,
      contactPersonId,
      contactPersonName: selectedContact ? selectedContact.name : ''
    }));
  }, [selectedCustomerContacts]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Projektname ist erforderlich';
    if (!formData.customerID) newErrors.customerID = 'Kunde ist erforderlich';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback((evt) => {
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
  }, [validateForm, formData, onSave, onClose]);

  return {
    // Mode flags
    isView,
    isEdit,
    isCreate,

    // Data
    customersList,
    customersCtx,
    projectBookings,
    customerOfProject,

    // View-specific data
    projectConfigurations,
    loadingConfigurations,
    deletingConfigId,
    vdeProtocols,
    loadingVdeProtocols,
    projectCosts,
    loadingCosts,

    // Form data
    formData,
    errors,
    selectedCustomerContacts,

    // Handlers
    handleInputChange,
    handleCustomerChange,
    handleContactPersonChange,
    handleSubmit,
    deleteConfiguration,
    loadVdeProtocols,

    // Notifications
    showNotification
  };
};

export default useProjectModal;
