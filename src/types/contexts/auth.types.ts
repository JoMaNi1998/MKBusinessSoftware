/**
 * Type Definitions für den AuthContext
 *
 * Types für Authentifizierung, User-Management
 * und Auth-spezifische Operationen.
 */

import type { User } from 'firebase/auth';

// ============================================
// AUTH CONTEXT VALUE
// ============================================

export interface AuthContextValue {
  // State
  user: User | null;
  loading: boolean;
  error: string | null;

  // Auth Operations
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

// ============================================
// AUTH USER (Extended)
// ============================================

export interface ExtendedAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: string;
  permissions?: string[];
}

// ============================================
// AUTH ERROR TYPES
// ============================================

export type AuthErrorCode =
  | 'auth/invalid-email'
  | 'auth/user-disabled'
  | 'auth/user-not-found'
  | 'auth/wrong-password'
  | 'auth/email-already-in-use'
  | 'auth/weak-password'
  | 'auth/network-request-failed'
  | 'auth/too-many-requests';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}
