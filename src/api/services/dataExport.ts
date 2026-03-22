import { apiClient, API_ENDPOINTS } from '../client';

export type ExportTypeKey = 'patient_statistics' | 'financial_data' | 'treatment_wise_data';

export interface ExportTypeOption {
  key: ExportTypeKey;
  label: string;
  description: string;
  status_options: string[];
}

export interface ExportPractitionerOption {
  practitioner_id: string;
  practitioner_name: string;
}

export interface DataExportConfig {
  clinic: string;
  requested_by: string;
  export_types: ExportTypeOption[];
  practitioners: ExportPractitionerOption[];
  default_date_from?: string;
  default_date_to?: string;
}

export interface ExportCsvPayload {
  export_type: ExportTypeKey;
  clinic?: string;
  date_from?: string;
  date_to?: string;
  practitioner?: string;
  status?: string;
  include_summary?: boolean;
}

export interface ExportCsvResponse {
  export_type: ExportTypeKey;
  clinic: string;
  patient_scope: 'patients_all' | 'patients_user';
  filename: string;
  row_count: number;
  generated_at: string;
  columns: string[];
  summary?: Record<string, string | number>;
  include_summary?: boolean;
  csv_content: string;
}

export const dataExportService = {
  async getConfig(clinic?: string): Promise<DataExportConfig> {
    const endpoint = clinic
      ? `${API_ENDPOINTS.DATA_EXPORT.CONFIG}?clinic=${encodeURIComponent(clinic)}`
      : API_ENDPOINTS.DATA_EXPORT.CONFIG;
    const response = await apiClient.get<DataExportConfig>(endpoint);
    return response.data!;
  },

  async exportCsv(payload: ExportCsvPayload): Promise<ExportCsvResponse> {
    const response = await apiClient.post<ExportCsvResponse>(
      API_ENDPOINTS.DATA_EXPORT.EXPORT_CSV,
      payload
    );
    return response.data!;
  },
};
