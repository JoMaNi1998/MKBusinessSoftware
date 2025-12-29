/**
 * AddMaterialModal - Modal zum manuellen Hinzufügen von Materialien zur BOM
 */

import React, { useState, ChangeEvent } from 'react';
import { Search, Plus, Minus, Trash2 } from 'lucide-react';
import { BaseModal } from '@components/shared';
import type { Material } from '@app-types';

interface SelectedMaterial {
  materialID: string;
  description: string;
  quantity: number;
}

interface AddMaterialModalProps {
  materials: Material[];
  onAddMaterial: (materialID: string, quantity: number) => void;
  onClose: () => void;
}

const AddMaterialModal: React.FC<AddMaterialModalProps> = ({ materials, onAddMaterial, onClose }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);

  const filteredMaterials = materials.filter((material: Material) =>
    material.materialID && material.description &&
    (material.materialID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addToSelection = (material: Material) => {
    const existing = selectedMaterials.find(item => item.materialID === material.materialID);
    if (existing) {
      setSelectedMaterials(prev =>
        prev.map(item =>
          item.materialID === material.materialID
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedMaterials(prev => [...prev, {
        materialID: material.materialID || material.id,
        description: material.description || material.bezeichnung || '',
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (materialID: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedMaterials(prev => prev.filter(item => item.materialID !== materialID));
    } else {
      setSelectedMaterials(prev =>
        prev.map(item =>
          item.materialID === materialID
            ? { ...item, quantity: quantity }
            : item
        )
      );
    }
  };

  const handleAddAll = () => {
    selectedMaterials.forEach(item => {
      onAddMaterial(item.materialID, item.quantity);
    });
    onClose();
  };

  const footerButtons = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        Abbrechen
      </button>
      <button
        type="button"
        onClick={handleAddAll}
        disabled={selectedMaterials.length === 0}
        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Hinzufügen ({selectedMaterials.length})
      </button>
    </>
  );

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Material hinzufügen"
      icon={Plus}
      footerButtons={footerButtons}
      maxWidth="max-w-4xl"
    >
      {/* Suchfeld */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Material suchen..."
          />
        </div>
      </div>

      {/* Materialien Liste */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Verfügbare Materialien</h4>
        <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-md">
          {filteredMaterials.map((material: Material) => (
            <div key={material.id} className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {material.description}
                </div>
                <div className="text-sm text-gray-500">
                  {material.materialID} | Lager: {material.stock || 0} Stück
                </div>
              </div>
              <button
                onClick={() => addToSelection(material)}
                className="ml-3 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ))}
          {filteredMaterials.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              Keine Materialien gefunden
            </div>
          )}
        </div>
      </div>

      {/* Ausgewählte Materialien */}
      {selectedMaterials.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Ausgewählte Materialien</h4>
          <div className="space-y-2">
            {selectedMaterials.map((item: SelectedMaterial) => (
              <div key={item.materialID} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{item.description}</div>
                  <div className="text-xs text-gray-500">{item.materialID}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.materialID, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.materialID, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => updateQuantity(item.materialID, 0)}
                    className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-100 rounded ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </BaseModal>
  );
};

export default AddMaterialModal;
