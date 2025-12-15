import MaterialModal from './MaterialModal';

export { default as MaterialModal } from './MaterialModal';

// Kompatibilitäts-Wrapper für bestehenden Code
export const MaterialDetailModal = ({ isOpen, onClose, material, onEdit, onDelete }) => (
  <MaterialModal
    isOpen={isOpen}
    onClose={onClose}
    mode="view"
    material={material}
    onEdit={onEdit}
    onDelete={onDelete}
  />
);

export const AddMaterialModal = ({ isOpen, onClose, material, onSave }) => (
  <MaterialModal
    isOpen={isOpen}
    onClose={onClose}
    mode={material ? 'edit' : 'create'}
    material={material}
    onSave={onSave}
  />
);
