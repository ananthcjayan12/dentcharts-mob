import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { proceduresService, CreateProcedureData, OverrideProcedureData } from '../api/services/procedures';
import { useClinic } from '../contexts/ClinicContext';
import toast from 'react-hot-toast';

export const useProcedures = (search?: string, category?: string) => {
  const { clinicId } = useClinic();
  const queryClient = useQueryClient();

  // Fetch procedures
  const query = useQuery({
    queryKey: ['procedures', clinicId, search, category],
    queryFn: () => {
      if (!clinicId) {
        return [];
      }
      return proceduresService.getProcedures(clinicId, search, category);
    },
    enabled: !!clinicId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch categories
  const categoriesQuery = useQuery({
    queryKey: ['procedureCategories'],
    queryFn: proceduresService.getCategories,
    staleTime: 10 * 60 * 1000,
  });

  // Create Custom Procedure
  const createMutation = useMutation({
    mutationFn: (data: Omit<CreateProcedureData, 'clinic'>) => {
      if (!clinicId) throw new Error('No active clinic');
      return proceduresService.createCustomProcedure({ ...data, clinic: clinicId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures', clinicId] });
      toast.success('Procedure created successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create procedure');
    }
  });

  // Override Procedure
  const overrideMutation = useMutation({
    mutationFn: (data: Omit<OverrideProcedureData, 'clinic'>) => {
      if (!clinicId) throw new Error('No active clinic');
      return proceduresService.overrideProcedurePricing({ ...data, clinic: clinicId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures', clinicId] });
      toast.success('Procedure updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update procedure');
    }
  });

  // Delete Custom Procedure
  const deleteMutation = useMutation({
    mutationFn: (procedureName: string) => {
      if (!clinicId) throw new Error('No active clinic');
      return proceduresService.deleteCustomProcedure({ clinic: clinicId, procedure_name: procedureName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures', clinicId] });
      toast.success('Procedure deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete procedure');
    }
  });

  // Update Custom Procedure
  const updateMutation = useMutation({
    mutationFn: (data: Omit<CreateProcedureData, 'clinic'> & { original_name?: string }) => {
      if (!clinicId) throw new Error('No active clinic');
      return proceduresService.updateCustomProcedure({ ...data, clinic: clinicId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures', clinicId] });
      toast.success('Procedure updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update procedure');
    }
  });

  return {
    procedures: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    categories: categoriesQuery.data || [],
    createProcedure: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    overrideProcedure: overrideMutation.mutateAsync,
    isOverriding: overrideMutation.isPending,
    deleteProcedure: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    updateProcedure: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
};
