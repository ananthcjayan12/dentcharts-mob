import { expenseSheetService } from './expenseSheet';
import { apiClient } from '../client';

jest.mock('../client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
  API_ENDPOINTS: {
    EXPENSES: {
      SHEET: '/expense-sheet',
      BREAKDOWN: '/expense-breakdown',
      CREATE: '/expense-create',
      SAVE: '/expense-save',
      UPDATE_RULE: '/expense-update-rule',
      DELETE: '/expense-delete',
      SEARCH: '/expense-search',
    },
  },
}));

describe('expenseSheetService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('serializes month filters for sheet requests', async () => {
    apiClient.get.mockResolvedValue({
      message: 'Success',
      data: { rows: [], summary: {}, totals: {}, filters: { available_fiscal_years: [] } },
    });

    await expenseSheetService.getExpenseSheet({
      filter_mode: 'specific_month',
      clinic: 'Test Clinic',
      month: 5,
      year: 2026,
    });

    expect(apiClient.get).toHaveBeenCalledWith(
      '/expense-sheet?filter_mode=specific_month&clinic=Test+Clinic&month=5&year=2026'
    );
  });

  it('serializes fy breakdown requests', async () => {
    apiClient.get.mockResolvedValue({
      message: 'Success',
      data: { groups: [], summary: { total_amount: 0, month_count: 0 } },
    });

    await expenseSheetService.getExpenseBreakdown({
      filter_mode: 'financial_year',
      clinic: 'Test Clinic',
      fiscal_year: '2026-2027',
      row_key: 'system:vendor_payment:2026-2027',
    });

    expect(apiClient.get).toHaveBeenCalledWith(
      '/expense-breakdown?filter_mode=financial_year&clinic=Test+Clinic&fiscal_year=2026-2027&row_key=system%3Avendor_payment%3A2026-2027'
    );
  });
});
