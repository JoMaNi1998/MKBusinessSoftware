import React, { useState } from 'react';
import { Filter, ExternalLink, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { getStockStatusColor, getStockStatusText, formatPrice } from '../../../utils';

const MaterialTable = ({
  materials,
  categories,
  visibleColumns,
  sortConfig,
  onSort,
  columnFilters,
  onColumnFilterChange,
  uniqueCategories,
  uniqueManufacturers,
  uniqueStatuses,
  onMaterialClick,
  onEditMaterial,
  onDeleteMaterial,
  editingPrice,
  tempPrice,
  onPriceEdit,
  onPriceChange,
  onPriceSave,
  onPriceCancel
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [activeColumnFilter, setActiveColumnFilter] = useState(null);

  const renderSortIcon = (key) => {
    if (sortConfig.key === key) {
      return (
        <span className="text-gray-400 hover:text-gray-600 text-lg font-bold">
          {sortConfig.direction === 'asc' ? '↑' : '↓'}
        </span>
      );
    }
    return <Filter className="h-3 w-3 text-gray-400 hover:text-gray-600" />;
  };

  const renderFilterDropdown = (column, options, currentValue) => (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setActiveColumnFilter(activeColumnFilter === column ? null : column);
        }}
        className="text-gray-400 hover:text-gray-600 p-1"
      >
        <Filter className="h-3 w-3" />
      </button>
      {activeColumnFilter === column && (
        <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-30 border border-gray-200">
          <div className="p-2">
            <select
              value={currentValue}
              onChange={(e) => {
                onColumnFilterChange(column, e.target.value);
                setActiveColumnFilter(null);
              }}
              className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="hidden md:block h-full overflow-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            {visibleColumns.material && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Material
              </th>
            )}
            {visibleColumns.category && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <span>Kategorie</span>
                  {renderFilterDropdown('category', uniqueCategories, columnFilters.category)}
                </div>
              </th>
            )}
            {visibleColumns.manufacturer && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <span>Hersteller</span>
                  {renderFilterDropdown('manufacturer', uniqueManufacturers, columnFilters.manufacturer)}
                </div>
              </th>
            )}
            {visibleColumns.stock && (
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('stock')}
              >
                <div className="flex items-center space-x-1">
                  <span>Bestand</span>
                  {renderSortIcon('stock')}
                </div>
              </th>
            )}
            {visibleColumns.price && (
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('price')}
              >
                <div className="flex items-center space-x-1">
                  <span>Preis</span>
                  {renderSortIcon('price')}
                </div>
              </th>
            )}
            {visibleColumns.ean && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                EAN
              </th>
            )}
            {visibleColumns.orderQuantity && (
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('orderQuantity')}
              >
                <div className="flex items-center space-x-1">
                  <span>Bestellmenge</span>
                  {renderSortIcon('orderQuantity')}
                </div>
              </th>
            )}
            {visibleColumns.itemsPerUnit && (
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('itemsPerUnit')}
              >
                <div className="flex items-center space-x-1">
                  <span>Stück pro Einheit</span>
                  {renderSortIcon('itemsPerUnit')}
                </div>
              </th>
            )}
            {visibleColumns.type && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Typ
              </th>
            )}
            {visibleColumns.link && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Link
              </th>
            )}
            {visibleColumns.status && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {renderFilterDropdown('status', uniqueStatuses, columnFilters.status)}
                </div>
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aktionen
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {materials.map((material) => {
            const categoryName = categories.find(cat => cat.id === material.categoryId)?.name || 'Unbekannt';

            return (
              <tr
                key={material.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onMaterialClick(material)}
              >
                {visibleColumns.material && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="p-2">
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        {material.description}
                        {!visibleColumns.link && material.link && (
                          <a
                            href={material.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-primary-600 hover:text-primary-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{material.materialID}</div>
                    </div>
                  </td>
                )}
                {visibleColumns.category && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {categoryName}
                    </span>
                  </td>
                )}
                {visibleColumns.manufacturer && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {material.manufacturer}
                  </td>
                )}
                {visibleColumns.stock && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{material.stock}</span>
                  </td>
                )}
                {visibleColumns.price && (
                  <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    {editingPrice === material.id ? (
                      <div className="relative z-50">
                        <input
                          type="text"
                          value={tempPrice}
                          onChange={(e) => onPriceChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') onPriceSave(material.id);
                            else if (e.key === 'Escape') onPriceCancel();
                          }}
                          onBlur={() => onPriceSave(material.id)}
                          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="0,00"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer hover:bg-blue-50 hover:border hover:border-blue-200 px-2 py-1 rounded transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPriceEdit(material.id, material.price);
                        }}
                        title="Klicken zum Bearbeiten"
                      >
                        <span className="text-sm font-medium text-gray-900 hover:text-blue-700">
                          {formatPrice(material.price) || 'Preis hinzufügen'}
                        </span>
                      </div>
                    )}
                  </td>
                )}
                {visibleColumns.ean && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {material.ean || '-'}
                  </td>
                )}
                {visibleColumns.orderQuantity && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {material.orderQuantity || 0}
                  </td>
                )}
                {visibleColumns.itemsPerUnit && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {material.itemsPerUnit || 0}
                  </td>
                )}
                {visibleColumns.type && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {material.type || '-'}
                  </td>
                )}
                {visibleColumns.link && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {material.link ? (
                      <a
                        href={material.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-800 flex items-center space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="text-sm">Link</span>
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                )}
                {visibleColumns.status && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(material.stock, material.heatStock, material.orderStatus)}`}>
                      {getStockStatusText(material.stock, material.heatStock, material.orderStatus)}
                    </span>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDropdownOpen(dropdownOpen === material.id ? null : material.id);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {dropdownOpen === material.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                        <div className="py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditMaterial(material);
                              setDropdownOpen(null);
                            }}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Bearbeiten
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteMaterial(material.id);
                              setDropdownOpen(null);
                            }}
                            className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Löschen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MaterialTable;
