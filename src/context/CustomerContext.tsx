import React, { createContext, useContext, useCallback } from 'react';
import { CustomerService } from '../services/firebaseService';
import { useAuth } from './AuthContext';
import { useFirebaseListener, useFirebaseCRUD } from '../hooks';
import { useRoleSafe } from './RoleContext';
import type { CustomerContextValue, ExtendedCustomer } from '../types/contexts/customer.types';
import type { Customer, Project } from '../types';

const CustomerContext = createContext<CustomerContextValue | undefined>(undefined);

export const useCustomers = (): CustomerContextValue => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
};

interface CustomerProviderProps {
  children: React.ReactNode;
}

export const CustomerProvider: React.FC<CustomerProviderProps> = ({ children }) => {
  const { user } = useAuth();

  // Rollen-Check: Monteure haben keinen Zugriff auf Kunden
  const { permissions } = useRoleSafe();
  const isMonteurOnly = permissions.length === 1 && permissions.includes('monteur');

  // Firebase Real-time Listener mit Custom Hook
  // Nur laden wenn User eingeloggt und NICHT nur Monteur
  const {
    data: customers,
    loading: listenerLoading,
    error: listenerError,
    setData: setCustomers
  } = useFirebaseListener<ExtendedCustomer>(CustomerService.subscribeToCustomers, {
    enabled: !!user && !isMonteurOnly
  });

  // CRUD Operations Hook
  const crud = useFirebaseCRUD();

  // Kombinierter Loading-State
  const loading = listenerLoading || crud.loading;
  const error = listenerError || crud.error;

  // CRUD Operationen mit konsistenter Rückgabe
  const addCustomer = useCallback(async (customerData: Partial<Customer>): Promise<{ success: boolean; error?: string }> => {
    return crud.execute(() => CustomerService.addCustomer(customerData as Customer));
  }, [crud]);

  const updateCustomer = useCallback(async (
    customerId: string,
    customerData: Partial<Customer>
  ): Promise<{ success: boolean; error?: string }> => {
    return crud.execute(() => CustomerService.updateCustomer(customerId, customerData));
  }, [crud]);

  const deleteCustomer = useCallback(async (customerId: string): Promise<{ success: boolean; error?: string }> => {
    return crud.execute(() => CustomerService.deleteCustomer(customerId));
  }, [crud]);

  // Lokale State-Manipulationen (für Projekte innerhalb von Kunden)
  const addProject = useCallback((customerId: string, projectData: Partial<Project>): void => {
    setCustomers(prev =>
      prev.map(customer =>
        customer.id === customerId
          ? {
              ...customer,
              projects: [...(customer.projects || []), {
                id: Date.now().toString(),
                ...projectData,
                createdAt: new Date()
              }] as Project[],
              lastActivity: new Date()
            }
          : customer
      )
    );
  }, [setCustomers]);

  const updateProject = useCallback((
    customerId: string,
    projectId: string,
    projectData: Partial<Project>
  ): void => {
    setCustomers(prev =>
      prev.map(customer =>
        customer.id === customerId
          ? {
              ...customer,
              projects: (customer.projects || []).map(project =>
                project.id === projectId
                  ? { ...project, ...projectData }
                  : project
              ) as Project[],
              lastActivity: new Date()
            }
          : customer
      )
    );
  }, [setCustomers]);

  const deleteProject = useCallback((customerId: string, projectId: string): void => {
    setCustomers(prev =>
      prev.map(customer =>
        customer.id === customerId
          ? {
              ...customer,
              projects: (customer.projects || []).filter(project => project.id !== projectId) as Project[],
              lastActivity: new Date()
            }
          : customer
      )
    );
  }, [setCustomers]);

  const getCustomerById = useCallback((id: string): ExtendedCustomer | undefined => {
    return customers.find(customer => customer.id === id);
  }, [customers]);

  // Alias-Funktionen für Kompatibilität
  const addProjectToCustomer = addProject;
  const updateCustomerProject = updateProject;
  const deleteCustomerProject = deleteProject;

  const value: CustomerContextValue = {
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
