import React, { useMemo, ReactNode } from 'react';
import {
  X,
  Sun,
  Edit,
  Package,
  Users,
  MapPin
} from 'lucide-react';
import { useCustomers } from '@context/CustomerContext';
import { useProjects } from '@context/ProjectContext';
import { CONFIG_STATUS, CONFIG_STATUS_LABELS } from '@context/ConfiguratorContext';
import type { Customer, Project } from '@app-types';
import type { Configuration, ConfiguratorBOMItem, ConfigurationStatus } from '@app-types/contexts/configurator.types';

interface ConfigPreviewProps {
  config: Configuration | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (config: Configuration) => void;
  onBook?: (config: Configuration) => void;
}

const ConfigPreview: React.FC<ConfigPreviewProps> = ({ config, isOpen, onClose, onEdit, onBook }) => {
  const { customers } = useCustomers();
  const { projects } = useProjects();

  const customer = useMemo((): Customer | undefined => {
    return customers.find((c: Customer) => c.id === config?.customerID);
  }, [customers, config?.customerID]);

  const project = useMemo((): Project | undefined => {
    return projects.find((p: Project) => p.id === config?.projectID);
  }, [projects, config?.projectID]);

  // BOM aufteilen in Kategorien
  const bomCategories = useMemo(() => {
    const bom = config?.billOfMaterials || [];
    return {
      configured: bom.filter(item => item.isConfigured),
      auto: bom.filter(item => !item.isConfigured && !item.isManual),
      manual: bom.filter(item => item.isManual)
    };
  }, [config?.billOfMaterials]);

  const formatDate = (dateString: any): string => {
    if (!dateString) return '-';
    try {
      const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return String(dateString);
    }
  };

  const getStatusBadge = (status: ConfigurationStatus): ReactNode => {
    const statusInfo = CONFIG_STATUS_LABELS[status] || { label: status, color: 'gray' };
    const colorClasses: { [key: string]: string } = {
      gray: 'bg-gray-100 text-gray-700',
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses[statusInfo.color]}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (!isOpen || !config) return null;

  const isBooked = config.status === CONFIG_STATUS.BOOKED;

  // BOM Tabelle rendern
  const renderBOMTable = (items: ConfiguratorBOMItem[], title: string, bgColor: string, borderColor: string): ReactNode => {
    if (!items || items.length === 0) return null;

    return (
      <div className={`border ${borderColor} rounded-lg overflow-hidden mb-4`}>
        <div className={`${bgColor} px-4 py-2 border-b ${borderColor}`}>
          <h4 className="font-semibold text-gray-800 text-sm flex items-center">
            {title}
            <span className="ml-2 text-xs font-normal text-gray-500">({items.length} Positionen)</span>
          </h4>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Material
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Anzahl
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Einheit
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item, index) => (
              <tr key={index}>
                <td className="px-4 py-2 whitespace-nowrap text-sm">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  {item.articleNumber && (
                    <div className="text-xs text-gray-500">{String(item.articleNumber)}</div>
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                  {item.quantity}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {item.unit || 'Stk'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 !m-0 !top-0">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header mit Titel links und Buttons rechts */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Sun className="h-5 w-5 text-yellow-500" />
            <span className="text-lg font-semibold text-gray-900">Konfigurationsvorschau</span>
            <span className="font-medium text-gray-600">{config.configNumber}</span>
            {getStatusBadge(config.status)}
          </div>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(config)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center"
              >
                <Edit className="h-4 w-4 mr-1" />
                Bearbeiten
              </button>
            )}
            {onBook && (
              <button
                onClick={() => onBook(config)}
                disabled={isBooked}
                className={`px-3 py-1.5 text-sm rounded-lg flex items-center font-medium ${
                  isBooked
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-green-600 hover:bg-green-50'
                }`}
              >
                <Package className="h-4 w-4 mr-1" />
                {isBooked ? 'Bereits gebucht' : 'Buchen'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollbarer Inhalt */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Kopfbereich: Kunde & Projekt */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kunde */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Kunde</p>
                    <p className="font-medium text-gray-900">
                      {customer?.firmennameKundenname || customer?.name || '-'}
                    </p>
                    {customer?.strasse && (
                      <p className="text-sm text-gray-600">{customer.strasse}</p>
                    )}
                    {customer?.plz && (
                      <p className="text-sm text-gray-600">{customer.plz} {customer.ort}</p>
                    )}
                  </div>
                </div>

                {/* Projekt */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Projekt</p>
                    <p className="font-medium text-gray-900">
                      {project?.name || project?.name || '-'}
                    </p>
                    {(project?.street || project?.houseNumber) && (
                      <p className="text-sm text-gray-600">{project.street} {project.houseNumber}</p>
                    )}
                    {(project?.postalCode || project?.city) && (
                      <p className="text-sm text-gray-600">{project.postalCode} {project.city}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Datum-Info */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm text-gray-500">
                <span>Erstellt: {formatDate(config.createdAt)}</span>
                {config.name && <span className="font-medium text-gray-700">{config.name}</span>}
              </div>
            </div>

            {/* Stückliste */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Package className="h-5 w-5 text-gray-500 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Stückliste</h2>
                </div>
                <span className="text-sm text-gray-500">
                  {config.billOfMaterials?.length || 0} Positionen
                </span>
              </div>

              {config.billOfMaterials && config.billOfMaterials.length > 0 ? (
                <div className="space-y-4">
                  {renderBOMTable(
                    bomCategories.configured,
                    'Konfigurierte Komponenten',
                    'bg-blue-50',
                    'border-blue-200'
                  )}
                  {renderBOMTable(
                    bomCategories.auto,
                    'Automatisch berechnetes Material',
                    'bg-gray-50',
                    'border-gray-200'
                  )}
                  {renderBOMTable(
                    bomCategories.manual,
                    'Manuell hinzugefügt',
                    'bg-green-50',
                    'border-green-200'
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Keine Stückliste vorhanden. Bitte speichern Sie die Konfiguration erneut.
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPreview;
