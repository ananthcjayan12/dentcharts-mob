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

export interface WhatsAppPdfPayload {
    phone?: string;
    pdfBase64?: string;
    pdfFilename?: string;
}

export interface WhatsAppTestResponse {
    success: boolean;
    message?: string;
    phone_number_id?: string;
    display_phone?: string;
    error?: string;
}

export interface WhatsAppSettings {
    clinic: string;
    whatsapp_enabled: number;
    whatsapp_phone_number_id: string;
    whatsapp_business_account_id: string;
    whatsapp_access_token_masked: string;
    has_whatsapp_access_token: number;
    whatsapp_appointment_template: string;
    whatsapp_review_template: string;
    whatsapp_prescription_template: string;
    whatsapp_invoice_template: string;
}

export interface WhatsAppSettingsResponse {
    message: string;
    data: WhatsAppSettings;
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
    clinic?: string;
    error?: string;
}

export interface WhatsAppConversationSummary {
    name: string;
    clinic: string;
    wa_id: string;
    customer_name?: string;
    customer_phone?: string;
    last_message_preview?: string;
    last_message_at?: string;
    last_message_direction?: 'Inbound' | 'Outbound';
    last_message_status?: string;
    unread_count: number;
    session_expires_at?: string;
    is_session_active?: number;
}

export interface WhatsAppConversationMessage {
    name: string;
    wa_message_id?: string;
    direction: 'Inbound' | 'Outbound';
    message_type?: string;
    content?: string;
    status?: string;
    message_timestamp?: string;
    sender_phone?: string;
    recipient_phone?: string;
    template_name?: string;
    error_message?: string;
}

export interface WhatsAppConversationsResponse {
    message: string;
    data: {
        clinic: string;
        total: number;
        conversations: WhatsAppConversationSummary[];
    };
}

export interface WhatsAppConversationMessagesResponse {
    message: string;
    data: {
        conversation: {
            name: string;
            customer_name?: string;
            customer_phone?: string;
            wa_id?: string;
            session_expires_at?: string;
            is_session_active?: number;
        };
        total: number;
        messages: WhatsAppConversationMessage[];
    };
}

export interface WhatsAppStatsResponse {
    message: string;
    data: {
        clinic: string;
        date_from: string;
        date_to: string;
        granularity: 'day' | 'week' | 'month';
        kpis: {
            total: number;
            sent: number;
            delivered: number;
            read: number;
            failed: number;
        };
        template_breakdown: Array<{ template_name?: string; total: number }>;
        failure_reasons: Array<{ error_message?: string; total: number }>;
        trends: Array<{
            bucket: string;
            total: number;
            sent: number;
            delivered: number;
            read: number;
            failed: number;
        }>;
    };
}

// API Endpoints
const WHATSAPP_ENDPOINTS = {
    SEND_TEMPLATE: '/api/method/mob_clinic.mob_clinic.api.whatsapp.send_template_message',
    SEND_APPOINTMENT_REMINDER: '/api/method/mob_clinic.mob_clinic.api.whatsapp.send_appointment_reminder',
    SEND_REVIEW_REQUEST: '/api/method/mob_clinic.mob_clinic.api.whatsapp.send_review_request',
    SEND_PRESCRIPTION: '/api/method/mob_clinic.mob_clinic.api.whatsapp.send_prescription',
    SEND_INVOICE: '/api/method/mob_clinic.mob_clinic.api.whatsapp.send_invoice',
    TEST_CONNECTION: '/api/method/mob_clinic.mob_clinic.api.whatsapp.test_connection',
    GET_SETTINGS: '/api/method/mob_clinic.mob_clinic.api.whatsapp.get_whatsapp_settings',
    UPDATE_SETTINGS: '/api/method/mob_clinic.mob_clinic.api.whatsapp.update_whatsapp_settings',
    GET_LOGS: '/api/method/mob_clinic.mob_clinic.api.whatsapp.get_message_logs',
    GET_CONVERSATIONS: '/api/method/mob_clinic.mob_clinic.api.whatsapp.get_conversations',
    GET_CONVERSATION_MESSAGES: '/api/method/mob_clinic.mob_clinic.api.whatsapp.get_conversation_messages',
    MARK_CONVERSATION_READ: '/api/method/mob_clinic.mob_clinic.api.whatsapp.mark_conversation_read',
    SEND_CONVERSATION_REPLY: '/api/method/mob_clinic.mob_clinic.api.whatsapp.send_conversation_reply',
    GET_STATS: '/api/method/mob_clinic.mob_clinic.api.whatsapp.get_whatsapp_stats',
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
    async getWhatsAppSettings(clinic?: string): Promise<WhatsAppSettings> {
        try {
            const query = clinic ? `?clinic=${encodeURIComponent(clinic)}` : '';
            const response = await apiClient.get<WhatsAppSettings>(`${WHATSAPP_ENDPOINTS.GET_SETTINGS}${query}`);
            return extractData<WhatsAppSettings>(response);
        } catch (error: any) {
            console.error('WhatsApp get settings error:', error);
            throw error;
        }
    }

    async updateWhatsAppSettings(payload: Partial<WhatsAppSettings> & { clinic?: string; whatsapp_access_token?: string }): Promise<WhatsAppSettings> {
        try {
            const response = await apiClient.post<WhatsAppSettings>(
                WHATSAPP_ENDPOINTS.UPDATE_SETTINGS,
                payload
            );
            return extractData<WhatsAppSettings>(response);
        } catch (error: any) {
            console.error('WhatsApp update settings error:', error);
            throw error;
        }
    }

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
    async sendPrescription(prescriptionId: string, options?: WhatsAppPdfPayload): Promise<WhatsAppSendResponse> {
        try {
            const payload: Record<string, string> = { prescription_id: prescriptionId };
            if (options?.phone) {
                payload.patient_phone = options.phone;
            }
            if (options?.pdfBase64) {
                payload.pdf_base64 = options.pdfBase64;
            }
            if (options?.pdfFilename) {
                payload.pdf_filename = options.pdfFilename;
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
    async sendInvoice(invoiceId: string, options?: WhatsAppPdfPayload): Promise<WhatsAppSendResponse> {
        try {
            const payload: Record<string, string> = { invoice_id: invoiceId };
            if (options?.phone) {
                payload.patient_phone = options.phone;
            }
            if (options?.pdfBase64) {
                payload.pdf_base64 = options.pdfBase64;
            }
            if (options?.pdfFilename) {
                payload.pdf_filename = options.pdfFilename;
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
        clinic?: string,
        options?: {
            limit?: number;
            offset?: number;
            messageType?: string;
            status?: string;
            dateFrom?: string;
            dateTo?: string;
            recipientSearch?: string;
        }
    ): Promise<WhatsAppLogsResponse> {
        try {
            const params = new URLSearchParams();
            if (clinic) params.append('clinic', clinic);
            if (options?.limit) params.append('limit', String(options.limit));
            if (options?.offset) params.append('offset', String(options.offset));
            if (options?.messageType) params.append('message_type', options.messageType);
            if (options?.status) params.append('status', options.status);
            if (options?.dateFrom) params.append('date_from', options.dateFrom);
            if (options?.dateTo) params.append('date_to', options.dateTo);
            if (options?.recipientSearch) params.append('recipient_search', options.recipientSearch);

            const response = await apiClient.get<WhatsAppLogsResponse>(
                `${WHATSAPP_ENDPOINTS.GET_LOGS}?${params.toString()}`
            );
            return extractData<WhatsAppLogsResponse>(response);
        } catch (error: any) {
            console.error('WhatsApp get logs error:', error);
            return { success: false, error: error.message || 'Failed to get logs' };
        }
    }

    async getConversations(options?: { clinic?: string; search?: string; unreadOnly?: boolean; limit?: number; offset?: number }): Promise<WhatsAppConversationsResponse> {
        try {
            const params = new URLSearchParams();
            if (options?.clinic) params.append('clinic', options.clinic);
            if (options?.search) params.append('search', options.search);
            if (options?.unreadOnly) params.append('unread_only', '1');
            if (options?.limit) params.append('limit', String(options.limit));
            if (options?.offset) params.append('offset', String(options.offset));

            const response = await apiClient.get<WhatsAppConversationsResponse>(
                `${WHATSAPP_ENDPOINTS.GET_CONVERSATIONS}?${params.toString()}`
            );
            return extractData<WhatsAppConversationsResponse>(response);
        } catch (error: any) {
            console.error('WhatsApp get conversations error:', error);
            throw error;
        }
    }

    async getConversationMessages(conversationId: string, options?: { clinic?: string; limit?: number; offset?: number }): Promise<WhatsAppConversationMessagesResponse> {
        try {
            const params = new URLSearchParams();
            params.append('conversation_id', conversationId);
            if (options?.clinic) params.append('clinic', options.clinic);
            if (options?.limit) params.append('limit', String(options.limit));
            if (options?.offset) params.append('offset', String(options.offset));

            const response = await apiClient.get<WhatsAppConversationMessagesResponse>(
                `${WHATSAPP_ENDPOINTS.GET_CONVERSATION_MESSAGES}?${params.toString()}`
            );
            return extractData<WhatsAppConversationMessagesResponse>(response);
        } catch (error: any) {
            console.error('WhatsApp get conversation messages error:', error);
            throw error;
        }
    }

    async markConversationRead(conversationId: string, clinic?: string): Promise<{ message: string; data: { conversation_id: string; unread_count: number } }> {
        const payload: Record<string, string> = { conversation_id: conversationId };
        if (clinic) payload.clinic = clinic;
        const response = await apiClient.post<{ message: string; data: { conversation_id: string; unread_count: number } }>(
            WHATSAPP_ENDPOINTS.MARK_CONVERSATION_READ,
            payload
        );
        return extractData(response);
    }

    async sendConversationReply(payload: {
        conversation_id: string;
        clinic?: string;
        message_text?: string;
        template_name?: string;
        template_params?: string[];
    }): Promise<any> {
        const reqPayload: Record<string, any> = { ...payload };
        if (payload.template_params) {
            reqPayload.template_params = JSON.stringify(payload.template_params);
        }
        const response = await apiClient.post<any>(WHATSAPP_ENDPOINTS.SEND_CONVERSATION_REPLY, reqPayload);
        return extractData(response);
    }

    async getWhatsAppStats(options?: {
        clinic?: string;
        dateFrom?: string;
        dateTo?: string;
        granularity?: 'day' | 'week' | 'month';
    }): Promise<WhatsAppStatsResponse> {
        const params = new URLSearchParams();
        if (options?.clinic) params.append('clinic', options.clinic);
        if (options?.dateFrom) params.append('date_from', options.dateFrom);
        if (options?.dateTo) params.append('date_to', options.dateTo);
        if (options?.granularity) params.append('granularity', options.granularity);

        const response = await apiClient.get<WhatsAppStatsResponse>(`${WHATSAPP_ENDPOINTS.GET_STATS}?${params.toString()}`);
        return extractData(response);
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
