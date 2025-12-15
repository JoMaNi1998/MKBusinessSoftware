import React from 'react';

const CustomerStep = ({
  customers,
  projects,
  selectedCustomer,
  selectedProject,
  customerProjects,
  validationErrors,
  onCustomerChange,
  onProjectChange
}) => {
  const customer = customers.find(c => c.id === selectedCustomer);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kunde <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedCustomer}
            onChange={(e) => onCustomerChange(e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
              validationErrors.customer ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Kunde auswählen...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.firmennameKundenname || c.name}
              </option>
            ))}
          </select>
          {validationErrors.customer && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.customer}</p>
          )}
        </div>

        {selectedCustomer && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Projekt (optional)
            </label>
            <select
              value={selectedProject}
              onChange={(e) => onProjectChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Kein Projekt ausgewählt</option>
              {customerProjects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.projektname || p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Kundeninfo-Preview */}
        {customer && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-600 mb-1">Ausgewählter Kunde:</p>
            <p className="font-medium text-blue-900">{customer.firmennameKundenname || customer.name}</p>
            {customer.strasse && <p className="text-sm text-blue-700">{customer.strasse}</p>}
            {customer.plz && customer.ort && (
              <p className="text-sm text-blue-700">{customer.plz} {customer.ort}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerStep;
