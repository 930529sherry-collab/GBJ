import React from 'react';

const BackgroundMap: React.FC = () => {
  // An SVG pattern to create a stylized map grid
  const svgPattern = `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#AF7A4E" stroke-width="0.3"/>
        </pattern>
        <pattern id="streets" width="100" height="100" patternUnits="userSpaceOnUse">
           <rect width="100" height="100" fill="url(#grid)"/>
           <path d="M -10 10 L 110 90" fill="none" stroke="#AF7A4E" stroke-width="0.5"/>
           <path d="M 60 -10 L 40 110" fill="none" stroke="#AF7A4E" stroke-width="0.7"/>
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#streets)" />
    </svg>
  `;

  // Encode the SVG for use in a data URL
  const dataUrl = `url("data:image/svg+xml,${encodeURIComponent(svgPattern)}")`;

  return (
    <div
      className="fixed inset-0 z-0 opacity-[0.05] pointer-events-none"
      style={{
        backgroundImage: dataUrl,
        backgroundRepeat: 'repeat',
      }}
    />
  );
};

export default BackgroundMap;