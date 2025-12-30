import React, { useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import type { ProjectPhoto } from '@app-types';

interface PhotoUploadProps {
  /** Upload Handler */
  onUpload: (file: File, caption?: string) => Promise<ProjectPhoto | null>;
  /** Upload in Progress */
  uploading: boolean;
}

/**
 * PhotoUpload - Mobile-optimierte Foto-Upload Komponente
 *
 * Features:
 * - Direkter Kamera-Zugriff via capture="environment"
 * - Loading State während Upload
 * - Komprimierung erfolgt im PhotoService
 */
const PhotoUpload: React.FC<PhotoUploadProps> = ({ onUpload, uploading }) => {
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

  return (
    <div>
      {/* Hidden File Input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Foto aufnehmen"
      />

      {/* Upload Button */}
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

      {/* Hinweis */}
      <p className="text-xs text-gray-400 text-center mt-2">
        Fotos werden automatisch komprimiert
      </p>
    </div>
  );
};

export default PhotoUpload;
