import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Package, 
  Users, 
  Building, 
  History, 
  FileText, 
  Settings, 
  Home,
  Menu,
  X,
  ShoppingCart
} from 'lucide-react';
import UserAvatar from './UserAvatar';
import { useRoleSafe } from '../context/RoleContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { canAccessModule, loading } = useRoleSafe();

  const allNavigation = [
    { name: 'Materialien', href: '/materials', icon: Package, permission: 'materials' },
    { name: 'Bestellungen', href: '/orders', icon: ShoppingCart, permission: 'orders' },
    { name: 'Kunden', href: '/customers', icon: Users, permission: 'customers' },
    { name: 'Projekte', href: '/projects', icon: Building, permission: 'projects' },
    { name: 'Buchungshistorie', href: '/bookings', icon: History, permission: 'bookings' },
    { name: 'Stückliste', href: '/bill-of-materials', icon: FileText, permission: 'materials' },
    { name: 'VDE Protokolle', href: '/vde-protocols', icon: FileText, permission: 'vde' },
    { name: 'PV Konfigurator', href: '/pv-configurator', icon: Home, permission: 'pv-configurator' },
    { name: 'Einstellungen', href: '/settings', icon: Settings, permission: 'settings' },
  ];

  // Navigation basierend auf Berechtigungen filtern
  const navigation = allNavigation.filter(item => 
    canAccessModule(item.permission)
  );

  if (loading) {
    return (
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-lg"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-center h-16 px-4 bg-primary-600">
          <h1 className="text-xl font-bold text-white">Lagermanagement</h1>
        </div>

        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="absolute bottom-0 w-full p-4 space-y-3">
          {/* User Avatar */}
          <div className="flex justify-center">
            <UserAvatar />
          </div>
          
          {/* Version Info */}
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Version 1.0.0</p>
            <p className="text-xs text-gray-500">© 2024 Lagermanagement</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
