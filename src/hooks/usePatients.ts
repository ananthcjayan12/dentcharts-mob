import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { patientService } from '../api/services';
import {
  CreatePatientRequest,
  PatientResponse,
  UpdatePatientRequest,
  PatientSearchParams,
  PaginationParams,
  PatientFilters,
} from '../api/types';
import { queryKeys, mutationKeys, invalidateQueriesHelper } from '../api/queryClient';
import toast from 'react-hot-toast';

/**
 * Hook for creating a new patient
 */
export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutationKeys.patients.create(),
    mutationFn: (patientData: CreatePatientRequest) =>
      patientService.createPatient(patientData),
    onSuccess: () => {
      invalidateQueriesHelper.invalidatePatients();
      invalidateQueriesHelper.invalidateDashboard();
      toast.success('Patient created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create patient');
    },
  });
};

/**
 * Hook for getting a single patient by ID
 */
export const usePatient = (patientId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.patients.detail(patientId),
    queryFn: () => patientService.getPatient(patientId),
    enabled: enabled && !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for getting list of patients with pagination and filters
 */
export const usePatients = (
  pagination: PaginationParams = {},
  filters: PatientFilters = {}
) => {
  return useQuery({
    queryKey: queryKeys.patients.list({ pagination, filters }),
    queryFn: () => patientService.getPatients(pagination, filters),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

/**
 * Hook for searching patients
 */
export const useSearchPatients = (searchParams: PatientSearchParams, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.patients.search(searchParams.search_term),
    queryFn: () => patientService.searchPatients(searchParams),
    enabled: enabled && !!searchParams.search_term.trim(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook for patients with search functionality (unified)
 */
export const usePatientsWithSearch = (
  searchTerm?: string,
  pagination: PaginationParams = {},
  filters: PatientFilters = {}
) => {
  return useQuery({
    queryKey: queryKeys.patients.list({ searchTerm, pagination, filters }),
    queryFn: () => patientService.getPatientsWithSearch(searchTerm, pagination, filters),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

/**
 * Hook for updating patient information
 */
export const useUpdatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutationKeys.patients.update(''),
    mutationFn: (updateData: UpdatePatientRequest) =>
      patientService.updatePatient(updateData),
    onSuccess: (updatedPatient, variables) => {
      // Update specific patient query
      queryClient.setQueryData(
        queryKeys.patients.detail(variables.patient_id),
        updatedPatient
      );
      
      // Invalidate patient list queries
      invalidateQueriesHelper.invalidatePatients();
      toast.success('Patient updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update patient');
    },
  });
};

/**
 * Hook for deleting a patient
 */
export const useDeletePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutationKeys.patients.delete(''),
    mutationFn: (patientId: string) =>
      patientService.deletePatient(patientId),
    onSuccess: (result, patientId) => {
      // Invalidate all patient queries
      invalidateQueriesHelper.invalidatePatients();
      invalidateQueriesHelper.invalidateDashboard();
      toast.success('Patient deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete patient');
    },
  });
};

/**
 * Hook for patient actions (create, update, delete)
 */
export const usePatientActions = () => {
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const deletePatient = useDeletePatient();

  return {
    // Actions
    createPatient: createPatient.mutateAsync,
    updatePatient: updatePatient.mutateAsync,
    deletePatient: deletePatient.mutateAsync,

    // Loading states
    isCreating: createPatient.isPending,
    isUpdating: updatePatient.isPending,
    isDeleting: deletePatient.isPending,

    // Error states
    createError: createPatient.error,
    updateError: updatePatient.error,
    deleteError: deletePatient.error,
  };
};

/**
 * Hook for getting patients with infinite pagination (for mobile scroll)
 */
export const useInfinitePatients = (
  filters: PatientFilters = {},
  pageSize: number = 20
) => {
  return useQuery({
    queryKey: queryKeys.patients.list({ filters, infinite: true }),
    queryFn: async () => {
      const response = await patientService.getPatients(
        { limit_page_length: pageSize, limit_start: 0 },
        filters
      );
      return response;
    },
    staleTime: 3 * 60 * 1000,
  });
};

/**
 * Hook for patient statistics
 */
export const usePatientStats = () => {
  return useQuery({
    queryKey: ['patients', 'stats'],
    queryFn: async () => {
      // Get total patients count
      const response = await patientService.getPatients({ limit_page_length: 1 });
      return {
        totalPatients: response.total_count || 0,
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook that provides all patient-related functionality
 */
export const usePatientsComplete = (
  searchTerm?: string,
  pagination: PaginationParams = {},
  filters: PatientFilters = {}
) => {
  const patientsQuery = usePatientsWithSearch(searchTerm, pagination, filters);
  const actions = usePatientActions();
  const stats = usePatientStats();

  return {
    // Data
    patients: patientsQuery.data?.data || [],
    totalCount: patientsQuery.data?.total_count || 0,
    isLoading: patientsQuery.isLoading,
    error: patientsQuery.error,
    
    // Stats
    totalPatients: stats.data?.totalPatients || 0,
    
    // Actions
    ...actions,
    
    // Refetch
    refetch: patientsQuery.refetch,
  };
};

/**
 * Hook for patient dropdown/select options
 */
export const usePatientsForSelect = (searchTerm?: string) => {
  return useQuery({
    queryKey: queryKeys.patients.search(searchTerm || ''),
    queryFn: () => {
      if (searchTerm && searchTerm.trim()) {
        return patientService.searchPatients({
          search_term: searchTerm.trim(),
          limit: 10,
        });
      }
      // Return empty array if no search term
      return Promise.resolve([]);
    },
    enabled: !!searchTerm?.trim(),
    staleTime: 2 * 60 * 1000,
  });
};