import { useState, useMemo, useCallback } from 'react';
import { getStockStatusText } from '../utils/stockStatus';
import type { Material, Category } from '../types';

/**
 * Sort Configuration
 */
export interface SortConfig {
  key: string | null;
  direction: 'asc' | 'desc';
}

/**
 * Column Filters
 */
export interface ColumnFilters {
  category: string;
  status: string;
  manufacturer: string;
}

/**
 * Return Type für useMaterialFilters Hook
 */
export interface UseMaterialFiltersReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  sortConfig: SortConfig;
  handleSort: (key: string) => void;
  columnFilters: ColumnFilters;
  handleColumnFilterChange: (column: string, value: string) => void;
  filteredMaterials: Material[];
  uniqueCategories: string[];
  uniqueManufacturers: string[];
  uniqueStatuses: string[];
  resetFilters: () => void;
  totalCount: number;
  filteredCount: number;
}

/**
 * Hook für Material-Filterung und Sortierung
 *
 * OPTIMIERUNGEN:
 * - Category Map für O(1) Lookups statt O(n) mit find()
 * - Separate useMemo für Filter und Sortierung
 * - useCallback für Handler-Funktionen
 * - resetFilters Funktion
 * - Counter für totalCount/filteredCount
 *
 * @param materials - Array aller Materialien
 * @param categories - Array aller Kategorien
 * @returns Hook-Return mit Filtern, Sortierung und Hilfsfunktionen
 */
export const useMaterialFilters = (
  materials: Material[],
  categories: Category[]
): UseMaterialFiltersReturn => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('alle');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    category: 'alle',
    status: 'alle',
    manufacturer: 'alle'
  });

  // ✅ NEU: Category Map für O(1) Lookups
  // Wird nur neu berechnet wenn sich categories ändern
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach(cat => map.set(cat.id, cat));
    return map;
  }, [categories]);

  // Category Name Map für Reverse-Lookup (TODO: für zukünftige Features)
  const _categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach(cat => map.set(cat.name, cat.id));
    return map;
  }, [categories]);

  // ✅ Optimierter Filter mit Map-Lookups (OHNE Sortierung!)
  const filteredMaterials = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();

    return materials.filter(material => {
      // Suchfilter - early return für bessere Performance
      if (searchTerm) {
        const matchesSearch =
          material.materialID?.toLowerCase().includes(searchLower) ||
          material.description?.toLowerCase().includes(searchLower) ||
          material.manufacturer?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // ✅ Kategorie mit Map - O(1) statt O(n)
      if (selectedCategory !== 'alle') {
        const category = categoryMap.get(material.categoryId || '');
        if (category?.name !== selectedCategory) return false;
      }

      // Spalten-Filter
      for (const [column, value] of Object.entries(columnFilters)) {
        if (value === 'alle') continue;

        switch (column) {
          case 'category': {
            // ✅ Map-Lookup statt find()
            const cat = categoryMap.get(material.categoryId || '');
            if (cat?.name !== value) return false;
            break;
          }
          case 'status':
            if (getStockStatusText(material.stock, material.heatStock, material.orderStatus) !== value) {
              return false;
            }
            break;
          case 'manufacturer':
            if (material.manufacturer !== value) return false;
            break;
          default:
            // Unbekannte Filter-Spalten ignorieren
            break;
        }
      }

      return true;
    });
  }, [materials, categoryMap, searchTerm, selectedCategory, columnFilters]);

  // ✅ Sortierung SEPARAT - nur neu berechnet wenn sich sortConfig ändert
  const sortedMaterials = useMemo(() => {
    if (!sortConfig.key) return filteredMaterials;

    const numericFields = ['stock', 'price', 'orderQuantity', 'itemsPerUnit'];
    const isNumeric = numericFields.includes(sortConfig.key);
    const direction = sortConfig.direction === 'asc' ? 1 : -1;

    return [...filteredMaterials].sort((a, b) => {
      let aVal: any = (a as any)[sortConfig.key!];
      let bVal: any = (b as any)[sortConfig.key!];

      if (isNumeric) {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }

      if (aVal < bVal) return -direction;
      if (aVal > bVal) return direction;
      return 0;
    });
  }, [filteredMaterials, sortConfig]);

  // ✅ useCallback für Handler-Funktionen
  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handleColumnFilterChange = useCallback((column: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [column]: value }));
  }, []);

  // ✅ NEU: Reset alle Filter
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedCategory('alle');
    setColumnFilters({ category: 'alle', status: 'alle', manufacturer: 'alle' });
    setSortConfig({ key: null, direction: 'asc' });
  }, []);

  // Unique values für Filter-Dropdowns
  const uniqueCategories = useMemo(() => {
    // ✅ Verwendet category Namen aus categories Array
    const categoryNames = ['alle', ...new Set(categories.map(c => c.name).filter(Boolean))];
    return categoryNames.sort();
  }, [categories]);

  const uniqueManufacturers = useMemo(() => {
    const manufacturers = ['alle', ...new Set(materials.map(m => m.manufacturer).filter((m): m is string => Boolean(m)))];
    return manufacturers.sort();
  }, [materials]);

  const uniqueStatuses = ['alle', 'Auf Lager', 'Niedrig', 'Bestellt', 'Nicht verfügbar'];

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    sortConfig,
    handleSort,
    columnFilters,
    handleColumnFilterChange,
    filteredMaterials: sortedMaterials, // ✅ Gibt sortierte Version zurück
    uniqueCategories,
    uniqueManufacturers,
    uniqueStatuses,
    resetFilters, // ✅ NEU
    totalCount: materials.length, // ✅ NEU
    filteredCount: sortedMaterials.length // ✅ NEU
  };
};

export default useMaterialFilters;
