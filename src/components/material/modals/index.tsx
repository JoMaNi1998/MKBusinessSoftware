import React from 'react';
import MaterialModal from './MaterialModal';
import type { Material } from '@app-types';

export { default as MaterialModal } from './MaterialModal';

interface MaterialDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material;
  onEdit: (material: Material) => void;
  onDelete: (materialId: string) => void;
}

// Kompatibilitäts-Wrapper für bestehenden Code
export const MaterialDetailModal: React.FC<MaterialDetailModalProps> = ({
  isOpen,
  onClose,
  material,
  onEdit,
  onDelete
}) => (
  <MaterialModal
    isOpen={isOpen}
    onClose={onClose}
    mode="view"
    material={material}
    onEdit={onEdit}
    onDelete={onDelete}
  />
);

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  material?: Material;
  onSave: (material: Material) => void;
}

export const AddMaterialModal: React.FC<AddMaterialModalProps> = ({
  isOpen,
  onClose,
  material,
  onSave
}) => (
  <MaterialModal
    isOpen={isOpen}
    onClose={onClose}
    mode={material ? 'edit' : 'create'}
    material={material}
    onSave={onSave}
  />
);
