import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import Autocomplete from '../common/Autocomplete';
import Button from '../common/Button';
import Card from '../common/Card';
import Portal from '../common/Portal';
import { expenseSheetService } from '../../api/services/expenseSheet';
import {
  CreateExpenseRequest,
  ExpenseFilterMode,
  ExpenseItemSuggestion,
  ExpenseSheetParams,
  ExpenseSheetRow,
  UpdateExpenseRuleRequest,
} from '../../api/types';
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenseBreakdown,
  useExpenseSheet,
  useSaveExpenseChanges,
  useUpdateExpenseRule,
} from '../../hooks/useExpenseSheet';
import { useDashboardStats } from '../../hooks/useDashboard';

type DraftFilter = {
  filter_mode: ExpenseFilterMode;
  month: number;
  year: number;
  fiscal_year: string;
};

type RowDraft = {
  row_key: string;
  amount: string;
  payment_date: string;
};

type ExpenseModalState = {
  expense_name: string;
  expense_category: 'Recurring Fixed' | 'Recurring Variable' | 'One-Time';
  amount: string;
  payment_date: string;
  apply_backfill: boolean;
  backfill_start_month: string;
  backfill_end_month: string;
};

type RuleModalState = {
  expense_name: string;
  expense_category: 'Recurring Fixed' | 'Recurring Variable';
  amount: string;
};

type TrendPoint = {
  date: string;
  amount: number;
  height: number;
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const currentDate = new Date();
const buildDefaultFilter = (): DraftFilter => ({
  filter_mode: 'specific_month',
  month: currentDate.getMonth() + 1,
  year: currentDate.getFullYear(),
  fiscal_year: '',
});

const money = (amount: number | null | undefined) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

const isoMonthDate = (month: number, year: number) => `${year}-${String(month).padStart(2, '0')}-01`;

const csvEscape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const getDefaultPaymentDate = (filter: DraftFilter) => {
  if (filter.filter_mode === 'specific_month') {
    return isoMonthDate(filter.month, filter.year);
  }
  return new Date().toISOString().split('T')[0];
};

const buildExpenseParams = (filter: DraftFilter, clinicId?: string | null): ExpenseSheetParams => ({
  filter_mode: filter.filter_mode,
  clinic: clinicId || undefined,
  month: filter.filter_mode === 'specific_month' ? filter.month : undefined,
  year: filter.filter_mode === 'specific_month' ? filter.year : undefined,
  fiscal_year: filter.filter_mode === 'financial_year' ? filter.fiscal_year || undefined : undefined,
});

const getDateRangeFromFilter = (filter: DraftFilter) => {
  if (filter.filter_mode === 'specific_month') {
    const from = new Date(filter.year, filter.month - 1, 1);
    const to = new Date(filter.year, filter.month, 0);
    return {
      from_date: from.toISOString().split('T')[0],
      to_date: to.toISOString().split('T')[0],
    };
  }

  const fiscalYearToken = (filter.fiscal_year || '').split('-');
  const startYear = Number(fiscalYearToken[0]);
  const endYear = Number(fiscalYearToken[1]);
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) {
    const today = new Date();
    const fallbackStartYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
    return {
      from_date: `${fallbackStartYear}-04-01`,
      to_date: `${fallbackStartYear + 1}-03-31`,
    };
  }
  return {
    from_date: `${startYear}-04-01`,
    to_date: `${endYear}-03-31`,
  };
};

const getPreviousFilter = (filter: DraftFilter): DraftFilter => {
  if (filter.filter_mode === 'specific_month') {
    const previousDate = new Date(filter.year, filter.month - 2, 1);
    return {
      ...filter,
      month: previousDate.getMonth() + 1,
      year: previousDate.getFullYear(),
    };
  }

  const fiscalYearToken = (filter.fiscal_year || '').split('-');
  const startYear = Number(fiscalYearToken[0]);
  if (!Number.isFinite(startYear)) {
    const today = new Date();
    const fallbackStartYear = today.getMonth() >= 3 ? today.getFullYear() - 1 : today.getFullYear() - 2;
    return {
      ...filter,
      fiscal_year: `${fallbackStartYear}-${fallbackStartYear + 1}`,
    };
  }

  const previousStartYear = startYear - 1;
  return {
    ...filter,
    fiscal_year: `${previousStartYear}-${previousStartYear + 1}`,
  };
};

function ExpenseEntryModal({
  isOpen,
  initialState,
  onClose,
  onSubmit,
  isSaving,
  clinicId,
}: {
  isOpen: boolean;
  initialState: ExpenseModalState;
  onClose: () => void;
  onSubmit: (state: ExpenseModalState) => void;
  isSaving: boolean;
  clinicId?: string | null;
}) {
  const [form, setForm] = useState<ExpenseModalState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm(initialState);
    setErrors({});
  }, [initialState, isOpen]);

  if (!isOpen) return null;

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialState);

  const attemptClose = () => {
    if (isDirty && !window.confirm('Discard unsaved expense changes?')) {
      return;
    }
    onClose();
  };

  const submit = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.expense_name.trim()) nextErrors.expense_name = 'Expense item is required';
    if (!form.expense_category) nextErrors.expense_category = 'Category is required';
    if (!/^\d+(\.\d{1,2})?$/.test(form.amount.trim())) nextErrors.amount = 'Enter a valid amount';
    if (form.expense_category === 'Recurring Fixed' && form.apply_backfill) {
      if (!form.backfill_start_month) nextErrors.backfill_start_month = 'Backfill start month is required';
      if (!form.backfill_end_month) nextErrors.backfill_end_month = 'Backfill end month is required';
      if (form.backfill_start_month && form.backfill_end_month && form.backfill_start_month > form.backfill_end_month) {
        nextErrors.backfill_end_month = 'End month must be after start month';
      }
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    onSubmit(form);
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[120] bg-slate-900/25 backdrop-blur-sm flex items-center justify-center p-4" onClick={attemptClose}>
        <div className="w-full max-w-5xl rounded-[18px] bg-white shadow-2xl border border-slate-200 overflow-hidden" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between px-10 py-8 border-b border-slate-200 bg-white">
            <div>
              <h3 className="text-4xl font-extrabold text-slate-900">New Expense</h3>
            </div>
            <button type="button" onClick={attemptClose} className="w-10 h-10 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center">
              <XMarkIcon className="w-7 h-7" />
            </button>
          </div>

          <div className="p-10 space-y-8 bg-slate-50/35">
            <div className="grid grid-cols-1 lg:grid-cols-[2.3fr_1.1fr] gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.18em] mb-3">Search Expense Item</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <MagnifyingGlassIcon className="w-6 h-6" />
                  </div>
                  <div className="pl-12">
                    <Autocomplete<ExpenseItemSuggestion>
                      value={form.expense_name}
                      onSelect={(item) => {
                        if (item?.name) {
                          setForm((current) => ({ ...current, expense_name: item.name }));
                        }
                      }}
                      onInputChange={(value) => setForm((current) => ({ ...current, expense_name: value }))}
                      fetchSuggestions={(query) => expenseSheetService.searchExpenseItems(query, clinicId || undefined)}
                      placeholder="e.g., Rent, Salaries, Implants"
                    />
                  </div>
                </div>
                {errors.expense_name && <p className="mt-2 text-xs font-medium text-red-500">{errors.expense_name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.18em] mb-3">Payment Date (Optional)</label>
                <div className="relative">
                  <input
                    type="date"
                    value={form.payment_date}
                    onChange={(event) => setForm((current) => ({ ...current, payment_date: event.target.value }))}
                    className="w-full h-14 px-4 rounded-xl border border-slate-200 bg-slate-100/80 text-lg font-medium text-slate-700 outline-none focus:ring-2 focus:ring-cyan-700/20"
                  />
                  <CalendarDaysIcon className="w-6 h-6 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.18em] mb-4">Expense Category</label>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[
                  { key: 'Recurring Fixed', title: 'Recurring Fixed', subtitle: 'Consistent monthly costs like rent or salaries.' },
                  { key: 'Recurring Variable', title: 'Recurring Variable', subtitle: 'Monthly costs that fluctuate like utility bills.' },
                  { key: 'One-Time', title: 'One-time', subtitle: 'Single purchases or emergency repairs.' },
                ].map((option) => {
                  const selected = form.expense_category === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, expense_category: option.key as ExpenseModalState['expense_category'] }))}
                      className={`rounded-2xl border px-6 py-6 text-left transition-all ${selected ? 'border-cyan-700 bg-cyan-50/50 ring-2 ring-cyan-700/20' : 'border-slate-200 bg-white hover:border-cyan-300'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-700">
                          <CalendarDaysIcon className="w-6 h-6" />
                        </span>
                        {selected ? <CheckCircleIcon className="w-6 h-6 text-cyan-700" /> : null}
                      </div>
                      <div className="mt-5 text-3xl font-bold text-slate-900">{option.title}</div>
                      <div className="mt-2 text-lg text-slate-500 leading-snug">{option.subtitle}</div>
                    </button>
                  );
                })}
              </div>
              {errors.expense_category && <p className="mt-2 text-xs font-medium text-red-500">{errors.expense_category}</p>}
            </div>

            <div className="max-w-md">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.18em] mb-3">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-extrabold text-slate-900">₹</span>
                <input
                  type="text"
                  value={form.amount}
                  onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                  placeholder="0.00"
                  className="w-full h-14 pl-11 pr-4 rounded-xl border border-slate-300 bg-white text-2xl font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-cyan-700/20"
                />
              </div>
              {errors.amount && <p className="mt-2 text-xs font-medium text-red-500">{errors.amount}</p>}
            </div>

            {form.expense_category === 'Recurring Fixed' ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.apply_backfill}
                    onChange={(event) => setForm((current) => ({ ...current, apply_backfill: event.target.checked }))}
                  />
                  Apply Backfill To Previous Months
                </label>
                {form.apply_backfill ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.14em] mb-1">Backfill Start</label>
                      <input
                        type="month"
                        value={form.backfill_start_month}
                        onChange={(event) => setForm((current) => ({ ...current, backfill_start_month: event.target.value }))}
                        className="w-full h-11 rounded-lg border border-slate-300 px-3 text-sm font-medium"
                      />
                      {errors.backfill_start_month && <p className="mt-1 text-xs text-red-500">{errors.backfill_start_month}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.14em] mb-1">Backfill End</label>
                      <input
                        type="month"
                        value={form.backfill_end_month}
                        onChange={(event) => setForm((current) => ({ ...current, backfill_end_month: event.target.value }))}
                        className="w-full h-11 rounded-lg border border-slate-300 px-3 text-sm font-medium"
                      />
                      {errors.backfill_end_month && <p className="mt-1 text-xs text-red-500">{errors.backfill_end_month}</p>}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="px-10 py-6 border-t border-slate-200 bg-slate-100/70 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-4">
            <Button type="button" variant="ghost" onClick={attemptClose} className="text-lg font-semibold text-slate-600">
              Cancel
            </Button>
            <Button type="button" onClick={submit} isLoading={isSaving} className="px-8" leftIcon={<PlusIcon className="w-4 h-4" />}>
              Save Expense
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

function RuleEditModal({
  isOpen,
  row,
  effectiveMonth,
  onClose,
  onSubmit,
  isSaving,
}: {
  isOpen: boolean;
  row: ExpenseSheetRow | null;
  effectiveMonth: string;
  onClose: () => void;
  onSubmit: (payload: RuleModalState) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<RuleModalState>({
    expense_name: row?.expense_name || '',
    expense_category: 'Recurring Fixed',
    amount: row?.amount != null ? String(row.amount) : '',
  });

  useEffect(() => {
    setForm({
      expense_name: row?.expense_name || '',
      expense_category: (row?.expense_category === 'Recurring Variable' ? 'Recurring Variable' : 'Recurring Fixed'),
      amount: row?.amount != null ? String(row.amount) : '',
    });
  }, [row, isOpen]);

  if (!isOpen || !row) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[120] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <div className="w-full max-w-md rounded-[28px] bg-white shadow-2xl border border-gray-100 overflow-hidden" onClick={(event) => event.stopPropagation()}>
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/70">
            <h3 className="text-lg font-extrabold text-gray-900">Update Recurring Rule</h3>
            <p className="text-xs font-medium text-gray-500 mt-1">This change will apply from {effectiveMonth} onward.</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Expense Item</label>
              <input
                type="text"
                value={form.expense_name}
                onChange={(event) => setForm((current) => ({ ...current, expense_name: event.target.value }))}
                className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Forward Category</label>
              <select
                value={form.expense_category}
                onChange={(event) => setForm((current) => ({ ...current, expense_category: event.target.value as RuleModalState['expense_category'] }))}
                className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="Recurring Fixed">Recurring Fixed</option>
                <option value="Recurring Variable">Recurring Variable</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                {form.expense_category === 'Recurring Fixed' ? 'Fixed Amount' : 'Starting Month Amount'}
              </label>
              <input
                type="text"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/70 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="button" isLoading={isSaving} onClick={() => onSubmit(form)}>Update Rule</Button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

function DeleteRecurringFixedModal({
  row,
  isOpen,
  onClose,
  onStopForward,
  onRemoveAll,
  isDeleting,
}: {
  row: ExpenseSheetRow | null;
  isOpen: boolean;
  onClose: () => void;
  onStopForward: () => void;
  onRemoveAll: () => void;
  isDeleting: boolean;
}) {
  if (!isOpen || !row) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[120] bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="px-6 py-5 border-b border-slate-200">
            <h3 className="text-xl font-extrabold text-slate-900">Delete Recurring Fixed</h3>
            <p className="mt-2 text-sm text-slate-600">
              Choose how to remove <span className="font-bold text-slate-900">{row.expense_name}</span>.
            </p>
          </div>

          <div className="p-6 space-y-3">
            <button
              type="button"
              onClick={onStopForward}
              disabled={isDeleting}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100 transition-colors disabled:opacity-60"
            >
              <div className="text-sm font-bold text-slate-900">Stop Forward</div>
              <div className="text-xs text-slate-500 mt-1">Keep history, stop from selected month onward.</div>
            </button>
            <button
              type="button"
              onClick={onRemoveAll}
              disabled={isDeleting}
              className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-left hover:bg-rose-100 transition-colors disabled:opacity-60"
            >
              <div className="text-sm font-bold text-rose-700">Remove All</div>
              <div className="text-xs text-rose-600 mt-1">Delete the entire recurring rule and all months.</div>
            </button>
          </div>

          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

const ExpenseSheetSection: React.FC<{ clinicId?: string | null }> = ({ clinicId }) => {
  const currentYear = new Date().getFullYear();
  const [draftFilter, setDraftFilter] = useState<DraftFilter>(buildDefaultFilter);
  const [appliedFilter, setAppliedFilter] = useState<DraftFilter>(buildDefaultFilter);
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const [rowDrafts, setRowDrafts] = useState<Record<string, RowDraft>>({});
  const [editingRowKeys, setEditingRowKeys] = useState<Record<string, boolean>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [ruleEditRow, setRuleEditRow] = useState<ExpenseSheetRow | null>(null);
  const [deleteFixedRow, setDeleteFixedRow] = useState<ExpenseSheetRow | null>(null);
  const breakdownRef = useRef<HTMLDivElement | null>(null);

  const expenseParams = useMemo(() => buildExpenseParams(appliedFilter, clinicId), [appliedFilter, clinicId]);
  const { data, isLoading, error } = useExpenseSheet(expenseParams, Boolean(clinicId));
  const previousFilter = useMemo(() => getPreviousFilter(appliedFilter), [appliedFilter]);
  const previousExpenseParams = useMemo(() => buildExpenseParams(previousFilter, clinicId), [previousFilter, clinicId]);
  const { data: previousExpenseData } = useExpenseSheet(previousExpenseParams, Boolean(clinicId));
  const currentDateParams = useMemo(() => ({ ...getDateRangeFromFilter(appliedFilter), clinic: clinicId || undefined }), [appliedFilter, clinicId]);
  const previousDateParams = useMemo(() => ({ ...getDateRangeFromFilter(previousFilter), clinic: clinicId || undefined }), [previousFilter, clinicId]);
  const { data: currentFinanceData } = useDashboardStats(currentDateParams, Boolean(clinicId));
  const { data: previousFinanceData } = useDashboardStats(previousDateParams, Boolean(clinicId));
  const rows = useMemo(() => data?.rows || [], [data?.rows]);
  const createExpense = useCreateExpense();
  const saveChanges = useSaveExpenseChanges(clinicId);
  const updateRule = useUpdateExpenseRule();
  const deleteExpense = useDeleteExpense();
  const breakdown = useExpenseBreakdown({ ...expenseParams, row_key: selectedRowKey }, Boolean(clinicId) && Boolean(selectedRowKey));

  useEffect(() => {
    if (!data) return;
    if (!draftFilter.fiscal_year && data.filters.selected_fiscal_year) {
      setDraftFilter((current) => ({ ...current, fiscal_year: data.filters.selected_fiscal_year || '' }));
      setAppliedFilter((current) => ({ ...current, fiscal_year: data.filters.selected_fiscal_year || '' }));
    }
  }, [data, draftFilter.fiscal_year]);

  useEffect(() => {
    if (!rows.length) {
      setSelectedRowKey(null);
      return;
    }
    const stillVisible = selectedRowKey && rows.some((row) => row.row_key === selectedRowKey);
    if (!stillVisible) {
      setSelectedRowKey(data?.default_selected_row_key || rows[0].row_key);
    }
  }, [rows, selectedRowKey, data?.default_selected_row_key]);

  useEffect(() => {
    if (selectedRowKey && breakdownRef.current) {
      breakdownRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedRowKey]);

  const monthOptions = useMemo(
    () => monthNames.map((label, index) => ({ label, value: index + 1 })),
    []
  );
  const yearOptions = useMemo(
    () => Array.from({ length: 5 }, (_, index) => currentYear - 1 + index),
    [currentYear]
  );
  const availableFiscalYears = data?.filters.available_fiscal_years || [];
  const revenueCurrent = Number(currentFinanceData?.summary?.period_invoiced || 0);
  const revenuePrevious = Number(previousFinanceData?.summary?.period_invoiced || 0);
  const expenseCurrent = Number(data?.summary?.total_amount || 0);
  const expensePrevious = Number(previousExpenseData?.summary?.total_amount || 0);
  const netProfitCurrent = revenueCurrent - expenseCurrent;
  const netProfitPrevious = revenuePrevious - expensePrevious;
  const profitDeltaPct = netProfitPrevious !== 0 ? ((netProfitCurrent - netProfitPrevious) / Math.abs(netProfitPrevious)) * 100 : 0;
  const expenseDeltaPct = expensePrevious !== 0 ? ((expenseCurrent - expensePrevious) / Math.abs(expensePrevious)) * 100 : 0;
  const trendPoints = useMemo<TrendPoint[]>(() => {
    const points = (currentFinanceData?.revenue_trend || []).slice(-5);
    if (!points.length) return [];
    const max = Math.max(...points.map((point: any) => Number(point.amount || 0)), 1);
    return points.map((point: any) => ({
      date: point.date,
      amount: Number(point.amount || 0),
      height: Math.max(18, Math.round((Number(point.amount || 0) / max) * 100)),
    }));
  }, [currentFinanceData?.revenue_trend]);

  const displayedRows = useMemo(
    () =>
      rows.map((row) => {
        const draft = rowDrafts[row.row_key];
        if (!draft) return row;
        return {
          ...row,
          amount: draft.amount === '' ? null : Number(draft.amount),
          payment_date: draft.payment_date || null,
        };
      }),
    [rows, rowDrafts]
  );

  const createModalInitialState = useMemo<ExpenseModalState>(
    () => ({
      expense_name: '',
      expense_category: 'Recurring Fixed',
      amount: '',
      payment_date: getDefaultPaymentDate(appliedFilter),
      apply_backfill: false,
      backfill_start_month: isoMonthDate(appliedFilter.month, appliedFilter.year).slice(0, 7),
      backfill_end_month: isoMonthDate(appliedFilter.month, appliedFilter.year).slice(0, 7),
    }),
    [appliedFilter]
  );

  const selectedMonthIso = appliedFilter.filter_mode === 'specific_month'
    ? isoMonthDate(appliedFilter.month, appliedFilter.year)
    : getDefaultPaymentDate(appliedFilter);

  const handleApplyFilter = () => {
    const nextFiscalYear =
      draftFilter.filter_mode === 'financial_year'
        ? draftFilter.fiscal_year || availableFiscalYears[0]?.name || ''
        : draftFilter.fiscal_year;

    setAppliedFilter((current) => ({
      ...draftFilter,
      fiscal_year: nextFiscalYear,
    }));
    setDraftFilter((current) => ({
      ...current,
      fiscal_year: nextFiscalYear,
    }));
    setSelectedRowKey(null);
    setRowDrafts({});
    setEditingRowKeys({});
    setRowErrors({});
  };

  const toggleInlineEdit = (row: ExpenseSheetRow) => {
    if (!row.can_edit_amount) return;
    setEditingRowKeys((current) => ({
      ...current,
      [row.row_key]: !current[row.row_key],
    }));
    setRowDrafts((current) => ({
      ...current,
      [row.row_key]:
        current[row.row_key] ||
        {
          row_key: row.row_key,
          amount: row.amount == null ? '' : String(row.amount),
          payment_date: row.payment_date || selectedMonthIso,
        },
    }));
  };

  const handleSaveChanges = async () => {
    const nextErrors: Record<string, string> = {};
    const payload = Object.values(rowDrafts)
      .filter((draft) => editingRowKeys[draft.row_key])
      .map((draft) => {
        if (!/^\d+(\.\d{1,2})?$/.test(draft.amount.trim())) {
          nextErrors[draft.row_key] = 'Enter a valid amount with up to 2 decimals';
        }
        return {
          row_key: draft.row_key,
          amount: Number(draft.amount),
          payment_date: draft.payment_date || selectedMonthIso,
        };
      });

    setRowErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || payload.length === 0) {
      return;
    }

    await saveChanges.mutateAsync(payload);
    setRowDrafts({});
    setEditingRowKeys({});
    setRowErrors({});
  };

  const handleDelete = async (row: ExpenseSheetRow) => {
    if (!row.can_delete || !row.expense_rule_id) return;
    if (row.expense_category === 'Recurring Fixed') {
      setDeleteFixedRow(row);
      return;
    }
    if (!window.confirm(`Delete ${row.expense_name} from this period forward?`)) {
      return;
    }    
    await deleteExpense.mutateAsync({
      rule_id: row.expense_rule_id,
      clinic: clinicId || undefined,
      effective_month: selectedMonthIso,
      delete_mode: 'forward',
    });
  };

  const executeRecurringFixedDelete = async (deleteMode: 'forward' | 'all') => {
    if (!deleteFixedRow?.expense_rule_id) return;
    await deleteExpense.mutateAsync({
      rule_id: deleteFixedRow.expense_rule_id,
      clinic: clinicId || undefined,
      effective_month: selectedMonthIso,
      delete_mode: deleteMode,
    });
    setDeleteFixedRow(null);
  };

  const handleCreateExpense = async (form: ExpenseModalState) => {
    const payload: CreateExpenseRequest = {
      ...buildExpenseParams(appliedFilter, clinicId),
      clinic: clinicId || undefined,
      expense_name: form.expense_name.trim(),
      expense_category: form.expense_category,
      amount: Number(form.amount),
      payment_date: form.payment_date || undefined,
      apply_backfill: form.expense_category === 'Recurring Fixed' && form.apply_backfill ? 1 : 0,
      backfill_start_month: form.expense_category === 'Recurring Fixed' && form.apply_backfill ? `${form.backfill_start_month}-01` : undefined,
      backfill_end_month: form.expense_category === 'Recurring Fixed' && form.apply_backfill ? `${form.backfill_end_month}-01` : undefined,
    };
    await createExpense.mutateAsync(payload);
    setIsCreateOpen(false);
  };

  const handleUpdateRule = async (form: RuleModalState) => {
    if (!ruleEditRow?.expense_rule_id) return;
    const payload: UpdateExpenseRuleRequest = {
      rule_id: ruleEditRow.expense_rule_id,
      clinic: clinicId || undefined,
      effective_month: selectedMonthIso,
      expense_name: form.expense_name.trim(),
      expense_category: form.expense_category,
      amount: form.amount ? Number(form.amount) : null,
    };
    await updateRule.mutateAsync(payload);
    setRuleEditRow(null);
  };

  const handleExport = () => {
    if (!displayedRows.length) return;
    const rowsCsv = displayedRows.map((row) => [
      row.expense_name,
      row.expense_category,
      row.row_type,
      row.amount ?? '',
      row.payment_date || '',
      row.is_system_generated ? 'Yes' : 'No',
    ]);
    const content = [
      ['Expense Item', 'Category', 'Row Type', 'Amount', 'Payment Date', 'Read Only'],
      ...rowsCsv,
      [],
      ['Total Amount', data?.totals.total_amount ?? 0],
      ['Manual Amount', data?.totals.manual_amount ?? 0],
      ['System Amount', data?.totals.system_amount ?? 0],
    ]
      .map((row) => row.map(csvEscape).join(','))
      .join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expense-sheet-${appliedFilter.filter_mode === 'specific_month' ? `${appliedFilter.year}-${String(appliedFilter.month).padStart(2, '0')}` : appliedFilter.fiscal_year || 'fy'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card className="p-6 rounded-[24px] border border-slate-200 shadow-sm bg-white overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 border-b border-slate-200 pb-5">
          <div>
            <h4 className="text-[34px] leading-tight font-extrabold text-slate-900 tracking-tight">Expense Management</h4>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Simplified clinical overhead review with period-based profit visibility.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={handleExport} leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}>
              Export CSV
            </Button>
            <Button type="button" size="sm" onClick={() => setIsCreateOpen(true)} leftIcon={<PlusIcon className="w-4 h-4" />}>
              New Expense
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-5">
          <div className="rounded-[22px] border border-slate-200 bg-slate-50/90 p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="inline-flex rounded-xl bg-white border border-gray-200 p-1">
                <button
                  type="button"
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${draftFilter.filter_mode === 'specific_month' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  onClick={() => setDraftFilter((current) => ({ ...current, filter_mode: 'specific_month' }))}
                >
                  Specific Month
                </button>
                <button
                  type="button"
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${draftFilter.filter_mode === 'financial_year' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  onClick={() => setDraftFilter((current) => ({ ...current, filter_mode: 'financial_year' }))}
                >
                  Financial Year
                </button>
              </div>

              {draftFilter.filter_mode === 'specific_month' ? (
                <>
                  <select
                    value={draftFilter.month}
                    onChange={(event) => setDraftFilter((current) => ({ ...current, month: Number(event.target.value) }))}
                    className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    {monthOptions.map((monthOption) => (
                      <option key={monthOption.value} value={monthOption.value}>{monthOption.label}</option>
                    ))}
                  </select>
                  <select
                    value={draftFilter.year}
                    onChange={(event) => setDraftFilter((current) => ({ ...current, year: Number(event.target.value) }))}
                    className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    {yearOptions.map((yearOption) => (
                      <option key={yearOption} value={yearOption}>{yearOption}</option>
                    ))}
                  </select>
                </>
              ) : (
                <select
                  value={draftFilter.fiscal_year}
                  onChange={(event) => setDraftFilter((current) => ({ ...current, fiscal_year: event.target.value }))}
                  className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500/20 min-w-[180px]"
                >
                  {(availableFiscalYears.length ? availableFiscalYears : [{ name: draftFilter.fiscal_year, label: draftFilter.fiscal_year, year_start_date: '', year_end_date: '' }])
                    .filter((fy) => fy.name)
                    .map((fy) => (
                      <option key={fy.name} value={fy.name}>{fy.label}</option>
                    ))}
                </select>
              )}

              <Button type="button" size="sm" onClick={handleApplyFilter}>Apply Filter</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-[18px] border border-sky-100 bg-white p-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600">
                {appliedFilter.filter_mode === 'financial_year' ? 'Total Expense (FY)' : 'Total Expense'}
              </div>
              <div className="mt-2 text-4xl font-extrabold text-cyan-800">{money(expenseCurrent)}</div>
              <div className={`mt-2 text-xs font-bold ${expenseDeltaPct <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {expenseDeltaPct >= 0 ? '▲' : '▼'} {Math.abs(expenseDeltaPct).toFixed(1)}% vs previous period
              </div>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-white p-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600">
                {appliedFilter.filter_mode === 'financial_year' ? 'Total Profit (FY)' : 'Net Profit'}
              </div>
              <div className={`mt-2 text-4xl font-extrabold ${netProfitCurrent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{money(netProfitCurrent)}</div>
              <div className={`mt-2 text-xs font-bold ${profitDeltaPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {profitDeltaPct >= 0 ? '▲' : '▼'} {Math.abs(profitDeltaPct).toFixed(1)}% vs previous period
              </div>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-white p-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600">Revenue For Period</div>
              <div className="mt-2 text-4xl font-extrabold text-slate-900">{money(revenueCurrent)}</div>
              <div className="mt-2 text-xs font-bold text-slate-500">
                Manual: {money(data?.summary.manual_amount || 0)} • System: {money(data?.summary.system_amount || 0)}
              </div>
            </div>
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[28px] font-extrabold text-slate-900">Profitability Trend</div>
                <div className="text-sm text-slate-500 mt-1">Period invoiced progression</div>
              </div>
              <div className="text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase">
                {appliedFilter.filter_mode === 'financial_year' ? appliedFilter.fiscal_year : `${monthNames[appliedFilter.month - 1]} ${appliedFilter.year}`}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 items-end">
              <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Target Margin</div>
                <div className="mt-2 text-4xl font-extrabold text-cyan-800">
                  {revenueCurrent > 0 ? `${Math.max(0, Math.min(100, Math.round((netProfitCurrent / revenueCurrent) * 100)))}%` : '0%'}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Pending entries: <span className="font-bold text-slate-700">{data?.summary.blank_manual_rows || 0}</span>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-3 min-h-[170px] items-end">
                {trendPoints.length ? trendPoints.map((point, index) => (
                  <div key={`${point.date}-${index}`} className="flex flex-col items-center gap-2">
                    <div
                      className={`w-full rounded-t-lg ${index === trendPoints.length - 1 ? 'bg-cyan-800' : 'bg-cyan-300/70'}`}
                      style={{ height: `${point.height}%` }}
                    />
                    <div className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">{String(point.date || '').slice(5, 7) || '-'}</div>
                  </div>
                )) : (
                  <div className="col-span-5 text-center text-sm font-medium text-slate-400 py-10">No trend data for selected period.</div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-[18px] border border-slate-200">
            <table className="w-full min-w-[860px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] px-4 py-3">Description</th>
                  <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] px-4 py-3">Expense Category</th>
                  <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] px-4 py-3">Period Avg</th>
                  <th className="text-right text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] px-4 py-3">Total Amount</th>
                  <th className="text-right text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm font-medium text-gray-400">Loading expense sheet...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm font-medium text-red-500">Failed to load expense data.</td>
                  </tr>
                ) : displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm font-medium text-gray-400">No expenses found for this period.</td>
                  </tr>
                ) : (
                  displayedRows.map((row) => {
                    const isSelected = selectedRowKey === row.row_key;
                    const isEditing = Boolean(editingRowKeys[row.row_key]);
                    const draft = rowDrafts[row.row_key];
                    const showInline = appliedFilter.filter_mode === 'specific_month' && row.can_edit_amount && isEditing;
                    const periodAvg = appliedFilter.filter_mode === 'financial_year'
                      ? ((row.amount || 0) / 12)
                      : (row.amount || 0);
                    return (
                      <tr
                        key={row.row_key}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-cyan-50/60' : 'hover:bg-slate-50/70'}`}
                        onClick={() => setSelectedRowKey(row.row_key)}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-10 rounded-full ${row.is_system_generated ? 'bg-slate-400' : row.expense_category === 'Recurring Fixed' ? 'bg-emerald-400' : row.expense_category === 'Recurring Variable' ? 'bg-blue-400' : 'bg-amber-400'}`} />
                            <div>
                              <div className="text-sm font-bold text-gray-900">{row.expense_name}</div>
                              <div className="text-[11px] font-medium text-gray-500">
                                {row.is_system_generated ? 'Invoice derived' : row.row_type}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                            row.expense_category === 'Recurring Fixed' ? 'bg-emerald-100 text-emerald-700'
                              : row.expense_category === 'Recurring Variable' ? 'bg-blue-100 text-blue-700'
                                : row.expense_category === 'One-Time' ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                          }`}>
                            {row.expense_category}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {showInline ? (
                            <div className="space-y-2">
                              <input
                                type="date"
                                value={draft?.payment_date || selectedMonthIso}
                                onClick={(event) => event.stopPropagation()}
                                onChange={(event) =>
                                  setRowDrafts((current) => ({
                                    ...current,
                                    [row.row_key]: {
                                      row_key: row.row_key,
                                      amount: current[row.row_key]?.amount ?? (row.amount == null ? '' : String(row.amount)),
                                      payment_date: event.target.value,
                                    },
                                  }))
                                }
                                className="h-10 rounded-lg border border-gray-200 px-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500/20"
                              />
                              <div className="text-xs font-bold text-slate-400">Avg {money(periodAvg)}</div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm font-semibold text-slate-700">{money(periodAvg)}</div>
                              <div className="text-xs font-medium text-slate-400">{row.payment_date || '—'}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {showInline ? (
                            <div>
                              <input
                                type="text"
                                value={draft?.amount ?? ''}
                                onClick={(event) => event.stopPropagation()}
                                onChange={(event) =>
                                  setRowDrafts((current) => ({
                                    ...current,
                                    [row.row_key]: {
                                      row_key: row.row_key,
                                      amount: event.target.value,
                                      payment_date: current[row.row_key]?.payment_date || row.payment_date || selectedMonthIso,
                                    },
                                  }))
                                }
                                className="h-10 w-28 rounded-lg border border-gray-200 px-3 text-right text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500/20"
                              />
                              {rowErrors[row.row_key] && <div className="mt-1 text-[11px] font-medium text-red-500">{rowErrors[row.row_key]}</div>}
                            </div>
                          ) : (
                            <span className={`text-sm font-extrabold ${row.amount == null ? 'text-amber-600' : 'text-slate-900'}`}>
                              {row.amount == null ? 'Pending' : money(row.amount)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {(row.can_edit_amount || row.can_edit_rule) && appliedFilter.filter_mode === 'specific_month' ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (row.can_edit_rule) {
                                    setRuleEditRow(row);
                                    return;
                                  }
                                  toggleInlineEdit(row);
                                }}
                                className="w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-500 hover:text-primary-600 hover:border-primary-200 transition-colors flex items-center justify-center"
                                aria-label={`Edit ${row.expense_name}`}
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                              </button>
                            ) : null}
                            {row.can_delete && appliedFilter.filter_mode === 'specific_month' ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDelete(row);
                                }}
                                className="w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-500 hover:text-red-600 hover:border-red-200 transition-colors flex items-center justify-center"
                                aria-label={`Delete ${row.expense_name}`}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            ) : null}
                            {!row.can_delete && !row.can_edit_amount && !row.can_edit_rule ? (
                              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">Locked</span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-sm font-bold text-gray-600">Filtered Total</td>
                  <td className="px-4 py-3 text-right text-sm font-extrabold text-gray-900">{money(data?.totals.total_amount)}</td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
            <Button type="button" variant="outline" size="sm" onClick={() => { setRowDrafts({}); setEditingRowKeys({}); setRowErrors({}); }}>
              Discard Drafts
            </Button>
            <Button type="button" size="sm" onClick={handleSaveChanges} isLoading={saveChanges.isPending}>
              Save Changes
            </Button>
          </div>

          <div ref={breakdownRef} className="rounded-[24px] border border-gray-100 bg-gray-50/50 p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Contribution Breakdown</div>
                <div className="mt-1 text-lg font-extrabold text-gray-900">{breakdown.data?.expense_name || 'Select an expense row'}</div>
                <div className="mt-1 text-sm font-medium text-gray-500">
                  Clicking a row updates this lower waterfall view and scrolls here automatically.
                </div>
              </div>
              {breakdown.data && <div className="text-right"><div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Total</div><div className="text-xl font-extrabold text-gray-900">{money(breakdown.data.summary.total_amount)}</div></div>}
            </div>

            {breakdown.isLoading ? (
              <div className="py-8 text-center text-sm font-medium text-gray-400">Loading breakdown...</div>
            ) : breakdown.data ? (
              <div className="space-y-4">
                {breakdown.data.groups.map((group) => (
                  <div key={group.group_key} className="rounded-[22px] bg-white border border-gray-100 p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <div>
                        <div className="text-sm font-bold text-gray-900">{group.group_label}</div>
                        <div className="text-[11px] font-medium text-gray-500">{group.contributors.length} contributors</div>
                      </div>
                      <div className="text-sm font-extrabold text-gray-900">{money(group.total_amount)}</div>
                    </div>
                    <div className="space-y-2">
                      {group.contributors.length > 0 ? group.contributors.map((contributor, index) => (
                        <div key={`${group.group_key}-${index}`} className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_auto] gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 px-3 py-3">
                          <div>
                            <div className="text-sm font-bold text-gray-900">{contributor.label}</div>
                            <div className="text-[11px] font-medium text-gray-500">
                              {contributor.patient_name || contributor.source || 'Manual'}{contributor.procedure_name ? ` • ${contributor.procedure_name}` : ''}
                            </div>
                          </div>
                          <div className="text-[11px] font-medium text-gray-500">
                            {contributor.invoice_id ? `Invoice ${contributor.invoice_id}` : contributor.payment_date || contributor.date || 'No date'}
                          </div>
                          <div className="text-sm font-extrabold text-gray-900 text-left md:text-right">
                            {contributor.amount == null ? 'Pending' : money(contributor.amount)}
                          </div>
                        </div>
                      )) : (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-3 py-5 text-center text-sm font-medium text-gray-400">
                          No contribution rows available for this group yet.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm font-medium text-gray-400">Select a row to load the breakdown.</div>
            )}
          </div>
        </div>
      </Card>

      <ExpenseEntryModal
        isOpen={isCreateOpen}
        initialState={createModalInitialState}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateExpense}
        isSaving={createExpense.isPending}
        clinicId={clinicId}
      />

      <RuleEditModal
        isOpen={Boolean(ruleEditRow)}
        row={ruleEditRow}
        effectiveMonth={selectedMonthIso}
        onClose={() => setRuleEditRow(null)}
        onSubmit={handleUpdateRule}
        isSaving={updateRule.isPending}
      />

      <DeleteRecurringFixedModal
        row={deleteFixedRow}
        isOpen={Boolean(deleteFixedRow)}
        onClose={() => setDeleteFixedRow(null)}
        onStopForward={() => executeRecurringFixedDelete('forward')}
        onRemoveAll={() => executeRecurringFixedDelete('all')}
        isDeleting={deleteExpense.isPending}
      />
    </>
  );
};

export default ExpenseSheetSection;
