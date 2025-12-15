/**
 * CustomerStep - Schritt 0: Kunde & Projekt auswählen
 */

import React from 'react';

const CustomerStep = ({
  customers,
  customerProjects,
  selectedCustomer,
  setSelectedCustomer,
  selectedProject,
  setSelectedProject,
  hasFieldError,
  clearFieldError,
}) => {
  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);

  return (
    <div className="space-y-6">
      {/* Kundenauswahl */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kunde <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedCustomer}
          onChange={(e) => {
            setSelectedCustomer(e.target.value);
            setSelectedProject('');
            clearFieldError('Kunde');
          }}
          className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
            hasFieldError('Kunde') ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
        >
          <option value="">Kunde auswählen...</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>
              {c.firmennameKundenname || c.name}
            </option>
          ))}
        </select>
        {hasFieldError('Kunde') && (
          <p className="text-red-600 text-xs mt-1">Bitte wählen Sie einen Kunden aus</p>
        )}
      </div>

      {/* Projektauswahl */}
      {selectedCustomer && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Projekt <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value);
              clearFieldError('Projekt');
            }}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
              hasFieldError('Projekt') ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Bitte Projekt auswählen</option>
            {customerProjects.map(p => (
              <option key={p.id} value={p.id}>
                {p.projektname || p.name}
              </option>
            ))}
          </select>
          {hasFieldError('Projekt') && (
            <p className="text-red-600 text-xs mt-1">Bitte wählen Sie ein Projekt aus</p>
          )}
          {customerProjects.length === 0 && (
            <p className="text-amber-600 text-xs mt-1">
              Keine Projekte für diesen Kunden vorhanden. Bitte erst ein Projekt anlegen.
            </p>
          )}
        </div>
      )}

      {/* Kundeninfo-Preview */}
      {selectedCustomerData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <p className="text-sm text-blue-600 mb-1">Ausgewählter Kunde:</p>
          <p className="font-medium text-blue-900">
            {selectedCustomerData.firmennameKundenname || selectedCustomerData.name}
          </p>
          {selectedCustomerData.strasse && (
            <p className="text-sm text-blue-700">{selectedCustomerData.strasse}</p>
          )}
          {selectedCustomerData.plz && (
            <p className="text-sm text-blue-700">
              {selectedCustomerData.plz} {selectedCustomerData.ort}
            </p>
          )}
        </div>
      )}

    </div>
  );
};

export default CustomerStep;
