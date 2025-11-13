/**
 * Stack Component
 * Vertical or horizontal stack with consistent spacing
 */

import React from 'react';

interface StackProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'vertical' | 'horizontal';
  spacing?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
}

export const Stack: React.FC<StackProps> = ({
  children,
  className = '',
  direction = 'vertical',
  spacing = 4,
  align = 'stretch',
  justify = 'start',
  wrap = false,
}) => {
  const flexDirection = direction === 'vertical' ? 'flex-col' : 'flex-row';
  const gapClass = `gap-${spacing}`;

  const alignMap = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyMap = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  const wrapClass = wrap ? 'flex-wrap' : '';

  return (
    <div
      className={`flex ${flexDirection} ${gapClass} ${alignMap[align]} ${justifyMap[justify]} ${wrapClass} ${className}`}
    >
      {children}
    </div>
  );
};

export default Stack;
