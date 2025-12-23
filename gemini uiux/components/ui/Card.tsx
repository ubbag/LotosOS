import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false }) => {
  return (
    <div className={`
      relative
      bg-gradient-to-br from-white to-blue-50
      border-l-4 border-blue-500
      rounded-lg
      shadow-sm hover:shadow-xl
      transition-all duration-300
      flex flex-col
      h-full
      ${noPadding ? '' : 'p-6'}
      ${className}
    `}>
      {children}
    </div>
  );
};