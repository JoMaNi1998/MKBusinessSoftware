import React from 'react';
import { User, Mail, Phone, Edit, Trash2, UserPlus } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  position?: string;
  notes?: string;
}

interface ContactListProps {
  contacts: Contact[];
  onEditClick?: (contact: Contact) => void;
  onDeleteClick?: (contactId: string) => void;
}

const ContactList: React.FC<ContactListProps> = ({ contacts, onEditClick, onDeleteClick }) => {
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

export default ContactList;
