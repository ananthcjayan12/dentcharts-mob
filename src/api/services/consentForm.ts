import { apiClient, API_ENDPOINTS } from '../client';
import { ConsentTemplate, ConsentTemplatesResponse, SharedConsentPayload } from '../types';

export interface GetConsentTemplatesParams {
  clinic?: string;
  doctor?: string;
  language?: 'en' | 'ml';
  include_inactive?: boolean;
  for_settings?: boolean;
}

export interface SaveConsentTemplatePayload {
  name?: string;
  clinic?: string;
  doctor?: string | null;
  consent_type_id: string;
  consent_type_label: string;
  language: 'en' | 'ml';
  is_active?: boolean | number;
  sort_order?: number;
  source?: string;
  summary_text?: string;
  sections: any[];
  declaration_text?: string;
  guardian_declaration_text?: string;
  meta?: Record<string, any>;
}

export interface CreateConsentShareLinkPayload {
  patient_id: string;
  consent_type_id: string;
  language: 'en' | 'ml';
  clinic?: string;
  doctor?: string;
  payload?: Record<string, any>;
  summary_text?: string;
  expires_in_hours?: number;
  app_base_url?: string;
}

export interface AcceptSharedConsentPayload {
  token: string;
  signer_name?: string;
  signer_role?: 'Patient' | 'Parent/Guardian';
  signer_phone?: string;
  signature_data_url: string;
  consent_html?: string;
  summary_text?: string;
}

export interface SaveConsentArtifactsPayload {
  patient_id: string;
  consent_type_id: string;
  language: 'en' | 'ml';
  clinic?: string;
  summary_text?: string;
  signature_data_url?: string;
  consent_html?: string;
}

class ConsentFormService {
  async getConsentTemplates(params: GetConsentTemplatesParams = {}): Promise<ConsentTemplatesResponse> {
    const query = new URLSearchParams();
    if (params.clinic) query.set('clinic', params.clinic);
    if (params.doctor) query.set('doctor', params.doctor);
    if (params.language) query.set('language', params.language);
    if (params.include_inactive) query.set('include_inactive', '1');
    if (params.for_settings) query.set('for_settings', '1');

    const response = await apiClient.get<ConsentTemplatesResponse>(
      `${API_ENDPOINTS.CONSENT_FORMS.GET_TEMPLATES}${query.toString() ? `?${query.toString()}` : ''}`
    );

    if (!response.data) {
      throw new Error(response.message || 'Failed to load consent templates');
    }

    return response.data;
  }

  async saveConsentTemplate(payload: SaveConsentTemplatePayload): Promise<ConsentTemplate> {
    const response = await apiClient.post<ConsentTemplate>(API_ENDPOINTS.CONSENT_FORMS.SAVE_TEMPLATE, {
      clinic: payload.clinic,
      template: JSON.stringify(payload),
    });

    if (!response.data) {
      throw new Error(response.message || 'Failed to save consent template');
    }

    return response.data;
  }

  async deleteConsentTemplate(name: string, clinic?: string): Promise<{ name: string }> {
    const response = await apiClient.post<{ name: string }>(API_ENDPOINTS.CONSENT_FORMS.DELETE_TEMPLATE, {
      name,
      clinic,
    });

    if (!response.data) {
      throw new Error(response.message || 'Failed to delete consent template');
    }

    return response.data;
  }

  async createShareLink(payload: CreateConsentShareLinkPayload): Promise<{
    session_id: string;
    token: string;
    share_url: string;
    relative_path: string;
    expires_on: string;
  }> {
    const response = await apiClient.post<any>(API_ENDPOINTS.CONSENT_FORMS.CREATE_SHARE_LINK, {
      ...payload,
      payload: payload.payload ? JSON.stringify(payload.payload) : undefined,
    });

    if (!response.data) {
      throw new Error(response.message || 'Failed to create share link');
    }

    return response.data;
  }

  async saveConsentArtifacts(payload: SaveConsentArtifactsPayload): Promise<{
    summary_text: string;
    signature_file_id?: string;
    consent_file_id?: string;
  }> {
    const response = await apiClient.post<any>(API_ENDPOINTS.CONSENT_FORMS.SAVE_ARTIFACTS, payload);

    if (!response.data) {
      throw new Error(response.message || 'Failed to save consent files');
    }

    return response.data;
  }

  async getSharedConsent(token: string): Promise<SharedConsentPayload> {
    const response = await apiClient.get<SharedConsentPayload>(
      `${API_ENDPOINTS.CONSENT_FORMS.GET_SHARED}?token=${encodeURIComponent(token)}`
    );

    if (!response.data) {
      throw new Error(response.message || 'Failed to load shared consent');
    }

    return response.data;
  }

  async acceptSharedConsent(payload: AcceptSharedConsentPayload): Promise<{
    session_id: string;
    status: 'Created' | 'Signed' | 'Expired';
    signature_file_id?: string;
    consent_file_id?: string;
  }> {
    const response = await apiClient.post<any>(API_ENDPOINTS.CONSENT_FORMS.ACCEPT_SHARED, payload);

    if (!response.data) {
      throw new Error(response.message || 'Failed to submit signed consent');
    }

    return response.data;
  }
}

export const consentFormService = new ConsentFormService();
