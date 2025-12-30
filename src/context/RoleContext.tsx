import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import type { RoleContextValue, RoleContextSafeValue } from '../types/contexts/role.types';
import { UserRole } from '../types/enums';

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export const useRole = (): RoleContextValue => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

// Sicherer Hook mit Fallback - Default: KEIN Zugriff (Security by Default)
export const useRoleSafe = (): RoleContextValue | RoleContextSafeValue => {
  const context = useContext(RoleContext);
  if (!context) {
    // Fallback-Werte wenn RoleProvider nicht verfügbar ist
    // WICHTIG: Default ist KEIN Zugriff aus Sicherheitsgründen
    return {
      userRole: null,
      permissions: [],
      loading: true, // Loading = true verhindert Rendering bis Context da ist
      hasPermission: () => false,
      isAdmin: () => false,
      isPVAdmin: () => false,
      canAccessModule: () => false,
      assignUserRole: async () => { throw new Error('RoleProvider nicht verfügbar'); },
      setupFirstAdmin: async () => { throw new Error('RoleProvider nicht verfügbar'); },
      loadUserRole: () => {}
    };
  }
  return context;
};

interface RoleProviderProps {
  children: React.ReactNode;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadUserRole = async (): Promise<void> => {
    if (!user) {
      setUserRole(null);
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Token neu laden um aktuelle Custom Claims zu erhalten
      const token = await user.getIdTokenResult(true);
      const claims = token.claims;

      if (claims.role && claims.permissions) {
        setUserRole(claims.role as string);
        setPermissions((claims.permissions as string[]) || []);
      } else {
        // Fallback: Standard-Monteur-Rolle (nur monteur Permission)
        setUserRole(UserRole.MONTEUR);
        setPermissions(['monteur']);
      }
    } catch (error) {
      console.error('Fehler beim Laden der User-Rolle:', error);
      setUserRole(UserRole.MONTEUR);
      setPermissions(['monteur']);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserRole();
    } else {
      setUserRole(null);
      setPermissions([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const isAdmin = (): boolean => {
    return userRole === UserRole.ADMIN || userRole === 'admin';
  };

  const isProjektleiter = (): boolean => {
    return userRole === UserRole.PROJEKTLEITER || userRole === 'projektleiter' || isAdmin();
  };

  const isMonteur = (): boolean => {
    return userRole === UserRole.MONTEUR || userRole === 'monteur';
  };

  const canAccessModule = (module: string): boolean => {
    // Admins haben Zugriff auf ALLE Module
    if (isAdmin()) return true;
    return hasPermission(module);
  };

  // Cloud Function zum Setzen von Rollen (nur für Admins)
  const assignUserRole = async (targetUserId: string, newRole: UserRole | string): Promise<unknown> => {
    if (!isAdmin()) {
      throw new Error('Nur Admins können Rollen setzen');
    }

    try {
      const setRoleFunction = httpsCallable(functions, 'setUserRole');
      const result = await setRoleFunction({ uid: targetUserId, role: newRole });
      return result.data;
    } catch (error) {
      console.error('Fehler beim Setzen der Rolle:', error);
      throw error;
    }
  };

  // Ersten Admin einrichten
  const setupFirstAdmin = async (): Promise<unknown> => {
    try {
      const setupFunction = httpsCallable(functions, 'setupFirstAdmin');
      const result = await setupFunction();
      await loadUserRole(); // Rolle neu laden
      return result.data;
    } catch (error) {
      console.error('Fehler beim Einrichten des ersten Admins:', error);
      throw error;
    }
  };

  const value: RoleContextValue = {
    userRole,
    permissions,
    loading,
    hasPermission,
    isAdmin,
    isProjektleiter,
    isMonteur,
    canAccessModule,
    assignUserRole,
    setupFirstAdmin,
    loadUserRole
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};
