import { apiClient, API_ENDPOINTS } from '../client';

export type Condition = {
    condition_name: string;
    code?: string;
    type: string;
    category: string;
    description?: string;
    icon?: string;
    color?: string;
    treatment_required: boolean;
    severity_levels: string[];
    is_custom: boolean;
    source: 'template_default' | 'template_override' | 'clinic_custom';
    condition_template?: string;
    is_active?: boolean;
};

export interface CreateConditionData {
    clinic: string;
    condition_name: string;
    code?: string;
    type?: string;
    category?: string;
    severity_levels?: string[];
    description?: string;
    icon?: string;
    color?: string;
    treatment_required?: number; // 0 or 1
}

export interface OverrideConditionData {
    clinic: string;
    condition_template: string;
    condition_name?: string;
    code?: string;
    type?: string;
    category?: string;
    description?: string;
    icon?: string;
    color?: string;
    treatment_required?: number;
    is_active: number;
}

export interface DeleteConditionData {
    clinic: string;
    condition_name: string;
}

export const conditionsService = {
    async getConditions(clinic: string, search?: string, category?: string): Promise<Condition[]> {
        const params: Record<string, any> = { clinic };
        if (search) params.search = search;
        if (category) params.category = category;

        const response = await apiClient.get<{ conditions: Condition[] }>(
            API_ENDPOINTS.CONDITIONS.GET,
            { params }
        );
        return response.data?.conditions || [];
    },

    async createCustomCondition(data: CreateConditionData): Promise<Condition> {
        const response = await apiClient.post<{ condition: Condition }>(
            API_ENDPOINTS.CONDITIONS.CREATE_CUSTOM,
            data
        );
        return response.data?.condition!;
    },

    async overrideTemplateCondition(data: OverrideConditionData): Promise<{ message: string }> {
        const response = await apiClient.post<{ message: string }>(
            API_ENDPOINTS.CONDITIONS.OVERRIDE_TEMPLATE,
            data
        );
        return response.data!;
    },

    async deleteCustomCondition(data: DeleteConditionData): Promise<{ message: string }> {
        const response = await apiClient.post<{ message: string }>(
            API_ENDPOINTS.CONDITIONS.DELETE_CUSTOM,
            data
        );
        return response.data!;
    },

    async getCategories(): Promise<string[]> {
        const response = await apiClient.get<{ categories: string[] }>(
            API_ENDPOINTS.CONDITIONS.GET_CATEGORIES
        );
        return response.data?.categories || [];
    },

    async getTypes(): Promise<string[]> {
        const response = await apiClient.get<{ types: string[] }>(
            API_ENDPOINTS.CONDITIONS.GET_TYPES
        );
        return response.data?.types || [];
    }
};
