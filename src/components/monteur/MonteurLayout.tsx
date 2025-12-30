import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { useRoleSafe } from '@context/RoleContext';
import { UserAvatar } from '@components/shared';
import MonteurDashboard from './MonteurDashboard';
import MonteurProjectList from './MonteurProjectList';
import MonteurProjectDetail from './MonteurProjectDetail';
import MonteurPhotos from './MonteurPhotos';
import MonteurVDE from './MonteurVDE';
import MonteurMaterialIn from './MonteurMaterialIn';
import MonteurMaterialOut from './MonteurMaterialOut';
import MonteurMaterialInfo from './MonteurMaterialInfo';
import MonteurBOM from './MonteurBOM';
import MonteurVDEEdit from './MonteurVDEEdit';

/**
 * MonteurLayout - Mobile-optimiertes Layout für Monteure
 *
 * Eigene Route-Struktur ohne Desktop-Sidebar:
 * - /monteur → Dashboard
 * - /monteur/projekte → Projektliste
 * - /monteur/projekt/:id → Projekt-Detail
 * - /monteur/projekt/:id/fotos → Baustellenfotos
 * - /monteur/projekt/:id/vde → VDE-Protokolle
 * - /monteur/projekt/:id/vde/:protocolId/edit → VDE-Protokoll bearbeiten
 * - /monteur/projekt/:id/stueckliste → Projekt-Stückliste
 * - /monteur/projekt/:id/ausbuchen → Material auf Projekt ausbuchen
 * - /monteur/material/einbuchen → Material einbuchen
 * - /monteur/material/info → Material Info
 */
const MonteurLayout: React.FC = () => {
  const { user } = useAuth();
  const { loading } = useRoleSafe();
  const navigate = useNavigate();
  const location = useLocation();

  // Prüfe ob wir auf der Startseite sind
  const isHomePage = location.pathname === '/monteur' || location.pathname === '/monteur/';

  // Loading State
  if (loading) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      {/* Header - Mobile optimiert */}
      <header className="bg-primary-600 text-white px-4 py-4 flex items-center justify-between sticky top-0 z-40 safe-area-top">
        <div className="flex items-center gap-3">
          {!isHomePage && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-lg hover:bg-primary-500 active:bg-primary-700 transition-colors touch-manipulation"
              aria-label="Zurück"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          <h1 className="text-xl font-semibold">Monteur</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-primary-100 hidden sm:block">
            {user?.displayName || user?.email?.split('@')[0]}
          </span>
          <UserAvatar size="md" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<MonteurDashboard />} />
          <Route path="/projekte" element={<MonteurProjectList />} />
          <Route path="/projekt/:id" element={<MonteurProjectDetail />} />
          <Route path="/projekt/:id/fotos" element={<MonteurPhotos />} />
          <Route path="/projekt/:id/vde" element={<MonteurVDE />} />
          <Route path="/projekt/:id/vde/:protocolId/edit" element={<MonteurVDEEdit />} />
          <Route path="/projekt/:id/stueckliste" element={<MonteurBOM />} />
          <Route path="/projekt/:id/ausbuchen" element={<MonteurMaterialOut />} />
          <Route path="/material/einbuchen" element={<MonteurMaterialIn />} />
          <Route path="/material/info" element={<MonteurMaterialInfo />} />
          <Route path="*" element={<Navigate to="/monteur" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default MonteurLayout;
