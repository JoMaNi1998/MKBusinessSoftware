import { useState, useEffect, useCallback } from 'react';
import { FirebaseService } from '../services/firebaseService';

/**
 * Hook für Kategorien und Spezifikationen aus Firebase
 * @param {boolean} isOpen - Ob die Daten geladen werden sollen (z.B. wenn Modal offen ist)
 */
export const useCategoriesAndSpecs = (isOpen = true) => {
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [categories, setCategories] = useState([]);
  const [specsByCategoryKey, setSpecsByCategoryKey] = useState({});

  const reload = useCallback(async () => {
    try {
      setLoadingMeta(true);
      const categoriesData = await FirebaseService.getDocuments('categories');
      const specsData = await FirebaseService.getDocuments('specifications');

      setCategories(categoriesData || []);

      // Spezifikationen nach Kategorie-ID und Kategorie-Name indizieren
      const map = {};
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

  const findCategoryById = useCallback((categoryId) =>
    categories.find((c) => c.id === categoryId),
    [categories]
  );

  const getSpecsForCategory = useCallback((category) => {
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
