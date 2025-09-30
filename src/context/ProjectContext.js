import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProjectService } from '../services/firebaseService';

const ProjectContext = createContext();

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Firebase Real-time Listener
  useEffect(() => {
    let unsubscribe;
    
    const setupListener = async () => {
      try {
        setLoading(true);
        unsubscribe = ProjectService.subscribeToProjects((projectsData) => {
          setProjects(projectsData);
          setLoading(false);
        });
      } catch (err) {
        console.error('Error setting up projects listener:', err);
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

  const addProject = async (projectData) => {
    try {
      setLoading(true);
      // Eindeutige ID generieren falls nicht vorhanden
      const projectWithId = {
        ...projectData,
        id: projectData.id || `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: projectData.status || 'Aktiv'
      };
      
      const projectId = await ProjectService.addProject(projectWithId);
      return projectId;
    } catch (err) {
      console.error('Error adding project:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (projectId, projectData) => {
    try {
      setLoading(true);
      await ProjectService.updateProject(projectId, {
        ...projectData,
        updatedAt: new Date()
      });
    } catch (err) {
      console.error('Error updating project:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId) => {
    try {
      setLoading(true);
      await ProjectService.deleteProject(projectId);
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getProjectsByCustomer = (customerID) => {
    return projects.filter(project => project.customerID === customerID);
  };

  const getActiveProjects = () => {
    return projects.filter(project => project.status === 'Aktiv');
  };

  const getProjectById = (projectId) => {
    return projects.find(project => project.id === projectId);
  };

  const value = {
    projects,
    loading,
    error,
    addProject,
    updateProject,
    deleteProject,
    getProjectsByCustomer,
    getActiveProjects,
    getProjectById
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export default ProjectContext;
