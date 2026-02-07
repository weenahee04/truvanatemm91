import React from 'react';

/**
 * Powerball Logo Component - Uses SVG from public folder
 */
export const PowerballLogo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`${className}`}>
      <img src="/Powerball_logo.svg" alt="Powerball" className="w-full h-full object-contain" />
    </div>
  );
};

/**
 * Mega Millions Logo Component - Uses SVG from public folder
 */
export const MegaMillionsLogo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`${className}`}>
      <img src="/Mega_Millions_Lottery_logo.svg" alt="Mega Millions" className="w-full h-full object-contain" />
    </div>
  );
};
