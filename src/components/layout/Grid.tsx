/**
 * Grid Component
 * Responsive grid layout system
 */

import React from 'react';

interface GridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
}

export const Grid: React.FC<GridProps> = ({
  children,
  className = '',
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 4,
}) => {
  const colsClasses = [
    cols.xs && `grid-cols-${cols.xs}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`grid ${colsClasses} gap-${gap} ${className}`}>
      {children}
    </div>
  );
};

export default Grid;
