/**
 * Flex Component
 * Flexible layout component
 */

import React from 'react';

interface FlexProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'row' | 'row-reverse' | 'col' | 'col-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  gap?: number;
}

export const Flex: React.FC<FlexProps> = ({
  children,
  className = '',
  direction = 'row',
  align = 'start',
  justify = 'start',
  wrap = 'nowrap',
  gap,
}) => {
  const directionMap = {
    row: 'flex-row',
    'row-reverse': 'flex-row-reverse',
    col: 'flex-col',
    'col-reverse': 'flex-col-reverse',
  };

  const alignMap = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline',
  };

  const justifyMap = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  const wrapMap = {
    wrap: 'flex-wrap',
    nowrap: 'flex-nowrap',
    'wrap-reverse': 'flex-wrap-reverse',
  };

  const gapClass = gap ? `gap-${gap}` : '';

  return (
    <div
      className={`flex ${directionMap[direction]} ${alignMap[align]} ${justifyMap[justify]} ${wrapMap[wrap]} ${gapClass} ${className}`}
    >
      {children}
    </div>
  );
};

export default Flex;
