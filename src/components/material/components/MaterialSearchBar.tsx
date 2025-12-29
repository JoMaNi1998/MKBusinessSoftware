import React from 'react';
import { Search, QrCode } from 'lucide-react';
import type { MaterialSearchBarProps } from '@app-types/components/material.types';

const MaterialSearchBar: React.FC<MaterialSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onOpenQRScanner,
  isMobile = false
}) => {
  return (
    <div className={`flex items-center gap-2 ${isMobile ? '' : 'flex-1'}`}>
      <div className={`relative ${isMobile ? 'flex-1' : 'flex-1'}`}>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Suchen..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
      <button
        onClick={onOpenQRScanner}
        className="p-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex-shrink-0"
        title="QR-Code scannen"
      >
        <QrCode className="h-4 w-4" />
      </button>
    </div>
  );
};

export default MaterialSearchBar;
