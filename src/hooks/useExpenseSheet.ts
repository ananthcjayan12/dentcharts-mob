import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { invalidateQueriesHelper, mutationKeys, queryKeys } from '../api/queryClient';
import { expenseSheetService } from '../api/services/expenseSheet';
import {
  CreateExpenseRequest,
  DeleteExpenseRequest,
  ExpenseSheetParams,
  SaveExpenseChange,
  UpdateExpenseRuleRequest,
} from '../api/types';

export const useExpenseSheet = (params: ExpenseSheetParams, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.dashboard.expenseSheet(params),
    queryFn: () => expenseSheetService.getExpenseSheet(params),
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

export const useExpenseBreakdown = (
  params: ExpenseSheetParams & { row_key?: string | null },
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: queryKeys.dashboard.expenseBreakdown(params),
    queryFn: () => expenseSheetService.getExpenseBreakdown(params as ExpenseSheetParams & { row_key: string }),
    enabled: enabled && Boolean(params.row_key),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

const invalidateExpenseQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  invalidateQueriesHelper.invalidateExpenseSheet();
  queryClient.invalidateQueries({ queryKey: ['dashboard', 'expenseSheet'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard', 'expenseBreakdown'] });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: mutationKeys.expenseSheet.create(),
    mutationFn: (payload: CreateExpenseRequest) => expenseSheetService.createExpense(payload),
    onSuccess: () => {
      invalidateExpenseQueries(queryClient);
      toast.success('Expense created');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create expense');
    },
  });
};

export const useSaveExpenseChanges = (clinicId?: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: mutationKeys.expenseSheet.save(),
    mutationFn: (changes: SaveExpenseChange[]) => expenseSheetService.saveExpenseChanges(clinicId || '', changes),
    onSuccess: () => {
      invalidateExpenseQueries(queryClient);
      toast.success('Expense changes saved');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save expense changes');
    },
  });
};

export const useUpdateExpenseRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: mutationKeys.expenseSheet.updateRule('rule'),
    mutationFn: (payload: UpdateExpenseRuleRequest) => expenseSheetService.updateExpenseRule(payload),
    onSuccess: () => {
      invalidateExpenseQueries(queryClient);
      toast.success('Expense rule updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update expense rule');
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: mutationKeys.expenseSheet.delete('rule'),
    mutationFn: (payload: DeleteExpenseRequest) => expenseSheetService.deleteExpense(payload),
    onSuccess: () => {
      invalidateExpenseQueries(queryClient);
      toast.success('Expense deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete expense');
    },
  });
};
