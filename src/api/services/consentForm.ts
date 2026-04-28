import { apiClient, API_ENDPOINTS } from '../client';
import { ConsentRecord, ConsentTemplate, ConsentTemplatesResponse, SharedConsentPayload } from '../types';
import { consentTemplateSource, LocalConsentTemplateSource } from '../../data/consentTemplateSource';

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
  consent_pdf_base64?: string;
  consent_pdf_filename?: string;
  summary_text?: string;
}

export interface SaveConsentArtifactsPayload {
  patient_id: string;
  consent_type_id: string;
  consent_type_label?: string;
  language: 'en' | 'ml';
  clinic?: string;
  summary_text?: string;
  signature_data_url?: string;
  consent_html?: string;
  consent_pdf_base64?: string;
  consent_pdf_filename?: string;
  payload?: Record<string, any>;
  signer_name?: string;
  signer_role?: 'Patient' | 'Parent/Guardian';
}

class ConsentFormService {
  private buildTemplatesFromLocalSource(source: LocalConsentTemplateSource): ConsentTemplatesResponse {
    const templates: ConsentTemplate[] = [];

    const pushLanguageRows = (language: 'en' | 'ml', rows: Record<string, any>) => {
      Object.entries(rows || {}).forEach(([consentTypeId, payload], index) => {
        templates.push({
          name: `local-${consentTypeId}-${language}`,
          clinic: 'local',
          doctor: null,
          consent_type_id: consentTypeId,
          consent_type_label: payload.label || payload.short || payload.title || consentTypeId.replace(/_/g, ' '),
          language,
          is_active: 1,
          sort_order: index,
          source: 'seed',
          summary_text: payload.text || '',
          sections: Array.isArray(payload.sections) ? payload.sections.map((section: any) => {
            if (typeof section === 'string') {
              return { heading: null, body: section, items: [], numbered: [], footer: '' };
            }
            return {
              heading: section?.heading ?? null,
              body: section?.body || '',
              items: Array.isArray(section?.items) ? section.items : [],
              numbered: Array.isArray(section?.numbered) ? section.numbered : [],
              footer: section?.footer || '',
            };
          }) : [],
          declaration_text: '',
          guardian_declaration_text: '',
          meta: {},
        });
      });
    };

    pushLanguageRows('en', source.en || {});
    pushLanguageRows('ml', source.ml || {});

    const consentTypesMap = new Map<string, { consent_type_id: string; consent_type_label: string; languages: Array<'en' | 'ml'> }>();
    templates.forEach((row) => {
      if (!consentTypesMap.has(row.consent_type_id)) {
        consentTypesMap.set(row.consent_type_id, {
          consent_type_id: row.consent_type_id,
          consent_type_label: row.consent_type_label || row.consent_type_id,
          languages: [],
        });
      }
      const entry = consentTypesMap.get(row.consent_type_id)!;
      if (!entry.languages.includes(row.language as 'en' | 'ml')) {
        entry.languages.push(row.language as 'en' | 'ml');
      }
    });

    return {
      clinic: 'local',
      doctor: 'local',
      templates,
      consent_types: Array.from(consentTypesMap.values()),
    };
  }

  private mergeWithLocalSource(
    base: ConsentTemplatesResponse,
    source: LocalConsentTemplateSource
  ): ConsentTemplatesResponse {
    const local = this.buildTemplatesFromLocalSource(source);
    const mergedMap = new Map<string, ConsentTemplate>();

    (base.templates || []).forEach((row) => {
      mergedMap.set(`${row.consent_type_id}::${row.language}`, row);
    });

    (local.templates || []).forEach((row) => {
      mergedMap.set(`${row.consent_type_id}::${row.language}`, row);
    });

    const templates = Array.from(mergedMap.values()).sort((a, b) => {
      const sortGap = (a.sort_order || 0) - (b.sort_order || 0);
      if (sortGap !== 0) return sortGap;
      return (a.consent_type_label || a.consent_type_id).localeCompare(b.consent_type_label || b.consent_type_id);
    });

    const consentTypesMap = new Map<string, { consent_type_id: string; consent_type_label: string; languages: Array<'en' | 'ml'> }>();
    templates.forEach((row) => {
      if (!consentTypesMap.has(row.consent_type_id)) {
        consentTypesMap.set(row.consent_type_id, {
          consent_type_id: row.consent_type_id,
          consent_type_label: row.consent_type_label || row.consent_type_id,
          languages: [],
        });
      }
      const entry = consentTypesMap.get(row.consent_type_id)!;
      if (!entry.languages.includes(row.language as 'en' | 'ml')) {
        entry.languages.push(row.language as 'en' | 'ml');
      }
    });

    return {
      clinic: base.clinic,
      doctor: base.doctor,
      templates,
      consent_types: Array.from(consentTypesMap.values()),
    };
  }

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

    if (!params.for_settings) {
      return this.mergeWithLocalSource(response.data, consentTemplateSource);
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

  async listPatientConsents(patientId: string, clinic?: string): Promise<ConsentRecord[]> {
    const query = new URLSearchParams({ patient_id: patientId });
    if (clinic) query.set('clinic', clinic);

    const response = await apiClient.get<{ patient_id: string; records: ConsentRecord[] }>(
      `${API_ENDPOINTS.CONSENT_FORMS.LIST_PATIENT}?${query.toString()}`
    );

    if (!response.data) {
      throw new Error(response.message || 'Failed to load patient consents');
    }

    return response.data.records || [];
  }

  async deletePatientConsent(consentSessionId: string, clinic?: string): Promise<{ consent_session_id: string; deleted_file_id?: string }> {
    const response = await apiClient.post<{ consent_session_id: string; deleted_file_id?: string }>(
      API_ENDPOINTS.CONSENT_FORMS.DELETE_PATIENT_CONSENT,
      {
        consent_session_id: consentSessionId,
        clinic,
      }
    );

    if (!response.data) {
      throw new Error(response.message || 'Failed to delete consent record');
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
    consent_record?: ConsentRecord;
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
