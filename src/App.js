import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MaterialProvider } from './context/MaterialContext';
import { NotificationProvider } from './context/NotificationContext';
import { CustomerProvider } from './context/CustomerContext';
import { ProjectProvider } from './context/ProjectContext';
import { BookingProvider } from './context/BookingContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import MaterialManagement from './components/MaterialManagement';
import OrderManagement from './components/OrderManagement';
import CustomerManagement from './components/CustomerManagement';
import ProjectManagement from './components/ProjectManagement';
import BookingHistory from './components/BookingHistory';
import BillOfMaterials from './components/BillOfMaterials';
import VDEProtocols from './components/VDEProtocols';
import PVConfigurator from './components/PVConfigurator';
import Settings from './components/Settings';
import Sidebar from './components/Sidebar';

function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  return (
    <AuthProvider>
      <NotificationProvider>
        <CustomerProvider>
          <ProjectProvider>
            <BookingProvider>
              <MaterialProvider>
                <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  <div className="min-h-dvh bg-gray-50">
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route 
                        path="/*" 
                        element={
                          <ProtectedRoute>
                            <>
                              <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
                              <div className="lg:ml-64 h-dvh">
                                <Routes>
                                  <Route path="/materials" element={<div className="p-6 h-full"><MaterialManagement /></div>} />
                                  <Route path="/orders" element={<div className="p-6 h-full"><OrderManagement /></div>} />
                                  <Route path="/customers" element={<div className="p-6 h-full"><CustomerManagement /></div>} />
                                  <Route path="/projects" element={<div className="p-6 h-full"><ProjectManagement /></div>} />
                                  <Route path="/bookings" element={<div className="p-6 h-full"><BookingHistory /></div>} />
                                  <Route path="/bill-of-materials" element={<div className="p-6 h-full"><BillOfMaterials /></div>} />
                                  <Route path="/vde-protocols" element={<div className="p-6 h-full"><VDEProtocols /></div>} />
                                  <Route path="/pv-configurator" element={<PVConfigurator />} />
                                  <Route path="/settings" element={<div className="p-6 h-full"><Settings /></div>} />
                                  <Route path="/" element={<Navigate to="/materials" replace />} />
                                </Routes>
                              </div>
                            </>
                          </ProtectedRoute>
                        } 
                      />
                    </Routes>
                  </div>
                </Router>
              </MaterialProvider>
            </BookingProvider>
          </ProjectProvider>
        </CustomerProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
