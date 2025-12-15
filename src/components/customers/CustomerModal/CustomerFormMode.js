import React from 'react';
import { User, Save, Mail, Phone, Edit, Trash2, UserPlus } from 'lucide-react';
import { BaseModal } from '../../shared';
import { cn } from '../shared/customerUtils';
import ContactForm from './ContactForm';

const CustomerFormMode = ({
  isOpen,
  onClose,
  isEdit,
  // Hook-Props
  contacts,
  showAddContact,
  setShowAddContact,
  editingContact,
  setEditingContact,
  contactForm,
  setContactForm,
  formData,
  errors,
  setErrors,
  startEditContact,
  handleDeleteContact,
  handleChange,
  handleSubmit,
  handleLocalContactSubmit
}) => {
  const title = isEdit ? 'Kunde bearbeiten' : 'Neuen Kunden hinzufügen';

  const footerButtons = (
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

  const onSubmit = (e) => {
    e?.preventDefault?.();
    handleSubmit(onClose);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={User}
      footerButtons={footerButtons}
    >
      <form id="customer-form" onSubmit={onSubmit} className="space-y-6">
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

        {/* Ansprechpartner */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Ansprechpartner ({contacts.length}) *</h3>
            <button
              type="button"
              onClick={() => {
                setShowAddContact(true);
                setEditingContact(null);
                setContactForm({ name: '', email: '', phone: '', position: '', notes: '' });
                if (errors.contacts) {
                  setErrors((prev) => ({ ...prev, contacts: '' }));
                }
              }}
              className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2 text-sm"
            >
              <UserPlus className="h-4 w-4" />
              <span>Kontakt hinzufügen</span>
            </button>
          </div>

          {errors.contacts && !showAddContact && (
            <p className="text-sm text-red-600">{errors.contacts}</p>
          )}

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
              onSubmit={handleLocalContactSubmit}
              submitLabel={editingContact ? 'Aktualisieren' : 'Hinzufügen'}
            />
          )}
        </div>
      </form>
    </BaseModal>
  );
};

export default CustomerFormMode;
