/**
 * useCustomerModal Hook
 * Zentraler Hook für Kunden-Modal State und Logik
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useProjects } from '@context/ProjectContext';
import { useCustomers } from '@context/CustomerContext';
import { useNotification } from '@context/NotificationContext';
import { useBookings } from '@context/BookingContext';
import {
  calculateCustomerTotalCosts,
  validateCustomerForm,
  hasCustomerValidationErrors
} from '../services/CustomerService';
import {
  computeNextCustomerId,
  computeNextProjectId,
  sanitizeCustomerName,
  random4
} from '../utils';
import { NotificationType } from '@app-types/enums';
import type {
  UseCustomerModalProps,
  UseCustomerModalReturn,
  Contact,
  ContactFormData,
  CustomerFormData,
  CustomerFormErrors,
  DeleteConfirmation
} from '@app-types/components/customer.types';

/**
 * Hook für Kunden-Modal State und Logik
 *
 * @param props - Modal-Konfiguration
 * @returns Hook-Return mit State und Aktionen
 *
 * @example
 * const hook = useCustomerModal({ isOpen, mode: 'create', customer: null });
 */
export const useCustomerModal = ({
  isOpen,
  mode,
  customer
}: UseCustomerModalProps): UseCustomerModalReturn => {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  const { getProjectsByCustomer, projects, addProject } = useProjects();
  const { customers, addCustomer, updateCustomer } = useCustomers();
  const { showNotification } = useNotification();
  const { bookings = [] } = useBookings();

  // Gemeinsame State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showAddContact, setShowAddContact] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactForm, setContactForm] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    position: '',
    notes: '',
    isPrimary: false
  });

  // View-spezifische States
  const [customerTotalCosts, setCustomerTotalCosts] = useState<number>(0);
  const [loadingCosts, setLoadingCosts] = useState<boolean>(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation | null>(null);

  // Form State (create/edit)
  const [formData, setFormData] = useState<CustomerFormData>({
    customerID: '',
    firmennameKundenname: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    notes: ''
  });
  const [errors, setErrors] = useState<CustomerFormErrors>({});

  // Initialisieren beim Öffnen/Wechsel
  useEffect(() => {
    if (!isOpen) return;

    setContacts((customer?.contacts as Contact[]) || []);

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
        street: customer.strasse || '',
        houseNumber: customer.hausnummer || '',
        postalCode: customer.plz || '',
        city: customer.ort || '',
        notes: customer.notizen || ''
      });
    }

    setErrors({});
    setShowAddContact(false);
    setEditingContact(null);
    setContactForm({ name: '', email: '', phone: '', position: '', notes: '', isPrimary: false });
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
  const startEditContact = (c: Contact): void => {
    setEditingContact(c);
    setContactForm({
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      position: c.position || '',
      notes: c.notes || '',
      isPrimary: (c as any).isPrimary || false
    });
  };

  const handleDeleteContact = (contactId: string): void => {
    // Formular schließen
    setEditingContact(null);
    setShowAddContact(false);
    setContactForm({ name: '', email: '', phone: '', position: '', notes: '', isPrimary: false });

    if (isView) {
      const c = contacts.find((x) => x.id === contactId);
      setDeleteConfirmation({ contactId, contactName: c?.name || 'Unbekannter Kontakt' });
    } else {
      setContacts((prev) => prev.filter((x) => x.id !== contactId));
    }
  };

  const confirmDeleteContact = async (): Promise<void> => {
    if (!deleteConfirmation) return;
    const updated = contacts.filter((x) => x.id !== deleteConfirmation.contactId);
    try {
      if (isView && customer) {
        const id = customer.id || customer.customerID;
        await updateCustomer(id, { ...customer, contacts: updated });
        showNotification('Kontakt erfolgreich gelöscht', NotificationType.SUCCESS);
      }
      setContacts(updated);
    } catch (err) {
      console.error('Error deleting contact:', err);
      showNotification('Fehler beim Löschen des Kontakts', NotificationType.ERROR);
    } finally {
      setDeleteConfirmation(null);
    }
  };

  const handleAddOrUpdateContact = async (): Promise<void> => {
    const required =
      contactForm.name.trim() &&
      contactForm.email.trim() &&
      contactForm.phone.trim();

    if (!required) {
      showNotification('Bitte füllen Sie alle Pflichtfelder aus', NotificationType.ERROR);
      return;
    }

    if (editingContact) {
      // Wenn dieser Kontakt als primär gesetzt wird, alle anderen auf isPrimary=false setzen
      const updatedContacts = contacts.map((c) =>
        c.id === editingContact.id
          ? { ...contactForm, id: editingContact.id, updatedAt: new Date().toISOString() }
          : contactForm.isPrimary ? { ...c, isPrimary: false } : c
      );

      try {
        if (isView && customer) {
          const id = customer.id || customer.customerID;
          await updateCustomer(id, { ...customer, contacts: updatedContacts });
          showNotification('Kontakt erfolgreich aktualisiert', NotificationType.SUCCESS);
        }
        setContacts(updatedContacts);
      } catch (err) {
        console.error('Error updating contact:', err);
        showNotification('Fehler beim Aktualisieren des Kontakts', NotificationType.ERROR);
      } finally {
        setEditingContact(null);
        setContactForm({ name: '', email: '', phone: '', position: '', notes: '', isPrimary: false });
      }
    } else {
      const newContact: Contact = {
        id: Date.now().toString(),
        ...contactForm,
        createdAt: new Date().toISOString()
      };
      // Wenn der neue Kontakt als primär gesetzt wird, alle anderen auf isPrimary=false setzen
      const existingContacts = contactForm.isPrimary
        ? contacts.map(c => ({ ...c, isPrimary: false }))
        : contacts;
      const updatedContacts = [...existingContacts, newContact];

      try {
        if (isView && customer) {
          const id = customer.id || customer.customerID;
          await updateCustomer(id, { ...customer, contacts: updatedContacts });
          showNotification('Kontakt erfolgreich hinzugefügt', NotificationType.SUCCESS);
        }
        setContacts(updatedContacts);
      } catch (err) {
        console.error('Error adding contact:', err);
        showNotification('Fehler beim Hinzufügen des Kontakts', NotificationType.ERROR);
      } finally {
        setShowAddContact(false);
        setContactForm({ name: '', email: '', phone: '', position: '', notes: '', isPrimary: false });
      }
    }
  };

  // Form-Validierung
  const validateForm = (): boolean => {
    const validationErrors = validateCustomerForm(formData, contacts.length, isCreate);
    setErrors(validationErrors);
    return !hasCustomerValidationErrors(validationErrors);
  };

  const handleChange = (field: keyof CustomerFormData | string, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof CustomerFormData]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Speichern
  const handleSubmit = async (onClose?: () => void): Promise<void> => {
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

    const payload: any = {
      firmennameKundenname: formData.firmennameKundenname,
      customerID,
      strasse: formData.street,
      hausnummer: formData.houseNumber,
      plz: formData.postalCode,
      ort: formData.city,
      notizen: formData.notes,
      contacts
    };

    try {
      if (isEdit && customer) {
        await updateCustomer(customer.id, {
          ...payload,
          createdAt: customer.createdAt,
          lastActivity: new Date()
        });
        showNotification('Kunde erfolgreich aktualisiert', NotificationType.SUCCESS);
      } else if (isCreate) {
        const result = await addCustomer({ ...payload, createdAt: new Date().toISOString() });
        const newCustomerId = (result as any)?.id || customerID;
        showNotification('Kunde erfolgreich hinzugefügt', NotificationType.SUCCESS);

        // Automatisch Projekt erstellen
        try {
          const projectID = computeNextProjectId(projects);
          const projectName = `${sanitizeCustomerName(payload.firmennameKundenname)}${random4()}`;
          const primaryContact = contacts[0] || null;

          await addProject({
            id: projectID,
            projectID,
            name: projectName,
            customerID: newCustomerId,
            customerName: payload.firmennameKundenname,
            street: formData.street,
            houseNumber: formData.houseNumber,
            postalCode: formData.postalCode,
            city: formData.city,
            status: 'Geplant',
            description: '',
            notes: '',
            contactPersonId: primaryContact?.id || '',
            contactPersonName: primaryContact?.name || ''
          } as any);
          showNotification(`Projekt "${projectName}" automatisch erstellt`, NotificationType.INFO);
        } catch (projErr) {
          console.error('Fehler beim automatischen Erstellen des Projekts:', projErr);
        }
      }
      onClose?.();
    } catch (err) {
      console.error('Fehler beim Speichern des Kunden:', err);
      showNotification('Fehler beim Speichern', NotificationType.ERROR);
    }
  };

  // Lokale Kontakt-Aktionen für Formular
  const handleLocalContactSubmit = (): void => {
    if (editingContact) {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === editingContact.id
            ? { ...contactForm, id: editingContact.id, updatedAt: new Date().toISOString() }
            : contactForm.isPrimary ? { ...c, isPrimary: false } : c
        )
      );
      setEditingContact(null);
    } else {
      const newContact = { id: Date.now().toString(), ...contactForm, createdAt: new Date().toISOString() };
      setContacts((prev) => {
        // Wenn der neue Kontakt primär ist, alle anderen auf isPrimary=false setzen
        const updated = contactForm.isPrimary
          ? prev.map(c => ({ ...c, isPrimary: false }))
          : prev;
        return [...updated, newContact];
      });
      setShowAddContact(false);
    }
    setContactForm({ name: '', email: '', phone: '', position: '', notes: '', isPrimary: false });
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
