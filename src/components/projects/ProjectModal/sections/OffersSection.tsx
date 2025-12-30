import React from 'react';
import { FileText, Eye } from 'lucide-react';
import { cn } from '@utils/customerHelpers';
import { formatDate, formatPrice } from '@utils';
import { OFFER_STATUS_LABELS } from '@context/OfferContext';
import type { OffersSectionProps } from '@app-types/components/project.types';

const getOfferStatusColor = (status: string): string => {
  const config = OFFER_STATUS_LABELS[status as keyof typeof OFFER_STATUS_LABELS];
  if (!config) return 'bg-gray-100 text-gray-800';

  const colorMap: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    orange: 'bg-orange-100 text-orange-800'
  };

  return colorMap[config.color] || 'bg-gray-100 text-gray-800';
};

const getOfferStatusLabel = (status: string): string => {
  const config = OFFER_STATUS_LABELS[status as keyof typeof OFFER_STATUS_LABELS];
  return config?.label || status;
};

const OffersSection: React.FC<OffersSectionProps> = ({
  offers,
  loading,
  onOfferClick
}) => {
  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Lade Angebote...</p>
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Angebote</h3>
          <p className="mt-1 text-sm text-gray-500">
            Für dieses Projekt wurden noch keine Angebote erstellt.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
              onClick={() => onOfferClick(offer)}
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-gray-900">
                  {offer.offerNumber || 'Angebot'}
                </span>
                {offer.status && (
                  <span className={cn('px-2 py-0.5 rounded-full text-xs', getOfferStatusColor(offer.status))}>
                    {getOfferStatusLabel(offer.status)}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {offer.totals?.grossTotal !== undefined && (
                  <span className="text-sm font-medium text-gray-700">
                    {formatPrice(offer.totals.grossTotal)}
                  </span>
                )}
                <span className="text-sm text-gray-500">
                  {formatDate(offer.offerDate || offer.createdAt)}
                </span>
                <Eye className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OffersSection;
