import React, { useState } from 'react';
import { ImageOff, Trash2 } from 'lucide-react';
import { PhotoLightbox } from '@components/shared';
import { useAuth } from '@context/AuthContext';
import { useConfirm } from '@context/ConfirmContext';
import type { ProjectPhoto } from '@app-types';

interface PhotoGalleryProps {
  /** Array von Fotos */
  photos: ProjectPhoto[];
  /** Loading State */
  loading: boolean;
  /** Foto löschen Handler */
  onDelete: (photo: ProjectPhoto) => Promise<void>;
}

/**
 * PhotoGallery - 3-Spalten Grid für Projekt-Fotos
 *
 * Features:
 * - Responsive Grid
 * - Lazy Loading
 * - Lightbox bei Klick
 */
const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, loading, onDelete }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { user } = useAuth();
  const { confirmDelete } = useConfirm();

  const handlePhotoClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleNavigate = (index: number) => {
    setSelectedIndex(index);
  };

  const handleClose = () => {
    setSelectedIndex(null);
  };

  // Foto löschen aus Grid-Vorschau
  const handleDeleteFromGrid = async (e: React.MouseEvent, photo: ProjectPhoto) => {
    e.stopPropagation(); // Verhindert das Öffnen der Lightbox
    const confirmed = await confirmDelete('dieses Foto', 'Foto');
    if (confirmed) {
      await onDelete(photo);
    }
  };

  // Prüfen ob User das Foto löschen darf (nur eigene Fotos)
  const canDeletePhoto = (photo: ProjectPhoto): boolean => {
    return user?.uid === photo.userId;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-1">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="py-8 text-center">
        <ImageOff className="h-10 w-10 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Noch keine Fotos vorhanden</p>
      </div>
    );
  }

  return (
    <>
      {/* Foto-Grid */}
      <div className="grid grid-cols-3 gap-1">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            onClick={() => handlePhotoClick(index)}
            className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 cursor-pointer"
          >
            <img
              src={photo.thumbnail || photo.url}
              alt={photo.caption || `Foto ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Delete Button - oben rechts */}
            {canDeletePhoto(photo) && (
              <button
                onClick={(e) => handleDeleteFromGrid(e, photo)}
                className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors z-10"
                aria-label="Foto löschen"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox - ohne Delete (Delete ist im Grid) */}
      {selectedIndex !== null && photos[selectedIndex] && (
        <PhotoLightbox
          photo={photos[selectedIndex]}
          photos={photos}
          currentIndex={selectedIndex}
          onClose={handleClose}
          onNavigate={handleNavigate}
        />
      )}
    </>
  );
};

export default PhotoGallery;
