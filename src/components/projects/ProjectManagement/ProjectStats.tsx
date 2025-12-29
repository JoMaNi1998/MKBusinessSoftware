import React from 'react';

interface ProjectStatsProps {
  stats: {
    total: number;
    active: number;
    planned: number;
    completed: number;
  };
}

const ProjectStats: React.FC<ProjectStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-4 md:grid-cols-4 gap-1.5 md:gap-4 flex-shrink-0">
      <div className="bg-white p-2 md:p-4 rounded-lg shadow">
        <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Gesamt</p>
        <p className="text-base md:text-2xl font-bold text-gray-900">{stats.total}</p>
      </div>
      <div className="bg-white p-2 md:p-4 rounded-lg shadow">
        <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Aktiv</p>
        <p className="text-base md:text-2xl font-bold text-green-600">{stats.active}</p>
      </div>
      <div className="bg-white p-2 md:p-4 rounded-lg shadow">
        <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Geplant</p>
        <p className="text-base md:text-2xl font-bold text-yellow-600">{stats.planned}</p>
      </div>
      <div className="bg-white p-2 md:p-4 rounded-lg shadow">
        <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Fertig</p>
        <p className="text-base md:text-2xl font-bold text-gray-600">{stats.completed}</p>
      </div>
    </div>
  );
};

export default ProjectStats;
