import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Camera,
  FileText,
  ClipboardList,
  MapPin,
  User,
  Phone,
  Minus
} from 'lucide-react';
import { useProjects } from '@context/ProjectContext';
import { useCustomers } from '@context/CustomerContext';
import { ProjectActionCard } from './components';
import { useProjectPhotos } from './hooks';
import { getProjectStatusColor } from '@components/projects';

/**
 * MonteurProjectDetail - Projekt-Detailansicht für Monteure
 *
 * Features:
 * - Projekt-Info Header
 * - 3 Aktions-Karten untereinander (Fotos, VDE, Bestellen)
 * - Alle navigieren zu separaten Seiten
 */
const MonteurProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProjectById, loading: projectLoading } = useProjects();
  const { customers } = useCustomers();

  const project = useMemo(() => {
    return id ? getProjectById(id) : undefined;
  }, [id, getProjectById]);

  // Foto-Hook nur wenn Projekt existiert
  const { photos, loading: photosLoading, uploading, uploadPhoto, deletePhoto } = useProjectPhotos(
    id || ''
  );

  // Kundendaten finden
  const customer = useMemo(() => {
    if (!project?.customerID) return null;
    return customers.find(c => c.id === project.customerID);
  }, [project, customers]);

  // Kontaktperson finden
  const contact = useMemo(() => {
    if (!project?.contactPersonId || !customer?.contacts) return null;
    return customer.contacts.find(c => c.id === project.contactPersonId);
  }, [project, customer]);

  // Adresse formatieren
  const formattedAddress = useMemo(() => {
    if (!project) return null;
    const street = project.street || project.address?.strasse;
    const houseNumber = project.houseNumber;
    const postalCode = project.postalCode || project.address?.plz;
    const city = project.city || project.address?.ort;

    const parts = [
      street && houseNumber ? `${street} ${houseNumber}` : street,
      postalCode && city ? `${postalCode} ${city}` : city
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : null;
  }, [project]);

  if (projectLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Projekt nicht gefunden</h3>
          <p className="text-gray-500 text-sm mb-4">
            Das Projekt existiert nicht oder du hast keinen Zugriff.
          </p>
          <button
            onClick={() => navigate('/monteur/projekte')}
            className="text-primary-600 font-medium"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  const statusColor = getProjectStatusColor(project.status);

  return (
    <div className="p-4 space-y-4">
      {/* Projekt-Header */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {project.name || project.projectID}
              </h1>
              <span
                className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${statusColor}`}
              >
                {project.status}
              </span>
            </div>
            <p className="text-gray-500 mt-1">{project.customerName || 'Kein Kunde'}</p>
          </div>
        </div>

        {/* Adresse */}
        {formattedAddress && (
          <div className="flex items-start gap-2 mt-3 pt-3 border-t border-gray-100">
            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700">{formattedAddress}</p>
              {/* Google Maps Link */}
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(formattedAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-600 hover:underline"
              >
                In Maps öffnen
              </a>
            </div>
          </div>
        )}

        {/* Kontaktperson */}
        {(contact || project.contactPersonName) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-700">
              {contact?.name || project.contactPersonName}
            </span>
            {contact?.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="ml-auto flex items-center gap-1 text-primary-600"
              >
                <Phone className="h-4 w-4" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Aktions-Karten - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        <ProjectActionCard
          icon={Camera}
          title="Fotos"
          description="Baustellenfotos"
          badge={photos.length}
          variant="primary"
          onClick={() => navigate(`/monteur/projekt/${id}/fotos`)}
        />
        <ProjectActionCard
          icon={FileText}
          title="VDE"
          description="Protokolle"
          variant="success"
          onClick={() => navigate(`/monteur/projekt/${id}/vde`)}
        />
        <ProjectActionCard
          icon={Minus}
          title="Ausbuchen"
          description="Material auf Projekt buchen"
          variant="danger"
          onClick={() => navigate(`/monteur/projekt/${id}/ausbuchen`)}
        />
        <ProjectActionCard
          icon={ClipboardList}
          title="Stückliste"
          description="Projekt-Stückliste anzeigen"
          variant="warning"
          onClick={() => navigate(`/monteur/projekt/${id}/stueckliste`)}
        />
      </div>

      {/* Projekt-Notizen */}
      {project.notes && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">Notizen</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{project.notes}</p>
        </div>
      )}
    </div>
  );
};

export default MonteurProjectDetail;
