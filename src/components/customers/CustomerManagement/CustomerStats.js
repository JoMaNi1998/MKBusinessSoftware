import React from 'react';

const CustomerStats = ({ totalCustomers }) => {
  return (
    <div className="grid grid-cols-1 gap-1.5 md:gap-4">
      <div className="bg-white p-2 md:p-4 rounded-lg shadow">
        <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Gesamt</p>
        <p className="text-base md:text-2xl font-bold text-gray-900">{totalCustomers}</p>
      </div>
    </div>
  );
};

export default CustomerStats;
