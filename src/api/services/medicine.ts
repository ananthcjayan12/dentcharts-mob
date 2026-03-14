/**
 * Medicine Template Service
 * API calls for medicine template operations
 */

import { apiClient } from '../client';

// API endpoints for medicine templates
const MEDICINE_ENDPOINTS = {
    GET_TEMPLATES: '/api/method/mob_clinic.mob_clinic.api.medicine.get_medicine_templates',
    SEARCH: '/api/method/mob_clinic.mob_clinic.api.medicine.search_medicines',
    CREATE: '/api/method/mob_clinic.mob_clinic.api.medicine.create_medicine_template',
    UPDATE: '/api/method/mob_clinic.mob_clinic.api.medicine.update_medicine_template',
    DELETE: '/api/method/mob_clinic.mob_clinic.api.medicine.delete_medicine_template',
    GET_CATEGORIES: '/api/method/mob_clinic.mob_clinic.api.medicine.get_medicine_categories',
    GET_CONDITIONS: '/api/method/mob_clinic.mob_clinic.api.medicine.get_dosage_conditions',
};

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
}

export interface PrescriptionMedicine {
    id: string; // unique id for react key
    medicine_name: string;
    medicine_id?: string; // Medicine Template ID if selected from templates
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

const getDefaultDosageValue = (dosageForm?: string): string => {
    const normalizedForm = (dosageForm || '').toLowerCase();

    if (normalizedForm.includes('syrup') || normalizedForm.includes('suspension') || normalizedForm.includes('liquid')) {
        return '5 ml';
    }

    if (normalizedForm.includes('drop')) {
        return '2 drops';
    }

    if (normalizedForm.includes('capsule')) {
        return '1 Capsule';
    }

    if (normalizedForm.includes('ointment') || normalizedForm.includes('cream') || normalizedForm.includes('gel')) {
        return 'Apply locally';
    }

    return '1 Tablet';
};

export const medicineService = {
    /**
     * Get all medicine templates with optional filtering
     */
    async getTemplates(params?: {
        search?: string;
        category?: string;
        limit_start?: number;
        limit_page_length?: number;
    }): Promise<{ medicines: MedicineTemplate[]; total_count: number }> {
        try {
            const queryParams = new URLSearchParams();
            if (params?.search) queryParams.append('search', params.search);
            if (params?.category) queryParams.append('category', params.category);
            if (params?.limit_start !== undefined) queryParams.append('limit_start', params.limit_start.toString());
            if (params?.limit_page_length !== undefined) queryParams.append('limit_page_length', params.limit_page_length.toString());

            const url = queryParams.toString()
                ? `${MEDICINE_ENDPOINTS.GET_TEMPLATES}?${queryParams.toString()}`
                : MEDICINE_ENDPOINTS.GET_TEMPLATES;

            const response = await apiClient.get<{ medicines: MedicineTemplate[]; total_count: number }>(url);

            const result = response.data || response.message;
            if (result && typeof result !== 'string' && 'medicines' in result) {
                return result as { medicines: MedicineTemplate[]; total_count: number };
            }
            return { medicines: [], total_count: 0 };
        } catch (error) {
            console.error('Get medicine templates error:', error);
            return { medicines: [], total_count: 0 };
        }
    },

    /**
     * Quick search for medicine autocomplete
     */
    async searchMedicines(query: string, limit: number = 20): Promise<MedicineTemplate[]> {
        try {
            if (!query || query.length < 2) return [];

            const params = new URLSearchParams({
                query: query,
                limit: limit.toString(),
            });

            const response = await apiClient.get<MedicineTemplate[]>(
                `${MEDICINE_ENDPOINTS.SEARCH}?${params.toString()}`
            );

            const result = response.data || response.message;
            if (Array.isArray(result)) {
                return result as MedicineTemplate[];
            }
            return [];
        } catch (error) {
            console.error('Search medicines error:', error);
            return [];
        }
    },

    /**
     * Create a new medicine template
     */
    async createTemplate(data: Partial<MedicineTemplate>): Promise<{ medicine_id: string; medicine_name: string }> {
        const response = await apiClient.post<{ medicine_id: string; medicine_name: string }>(
            MEDICINE_ENDPOINTS.CREATE,
            data
        );
        const result = response.data || response.message;
        if (result && typeof result !== 'string') {
            return result as { medicine_id: string; medicine_name: string };
        }
        throw new Error('Invalid response from create template');
    },

    /**
     * Update an existing medicine template
     */
    async updateTemplate(medicineId: string, data: Partial<MedicineTemplate>): Promise<{ medicine_id: string }> {
        const response = await apiClient.post<{ medicine_id: string }>(
            MEDICINE_ENDPOINTS.UPDATE,
            { medicine_id: medicineId, ...data }
        );
        const result = response.data || response.message;
        if (result && typeof result !== 'string') {
            return result as { medicine_id: string };
        }
        throw new Error('Invalid response from update template');
    },

    /**
     * Delete a medicine template
     */
    async deleteTemplate(medicineId: string): Promise<void> {
        await apiClient.post(MEDICINE_ENDPOINTS.DELETE, { medicine_id: medicineId });
    },

    /**
     * Get medicine categories
     */
    async getCategories(): Promise<string[]> {
        try {
            const response = await apiClient.get<string[]>(MEDICINE_ENDPOINTS.GET_CATEGORIES);
            const result = response.data || response.message;
            return Array.isArray(result) ? result as string[] : [];
        } catch (error) {
            console.error('Get categories error:', error);
            return [];
        }
    },

    /**
     * Get dosage conditions
     */
    async getConditions(): Promise<string[]> {
        try {
            const response = await apiClient.get<string[]>(MEDICINE_ENDPOINTS.GET_CONDITIONS);
            const result = response.data || response.message;
            return Array.isArray(result) ? result as string[] : [];
        } catch (error) {
            console.error('Get conditions error:', error);
            return [];
        }
    },

    /**
     * Create a new empty prescription medicine row
     */
    createEmptyMedicine(): PrescriptionMedicine {
        return {
            id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            medicine_name: '',
            dosage_form: 'Tablet',
            dosage: getDefaultDosageValue('Tablet'),
            morning: 0,
            lunch: 0,
            evening: 0,
            night: 0,
            days: 5,
            condition: '',
            note: '',
        };
    },

    /**
     * Convert MedicineTemplate to PrescriptionMedicine
     */
    templateToMedicine(template: MedicineTemplate): PrescriptionMedicine {
        const dosageForm = template.dosage_form || 'Tablet';

        return {
            id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            medicine_id: template.name,
            medicine_name: template.medicine_name,
            dosage_form: dosageForm,
            strength: template.strength,
            dosage: getDefaultDosageValue(dosageForm),
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
