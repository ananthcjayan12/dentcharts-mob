import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conditionsService, CreateConditionData, OverrideConditionData } from '../api/services/conditions';
import { useClinic } from '../contexts/ClinicContext';
import toast from 'react-hot-toast';

export const useConditions = (search?: string, category?: string) => {
    const { clinicId } = useClinic();
    const queryClient = useQueryClient();

    // Fetch conditions
    const query = useQuery({
        queryKey: ['conditions', clinicId, search, category],
        queryFn: () => {
            if (!clinicId) return [];
            return conditionsService.getConditions(clinicId, search, category);
        },
        enabled: !!clinicId,
        staleTime: 0, // Always fetch fresh data
        gcTime: 0, // Don't cache results
        refetchOnMount: 'always', // Always refetch when component mounts
    });

    // Fetch categories
    const categoriesQuery = useQuery({
        queryKey: ['conditionCategories'],
        queryFn: conditionsService.getCategories,
        staleTime: 0,
    });

    // Fetch types
    const typesQuery = useQuery({
        queryKey: ['conditionTypes'],
        queryFn: conditionsService.getTypes,
        staleTime: 0,
    });

    // Create Custom Condition
    const createMutation = useMutation({
        mutationFn: (data: Omit<CreateConditionData, 'clinic'>) => {
            if (!clinicId) throw new Error('No active clinic');
            return conditionsService.createCustomCondition({ ...data, clinic: clinicId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conditions', clinicId] });
            toast.success('Condition created successfully');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to create condition');
        }
    });

    // Override Template Condition (Enable/Disable)
    const overrideMutation = useMutation({
        mutationFn: (data: Omit<OverrideConditionData, 'clinic'>) => {
            if (!clinicId) throw new Error('No active clinic');
            return conditionsService.overrideTemplateCondition({ ...data, clinic: clinicId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conditions', clinicId] });
            toast.success('Condition updated successfully');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to update condition');
        }
    });

    // Delete Custom Condition
    const deleteMutation = useMutation({
        mutationFn: (conditionName: string) => {
            if (!clinicId) throw new Error('No active clinic');
            return conditionsService.deleteCustomCondition({ clinic: clinicId, condition_name: conditionName });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conditions', clinicId] });
            toast.success('Condition deleted successfully');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to delete condition');
        }
    });

    return {
        conditions: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        categories: categoriesQuery.data || [],
        types: typesQuery.data || [],
        createCondition: createMutation.mutateAsync,
        isCreating: createMutation.isPending,
        overrideCondition: overrideMutation.mutateAsync,
        isOverriding: overrideMutation.isPending,
        deleteCondition: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,
    };
};
