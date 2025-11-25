import { apiClient, API_ENDPOINTS } from '../client';
import { ToothData, ToothCondition, ToothProcedure, ProcedureTimelineEntry } from '../../components/common/DentalChart';

export interface DentalChartResponse {
  patient_id: string;
  chart_type: 'adult' | 'pediatric' | 'mixed';
  teeth: Record<string, any>; // API uses string keys like "12"
  last_updated?: string;
  summary?: {
    total_teeth_affected: number;
    total_conditions: number;
    total_procedures: number;
    completed_procedures: number;
    planned_procedures: number;
    in_progress_procedures: number;
  };
}

export interface ConditionInput {
  type: ToothCondition['type'];
  severity?: 'mild' | 'moderate' | 'severe';
  notes: string;
  date: string;
}

export interface ProcedureInput {
  name: string;
  status: 'planned' | 'in-progress' | 'completed';
  notes: string;
  date: string;
  cost?: number;
  duration_minutes?: number;
}

export interface ChartSummary {
  total_teeth: number;
  healthy_teeth: number;
  teeth_with_conditions: number;
  teeth_in_treatment: number;
  treated_teeth: number;
  total_procedures: number;
  pending_procedures: number;
  completed_procedures: number;
  total_cost?: number;
}

export interface TreatmentProgress {
  patient_id: string;
  patient_name: string;
  total_procedures: number;
  completed_procedures: number;
  in_progress_procedures: number;
  planned_procedures: number;
  completion_percentage: number;
  next_scheduled_procedure?: {
    tooth_number: number;
    procedure_name: string;
    date: string;
  };
}

class DentalChartService {
  // Get dental chart for a patient
  async getDentalChart(patientId: string) {
    const response = await apiClient.get<DentalChartResponse>(
      API_ENDPOINTS.DENTAL_CHART.GET,
      { params: { patient_id: patientId } }
    );
    return response.data;
  }

  // Save entire dental chart
  async saveDentalChart(data: {
    patient_id: string;
    chart_type: 'adult' | 'pediatric' | 'mixed';
    teeth_data: Record<number, ToothData>;
  }) {
    // Convert teeth_data keys to strings for API
    const teethForApi: Record<string, any> = {};
    Object.entries(data.teeth_data).forEach(([key, value]) => {
      teethForApi[key] = value;
    });

    const response = await apiClient.post<DentalChartResponse>(
      API_ENDPOINTS.DENTAL_CHART.SAVE,
      {
        patient_id: data.patient_id,
        chart_type: data.chart_type,
        teeth_data: teethForApi,
      }
    );
    return response.data;
  }

  // Add condition to tooth/teeth
  async addCondition(data: {
    patient_id: string;
    tooth_numbers: number[];
    condition: ConditionInput;
  }) {
    const response = await apiClient.post(
      API_ENDPOINTS.DENTAL_CHART.ADD_CONDITION,
      data
    );
    return response.data;
  }

  // Update existing condition
  async updateCondition(data: {
    patient_id: string;
    condition_name: string; // Frappe native ID
    updates: Partial<ConditionInput>;
  }) {
    const response = await apiClient.post(
      API_ENDPOINTS.DENTAL_CHART.UPDATE_CONDITION,
      data
    );
    return response.data;
  }

  // Remove condition from tooth
  async removeCondition(data: {
    patient_id: string;
    condition_name: string; // Frappe native ID
    reason?: string;
  }) {
    const response = await apiClient.post(
      API_ENDPOINTS.DENTAL_CHART.REMOVE_CONDITION,
      data
    );
    return response.data;
  }

  // Get condition history
  async getConditionHistory(data: {
    patient_id: string;
    condition_name: string; // Frappe native ID
  }) {
    const response = await apiClient.get(
      API_ENDPOINTS.DENTAL_CHART.GET_CONDITION_HISTORY,
      {
        params: {
          patient_id: data.patient_id,
          condition_name: data.condition_name,
        },
      }
    );
    return response.data;
  }

  // Get available condition types
  async getConditionTypes() {
    const response = await apiClient.get<Array<{
      value: string;
      label: string;
      icon?: string;
      color?: string;
    }>>( API_ENDPOINTS.DENTAL_CHART.GET_CONDITION_TYPES);
    return response.data;
  }

  // Add procedure to tooth/teeth
  async addProcedure(data: {
    patient_id: string;
    tooth_numbers: number[];
    procedure: ProcedureInput;
  }) {
    const response = await apiClient.post(
      API_ENDPOINTS.DENTAL_CHART.ADD_PROCEDURE,
      data
    );
    return response.data;
  }

  // Update procedure (handles status changes and creates timeline entries automatically)
  async updateProcedure(data: {
    patient_id: string;
    procedure_name: string; // Frappe native ID
    updates: Partial<ProcedureInput>;
  }) {
    const response = await apiClient.post(
      API_ENDPOINTS.DENTAL_CHART.UPDATE_PROCEDURE,
      data
    );
    return response.data;
  }

  // Remove procedure from tooth
  async removeProcedure(data: {
    patient_id: string;
    procedure_name: string; // Frappe native ID
    reason?: string;
  }) {
    const response = await apiClient.post(
      API_ENDPOINTS.DENTAL_CHART.REMOVE_PROCEDURE,
      data
    );
    return response.data;
  }

  // Get procedure timeline
  async getProcedureTimeline(
    patientId: string,
    procedureName: string
  ) {
    const response = await apiClient.get<{ timeline: ProcedureTimelineEntry[] }>(
      API_ENDPOINTS.DENTAL_CHART.GET_PROCEDURE_TIMELINE,
      {
        params: {
          patient_id: patientId,
          procedure_name: procedureName,
        },
      }
    );
    return response.data;
  }

  // Get available procedure types
  async getProcedureTypes() {
    const response = await apiClient.get<string[]>(
      API_ENDPOINTS.DENTAL_CHART.GET_PROCEDURE_TYPES
    );
    return response.data;
  }

  // Get dental chart summary
  async getChartSummary(patientId: string) {
    const response = await apiClient.get<ChartSummary>(
      API_ENDPOINTS.DENTAL_CHART.GET_SUMMARY,
      { params: { patient_id: patientId } }
    );
    return response.data;
  }

  // Export dental chart
  async exportChart(patientId: string, format: 'json' | 'pdf' = 'json') {
    const response = await apiClient.get(
      API_ENDPOINTS.DENTAL_CHART.EXPORT,
      { params: { patient_id: patientId, format } }
    );
    return response.data;
  }

  // Get treatment progress
  async getTreatmentProgress(patientId: string) {
    const response = await apiClient.get<TreatmentProgress>(
      API_ENDPOINTS.DENTAL_CHART.GET_TREATMENT_PROGRESS,
      { params: { patient_id: patientId } }
    );
    return response.data;
  }

  // Get chart types
  async getChartTypes() {
    const response = await apiClient.get<Array<{
      value: string;
      label: string;
    }>>(API_ENDPOINTS.DENTAL_CHART.GET_CHART_TYPES);
    return response.data;
  }

  // Get tooth status options
  async getToothStatusOptions() {
    const response = await apiClient.get<Array<{
      value: string;
      label: string;
    }>>(API_ENDPOINTS.DENTAL_CHART.GET_TOOTH_STATUS_OPTIONS);
    return response.data;
  }
}

export const dentalChartService = new DentalChartService();
export default dentalChartService;
