import React, { ChangeEvent, FormEvent, useState, useEffect } from 'react';
import { Building, User, UserCheck, FileText, MapPin, Calendar, Users } from 'lucide-react';
import { PROJECT_STATUS_OPTIONS } from '@utils/projectHelpers';
import { cn } from '@utils/customerHelpers';
import { UserService, FirestoreUser } from '@services/UserService';
import type { Customer } from '@app-types';

interface Contact {
  id: string;
  name: string;
  position?: string;
  email: string;
  phone?: string;
  notes?: string;
}

interface FormData {
  projectID: string;
  name: string;
  customerID: string;
  contactPersonId: string;
  description: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  status: string;
  notes: string;
  startDate: string;
  endDate: string;
  assignedUsers: string[];
}

interface FormErrors {
  [key: string]: string;
}

interface ProjectFormProps {
  formData: FormData;
  errors: FormErrors;
  customersList: Customer[];
  selectedCustomerContacts: Contact[];
  onInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onCustomerChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  onContactPersonChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  onAssignedUsersChange: (userIds: string[]) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  formData,
  errors,
  customersList,
  selectedCustomerContacts,
  onInputChange,
  onCustomerChange,
  onContactPersonChange,
  onAssignedUsersChange,
  onSubmit
}) => {
  // State für verfügbare Monteure
  const [availableUsers, setAvailableUsers] = useState<FirestoreUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Monteure beim Mount laden
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        // Lade alle User (Monteure + Projektleiter können zugewiesen werden)
        const users = await UserService.getAllUsers();
        // Filtere nur monteur und projektleiter
        const assignableUsers = users.filter(
          u => u.role === 'monteur' || u.role === 'projektleiter'
        );
        setAvailableUsers(assignableUsers);
      } catch (error) {
        console.error('Fehler beim Laden der Benutzer:', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

  // Handler für Checkbox-Änderungen
  const handleUserToggle = (userId: string) => {
    const currentUsers = formData.assignedUsers || [];
    if (currentUsers.includes(userId)) {
      onAssignedUsersChange(currentUsers.filter(id => id !== userId));
    } else {
      onAssignedUsersChange([...currentUsers, userId]);
    }
  };

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
              {c.firmennameKundenname || 'Unbekannter Kunde'}
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
          {PROJECT_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Mitarbeiter-Zuweisung */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Users className="h-4 w-4 inline mr-1" />
          Zugewiesene Mitarbeiter
        </label>
        {loadingUsers ? (
          <div className="flex items-center justify-center py-4 text-gray-500">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500 mr-2" />
            Lade Mitarbeiter...
          </div>
        ) : availableUsers.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-500">
              Keine zuweisbaren Mitarbeiter vorhanden.
            </p>
          </div>
        ) : (
          <div className="border border-gray-300 rounded-lg divide-y divide-gray-200 max-h-48 overflow-y-auto">
            {availableUsers.map((user) => {
              const isChecked = (formData.assignedUsers || []).includes(user.id);
              return (
                <label
                  key={user.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                    isChecked ? 'bg-primary-50' : 'hover:bg-gray-50'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleUserToggle(user.id)}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.role === 'monteur' ? 'Monteur' : 'Projektleiter'}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        )}
        {(formData.assignedUsers?.length || 0) > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {formData.assignedUsers?.length} Mitarbeiter zugewiesen
          </p>
        )}
      </div>

      {/* Projektdaten (Start- und Enddatum) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="h-4 w-4 inline mr-1" />
          Projektzeitraum
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Startdatum</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={onInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Enddatum</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={onInputChange}
              min={formData.startDate}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Optional - für die Anzeige im Projektkalender
        </p>
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
