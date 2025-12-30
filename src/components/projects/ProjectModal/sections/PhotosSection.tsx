import React, { useState } from 'react';
import { Camera, ZoomIn, Trash2 } from 'lucide-react';
import { useProjectPhotos } from '@components/monteur/hooks/useProjectPhotos';
import { useAuth } from '@context/AuthContext';
import { useRole } from '@context/RoleContext';
import { useConfirm } from '@context/ConfirmContext';
import { PhotoLightbox, PhotoUpload } from '@components/shared';
import type { ProjectPhoto } from '@app-types';

interface PhotosSectionProps {
  projectId: string;
}

/**
 * PhotosSection - Baustellenfotos im ProjectModal
 *
 * Features:
 * - Foto-Upload
 * - Foto-Anzeige im Grid
 * - Lightbox mit Navigation und Delete
 */
const PhotosSection: React.FC<PhotosSectionProps> = ({ projectId }) => {
  const {
    photos,
    loading,
    uploading,
    error,
    uploadPhoto,
    deletePhoto
  } = useProjectPhotos(projectId);

  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { confirmDelete } = useConfirm();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Upload Handler
  const handleUpload = async (file: File, caption?: string) => {
    await uploadPhoto(file, caption);
  };

  // Lightbox öffnen
  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  // Lightbox schließen
  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  // Navigation in Lightbox
  const handleNavigate = (index: number) => {
    setSelectedIndex(index);
  };

  // Foto löschen (aus Lightbox)
  const handleDeleteFromLightbox = async (photo: ProjectPhoto) => {
    await deletePhoto(photo);
    if (photos.length <= 1) {
      closeLightbox();
    } else if (selectedIndex !== null && selectedIndex >= photos.length - 1) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  // Foto löschen (aus Grid-Vorschau)
  const handleDeleteFromGrid = async (e: React.MouseEvent, photo: ProjectPhoto) => {
    e.stopPropagation(); // Verhindert das Öffnen der Lightbox
    const confirmed = await confirmDelete('dieses Foto', 'Foto');
    if (confirmed) {
      await deletePhoto(photo);
    }
  };

  // Prüfen ob User das Foto löschen darf
  const canDeletePhoto = (photo: ProjectPhoto): boolean => {
    return isAdmin || user?.uid === photo.userId;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Lade Fotos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center justify-between">
        <PhotoUpload
          onUpload={handleUpload}
          uploading={uploading}
          variant="desktop"
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>

      {/* Keine Fotos */}
      {photos.length === 0 && !uploading && (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <Camera className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Fotos</h3>
          <p className="mt-1 text-sm text-gray-500">
            Für dieses Projekt wurden noch keine Baustellenfotos hochgeladen.
          </p>
        </div>
      )}

      {/* Foto-Grid */}
      {photos.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group border border-gray-200 hover:border-primary-500 transition-colors"
                onClick={() => openLightbox(index)}
              >
                <img
                  src={photo.thumbnail || photo.url}
                  alt={photo.caption || 'Projektfoto'}
                  className="w-full h-full object-cover"
                />
                {/* Overlay beim Hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {/* Delete Button - immer sichtbar oben rechts */}
                {canDeletePhoto(photo) && (
                  <button
                    onClick={(e) => handleDeleteFromGrid(e, photo)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors z-10"
                    aria-label="Foto löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                {/* Caption Badge */}
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-xs text-white truncate">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Foto-Anzahl */}
          <div className="text-sm text-gray-500 text-center">
            {photos.length} {photos.length === 1 ? 'Foto' : 'Fotos'} vorhanden
          </div>
        </>
      )}

      {/* Lightbox - ohne Delete (Delete ist im Grid) */}
      {selectedIndex !== null && photos[selectedIndex] && (
        <PhotoLightbox
          photo={photos[selectedIndex]}
          photos={photos}
          currentIndex={selectedIndex}
          onClose={closeLightbox}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
};

export default PhotosSection;
