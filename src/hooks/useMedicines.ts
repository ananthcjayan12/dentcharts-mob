import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { medicineService, CreateMedicineData, OverrideMedicineData, UpdateCustomMedicineData } from '../api/services/medicine';
import { useClinic } from '../contexts/ClinicContext';

export const useMedicines = (search?: string, category?: string) => {
    const { clinicId } = useClinic();
    const queryClient = useQueryClient();

    const medicinesQuery = useQuery({
        queryKey: ['medicines', clinicId, search, category],
        queryFn: () => {
            if (!clinicId) return [];
            return medicineService.getMedicines(clinicId, search, category);
        },
        enabled: !!clinicId,
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: 'always',
    });

    const categoriesQuery = useQuery({
        queryKey: ['medicineCategories'],
        queryFn: medicineService.getCategories,
        staleTime: 0,
    });

    const conditionsQuery = useQuery({
        queryKey: ['medicineConditions'],
        queryFn: medicineService.getConditions,
        staleTime: 0,
    });

    const createMutation = useMutation({
        mutationFn: (data: Omit<CreateMedicineData, 'clinic'>) => {
            if (!clinicId) throw new Error('No active clinic');
            return medicineService.createCustomMedicine({ ...data, clinic: clinicId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medicines', clinicId] });
            toast.success('Medicine created successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create medicine');
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: Omit<UpdateCustomMedicineData, 'clinic'>) => {
            if (!clinicId) throw new Error('No active clinic');
            return medicineService.updateCustomMedicine({ ...data, clinic: clinicId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medicines', clinicId] });
            toast.success('Medicine updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update medicine');
        },
    });

    const overrideMutation = useMutation({
        mutationFn: (data: Omit<OverrideMedicineData, 'clinic'>) => {
            if (!clinicId) throw new Error('No active clinic');
            return medicineService.overrideTemplateMedicine({ ...data, clinic: clinicId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medicines', clinicId] });
            toast.success('Medicine template updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update template medicine');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (medicineName: string) => {
            if (!clinicId) throw new Error('No active clinic');
            return medicineService.deleteCustomMedicine(clinicId, medicineName);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medicines', clinicId] });
            toast.success('Medicine deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete medicine');
        },
    });

    return {
        medicines: medicinesQuery.data || [],
        isLoading: medicinesQuery.isLoading,
        error: medicinesQuery.error,
        categories: categoriesQuery.data || [],
        conditions: conditionsQuery.data || [],
        createMedicine: createMutation.mutateAsync,
        isCreating: createMutation.isPending,
        updateMedicine: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        overrideMedicine: overrideMutation.mutateAsync,
        isOverriding: overrideMutation.isPending,
        deleteMedicine: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,
    };
};
