import React from 'react';
import type { Offer } from '@app-types';
import { BaseModal } from '@components/shared';

interface DeleteOfferModalProps {
  isOpen: boolean;
  offer: Offer | null;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteOfferModal: React.FC<DeleteOfferModalProps> = ({
  isOpen,
  offer,
  onClose,
  onConfirm
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Angebot löschen"
      size="sm"
    >
      <div className="p-6">
        <p className="text-gray-600 mb-4">
          Möchten Sie das Angebot <strong>{offer?.offerNumber}</strong> wirklich löschen?
          Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Löschen
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default DeleteOfferModal;
