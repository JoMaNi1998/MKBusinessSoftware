import React, { createContext, useContext, useState, useEffect } from 'react';
import { CustomerService } from '../services/firebaseService';

const CustomerContext = createContext();

export const useCustomers = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
};

export const CustomerProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Beispieldaten basierend auf Ihren Excel-Tabellen
  const sampleCustomers = [
    {
      id: 'RKS-IndustriestraßeS0b-69190Walldorf',
      customerID: 'RKS-IndustriestraßeS0b-69190Walldorf',
      firmennameKundenname: 'RKS Industriestraße 50b, 69190 Walldorf',
      street: 'Industriestraße 50b',
      houseNumber: '',
      postalCode: '69190',
      city: 'Walldorf',
      address: 'Industriestraße 50b, 69190 Walldorf',
      email: 'info@rks-walldorf.de',
      phone: '+49 6227 123456',
      contact: 'Herr Schmidt',
      notes: 'Hauptkunde für Elektroinstallationen'
    },
    {
      id: 'Elektro-Wagner-Hauptstraße12-69168Wiesloch',
      customerID: 'Elektro-Wagner-Hauptstraße12-69168Wiesloch',
      firmennameKundenname: 'Elektro Wagner, Hauptstraße 12, 69168 Wiesloch',
      street: 'Hauptstraße 12',
      houseNumber: '',
      postalCode: '69168',
      city: 'Wiesloch',
      address: 'Hauptstraße 12, 69168 Wiesloch',
      email: 'wagner@elektro-wiesloch.de',
      phone: '+49 6222 987654',
      contact: 'Frau Wagner',
      notes: 'Spezialist für Industrieanlagen'
    }
  ];

  // Sample-Kunden-Initialisierung ENTFERNT - nur noch echte Firebase-Daten
  // useEffect(() => {
  //   const initializeSampleData = async () => {
  //     if (!loading && customers.length === 0 && !error) {
  //       try {
  //         console.log('Initializing customer sample data...');
  //         for (const customer of sampleCustomers) {
  //           await CustomerService.addCustomer(customer);
  //         }
  //       } catch (err) {
  //         console.error('Error initializing customer sample data:', err);
  //       }
  //     }
  //   };
  //
  //   initializeSampleData();
  // }, [loading, customers.length, error]);

  // Firebase Real-time Listener
  useEffect(() => {
    let unsubscribe;
    
    const setupListener = async () => {
      try {
        setLoading(true);
        unsubscribe = CustomerService.subscribeToCustomers((customersData) => {
          setCustomers(customersData);
          setLoading(false);
        });
      } catch (err) {
        console.error('Error setting up customers listener:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const [projects, setProjects] = useState([]);

  // Initialisierung wurde entfernt - Firebase Real-time Listener übernimmt die Datensynchronisation

  const addCustomer = async (customerData) => {
    try {
      setLoading(true);
      await CustomerService.addCustomer(customerData);
      // Real-time listener wird automatisch die UI aktualisieren
    } catch (err) {
      console.error('Error adding customer:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (customerId, customerData) => {
    try {
      setLoading(true);
      await CustomerService.updateCustomer(customerId, customerData);
      // Real-time listener wird automatisch die UI aktualisieren
    } catch (err) {
      console.error('Error updating customer:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (customerId) => {
    try {
      setLoading(true);
      await CustomerService.deleteCustomer(customerId);
      // Real-time listener wird automatisch die UI aktualisieren
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addProject = (customerId, projectData) => {
    setCustomers(prev => 
      prev.map(customer => 
        customer.id === customerId 
          ? { 
              ...customer, 
              projects: [...customer.projects, { 
                id: Date.now().toString(), 
                ...projectData, 
                createdAt: new Date() 
              }],
              lastActivity: new Date()
            }
          : customer
      )
    );
  };

  const updateProject = (customerId, projectId, projectData) => {
    setCustomers(prev => 
      prev.map(customer => 
        customer.id === customerId 
          ? { 
              ...customer, 
              projects: customer.projects.map(project => 
                project.id === projectId 
                  ? { ...project, ...projectData }
                  : project
              ),
              lastActivity: new Date()
            }
          : customer
      )
    );
  };

  const deleteProject = (customerId, projectId) => {
    setCustomers(prev => 
      prev.map(customer => 
        customer.id === customerId 
          ? { 
              ...customer, 
              projects: customer.projects.filter(project => project.id !== projectId),
              lastActivity: new Date()
            }
          : customer
      )
    );
  };

  const getCustomerById = (id) => {
    return customers.find(customer => customer.id === id);
  };

  const addProjectToCustomer = (customerId, project) => {
    setCustomers(prev => prev.map(customer => 
      customer.id === customerId 
        ? { 
            ...customer, 
            projects: [...customer.projects, { ...project, id: `project-${Date.now()}` }],
            lastActivity: new Date()
          }
        : customer
    ));
  };

  const updateCustomerProject = (customerId, projectId, updatedProject) => {
    setCustomers(prev => prev.map(customer => 
      customer.id === customerId 
        ? { 
            ...customer, 
            projects: customer.projects.map(project => 
              project.id === projectId ? { ...updatedProject, id: projectId } : project
            ),
            lastActivity: new Date()
          }
        : customer
    ));
  };

  const deleteCustomerProject = (customerId, projectId) => {
    setCustomers(prev => prev.map(customer => 
      customer.id === customerId 
        ? { 
            ...customer, 
            projects: customer.projects.filter(project => project.id !== projectId),
            lastActivity: new Date()
          }
        : customer
    ));
  };

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
