import React from 'react';

const Section = React.memo(function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h3 className="font-bold mb-3 pb-2 border-b-2 border-gray-800">{title}</h3>
      {children}
    </div>
  );
});

export default Section;
