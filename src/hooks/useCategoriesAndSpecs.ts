import { useState, useEffect, useCallback } from 'react';
import { FirebaseService } from '../services/firebaseService';
import type { Category, Specification } from '../types';

/**
 * Return Type für useCategoriesAndSpecs Hook
 */
export interface UseCategoriesAndSpecsReturn {
  categories: Category[];
  specsByCategoryKey: Record<string, Specification[]>;
  loadingMeta: boolean;
  reload: () => Promise<void>;
  findCategoryById: (categoryId: string) => Category | undefined;
  getSpecsForCategory: (category: Category | null | undefined) => Specification[];
}

/**
 * Hook für Kategorien und Spezifikationen aus Firebase
 * @param isOpen - Ob die Daten geladen werden sollen (z.B. wenn Modal offen ist)
 * @returns Hook-Return mit categories, specs, loading, reload, findCategoryById, getSpecsForCategory
 */
export const useCategoriesAndSpecs = (isOpen: boolean = true): UseCategoriesAndSpecsReturn => {
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [specsByCategoryKey, setSpecsByCategoryKey] = useState<Record<string, Specification[]>>({});

  const reload = useCallback(async () => {
    try {
      setLoadingMeta(true);
      const categoriesData = await FirebaseService.getDocuments('categories') as Category[];
      const specsData = await FirebaseService.getDocuments('specifications') as Specification[];

      setCategories(categoriesData || []);

      // Spezifikationen nach Kategorie-ID und Kategorie-Name indizieren
      const map: Record<string, Specification[]> = {};
      (specsData || []).forEach((spec) => {
        const key = spec.categoryId;
        if (!key) return;
        if (!map[key]) map[key] = [];
        map[key].push(spec);
      });
      setSpecsByCategoryKey(map);
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) reload();
  }, [isOpen, reload]);

  const findCategoryById = useCallback((categoryId: string): Category | undefined =>
    categories.find((c) => c.id === categoryId),
    [categories]
  );

  const getSpecsForCategory = useCallback((category: Category | null | undefined): Specification[] => {
    if (!category) return [];
    return (
      specsByCategoryKey[category.id] ||
      specsByCategoryKey[category.name] ||
      []
    );
  }, [specsByCategoryKey]);

  return {
    categories,
    specsByCategoryKey,
    loadingMeta,
    reload,
    findCategoryById,
    getSpecsForCategory
  };
};

export default useCategoriesAndSpecs;
