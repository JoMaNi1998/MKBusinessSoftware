import type { Timestamp } from 'firebase/firestore';
import type { BaseDocument } from '../base.types';

/**
 * ProjectPhoto - Baustellenfoto zu einem Projekt
 */
export interface ProjectPhoto extends BaseDocument {
  projectId: string;
  userId: string;
  userName?: string;
  url: string;              // Firebase Storage URL
  thumbnail?: string;       // Kleinere Version für Vorschau
  caption?: string;         // Optionale Beschreibung
  createdAt: Timestamp;
}

/**
 * ProjectPhoto für Upload (ohne id und createdAt)
 */
export type ProjectPhotoInput = Omit<ProjectPhoto, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * ProjectPhoto Context Value
 */
export interface ProjectPhotoContextValue {
  photos: ProjectPhoto[];
  loading: boolean;
  error: string | null;
  uploadPhoto: (projectId: string, file: File, caption?: string) => Promise<ProjectPhoto>;
  deletePhoto: (photoId: string) => Promise<void>;
  getPhotosForProject: (projectId: string) => ProjectPhoto[];
}
