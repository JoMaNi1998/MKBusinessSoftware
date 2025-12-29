/**
 * Material Helpers
 *
 * Zentrale Hilfsfunktionen und Konstanten für Material-Komponenten
 */

import type { Material, Category } from '@app-types';
import type { MaterialColumnConfig, MaterialVisibleColumns } from '@app-types/components/material.types';

// ============================================
// SPALTEN-KONFIGURATION
// ============================================

/**
 * Verfügbare Spalten für die Material-Tabelle
 */
export const MATERIAL_AVAILABLE_COLUMNS: MaterialColumnConfig[] = [
  { key: 'material', label: 'Material', required: true },
  { key: 'category', label: 'Kategorie', required: false },
  { key: 'manufacturer', label: 'Hersteller', required: false },
  { key: 'stock', label: 'Bestand', required: true },
  { key: 'price', label: 'Preis', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'ean', label: 'EAN', required: false },
  { key: 'link', label: 'Link', required: false },
  { key: 'orderQuantity', label: 'Bestellmenge', required: false },
  { key: 'itemsPerUnit', label: 'Stück pro Einheit', required: false },
  { key: 'type', label: 'Typ', required: false }
];

/**
 * Standard-Spalteneinstellungen für Materials
 */
export const DEFAULT_MATERIAL_COLUMNS: MaterialVisibleColumns = {
  material: true,
  category: true,
  manufacturer: true,
  stock: true,
  price: true,
  status: true,
  ean: false,
  link: false,
  orderQuantity: false,
  unit: false,
  itemsPerUnit: false,
  type: false
};

// ============================================
// VALIDIERUNG
// ============================================

/**
 * Validiert Material-Formulardaten
 *
 * @param formData - Die zu validierenden Formulardaten
 * @param isCreate - Ob es sich um eine Neuerstellung handelt
 * @returns Object mit Feldnamen als Keys und Fehlermeldungen als Values
 */
export const validateMaterialForm = (
  formData: {
    categoryId?: string;
    type?: string;
    stock?: number | string;
    heatStock?: number | string;
    itemsPerUnit?: number | string;
    orderQuantity?: number | string;
  },
  isCreate: boolean = false
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!formData.categoryId?.trim()) {
    errors.categoryId = 'Kategorie ist erforderlich';
  }

  if (!formData.type?.trim()) {
    errors.type = 'Typ ist erforderlich';
  }

  if (isCreate) {
    if (formData.stock === '' || formData.stock === null || formData.stock === undefined) {
      errors.stock = 'Startbestand ist erforderlich';
    } else if (Number(formData.stock) < 0) {
      errors.stock = 'Startbestand kann nicht negativ sein';
    }
  }

  if (formData.heatStock === '' || formData.heatStock === null || formData.heatStock === undefined) {
    errors.heatStock = 'Meldebestand ist erforderlich';
  } else if (Number(formData.heatStock) < 0) {
    errors.heatStock = 'Meldebestand kann nicht negativ sein';
  }

  if (
    formData.itemsPerUnit === '' ||
    formData.itemsPerUnit === null ||
    formData.itemsPerUnit === undefined ||
    Number(formData.itemsPerUnit) <= 0
  ) {
    errors.itemsPerUnit = 'Stück pro Einheit ist erforderlich und muss größer als 0 sein';
  }

  if (
    formData.orderQuantity === '' ||
    formData.orderQuantity === null ||
    formData.orderQuantity === undefined ||
    Number(formData.orderQuantity) <= 0
  ) {
    errors.orderQuantity = 'Bestellmenge ist erforderlich und muss größer als 0 sein';
  }

  return errors;
};

/**
 * Prüft ob Validierungsfehler vorhanden sind
 */
export const hasMaterialValidationErrors = (errors: Record<string, string>): boolean => {
  return Object.keys(errors).length > 0;
};

// ============================================
// STATISTIK-BERECHNUNGEN
// ============================================

/**
 * Berechnet Statistiken für eine Liste von Materialien
 *
 * @param materials - Liste aller Materialien
 * @returns Statistik-Objekt
 */
export const calculateMaterialStats = (materials: Material[]): {
  total: number;
  inStock: number;
  low: number;
  ordered: number;
  empty: number;
} => {
  let inStock = 0;
  let low = 0;
  let ordered = 0;
  let empty = 0;

  materials.forEach(m => {
    const stock = m.stock ?? 0;
    const heatStock = m.heatStock ?? 0;

    if (m.orderStatus === 'bestellt') {
      ordered++;
    } else if (stock <= 0) {
      empty++;
    } else if (stock <= heatStock) {
      low++;
    } else {
      inStock++;
    }
  });

  return {
    total: materials.length,
    inStock,
    low,
    ordered,
    empty
  };
};

// ============================================
// KATEGORIE-HELPERS
// ============================================

/**
 * Findet den Kategorienamen für eine Material-ID
 *
 * @param categoryId - Kategorie-ID
 * @param categories - Liste aller Kategorien
 * @returns Kategoriename oder 'Unbekannt'
 */
export const getCategoryName = (
  categoryId: string | undefined,
  categories: Category[]
): string => {
  if (!categoryId) return 'Unbekannt';
  const category = categories.find(c => c.id === categoryId);
  return category?.name || 'Unbekannt';
};

/**
 * Erstellt eine Map von Kategorie-IDs zu Kategorienamen für schnelles Lookup
 *
 * @param categories - Liste aller Kategorien
 * @returns Map von ID zu Name
 */
export const buildCategoryMap = (categories: Category[]): Map<string, string> => {
  const map = new Map<string, string>();
  categories.forEach(cat => {
    map.set(cat.id, cat.name);
  });
  return map;
};

// ============================================
// PREIS-HELPERS
// ============================================

/**
 * Parst einen Preis-String zu einer Zahl
 *
 * @param priceString - Preis als String (z.B. "12,50" oder "12.50")
 * @returns Zahl oder null bei ungültigem Input
 */
export const parsePriceInput = (priceString: string): number | null => {
  if (!priceString || priceString.trim() === '') return null;

  // Ersetze Komma durch Punkt für deutsche Eingaben
  const normalized = priceString.replace(',', '.');
  const parsed = parseFloat(normalized);

  return isNaN(parsed) ? null : parsed;
};

/**
 * Formatiert Preis für Eingabefeld
 *
 * @param price - Preis als Zahl
 * @returns Formatierter String mit Komma
 */
export const formatPriceForInput = (price: number | undefined): string => {
  if (price === undefined || price === null) return '';
  return price.toFixed(2).replace('.', ',');
};
