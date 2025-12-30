import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Package, Zap, Edit3, FileText } from 'lucide-react';
import type { AggregatedMaterial } from '@services/BookingAggregationService';

interface BOMSectionProps {
  title: string;
  icon: React.ElementType;
  items: AggregatedMaterial[];
  bgColor: string;
  borderColor: string;
  iconColor: string;
  defaultExpanded?: boolean;
  completedItems?: Set<string>;
  onToggleCompleted?: (materialId: string) => void;
}

/**
 * Collapsible Section für eine Kategorie von BOM-Items
 */
const BOMSection: React.FC<BOMSectionProps> = ({
  title,
  icon: Icon,
  items,
  bgColor,
  borderColor,
  iconColor,
  defaultExpanded = true,
  completedItems = new Set(),
  onToggleCompleted
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (items.length === 0) return null;

  return (
    <div className={`rounded-xl border ${borderColor} overflow-hidden`}>
      {/* Section Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full ${bgColor} px-4 py-3 flex items-center justify-between`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          <span className="font-semibold text-gray-800">{title}</span>
          <span className="text-sm text-gray-500">({items.length})</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {/* Items */}
      {isExpanded && (
        <div className="divide-y divide-gray-100">
          {items.map((item) => {
            const isCompleted = completedItems.has(item.materialId);
            return (
              <div
                key={item.materialId}
                onClick={() => onToggleCompleted?.(item.materialId)}
                className={`bg-white px-4 py-3 flex items-center justify-between cursor-pointer active:bg-gray-50 transition-opacity ${
                  isCompleted ? 'opacity-50' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${
                    isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}>
                    {item.description}
                  </p>
                  <p className={`text-sm ${
                    isCompleted ? 'line-through text-gray-400' : 'text-gray-500'
                  }`}>{item.materialID}</p>
                </div>
                <div className="flex-shrink-0 ml-3 text-right">
                  <p className={`font-semibold ${
                    isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}>{item.netQuantity}</p>
                  <p className={`text-xs ${
                    isCompleted ? 'text-gray-400' : 'text-gray-500'
                  }`}>{item.unit}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface MonteurBOMListProps {
  configuredItems: AggregatedMaterial[];
  autoItems: AggregatedMaterial[];
  manualItems: AggregatedMaterial[];
  completedItems?: Set<string>;
  onToggleCompleted?: (materialId: string) => void;
}

/**
 * Mobile-optimierte Stücklisten-Anzeige
 *
 * Zeigt BOM-Items in 3 Kategorien:
 * - Konfiguriert (aus PV-Konfigurator)
 * - Automatisch (berechnet aus Buchungen)
 * - Manuell (händisch hinzugefügt)
 *
 * Unterstützt Durchstreichen-Funktion durch Klick auf Item.
 */
const MonteurBOMList: React.FC<MonteurBOMListProps> = ({
  configuredItems,
  autoItems,
  manualItems,
  completedItems = new Set(),
  onToggleCompleted
}) => {
  const totalCount = configuredItems.length + autoItems.length + manualItems.length;

  if (totalCount === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 font-medium text-gray-900">Keine Materialien</h3>
        <p className="mt-1 text-sm text-gray-500">
          Für dieses Projekt wurden noch keine Materialien gebucht.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <BOMSection
        title="Konfiguriert"
        icon={Package}
        items={configuredItems}
        bgColor="bg-primary-50"
        borderColor="border-primary-200"
        iconColor="text-primary-600"
        defaultExpanded={true}
        completedItems={completedItems}
        onToggleCompleted={onToggleCompleted}
      />

      <BOMSection
        title="Automatisch"
        icon={Zap}
        items={autoItems}
        bgColor="bg-gray-50"
        borderColor="border-gray-200"
        iconColor="text-gray-600"
        defaultExpanded={true}
        completedItems={completedItems}
        onToggleCompleted={onToggleCompleted}
      />

      <BOMSection
        title="Manuell"
        icon={Edit3}
        items={manualItems}
        bgColor="bg-green-50"
        borderColor="border-green-200"
        iconColor="text-green-600"
        defaultExpanded={true}
        completedItems={completedItems}
        onToggleCompleted={onToggleCompleted}
      />
    </div>
  );
};

export default MonteurBOMList;
