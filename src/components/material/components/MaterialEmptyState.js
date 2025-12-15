import React from 'react';
import { Package } from 'lucide-react';

const MaterialEmptyState = ({ hasFilters }) => {
  return (
    <div className="text-center py-12">
      <Package className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Materialien gefunden</h3>
      <p className="mt-1 text-sm text-gray-500">
        {hasFilters
          ? 'Versuchen Sie andere Suchbegriffe oder Filter.'
          : 'Beginnen Sie mit dem Hinzufügen Ihres ersten Materials.'
        }
      </p>
    </div>
  );
};

export default MaterialEmptyState;
