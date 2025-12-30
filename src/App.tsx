import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RoleProvider, useRoleSafe } from './context/RoleContext';
import { MaterialProvider } from './context/MaterialContext';
import { NotificationProvider } from './context/NotificationContext';
import { CustomerProvider } from './context/CustomerContext';
import { ProjectProvider } from './context/ProjectContext';
import { BookingProvider } from './context/BookingContext';
import { CalculationProvider } from './context/CalculationContext';
import { CompanyProvider } from './context/CompanyContext';
import { ServiceCatalogProvider } from './context/ServiceCatalogContext';
import { OfferProvider } from './context/OfferContext';
import { InvoiceProvider } from './context/InvoiceContext';
import { ConfiguratorProvider } from './context/ConfiguratorContext';
import { ConfirmProvider } from './context/ConfirmContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import { MaterialManagement } from './components/material';
import { OrderManagement } from './components/orders';
import CustomerManagement from './components/customers/CustomerManagement';
import { ProjectManagement } from './components/projects';
import { BookingHistory } from './components/bookings';
import VDEProtocols from './components/vde-protocols';
import ConfiguratorManagement from './components/pv-configurator/ConfiguratorManagement';
import PVConfigurator from './components/pv-configurator/PVConfigurator';
import OfferManagement from './components/offers/OfferManagement';
import OfferConfigurator from './components/offers/OfferConfigurator';
import InvoiceManagement from './components/invoices/InvoiceManagement';
import InvoiceConfigurator from './components/invoices/InvoiceConfigurator';
import Settings from './components/settings';
import ProjectCalendar from './components/project-calendar';
import Sidebar from './components/Sidebar';
import { MonteurLayout } from './components/monteur';

/**
 * RoleBasedRedirect - Leitet zur Startseite basierend auf Permissions
 */
const RoleBasedRedirect: React.FC = () => {
  const { permissions, loading } = useRoleSafe();

  if (loading) {
    return null;
  }

  // User mit nur 'monteur' Permission → zu /monteur
  const hasOnlyMonteurAccess = permissions.length === 1 && permissions.includes('monteur');
  if (hasOnlyMonteurAccess) {
    return <Navigate to="/monteur" replace />;
  }

  return <Navigate to="/materials" replace />;
};

/**
 * MonteurGuard - Prüft ob User Zugriff auf Haupt-App hat
 * Basiert auf Permissions (Single Source of Truth aus Cloud Functions)
 */
const MonteurGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { permissions, loading } = useRoleSafe();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // User mit nur 'monteur' Permission → zu /monteur umleiten
  const hasOnlyMonteurAccess = permissions.length === 1 && permissions.includes('monteur');
  if (hasOnlyMonteurAccess) {
    return <Navigate to="/monteur" replace />;
  }

  return <>{children}</>;
};

// App Component - Main entry point
const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(true);

  return (
    <ErrorBoundary>
      <AuthProvider>
      <RoleProvider>
        <NotificationProvider>
        <ConfirmProvider>
          <CustomerProvider>
            <ProjectProvider>
              <MaterialProvider>
                <BookingProvider>
                <CalculationProvider>
                <CompanyProvider>
                <ServiceCatalogProvider>
                <OfferProvider>
                <InvoiceProvider>
                <ConfiguratorProvider>
                <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  <div className="min-h-dvh bg-gray-50">
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      {/* Monteur-Bereich - eigenes Layout ohne Sidebar */}
                      <Route
                        path="/monteur/*"
                        element={
                          <ProtectedRoute>
                            <MonteurLayout />
                          </ProtectedRoute>
                        }
                      />
                      {/* Haupt-App mit Sidebar - Monteure werden zu /monteur umgeleitet */}
                      <Route
                        path="/*"
                        element={
                          <ProtectedRoute>
                            <MonteurGuard>
                              <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
                              <div className="lg:ml-64 h-dvh">
                                <Routes>
                                  <Route path="/materials" element={<div className="p-6 h-full"><MaterialManagement /></div>} />
                                  <Route path="/orders" element={<div className="p-6 h-full"><OrderManagement /></div>} />
                                  <Route path="/customers" element={<div className="p-6 h-full"><CustomerManagement /></div>} />
                                  <Route path="/projects" element={<div className="p-6 h-full"><ProjectManagement /></div>} />
                                  <Route path="/project-calendar" element={<div className="p-6 h-full"><ProjectCalendar /></div>} />
                                  <Route path="/bookings" element={<div className="p-6 h-full"><BookingHistory /></div>} />
                                  <Route path="/vde-protocols" element={<div className="p-6 h-full"><VDEProtocols /></div>} />
                                  <Route path="/pv-configurator" element={<div className="p-6 h-full"><ConfiguratorManagement /></div>} />
                                  <Route path="/pv-configurator/new" element={<PVConfigurator />} />
                                  <Route path="/pv-configurator/:id" element={<PVConfigurator />} />
                                  <Route path="/offers" element={<div className="p-6 h-full"><OfferManagement /></div>} />
                                  <Route path="/offers/new" element={<OfferConfigurator />} />
                                  <Route path="/offers/:id" element={<OfferConfigurator />} />
                                  <Route path="/invoices" element={<div className="p-6 h-full"><InvoiceManagement /></div>} />
                                  <Route path="/invoices/new" element={<InvoiceConfigurator />} />
                                  <Route path="/invoices/:id" element={<InvoiceConfigurator />} />
                                  <Route path="/settings" element={<div className="p-6 h-full"><Settings /></div>} />
                                  <Route path="/" element={<RoleBasedRedirect />} />
                                </Routes>
                              </div>
                            </MonteurGuard>
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                  </div>
                </Router>
                </ConfiguratorProvider>
                </InvoiceProvider>
                </OfferProvider>
                </ServiceCatalogProvider>
                </CompanyProvider>
                </CalculationProvider>
                </BookingProvider>
              </MaterialProvider>
            </ProjectProvider>
          </CustomerProvider>
          </ConfirmProvider>
        </NotificationProvider>
      </RoleProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
