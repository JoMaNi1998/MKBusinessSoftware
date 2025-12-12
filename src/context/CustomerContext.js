import React, { createContext, useContext, useCallback } from 'react';
import { CustomerService } from '../services/firebaseService';
import { useFirebaseListener, useFirebaseCRUD } from '../hooks';

const CustomerContext = createContext();

export const useCustomers = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
};

export const CustomerProvider = ({ children }) => {
  // Firebase Real-time Listener mit Custom Hook
  const {
    data: customers,
    loading: listenerLoading,
    error: listenerError,
    setData: setCustomers
  } = useFirebaseListener(CustomerService.subscribeToCustomers);

  // CRUD Operations Hook
  const crud = useFirebaseCRUD();

  // Kombinierter Loading-State
  const loading = listenerLoading || crud.loading;
  const error = listenerError || crud.error;

  // CRUD Operationen mit konsistenter Rückgabe
  const addCustomer = useCallback(async (customerData) => {
    return crud.execute(CustomerService.addCustomer, customerData);
  }, [crud]);

  const updateCustomer = useCallback(async (customerId, customerData) => {
    return crud.execute(CustomerService.updateCustomer, customerId, customerData);
  }, [crud]);

  const deleteCustomer = useCallback(async (customerId) => {
    return crud.execute(CustomerService.deleteCustomer, customerId);
  }, [crud]);

  // Lokale State-Manipulationen (für Projekte innerhalb von Kunden)
  const addProject = useCallback((customerId, projectData) => {
    setCustomers(prev =>
      prev.map(customer =>
        customer.id === customerId
          ? {
              ...customer,
              projects: [...(customer.projects || []), {
                id: Date.now().toString(),
                ...projectData,
                createdAt: new Date()
              }],
              lastActivity: new Date()
            }
          : customer
      )
    );
  }, [setCustomers]);

  const updateProject = useCallback((customerId, projectId, projectData) => {
    setCustomers(prev =>
      prev.map(customer =>
        customer.id === customerId
          ? {
              ...customer,
              projects: (customer.projects || []).map(project =>
                project.id === projectId
                  ? { ...project, ...projectData }
                  : project
              ),
              lastActivity: new Date()
            }
          : customer
      )
    );
  }, [setCustomers]);

  const deleteProject = useCallback((customerId, projectId) => {
    setCustomers(prev =>
      prev.map(customer =>
        customer.id === customerId
          ? {
              ...customer,
              projects: (customer.projects || []).filter(project => project.id !== projectId),
              lastActivity: new Date()
            }
          : customer
      )
    );
  }, [setCustomers]);

  const getCustomerById = useCallback((id) => {
    return customers.find(customer => customer.id === id);
  }, [customers]);

  // Alias-Funktionen für Kompatibilität
  const addProjectToCustomer = addProject;
  const updateCustomerProject = updateProject;
  const deleteCustomerProject = deleteProject;

  const value = {
    customers,
    loading,
    error,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    addProject,
    updateProject,
    deleteProject,
    addProjectToCustomer,
    updateCustomerProject,
    deleteCustomerProject
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};
