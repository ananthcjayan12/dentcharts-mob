/**
 * WhatsApp Business API Service
 * Frontend service for sending WhatsApp messages
 */

import { apiClient } from '../client';

// Response types
export interface WhatsAppSendResponse {
    success: boolean;
    message_id?: string;
    log_id?: string;
    recipient?: string;
    error?: string;
}

export interface WhatsAppTestResponse {
    success: boolean;
    message?: string;
    phone_number_id?: string;
    display_phone?: string;
    error?: string;
}

export interface WhatsAppMessageLog {
    name: string;
    recipient_phone: string;
    template_name: string;
    message_type: string;
    status: string;
    sent_at: string;
    reference_doctype?: string;
    reference_name?: string;
    error_message?: string;
}

export interface WhatsAppLogsResponse {
    success: boolean;
    logs?: WhatsAppMessageLog[];
    total?: number;
    error?: string;
}

// API Endpoints
const WHATSAPP_ENDPOINTS = {
    SEND_TEMPLATE: '/api/method/mob_clinic.mob_clinic.api.whatsapp.send_template_message',
    SEND_APPOINTMENT_REMINDER: '/api/method/mob_clinic.mob_clinic.api.whatsapp.send_appointment_reminder',
    SEND_REVIEW_REQUEST: '/api/method/mob_clinic.mob_clinic.api.whatsapp.send_review_request',
    SEND_PRESCRIPTION: '/api/method/mob_clinic.mob_clinic.api.whatsapp.send_prescription',
    SEND_INVOICE: '/api/method/mob_clinic.mob_clinic.api.whatsapp.send_invoice',
    TEST_CONNECTION: '/api/method/mob_clinic.mob_clinic.api.whatsapp.test_connection',
    GET_LOGS: '/api/method/mob_clinic.mob_clinic.api.whatsapp.get_message_logs',
};

// Helper to extract data from API response
function extractData<T>(response: any): T {
    // apiClient returns { data: T, message: string } - extract the data
    if (response && typeof response === 'object' && 'data' in response) {
        return response.data as T;
    }
    return response as T;
}

class WhatsAppService {
    /**
     * Send appointment reminder via WhatsApp
     */
    async sendAppointmentReminder(appointmentId: string): Promise<WhatsAppSendResponse> {
        try {
            const response = await apiClient.post<WhatsAppSendResponse>(
                WHATSAPP_ENDPOINTS.SEND_APPOINTMENT_REMINDER,
                { appointment_id: appointmentId }
            );
            return extractData<WhatsAppSendResponse>(response);
        } catch (error: any) {
            console.error('WhatsApp appointment reminder error:', error);
            return { success: false, error: error.message || 'Failed to send reminder' };
        }
    }

    /**
     * Send review request after appointment
     */
    async sendReviewRequest(appointmentId: string): Promise<WhatsAppSendResponse> {
        try {
            const response = await apiClient.post<WhatsAppSendResponse>(
                WHATSAPP_ENDPOINTS.SEND_REVIEW_REQUEST,
                { appointment_id: appointmentId }
            );
            return extractData<WhatsAppSendResponse>(response);
        } catch (error: any) {
            console.error('WhatsApp review request error:', error);
            return { success: false, error: error.message || 'Failed to send review request' };
        }
    }

    /**
     * Share prescription via WhatsApp
     */
    async sendPrescription(prescriptionId: string, phone?: string): Promise<WhatsAppSendResponse> {
        try {
            const payload: Record<string, string> = { prescription_id: prescriptionId };
            if (phone) {
                payload.patient_phone = phone;
            }

            const response = await apiClient.post<WhatsAppSendResponse>(
                WHATSAPP_ENDPOINTS.SEND_PRESCRIPTION,
                payload
            );
            return extractData<WhatsAppSendResponse>(response);
        } catch (error: any) {
            console.error('WhatsApp prescription error:', error);
            return { success: false, error: error.message || 'Failed to send prescription' };
        }
    }

    /**
     * Share invoice/receipt via WhatsApp
     */
    async sendInvoice(invoiceId: string, phone?: string): Promise<WhatsAppSendResponse> {
        try {
            const payload: Record<string, string> = { invoice_id: invoiceId };
            if (phone) {
                payload.patient_phone = phone;
            }

            const response = await apiClient.post<WhatsAppSendResponse>(
                WHATSAPP_ENDPOINTS.SEND_INVOICE,
                payload
            );
            return extractData<WhatsAppSendResponse>(response);
        } catch (error: any) {
            console.error('WhatsApp invoice error:', error);
            return { success: false, error: error.message || 'Failed to send invoice' };
        }
    }

    /**
     * Test WhatsApp API connection
     */
    async testConnection(clinic: string): Promise<WhatsAppTestResponse> {
        try {
            const response = await apiClient.post<WhatsAppTestResponse>(
                WHATSAPP_ENDPOINTS.TEST_CONNECTION,
                { clinic }
            );
            return extractData<WhatsAppTestResponse>(response);
        } catch (error: any) {
            console.error('WhatsApp test connection error:', error);
            return { success: false, error: error.message || 'Connection test failed' };
        }
    }

    /**
     * Get message logs
     */
    async getMessageLogs(
        clinic: string,
        options?: { limit?: number; offset?: number; messageType?: string; status?: string }
    ): Promise<WhatsAppLogsResponse> {
        try {
            const params: Record<string, string | number> = { clinic };
            if (options?.limit) params.limit = options.limit;
            if (options?.offset) params.offset = options.offset;
            if (options?.messageType) params.message_type = options.messageType;
            if (options?.status) params.status = options.status;

            const response = await apiClient.post<WhatsAppLogsResponse>(
                WHATSAPP_ENDPOINTS.GET_LOGS,
                params
            );
            return extractData<WhatsAppLogsResponse>(response);
        } catch (error: any) {
            console.error('WhatsApp get logs error:', error);
            return { success: false, error: error.message || 'Failed to get logs' };
        }
    }

    /**
     * Send custom template message
     */
    async sendTemplateMessage(
        clinic: string,
        recipientPhone: string,
        templateName: string,
        templateParams?: string[],
        options?: {
            language?: string;
            messageType?: string;
            referenceDoctype?: string;
            referenceName?: string;
        }
    ): Promise<WhatsAppSendResponse> {
        try {
            const payload: Record<string, any> = {
                clinic,
                recipient_phone: recipientPhone,
                template_name: templateName,
            };

            if (templateParams) {
                payload.template_params = JSON.stringify(templateParams);
            }
            if (options?.language) payload.language = options.language;
            if (options?.messageType) payload.message_type = options.messageType;
            if (options?.referenceDoctype) payload.reference_doctype = options.referenceDoctype;
            if (options?.referenceName) payload.reference_name = options.referenceName;

            const response = await apiClient.post<WhatsAppSendResponse>(
                WHATSAPP_ENDPOINTS.SEND_TEMPLATE,
                payload
            );
            return extractData<WhatsAppSendResponse>(response);
        } catch (error: any) {
            console.error('WhatsApp send template error:', error);
            return { success: false, error: error.message || 'Failed to send message' };
        }
    }
}

// Singleton instance
export const whatsappService = new WhatsAppService();
