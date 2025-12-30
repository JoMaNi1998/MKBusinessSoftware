import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { PhotoLightbox } from '@components/shared';
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

  const handlePhotoClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleNavigate = (index: number) => {
    setSelectedIndex(index);
  };

  const handleDelete = async (photo: ProjectPhoto) => {
    await onDelete(photo);
    // Nach Löschen: Index anpassen oder schließen
    if (photos.length <= 1) {
      setSelectedIndex(null);
    } else if (selectedIndex !== null && selectedIndex >= photos.length - 1) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleClose = () => {
    setSelectedIndex(null);
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
          <button
            key={photo.id}
            onClick={() => handlePhotoClick(index)}
            className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <img
              src={photo.thumbnail || photo.url}
              alt={photo.caption || `Foto ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Lightbox - nutzt jetzt die shared Komponente */}
      {selectedIndex !== null && photos[selectedIndex] && (
        <PhotoLightbox
          photo={photos[selectedIndex]}
          photos={photos}
          currentIndex={selectedIndex}
          onClose={handleClose}
          onDelete={handleDelete}
          onNavigate={handleNavigate}
        />
      )}
    </>
  );
};

export default PhotoGallery;
