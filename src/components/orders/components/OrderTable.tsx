import React, { useState, useEffect } from 'react';
import { ExternalLink, X, Check, Filter } from 'lucide-react';
import { formatOrderPrice, getOrderStatusColor, getOrderStatusText, STATUS_FILTER_OPTIONS } from '@utils/orderHelpers';
import type { OrderTableProps } from '@app-types/components/order.types';

const OrderTable: React.FC<OrderTableProps> = ({
  orderList,
  visibleColumns,
  isLoading,
  columnFilters,
  onColumnFilterChange,
  onOrder,
  onCancel
}) => {
  const [activeColumnFilter, setActiveColumnFilter] = useState<string | null>(null);

  // Click-Outside Handler für Filter
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (activeColumnFilter && !(event.target as HTMLElement).closest('.column-filter-container')) {
        setActiveColumnFilter(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeColumnFilter]);

  const handleFilterChange = (column: string, value: string): void => {
    onColumnFilterChange(column, value);
    setActiveColumnFilter(null);
  };

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
            {visibleColumns.stock && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bestand
              </th>
            )}
            {visibleColumns.heatStock && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Meldebestand
              </th>
            )}
            {visibleColumns.itemsPerUnit && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stk/Einheit
              </th>
            )}
            {visibleColumns.price && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preis
              </th>
            )}
            {visibleColumns.orderQuantity && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bestellmenge
              </th>
            )}
            {visibleColumns.status && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  <div className="relative column-filter-container">
                    <button
                      onClick={() => setActiveColumnFilter(activeColumnFilter === 'status' ? null : 'status')}
                      className={`text-gray-400 hover:text-gray-600 p-1 ${columnFilters.status !== 'alle' ? 'text-primary-600' : ''}`}
                    >
                      <Filter className="h-3 w-3" />
                    </button>
                    {activeColumnFilter === 'status' && (
                      <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-30 border border-gray-200">
                        <div className="p-2">
                          <select
                            value={columnFilters.status}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('status', e.target.value)}
                            className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                          >
                            {STATUS_FILTER_OPTIONS.map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </th>
            )}
            {visibleColumns.link && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Link
              </th>
            )}
            {visibleColumns.actions && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orderList.map((material, index) => (
            <tr key={`${material.id}-${material._displayType}-${index}`} className="hover:bg-gray-50">
              {visibleColumns.material && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {material.description}
                    </div>
                    <div className="text-sm text-gray-500">
                      {material.materialID}
                    </div>
                  </div>
                </td>
              )}
              {visibleColumns.stock && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm ${(material.stock || 0) < 0 ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                    {material.stock}
                  </div>
                </td>
              )}
              {visibleColumns.heatStock && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {material.heatStock}
                  </div>
                </td>
              )}
              {visibleColumns.itemsPerUnit && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {material.itemsPerUnit || '-'}
                  </div>
                </td>
              )}
              {visibleColumns.price && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatOrderPrice(material.price)}
                  </div>
                </td>
              )}
              {visibleColumns.orderQuantity && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {material._displayQuantity}
                  </div>
                </td>
              )}
              {visibleColumns.status && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(material)}`}>
                    {getOrderStatusText(material)}
                  </span>
                </td>
              )}
              {visibleColumns.link && (
                <td className="px-6 py-4 whitespace-nowrap">
                  {material.link ? (
                    <a
                      href={material.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-800"
                      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              )}
              {visibleColumns.actions && (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {material._displayType === 'ordered' || material._displayType === 'requested' ? (
                    <button
                      onClick={() => onCancel(material.id)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 flex items-center space-x-1"
                    >
                      <X className="h-4 w-4" />
                      <span>Stornieren</span>
                    </button>
                  ) : material._displayType === 'additional' ? (
                    <button
                      onClick={() => onOrder(material, true)}
                      disabled={isLoading}
                      className="text-blue-600 hover:text-blue-900 disabled:opacity-50 flex items-center space-x-1"
                    >
                      <Check className="h-4 w-4" />
                      <span>Nachbestellen</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onOrder(material, false)}
                      disabled={isLoading}
                      className="text-blue-600 hover:text-blue-900 disabled:opacity-50 flex items-center space-x-1"
                    >
                      <Check className="h-4 w-4" />
                      <span>Bestellen</span>
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;
