import React, { useState, useEffect } from 'react';
import {
  Edit,
  Users,
  Shield,
  Mail,
  Loader
} from 'lucide-react';
import { FirebaseService } from '../../services/firebaseService';
import { useNotification } from '../../context/NotificationContext';
import { useRole } from '../../context/RoleContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import { BaseModal } from '../shared';

const UserSettings = () => {
  const { showNotification } = useNotification();
  const { isAdmin, setupFirstAdmin, userRole } = useRole();

  // User Management States
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUserRole, setNewUserRole] = useState('monteur');
  const [assigningRole, setAssigningRole] = useState(false);
  const [settingUpAdmin, setSettingUpAdmin] = useState(false);

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const usersData = await FirebaseService.getDocuments('users');
      setUsers(usersData || []);
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error);
      showNotification('Fehler beim Laden der Benutzer', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !newUserRole) {
      showNotification('Bitte Benutzer und Rolle auswählen', 'error');
      return;
    }

    setAssigningRole(true);
    try {
      const setRoleFunction = httpsCallable(functions, 'setUserRole');
      await setRoleFunction({
        uid: selectedUser.id,
        role: newUserRole
      });

      showNotification('Rolle erfolgreich zugewiesen', 'success');
      setIsUserModalOpen(false);
      setSelectedUser(null);
      setNewUserRole('monteur');
      loadUsers();
    } catch (error) {
      console.error('Fehler beim Zuweisen der Rolle:', error);
      showNotification('Fehler beim Zuweisen der Rolle: ' + error.message, 'error');
    } finally {
      setAssigningRole(false);
    }
  };

  const openUserModal = (user) => {
    setSelectedUser(user);
    setNewUserRole(user.role || 'monteur');
    setIsUserModalOpen(true);
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      admin: 'Administrator',
      monteur: 'Monteur',
      projektleiter: 'Projektleiter'
    };
    return roleNames[role] || role;
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      monteur: 'bg-blue-100 text-blue-800',
      projektleiter: 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <div className="space-y-6">
        {/* Admin Setup Banner - nur anzeigen wenn kein Admin existiert */}
        {!isAdmin() && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex items-center justify-between">
              <div className="flex">
                <Shield className="h-5 w-5 text-yellow-400 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Erster Admin einrichten
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Klicken Sie hier, um sich als ersten Administrator einzurichten.
                    Aktuelle Rolle: {userRole || 'Keine'}
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  setSettingUpAdmin(true);
                  try {
                    const result = await setupFirstAdmin();
                    showNotification('success', result.message || 'Sie sind jetzt Administrator!');
                    window.location.reload();
                  } catch (error) {
                    showNotification('error', error.message || 'Fehler beim Einrichten des Admins');
                  } finally {
                    setSettingUpAdmin(false);
                  }
                }}
                disabled={settingUpAdmin}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
              >
                {settingUpAdmin ? (
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                {settingUpAdmin ? 'Wird eingerichtet...' : 'Admin werden'}
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Benutzerverwaltung</h3>
            <p className="text-sm text-gray-600">
              Verwalten Sie Benutzer und weisen Sie Rollen zu
            </p>
          </div>
          <button
            onClick={loadUsers}
            disabled={loadingUsers}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingUsers ? (
              <Loader className="animate-spin h-4 w-4 mr-2" />
            ) : (
              <Users className="h-4 w-4 mr-2" />
            )}
            Benutzer neu laden
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
              onChange={(e) => setNewUserRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="admin">Administrator - Vollzugriff auf alle Module</option>
              <option value="projektleiter">Projektleiter - Projekte, Kunden, Bestellungen, PV Konfigurator</option>
              <option value="monteur">Monteur - Materialien, VDE Protokolle, Buchungen</option>
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
    </>
  );
};

export default UserSettings;
