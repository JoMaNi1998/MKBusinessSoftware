import { useState, useEffect, useMemo, useCallback } from 'react';
import { useProjects } from '../../../context/ProjectContext';
import { useCustomers } from '../../../context/CustomerContext';
import { useNotification } from '../../../context/NotificationContext';
import { useBookings } from '../../../context/BookingContext';
import {
  computeNextCustomerId,
  computeNextProjectId,
  sanitizeCustomerName,
  random4,
  addressFromParts
} from '../shared/customerUtils';
import { calculateCustomerTotalCosts } from '../shared/costCalculation';

const useCustomerModal = ({ isOpen, mode, customer }) => {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  const { getProjectsByCustomer, projects, addProject } = useProjects();
  const { customers, addCustomer, updateCustomer } = useCustomers();
  const { showNotification } = useNotification();
  const { bookings = [] } = useBookings();

  // Gemeinsame State
  const [contacts, setContacts] = useState([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    notes: ''
  });

  // View-spezifische States
  const [customerTotalCosts, setCustomerTotalCosts] = useState(0);
  const [loadingCosts, setLoadingCosts] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  // Form State (create/edit)
  const [formData, setFormData] = useState({
    customerID: '',
    firmennameKundenname: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  // Initialisieren beim Öffnen/Wechsel
  useEffect(() => {
    if (!isOpen) return;

    setContacts(customer?.contacts || []);

    if (isCreate) {
      setFormData({
        customerID: '',
        firmennameKundenname: '',
        street: '',
        houseNumber: '',
        postalCode: '',
        city: '',
        notes: ''
      });
    } else if (isEdit && customer) {
      setFormData({
        customerID: customer.customerID || '',
        firmennameKundenname: customer.firmennameKundenname || '',
        street: customer.street || '',
        houseNumber: customer.houseNumber || '',
        postalCode: customer.postalCode || '',
        city: customer.city || '',
        notes: customer.notes || ''
      });
    }

    setErrors({});
    setShowAddContact(false);
    setEditingContact(null);
    setContactForm({ name: '', email: '', phone: '', position: '', notes: '' });
    setDeleteConfirmation(null);
  }, [isOpen, isCreate, isEdit, customer]);

  // Projekte des Kunden
  const customerId = customer?.id || customer?.customerID;
  const customerProjects = useMemo(() => {
    if (!customerId) return [];
    return getProjectsByCustomer(customerId) || [];
  }, [getProjectsByCustomer, customerId]);

  // Kostenberechnung
  const loadCustomerCosts = useCallback(async () => {
    if (!isView || !customerProjects.length) return;
    setLoadingCosts(true);
    try {
      const costs = await calculateCustomerTotalCosts(customerProjects, bookings);
      setCustomerTotalCosts(costs);
    } catch (e) {
      console.error('Fehler beim Berechnen der Kundenkosten:', e);
      setCustomerTotalCosts(0);
    } finally {
      setLoadingCosts(false);
    }
  }, [isView, customerProjects, bookings]);

  useEffect(() => {
    if (isView && customerProjects.length > 0) {
      loadCustomerCosts();
    }
  }, [isView, customerProjects, bookings, loadCustomerCosts]);

  // Kontakt-Aktionen
  const startEditContact = (c) => {
    setEditingContact(c);
    setContactForm({
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      position: c.position || '',
      notes: c.notes || ''
    });
  };

  const handleDeleteContact = (contactId) => {
    if (isView) {
      const c = contacts.find((x) => x.id === contactId);
      setDeleteConfirmation({ contactId, contactName: c?.name || 'Unbekannter Kontakt' });
    } else {
      setContacts((prev) => prev.filter((x) => x.id !== contactId));
    }
  };

  const confirmDeleteContact = async () => {
    if (!deleteConfirmation) return;
    const updated = contacts.filter((x) => x.id !== deleteConfirmation.contactId);
    try {
      if (isView && customer) {
        const id = customer.id || customer.customerID;
        await updateCustomer(id, { ...customer, contacts: updated });
        showNotification('Kontakt erfolgreich gelöscht', 'success');
      }
      setContacts(updated);
    } catch (err) {
      console.error('Error deleting contact:', err);
      showNotification('Fehler beim Löschen des Kontakts', 'error');
    } finally {
      setDeleteConfirmation(null);
    }
  };

  const handleAddOrUpdateContact = async () => {
    const required =
      contactForm.name.trim() &&
      contactForm.email.trim() &&
      contactForm.phone.trim();

    if (!required) {
      showNotification('Bitte füllen Sie alle Pflichtfelder aus', 'error');
      return;
    }

    if (editingContact) {
      const updatedContacts = contacts.map((c) =>
        c.id === editingContact.id
          ? { ...contactForm, id: editingContact.id, updatedAt: new Date().toISOString() }
          : c
      );

      try {
        if (isView && customer) {
          const id = customer.id || customer.customerID;
          await updateCustomer(id, { ...customer, contacts: updatedContacts });
          showNotification('Kontakt erfolgreich aktualisiert', 'success');
        }
        setContacts(updatedContacts);
      } catch (err) {
        console.error('Error updating contact:', err);
        showNotification('Fehler beim Aktualisieren des Kontakts', 'error');
      } finally {
        setEditingContact(null);
        setContactForm({ name: '', email: '', phone: '', position: '', notes: '' });
      }
    } else {
      const newContact = {
        id: Date.now().toString(),
        ...contactForm,
        createdAt: new Date().toISOString()
      };
      const updatedContacts = [...contacts, newContact];

      try {
        if (isView && customer) {
          const id = customer.id || customer.customerID;
          await updateCustomer(id, { ...customer, contacts: updatedContacts });
          showNotification('Kontakt erfolgreich hinzugefügt', 'success');
        }
        setContacts(updatedContacts);
      } catch (err) {
        console.error('Error adding contact:', err);
        showNotification('Fehler beim Hinzufügen des Kontakts', 'error');
      } finally {
        setShowAddContact(false);
        setContactForm({ name: '', email: '', phone: '', position: '', notes: '' });
      }
    }
  };

  // Form-Validierung
  const validateForm = () => {
    const e = {};
    if (!formData.firmennameKundenname.trim()) e.firmennameKundenname = 'Firmenname/Kundenname ist erforderlich';
    if (!formData.street.trim()) e.street = 'Straße ist erforderlich';
    if (!formData.houseNumber.trim()) e.houseNumber = 'Hausnummer ist erforderlich';
    if (!formData.postalCode.trim()) e.postalCode = 'PLZ ist erforderlich';
    else if (!/^\d{5}$/.test(formData.postalCode.trim())) e.postalCode = 'PLZ muss 5 Ziffern haben';
    if (!formData.city.trim()) e.city = 'Stadt ist erforderlich';

    if (isCreate && contacts.length === 0) {
      e.contacts = 'Mindestens ein Ansprechpartner ist erforderlich';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Speichern
  const handleSubmit = async (onClose) => {
    if (!validateForm()) return;

    let customerID = formData.customerID;
    if (isCreate && !customerID) {
      try {
        customerID = computeNextCustomerId(customers);
      } catch (err) {
        console.error('Fehler beim Generieren der Kunden-ID:', err);
        customerID = 'KUN-001';
      }
    }

    const payload = {
      ...formData,
      customerID,
      address: addressFromParts(formData),
      contacts,
      street: formData.street,
      houseNumber: formData.houseNumber,
      postalCode: formData.postalCode,
      city: formData.city
    };

    try {
      if (isEdit && customer) {
        await updateCustomer(customer.id, {
          ...payload,
          createdAt: customer.createdAt,
          lastActivity: new Date()
        });
        showNotification('Kunde erfolgreich aktualisiert', 'success');
      } else if (isCreate) {
        const newCustomerId = await addCustomer({ ...payload, createdAt: new Date().toISOString() });
        showNotification('Kunde erfolgreich hinzugefügt', 'success');

        // Automatisch Projekt erstellen
        try {
          const projectID = computeNextProjectId(projects);
          const projectName = `${sanitizeCustomerName(payload.firmennameKundenname)}${random4()}`;
          const primaryContact = contacts[0] || null;

          await addProject({
            projectID,
            name: projectName,
            customerID: newCustomerId || customerID,
            customerName: payload.firmennameKundenname,
            address: payload.address,
            street: payload.street,
            houseNumber: payload.houseNumber,
            postalCode: payload.postalCode,
            city: payload.city,
            status: 'Geplant',
            description: '',
            notes: '',
            contactPersonId: primaryContact?.id || '',
            contactPersonName: primaryContact?.name || ''
          });
          showNotification(`Projekt "${projectName}" automatisch erstellt`, 'info');
        } catch (projErr) {
          console.error('Fehler beim automatischen Erstellen des Projekts:', projErr);
        }
      }
      onClose?.();
    } catch (err) {
      console.error('Fehler beim Speichern des Kunden:', err);
      showNotification('Fehler beim Speichern', 'error');
    }
  };

  // Lokale Kontakt-Aktionen für Formular
  const handleLocalContactSubmit = () => {
    if (editingContact) {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === editingContact.id
            ? { ...contactForm, id: editingContact.id, updatedAt: new Date().toISOString() }
            : c
        )
      );
      setEditingContact(null);
    } else {
      setContacts((prev) => [
        ...prev,
        { id: Date.now().toString(), ...contactForm, createdAt: new Date().toISOString() }
      ]);
      setShowAddContact(false);
    }
    setContactForm({ name: '', email: '', phone: '', position: '', notes: '' });
  };

  return {
    // States
    isView,
    isEdit,
    isCreate,
    contacts,
    showAddContact,
    setShowAddContact,
    editingContact,
    setEditingContact,
    contactForm,
    setContactForm,
    customerTotalCosts,
    loadingCosts,
    deleteConfirmation,
    setDeleteConfirmation,
    formData,
    errors,
    setErrors,
    customerProjects,

    // Actions
    startEditContact,
    handleDeleteContact,
    confirmDeleteContact,
    handleAddOrUpdateContact,
    handleChange,
    handleSubmit,
    handleLocalContactSubmit
  };
};

export default useCustomerModal;
