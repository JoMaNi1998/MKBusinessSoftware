import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface ProjectActionCardProps {
  /** Lucide Icon Component */
  icon: LucideIcon;
  /** Titel der Aktion */
  title: string;
  /** Kurze Beschreibung */
  description: string;
  /** Click Handler */
  onClick: () => void;
  /** Optional: Badge mit Anzahl */
  badge?: number;
  /** Optional: Deaktiviert */
  disabled?: boolean;
  /** Optional: Farb-Variante */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

/**
 * ProjectActionCard - Wiederverwendbare Aktions-Karte für Monteur-Detail
 *
 * Mobile-optimiert mit:
 * - Großem Touch-Target (min 100px)
 * - Icon + Titel + Beschreibung
 * - Optionalem Badge
 */
const ProjectActionCard: React.FC<ProjectActionCardProps> = ({
  icon: Icon,
  title,
  description,
  onClick,
  badge,
  disabled = false,
  variant = 'default'
}) => {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-600',
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-amber-100 text-amber-600',
    danger: 'bg-red-100 text-red-600'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full bg-white rounded-xl p-4 text-left shadow-sm border border-gray-200
        min-h-[100px] flex flex-col justify-between
        transition-colors touch-manipulation
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:bg-gray-50 hover:border-gray-300'}
      `}
    >
      {/* Header mit Icon und Badge */}
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${variantStyles[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {badge !== undefined && badge > 0 && (
          <span className="bg-primary-100 text-primary-700 text-xs font-medium px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>

      {/* Titel und Beschreibung */}
      <div className="mt-3">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </button>
  );
};

export default ProjectActionCard;
