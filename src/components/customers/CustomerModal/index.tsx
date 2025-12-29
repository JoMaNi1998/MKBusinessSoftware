import React from 'react';
import { useCustomerModal } from '@hooks';
import CustomerViewMode from './CustomerViewMode';
import CustomerFormMode from './CustomerFormMode';
import type { Customer, Project } from '@app-types';
import type { CustomerModalMode } from '@app-types/components/customer.types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: CustomerModalMode;
  customer?: Customer | null;
  onEdit?: (customer: Customer) => void;
  onDelete?: (customerId: string) => void;
  onProjectClick?: (project: Project) => void;
}

/**
 * Hauptkomponente für Kunden-Modal
 * Modi: "view" | "create" | "edit"
 */
const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  mode = 'view',
  customer,
  onEdit,
  onDelete,
  onProjectClick
}) => {
  const hook = useCustomerModal({ isOpen, mode, customer });

  if (!isOpen) return null;

  // View-Modus
  if (hook.isView && customer) {
    return (
      <CustomerViewMode
        isOpen={isOpen}
        onClose={onClose}
        customer={customer}
        onEdit={onEdit}
        onDelete={onDelete}
        onProjectClick={onProjectClick}
        {...hook}
      />
    );
  }

  // Create/Edit-Modus
  // Destructure hook to avoid duplicate isEdit prop
  const { isEdit, isView: _isView, isCreate: _isCreate, ...hookRest } = hook;
  return (
    <CustomerFormMode
      isOpen={isOpen}
      onClose={onClose}
      isEdit={isEdit}
      {...hookRest}
    />
  );
};

export default CustomerModal;

/**
 * Kompatibilitäts-Wrapper für CustomerDetailModal
 */
interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onEdit?: (customer: Customer) => void;
  onDelete?: (customerId: string) => void;
  onProjectClick?: (project: Project) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  onEdit,
  onDelete,
  onProjectClick
}) => (
  <CustomerModal
    isOpen={isOpen}
    onClose={onClose}
    mode="view"
    customer={customer}
    onEdit={onEdit}
    onDelete={onDelete}
    onProjectClick={onProjectClick}
  />
);

/**
 * Kompatibilitäts-Wrapper für AddCustomerModal
 */
interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  customer = null
}) => (
  <CustomerModal
    isOpen={isOpen}
    onClose={onClose}
    mode={customer ? 'edit' : 'create'}
    customer={customer}
  />
);
