import React, { useEffect, useMemo, useState, FormEvent, ChangeEvent, KeyboardEvent } from 'react';
import {
  Save,
  Package,
  AlertCircle,
  ExternalLink,
  Edit,
  Trash2,
  Shield
} from 'lucide-react';
import { BaseModal } from '@components/shared';
import { useNotification } from '@context/NotificationContext';
import { MaterialService } from '@services/firebaseService';
import { useCategoriesAndSpecs } from '@hooks';
import {
  getStockStatusColor,
  getStockStatusText,
  formatPrice,
  buildDescription,
  computeNextMaterialId
} from '@utils';
import { NotificationType } from '@app-types';
import type { Category, Specification } from '@app-types';
import type {
  MaterialFormData,
  MaterialFormErrors,
  MaterialModalProps
} from '@app-types/components/material.types';

const cn = (...classes: (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(' ');

const requiredError = (label: string): string => `${label} ist erforderlich`;

/**
 * Zentrale, gemeinsame Modal-Komponente:
 * mode: "view" | "create" | "edit"
 */
const MaterialModal: React.FC<MaterialModalProps> = ({
  isOpen,
  onClose,
  mode = 'view',
  material,
  onSave,
  onEdit,
  onDelete
}) => {
  const isView: boolean = mode === 'view';
  const isEdit: boolean = mode === 'edit';
  const isCreate: boolean = mode === 'create';

  const { showNotification } = useNotification?.() || { showNotification: () => {} };
  const { categories, loadingMeta, reload, findCategoryById, getSpecsForCategory } =
    useCategoriesAndSpecs(isOpen);

  // ---------- Formular-Status (nur für create/edit) ----------
  const blankForm: MaterialFormData = {
    materialID: '',
    description: '',
    categoryId: '',
    type: '',
    manufacturer: '',
    stock: '',
    heatStock: '',
    unit: 'Stück',
    itemsPerUnit: '',
    orderQuantity: '',
    price: '',
    link: '',
    image: '',
    ean: '',
    excludeFromAutoOrder: false,
    specifications: {}
  };

  const [formData, setFormData] = useState<MaterialFormData>(blankForm);
  const [errors, setErrors] = useState<MaterialFormErrors>({});
  const [showNewCategoryInput, setShowNewCategoryInput] = useState<boolean>(false);
  const [newCategory, setNewCategory] = useState<string>('');

  // Initialisiere/Reset formData bei Open/Mode/Material
  useEffect(() => {
    if (!isOpen) return;
    setErrors({});

    if (isView) return;

    if (material && (isEdit || isCreate)) {
      setFormData({
        materialID: material.materialID || '',
        description: material.description || '',
        categoryId: material.categoryId || '',
        type: material.type || '',
        manufacturer: material.manufacturer || '',
        stock: material.stock ?? '',
        heatStock: material.heatStock ?? '',
        unit: material.einheit || 'Stück',
        itemsPerUnit: material.itemsPerUnit ?? '',
        orderQuantity: material.orderQuantity ?? '',
        price: material.price ?? '',
        link: material.link ?? '',
        image: (material as any).image ?? '',
        ean: material.ean ?? '',
        excludeFromAutoOrder: !!(material as any).excludeFromAutoOrder,
        specifications: material.specifications || {}
      });
    } else {
      setFormData(blankForm);
    }
  }, [isOpen, isEdit, isCreate, isView, material]); // eslint-disable-line

  const selectedCategory = useMemo((): Category | undefined => {
    const categoryId = isView ? material?.categoryId : formData.categoryId;
    return categoryId ? findCategoryById(categoryId) : undefined;
  }, [findCategoryById, formData.categoryId, isView, material?.categoryId]);

  const selectedCategorySpecs = useMemo(
    (): Specification[] => getSpecsForCategory(selectedCategory),
    [getSpecsForCategory, selectedCategory]
  );

  // Beschreibung automatisch ableiten
  useEffect(() => {
    if (isView) return;
    const next = buildDescription({
      manufacturer: formData.manufacturer,
      type: formData.type,
      categoryName: selectedCategory?.name
    });
    setFormData((prev) => ({ ...prev, description: next }));
  }, [isView, formData.manufacturer, formData.type, selectedCategory?.name]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, type, value, checked } = e.target;
    const v = type === 'checkbox' ? !!checked : value;

    setFormData((prev) => ({ ...prev, [name]: v }));

    if (errors[name] && String(v).trim() !== '') {
      setErrors((prev) => {
        const cp = { ...prev };
        delete cp[name];
        return cp;
      });
    }
  };

  const handleCategoryChange = (value: string): void => {
    if (value === 'NEW_CATEGORY') {
      setShowNewCategoryInput(true);
      return;
    }
    setFormData((prev) => ({
      ...prev,
      categoryId: value,
      specifications: {}
    }));

    if (errors.categoryId && value) {
      setErrors((prev) => {
        const cp = { ...prev };
        delete cp.categoryId;
        return cp;
      });
    }
  };

  const handleAddNewCategory = async (): Promise<void> => {
    const name = (newCategory || '').trim();
    if (!name) return;
    try {
      const { FirebaseService } = await import('@services/firebaseService');
      const categoryData = { name, createdAt: new Date() };
      const newDoc = await FirebaseService.addDocument<Category>('categories', categoryData);
      await reload();

      setFormData((prev) => ({ ...prev, categoryId: newDoc.id }));
      setShowNewCategoryInput(false);
      setNewCategory('');
      showNotification?.('Kategorie erfolgreich hinzugefügt', NotificationType.SUCCESS);
    } catch (e) {
      console.error('Fehler beim Hinzufügen der Kategorie:', e);
      showNotification?.('Fehler beim Hinzufügen der Kategorie', NotificationType.ERROR);
    }
  };

  const handleSpecificationChange = (specId: string, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      specifications: { ...prev.specifications, [specId]: value }
    }));

    const errorKey = `spec_${specId}`;
    if (errors[errorKey] && String(value).trim() !== '') {
      setErrors((prev) => {
        const cp = { ...prev };
        delete cp[errorKey];
        return cp;
      });
    }
  };

  const validate = (): MaterialFormErrors => {
    const e: MaterialFormErrors = {};

    if (!formData.categoryId || !String(formData.categoryId).trim()) {
      e.categoryId = requiredError('Kategorie');
    }
    if (!formData.type || !String(formData.type).trim()) {
      e.type = requiredError('Typ');
    }

    if (isCreate) {
      if (formData.stock === '' || formData.stock === null || formData.stock === undefined) {
        e.stock = 'Startbestand ist erforderlich';
      } else if (Number(formData.stock) < 0) {
        e.stock = 'Startbestand kann nicht negativ sein';
      }
    }

    if (formData.heatStock === '' || formData.heatStock === null || formData.heatStock === undefined) {
      e.heatStock = 'Meldebestand ist erforderlich';
    } else if (Number(formData.heatStock) < 0) {
      e.heatStock = 'Meldebestand kann nicht negativ sein';
    }

    if (
      formData.itemsPerUnit === '' ||
      formData.itemsPerUnit === null ||
      formData.itemsPerUnit === undefined ||
      Number(formData.itemsPerUnit) <= 0
    ) {
      e.itemsPerUnit = 'Stück pro Einheit ist erforderlich und muss größer als 0 sein';
    }

    if (
      formData.orderQuantity === '' ||
      formData.orderQuantity === null ||
      formData.orderQuantity === undefined ||
      Number(formData.orderQuantity) <= 0
    ) {
      e.orderQuantity = 'Bestellmenge ist erforderlich und muss größer als 0 sein';
    }

    selectedCategorySpecs.forEach((spec) => {
      const isRequired = spec.required !== false;
      if (!isRequired) return;
      const val = formData.specifications?.[spec.id];
      if (!val || String(val).trim() === '') {
        e[`spec_${spec.id}`] = `${spec.label || spec.name} ist erforderlich`;
      }
    });

    setErrors(e);
    return e;
  };

  const doSave = async (): Promise<void> => {
    const e = validate();
    if (Object.keys(e).length > 0) return;

    let materialID = formData.materialID;
    if (isCreate && !materialID) {
      try {
        const all = await MaterialService.getAllMaterials();
        materialID = computeNextMaterialId(all);
      } catch (err) {
        console.error('Fehler beim Generieren der Material-ID, Fallback:', err);
        materialID = `MAT-${Date.now()}`;
      }
    }

    const dataToSave: any = {
      ...formData,
      materialID,
      stock: isCreate ? (parseInt(String(formData.stock), 10) || 0) : (material?.stock ?? 0),
      heatStock: parseInt(String(formData.heatStock), 10) || 0,
      itemsPerUnit: parseInt(String(formData.itemsPerUnit), 10) || 1,
      orderQuantity: parseInt(String(formData.orderQuantity), 10) || 0,
      price: formData.price === '' ? '' : Number(formData.price),
      updatedAt: new Date(),
      ...(isCreate ? { createdAt: new Date() } : {})
    };

    onSave?.(dataToSave);

    if (isCreate) {
      setFormData(blankForm);
      setErrors({});
    }
    onClose?.();
  };

  if (!isOpen) return null;

  const viewFooter = (
    <>
      <button
        onClick={() => material && onEdit?.(material)}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
      >
        <Edit className="h-4 w-4" />
        <span>Bearbeiten</span>
      </button>
      <button
        onClick={() => material && onDelete?.(material.id)}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
      >
        <Trash2 className="h-4 w-4" />
        <span>Löschen</span>
      </button>
    </>
  );

  const formFooter = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
      >
        Abbrechen
      </button>
      <button
        type="submit"
        form="material-form"
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
      >
        <Save className="h-4 w-4" />
        <span>{isEdit ? 'Aktualisieren' : 'Hinzufügen'}</span>
      </button>
    </>
  );

  const title = isView
    ? `${material?.materialID || ''} - ${material?.description || ''}`.trim()
    : isEdit
    ? 'Material bearbeiten'
    : 'Material hinzufügen';

  // VIEW: Detailansicht
  if (isView && material) {
    const catName = selectedCategory?.name || 'Unbekannt';
    const specsForView = selectedCategorySpecs;
    const m = material;

    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        icon={Package}
        footerButtons={viewFooter}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Grunddaten */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
              Grunddaten
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-500 block">Material-ID</span>
                <span className="text-sm font-medium text-gray-900">{m.materialID}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Kategorie</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  {catName}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Hersteller</span>
                <span className="text-sm font-medium text-gray-900">{m.manufacturer || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Typ</span>
                <span className="text-sm font-medium text-gray-900">{m.type || '-'}</span>
              </div>
              {m.ean ? (
                <div>
                  <span className="text-xs text-gray-500 block">EAN</span>
                  <span className="text-sm font-medium text-gray-900 font-mono">{m.ean}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Bestand & Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
              Bestand & Status
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-500 block">Aktueller Bestand</span>
                <span className="text-lg font-bold text-gray-900">{m.stock ?? 0}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Meldebestand</span>
                <span className="text-sm font-medium text-gray-900">{m.heatStock ?? 0}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Status</span>
                <span
                  className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getStockStatusColor(m.stock, m.heatStock, m.orderStatus)
                  )}
                >
                  {getStockStatusText(m.stock, m.heatStock, m.orderStatus)}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Automatische Nachbestellung</span>
                <div className="flex items-center space-x-2">
                  {(m as any).excludeFromAutoOrder ? (
                    <>
                      <Shield className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium text-amber-600">Ausgeschlossen</span>
                    </>
                  ) : (
                    <span className="text-sm font-medium text-green-600">Aktiviert</span>
                  )}
                </div>
                {(m as any).excludeFromAutoOrder && (
                  <p className="text-xs text-amber-600 mt-1">Manuelle Bestellung erforderlich</p>
                )}
              </div>
            </div>
          </div>

          {/* Bestellinformationen */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
              Bestellinformationen
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-500 block">Stück pro Einheit</span>
                <span className="text-sm font-medium text-gray-900">{m.itemsPerUnit ?? 0}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Bestellmenge</span>
                <span className="text-sm font-medium text-gray-900">{m.orderQuantity ?? 0}</span>
              </div>
              {m.price !== undefined && m.price !== null ? (
                <div>
                  <span className="text-xs text-gray-500 block">Preis pro Einheit</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatPrice(m.price)} €
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Link */}
          {m.link ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                Produktlink
              </h3>
              <a
                href={m.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-primary-600 hover:text-primary-800 space-x-2 text-sm font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Produktlink öffnen</span>
              </a>
            </div>
          ) : null}
        </div>

        {/* Kategorie-Spezifikationen */}
        <div className="mt-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Kategorie-Spezifikationen
            </h3>

            {loadingMeta ? (
              <div className="text-center py-6">
                <div className="text-sm text-gray-500">Lade Spezifikationen...</div>
              </div>
            ) : specsForView.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-sm text-gray-500">
                  Keine Spezifikationen für diese Kategorie definiert.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {specsForView.map((spec) => {
                  const val = material?.specifications?.[spec.id] || '';
                  return (
                    <div key={spec.id} className="bg-gray-50 rounded-lg p-3">
                      <span className="text-xs text-gray-500 block mb-1">
                        {spec.label || spec.name}
                        {spec.unit ? ` (${spec.unit})` : ''}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{val || '-'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </BaseModal>
    );
  }

  // FORM: Create/Edit
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={Package}
      footerButtons={formFooter}
    >
      <form
        id="material-form"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          doSave();
        }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Grunddaten */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Grunddaten</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material-ID *
              </label>
              <input
                type="text"
                name="materialID"
                value={formData.materialID}
                readOnly
                placeholder="Wird automatisch generiert"
                className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beschreibung *
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                readOnly
                placeholder="Wird automatisch generiert"
                className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategorie *
              </label>

              {!showNewCategoryInput ? (
                <select
                  value={formData.categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    errors.categoryId ? 'border-red-500' : 'border-gray-300'
                  )}
                >
                  <option value="">Kategorie wählen...</option>
                  {categories
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  {categories.length === 0 && (
                    <option value="" disabled>
                      Keine Kategorien verfügbar – Bitte in Einstellungen erstellen
                    </option>
                  )}
                  <option value="NEW_CATEGORY">Neue Kategorie hinzufügen</option>
                </select>
              ) : (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Neue Kategorie eingeben..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
                      e.key === 'Enter' && (e.preventDefault(), handleAddNewCategory())
                    }
                  />
                  <button
                    type="button"
                    onClick={handleAddNewCategory}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Hinzufügen
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategoryInput(false);
                      setNewCategory('');
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Abbrechen
                  </button>
                </div>
              )}

              {errors.categoryId && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.categoryId}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Typ *</label>
              <input
                type="text"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.type ? 'border-red-500' : 'border-gray-300'
                )}
                placeholder="Produkttyp"
              />
              {errors.type && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.type}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hersteller</label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleInputChange}
                placeholder="Optional – leer lassen für generische Materialien"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent border-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
              <input
                type="url"
                name="link"
                value={formData.link}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">EAN</label>
              <input
                type="text"
                name="ean"
                value={formData.ean}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Bestandsdaten */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Bestandsdaten</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isEdit ? 'Aktueller Bestand' : 'Startbestand *'}
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                min="0"
                disabled={isEdit}
                readOnly={isEdit}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.stock ? 'border-red-500' : 'border-gray-300',
                  isEdit ? 'bg-gray-100 cursor-not-allowed' : ''
                )}
              />
              {isEdit && (
                <p className="text-xs text-gray-500 mt-1">
                  Bestand kann nur über Ein-/Ausbuchungen geändert werden
                </p>
              )}
              {errors.stock && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.stock}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meldebestand *</label>
              <input
                type="number"
                name="heatStock"
                value={formData.heatStock}
                onChange={handleInputChange}
                min="0"
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.heatStock ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.heatStock && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.heatStock}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stück pro Einheit *
              </label>
              <input
                type="number"
                name="itemsPerUnit"
                value={formData.itemsPerUnit}
                onChange={handleInputChange}
                min="1"
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.itemsPerUnit ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.itemsPerUnit && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.itemsPerUnit}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bestellmenge *</label>
              <input
                type="number"
                name="orderQuantity"
                value={formData.orderQuantity}
                onChange={handleInputChange}
                min="1"
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.orderQuantity ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.orderQuantity && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.orderQuantity}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="excludeFromAutoOrder"
                  name="excludeFromAutoOrder"
                  checked={!!formData.excludeFromAutoOrder}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="excludeFromAutoOrder" className="ml-2 block text-sm text-gray-700">
                  Von automatischer Nachbestellung ausschließen
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Aktivieren Sie diese Option für teure Materialien wie Wechselrichter, die nur bei
                Anzahlung bestellt werden sollen
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preis pro Einheit (€)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional – Preis pro {formData.unit || 'Einheit'}
              </p>
            </div>
          </div>
        </div>

        {/* Spezifikationen */}
        {selectedCategorySpecs.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
              Spezifikationen für {selectedCategory?.name || 'Kategorie'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedCategorySpecs.map((spec) => {
                const errorKey = `spec_${spec.id}`;
                const val = formData.specifications?.[spec.id] || '';
                return (
                  <div key={spec.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {spec.label || spec.name} {spec.unit ? `(${spec.unit})` : ''} *
                    </label>
                    <input
                      type={spec.type || 'text'}
                      value={val}
                      onChange={(e) => handleSpecificationChange(spec.id, e.target.value)}
                      className={cn(
                        'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                        errors[errorKey] ? 'border-red-500' : 'border-gray-300'
                      )}
                    />
                    {errors[errorKey] && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors[errorKey]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </form>
    </BaseModal>
  );
};

export default MaterialModal;
