import React from 'react';
import { Plus } from 'lucide-react';

const OfferHeader = ({ onNewOffer }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
      <div className="pl-12 sm:pl-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Angebote</h1>
        <p className="mt-1 text-sm text-gray-600 hidden sm:block">
          Verwalten Sie Ihre Angebote und Kostenvoranschläge
        </p>
      </div>
      <button
        onClick={onNewOffer}
        className="bg-primary-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Neues Angebot</span>
        <span className="sm:hidden">Neu</span>
      </button>
    </div>
  );
};

export default OfferHeader;
