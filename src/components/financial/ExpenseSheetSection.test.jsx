import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

import ExpenseSheetSection from './ExpenseSheetSection';

jest.mock('../common/Portal', () => ({
  __esModule: true,
  default: ({ children }) => <>{children}</>,
}));

jest.mock('../../api/services/expenseSheet', () => ({
  expenseSheetService: {
    searchExpenseItems: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../hooks/useExpenseSheet', () => ({
  useExpenseSheet: jest.fn(),
  useExpenseBreakdown: jest.fn(),
  useCreateExpense: jest.fn(),
  useSaveExpenseChanges: jest.fn(),
  useUpdateExpenseRule: jest.fn(),
  useDeleteExpense: jest.fn(),
}));
jest.mock('../../hooks/useDashboard', () => ({
  useDashboardStats: jest.fn(),
}));

const expenseHooks = jest.requireMock('../../hooks/useExpenseSheet');
const dashboardHooks = jest.requireMock('../../hooks/useDashboard');

const mockSave = { mutateAsync: jest.fn(), isPending: false };
const mockCreate = { mutateAsync: jest.fn(), isPending: false };
const mockUpdateRule = { mutateAsync: jest.fn(), isPending: false };
const mockDelete = { mutateAsync: jest.fn(), isPending: false };

describe('ExpenseSheetSection', () => {
  let container;
  let root;
  let scrollIntoViewSpy;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    jest.clearAllMocks();
    scrollIntoViewSpy = jest.fn();
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoViewSpy,
    });

    expenseHooks.useExpenseSheet.mockReturnValue({
      data: {
        summary: {
          total_amount: 1360,
          manual_amount: 1200,
          system_amount: 160,
          row_count: 2,
          blank_manual_rows: 0,
          editable_row_count: 1,
          read_only_row_count: 1,
        },
        totals: {
          total_amount: 1360,
          manual_amount: 1200,
          system_amount: 160,
        },
        rows: [
          {
            row_key: 'manual:EXP-1:2026-05',
            row_type: 'manual',
            expense_rule_id: 'EXP-1',
            expense_name: 'Electricity',
            expense_category: 'Recurring Variable',
            is_system_generated: false,
            amount: 1200,
            payment_date: '2026-05-01',
            can_edit_amount: true,
            can_edit_rule: false,
            can_delete: true,
            is_read_only: false,
          },
          {
            row_key: 'system:vendor_payment:2026-05',
            row_type: 'system',
            expense_name: 'Vendor Payment',
            expense_category: 'System Generated',
            is_system_generated: true,
            amount: 160,
            payment_date: null,
            can_edit_amount: false,
            can_edit_rule: false,
            can_delete: false,
            is_read_only: true,
          },
        ],
        filters: {
          filter_mode: 'specific_month',
          selected_month: '2026-05-01',
          selected_year: 2026,
          selected_month_number: 5,
          selected_fiscal_year: '2026-2027',
          available_fiscal_years: [
            { name: '2026-2027', label: '2026-2027', year_start_date: '2026-04-01', year_end_date: '2027-03-31' },
          ],
        },
        default_selected_row_key: 'manual:EXP-1:2026-05',
      },
      isLoading: false,
      error: null,
    });
    expenseHooks.useExpenseBreakdown.mockReturnValue({
      data: {
        row_key: 'manual:EXP-1:2026-05',
        expense_name: 'Electricity',
        expense_category: 'Recurring Variable',
        breakdown_mode: 'specific_month',
        summary: { total_amount: 1200, month_count: 1 },
        groups: [
          {
            group_key: '2026-05',
            group_label: 'May 2026',
            total_amount: 1200,
            contributors: [{ label: 'Manual Entry', amount: 1200, payment_date: '2026-05-01', source: 'Manual' }],
          },
        ],
      },
      isLoading: false,
    });
    expenseHooks.useCreateExpense.mockReturnValue(mockCreate);
    expenseHooks.useSaveExpenseChanges.mockReturnValue(mockSave);
    expenseHooks.useUpdateExpenseRule.mockReturnValue(mockUpdateRule);
    expenseHooks.useDeleteExpense.mockReturnValue(mockDelete);
    dashboardHooks.useDashboardStats.mockReturnValue({
      data: {
        summary: {
          period_invoiced: 5000,
        },
        revenue_trend: [
          { date: '2026-05-01', amount: 800 },
          { date: '2026-05-05', amount: 950 },
          { date: '2026-05-10', amount: 1000 },
          { date: '2026-05-15', amount: 1100 },
          { date: '2026-05-20', amount: 1150 },
        ],
      },
    });

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('shows editable icons only for editable rows and saves inline edits', async () => {
    await act(async () => {
      root.render(<ExpenseSheetSection clinicId="Test Clinic" />);
    });

    expect(container.textContent).toContain('Expense Management');
    expect(scrollIntoViewSpy).toHaveBeenCalled();

    const editButton = container.querySelector('button[aria-label="Edit Electricity"]');
    expect(editButton).toBeTruthy();
    expect(container.querySelector('button[aria-label="Delete Vendor Payment"]')).toBeNull();

    await act(async () => {
      editButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const amountInput = Array.from(container.querySelectorAll('input')).find((input) => input.value === '1200');
    expect(amountInput).toBeTruthy();

    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      valueSetter?.call(amountInput, '1450');
      amountInput.dispatchEvent(new Event('input', { bubbles: true }));
      amountInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const saveButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Save Changes'));
    await act(async () => {
      saveButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mockSave.mutateAsync).toHaveBeenCalledWith([
      {
        row_key: 'manual:EXP-1:2026-05',
        amount: 1450,
        payment_date: '2026-05-01',
      },
    ]);
  });
});
