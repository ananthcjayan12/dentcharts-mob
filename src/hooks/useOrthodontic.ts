import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { queryKeys, mutationKeys, invalidateQueriesHelper } from '../api/queryClient';
import {
  AddOrthodonticLedgerEntryRequest,
  CreateOrthodonticCaseRequest,
  CreateOrthodonticPayoutRequest,
  orthodonticService,
} from '../api/services/orthodontic';

export const usePatientOrthodonticSummary = (patientId: string, clinicId?: string | null) => {
  return useQuery({
    queryKey: queryKeys.orthodontic.patientSummary(patientId, clinicId),
    queryFn: () => orthodonticService.getPatientSummary(patientId, clinicId),
    enabled: !!patientId,
    staleTime: 60 * 1000,
  });
};

export const useOrthodonticLedger = (caseId?: string | null) => {
  return useQuery({
    queryKey: queryKeys.orthodontic.ledger(caseId || ''),
    queryFn: () => orthodonticService.getLedger(caseId || ''),
    enabled: !!caseId,
    staleTime: 60 * 1000,
  });
};

export const useOrthodonticPayouts = (caseId?: string | null) => {
  return useQuery({
    queryKey: queryKeys.orthodontic.payouts(caseId || ''),
    queryFn: () => orthodonticService.listPayouts(caseId || ''),
    enabled: !!caseId,
    staleTime: 60 * 1000,
  });
};

export const useOrthodonticDashboard = (
  params?: { clinic?: string | null; from_date?: string; to_date?: string },
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: queryKeys.dashboard.orthodontic(params),
    queryFn: () => orthodonticService.getDashboard(params),
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

export const useOrthodonticConsultantReport = (
  params?: { clinic?: string | null; consultant_id?: string },
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: queryKeys.dashboard.orthodonticConsultants(params),
    queryFn: () => orthodonticService.getConsultantPayoutReport(params),
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

const invalidateOrthodonticBundle = (queryClient: ReturnType<typeof useQueryClient>, patientId: string, caseId?: string | null, clinicId?: string | null) => {
  invalidateQueriesHelper.invalidateOrthodontic();
  invalidateQueriesHelper.invalidatePayments();
  queryClient.invalidateQueries({
    queryKey: queryKeys.payments.summary(patientId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.orthodontic.patientSummary(patientId, clinicId),
  });
  if (caseId) {
    queryClient.invalidateQueries({
      queryKey: queryKeys.orthodontic.ledger(caseId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.orthodontic.payouts(caseId),
    });
  }
};

export const useCreateOrthodonticCase = (patientId: string, clinicId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutationKeys.orthodontic.createCase(),
    mutationFn: (payload: CreateOrthodonticCaseRequest) => orthodonticService.createCase(payload),
    onSuccess: (result) => {
      invalidateOrthodonticBundle(queryClient, patientId, result.case.case_id, clinicId);
      toast.success('Orthodontic case saved');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save orthodontic case');
    },
  });
};

export const useUpdateOrthodonticCase = (patientId: string, clinicId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutationKeys.orthodontic.updateCase(patientId),
    mutationFn: ({ caseId, payload }: { caseId: string; payload: Partial<CreateOrthodonticCaseRequest> }) =>
      orthodonticService.updateCase(caseId, payload),
    onSuccess: (result, variables) => {
      invalidateOrthodonticBundle(queryClient, patientId, variables.caseId, clinicId);
      toast.success('Orthodontic case updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update orthodontic case');
    },
  });
};

export const useAddOrthodonticLedgerEntry = (patientId: string, clinicId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutationKeys.orthodontic.addLedgerEntry(patientId),
    mutationFn: (payload: AddOrthodonticLedgerEntryRequest) => orthodonticService.addLedgerEntry(payload),
    onSuccess: (result) => {
      invalidateOrthodonticBundle(queryClient, patientId, result.case.case_id, clinicId);
      toast.success('Orthodontic visit saved');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save orthodontic visit');
    },
  });
};

export const useCreateOrthodonticPayout = (patientId: string, clinicId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutationKeys.orthodontic.createPayout(patientId),
    mutationFn: (payload: CreateOrthodonticPayoutRequest) => orthodonticService.createPayout(payload),
    onSuccess: (result) => {
      invalidateOrthodonticBundle(queryClient, patientId, result.case.case_id, clinicId);
      toast.success('Commission payout recorded');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to record payout');
    },
  });
};

export const useReverseOrthodonticPayout = (patientId: string, caseId?: string | null, clinicId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutationKeys.orthodontic.reversePayout(caseId || ''),
    mutationFn: ({ payoutId, notes }: { payoutId: string; notes?: string }) =>
      orthodonticService.reversePayout(payoutId, notes),
    onSuccess: (result) => {
      invalidateOrthodonticBundle(queryClient, patientId, result.case.case_id, clinicId);
      toast.success('Payout reversed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reverse payout');
    },
  });
};
