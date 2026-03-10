import { apiClient, API_ENDPOINTS } from '../client';

export interface ClinicProfile {
    basic_info: {
        clinic_name: string;
        abbr?: string;
        logo_url?: string;
        phone?: string;
        email?: string;
        website?: string;
        registration_number?: string;
        tax_id?: string;
    };
    address: {
        address_line1?: string;
        address_line2?: string;
        city?: string;
        state?: string;
        country?: string;
        pincode?: string;
        phone?: string;
        email?: string;
    };
    branding: {
        primary_color: string;
        secondary_color: string;
        text_color: string;
        background_color: string;
        font_family: string;
    };
    invoice_settings: {
        header_text: string;
        footer_text: string;
        terms_conditions: string;
        signature_url?: string;
        seal_url?: string;
        show_logo: boolean;
        show_seal: boolean;
    };
    notifications: {
        appointment_reminder: string;
        payment_receipt: string;
        prescription_message: string;
        sms_sender: string;
    };
    social_media: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
        google_maps?: string;
    };
    additional: {
        appointment_slot_duration: number;
        allow_online_booking: boolean;
        timezone: string;
        currency: string;
        start_time?: string;
        end_time?: string;
    };
}

export interface ClinicPractitionerSchedule {
    practitioner_id: string;
    practitioner_name: string;
    user_id?: string;
    primary_company: string;
    start_time?: string | null;
    end_time?: string | null;
}

export interface ClinicPractitionerSchedulesResponse {
    clinic: string;
    default_slot_duration?: number | null;
    practitioners: ClinicPractitionerSchedule[];
}

export interface ClinicConsultant {
    consultant_id: string;
    consultant_type: 'Internal' | 'External';
    practitioner?: string | null;
    consultant_name: string;
    mobile?: string | null;
    commission_type: 'Percentage' | 'Fixed';
    commission_value: number;
    is_active: number;
    notes?: string | null;
}

export interface ClinicConsultantsResponse {
    clinic: string;
    consultants: ClinicConsultant[];
}

export const clinicProfileService = {
    async getClinicProfile(clinic: string): Promise<ClinicProfile> {
        const response = await apiClient.get<{ profile: ClinicProfile }>(
            API_ENDPOINTS.CLINIC_PROFILE.GET,
            { params: { clinic } }
        );
        return response.data?.profile!;
    },

    async updateBasicInfo(data: any): Promise<any> {
        return apiClient.post(API_ENDPOINTS.CLINIC_PROFILE.UPDATE_BASIC, data);
    },

    async updateAddress(data: any): Promise<any> {
        return apiClient.post(API_ENDPOINTS.CLINIC_PROFILE.UPDATE_ADDRESS, data);
    },

    async updateBranding(data: any): Promise<any> {
        return apiClient.post(API_ENDPOINTS.CLINIC_PROFILE.UPDATE_BRANDING, data);
    },

    async updateInvoiceSettings(data: any): Promise<any> {
        return apiClient.post(API_ENDPOINTS.CLINIC_PROFILE.UPDATE_INVOICE, data);
    },

    async updateNotificationTemplates(data: any): Promise<any> {
        return apiClient.post(API_ENDPOINTS.CLINIC_PROFILE.UPDATE_NOTIFICATIONS, data);
    },

    async updateSocialMedia(data: any): Promise<any> {
        return apiClient.post(API_ENDPOINTS.CLINIC_PROFILE.UPDATE_SOCIAL, data);
    },

    async updateAdditionalSettings(data: any): Promise<any> {
        return apiClient.post(API_ENDPOINTS.CLINIC_PROFILE.UPDATE_ADDITIONAL, data);
    },

    async getPractitionerSchedules(clinic: string): Promise<ClinicPractitionerSchedulesResponse> {
        const response = await apiClient.get<ClinicPractitionerSchedulesResponse>(
            `${API_ENDPOINTS.CLINIC_PROFILE.PRACTITIONER_SCHEDULES}?clinic=${encodeURIComponent(clinic)}`
        );
        return response.data!;
    },

    async updatePractitionerSchedule(data: {
        clinic: string;
        practitioner_id: string;
        start_time?: string;
        end_time?: string;
    }): Promise<ClinicPractitionerSchedule> {
        const response = await apiClient.post<ClinicPractitionerSchedule>(
            API_ENDPOINTS.CLINIC_PROFILE.UPDATE_PRACTITIONER_SCHEDULE,
            data
        );
        return response.data!;
    },

    async getClinicConsultants(clinic: string): Promise<ClinicConsultantsResponse> {
        const response = await apiClient.get<ClinicConsultantsResponse>(
            `${API_ENDPOINTS.CLINIC_PROFILE.CONSULTANTS}?clinic=${encodeURIComponent(clinic)}`
        );
        return response.data!;
    },

    async saveClinicConsultant(data: {
        clinic: string;
        consultant_id?: string;
        consultant_type: 'Internal' | 'External';
        practitioner?: string;
        consultant_name?: string;
        mobile?: string;
        commission_type: 'Percentage' | 'Fixed';
        commission_value: number;
        is_active?: number;
        notes?: string;
    }): Promise<ClinicConsultant> {
        const response = await apiClient.post<ClinicConsultant>(
            API_ENDPOINTS.CLINIC_PROFILE.SAVE_CONSULTANT,
            data
        );
        return response.data!;
    },

    async deleteClinicConsultant(clinic: string, consultant_id: string): Promise<{ consultant_id: string }> {
        const response = await apiClient.post<{ consultant_id: string }>(
            API_ENDPOINTS.CLINIC_PROFILE.DELETE_CONSULTANT,
            { clinic, consultant_id }
        );
        return response.data!;
    },

    async uploadLogo(clinic: string, file: File): Promise<{ logo_url: string }> {
        const formData = new FormData();
        formData.append('clinic', clinic);
        formData.append('file', file);
        const response = await apiClient.upload<{ logo_url: string }>(
            API_ENDPOINTS.CLINIC_PROFILE.UPLOAD_LOGO,
            formData
        );
        return response.data!;
    },

    async uploadDocument(clinic: string, documentType: 'signature' | 'seal', file: File): Promise<{ file_url: string }> {
        const formData = new FormData();
        formData.append('clinic', clinic);
        formData.append('document_type', documentType);
        formData.append('file', file);
        const response = await apiClient.upload<{ file_url: string }>(
            API_ENDPOINTS.CLINIC_PROFILE.UPLOAD_DOCUMENT,
            formData
        );
        return response.data!;
    }
};
