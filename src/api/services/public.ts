import { apiClient } from '../client';

export const publicService = {
    // Get public clinic landing data
    getLandingData: async (clinicId: string) => {
        const response = await apiClient.get(`/api/method/mob_clinic.mob_clinic.api.public_landing.get_public_landing_data`, {
            params: { clinic: clinicId }
        });
        console.log('🚀 Final Data Returned:', response.data);
        return response.data;
    },

    // Get available slots for public booking
    getPublicSlots: async (date: string, clinicId: string, practitioner?: string) => {
        const response = await apiClient.get(`/api/method/mob_clinic.mob_clinic.api.appointment.get_available_slots`, {
            params: {
                date,
                clinic: clinicId,
                duration: 30,
                practitioner: practitioner || undefined
            }
        });
        console.log('📅 Slots API Response:', response);
        // apiClient already unwraps - response.data is the inner data object
        return response.data;
    },

    // Book public appointment
    bookPublicAppointment: async (data: {
        clinic: string;
        patient_name: string;
        mobile: string;
        appointment_date: string;
        appointment_time: string;
        practitioner?: string;
        appointment_type?: string;
        email?: string;
        sex?: string;
        notes?: string;
    }) => {
        const response = await apiClient.post(`/api/method/mob_clinic.mob_clinic.api.appointment.create_public_appointment`, data);
        return (response.data as any);
    }
};
