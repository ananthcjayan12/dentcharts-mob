import { describe, expect, it } from '@jest/globals';

import {
  buildTreatmentItemKey,
  DEFAULT_PROCEDURE_OPTIONS,
  getConditionOptions,
  getProcedureOptions,
  isValidFDIToothNumber,
} from './dentalChartUtils';

describe('dentalChartUtils', () => {
  it('validates only supported FDI tooth numbers', () => {
    expect(isValidFDIToothNumber(11)).toBe(true);
    expect(isValidFDIToothNumber(48)).toBe(true);
    expect(isValidFDIToothNumber(55)).toBe(true);
    expect(isValidFDIToothNumber(85)).toBe(true);
    expect(isValidFDIToothNumber(10)).toBe(false);
    expect(isValidFDIToothNumber(19)).toBe(false);
    expect(isValidFDIToothNumber(56)).toBe(false);
    expect(isValidFDIToothNumber(99)).toBe(false);
  });

  it('builds stable treatment item keys regardless of teeth order', () => {
    const first = buildTreatmentItemKey('RC01', [26, 24, 25], 'cavity');
    const second = buildTreatmentItemKey('RC01', [25, 26, 24], 'cavity');

    expect(first).toBe(second);
    expect(first).toBe('RC01|24,25,26|cavity');
  });

  it('returns no condition options when no catalog items exist', () => {
    expect(getConditionOptions([])).toEqual([]);
  });

  it('deduplicates active condition catalog items by type', () => {
    const options = getConditionOptions([
      { type: 'cavity', condition_name: 'Dental Caries', icon: '🦷', color: 'text-red-500', is_active: true },
      { type: 'cavity', condition_name: 'Duplicate Cavity', icon: '🦷', color: 'text-red-500', is_active: true },
      { type: 'fracture', condition_name: 'Fracture', icon: '⚡', color: 'text-orange-500', is_active: false },
    ]);

    expect(options).toEqual([
      { value: 'cavity', label: 'Dental Caries', icon: '🦷', color: 'text-red-500' },
    ]);
  });

  it('returns active unique procedure names or fallback values', () => {
    expect(getProcedureOptions([])).toEqual(DEFAULT_PROCEDURE_OPTIONS);
    expect(
      getProcedureOptions([
        { procedure_name: 'Scaling', is_active: true },
        { procedure_name: 'Scaling', is_active: true },
        { procedure_name: 'Whitening', is_active: false },
        { procedure_name: 'Consultation', is_active: true },
      ])
    ).toEqual(['Consultation', 'Scaling']);
  });
});