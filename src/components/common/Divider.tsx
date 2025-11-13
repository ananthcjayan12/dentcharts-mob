/**
 * Divider Component
 * Visual separator between content sections
 */

import React from 'react';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  label?: string;
  color?: 'light' | 'medium' | 'dark';
}

const colorClasses = {
  light: 'border-gray-200',
  medium: 'border-gray-300',
  dark: 'border-gray-400',
};

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  className = '',
  label,
  color = 'light',
}) => {
  if (orientation === 'vertical') {
    return (
      <div className={`border-l ${colorClasses[color]} h-full ${className}`} />
    );
  }

  if (label) {
    return (
      <div className={`relative flex items-center ${className}`}>
        <div className={`flex-grow border-t ${colorClasses[color]}`} />
        <span className="flex-shrink mx-4 text-sm text-gray-500">{label}</span>
        <div className={`flex-grow border-t ${colorClasses[color]}`} />
      </div>
    );
  }

  return <hr className={`border-t ${colorClasses[color]} ${className}`} />;
};

export default Divider;
