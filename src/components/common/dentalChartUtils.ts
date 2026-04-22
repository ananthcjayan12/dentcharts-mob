export type ConditionOption = {
  value: string;
  label: string;
  icon: string;
  color: string;
};

type ConditionCatalogItem = {
  type: string;
  condition_name: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
};

type ProcedureCatalogItem = {
  procedure_name: string;
  is_active?: boolean;
};

export const DEFAULT_PROCEDURE_OPTIONS = [
  'Cleaning',
  'Scaling',
  'Root Planing',
  'Whitening',
  'Polishing',
  'Fluoride Treatment',
  'Sealant',
  'X-Ray',
  'Consultation',
];

export const CUSTOM_PROCEDURE_VALUE = '__custom_procedure__';

export const getTodayDate = () => new Date().toISOString().split('T')[0];

export const sortNumbers = (values: number[]) => [...values].sort((left, right) => left - right);

export const isValidFDIToothNumber = (toothNumber: number) => {
  const quadrant = Math.floor(toothNumber / 10);
  const position = toothNumber % 10;

  if ([1, 2, 3, 4].includes(quadrant)) {
    return position >= 1 && position <= 8;
  }

  if ([5, 6, 7, 8].includes(quadrant)) {
    return position >= 1 && position <= 5;
  }

  return false;
};

export const buildTreatmentItemKey = (
  procedureIdentifier: string,
  teeth: number[],
  condition: string | null
) => `${procedureIdentifier}|${sortNumbers(teeth).join(',')}|${condition || ''}`;

export const createClientId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 11);
};

export const getConditionOptions = (conditions: ConditionCatalogItem[]) => {
  const options = new Map<string, ConditionOption>();

  conditions
    .filter((condition) => condition.is_active !== false)
    .forEach((condition) => {
      if (!condition.type || options.has(condition.type)) {
        return;
      }

      options.set(condition.type, {
        value: condition.type,
        label: condition.condition_name,
        icon: condition.icon || '🦷',
        color: condition.color || 'text-gray-600',
      });
    });

  return Array.from(options.values());
};

export const getProcedureOptions = (procedures: ProcedureCatalogItem[]) => {
  const options = procedures
    .filter((procedure) => procedure.is_active !== false)
    .map((procedure) => procedure.procedure_name)
    .filter(Boolean);

  const uniqueOptions = Array.from(new Set(options)).sort((left, right) => left.localeCompare(right));
  return uniqueOptions.length > 0 ? uniqueOptions : DEFAULT_PROCEDURE_OPTIONS;
};