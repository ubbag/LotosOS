import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'danger-ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ElementType;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon: Icon,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow focus:ring-blue-500 border border-transparent",
    secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm focus:ring-red-500 border border-transparent",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-900 border border-transparent",
    'danger-ghost': "bg-transparent hover:bg-red-50 text-red-600 hover:text-red-700 border border-transparent",
  };

  const sizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };
  
  const iconOnly = !children;
  
  // Padding logic
  let padding = "";
  if (iconOnly) {
     if (size === 'sm') padding = "p-1.5";
     else if (size === 'md') padding = "p-2";
     else padding = "p-3";
  } else {
     if (size === 'sm') padding = "px-3 py-1.5";
     else if (size === 'md') padding = "px-4 py-2";
     else padding = "px-6 py-3";
  }

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${padding} ${className}`} 
      {...props}
    >
      {Icon && <Icon className={`${iconSize} ${!iconOnly ? 'mr-2' : ''}`} />}
      {children}
    </button>
  );
};