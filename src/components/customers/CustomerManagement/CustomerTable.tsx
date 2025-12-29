import React, { ChangeEvent } from 'react';
import { MapPin, Filter, Users } from 'lucide-react';
import CustomerActionsMenu from './CustomerActionsMenu';
import type { CustomerTableProps } from '@app-types/components/customer.types';

const CustomerTable: React.FC<CustomerTableProps> = ({
  filteredCustomers,
  visibleColumns,
  searchTerm,
  dropdownOpen,
  setDropdownOpen,
  activeColumnFilter,
  setActiveColumnFilter,
  columnFilters,
  uniqueCities,
  handleColumnFilterChange,
  handleCustomerClick,
  handleEditCustomer,
  handleDeleteCustomer
}) => {
  return (
    <div className="hidden md:block h-full overflow-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            {visibleColumns.kunde && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kunde
              </th>
            )}
            {visibleColumns.adresse && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <span>Adresse</span>
                  <div className="relative">
                    <button
                      onClick={() => setActiveColumnFilter(activeColumnFilter === 'city' ? null : 'city')}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <Filter className="h-3 w-3" />
                    </button>
                    {activeColumnFilter === 'city' && (
                      <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-30 border border-gray-200">
                        <div className="p-2">
                          <select
                            value={columnFilters.city}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleColumnFilterChange('city', e.target.value)}
                            className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                          >
                            {uniqueCities.map(city => (
                              <option key={city} value={city}>
                                {city === 'alle' ? 'Alle Städte' : city}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </th>
            )}
            {visibleColumns.telefon && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Telefon
              </th>
            )}
            {visibleColumns.email && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
            )}
            {visibleColumns.aktionen && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredCustomers.map((customer) => (
            <tr
              key={customer.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => handleCustomerClick(customer)}
            >
              {visibleColumns.kunde && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {customer.firmennameKundenname}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {customer.customerID}
                    </div>
                  </div>
                </td>
              )}
              {visibleColumns.adresse && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {customer.strasse}, {customer.plz} {customer.ort}
                </td>
              )}
              {visibleColumns.telefon && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {(customer.contacts as any)?.[0]?.phone || '-'}
                </td>
              )}
              {visibleColumns.email && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {(customer.contacts as any)?.[0]?.email || '-'}
                </td>
              )}
              {visibleColumns.aktionen && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <CustomerActionsMenu
                    customer={customer}
                    dropdownOpen={dropdownOpen}
                    setDropdownOpen={setDropdownOpen}
                    onEdit={handleEditCustomer}
                    onDelete={handleDeleteCustomer}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Kunden gefunden</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? 'Versuchen Sie andere Suchbegriffe.'
              : 'Beginnen Sie mit dem Hinzufügen Ihres ersten Kunden.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerTable;
