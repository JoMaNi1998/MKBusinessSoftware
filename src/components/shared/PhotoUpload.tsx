import React, { useRef } from 'react';
import { Camera, Upload, Loader2, ImagePlus } from 'lucide-react';

interface PhotoUploadProps {
  /** Upload Handler - gibt File und optionale Caption weiter */
  onUpload: (file: File, caption?: string) => Promise<void>;
  /** Upload in Progress */
  uploading: boolean;
  /** Layout-Variante */
  variant?: 'mobile' | 'desktop';
  /** Zusätzliche CSS-Klassen */
  className?: string;
}

/**
 * PhotoUpload - Generische Foto-Upload Komponente
 *
 * Features:
 * - Mobile: Direkter Kamera-Zugriff (capture="environment")
 * - Desktop: Datei-Auswahl Dialog
 * - Loading State während Upload
 * - Komprimierung erfolgt im PhotoService
 */
const PhotoUpload: React.FC<PhotoUploadProps> = ({
  onUpload,
  uploading,
  variant = 'desktop',
  className = ''
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!uploading) {
      inputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUpload(file);
      // Input zurücksetzen für nächstes Foto
      e.target.value = '';
    }
  };

  // Mobile Variante - großer Button mit Kamera-Icon
  if (variant === 'mobile') {
    return (
      <div className={className}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Foto aufnehmen"
        />

        <button
          onClick={handleClick}
          disabled={uploading}
          className={`
            w-full py-4 rounded-xl font-medium flex items-center justify-center gap-3
            transition-colors touch-manipulation
            ${
              uploading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 text-white active:bg-primary-700'
            }
          `}
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Wird hochgeladen...</span>
            </>
          ) : (
            <>
              <Camera className="h-5 w-5" />
              <span>Foto aufnehmen</span>
            </>
          )}
        </button>

        <p className="text-xs text-gray-400 text-center mt-2">
          Fotos werden automatisch komprimiert
        </p>
      </div>
    );
  }

  // Desktop Variante - kompakter Button
  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Foto hochladen"
      />

      <button
        onClick={handleClick}
        disabled={uploading}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-colors
          ${
            uploading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }
        `}
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Hochladen...</span>
          </>
        ) : (
          <>
            <ImagePlus className="h-4 w-4" />
            <span>Foto hinzufügen</span>
          </>
        )}
      </button>
    </div>
  );
};

export default PhotoUpload;
