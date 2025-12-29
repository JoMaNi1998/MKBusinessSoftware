import React from 'react';
import {
  Plus,
  Minus,
  Search,
  AlertCircle,
  Layers,
  RefreshCcw,
  Sun,
  Zap,
  Battery,
  Car,
  Power,
  Target,
  Cpu,
  Plug,
  FileText,
  Truck,
  MoreHorizontal,
  Package
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SERVICE_CATEGORIES } from '@context/ServiceCatalogContext';
import type { OfferFormData } from '@app-types/components/offer.types';
import { formatCurrency } from '@utils';
import { LABOR_FACTOR_LABELS } from '@utils/offerHelpers';

interface Service {
  id: string;
  name: string;
  shortText?: string;
  category: string;
  unit: string;
  isPackage?: boolean;
  subItems?: Array<{ serviceId: string; quantity: number }>;
  replaces?: string[];
  calculatedPrices?: {
    unitPriceNet: number;
  };
}

interface CalcSettings {
  laborFactors?: Record<string, Array<{ id: string; label: string; laborFactor: number }>>;
}

interface ServicesStepProps {
  activeServices: Service[];
  selectedServices: Record<string, string>;
  serviceQuantities: Record<string, number>;
  onServiceSelection: (categoryId: string, serviceId: string) => void;
  onQuantityChange: (categoryId: string, delta: number) => void;
  getServiceById: (serviceId: string) => Service | undefined;
  calcSettings: CalcSettings;
  laborFactorSelections: Record<string, string>;
  onLaborFactorChange: (factorType: string, value: string) => void;
  serviceSearchTerm: string;
  onSearchChange: (term: string) => void;
  filteredServicesByCategory: Record<string, Service[]>;
  offerData: OfferFormData;
  onAddService: (service: Service) => void;
  validationErrors: Record<string, string>;
}

// Icon-Mapping
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Sun, Zap, Battery, Car, Power, Target, Cpu, Plug, FileText, Truck, MoreHorizontal
};

const ServicesStep: React.FC<ServicesStepProps> = ({
  activeServices,
  selectedServices,
  serviceQuantities,
  onServiceSelection,
  onQuantityChange,
  getServiceById,
  calcSettings,
  laborFactorSelections,
  onLaborFactorChange,
  serviceSearchTerm,
  onSearchChange,
  filteredServicesByCategory,
  offerData,
  onAddService,
  validationErrors
}) => {
  // Dropdown-Kategorien (nur Kategorien mit isDropdown=true)
  const dropdownCategories = SERVICE_CATEGORIES.filter(c => c.isDropdown);

  // Services für eine Kategorie holen
  const getServicesForCategory = (categoryId: string): Service[] => {
    return activeServices.filter(s => s.category === categoryId);
  };

  // Icon für Kategorie holen
  const getCategoryIcon = (iconName: string): React.ReactNode => {
    const IconComponent = CATEGORY_ICONS[iconName];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : <Package className="h-5 w-5" />;
  };

  // Ausgewählten Service für Kategorie holen
  const getSelectedService = (categoryId: string): Service | null => {
    const serviceId = selectedServices[categoryId];
    return serviceId ? (getServiceById(serviceId) || null) : null;
  };

  return (
    <div className="space-y-6">
      {/* Arbeitszeitfaktoren */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-medium text-amber-900 mb-3">Arbeitszeitfaktoren</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['dach', 'elektro', 'geruest'].map(factorType => {
            const factors = calcSettings?.laborFactors?.[factorType] || [];
            return (
              <div key={factorType}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {LABOR_FACTOR_LABELS[factorType]}
                </label>
                <select
                  value={laborFactorSelections[factorType]}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onLaborFactorChange(factorType, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {factors.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.label} {f.laborFactor > 1 ? `(+${Math.round((f.laborFactor - 1) * 100)}%)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-600 mt-2">Faktoren beeinflussen die Arbeitszeit je nach Leistungskategorie</p>
      </div>

      {validationErrors.items && (
        <div className="flex items-center space-x-2 text-red-500 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{validationErrors.items}</span>
        </div>
      )}

      {/* Dropdown-Auswahl für Hauptkategorien */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4">Leistungen konfigurieren</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dropdownCategories.map(category => {
            const categoryServices = getServicesForCategory(category.id);
            const selectedService = getSelectedService(category.id);
            const quantity = serviceQuantities[category.id] || 0;

            return (
              <div key={category.id} className="space-y-2">
                {/* Dropdown Label mit Icon */}
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">
                    {getCategoryIcon(category.icon)}
                  </span>
                  <label className="block text-sm font-medium text-gray-700">
                    {category.label}
                  </label>
                </div>

                {/* Dropdown */}
                <select
                  value={selectedServices[category.id] || ''}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onServiceSelection(category.id, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Keine Auswahl</option>
                  {categoryServices.map(svc => (
                    <option key={svc.id} value={svc.id}>
                      {svc.name} - {formatCurrency(svc.calculatedPrices?.unitPriceNet)}
                    </option>
                  ))}
                </select>

                {/* Mengen-Eingabe (wenn ausgewählt) */}
                {selectedServices[category.id] && (
                  <div className="flex items-center space-x-3 mt-2">
                    <span className="text-sm text-gray-600">Menge:</span>
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => onQuantityChange(category.id, -1)}
                        className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-l-lg"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 py-1 border-x border-gray-300 min-w-[40px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => onQuantityChange(category.id, 1)}
                        className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-r-lg"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Paket-Inhalt anzeigen */}
                {selectedService?.isPackage && (selectedService?.subItems?.length ?? 0) > 0 && (
                  <div className="text-xs bg-purple-50 border border-purple-200 p-2 mt-2 rounded-lg">
                    <div className="flex items-center text-purple-700 font-medium mb-1">
                      <Layers className="h-3 w-3 mr-1" />
                      Enthält:
                    </div>
                    <ul className="text-purple-600 space-y-0.5">
                      {selectedService?.subItems?.map((sub, idx) => {
                        const subService = getServiceById(sub.serviceId);
                        return (
                          <li key={idx}>• {subService?.name || sub.serviceId} (x{sub.quantity})</li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Ersetzungs-Hinweis */}
                {(selectedService?.replaces?.length ?? 0) > 0 && (
                  <div className="text-xs bg-orange-50 border border-orange-200 p-2 mt-2 rounded-lg flex items-start">
                    <RefreshCcw className="h-3 w-3 mr-1 mt-0.5 text-orange-600 flex-shrink-0" />
                    <span className="text-orange-700">
                      Ersetzt: {selectedService?.replaces?.map(id => getServiceById(id)?.name || id).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hinzugefügte Positionen Übersicht */}
      {offerData.items.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-blue-900">
              {offerData.items.length} Position(en) hinzugefügt
            </span>
            <span className="text-blue-700 font-bold">
              {formatCurrency(offerData.totals?.netTotal)}
            </span>
          </div>
          <div className="text-sm text-blue-700">
            {offerData.items.map(item => item.shortText).join(', ').substring(0, 100)}
            {offerData.items.map(item => item.shortText).join(', ').length > 100 && '...'}
          </div>
        </div>
      )}

      {/* Katalog-Kategorien (nicht-Dropdown) ausklappbar */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3">
          <h4 className="font-medium text-gray-700">Weitere Leistungen aus dem Katalog</h4>
          <p className="text-xs text-gray-500">PV-Montage, Elektroinstallation, Planung etc.</p>
        </div>

        {/* Suche für Katalog */}
        <div className="px-4 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={serviceSearchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
              placeholder="Leistungen suchen..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Katalog-Kategorien - nur anzeigen wenn Suchbegriff eingegeben */}
        {serviceSearchTerm.trim() && (
          <div className="divide-y divide-gray-100">
            {SERVICE_CATEGORIES.map(category => {
              const categoryServices = filteredServicesByCategory[category.id] || [];
              if (categoryServices.length === 0) return null;

              return (
                <div key={category.id}>
                  <div className="px-4 py-2 bg-gray-50 text-sm font-medium text-gray-600">
                    {category.label}
                  </div>
                  <div className="divide-y divide-gray-50">
                    {categoryServices.map(service => (
                      <div
                        key={service.id}
                        className="px-4 py-2 flex items-center justify-between hover:bg-gray-50"
                      >
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="text-sm font-medium text-gray-900 truncate">{service.name}</p>
                          <p className="text-xs text-gray-500 truncate">{service.shortText}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-medium text-gray-700">
                            {formatCurrency(service.calculatedPrices?.unitPriceNet)} / {service.unit}
                          </span>
                          <button
                            onClick={() => onAddService(service)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesStep;
