import { useState, useMemo } from 'react';
import { getStockStatusText } from '../utils/stockStatus';

/**
 * Hook für Material-Filterung und Sortierung
 * @param {Array} materials - Array aller Materialien
 * @param {Array} categories - Array aller Kategorien
 */
export const useMaterialFilters = (materials, categories) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('alle');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [columnFilters, setColumnFilters] = useState({
    category: 'alle',
    status: 'alle',
    manufacturer: 'alle'
  });

  const filteredMaterials = useMemo(() => {
    return materials.filter(material => {
      // Suchfilter
      const matchesSearch = searchTerm === '' ||
        material.materialID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());

      // Kategorie-Filter (Hauptfilter)
      const matchesCategory = selectedCategory === 'alle' ||
        (material.categoryId && categories.find(cat => cat.id === material.categoryId)?.name === selectedCategory);

      // Spalten-Filter
      const matchesColumnFilters = Object.entries(columnFilters).every(([column, value]) => {
        if (value === 'alle') return true;

        switch (column) {
          case 'category': {
            const categoryName = categories.find(cat => cat.id === material.categoryId)?.name;
            return categoryName === value;
          }
          case 'status':
            return getStockStatusText(material.stock, material.heatStock, material.orderStatus) === value;
          case 'manufacturer':
            return material.manufacturer === value;
          default:
            return true;
        }
      });

      return matchesSearch && matchesCategory && matchesColumnFilters;
    }).sort((a, b) => {
      if (!sortConfig.key) return 0;

      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Numerische Sortierung für bestimmte Felder
      if (['stock', 'price', 'orderQuantity', 'itemsPerUnit'].includes(sortConfig.key)) {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [materials, categories, searchTerm, selectedCategory, columnFilters, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleColumnFilterChange = (column, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Unique values für Filter-Dropdowns
  const uniqueCategories = useMemo(() =>
    ['alle', ...new Set(materials.map(m => m.category).filter(Boolean))],
    [materials]
  );

  const uniqueManufacturers = useMemo(() =>
    ['alle', ...new Set(materials.map(m => m.manufacturer).filter(Boolean))],
    [materials]
  );

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
    filteredMaterials,
    uniqueCategories,
    uniqueManufacturers,
    uniqueStatuses
  };
};

export default useMaterialFilters;
