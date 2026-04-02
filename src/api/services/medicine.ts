/**
 * Medicine Service
 * Clinic-aware medicine template + override + custom medicine APIs.
 */

import { apiClient, API_ENDPOINTS } from '../client';

export interface MedicineTemplate {
    name: string;
    medicine_name: string;
    generic_name?: string;
    dosage_form: string;
    strength?: string;
    category: string;
    default_morning: number;
    default_lunch: number;
    default_evening: number;
    default_night: number;
    default_days: number;
    default_condition: string;
    instructions?: string;
    description?: string;
    is_custom?: boolean;
    is_active?: boolean;
    template_name?: string | null;
    source?: 'template_default' | 'template_override' | 'clinic_custom';
}

export interface CreateMedicineData {
    clinic: string;
    medicine_name: string;
    generic_name?: string;
    dosage_form?: string;
    strength?: string;
    category?: string;
    default_morning?: number;
    default_lunch?: number;
    default_evening?: number;
    default_night?: number;
    default_days?: number;
    default_condition?: string;
    instructions?: string;
    description?: string;
    is_active?: number;
}

export interface OverrideMedicineData {
    clinic: string;
    medicine_template: string;
    medicine_name?: string;
    generic_name?: string;
    dosage_form?: string;
    strength?: string;
    category?: string;
    default_morning?: number;
    default_lunch?: number;
    default_evening?: number;
    default_night?: number;
    default_days?: number;
    default_condition?: string;
    instructions?: string;
    description?: string;
    is_active: number;
}

export interface UpdateCustomMedicineData extends CreateMedicineData {
    original_name?: string;
}

export interface PrescriptionMedicine {
    id: string;
    medicine_name: string;
    medicine_id?: string;
    dosage_form: string;
    strength?: string;
    dosage?: string;
    morning: number;
    lunch: number;
    evening: number;
    night: number;
    days: number;
    condition: string;
    note?: string;
    instructions?: string;
}

export interface PrescriptionDraft {
    practitioner?: string;
    physicianNotes?: string;
    medications: PrescriptionMedicine[];
}

const getDefaultDosageValue = (dosageForm?: string, medicineName?: string): string => {
    const normalizedForm = (dosageForm || '').toLowerCase();
    const normalizedName = (medicineName || '').toLowerCase();

    if (normalizedForm.includes('syrup') || normalizedForm.includes('suspension') || normalizedForm.includes('liquid')) {
        return '5 ml';
    }
    if (normalizedForm.includes('mouthwash') || normalizedForm.includes('gargle')) {
        return '10 ml';
    }
    if (normalizedForm.includes('drop')) {
        return '2 drops';
    }
    if (normalizedForm.includes('capsule')) {
        return '1 Capsule';
    }
    if (
        normalizedForm.includes('ointment') ||
        normalizedForm.includes('cream') ||
        normalizedForm.includes('gel') ||
        normalizedForm.includes('paste') ||
        normalizedForm.includes('powder')
    ) {
        return 'Apply locally';
    }
    if (
        normalizedForm.includes('other') ||
        normalizedName.includes('paste') ||
        normalizedName.includes('mouthwash') ||
        normalizedName.includes('gargle') ||
        normalizedName.includes('floss') ||
        normalizedName.includes('brush')
    ) {
        return '';
    }
    return '1 Tablet';
};

export const medicineService = {
    async getMedicines(
        clinic: string,
        search?: string,
        category?: string,
        limit_start?: number,
        limit_page_length?: number
    ): Promise<MedicineTemplate[]> {
        const params: Record<string, any> = { clinic };
        if (search) params.search = search;
        if (category) params.category = category;
        if (limit_start !== undefined) params.limit_start = limit_start;
        if (limit_page_length !== undefined) params.limit_page_length = limit_page_length;

        const response = await apiClient.get<{ medicines: MedicineTemplate[] }>(
            API_ENDPOINTS.MEDICINES.GET,
            { params }
        );
        return response.data?.medicines || [];
    },

    async searchMedicines(query: string, limit: number = 20, clinic?: string): Promise<MedicineTemplate[]> {
        try {
            if (!query || query.length < 2) return [];
            const params = new URLSearchParams({
                query,
                limit: limit.toString(),
            });
            if (clinic) {
                params.append('clinic', clinic);
            }
            const response = await apiClient.get<MedicineTemplate[]>(
                `${API_ENDPOINTS.MEDICINES.SEARCH}?${params.toString()}`
            );
            const result = response.data || response.message;
            return Array.isArray(result) ? (result as MedicineTemplate[]) : [];
        } catch (error) {
            console.error('Search medicines error:', error);
            return [];
        }
    },

    async createCustomMedicine(data: CreateMedicineData): Promise<MedicineTemplate> {
        const response = await apiClient.post<{ medicine: MedicineTemplate }>(
            API_ENDPOINTS.MEDICINES.CREATE_CUSTOM,
            data
        );
        return response.data?.medicine!;
    },

    async updateCustomMedicine(data: UpdateCustomMedicineData): Promise<MedicineTemplate> {
        const response = await apiClient.post<{ medicine: MedicineTemplate }>(
            API_ENDPOINTS.MEDICINES.UPDATE_CUSTOM,
            data
        );
        return response.data?.medicine!;
    },

    async overrideTemplateMedicine(data: OverrideMedicineData): Promise<{ message: string }> {
        const response = await apiClient.post<{ message: string }>(
            API_ENDPOINTS.MEDICINES.OVERRIDE_TEMPLATE,
            data
        );
        return response.data!;
    },

    async deleteCustomMedicine(clinic: string, medicine_name: string): Promise<{ message: string }> {
        const response = await apiClient.post<{ message: string }>(
            API_ENDPOINTS.MEDICINES.DELETE_CUSTOM,
            { clinic, medicine_name }
        );
        return response.data!;
    },

    async getCategories(): Promise<string[]> {
        try {
            const response = await apiClient.get<string[]>(API_ENDPOINTS.MEDICINES.GET_CATEGORIES);
            const result = response.data || response.message;
            return Array.isArray(result) ? (result as string[]) : [];
        } catch (error) {
            console.error('Get categories error:', error);
            return [];
        }
    },

    async getConditions(): Promise<string[]> {
        try {
            const response = await apiClient.get<string[]>(API_ENDPOINTS.MEDICINES.GET_CONDITIONS);
            const result = response.data || response.message;
            return Array.isArray(result) ? (result as string[]) : [];
        } catch (error) {
            console.error('Get dosage conditions error:', error);
            return [];
        }
    },

    // Backward-compatible wrappers used by older call sites.
    async getTemplates(params?: {
        clinic?: string;
        search?: string;
        category?: string;
        limit_start?: number;
        limit_page_length?: number;
    }): Promise<{ medicines: MedicineTemplate[]; total_count: number }> {
        if (params?.clinic) {
            const medicines = await this.getMedicines(
                params.clinic,
                params.search,
                params.category,
                params.limit_start,
                params.limit_page_length
            );
            return { medicines, total_count: medicines.length };
        }

        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.append('search', params.search);
        if (params?.category) queryParams.append('category', params.category);
        if (params?.limit_start !== undefined) queryParams.append('limit_start', params.limit_start.toString());
        if (params?.limit_page_length !== undefined) queryParams.append('limit_page_length', params.limit_page_length.toString());

        const url = queryParams.toString()
            ? `${API_ENDPOINTS.MEDICINES.GET}?${queryParams.toString()}`
            : API_ENDPOINTS.MEDICINES.GET;

        const response = await apiClient.get<{ medicines: MedicineTemplate[]; total_count: number }>(url);
        const result = response.data || response.message;
        if (result && typeof result !== 'string' && 'medicines' in result) {
            return result as { medicines: MedicineTemplate[]; total_count: number };
        }
        return { medicines: [], total_count: 0 };
    },

    async createTemplate(data: Partial<MedicineTemplate>): Promise<{ medicine_id: string; medicine_name: string }> {
        const response = await apiClient.post<{ medicine_id: string; medicine_name: string }>(
            '/api/method/mob_clinic.mob_clinic.api.medicine.create_medicine_template',
            data
        );
        return (response.data || response.message) as { medicine_id: string; medicine_name: string };
    },

    async updateTemplate(medicineId: string, data: Partial<MedicineTemplate>): Promise<{ medicine_id: string }> {
        const response = await apiClient.post<{ medicine_id: string }>(
            '/api/method/mob_clinic.mob_clinic.api.medicine.update_medicine_template',
            { medicine_id: medicineId, ...data }
        );
        return (response.data || response.message) as { medicine_id: string };
    },

    async deleteTemplate(medicineId: string): Promise<void> {
        await apiClient.post('/api/method/mob_clinic.mob_clinic.api.medicine.delete_medicine_template', {
            medicine_id: medicineId,
        });
    },

    createEmptyMedicine(): PrescriptionMedicine {
        return {
            id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            medicine_name: '',
            dosage_form: 'Tablet',
            dosage: getDefaultDosageValue('Tablet', ''),
            morning: 0,
            lunch: 0,
            evening: 0,
            night: 0,
            days: 5,
            condition: '',
            note: '',
        };
    },

    templateToMedicine(template: MedicineTemplate): PrescriptionMedicine {
        const dosageForm = template.dosage_form || 'Tablet';
        return {
            id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            medicine_id: template.name,
            medicine_name: template.medicine_name,
            dosage_form: dosageForm,
            strength: template.strength,
            dosage: getDefaultDosageValue(dosageForm, template.medicine_name),
            morning: template.default_morning,
            lunch: template.default_lunch,
            evening: 0,
            night: Math.max(template.default_night, template.default_evening || 0),
            days: template.default_days,
            condition: template.default_condition,
            note: '',
            instructions: template.instructions,
        };
    },
};
