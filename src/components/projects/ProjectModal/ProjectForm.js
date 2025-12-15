import React from 'react';
import { Building, User, UserCheck, FileText, MapPin } from 'lucide-react';
import { STATUS_OPTIONS } from '../constants';
import { cn } from '../utils';

const ProjectForm = ({
  formData,
  errors,
  customersList,
  selectedCustomerContacts,
  onInputChange,
  onCustomerChange,
  onContactPersonChange,
  onSubmit
}) => {
  return (
    <form id="project-form" onSubmit={onSubmit} className="space-y-6">
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

      {/* Projektname */}
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
          onChange={onCustomerChange}
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
            onChange={onContactPersonChange}
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
          onChange={onInputChange}
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
              onChange={onInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Straße"
            />
          </div>
          <div>
            <input
              type="text"
              name="houseNumber"
              value={formData.houseNumber}
              onChange={onInputChange}
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
              onChange={onInputChange}
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
              onChange={onInputChange}
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
          onChange={onInputChange}
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
          onChange={onInputChange}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Zusätzliche Notizen..."
        />
      </div>
    </form>
  );
};

export default ProjectForm;
