import React from 'react';
import { Package, TrendingDown, Euro } from 'lucide-react';
import { formatPrice } from '../utils';

const ProjectViewStats = ({
  projectBookings,
  projectCosts,
  loadingCosts
}) => {
  const totalMaterials = projectBookings.reduce(
    (sum, booking) =>
      sum + booking.materials.reduce((matSum, material) => matSum + (material.quantity || 0), 0),
    0
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Materialbuchungen</p>
            <p className="text-2xl font-bold text-blue-600">{projectBookings.length}</p>
          </div>
          <Package className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Materialien gesamt</p>
            <p className="text-2xl font-bold text-green-600">{totalMaterials}</p>
          </div>
          <TrendingDown className="h-8 w-8 text-green-600" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Projektkosten</p>
            {loadingCosts ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                <span className="text-sm text-gray-500">Berechne...</span>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold text-orange-600">{formatPrice(projectCosts)}</p>
                <p className="text-xs text-gray-500 mt-1">Basierend auf historischen Preisen</p>
              </>
            )}
          </div>
          <Euro className="h-8 w-8 text-orange-600" />
        </div>
      </div>
    </div>
  );
};

export default ProjectViewStats;
