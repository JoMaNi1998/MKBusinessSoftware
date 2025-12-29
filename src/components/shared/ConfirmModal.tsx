import React, { useEffect, useRef } from 'react';
import { X, Trash2, AlertTriangle, Info, Loader2, LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  Trash2,
  AlertTriangle,
  Info
};

type VariantType = 'danger' | 'warning' | 'info';

interface VariantConfig {
  icon: string;
  iconBg: string;
  iconColor: string;
  confirmButtonClass: string;
}

const VARIANTS: Record<VariantType, VariantConfig> = {
  danger: {
    icon: 'Trash2',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-500',
    confirmButtonClass: 'bg-red-500 hover:bg-red-600 text-white'
  },
  warning: {
    icon: 'AlertTriangle',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-500',
    confirmButtonClass: 'bg-orange-500 hover:bg-orange-600 text-white'
  },
  info: {
    icon: 'Info',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-500',
    confirmButtonClass: 'bg-blue-500 hover:bg-blue-600 text-white'
  }
};

interface ConfirmModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  variant?: VariantType;
  confirmText?: string;
  cancelText?: string;
}

/**
 * Confirmation Modal Component
 *
 * Schöner, konsistenter Dialog für Bestätigungen.
 * Wird vom ConfirmContext gesteuert.
 *
 * Features:
 * - 3 Varianten (danger, warning, info)
 * - Keyboard Support (Enter, Escape)
 * - Auto-Focus auf Confirm-Button
 * - Click-Outside zum Schließen
 */
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  isLoading = false,
  onConfirm,
  onCancel,
  title,
  message,
  variant = 'danger',
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen'
}) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const variantConfig = VARIANTS[variant] || VARIANTS.danger;
  const IconComponent = ICONS[variantConfig.icon];

  // Focus auf Confirm-Button wenn Modal öffnet
  useEffect(() => {
    if (isOpen) {
      confirmButtonRef.current?.focus();
    }
  }, [isOpen]);

  // Keyboard Handling (disabled während Loading)
  useEffect(() => {
    if (!isOpen || isLoading) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={isLoading ? undefined : onCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
          {/* Close Button (versteckt während Loading) */}
          {!isLoading && (
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-full ${variantConfig.iconBg}`}>
              <IconComponent className={`w-8 h-8 ${variantConfig.iconColor}`} />
            </div>
          </div>

          {/* Content */}
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            {title}
          </h3>
          <p className="text-gray-600 text-center mb-6 whitespace-pre-line">
            {message}
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 transition-colors font-medium ${
                isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
              }`}
            >
              {cancelText}
            </button>
            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${variantConfig.confirmButtonClass} ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
