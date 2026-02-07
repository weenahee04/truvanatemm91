import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
  className?: string;
}

const sizeMap = {
  sm: { text: 'text-lg md:text-xl', icon: 'h-6 w-6 md:h-7 md:w-7' },
  md: { text: 'text-2xl md:text-3xl', icon: 'h-8 w-8 md:h-10 md:w-10' },
  lg: { text: 'text-3xl md:text-4xl', icon: 'h-12 w-12 md:h-14 md:w-14' },
  xl: { text: 'text-4xl md:text-5xl', icon: 'h-16 w-16 md:h-20 md:w-20' },
};

// Dark blue color: #1e3a5f หรือ #1e40af (slate-800)
// Bright red color: #ef4444 หรือ #dc2626 (red-500)
const darkBlue = '#1e3a5f';
const brightRed = '#ef4444';

// Icon version: แสดงแค่ตัว T หรืออักษรย่อ
export const LogoIcon: React.FC<LogoProps> = ({ 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = sizeMap[size];
  
  return (
    <div className={`${sizeClasses.icon} flex items-center justify-center bg-gradient-to-br from-[#1e3a5f] to-[#1e40af] rounded-lg ${className}`}>
      <span className="text-white font-black text-lg md:text-xl">T</span>
    </div>
  );
};

// Full logo text version using HTML/CSS for better browser compatibility
export const LogoText: React.FC<LogoProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = sizeMap[size];
  
  return (
    <h1 className={`${sizeClasses.text} font-black tracking-tighter leading-none ${className}`}>
      <span style={{ color: darkBlue }}>Truva</span>
      <span style={{ color: brightRed }}>m</span>
      <span style={{ color: darkBlue }} className="relative inline-block">
        A
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-black text-[0.35em] leading-none" style={{ fontFamily: 'Arial, sans-serif' }}>★</span>
      </span>
      <span style={{ color: brightRed }}>te</span>
    </h1>
  );
};

// Compact version for header/navigation
export const LogoCompact: React.FC<LogoProps & { showTagline?: boolean }> = ({ 
  size = 'md',
  showTagline = false,
  className = '' 
}) => {
  return (
    <div className={`flex flex-col items-start leading-none shrink-0 ${className}`}>
      <LogoText size={size} />
      {showTagline && (
        <span className="text-[10px] text-slate-800 font-bold tracking-widest uppercase hidden md:block mt-1">
          Premium Marketplace
        </span>
      )}
    </div>
  );
};

// Default export for backwards compatibility
export const Logo: React.FC<LogoProps> = (props) => {
  if (props.variant === 'icon') {
    return <LogoIcon {...props} />;
  }
  return <LogoText {...props} />;
};
