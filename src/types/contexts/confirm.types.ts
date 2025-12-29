/**
 * Type Definitions für den ConfirmContext
 *
 * Types für Bestätigungs-Dialoge, Modal-Optionen
 * und Confirm-spezifische Operationen.
 */

import { ConfirmVariant } from '../enums';

// ============================================
// CONFIRM OPTIONS
// ============================================

export interface ConfirmOptions {
  title?: string;
  message?: string;
  variant?: ConfirmVariant;
  confirmText?: string | null;
  cancelText?: string;
  /** Async callback - wenn gesetzt, bleibt Modal offen bis Promise resolved */
  onConfirmAsync?: () => Promise<void>;
}

// ============================================
// CONFIRM STATE
// ============================================

export interface ConfirmState {
  isOpen: boolean;
  isLoading: boolean;
  title: string;
  message: string;
  variant: ConfirmVariant;
  confirmText: string | null;
  cancelText: string;
  resolve: ((value: boolean) => void) | null;
  onConfirmAsync: (() => Promise<void>) | null;
}

// ============================================
// VARIANT CONFIGURATION
// ============================================

export interface VariantConfig {
  icon: string;
  iconColor: string;
  confirmButtonClass: string;
  confirmText: string;
}

export const VARIANT_CONFIG: Record<ConfirmVariant, VariantConfig> = {
  [ConfirmVariant.DANGER]: {
    icon: 'Trash2',
    iconColor: 'text-red-500',
    confirmButtonClass: 'bg-red-500 hover:bg-red-600 text-white',
    confirmText: 'Löschen'
  },
  [ConfirmVariant.WARNING]: {
    icon: 'AlertTriangle',
    iconColor: 'text-orange-500',
    confirmButtonClass: 'bg-orange-500 hover:bg-orange-600 text-white',
    confirmText: 'Fortfahren'
  },
  [ConfirmVariant.INFO]: {
    icon: 'Info',
    iconColor: 'text-blue-500',
    confirmButtonClass: 'bg-blue-500 hover:bg-blue-600 text-white',
    confirmText: 'Bestätigen'
  }
};

// ============================================
// CONFIRM CONTEXT VALUE
// ============================================

export interface ConfirmContextValue {
  /**
   * Zeigt Bestätigungs-Dialog und gibt Promise zurück
   * @returns Promise<boolean> - true wenn bestätigt, false wenn abgebrochen
   */
  confirm: (options: ConfirmOptions) => Promise<boolean>;

  /**
   * Shortcut für Löschen-Bestätigung
   * @param itemName - Name des zu löschenden Elements
   * @param itemType - Typ des Elements (z.B. "Material", "Kunde")
   * @returns Promise<boolean>
   */
  confirmDelete: (itemName: string, itemType?: string) => Promise<boolean>;
}
