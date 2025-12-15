import React from 'react';
import useCustomerModal from './useCustomerModal';
import CustomerViewMode from './CustomerViewMode';
import CustomerFormMode from './CustomerFormMode';

/**
 * Hauptkomponente für Kunden-Modal
 * Modi: "view" | "create" | "edit"
 */
const CustomerModal = ({
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
  return (
    <CustomerFormMode
      isOpen={isOpen}
      onClose={onClose}
      isEdit={hook.isEdit}
      {...hook}
    />
  );
};

export default CustomerModal;

/**
 * Kompatibilitäts-Wrapper für CustomerDetailModal
 */
export const CustomerDetailModal = ({ isOpen, onClose, customer, onEdit, onDelete, onProjectClick }) => (
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
export const AddCustomerModal = ({ isOpen, onClose, customer = null }) => (
  <CustomerModal
    isOpen={isOpen}
    onClose={onClose}
    mode={customer ? 'edit' : 'create'}
    customer={customer}
  />
);
