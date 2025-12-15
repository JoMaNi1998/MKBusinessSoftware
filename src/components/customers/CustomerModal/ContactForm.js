import React from 'react';

const ContactForm = ({ value, onChange, onCancel, onSubmit, submitLabel = 'Hinzufügen' }) => {
  const v = value || { name: '', email: '', phone: '', position: '', notes: '' };
  const disabled = !v.name?.trim() || !v.email?.trim() || !v.phone?.trim();

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
          <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
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

export default ContactForm;
