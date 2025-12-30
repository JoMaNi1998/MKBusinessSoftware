import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, ChevronLeft, ChevronRight, User, Calendar } from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { useRole } from '@context/RoleContext';
import { useConfirm } from '@context/ConfirmContext';
import type { ProjectPhoto } from '@app-types';

interface PhotoLightboxProps {
  /** Aktuelles Foto */
  photo: ProjectPhoto;
  /** Alle Fotos für Navigation */
  photos: ProjectPhoto[];
  /** Aktueller Index */
  currentIndex: number;
  /** Schließen Handler */
  onClose: () => void;
  /** Löschen Handler (optional - wenn nicht angegeben, kein Delete möglich) */
  onDelete?: (photo: ProjectPhoto) => Promise<void>;
  /** Navigation Handler */
  onNavigate: (index: number) => void;
  /** Optional: Force-Enable Delete (z.B. für Admin) */
  forceDeleteEnabled?: boolean;
}

/**
 * PhotoLightbox - Generische Vollbild-Lightbox für Fotos
 *
 * Features:
 * - Vollbild-Ansicht mit Portal
 * - Navigation zwischen Fotos (prev/next)
 * - Löschen-Funktion (nur eigene Fotos oder Admin)
 * - Keyboard-Support (Escape, Pfeile)
 * - Metadaten-Anzeige (User, Datum, Caption)
 */
const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photo,
  photos,
  currentIndex,
  onClose,
  onDelete,
  onNavigate,
  forceDeleteEnabled = false
}) => {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { confirmDelete } = useConfirm();

  const totalPhotos = photos.length;

  // Kann löschen: Eigenes Foto, Admin, oder forceDeleteEnabled
  const canDelete = onDelete && (
    forceDeleteEnabled ||
    isAdmin ||
    user?.uid === photo.userId
  );

  // Navigation Handlers
  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  }, [currentIndex, onNavigate]);

  const goToNext = useCallback(() => {
    if (currentIndex < totalPhotos - 1) {
      onNavigate(currentIndex + 1);
    }
  }, [currentIndex, totalPhotos, onNavigate]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrev();
          break;
        case 'ArrowRight':
          goToNext();
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
  }, [goToPrev, goToNext, onClose]);

  // Löschen mit Bestätigung
  const handleDelete = async () => {
    if (!onDelete) return;

    const confirmed = await confirmDelete('dieses Foto', 'Foto');
    if (confirmed) {
      await onDelete(photo);
      // Nach Löschen schließen oder zum nächsten navigieren
      if (totalPhotos <= 1) {
        onClose();
      } else if (currentIndex >= totalPhotos - 1) {
        onNavigate(currentIndex - 1);
      }
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

  // Klick außerhalb des Bildes schließt Lightbox
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black flex flex-col"
      onClick={handleBackdropClick}
    >
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

        {canDelete ? (
          <button
            onClick={handleDelete}
            className="p-2 -mr-2 hover:bg-red-500/50 rounded-lg transition-colors"
            aria-label="Löschen"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {/* Bild */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden"
        onClick={handleBackdropClick}
      >
        <img
          src={photo.url}
          alt={photo.caption || 'Baustellenfoto'}
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Navigation Buttons */}
        {currentIndex > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); goToPrev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
            aria-label="Vorheriges Foto"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
        )}

        {currentIndex < totalPhotos - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
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
