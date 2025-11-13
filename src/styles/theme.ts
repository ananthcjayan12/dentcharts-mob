/**
 * Theme Configuration
 * Combines design tokens into a cohesive theme
 */

import { colors, typography, spacing, borderRadius, shadows, breakpoints, zIndex, transitions, components } from './tokens';

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
  transitions,
  components,
} as const;

export type Theme = typeof theme;

// Theme utilities
export const getColor = (path: string): string => {
  const keys = path.split('.');
  let value: any = colors;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value || path;
};

export const getSpacing = (size: keyof typeof spacing): string => {
  return spacing[size] || size.toString();
};

export default theme;
