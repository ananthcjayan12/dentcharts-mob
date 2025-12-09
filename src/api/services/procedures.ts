import { apiClient, API_ENDPOINTS } from '../client';

export type Procedure = {
  procedure_name: string;
  code?: string;
  category: string;
  cost: number;
  duration_minutes?: number;
  description?: string;
  is_custom: boolean;
  source: 'template_default' | 'template_override' | 'clinic_custom';
  procedure_template?: string; // ID of the template if it's an override
  is_active?: boolean;
};

export interface CreateProcedureData {
  clinic: string;
  procedure_name: string;
  cost: number;
  code?: string;
  category?: string;
  duration_minutes?: number;
  description?: string;
}

export interface OverrideProcedureData {
  clinic: string;
  procedure_template: string;
  procedure_name?: string;
  code?: string;
  category?: string;
  cost: number;
  duration_minutes?: number;
  description?: string;
  is_active: number; // 1 or 0
}

export interface DeleteProcedureData {
  clinic: string;
  procedure_name: string;
}

export const proceduresService = {
  async getProcedures(clinic: string, search?: string, category?: string): Promise<Procedure[]> {
    const params: Record<string, any> = { clinic };
    if (search) params.search = search;
    if (category) params.category = category;

    const response = await apiClient.get<{ procedures: Procedure[] }>(
      API_ENDPOINTS.PROCEDURES.GET,
      { params }
    );
    return response.data?.procedures || [];
  },

  async createCustomProcedure(data: CreateProcedureData): Promise<Procedure> {
    const response = await apiClient.post<{ procedure: Procedure }>(
      API_ENDPOINTS.PROCEDURES.CREATE_CUSTOM,
      data
    );
    return response.data?.procedure!;
  },

  async updateCustomProcedure(data: CreateProcedureData & { original_name?: string }): Promise<Procedure> {
    // If original_name is provided, we might need a specific endpoint to handle renaming
    // For now assuming update_custom_procedure handles it using 'procedure_name' as key or we pass both
    const response = await apiClient.post<{ procedure: Procedure }>(
      API_ENDPOINTS.PROCEDURES.UPDATE_CUSTOM,
      data
    );
    return response.data?.procedure!;
  },

  async overrideProcedurePricing(data: OverrideProcedureData): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.PROCEDURES.OVERRIDE_TEMPLATE,
      data
    );
    return response.data!;
  },

  async deleteCustomProcedure(data: DeleteProcedureData): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.PROCEDURES.DELETE_CUSTOM,
      data
    );
    return response.data!;
  },

  async getCategories(): Promise<string[]> {
    const response = await apiClient.get<{ categories: string[] }>(
      API_ENDPOINTS.PROCEDURES.GET_CATEGORIES
    );
    return response.data?.categories || [];
  },

  // Keep the list method for backward compatibility if needed, but adapt it
  async list(search?: string): Promise<any[]> {
    // This is a fallback to support existing code until refactored
    // We'll need the clinic ID to really make this work, so this might throw or return empty if not careful.
    // Ideally we remove this after refactoring components.
    console.warn('Using deprecated proceduresService.list() - update to getProcedures(clinic)');
    return [];
  }
};
