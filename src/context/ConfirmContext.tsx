import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmModal from '../components/shared/ConfirmModal';
import type {
  ConfirmContextValue,
  ConfirmOptions,
  ConfirmState,
  VARIANT_CONFIG
} from '../types/contexts/confirm.types';
import { ConfirmVariant } from '../types/enums';

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

/**
 * Hook zum Verwenden des Confirmation Dialogs
 * @throws {Error} Wenn außerhalb des ConfirmProviders verwendet
 */
export const useConfirm = (): ConfirmContextValue => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context;
};

// Vordefinierte Varianten für verschiedene Aktionen
const VARIANTS: typeof VARIANT_CONFIG = {
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

interface ConfirmProviderProps {
  children: React.ReactNode;
}

/**
 * Provider für globale Confirmation Dialogs
 *
 * Ersetzt window.confirm() mit einem schönen, konsistenten Dialog.
 *
 * Features:
 * - Promise-based API (async/await)
 * - Vordefinierte Varianten (danger, warning, info)
 * - Keyboard-Support (Enter, Escape)
 * - Shortcuts für häufige Aktionen (confirmDelete)
 */
export const ConfirmProvider: React.FC<ConfirmProviderProps> = ({ children }) => {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    isLoading: false,
    title: '',
    message: '',
    variant: ConfirmVariant.DANGER,
    confirmText: null,
    cancelText: 'Abbrechen',
    resolve: null,
    onConfirmAsync: null
  });

  /**
   * Zeigt Bestätigungs-Dialog und gibt Promise zurück
   *
   * @param options - Konfiguration für den Dialog
   * @returns Promise<boolean> - true wenn bestätigt, false wenn abgebrochen
   *
   * @example
   * const confirmed = await confirm({
   *   title: 'Datei löschen',
   *   message: 'Möchten Sie diese Datei wirklich löschen?',
   *   variant: ConfirmVariant.DANGER
   * });
   * if (confirmed) {
   *   deleteFile();
   * }
   */
  const confirm = useCallback(({
    title = 'Bestätigung',
    message = 'Möchten Sie fortfahren?',
    variant = ConfirmVariant.DANGER,
    confirmText = null,
    cancelText = 'Abbrechen',
    onConfirmAsync = undefined
  }: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        isLoading: false,
        title,
        message,
        variant,
        confirmText: confirmText || VARIANTS[variant]?.confirmText || 'Bestätigen',
        cancelText,
        resolve,
        onConfirmAsync: onConfirmAsync || null
      });
    });
  }, []);

  /**
   * Shortcut für Löschen-Bestätigung
   *
   * @param itemName - Name des zu löschenden Elements
   * @param itemType - Typ des Elements (z.B. "Material", "Kunde")
   * @returns Promise<boolean>
   *
   * @example
   * const confirmed = await confirmDelete('PV-Modul XYZ', 'Material');
   * if (confirmed) {
   *   deleteMaterial(id);
   * }
   */
  const confirmDelete = useCallback((itemName: string, itemType: string = 'Element'): Promise<boolean> => {
    return confirm({
      title: `${itemType} löschen`,
      message: `Möchten Sie "${itemName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      variant: ConfirmVariant.DANGER,
      confirmText: 'Löschen'
    });
  }, [confirm]);

  const handleConfirm = async (): Promise<void> => {
    if (state.onConfirmAsync) {
      // Async-Modus: Modal bleibt offen mit Spinner bis Operation fertig
      setState(prev => ({ ...prev, isLoading: true }));
      try {
        await state.onConfirmAsync();
        state.resolve?.(true);
      } catch (error) {
        state.resolve?.(false);
      } finally {
        setState(prev => ({ ...prev, isLoading: false, isOpen: false }));
      }
    } else {
      // Standard-Modus: Modal schließt sofort
      state.resolve?.(true);
      setState(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleCancel = (): void => {
    state.resolve?.(false);
    setState(prev => ({ ...prev, isOpen: false }));
  };

  const value: ConfirmContextValue = {
    confirm,
    confirmDelete
  };

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmModal
        isOpen={state.isOpen}
        isLoading={state.isLoading}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title={state.title}
        message={state.message}
        variant={state.variant}
        confirmText={state.confirmText ?? undefined}
        cancelText={state.cancelText}
      />
    </ConfirmContext.Provider>
  );
};

export default ConfirmProvider;
