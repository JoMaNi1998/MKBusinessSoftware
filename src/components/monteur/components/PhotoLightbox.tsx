import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, ChevronLeft, ChevronRight, User, Calendar } from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { useConfirm } from '@context/ConfirmContext';
import type { ProjectPhoto } from '@app-types';

interface PhotoLightboxProps {
  /** Aktuelles Foto */
  photo: ProjectPhoto;
  /** Gesamtanzahl Fotos */
  totalPhotos: number;
  /** Aktueller Index */
  currentIndex: number;
  /** Schließen Handler */
  onClose: () => void;
  /** Löschen Handler */
  onDelete: () => Promise<void>;
  /** Navigation Handler */
  onNavigate: (direction: 'prev' | 'next') => void;
}

/**
 * PhotoLightbox - Vollbild-Overlay für Foto-Ansicht
 *
 * Features:
 * - Vollbild-Ansicht
 * - Navigation zwischen Fotos
 * - Löschen-Funktion (nur eigene Fotos)
 * - Escape zum Schließen
 */
const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photo,
  totalPhotos,
  currentIndex,
  onClose,
  onDelete,
  onNavigate
}) => {
  const { user } = useAuth();
  const { confirmDelete } = useConfirm();

  // Eigenes Foto?
  const isOwnPhoto = user?.uid === photo.userId;

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (currentIndex > 0) onNavigate('prev');
          break;
        case 'ArrowRight':
          if (currentIndex < totalPhotos - 1) onNavigate('next');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Body Scroll verhindern
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [currentIndex, totalPhotos, onClose, onNavigate]);

  // Löschen mit Bestätigung
  const handleDelete = async () => {
    const confirmed = await confirmDelete('dieses Foto', 'Foto');
    if (confirmed) {
      await onDelete();
    }
  };

  // Datum formatieren
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50 text-white">
        <button
          onClick={onClose}
          className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Schließen"
        >
          <X className="h-6 w-6" />
        </button>

        <span className="text-sm">
          {currentIndex + 1} / {totalPhotos}
        </span>

        {isOwnPhoto && (
          <button
            onClick={handleDelete}
            className="p-2 -mr-2 hover:bg-red-500/50 rounded-lg transition-colors"
            aria-label="Löschen"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
        {!isOwnPhoto && <div className="w-9" />}
      </div>

      {/* Bild */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <img
          src={photo.url}
          alt={photo.caption || 'Baustellenfoto'}
          className="max-w-full max-h-full object-contain"
        />

        {/* Navigation Buttons */}
        {currentIndex > 0 && (
          <button
            onClick={() => onNavigate('prev')}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
            aria-label="Vorheriges Foto"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
        )}

        {currentIndex < totalPhotos - 1 && (
          <button
            onClick={() => onNavigate('next')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
            aria-label="Nächstes Foto"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        )}
      </div>

      {/* Footer mit Metadaten */}
      <div className="px-4 py-3 bg-black/50 text-white">
        {photo.caption && <p className="text-sm mb-2">{photo.caption}</p>}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{photo.userName || 'Unbekannt'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(photo.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PhotoLightbox;
