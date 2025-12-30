import { useState, useEffect, useCallback } from 'react';
import { PhotoService } from '@services/PhotoService';
import { useAuth } from '@context/AuthContext';
import type { ProjectPhoto } from '@app-types';

interface UseProjectPhotosReturn {
  /** Alle Fotos für das Projekt */
  photos: ProjectPhoto[];
  /** Loading State */
  loading: boolean;
  /** Upload in Progress */
  uploading: boolean;
  /** Error State */
  error: string | null;
  /** Foto hochladen */
  uploadPhoto: (file: File, caption?: string) => Promise<ProjectPhoto | null>;
  /** Foto löschen */
  deletePhoto: (photo: ProjectPhoto) => Promise<void>;
  /** Fotos neu laden */
  refreshPhotos: () => Promise<void>;
}

/**
 * useProjectPhotos - Hook für Foto-Management pro Projekt
 *
 * Nutzt bestehenden PhotoService für:
 * - Laden aller Projekt-Fotos
 * - Upload mit Komprimierung
 * - Löschen mit Storage-Cleanup
 */
export const useProjectPhotos = (projectId: string): UseProjectPhotosReturn => {
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fotos laden
  const loadPhotos = useCallback(async () => {
    if (!projectId) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await PhotoService.getPhotosForProject(projectId);
      setPhotos(data);
    } catch (err) {
      console.error('Fehler beim Laden der Fotos:', err);
      setError('Fotos konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Initial laden
  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  // Foto hochladen
  const uploadPhoto = useCallback(
    async (file: File, caption?: string): Promise<ProjectPhoto | null> => {
      if (!user || !projectId) {
        setError('Nicht angemeldet oder kein Projekt ausgewählt');
        return null;
      }

      try {
        setUploading(true);
        setError(null);

        const photo = await PhotoService.uploadPhoto(
          projectId,
          user.uid,
          user.displayName || user.email?.split('@')[0] || 'Monteur',
          file,
          caption
        );

        // Neues Foto an den Anfang der Liste
        setPhotos(prev => [photo, ...prev]);

        return photo;
      } catch (err) {
        console.error('Fehler beim Hochladen:', err);
        setError('Foto konnte nicht hochgeladen werden');
        return null;
      } finally {
        setUploading(false);
      }
    },
    [projectId, user]
  );

  // Foto löschen
  const deletePhoto = useCallback(async (photo: ProjectPhoto) => {
    try {
      setError(null);
      await PhotoService.deletePhoto(photo);
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
    } catch (err) {
      console.error('Fehler beim Löschen:', err);
      setError('Foto konnte nicht gelöscht werden');
      throw err;
    }
  }, []);

  // Fotos neu laden
  const refreshPhotos = useCallback(async () => {
    await loadPhotos();
  }, [loadPhotos]);

  return {
    photos,
    loading,
    uploading,
    error,
    uploadPhoto,
    deletePhoto,
    refreshPhotos
  };
};

export default useProjectPhotos;
