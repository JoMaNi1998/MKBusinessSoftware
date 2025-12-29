import React from 'react';
import { Building, Package, Euro } from 'lucide-react';
import { formatPrice } from '@utils';
import { ProjectStatus } from '@app-types/enums';
import type { Project } from '@app-types';

interface CustomerStatsProps {
  customerProjects: Project[];
  customerTotalCosts: number;
  loadingCosts: boolean;
}

const CustomerStats: React.FC<CustomerStatsProps> = ({
  customerProjects,
  customerTotalCosts,
  loadingCosts
}) => {
  const activeProjects = customerProjects.filter((p) => p.status === ProjectStatus.ACTIVE).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Aktive Projekte</p>
            <p className="text-2xl font-bold text-blue-600">{activeProjects}</p>
          </div>
          <Building className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Gesamt Projekte</p>
            <p className="text-2xl font-bold text-green-600">{customerProjects.length}</p>
          </div>
          <Package className="h-8 w-8 text-green-600" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Gesamtkosten</p>
            {loadingCosts ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                <span className="text-sm text-gray-500">Berechne...</span>
              </div>
            ) : (
              <p className="text-2xl font-bold text-orange-600">
                {formatPrice(customerTotalCosts)}
              </p>
            )}
          </div>
          <Euro className="h-8 w-8 text-orange-600" />
        </div>
      </div>
    </div>
  );
};

export default CustomerStats;
