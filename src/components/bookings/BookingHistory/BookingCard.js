import React from 'react';
import {
  User,
  Package,
  Building,
  TrendingDown,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { formatDateTime } from '../../../utils/dateUtils';

const getTypeIcon = (type) => {
  return type === 'Eingang' ?
    <TrendingUp className="h-4 w-4 text-green-600" /> :
    <TrendingDown className="h-4 w-4 text-red-600" />;
};

const getTypeColor = (type) => {
  return type === 'Eingang' ?
    'bg-green-100 text-green-800' :
    'bg-red-100 text-red-800';
};

const BookingCard = ({ entry, onUndo }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header mit Typ und Datum */}
          <div className="flex items-center space-x-3 mb-2">
            {getTypeIcon(entry.type)}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(entry.type)}`}>
              {entry.type}
            </span>
            <span className="text-sm text-gray-500">
              {formatDateTime(entry.date || entry.timestamp || entry.createdAt)}
            </span>
          </div>

          {/* Kunde */}
          <div className="flex items-center space-x-2 mb-3">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {entry.customerName || 'Unbekannt'}
            </span>
            {entry.customerID && (
              <span className="text-sm text-gray-500">
                ({entry.customerID})
              </span>
            )}
          </div>

          {/* Projekt */}
          {entry.projectName && entry.projectName !== 'Unbekannt' ? (
            <div className="flex items-center space-x-2 mb-3">
              <Building className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-blue-900">
                Projekt: {entry.projectName}
              </span>
            </div>
          ) : entry.projectID && (
            <div className="flex items-center space-x-2 mb-3">
              <Building className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-blue-900">
                Projekt-ID: {entry.projectID}
              </span>
            </div>
          )}

          {/* Materialien */}
          <div className="space-y-2">
            {(entry.materials || []).map((material, index) => (
              <div key={index} className="flex items-center space-x-3 text-sm">
                <Package className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900">
                  {material.quantity}x
                </span>
                <span className="font-medium text-gray-900">
                  {material.description || material.materialName || '-'}
                </span>
                <span className="text-gray-500 text-xs">
                  {material.materialID || material.materialId || ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Undo Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onUndo(entry.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Buchung rückgängig machen"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
