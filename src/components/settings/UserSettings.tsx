import React, { useState, useEffect } from 'react';
import {
  Edit,
  Shield,
  Mail,
  Loader,
  UserPlus,
  Users
} from 'lucide-react';
import { FirebaseService } from '@services/firebaseService';
import { useNotification } from '@context/NotificationContext';
import { useRole } from '@context/RoleContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@config/firebase';
import { BaseModal } from '@components/shared';
import type { User } from '@app-types/components/settings.types';
import { UserRole } from '@app-types/enums';
import { NotificationType } from '@app-types/enums';

const UserSettings: React.FC = () => {
  const { showNotification } = useNotification();
  const { isAdmin } = useRole();

  // User Management States
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.MONTEUR);
  const [assigningRole, setAssigningRole] = useState<boolean>(false);

  // Create User States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserPassword, setNewUserPassword] = useState<string>('');
  const [newUserPasswordConfirm, setNewUserPasswordConfirm] = useState<string>('');
  const [newUserDisplayName, setNewUserDisplayName] = useState<string>('');
  const [newUserRoleSelect, setNewUserRoleSelect] = useState<UserRole>(UserRole.MONTEUR);
  const [creatingUser, setCreatingUser] = useState<boolean>(false);

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (): Promise<void> => {
    try {
      setLoadingUsers(true);
      const usersData = await FirebaseService.getDocuments('users');
      setUsers((usersData || []) as User[]);
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error);
      showNotification('Fehler beim Laden der Benutzer', NotificationType.ERROR);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAssignRole = async (): Promise<void> => {
    if (!selectedUser || !newUserRole) {
      showNotification('Bitte Benutzer und Rolle auswählen', NotificationType.ERROR);
      return;
    }

    setAssigningRole(true);
    try {
      const setRoleFunction = httpsCallable(functions, 'setUserRole');
      await setRoleFunction({
        uid: selectedUser.id,
        role: newUserRole
      });

      showNotification('Rolle erfolgreich zugewiesen', NotificationType.SUCCESS);
      setIsUserModalOpen(false);
      setSelectedUser(null);
      setNewUserRole(UserRole.MONTEUR);
      loadUsers();
    } catch (error) {
      console.error('Fehler beim Zuweisen der Rolle:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      showNotification('Fehler beim Zuweisen der Rolle: ' + errorMessage, NotificationType.ERROR);
    } finally {
      setAssigningRole(false);
    }
  };

  const openUserModal = (user: User): void => {
    setSelectedUser(user);
    setNewUserRole(user.role || UserRole.MONTEUR);
    setIsUserModalOpen(true);
  };

  const getRoleDisplayName = (role: UserRole): string => {
    const roleNames: Record<UserRole, string> = {
      [UserRole.ADMIN]: 'Administrator',
      [UserRole.MONTEUR]: 'Monteur',
      [UserRole.PROJEKTLEITER]: 'Projektleiter'
    };
    return roleNames[role] || role;
  };

  const getRoleBadgeColor = (role: UserRole): string => {
    const colors: Record<UserRole, string> = {
      [UserRole.ADMIN]: 'bg-red-100 text-red-800',
      [UserRole.MONTEUR]: 'bg-blue-100 text-blue-800',
      [UserRole.PROJEKTLEITER]: 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const resetCreateForm = (): void => {
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserPasswordConfirm('');
    setNewUserDisplayName('');
    setNewUserRoleSelect(UserRole.MONTEUR);
  };

  const handleCreateUser = async (): Promise<void> => {
    // Validierung
    if (!newUserEmail || !newUserPassword) {
      showNotification('Email und Passwort sind erforderlich', NotificationType.ERROR);
      return;
    }
    if (newUserPassword !== newUserPasswordConfirm) {
      showNotification('Passwörter stimmen nicht überein', NotificationType.ERROR);
      return;
    }
    if (newUserPassword.length < 6) {
      showNotification('Passwort muss mindestens 6 Zeichen haben', NotificationType.ERROR);
      return;
    }

    setCreatingUser(true);
    try {
      const createUserFunction = httpsCallable(functions, 'createUserWithRole');
      await createUserFunction({
        email: newUserEmail,
        password: newUserPassword,
        displayName: newUserDisplayName || undefined,
        role: newUserRoleSelect
      });

      showNotification('Benutzer erfolgreich erstellt', NotificationType.SUCCESS);
      setIsCreateModalOpen(false);
      resetCreateForm();
      loadUsers();
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      showNotification('Fehler: ' + errorMessage, NotificationType.ERROR);
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
  
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Benutzerverwaltung</h3>
            <p className="text-sm text-gray-600">
              Verwalten Sie Benutzer und weisen Sie Rollen zu
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Benutzer hinzufügen
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {loadingUsers ? (
              <li className="px-6 py-4 text-center">
                <Loader className="animate-spin h-6 w-6 mx-auto text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Lade Benutzer...</p>
              </li>
            ) : users.length === 0 ? (
              <li className="px-6 py-4 text-center">
                <Users className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Keine Benutzer gefunden</p>
              </li>
            ) : (
              users.map((user) => (
                <li key={user.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.displayName || user.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                      <button
                        onClick={() => openUserModal(user)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Rolle ändern
                      </button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* User Role Assignment Modal */}
      <BaseModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title="Benutzerrolle zuweisen"
      >
        <div className="space-y-4">
          {selectedUser && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-600 mr-2" />
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedUser.displayName || selectedUser.email}
                  </p>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Neue Rolle auswählen
            </label>
            <select
              value={newUserRole}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewUserRole(e.target.value as UserRole)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={UserRole.ADMIN}>Administrator - Vollzugriff auf alle Module</option>
              <option value={UserRole.PROJEKTLEITER}>Projektleiter - Projekte, Kunden, Bestellungen, PV Konfigurator</option>
              <option value={UserRole.MONTEUR}>Monteur - Materialien, VDE Protokolle, Kunden, Projekte</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              onClick={handleAssignRole}
              disabled={assigningRole}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {assigningRole ? (
                <div className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Wird zugewiesen...
                </div>
              ) : (
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Rolle zuweisen
                </div>
              )}
            </button>
          </div>
        </div>
      </BaseModal>

      {/* Create User Modal */}
      <BaseModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetCreateForm();
        }}
        title="Neuen Benutzer erstellen"
      >
        <div className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-Mail-Adresse *
            </label>
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="email@beispiel.de"
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anzeigename
            </label>
            <input
              type="text"
              value={newUserDisplayName}
              onChange={(e) => setNewUserDisplayName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Max Mustermann"
            />
          </div>

          {/* Passwort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passwort *
            </label>
            <input
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Mindestens 6 Zeichen"
            />
          </div>

          {/* Passwort bestätigen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passwort bestätigen *
            </label>
            <input
              type="password"
              value={newUserPasswordConfirm}
              onChange={(e) => setNewUserPasswordConfirm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Passwort wiederholen"
            />
          </div>

          {/* Rolle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rolle *
            </label>
            <select
              value={newUserRoleSelect}
              onChange={(e) => setNewUserRoleSelect(e.target.value as UserRole)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value={UserRole.MONTEUR}>Monteur - Materialien, VDE Protokolle, Kunden, Projekte</option>
              <option value={UserRole.PROJEKTLEITER}>Projektleiter - Projekte, Kunden, PV Konfigurator</option>
              <option value={UserRole.ADMIN}>Administrator - Vollzugriff</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                resetCreateForm();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              onClick={handleCreateUser}
              disabled={creatingUser}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {creatingUser ? (
                <div className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Wird erstellt...
                </div>
              ) : (
                <div className="flex items-center">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Benutzer erstellen
                </div>
              )}
            </button>
          </div>
        </div>
      </BaseModal>
    </>
  );
};

export default UserSettings;
