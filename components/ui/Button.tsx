import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    // Primary is now Yellow (Brand Gold) with Black text
    primary: "bg-brand-gold text-slate-900 hover:bg-yellow-400 focus:ring-brand-gold",
    // Secondary is now Black (Brand Navy) with White text
    secondary: "bg-brand-navy text-white hover:bg-slate-800 focus:ring-brand-navy",
    // Outline remains similar but uses Black text
    outline: "border border-slate-900 bg-transparent text-slate-900 hover:bg-slate-900 hover:text-white focus:ring-slate-900",
    danger: "bg-brand-red text-white hover:bg-red-700 focus:ring-red-500",
    ghost: "bg-transparent text-slate-900 hover:bg-slate-100",
  };

  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 py-2",
    lg: "h-12 px-6 text-lg",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};