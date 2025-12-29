/**
 * Type Definitions für den RoleContext
 *
 * Types für Benutzerverwaltung, Rollen, Berechtigungen
 * und Role-spezifische Operationen.
 */

import { UserRole } from '../enums';

// ============================================
// ROLE CONTEXT VALUE
// ============================================

export interface RoleContextValue {
  // State
  userRole: UserRole | string | null;
  permissions: string[];
  loading: boolean;

  // Permission Checks
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  isProjektleiter: () => boolean;
  isMonteur: () => boolean;
  canAccessModule: (module: string) => boolean;

  // Admin Operations
  assignUserRole: (targetUserId: string, newRole: UserRole | string) => Promise<unknown>;
  setupFirstAdmin: () => Promise<unknown>;
  loadUserRole: () => Promise<void>;
}

// ============================================
// ROLE CONTEXT SAFE VALUE (FALLBACK)
// ============================================

export interface RoleContextSafeValue {
  userRole: null;
  permissions: string[];
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  isPVAdmin: () => boolean;
  canAccessModule: (module: string) => boolean;
  assignUserRole: (targetUserId: string, newRole: UserRole | string) => Promise<never>;
  setupFirstAdmin: () => Promise<never>;
  loadUserRole: () => void;
}
