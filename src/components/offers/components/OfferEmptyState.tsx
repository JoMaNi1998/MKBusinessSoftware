import React from 'react';
import { FileText } from 'lucide-react';
import type { OfferEmptyStateProps } from '@app-types/components/offer.types';

const OfferEmptyState: React.FC<OfferEmptyStateProps> = ({ hasOffers, onNewOffer }) => {
  return (
    <div className="text-center py-12">
      <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Angebote gefunden</h3>
      <p className="text-gray-500 mb-4">
        {!hasOffers
          ? 'Erstellen Sie Ihr erstes Angebot'
          : 'Passen Sie Ihre Filterkriterien an'}
      </p>
      {!hasOffers && (
        <button
          onClick={onNewOffer}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Erstes Angebot erstellen
        </button>
      )}
    </div>
  );
};

export default OfferEmptyState;
