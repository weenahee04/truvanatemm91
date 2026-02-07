import React from 'react';

/**
 * PTJ Logo Component
 * Two abstract figures embracing with "PTJ" text and a heart
 */
export const PTJLogoSVG: React.FC<{ size?: number; className?: string }> = ({ 
  size = 80,
  className = '' 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 200 200" 
      className={className}
      style={{ maxWidth: '100%', height: 'auto' }}
    >
      {/* Left figure (light green) */}
      <circle cx="60" cy="100" r="35" fill="#90EE90" stroke="#000" strokeWidth="1"/>
      <circle cx="60" cy="85" r="12" fill="#90EE90" stroke="#000" strokeWidth="1"/>
      {/* Left arm extending right */}
      <ellipse cx="85" cy="105" rx="15" ry="25" fill="#90EE90" stroke="#000" strokeWidth="1"/>
      
      {/* Right figure (light orange) */}
      <circle cx="140" cy="100" r="35" fill="#FFB347" stroke="#000" strokeWidth="1"/>
      <circle cx="140" cy="85" r="12" fill="#FFB347" stroke="#000" strokeWidth="1"/>
      {/* Right arm extending left */}
      <ellipse cx="115" cy="105" rx="15" ry="25" fill="#FFB347" stroke="#000" strokeWidth="1"/>
      
      {/* PTJ text - bold dark blue with white outline */}
      <text 
        x="100" 
        y="120" 
        fontSize="48" 
        fontFamily="Arial Black, sans-serif" 
        fontWeight="900"
        fill="#1e3a5f"
        textAnchor="middle"
        stroke="#ffffff"
        strokeWidth="3"
        paintOrder="stroke fill"
      >
        PTJ
      </text>
      
      {/* Heart above figures */}
      <path 
        d="M 95,70 Q 90,65 85,70 Q 80,75 85,80 Q 90,85 95,90 Q 100,85 105,80 Q 110,75 105,70 Q 100,65 95,70 Z" 
        fill="#FFB347" 
        stroke="#000" 
        strokeWidth="1"
      />
    </svg>
  );
};

/**
 * PTJ Logo as Base64 SVG (for PDF generation)
 */
export const getPTJLogoBase64 = (): string => {
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 200 200">
      <!-- Left figure (light green) -->
      <circle cx="60" cy="100" r="35" fill="#90EE90" stroke="#000" stroke-width="1"/>
      <circle cx="60" cy="85" r="12" fill="#90EE90" stroke="#000" stroke-width="1"/>
      <ellipse cx="85" cy="105" rx="15" ry="25" fill="#90EE90" stroke="#000" stroke-width="1"/>
      
      <!-- Right figure (light orange) -->
      <circle cx="140" cy="100" r="35" fill="#FFB347" stroke="#000" stroke-width="1"/>
      <circle cx="140" cy="85" r="12" fill="#FFB347" stroke="#000" stroke-width="1"/>
      <ellipse cx="115" cy="105" rx="15" ry="25" fill="#FFB347" stroke="#000" stroke-width="1"/>
      
      <!-- PTJ text -->
      <text x="100" y="120" font-size="48" font-family="Arial Black, sans-serif" font-weight="900" fill="#1e3a5f" text-anchor="middle" stroke="#ffffff" stroke-width="3" paint-order="stroke fill">PTJ</text>
      
      <!-- Heart -->
      <path d="M 95,70 Q 90,65 85,70 Q 80,75 85,80 Q 90,85 95,90 Q 100,85 105,80 Q 110,75 105,70 Q 100,65 95,70 Z" fill="#FFB347" stroke="#000" stroke-width="1"/>
    </svg>
  `.trim();
  
  // Convert SVG to base64
  const base64 = btoa(unescape(encodeURIComponent(svgString)));
  return `data:image/svg+xml;base64,${base64}`;
};

/**
 * PTJ Logo as inline SVG HTML string (for PDF HTML templates)
 */
export const getPTJLogoHTML = (size: number = 60): string => {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 200 200" style="display: block; margin: 0 auto;">
      <circle cx="60" cy="100" r="35" fill="#90EE90" stroke="#000" stroke-width="1"/>
      <circle cx="60" cy="85" r="12" fill="#90EE90" stroke="#000" stroke-width="1"/>
      <ellipse cx="85" cy="105" rx="15" ry="25" fill="#90EE90" stroke="#000" stroke-width="1"/>
      <circle cx="140" cy="100" r="35" fill="#FFB347" stroke="#000" stroke-width="1"/>
      <circle cx="140" cy="85" r="12" fill="#FFB347" stroke="#000" stroke-width="1"/>
      <ellipse cx="115" cy="105" rx="15" ry="25" fill="#FFB347" stroke="#000" stroke-width="1"/>
      <text x="100" y="120" font-size="48" font-family="Arial Black, sans-serif" font-weight="900" fill="#1e3a5f" text-anchor="middle" stroke="#ffffff" stroke-width="3" paint-order="stroke fill">PTJ</text>
      <path d="M 95,70 Q 90,65 85,70 Q 80,75 85,80 Q 90,85 95,90 Q 100,85 105,80 Q 110,75 105,70 Q 100,65 95,70 Z" fill="#FFB347" stroke="#000" stroke-width="1"/>
    </svg>
  `.trim();
};
