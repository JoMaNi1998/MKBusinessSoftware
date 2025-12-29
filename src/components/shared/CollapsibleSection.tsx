import React, { useState } from 'react';
import { ChevronDown, ChevronRight, LucideIcon } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  count?: number | string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Wiederverwendbare ausklappbare Sektion
 *
 * Verwendung:
 * <CollapsibleSection title="Titel" count={5} icon={Package} defaultOpen={true}>
 *   <Content />
 * </CollapsibleSection>
 *
 * Mit Header-Aktion:
 * <CollapsibleSection title="Kontakte" headerAction={<Button>Hinzufügen</Button>}>
 *   <Content />
 * </CollapsibleSection>
 */
const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  count,
  icon: Icon,
  defaultOpen = false,
  headerAction,
  children
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-gray-50">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
        >
          {isOpen ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
          {Icon && <Icon className="h-5 w-5 text-gray-500" />}
          <span className="font-medium text-gray-900">{title}</span>
          {count !== undefined && (
            <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-sm rounded-full">
              {count}
            </span>
          )}
        </button>
        {headerAction && isOpen && (
          <div onClick={(e) => e.stopPropagation()}>
            {headerAction}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="p-4 border-t bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
