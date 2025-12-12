import React, { createContext, useContext, useCallback } from 'react';
import { ProjectService } from '../services/firebaseService';
import { useFirebaseListener, useFirebaseCRUD } from '../hooks';

const ProjectContext = createContext();

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  // Firebase Real-time Listener mit Custom Hook
  const {
    data: projects,
    loading: listenerLoading,
    error: listenerError
  } = useFirebaseListener(ProjectService.subscribeToProjects);

  // CRUD Operations Hook
  const crud = useFirebaseCRUD();

  // Kombinierter Loading-State
  const loading = listenerLoading || crud.loading;
  const error = listenerError || crud.error;

  // CRUD Operationen mit konsistenter Rückgabe
  const addProject = useCallback(async (projectData) => {
    // Eindeutige ID generieren falls nicht vorhanden
    const projectWithId = {
      ...projectData,
      id: projectData.id || `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: projectData.status || 'Aktiv'
    };

    return crud.execute(ProjectService.addProject, projectWithId);
  }, [crud]);

  const updateProject = useCallback(async (projectId, projectData) => {
    return crud.execute(ProjectService.updateProject, projectId, {
      ...projectData,
      updatedAt: new Date()
    });
  }, [crud]);

  const deleteProject = useCallback(async (projectId) => {
    return crud.execute(ProjectService.deleteProject, projectId);
  }, [crud]);

  // Hilfsfunktionen (keine async Operationen)
  const getProjectsByCustomer = useCallback((customerID) => {
    return projects.filter(project => project.customerID === customerID);
  }, [projects]);

  const getActiveProjects = useCallback(() => {
    return projects.filter(project => project.status === 'Aktiv');
  }, [projects]);

  const getProjectById = useCallback((projectId) => {
    return projects.find(project => project.id === projectId);
  }, [projects]);

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
