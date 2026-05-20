import { apiClient, API_ENDPOINTS } from '../client';
import {
  CreateExpenseRequest,
  DeleteExpenseRequest,
  ExpenseBreakdownResponse,
  ExpenseItemSuggestion,
  ExpenseSheetParams,
  ExpenseSheetResponse,
  SaveExpenseChange,
  UpdateExpenseRuleRequest,
} from '../types';

const buildParams = (params: ExpenseSheetParams & { row_key?: string; q?: string }) => {
  const queryParams = new URLSearchParams();
  queryParams.append('filter_mode', params.filter_mode);
  if (params.clinic) queryParams.append('clinic', params.clinic);
  if (params.month) queryParams.append('month', String(params.month));
  if (params.year) queryParams.append('year', String(params.year));
  if (params.fiscal_year) queryParams.append('fiscal_year', params.fiscal_year);
  if (params.row_key) queryParams.append('row_key', params.row_key);
  if (params.q) queryParams.append('q', params.q);
  return queryParams.toString();
};

export const expenseSheetService = {
  async getExpenseSheet(params: ExpenseSheetParams): Promise<ExpenseSheetResponse> {
    const response = await apiClient.get<ExpenseSheetResponse>(
      `${API_ENDPOINTS.EXPENSES.SHEET}?${buildParams(params)}`
    );
    if (!response.data) {
      throw new Error(response.message || 'Failed to fetch expense sheet');
    }
    return response.data;
  },

  async getExpenseBreakdown(params: ExpenseSheetParams & { row_key: string }): Promise<ExpenseBreakdownResponse> {
    const response = await apiClient.get<ExpenseBreakdownResponse>(
      `${API_ENDPOINTS.EXPENSES.BREAKDOWN}?${buildParams(params)}`
    );
    if (!response.data) {
      throw new Error(response.message || 'Failed to fetch expense breakdown');
    }
    return response.data;
  },

  async createExpense(payload: CreateExpenseRequest): Promise<{ expense_rule_id: string; monthly_value_id?: string | null }> {
    const response = await apiClient.post<{ expense_rule_id: string; monthly_value_id?: string | null }>(
      API_ENDPOINTS.EXPENSES.CREATE,
      payload
    );
    if (!response.data) {
      throw new Error(response.message || 'Failed to create expense');
    }
    return response.data;
  },

  async saveExpenseChanges(clinic: string, changes: SaveExpenseChange[]): Promise<{ saved_rows: string[] }> {
    const response = await apiClient.post<{ saved_rows: string[] }>(API_ENDPOINTS.EXPENSES.SAVE, {
      clinic,
      changes,
    });
    if (!response.data) {
      throw new Error(response.message || 'Failed to save expense changes');
    }
    return response.data;
  },

  async updateExpenseRule(payload: UpdateExpenseRuleRequest): Promise<{ expense_rule_id: string }> {
    const response = await apiClient.post<{ expense_rule_id: string }>(
      API_ENDPOINTS.EXPENSES.UPDATE_RULE,
      payload
    );
    if (!response.data) {
      throw new Error(response.message || 'Failed to update expense rule');
    }
    return response.data;
  },

  async deleteExpense(payload: DeleteExpenseRequest): Promise<{ expense_rule_id: string }> {
    const response = await apiClient.post<{ expense_rule_id: string }>(
      API_ENDPOINTS.EXPENSES.DELETE,
      payload
    );
    if (!response.data) {
      throw new Error(response.message || 'Failed to delete expense');
    }
    return response.data;
  },

  async searchExpenseItems(q: string, clinic?: string): Promise<ExpenseItemSuggestion[]> {
    const response = await apiClient.get<{ items: ExpenseItemSuggestion[] }>(
      `${API_ENDPOINTS.EXPENSES.SEARCH}?${buildParams({ filter_mode: 'specific_month', clinic, q })}`
    );
    return response.data?.items || [];
  },
};
