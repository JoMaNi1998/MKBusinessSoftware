import React, { createContext, useContext, useCallback } from 'react';
import { ProjectService } from '../services/firebaseService';
import { useFirebaseListener, useFirebaseCRUD } from '../hooks';
import type { ProjectContextValue } from '../types/contexts/project.types';
import type { Project } from '../types';
import { ProjectStatus } from '../types/enums';

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export const useProjects = (): ProjectContextValue => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: React.ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  // Firebase Real-time Listener mit Custom Hook
  const {
    data: projects,
    loading: listenerLoading,
    error: listenerError
  } = useFirebaseListener<Project>(ProjectService.subscribeToProjects);

  // CRUD Operations Hook
  const crud = useFirebaseCRUD();

  // Kombinierter Loading-State
  const loading = listenerLoading || crud.loading;
  const error = listenerError || crud.error;

  // CRUD Operationen mit konsistenter Rückgabe
  const addProject = useCallback(async (projectData: Partial<Project>): Promise<void> => {
    // Eindeutige ID generieren falls nicht vorhanden
    const projectWithDefaults: Partial<Project> = {
      ...projectData,
      status: projectData.status || ProjectStatus.ACTIVE
    };

    await crud.execute(() => ProjectService.addProject(projectWithDefaults as Project));
  }, [crud]);

  const updateProject = useCallback(async (projectId: string, projectData: Partial<Project>): Promise<void> => {
    await crud.execute(() => ProjectService.updateProject(projectId, projectData));
  }, [crud]);

  const deleteProject = useCallback(async (projectId: string): Promise<void> => {
    await crud.execute(() => ProjectService.deleteProject(projectId));
  }, [crud]);

  // Hilfsfunktionen (keine async Operationen)
  const getProjectsByCustomer = useCallback((customerID: string): Project[] => {
    return projects.filter(project => project.customerID === customerID);
  }, [projects]);

  const getActiveProjects = useCallback((): Project[] => {
    return projects.filter(project => project.status === ProjectStatus.ACTIVE);
  }, [projects]);

  const getProjectById = useCallback((projectId: string): Project | undefined => {
    return projects.find(project => project.id === projectId);
  }, [projects]);

  const value: ProjectContextValue = {
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
