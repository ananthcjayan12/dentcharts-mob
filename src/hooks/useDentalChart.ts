import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dentalChartService, ConditionInput, ProcedureInput } from '../api/services/dentalChart';
import { ToothData } from '../components/common/DentalChart';
import toast from 'react-hot-toast';
import { queryKeys } from '../api/queryClient';

// Fetch dental chart for a patient
export const useDentalChart = (patientId: string | undefined, options = {}) => {
  return useQuery({
    queryKey: queryKeys.dentalChart.byPatient(patientId || ''),
    queryFn: () => dentalChartService.getDentalChart(patientId!),
    enabled: !!patientId,
    ...options,
  });
};

// Save entire dental chart
export const useSaveDentalChart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      patient_id: string;
      chart_type: 'adult' | 'pediatric' | 'mixed';
      teeth_data: Record<number, ToothData>;
    }) => dentalChartService.saveDentalChart(data),
    onSuccess: (data, variables) => {
      toast.success('Dental chart saved successfully');
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dentalChart.byPatient(variables.patient_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dentalChart.summary(variables.patient_id) 
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save dental chart');
    },
  });
};

// Add condition to tooth/teeth
export const useAddCondition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      patient_id: string;
      tooth_numbers: number[];
      condition: ConditionInput;
    }) => dentalChartService.addCondition(data),
    onSuccess: (data, variables) => {
      toast.success(
        `Condition added to ${variables.tooth_numbers.length} tooth/teeth`
      );
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dentalChart.byPatient(variables.patient_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dentalChart.summary(variables.patient_id) 
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add condition');
    },
  });
};

// Update condition
export const useUpdateCondition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      patient_id: string;
      condition_name: string;
      updates: Partial<ConditionInput>;
    }) => dentalChartService.updateCondition(data),
    onSuccess: (data, variables) => {
      toast.success('Condition updated successfully');
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dentalChart.byPatient(variables.patient_id) 
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update condition');
    },
  });
};

// Remove condition
export const useRemoveCondition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      patient_id: string;
      condition_name: string;
      reason?: string;
    }) => dentalChartService.removeCondition(data),
    onSuccess: (data, variables) => {
      toast.success('Condition removed successfully');
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dentalChart.byPatient(variables.patient_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dentalChart.summary(variables.patient_id) 
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove condition');
    },
  });
};

// Get condition types
export const useConditionTypes = () => {
  return useQuery({
    queryKey: queryKeys.dentalChart.conditionTypes,
    queryFn: () => dentalChartService.getConditionTypes(),
    staleTime: Infinity, // This data rarely changes
  });
};

// Add procedure to tooth/teeth
export const useAddProcedure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      patient_id: string;
      tooth_numbers: number[];
      procedure: ProcedureInput;
    }) => dentalChartService.addProcedure(data),
    onSuccess: (data, variables) => {
      toast.success(
        `Procedure added to ${variables.tooth_numbers.length} tooth/teeth`
      );
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dentalChart.byPatient(variables.patient_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dentalChart.summary(variables.patient_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dentalChart.progress(variables.patient_id) 
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add procedure');
    },
  });
};

// Update procedure (handles both details and status changes)
export const useUpdateProcedure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      patient_id: string;
      procedure_name: string;
      updates: Partial<ProcedureInput>;
    }) => dentalChartService.updateProcedure(data),
    onSuccess: (data, variables) => {
      toast.success('Procedure updated successfully');
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dentalChart.byPatient(variables.patient_id) 
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update procedure');
    },
  });
};

// Remove procedure
export const useRemoveProcedure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      patient_id: string;
      procedure_name: string;
      reason?: string;
    }) => dentalChartService.removeProcedure(data),
    onSuccess: (data, variables) => {
      toast.success('Procedure removed successfully');
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dentalChart.byPatient(variables.patient_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dentalChart.summary(variables.patient_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dentalChart.progress(variables.patient_id) 
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove procedure');
    },
  });
};

// Get procedure timeline
export const useProcedureTimeline = (
  patientId: string | undefined,
  procedureName: string | undefined
) => {
  return useQuery({
    queryKey: ['dentalChart', 'procedureTimeline', patientId, procedureName],
    queryFn: () => 
      dentalChartService.getProcedureTimeline(patientId!, procedureName!),
    enabled: !!patientId && !!procedureName,
  });
};

// Get condition history
export const useConditionHistory = (
  patientId: string | undefined,
  conditionName: string | undefined
) => {
  return useQuery({
    queryKey: ['dentalChart', 'conditionHistory', patientId, conditionName],
    queryFn: () => 
      dentalChartService.getConditionHistory({
        patient_id: patientId!,
        condition_name: conditionName!,
      }),
    enabled: !!patientId && !!conditionName,
  });
};

// Get procedure types
export const useProcedureTypes = () => {
  return useQuery({
    queryKey: queryKeys.dentalChart.procedureTypes,
    queryFn: () => dentalChartService.getProcedureTypes(),
    staleTime: Infinity, // This data rarely changes
  });
};

// Get dental chart summary
export const useDentalChartSummary = (patientId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.dentalChart.summary(patientId || ''),
    queryFn: () => dentalChartService.getChartSummary(patientId!),
    enabled: !!patientId,
  });
};

// Get treatment progress
export const useTreatmentProgress = (patientId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.dentalChart.progress(patientId || ''),
    queryFn: () => dentalChartService.getTreatmentProgress(patientId!),
    enabled: !!patientId,
  });
};

// Get chart types
export const useChartTypes = () => {
  return useQuery({
    queryKey: queryKeys.dentalChart.chartTypes,
    queryFn: () => dentalChartService.getChartTypes(),
    staleTime: Infinity,
  });
};

// Get tooth status options
export const useToothStatusOptions = () => {
  return useQuery({
    queryKey: queryKeys.dentalChart.statusOptions,
    queryFn: () => dentalChartService.getToothStatusOptions(),
    staleTime: Infinity,
  });
};

// Export dental chart
export const useExportDentalChart = () => {
  return useMutation({
    mutationFn: ({ 
      patientId, 
      format = 'json' 
    }: { 
      patientId: string; 
      format?: 'json' | 'pdf' 
    }) => dentalChartService.exportChart(patientId, format),
    onSuccess: (data, variables) => {
      const format = variables.format || 'json';
      toast.success(`Dental chart exported as ${format.toUpperCase()}`);
      // Handle download if needed
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dental-chart-${variables.patientId}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to export dental chart');
    },
  });
};

// Combined actions hook for convenience
export const useDentalChartActions = (patientId: string) => {
  const addCondition = useAddCondition();
  const updateCondition = useUpdateCondition();
  const removeCondition = useRemoveCondition();
  const addProcedure = useAddProcedure();
  const updateProcedure = useUpdateProcedure();
  const removeProcedure = useRemoveProcedure();
  const saveDentalChart = useSaveDentalChart();
  const exportChart = useExportDentalChart();

  return {
    // Condition actions
    addCondition: (tooth_numbers: number[], condition: ConditionInput) =>
      addCondition.mutate({ patient_id: patientId, tooth_numbers, condition }),
    updateCondition: (
      condition_name: string,
      updates: Partial<ConditionInput>
    ) =>
      updateCondition.mutate({ patient_id: patientId, condition_name, updates }),
    removeCondition: (condition_name: string, reason?: string) =>
      removeCondition.mutate({ patient_id: patientId, condition_name, reason }),

    // Procedure actions
    addProcedure: (tooth_numbers: number[], procedure: ProcedureInput) =>
      addProcedure.mutate({ patient_id: patientId, tooth_numbers, procedure }),
    updateProcedure: (
      procedure_name: string,
      updates: Partial<ProcedureInput>
    ) =>
      updateProcedure.mutate({ patient_id: patientId, procedure_name, updates }),
    removeProcedure: (procedure_name: string, reason?: string) =>
      removeProcedure.mutate({ patient_id: patientId, procedure_name, reason }),

    // Chart actions
    saveDentalChart: (
      chart_type: 'adult' | 'pediatric' | 'mixed',
      teeth_data: Record<number, ToothData>
    ) =>
      saveDentalChart.mutate({ patient_id: patientId, chart_type, teeth_data }),
    exportChart: (format: 'json' | 'pdf' = 'json') =>
      exportChart.mutate({ patientId, format }),

    // Loading states
    isLoading:
      addCondition.isPending ||
      updateCondition.isPending ||
      removeCondition.isPending ||
      addProcedure.isPending ||
      updateProcedure.isPending ||
      removeProcedure.isPending ||
      saveDentalChart.isPending ||
      exportChart.isPending,
  };
};
