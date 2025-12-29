import React from 'react';
import { MapPin, Users } from 'lucide-react';
import type { CustomerCardProps } from '@app-types/components/customer.types';

const CustomerCard: React.FC<CustomerCardProps> = ({
  filteredCustomers,
  visibleColumns,
  searchTerm,
  handleCustomerClick
}) => {
  return (
    <div className="md:hidden h-full overflow-auto p-4 space-y-3">
      {filteredCustomers.map((customer) => (
        <div
          key={customer.id}
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm active:bg-gray-50"
          onClick={() => handleCustomerClick(customer)}
        >
          {/* Kunde (immer sichtbar) */}
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{customer.firmennameKundenname}</p>
              <p className="text-sm text-gray-500">{customer.customerID}</p>
            </div>
          </div>

          {/* Adresse */}
          {visibleColumns.adresse && (
            <div className="mt-2 flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0" />
              <span className="truncate">{customer.strasse}, {customer.plz} {customer.ort}</span>
            </div>
          )}

          {/* Telefon + Email (vom ersten Ansprechpartner) */}
          {(visibleColumns.telefon || visibleColumns.email) && (
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
              {visibleColumns.telefon && (customer.contacts as any)?.[0]?.phone && (
                <span>{(customer.contacts as any)[0].phone}</span>
              )}
              {visibleColumns.email && (customer.contacts as any)?.[0]?.email && (
                <span className="truncate">{(customer.contacts as any)[0].email}</span>
              )}
            </div>
          )}
        </div>
      ))}

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Kunden gefunden</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Versuchen Sie andere Suchbegriffe.' : 'Beginnen Sie mit dem Hinzufügen Ihres ersten Kunden.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerCard;
