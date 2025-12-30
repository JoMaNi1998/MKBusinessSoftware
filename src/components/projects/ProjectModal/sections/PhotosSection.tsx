import React, { useState, useEffect } from 'react';
import { Camera, X, ZoomIn, User, Calendar } from 'lucide-react';
import { PhotoService } from '@services/PhotoService';
import { formatDate } from '@utils';
import type { ProjectPhoto } from '@app-types';

interface PhotosSectionProps {
  projectId: string;
}

const PhotosSection: React.FC<PhotosSectionProps> = ({ projectId }) => {
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<ProjectPhoto | null>(null);

  // Fotos beim Mount laden
  useEffect(() => {
    const loadPhotos = async () => {
      if (!projectId) return;

      try {
        setLoading(true);
        const projectPhotos = await PhotoService.getPhotosForProject(projectId);
        setPhotos(projectPhotos);
      } catch (error) {
        console.error('Fehler beim Laden der Fotos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, [projectId]);

  // Lightbox schließen
  const closeLightbox = () => {
    setSelectedPhoto(null);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Lade Fotos...</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-8">
        <Camera className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Fotos</h3>
        <p className="mt-1 text-sm text-gray-500">
          Für dieses Projekt wurden noch keine Baustellenfotos hochgeladen.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Foto-Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group border border-gray-200 hover:border-primary-500 transition-colors"
            onClick={() => setSelectedPhoto(photo)}
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
      <div className="mt-3 text-sm text-gray-500 text-center">
        {photos.length} {photos.length === 1 ? 'Foto' : 'Fotos'} vorhanden
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Schließen Button */}
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={closeLightbox}
          >
            <X className="h-6 w-6" />
          </button>

          {/* Bild Container */}
          <div
            className="max-w-5xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || 'Projektfoto'}
              className="max-h-[80vh] object-contain rounded-lg"
            />

            {/* Info-Bereich */}
            <div className="mt-4 bg-white/10 rounded-lg p-4 text-white">
              {selectedPhoto.caption && (
                <p className="text-lg mb-2">{selectedPhoto.caption}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {selectedPhoto.userName || 'Unbekannt'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(selectedPhoto.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotosSection;
