import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  onClick,
  variant = 'default'
}) => {
  const handleClick = onClick ? { onClick, role: 'button', tabIndex: 0 } : {};
  
  const variantClasses = {
    default: 'bg-white rounded-xl p-4 shadow-sm border border-gray-100',
    elevated: 'bg-white rounded-xl p-4 shadow-lg border border-gray-50',
    outlined: 'bg-white rounded-xl p-4 border-2 border-gray-200'
  };
  
  const baseClasses = variantClasses[variant];
  const interactiveClasses = onClick 
    ? 'cursor-pointer hover:shadow-md active:scale-98 transition-all duration-200' 
    : '';
  
  return (
    <div
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      {...handleClick}
    >
      {children}
    </div>
  );
};

export default Card;
