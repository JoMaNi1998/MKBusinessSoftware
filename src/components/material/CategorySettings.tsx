import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Database
} from 'lucide-react';
import { FirebaseService } from '@services/firebaseService';
import { useNotification } from '@context/NotificationContext';
import { useConfirm } from '@context/ConfirmContext';
import { BaseModal, BasePage } from '@components/shared';
import type { Category, Specification } from '@app-types';
import { NotificationType } from '@app-types';

interface CategorySpec {
  name: string;
  unit: string;
}

interface SpecificationsMap {
  [categoryId: string]: Specification[];
}

const CategorySettings: React.FC = () => {
  const { showNotification } = useNotification();
  const { confirmDelete } = useConfirm();

  // Kategorie- und Spezifikations-Management
  const [categories, setCategories] = useState<Category[]>([]);
  const [specifications, setSpecifications] = useState<SpecificationsMap>({});
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [categorySpecs, setCategorySpecs] = useState<CategorySpec[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showIds, setShowIds] = useState<boolean>(false);

  // Kategorie- und Spezifikations-Funktionen
  const loadCategoriesAndSpecs = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const categoriesData = await FirebaseService.getDocuments<Category>('categories');
      const specsData = await FirebaseService.getDocuments<Specification>('specifications');

      setCategories(categoriesData || []);

      // Spezifikationen nach Kategorien gruppieren
      const specsMap: SpecificationsMap = {};
      specsData.forEach(spec => {
        if (!specsMap[spec.categoryId]) {
          specsMap[spec.categoryId] = [];
        }
        specsMap[spec.categoryId].push(spec);
      });
      setSpecifications(specsMap);
    } catch (error) {
      console.error('Fehler beim Laden der Kategorien:', error);
      showNotification('Fehler beim Laden der Kategorien', NotificationType.ERROR);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Load categories and specs on component mount
  useEffect(() => {
    loadCategoriesAndSpecs();
  }, [loadCategoriesAndSpecs]);

  const handleAddCategory = async (): Promise<void> => {
    if (!newCategoryName.trim()) {
      showNotification('Bitte Kategoriename eingeben', NotificationType.ERROR);
      return;
    }

    // Überprüfung auf doppelte Kategorienamen
    const existingCategory = categories.find(cat =>
      cat.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    );

    if (existingCategory) {
      showNotification('Eine Kategorie mit diesem Namen existiert bereits', NotificationType.ERROR);
      return;
    }

    try {
      const categoryData = {
        name: newCategoryName,
        createdAt: new Date()
      };

      // Kategorie erst speichern, um die ID zu erhalten
      const savedCategory = await FirebaseService.addDocument<Category>('categories', categoryData);
      const categoryId = savedCategory.id || newCategoryName;

      // Spezifikationen separat speichern mit der korrekten categoryId
      for (const spec of categorySpecs) {
        const cleanSpec = {
          name: spec.name,
          label: spec.name, // Verwende name auch als label
          type: 'text' as const, // Immer text, wie gewünscht
          required: true, // Alle Spezifikationen sind Pflichtfelder
          unit: spec.unit || '',
          categoryId: categoryId,
          createdAt: new Date()
        };
        await FirebaseService.addDocument('specifications', cleanSpec);
      }

      showNotification('Kategorie erfolgreich hinzugefügt', NotificationType.SUCCESS);
      setIsAddCategoryModalOpen(false);
      setNewCategoryName('');
      setCategorySpecs([]);
      loadCategoriesAndSpecs();
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Kategorie:', error);
      showNotification('Fehler beim Hinzufügen der Kategorie', NotificationType.ERROR);
    }
  };

  const handleDeleteCategory = async (categoryId: string): Promise<void> => {
    const category = categories.find(c => c.id === categoryId);
    const categoryName = category?.name || 'diese Kategorie';

    const confirmed = await confirmDelete(categoryName, 'Kategorie');
    if (!confirmed) {
      return;
    }

    try {
      await FirebaseService.deleteDocument('categories', categoryId);

      // Alle Spezifikationen dieser Kategorie löschen
      const categorySpecsToDelete = specifications[categoryId] || [];
      for (const spec of categorySpecsToDelete) {
        await FirebaseService.deleteDocument('specifications', spec.id);
      }

      showNotification('Kategorie erfolgreich gelöscht', NotificationType.SUCCESS);
      loadCategoriesAndSpecs();
    } catch (error) {
      console.error('Fehler beim Löschen der Kategorie:', error);
      showNotification('Fehler beim Löschen der Kategorie', NotificationType.ERROR);
    }
  };

  const handleAddSpecification = (): void => {
    setCategorySpecs([...categorySpecs, {
      name: '',
      unit: ''
    }]);
  };

  const handleUpdateSpecification = (index: number, field: keyof CategorySpec, value: string): void => {
    const updatedSpecs = [...categorySpecs];
    updatedSpecs[index] = {
      ...updatedSpecs[index],
      [field]: value
    };
    setCategorySpecs(updatedSpecs);
  };

  const handleRemoveSpecification = (index: number): void => {
    setCategorySpecs(categorySpecs.filter((_, i) => i !== index));
  };

  const handleEditCategory = (category: Category): void => {
    setEditingCategory(category);
    setNewCategoryName(category.name);

    // Lade die Spezifikationen für diese Kategorie
    const specs = specifications[category.id] || specifications[category.name] || [];
    setCategorySpecs(specs.map(spec => ({
      name: spec.name,
      unit: spec.unit || ''
    })));

    setIsAddCategoryModalOpen(true);
  };

  const handleUpdateCategory = async (): Promise<void> => {
    if (!newCategoryName.trim()) {
      showNotification('Bitte Kategoriename eingeben', NotificationType.ERROR);
      return;
    }

    if (!editingCategory) return;

    // Überprüfung auf doppelte Kategorienamen (außer der aktuell bearbeiteten)
    const existingCategory = categories.find(cat =>
      cat.name.toLowerCase() === newCategoryName.trim().toLowerCase() &&
      cat.id !== editingCategory.id
    );

    if (existingCategory) {
      showNotification('Eine Kategorie mit diesem Namen existiert bereits', NotificationType.ERROR);
      return;
    }

    try {
      const categoryData = {
        name: newCategoryName,
        updatedAt: new Date()
      };

      // Kategorie aktualisieren
      await FirebaseService.updateDocument('categories', editingCategory.id, categoryData);
      const categoryId = editingCategory.id;

      // Alte Spezifikationen abrufen
      const oldSpecs = specifications[categoryId] || [];
      const oldSpecsMap: Record<string, Specification> = {};
      oldSpecs.forEach(spec => {
        oldSpecsMap[spec.id] = spec;
      });

      // Spezifikationen aktualisieren (bestehende behalten, neue hinzufügen, gelöschte entfernen)
      const updatedSpecIds = new Set<string>();

      for (let i = 0; i < categorySpecs.length; i++) {
        const spec = categorySpecs[i];
        const existingSpec = oldSpecs[i];

        if (existingSpec && existingSpec.id) {
          // Bestehende Spezifikation aktualisieren (nur Name und Unit ändern)
          const updatedSpec = {
            name: spec.name,
            label: spec.name,
            type: 'text' as const,
            required: true,
            unit: spec.unit || '',
            categoryId: categoryId,
            updatedAt: new Date()
          };
          await FirebaseService.updateDocument('specifications', existingSpec.id, updatedSpec);
          updatedSpecIds.add(existingSpec.id);
        } else {
          // Neue Spezifikation hinzufügen
          const newSpec = {
            name: spec.name,
            label: spec.name,
            type: 'text' as const,
            required: true,
            unit: spec.unit || '',
            categoryId: categoryId,
            createdAt: new Date()
          };
          const savedSpec = await FirebaseService.addDocument<Specification>('specifications', newSpec);
          updatedSpecIds.add(savedSpec.id);
        }
      }

      // Gelöschte Spezifikationen entfernen
      for (const oldSpec of oldSpecs) {
        if (!updatedSpecIds.has(oldSpec.id)) {
          await FirebaseService.deleteDocument('specifications', oldSpec.id);

          // Auch aus allen Materialien entfernen
          const allMaterials = await FirebaseService.getDocuments('materials');
          const categoryMaterials = allMaterials.filter((material: any) =>
            material.categoryId === editingCategory.id
          );

          for (const material of categoryMaterials) {
            if ((material as any).specifications && (material as any).specifications[oldSpec.id]) {
              const updatedSpecifications = { ...(material as any).specifications };
              delete updatedSpecifications[oldSpec.id];
              await FirebaseService.updateDocument('materials', material.id, {
                specifications: updatedSpecifications,
                updatedAt: new Date()
              });
            }
          }
        }
      }

      showNotification('Kategorie erfolgreich aktualisiert', NotificationType.SUCCESS);
      setIsAddCategoryModalOpen(false);
      setEditingCategory(null);
      setNewCategoryName('');
      setCategorySpecs([]);
      loadCategoriesAndSpecs();
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Kategorie:', error);
      showNotification('Fehler beim Aktualisieren der Kategorie', NotificationType.ERROR);
    }
  };

  return (
    <>
      <BasePage
        title="Kategorien & Spezifikationen"
        headerActions={
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Kategorien oder Spezifikationen suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
              />
            </div>
            <button
              onClick={() => setShowIds(!showIds)}
              className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                showIds
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              <Database className="h-4 w-4 mr-2" />
              {showIds ? 'IDs ausblenden' : 'IDs anzeigen'}
            </button>
            <button
              onClick={() => setIsAddCategoryModalOpen(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Neue Kategorie
            </button>
          </div>
        }
        maxHeight="max-h-[60vh]"
      >

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Lade Kategorien...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories
              .filter(category => {
                if (!searchTerm) return true;
                const searchLower = searchTerm.toLowerCase();

                // Suche in Kategoriename
                if (category.name.toLowerCase().includes(searchLower)) {
                  return true;
                }

                // Suche in Spezifikationen dieser Kategorie
                const categorySpecsFiltered = specifications[category.id] || [];
                return categorySpecsFiltered.some(spec =>
                  spec.name.toLowerCase().includes(searchLower) ||
                  (spec.unit && spec.unit.toLowerCase().includes(searchLower))
                );
              })
              .map((category) => (
              <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-md font-medium text-gray-900">{category.name}</h4>
                    {showIds && (
                      <p className="text-xs text-gray-500 font-mono mt-1">ID: {category.id}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <strong>Spezifikationen:</strong>
                  {specifications[category.id] && specifications[category.id].length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {specifications[category.id].map((spec, index) => (
                        <li key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                          <span>
                            <strong>{spec.name}</strong>
                            {spec.unit && ` (${spec.unit})`}
                            {showIds && (
                              <span className="block text-xs text-gray-500 font-mono mt-1">ID: {spec.id}</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-gray-500 italic">Keine Spezifikationen definiert</p>
                  )}
                </div>
              </div>
            ))}

            {categories.length === 0 && (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Kategorien</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Erstellen Sie Ihre erste Kategorie mit spezifischen Feldern.
                </p>
              </div>
            )}
          </div>
        )}
      </BasePage>

      {/* Add Category Modal */}
      <BaseModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => {
          setIsAddCategoryModalOpen(false);
          setEditingCategory(null);
          setNewCategoryName('');
          setCategorySpecs([]);
        }}
        title={editingCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie hinzufügen'}
        icon={Package}
        footerButtons={
          <>
            <button
              onClick={() => {
                setIsAddCategoryModalOpen(false);
                setNewCategoryName('');
                setCategorySpecs([]);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Abbrechen
            </button>
            <button
              onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
              disabled={!newCategoryName.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{editingCategory ? 'Kategorie aktualisieren' : 'Kategorie erstellen'}</span>
            </button>
          </>
        }
      >

        <div className="space-y-6">
          {/* Kategoriename */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategoriename *
            </label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="z.B. Module, Wechselrichter, Kabel..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Spezifikationen */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Spezifikationen für diese Kategorie
              </label>
              <button
                onClick={handleAddSpecification}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Spezifikation hinzufügen
              </button>
            </div>

            <div className="space-y-4">
              {categorySpecs.map((spec, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">Spezifikation #{index + 1}</h4>
                    <button
                      onClick={() => handleRemoveSpecification(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Feldname *
                      </label>
                      <input
                        type="text"
                        value={spec.name}
                        onChange={(e) => handleUpdateSpecification(index, 'name', e.target.value)}
                        placeholder="z.B. Leistung, Spannung, Abmessungen"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Einheit (optional)
                      </label>
                      <input
                        type="text"
                        value={spec.unit}
                        onChange={(e) => handleUpdateSpecification(index, 'unit', e.target.value)}
                        placeholder="z.B. W, V, mm, kg"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {categorySpecs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">Noch keine Spezifikationen definiert.</p>
                  <p className="text-xs mt-1">Klicken Sie auf "Spezifikation hinzufügen" um zu beginnen.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </BaseModal>
    </>
  );
};

export default CategorySettings;
