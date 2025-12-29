import React from 'react';
import { Plus, Package } from 'lucide-react';

interface ProjectHeaderProps {
  onAddProject: () => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ onAddProject }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 flex-shrink-0">
      <div className="pl-12 sm:pl-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Projekte</h1>
        <p className="mt-1 text-sm text-gray-600 hidden sm:block">
          Verwalten Sie Ihre Kundenprojekte
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="bg-white text-gray-700 border border-gray-300 px-3 sm:px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
          <Package className="h-4 w-4" />
          <span className="hidden sm:inline">Exportieren</span>
        </button>
        <button
          onClick={onAddProject}
          className="bg-primary-600 text-white px-3 sm:px-4 py-2 text-sm font-medium rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Projekt hinzufügen</span>
          <span className="sm:hidden">Neu</span>
        </button>
      </div>
    </div>
  );
};

export default ProjectHeader;
