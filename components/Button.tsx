import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-[#238636] text-white hover:bg-[#2ea043] border border-[rgba(240,246,252,0.1)]",
    secondary: "bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d] border border-[#30363d]",
    ghost: "bg-transparent text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]",
    icon: "bg-transparent text-[#8b949e] hover:text-[#c9d1d9] p-2 hover:bg-[#21262d] rounded-full",
  };

  const sizes = {
    sm: "h-7 px-2 text-xs",
    md: "h-9 px-3 text-sm",
    lg: "h-10 px-4 text-base",
  };

  // Override size for icon variant
  const finalSize = variant === 'icon' ? '' : sizes[size];

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${finalSize} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};