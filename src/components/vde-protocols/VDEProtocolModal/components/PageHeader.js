import React from 'react';

const PageHeader = React.memo(function PageHeader({ title, subtitle, customerName }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold mb-1">{title}</h1>
      {subtitle && <p className="text-sm mb-2">{subtitle}</p>}
      {customerName ? (
        <div className="text-sm border-b border-gray-300 pb-1">
          <span className="font-medium">Kunde:&nbsp;</span>
          {customerName}
        </div>
      ) : null}
    </div>
  );
});

export default PageHeader;
