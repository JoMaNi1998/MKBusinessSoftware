import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Building, 
  History, 
  FileText, 
  Settings, 
  Zap,
  Home,
  Menu,
  X,
  ShoppingCart
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navigation = [
    { name: 'Materialien', href: '/materials', icon: Package },
    { name: 'Bestellungen', href: '/orders', icon: ShoppingCart },
    { name: 'Kunden', href: '/customers', icon: Users },
    { name: 'Projekte', href: '/projects', icon: Building },
    { name: 'Buchungshistorie', href: '/bookings', icon: History },
    { name: 'Stückliste', href: '/bill-of-materials', icon: FileText },
    { name: 'VDE Protokolle', href: '/vde-protocols', icon: FileText },
    { name: 'PV Konfigurator', href: '/pv-configurator', icon: Home },
    { name: 'Einstellungen', href: '/settings', icon: Settings },
  ];

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

        <div className="absolute bottom-0 w-full p-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Version 1.0.0</p>
            <p className="text-xs text-gray-500">© 2024 Lagermanagement</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
