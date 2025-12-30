import React from 'react';
import { useParams } from 'react-router-dom';
import PhotoUpload from './components/PhotoUpload';
import PhotoGallery from './components/PhotoGallery';
import { useProjectPhotos } from './hooks';

/**
 * MonteurPhotos - Separate Seite für Baustellenfotos
 */
const MonteurPhotos: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { photos, loading, uploading, uploadPhoto, deletePhoto } = useProjectPhotos(id || '');

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="font-medium text-gray-900">Baustellenfotos</h2>
        </div>
        <div className="p-4 space-y-4">
          <PhotoUpload onUpload={uploadPhoto} uploading={uploading} />
          <PhotoGallery
            photos={photos}
            loading={loading}
            onDelete={deletePhoto}
          />
        </div>
      </div>
    </div>
  );
};

export default MonteurPhotos;
