import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

const RoleContext = createContext();

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

// Sicherer Hook mit Fallback
export const useRoleSafe = () => {
  const context = useContext(RoleContext);
  if (!context) {
    // Fallback-Werte wenn RoleProvider nicht verfügbar ist
    return {
      userRole: null,
      permissions: [],
      loading: false,
      hasPermission: () => true,
      isAdmin: () => false,
      isPVAdmin: () => false,
      canAccessModule: () => true,
      assignUserRole: async () => { throw new Error('RoleProvider nicht verfügbar'); },
      setupFirstAdmin: async () => { throw new Error('RoleProvider nicht verfügbar'); },
      loadUserRole: () => {}
    };
  }
  return context;
};

export const RoleProvider = ({ children }) => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserRole();
    } else {
      setUserRole(null);
      setPermissions([]);
      setLoading(false);
    }
  }, [user]);

  const loadUserRole = async () => {
    try {
      setLoading(true);
      
      // Token neu laden um aktuelle Custom Claims zu erhalten
      const token = await user.getIdTokenResult(true);
      const claims = token.claims;
      
      if (claims.role && claims.permissions) {
        setUserRole(claims.role);
        setPermissions(claims.permissions || []);
      } else {
        // Fallback: Standard-Monteur-Rolle
        setUserRole('monteur');
        setPermissions(['materials', 'vde', 'bookings']);
      }
    } catch (error) {
      console.error('Fehler beim Laden der User-Rolle:', error);
      setUserRole('monteur');
      setPermissions(['materials', 'vde', 'bookings']);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  const isAdmin = () => {
    return userRole === 'admin';
  };

  const isProjektleiter = () => {
    return userRole === 'projektleiter' || userRole === 'admin';
  };

  const isMonteur = () => {
    return userRole === 'monteur';
  };

  const canAccessModule = (module) => {
    return hasPermission(module);
  };

  // Cloud Function zum Setzen von Rollen (nur für Admins)
  const assignUserRole = async (targetUserId, newRole) => {
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
  const setupFirstAdmin = async () => {
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

  const value = {
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
