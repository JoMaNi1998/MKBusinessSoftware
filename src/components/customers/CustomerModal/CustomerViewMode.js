import React from 'react';
import { User, Hash, MapPin, Phone, UserPlus, Edit, Trash2 } from 'lucide-react';
import { BaseModal } from '../../shared';
import { addressFromParts } from '../shared/customerUtils';
import CustomerStats from './CustomerStats';
import CustomerProjects from './CustomerProjects';
import ContactList from './ContactList';
import ContactForm from './ContactForm';

const CustomerViewMode = ({
  isOpen,
  onClose,
  customer,
  onEdit,
  onDelete,
  onProjectClick,
  // Hook-Props
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
  customerProjects,
  startEditContact,
  handleDeleteContact,
  confirmDeleteContact,
  handleAddOrUpdateContact
}) => {
  const addr =
    customer.address ||
    addressFromParts({
      street: customer.street,
      houseNumber: customer.houseNumber,
      postalCode: customer.postalCode,
      city: customer.city
    });

  const footerButtons = (
    <>
      <button
        onClick={() => {
          onEdit?.(customer);
          onClose?.();
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

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Kundendetails"
      icon={User}
      footerButtons={footerButtons}
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
        <CustomerStats
          customerProjects={customerProjects}
          customerTotalCosts={customerTotalCosts}
          loadingCosts={loadingCosts}
        />

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
          <CustomerProjects
            customerProjects={customerProjects}
            onProjectClick={onProjectClick}
          />
        </div>
      </div>

      {/* Delete-Dialog */}
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
};

export default CustomerViewMode;
