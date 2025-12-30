import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { serverTimestamp } from 'firebase/firestore';
import { storage } from '@config/firebase';
import { FirebaseService } from './firebaseService';
import type { ProjectPhoto } from '@app-types';

const COLLECTION = 'project-photos';

/**
 * PhotoService - Verwaltet Projekt-Fotos (Storage + Firestore)
 */
export class PhotoService {
  /**
   * Foto hochladen
   */
  static async uploadPhoto(
    projectId: string,
    userId: string,
    userName: string,
    file: File,
    caption?: string
  ): Promise<ProjectPhoto> {
    try {
      // 1. Einzigartige ID generieren
      const photoId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `${photoId}.${fileExtension}`;

      // 2. Storage Pfad
      const storagePath = `projects/${projectId}/photos/${fileName}`;
      const storageRef = ref(storage, storagePath);

      // 3. Datei komprimieren (optional - für große Bilder)
      const compressedFile = await this.compressImage(file);

      // 4. Upload zu Storage
      await uploadBytes(storageRef, compressedFile);

      // 5. Download URL holen
      const url = await getDownloadURL(storageRef);

      // 6. Firestore Dokument erstellen
      const photoData: Omit<ProjectPhoto, 'id'> = {
        projectId,
        userId,
        userName,
        url,
        caption,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any
      };

      const result = await FirebaseService.addDocument(COLLECTION, {
        id: photoId,
        ...photoData
      });

      return result as ProjectPhoto;
    } catch (error) {
      console.error('Fehler beim Hochladen des Fotos:', error);
      throw error;
    }
  }

  /**
   * Fotos für ein Projekt laden
   */
  static async getPhotosForProject(projectId: string): Promise<ProjectPhoto[]> {
    try {
      const photos = await FirebaseService.queryDocuments(
        COLLECTION,
        'projectId',
        '==',
        projectId
      );

      // Nach Erstellungsdatum sortieren (neueste zuerst)
      return (photos as ProjectPhoto[]).sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('Fehler beim Laden der Fotos:', error);
      throw error;
    }
  }

  /**
   * Foto löschen (Storage + Firestore)
   */
  static async deletePhoto(photo: ProjectPhoto): Promise<void> {
    try {
      // 1. Storage Datei löschen
      if (photo.url) {
        try {
          // URL in Storage-Ref konvertieren
          const storagePath = this.extractStoragePath(photo.url);
          if (storagePath) {
            const storageRef = ref(storage, storagePath);
            await deleteObject(storageRef);
          }
        } catch (storageError) {
          // Storage-Fehler loggen aber weitermachen
          console.warn('Storage-Datei konnte nicht gelöscht werden:', storageError);
        }
      }

      // 2. Thumbnail löschen (falls vorhanden)
      if (photo.thumbnail) {
        try {
          const thumbPath = this.extractStoragePath(photo.thumbnail);
          if (thumbPath) {
            const thumbRef = ref(storage, thumbPath);
            await deleteObject(thumbRef);
          }
        } catch {
          // Thumbnail-Fehler ignorieren
        }
      }

      // 3. Firestore Dokument löschen
      await FirebaseService.deleteDocument(COLLECTION, photo.id);
    } catch (error) {
      console.error('Fehler beim Löschen des Fotos:', error);
      throw error;
    }
  }

  /**
   * Anzahl Fotos für ein Projekt
   */
  static async getPhotoCount(projectId: string): Promise<number> {
    const photos = await this.getPhotosForProject(projectId);
    return photos.length;
  }

  /**
   * Bild komprimieren (max 1920px, 80% Qualität)
   */
  private static async compressImage(file: File): Promise<Blob> {
    return new Promise((resolve) => {
      // Wenn kein Bild, original zurückgeben
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Max Dimensionen
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1920;

        let { width, height } = img;

        // Skalieren wenn nötig
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        // Bild zeichnen
        ctx?.drawImage(img, 0, 0, width, height);

        // Als Blob exportieren (JPEG, 80% Qualität)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file); // Fallback auf Original
            }
          },
          'image/jpeg',
          0.8
        );
      };

      img.onerror = () => {
        // Bei Fehler: Original verwenden
        resolve(file);
      };

      // Bild laden
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Storage-Pfad aus Download-URL extrahieren
   */
  private static extractStoragePath(url: string): string | null {
    try {
      // Firebase Storage URL Format:
      // https://firebasestorage.googleapis.com/v0/b/BUCKET/o/PATH?token=...
      const match = url.match(/\/o\/(.+?)\?/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
      return null;
    } catch {
      return null;
    }
  }
}
