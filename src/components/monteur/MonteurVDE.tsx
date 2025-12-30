import React from 'react';
import { useParams } from 'react-router-dom';
import VDEProtocolView from './components/VDEProtocolView';

/**
 * MonteurVDE - Separate Seite für VDE-Protokolle
 */
const MonteurVDE: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="font-medium text-gray-900">VDE-Protokolle</h2>
        </div>
        <div className="p-4">
          <VDEProtocolView projectId={id!} />
        </div>
      </div>
    </div>
  );
};

export default MonteurVDE;
