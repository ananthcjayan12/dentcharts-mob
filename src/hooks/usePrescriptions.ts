import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { prescriptionService } from '../api/services';
import {
  CreatePrescriptionRequest,
  PrescriptionResponse,
  UpdatePrescriptionRequest,
  SharePrescriptionRequest,
  PatientHistoryParams,
  PaginationParams,
  PrescriptionFilters,
} from '../api/types';
import { queryKeys, mutationKeys, invalidateQueriesHelper } from '../api/queryClient';
import toast from 'react-hot-toast';

/**
 * Hook for creating a new prescription
 */
export const useCreatePrescription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutationKeys.prescriptions.create(),
    mutationFn: (prescriptionData: CreatePrescriptionRequest) =>
      prescriptionService.createPrescription(prescriptionData),
    onSuccess: (result, variables) => {
      invalidateQueriesHelper.invalidatePrescriptions();
      
      // Invalidate patient-specific queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.prescriptions.patient(variables.patient_id),
      });
      
      toast.success('Prescription created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create prescription');
    },
  });
};

/**
 * Hook for getting a single prescription by record ID
 */
export const usePrescription = (recordId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.prescriptions.detail(recordId),
    queryFn: () => prescriptionService.getPrescription(recordId),
    enabled: enabled && !!recordId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for getting list of prescriptions with pagination and filters
 */
export const usePrescriptions = (
  pagination: PaginationParams = {},
  filters: PrescriptionFilters = {}
) => {
  return useQuery({
    queryKey: queryKeys.prescriptions.list({ pagination, filters }),
    queryFn: () => prescriptionService.getPrescriptions(pagination, filters),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

/**
 * Hook for getting patient medical history
 */
export const usePatientHistory = (params: PatientHistoryParams) => {
  return useQuery({
    queryKey: queryKeys.prescriptions.patientHistory(params.patient_id, params),
    queryFn: () => prescriptionService.getPatientHistory(params),
    enabled: !!params.patient_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for getting recent prescriptions for a patient
 */
export const useRecentPrescriptions = (patientId: string, limit: number = 5) => {
  return useQuery({
    queryKey: queryKeys.prescriptions.patient(patientId),
    queryFn: () => prescriptionService.getRecentPrescriptions(patientId, limit),
    enabled: !!patientId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

/**
 * Hook for getting all prescriptions for a specific patient
 */
export const usePatientPrescriptions = (patientId: string) => {
  return useQuery({
    queryKey: queryKeys.prescriptions.patient(patientId),
    queryFn: () => prescriptionService.getPatientPrescriptions(patientId),
    enabled: !!patientId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

/**
 * Hook for updating a prescription
 */
export const useUpdatePrescription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutationKeys.prescriptions.update(''),
    mutationFn: (updateData: UpdatePrescriptionRequest) =>
      prescriptionService.updatePrescription(updateData),
    onSuccess: (updatedPrescription, variables) => {
      // Update specific prescription query
      queryClient.setQueryData(
        queryKeys.prescriptions.detail(variables.record_id),
        updatedPrescription
      );
      
      invalidateQueriesHelper.invalidatePrescriptions();
      toast.success('Prescription updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update prescription');
    },
  });
};

/**
 * Hook for sharing a prescription
 */
export const useSharePrescription = () => {
  return useMutation({
    mutationKey: mutationKeys.prescriptions.share(''),
    mutationFn: (shareData: SharePrescriptionRequest) =>
      prescriptionService.sharePrescription(shareData),
    onSuccess: () => {
      toast.success('Prescription shared successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to share prescription');
    },
  });
};

/**
 * Hook for prescription actions (create, update, share)
 */
export const usePrescriptionActions = () => {
  const createPrescription = useCreatePrescription();
  const updatePrescription = useUpdatePrescription();
  const sharePrescription = useSharePrescription();

  return {
    // Actions
    createPrescription: createPrescription.mutateAsync,
    updatePrescription: updatePrescription.mutateAsync,
    sharePrescription: sharePrescription.mutateAsync,

    // Loading states
    isCreating: createPrescription.isPending,
    isUpdating: updatePrescription.isPending,
    isSharing: sharePrescription.isPending,

    // Error states
    createError: createPrescription.error,
    updateError: updatePrescription.error,
    shareError: sharePrescription.error,
  };
};

/**
 * Hook for prescription validation
 */
export const usePrescriptionValidation = () => {
  return {
    validatePrescription: (data: CreatePrescriptionRequest) => {
      return prescriptionService.validatePrescriptionData(data);
    },
  };
};

/**
 * Hook for prescription statistics
 */
export const usePrescriptionStats = () => {
  return useQuery({
    queryKey: ['prescriptions', 'stats'],
    queryFn: async () => {
      // Get recent prescriptions to calculate stats
      const response = await prescriptionService.getPrescriptions(
        { limit_page_length: 100 },
        {}
      );
      
      const prescriptions = response.data || [];
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      const recentPrescriptions = prescriptions.filter(p => {
        const prescriptionDate = new Date(p.posting_date);
        return prescriptionDate >= thirtyDaysAgo;
      });
      
      return {
        totalPrescriptions: prescriptions.length,
        recentPrescriptions: recentPrescriptions.length,
        activePrescriptions: prescriptions.filter(p => 
          p.status?.toLowerCase() === 'active' || p.status?.toLowerCase() === 'in progress'
        ).length,
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook that provides all prescription-related functionality for patient view
 */
export const usePatientPrescriptionsComplete = (patientId: string) => {
  const prescriptions = usePatientPrescriptions(patientId);
  const recentPrescriptions = useRecentPrescriptions(patientId);
  const history = usePatientHistory({ patient_id: patientId, limit: 10 });
  const actions = usePrescriptionActions();

  return {
    // Data
    allPrescriptions: prescriptions.data || [],
    recentPrescriptions: recentPrescriptions.data || [],
    medicalHistory: history.data || [],
    
    // Loading states
    isLoading: prescriptions.isLoading || recentPrescriptions.isLoading,
    isHistoryLoading: history.isLoading,
    
    // Error states
    error: prescriptions.error || recentPrescriptions.error,
    historyError: history.error,
    
    // Actions
    ...actions,
    
    // Refetch
    refetch: () => {
      prescriptions.refetch();
      recentPrescriptions.refetch();
      history.refetch();
    },
  };
};

/**
 * Hook for prescription dashboard data
 */
export const usePrescriptionsDashboard = () => {
  const recentPrescriptions = usePrescriptions(
    { limit_page_length: 10 },
    {}
  );
  const stats = usePrescriptionStats();

  return {
    // Data
    recentPrescriptions: recentPrescriptions.data?.data || [],
    
    // Stats
    totalPrescriptions: stats.data?.totalPrescriptions || 0,
    recentCount: stats.data?.recentPrescriptions || 0,
    activeCount: stats.data?.activePrescriptions || 0,
    
    // Loading
    isLoading: recentPrescriptions.isLoading || stats.isLoading,
    
    // Error
    error: recentPrescriptions.error || stats.error,
    
    // Refetch
    refetch: () => {
      recentPrescriptions.refetch();
      stats.refetch();
    },
  };
};

/**
 * Hook for prescription form helpers
 */
export const usePrescriptionHelpers = () => {
  return {
    formatDate: prescriptionService.formatPrescriptionDate,
    getMedicationSummary: prescriptionService.getMedicationSummary,
    getInvestigationSummary: prescriptionService.getInvestigationSummary,
    isRecent: prescriptionService.isPrescriptionRecent,
    getStatusColor: prescriptionService.getPrescriptionStatusColor,
    validateData: prescriptionService.validatePrescriptionData,
  };
};