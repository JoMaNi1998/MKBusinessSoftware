import React, { useEffect, useMemo, useState } from 'react';
import {
  Save,
  User,
  MapPin,
  Phone,
  Mail,
  Package,
  Edit,
  Trash2,
  Hash,
  Building,
  UserPlus,
  Euro
} from 'lucide-react';
import BaseModal from './BaseModal';
import { useProjects } from '../context/ProjectContext';
import { useCustomers } from '../context/CustomerContext';
import { useNotification } from '../context/NotificationContext';
import { useBookings } from '../context/BookingContext';
import { FirebaseService } from '../services/firebaseService';

/** Utils */
const cn = (...cls) => cls.filter(Boolean).join(' ');

const formatPrice = (price) => {
  if (price === null || price === undefined || price === '') return '0,00 €';
  const num = Number(price);
  if (Number.isNaN(num)) return '0,00 €';
  return `${num.toFixed(2).replace('.', ',')} €`;
};

const calculateCustomerTotalCosts = async (customerProjects, bookings) => {
  if (!customerProjects || customerProjects.length === 0) return 0;
  
  let totalCost = 0;
  
  // Sammle alle Material-IDs aus allen Projekten des Kunden
  const materialIds = new Set();
  const projectBookingsMap = {};
  
  customerProjects.forEach(project => {
    const projectBookings = bookings.filter(booking => booking.projectID === project.id);
    projectBookingsMap[project.id] = projectBookings;
    
    projectBookings.forEach(booking => {
      booking.materials?.forEach(material => {
        if (material.materialID) {
          materialIds.add(material.materialID);
        }
      });
    });
  });
  
  // Lade alle Materialien mit Preisen
  const materials = {};
  try {
    const allMaterials = await FirebaseService.getDocuments('materials');
    allMaterials.forEach(material => {
      if (materialIds.has(material.materialID)) {
        materials[material.materialID] = material;
      }
    });
  } catch (error) {
    console.error('Fehler beim Laden der Materialien für Kundenkostenberechnung:', error);
    return 0;
  }
  
  // Berechne Gesamtkosten für alle Projekte des Kunden
  Object.values(projectBookingsMap).forEach(projectBookings => {
    projectBookings.forEach(booking => {
      booking.materials?.forEach(bookingMaterial => {
        const material = materials[bookingMaterial.materialID];
        if (material && material.price && bookingMaterial.quantity) {
          const price = Number(material.price);
          const quantity = Number(bookingMaterial.quantity);
          if (!isNaN(price) && !isNaN(quantity)) {
            totalCost += price * quantity;
          }
        }
      });
    });
  });
  
  return totalCost;
};

const formatDate = (date) => {
  if (!date) return null;
  try {
    let d;
    if (date instanceof Date) d = date;
    else if (typeof date === 'string' || typeof date === 'number') d = new Date(date);
    else if (date.seconds) d = new Date(date.seconds * 1000); // Firestore Timestamp
    else return 'Ungültiges Datum';
    if (isNaN(d.getTime())) return 'Ungültiges Datum';
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return 'Ungültiges Datum';
  }
};

const computeNextCustomerId = (customers = []) => {
  const regex = /^KUN-(\d{3,})$/;
  const max = customers.reduce((acc, c) => {
    const id = c?.customerID;
    if (!id || typeof id !== 'string') return acc;
    const m = id.match(regex);
    if (!m) return acc;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) && n > acc ? n : acc;
    // eslint-disable-next-line
  }, 0);
  return `KUN-${String(max + 1).padStart(3, '0')}`;
};

const addressFromParts = ({ street, houseNumber, postalCode, city }) => {
  const s = (street || '').trim();
  const h = (houseNumber || '').trim();
  const p = (postalCode || '').trim();
  const c = (city || '').trim();
  if (!s && !h && !p && !c) return '';
  return `${s} ${h}, ${p} ${c}`.replace(/\s+,/g, ',').replace(/\s{2,}/g, ' ').trim();
};

/** Kontakt-Form (inline) */
const ContactForm = ({ value, onChange, onCancel, onSubmit, submitLabel = 'Hinzufügen' }) => {
  const v = value || { name: '', email: '', phone: '', position: '', notes: '' };
  const disabled =
    !v.name?.trim() || !v.position?.trim() || !v.email?.trim() || !v.phone?.trim();

  return (
    <div className="bg-gray-50 rounded-lg p-4 border">
      <h4 className="text-md font-medium text-gray-900 mb-4">
        {submitLabel === 'Aktualisieren' ? 'Kontakt bearbeiten' : 'Neuen Kontakt hinzufügen'}
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            type="text"
            value={v.name}
            onChange={(e) => onChange({ ...v, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Vor- und Nachname"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
          <input
            type="text"
            value={v.position}
            onChange={(e) => onChange({ ...v, position: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="z.B. Geschäftsführer, Projektleiter"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail *</label>
          <input
            type="email"
            value={v.email}
            onChange={(e) => onChange({ ...v, email: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="kontakt@beispiel.de"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
          <input
            type="tel"
            value={v.phone}
            onChange={(e) => onChange({ ...v, phone: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="+49 123 456789"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
          <textarea
            value={v.notes}
            onChange={(e) => onChange({ ...v, notes: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={2}
            placeholder="Zusätzliche Informationen..."
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Abbrechen
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
};

/** Kontakt-Liste */
const ContactList = ({ contacts, onEditClick, onDeleteClick }) => {
  if (!contacts || contacts.length === 0) {
    return (
      <div className="text-center py-8">
        <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Ansprechpartner</h3>
        <p className="mt-1 text-sm text-gray-500">Fügen Sie Ansprechpartner mit Kontaktdaten hinzu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {contacts.map((contact) => (
        <div key={contact.id} className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-900">{contact.name}</span>
              {contact.position && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  {contact.position}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEditClick?.(contact)}
                className="p-1 text-gray-400 hover:text-blue-600"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDeleteClick?.(contact.id)}
                className="p-1 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
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

          {contact.notes && <p className="text-sm text-gray-600 mt-2 italic">{contact.notes}</p>}
        </div>
      ))}
    </div>
  );
};

/** Hauptkomponente */
const CustomerModal = ({
  isOpen,
  onClose,
  mode = 'view', // "view" | "create" | "edit"
  customer,
  onEdit,
  onDelete,
  onProjectClick
}) => {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  const { getProjectsByCustomer } = useProjects();
  const { customers, addCustomer, updateCustomer } = useCustomers();
  const { showNotification } = useNotification();
  const { bookings = [] } = useBookings();

  /** ----- Gemeinsame State ----- */
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

  /** ----- View-spezifische States ----- */
  const [customerTotalCosts, setCustomerTotalCosts] = useState(0);
  const [loadingCosts, setLoadingCosts] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  // Für Form (create/edit)
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

    // Kontakte setzen (immer)
    setContacts(customer?.contacts || []);

    // Formular nur bei create/edit
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

  /** ----- Kontakt-Aktionen (geteilt) ----- */
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
      contactForm.position.trim() &&
      contactForm.email.trim() &&
      contactForm.phone.trim();

    if (!required) {
      showNotification('Bitte füllen Sie alle Pflichtfelder aus', 'error');
      return;
    }

    if (editingContact) {
      // Update
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
      // Add
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

  /** ----- Form-Validierung (create/edit) ----- */
  const validateForm = () => {
    const e = {};
    if (!formData.firmennameKundenname.trim()) e.firmennameKundenname = 'Firmenname/Kundenname ist erforderlich';
    if (!formData.street.trim()) e.street = 'Straße ist erforderlich';
    if (!formData.houseNumber.trim()) e.houseNumber = 'Hausnummer ist erforderlich';
    if (!formData.postalCode.trim()) e.postalCode = 'PLZ ist erforderlich';
    else if (!/^\d{5}$/.test(formData.postalCode.trim())) e.postalCode = 'PLZ muss 5 Ziffern haben';
    if (!formData.city.trim()) e.city = 'Stadt ist erforderlich';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  /** ----- Speichern (create/edit) ----- */
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
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
        await addCustomer({ ...payload, createdAt: new Date().toISOString() });
        showNotification('Kunde erfolgreich hinzugefügt', 'success');
      }
      onClose?.();
    } catch (err) {
      console.error('Fehler beim Speichern des Kunden:', err);
      showNotification('Fehler beim Speichern', 'error');
    }
  };

  /** ----- View-spezifisch ----- */
  const customerId = customer?.id || customer?.customerID;
  const customerProjects = useMemo(() => {
    if (!customerId) return [];
    return getProjectsByCustomer(customerId) || [];
  }, [getProjectsByCustomer, customerId]);

  /** ----- Kostenberechnung ----- */
  const loadCustomerCosts = async () => {
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
  };

  // Kosten laden wenn sich Projekte oder Buchungen ändern
  useEffect(() => {
    if (isView && customerProjects.length >= 0) {
      loadCustomerCosts();
    }
  }, [isView, customerProjects, bookings]);

  if (!isOpen) return null;

  const title = isView
    ? 'Kundendetails'
    : isEdit
    ? 'Kunde bearbeiten'
    : 'Neuen Kunden hinzufügen';

  const footerButtonsView = (
    <>
      <button
        onClick={() => {
          onEdit?.(customer);
          onClose?.(); // Detail schließen, wenn Edit geöffnet wird
        }}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
      >
        <Edit className="h-4 w-4" />
        <span>Bearbeiten</span>
      </button>
      <button
        onClick={() => {
          onDelete?.(customer?.id);
          onClose?.();
        }}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
      >
        <Trash2 className="h-4 w-4" />
        <span>Löschen</span>
      </button>
    </>
  );

  const footerButtonsForm = (
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
        form="customer-form"
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
      >
        <Save className="h-4 w-4" />
        <span>{isEdit ? 'Aktualisieren' : 'Hinzufügen'}</span>
      </button>
    </>
  );

  /** ----- RENDER ----- */
  if (isView && customer) {
    const addr =
      customer.address ||
      addressFromParts({
        street: customer.street,
        houseNumber: customer.houseNumber,
        postalCode: customer.postalCode,
        city: customer.city
      });

    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        icon={User}
        footerButtons={footerButtonsView}
      >
        <div className="space-y-6">
          {/* Kundeninformationen */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Kundeninformationen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Firmenname/Kundenname</span>
                </div>
                <p className="text-gray-900 ml-6">{customer.firmennameKundenname}</p>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Hash className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Kunden-ID</span>
                </div>
                <p className="text-gray-900 ml-6">{customer.customerID}</p>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Adresse</span>
                </div>
                <p className="text-gray-900 ml-6">{addr || 'Nicht angegeben'}</p>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Telefon</span>
                </div>
                <p className="text-gray-900 ml-6">{customer.phone || 'Nicht angegeben'}</p>
              </div>
            </div>
          </div>

          {/* Statistiken */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktive Projekte</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {customerProjects.filter((p) => p.status === 'Aktiv').length}
                  </p>
                </div>
                <Building className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gesamt Projekte</p>
                  <p className="text-2xl font-bold text-green-600">{customerProjects.length}</p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gesamtkosten</p>
                  {loadingCosts ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                      <span className="text-sm text-gray-500">Berechne...</span>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-orange-600">
                      {formatPrice(customerTotalCosts)}
                    </p>
                  )}
                </div>
                <Euro className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Kontakte */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Ansprechpartner ({contacts.length})
              </h3>
              <button
                onClick={() => {
                  setShowAddContact(true);
                  setEditingContact(null);
                  setContactForm({ name: '', email: '', phone: '', position: '', notes: '' });
                }}
                className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2 text-sm"
              >
                <UserPlus className="h-4 w-4" />
                <span>Kontakt hinzufügen</span>
              </button>
            </div>

            <ContactList
              contacts={contacts}
              onEditClick={startEditContact}
              onDeleteClick={handleDeleteContact}
            />

            {(showAddContact || editingContact) && (
              <ContactForm
                value={contactForm}
                onChange={setContactForm}
                onCancel={() => {
                  setShowAddContact(false);
                  setEditingContact(null);
                  setContactForm({ name: '', email: '', phone: '', position: '', notes: '' });
                }}
                onSubmit={handleAddOrUpdateContact}
                submitLabel={editingContact ? 'Aktualisieren' : 'Hinzufügen'}
              />
            )}
          </div>

          {/* Projekte */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
              Projekte ({customerProjects.length})
            </h3>

            {customerProjects.length === 0 ? (
              <div className="text-center py-8">
                <Building className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Projekte</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Für diesen Kunden wurden noch keine Projekte angelegt.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {customerProjects.map((project, index) => (
                  <div
                    key={index}
                    className="bg-white border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onProjectClick?.(project)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-900">{project.name}</span>
                        <span
                          className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            project.status === 'Aktiv'
                              ? 'bg-green-100 text-green-800'
                              : project.status === 'Abgeschlossen'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          )}
                        >
                          {project.status}
                        </span>
                      </div>
                      {project.startDate && (
                        <span className="text-sm text-gray-500">{formatDate(project.startDate)}</span>
                      )}
                    </div>

                    {project.description && (
                      <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                    )}

                    {project.endDate && (
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Ende: {formatDate(project.endDate)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete-Dialog (nur View) */}
        {deleteConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Kontakt löschen</h3>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  Möchten Sie den Kontakt <strong>{deleteConfirmation.contactName}</strong> wirklich
                  löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmation(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteContact}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                >
                  Löschen
                </button>
              </div>
            </div>
          </div>
        )}
      </BaseModal>
    );
  }

  /** ----- Create/Edit Form ----- */
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={User}
      footerButtons={footerButtonsForm}
    >
      <form id="customer-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Kunden-ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kunden-ID *</label>
          <input
            type="text"
            value={formData.customerID}
            readOnly
            placeholder="Wird automatisch generiert"
            className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
          />
        </div>

        {/* Firmenname/Kundenname */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Firmenname / Kundenname *
          </label>
          <input
            type="text"
            value={formData.firmennameKundenname}
            onChange={(e) => handleChange('firmennameKundenname', e.target.value)}
            className={cn(
              'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              errors.firmennameKundenname ? 'border-red-300' : 'border-gray-300'
            )}
            placeholder="z.B. Mustermann GmbH oder Max Mustermann"
          />
          {errors.firmennameKundenname && (
            <p className="mt-1 text-sm text-red-600">{errors.firmennameKundenname}</p>
          )}
        </div>

        {/* Adresse */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Straße *</label>
            <input
              type="text"
              value={formData.street}
              onChange={(e) => handleChange('street', e.target.value)}
              className={cn(
                'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                errors.street ? 'border-red-300' : 'border-gray-300'
              )}
              placeholder="z.B. Musterstraße"
            />
            {errors.street && <p className="mt-1 text-sm text-red-600">{errors.street}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hausnummer *</label>
            <input
              type="text"
              value={formData.houseNumber}
              onChange={(e) => handleChange('houseNumber', e.target.value)}
              className={cn(
                'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                errors.houseNumber ? 'border-red-300' : 'border-gray-300'
              )}
              placeholder="z.B. 123a"
            />
            {errors.houseNumber && <p className="mt-1 text-sm text-red-600">{errors.houseNumber}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PLZ *</label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => handleChange('postalCode', e.target.value)}
              className={cn(
                'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                errors.postalCode ? 'border-red-300' : 'border-gray-300'
              )}
              placeholder="z.B. 12345"
              maxLength={5}
              inputMode="numeric"
            />
            {errors.postalCode && <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stadt *</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className={cn(
                'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                errors.city ? 'border-red-300' : 'border-gray-300'
              )}
              placeholder="z.B. Musterstadt"
            />
            {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
          </div>
        </div>

        {/* Notizen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={3}
            placeholder="Zusätzliche Informationen..."
          />
        </div>

        {/* Ansprechpartner (lokal verwaltet) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Ansprechpartner ({contacts.length})</h3>
            <button
              type="button"
              onClick={() => {
                setShowAddContact(true);
                setEditingContact(null);
                setContactForm({ name: '', email: '', phone: '', position: '', notes: '' });
              }}
              className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2 text-sm"
            >
              <UserPlus className="h-4 w-4" />
              <span>Kontakt hinzufügen</span>
            </button>
          </div>

          {/* Liste */}
          {contacts.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <UserPlus className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Noch keine Ansprechpartner hinzugefügt</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div key={contact.id} className="bg-gray-50 border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900">{contact.name}</span>
                      {contact.position && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                          {contact.position}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => startEditContact(contact)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs">
                    {contact.email && (
                      <div className="flex items-center space-x-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">{contact.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {(showAddContact || editingContact) && (
            <ContactForm
              value={contactForm}
              onChange={setContactForm}
              onCancel={() => {
                setShowAddContact(false);
                setEditingContact(null);
                setContactForm({ name: '', email: '', phone: '', position: '', notes: '' });
              }}
              onSubmit={() => {
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
              }}
              submitLabel={editingContact ? 'Aktualisieren' : 'Hinzufügen'}
            />
          )}
        </div>
      </form>
    </BaseModal>
  );
};

export default CustomerModal;

/** Kompatibilitäts-Wrapper – drop-in replacement */
export const CustomerDetailModal = ({ isOpen, onClose, customer, onEdit, onDelete, onProjectClick }) => (
  <CustomerModal
    isOpen={isOpen}
    onClose={onClose}
    mode="view"
    customer={customer}
    onEdit={onEdit}
    onDelete={onDelete}
    onProjectClick={onProjectClick}
  />
);

export const AddCustomerModal = ({ isOpen, onClose, customer = null }) => (
  <CustomerModal
    isOpen={isOpen}
    onClose={onClose}
    mode={customer ? 'edit' : 'create'}
    customer={customer}
  />
);
