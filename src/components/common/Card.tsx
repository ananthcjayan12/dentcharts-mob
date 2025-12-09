import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  title?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  title,
}) => {
  const handleClick = onClick ? { onClick, role: 'button', tabIndex: 0 } : {};

  const variantClasses = {
    default: 'bg-white rounded-lg shadow-sm border border-gray-200',
    elevated: 'bg-white rounded-lg shadow-lg border border-gray-100',
    outlined: 'bg-white rounded-lg border-2 border-gray-300',
    flat: 'bg-gray-50 rounded-lg border border-gray-200',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const baseClasses = variantClasses[variant];
  const interactiveClasses = (onClick || hoverable)
    ? 'cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all duration-base'
    : '';

  return (
    <div
      className={`${baseClasses} ${paddingClasses[padding]} ${interactiveClasses} ${className}`}
      {...handleClick}
    >
      {title && (
        <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">{title}</h3>
      )}
      {children}
    </div>
  );
};

export default Card;
