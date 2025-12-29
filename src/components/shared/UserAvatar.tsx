import React, { useState } from 'react';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import BaseModal from './BaseModal';
import { createPortal } from 'react-dom';

type SizeType = 'sm' | 'md';

interface UserAvatarProps {
  size?: SizeType;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ size = 'md' }) => {
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const sizeClasses: Record<SizeType, string> = {
    sm: 'h-7 w-7',
    md: 'h-10 w-10'
  };

  const iconSizeClasses: Record<SizeType, string> = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5'
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutModal(false);
    } catch (error) {
      console.error('Fehler beim Logout:', error);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* User Avatar Button */}
      <button
        onClick={() => setShowLogoutModal(true)}
        className={`${sizeClasses[size]} bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors duration-200`}
        title={user.displayName || user.email || undefined}
      >
        <User className={`${iconSizeClasses[size]} text-white`} />
      </button>

      {/* Logout Modal - Portal to body to avoid sidebar constraints */}
      {showLogoutModal && createPortal(
        <BaseModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          title="Abmelden"
          size="sm"
        >
          <div className="text-center py-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <LogOut className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Möchten Sie sich abmelden?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Sie werden zur Anmeldeseite weitergeleitet.
            </p>

            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Abbrechen
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Abmelden
              </button>
            </div>
          </div>
        </BaseModal>,
        document.body
      )}
    </>
  );
};

export default UserAvatar;
