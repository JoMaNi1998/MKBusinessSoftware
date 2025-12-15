import React from 'react';

const MaterialStats = ({ materials }) => {
  const stats = {
    total: materials.length,
    inStock: materials.filter(m => m.stock > m.heatStock && m.orderStatus !== 'bestellt').length,
    low: materials.filter(m => m.stock > 0 && m.stock <= m.heatStock && m.orderStatus !== 'bestellt').length,
    ordered: materials.filter(m => m.orderStatus === 'bestellt').length,
    empty: materials.filter(m => m.stock === 0).length
  };

  return (
    <div className="grid grid-cols-5 md:grid-cols-5 gap-1.5 md:gap-4">
      <div className="bg-white p-2 md:p-4 rounded-lg shadow">
        <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Gesamt</p>
        <p className="text-base md:text-2xl font-bold text-gray-900">{stats.total}</p>
      </div>
      <div className="bg-white p-2 md:p-4 rounded-lg shadow">
        <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Lager</p>
        <p className="text-base md:text-2xl font-bold text-green-600">{stats.inStock}</p>
      </div>
      <div className="bg-white p-2 md:p-4 rounded-lg shadow">
        <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Niedrig</p>
        <p className="text-base md:text-2xl font-bold text-orange-600">{stats.low}</p>
      </div>
      <div className="bg-white p-2 md:p-4 rounded-lg shadow">
        <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Bestellt</p>
        <p className="text-base md:text-2xl font-bold text-blue-600">{stats.ordered}</p>
      </div>
      <div className="bg-white p-2 md:p-4 rounded-lg shadow">
        <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Leer</p>
        <p className="text-base md:text-2xl font-bold text-red-600">{stats.empty}</p>
      </div>
    </div>
  );
};

export default MaterialStats;
