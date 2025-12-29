import React, { MouseEvent } from 'react';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import type { Customer } from '@app-types';

interface CustomerActionsMenuProps {
  customer: Customer;
  dropdownOpen: string | null;
  setDropdownOpen: (id: string | null) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
}

const CustomerActionsMenu: React.FC<CustomerActionsMenuProps> = ({
  customer,
  dropdownOpen,
  setDropdownOpen,
  onEdit,
  onDelete
}) => {
  return (
    <div className="relative" onClick={(e: MouseEvent) => e.stopPropagation()}>
      <button
        onClick={(e: MouseEvent) => {
          e.stopPropagation();
          setDropdownOpen(dropdownOpen === customer.id ? null : customer.id);
        }}
        className="text-gray-400 hover:text-gray-600"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {dropdownOpen === customer.id && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
          <div className="py-1">
            <button
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                onEdit(customer);
              }}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
            >
              <Edit className="h-4 w-4 mr-2" />
              Bearbeiten
            </button>
            <button
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                onDelete(customer.id);
              }}
              className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerActionsMenu;
