/**
 * Container Component
 * Provides consistent max-width and padding for content
 */

import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  fluid?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses = {
  sm: 'max-w-screen-sm',   // 640px
  md: 'max-w-screen-md',   // 768px
  lg: 'max-w-screen-lg',   // 1024px
  xl: 'max-w-screen-xl',   // 1280px
  full: 'max-w-full',
};

export const Container: React.FC<ContainerProps> = ({
  children,
  className = '',
  fluid = false,
  size = 'xl',
}) => {
  const maxWidthClass = fluid ? 'max-w-full' : sizeClasses[size];

  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthClass} ${className}`}>
      {children}
    </div>
  );
};

export default Container;
