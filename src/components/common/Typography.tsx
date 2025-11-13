/**
 * Typography Component
 * Provides consistent text styling
 */

import React from 'react';

interface TypographyProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'overline';
  className?: string;
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'success' | 'warning' | 'danger';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right' | 'justify';
  as?: keyof JSX.IntrinsicElements;
}

const variantClasses = {
  h1: 'text-5xl font-bold leading-tight',
  h2: 'text-4xl font-semibold leading-tight',
  h3: 'text-3xl font-semibold leading-normal',
  h4: 'text-2xl font-medium leading-normal',
  h5: 'text-xl font-medium leading-normal',
  h6: 'text-lg font-medium leading-normal',
  body1: 'text-base font-normal leading-normal',
  body2: 'text-sm font-normal leading-normal',
  caption: 'text-xs font-normal leading-normal',
  overline: 'text-xs font-medium leading-normal uppercase tracking-wider',
};

const colorClasses = {
  primary: 'text-gray-900',
  secondary: 'text-gray-600',
  tertiary: 'text-gray-400',
  inverse: 'text-white',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  danger: 'text-red-600',
};

const weightClasses = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
};

const defaultElements = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  body1: 'p',
  body2: 'p',
  caption: 'span',
  overline: 'span',
};

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body1',
  className = '',
  color = 'primary',
  weight,
  align = 'left',
  as,
}) => {
  const Element = (as || defaultElements[variant]) as keyof JSX.IntrinsicElements;
  
  const classes = [
    variantClasses[variant],
    colorClasses[color],
    weight && weightClasses[weight],
    alignClasses[align],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return React.createElement(Element, { className: classes }, children);
};

export default Typography;
