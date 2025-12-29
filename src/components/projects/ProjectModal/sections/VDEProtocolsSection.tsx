import React from 'react';
import { FileText, Eye } from 'lucide-react';
import { cn } from '@utils/customerHelpers';
import { formatDate } from '@utils';
import { getVdeStatusColor } from '@utils/projectHelpers';

interface VDEProtocol {
  protocolNumber?: string;
  status?: string;
  createdAt?: any;
  createdDate?: any;
}

interface VDEProtocolsSectionProps {
  protocols: VDEProtocol[];
  loading: boolean;
  onProtocolClick: (protocol: VDEProtocol) => void;
}

const VDEProtocolsSection: React.FC<VDEProtocolsSectionProps> = ({
  protocols,
  loading,
  onProtocolClick
}) => {
  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Lade VDE-Protokolle...</p>
        </div>
      ) : protocols.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Keine VDE-Protokolle</h3>
          <p className="mt-1 text-sm text-gray-500">
            Für dieses Projekt wurden noch keine VDE-Protokolle erstellt.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {protocols.map((protocol, idx) => (
            <div
              key={idx}
              className="bg-white border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
              onClick={() => onProtocolClick(protocol)}
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-gray-900">
                  {protocol.protocolNumber || 'VDE-Protokoll'}
                </span>
                {protocol.status && (
                  <span className={cn('px-2 py-0.5 rounded-full text-xs', getVdeStatusColor(protocol.status))}>
                    {protocol.status}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {formatDate(protocol.createdAt || protocol.createdDate)}
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

export default VDEProtocolsSection;
