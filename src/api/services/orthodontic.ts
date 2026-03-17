import { apiClient, API_ENDPOINTS } from '../client';

export interface OrthodonticCaseSummary {
  case_id: string;
  company: string;
  patient_id: string;
  patient_name: string;
  practitioner_id: string;
  practitioner_name?: string;
  case_type?: string;
  start_date?: string | null;
  estimated_duration_months?: number | null;
  estimated_end_date?: string | null;
  package_fee: number;
  discount_amount: number;
  discount_percentage: number;
  advance_paid: number;
  net_fee: number;
  total_paid: number;
  balance_amount: number;
  next_appointment_date?: string | null;
  last_visit_date?: string | null;
  last_payment_date?: string | null;
  status: string;
  notes?: string | null;
  default_followup_days?: number | null;
  is_active: number;
  consultant_id?: string | null;
  consultant_name?: string | null;
  consultant_type?: string | null;
  consultant_practitioner?: string | null;
  commission_model?: string | null;
  commission_type?: string | null;
  commission_value?: number;
  commission_basis?: string | null;
  total_commission_accrued: number;
  total_commission_paid: number;
  pending_commission_amount: number;
}

export interface OrthodonticLedgerEntry {
  ledger_entry_id: string;
  case_id: string;
  visit_date?: string | null;
  visit_notes?: string | null;
  payment_amount: number;
  payment_mode?: string | null;
  balance_after_entry: number;
  next_appointment_date?: string | null;
  sales_invoice?: string | null;
  payment_entry?: string | null;
  receipt_number?: string | null;
  created_by?: string | null;
  is_adjustment: number;
  adjustment_reason?: string | null;
  consultant_id?: string | null;
  consultant_name?: string | null;
  consultant_type?: string | null;
  consultant_practitioner?: string | null;
  commission_type?: string | null;
  commission_value: number;
  commission_amount: number;
  commission_source?: string | null;
  commission_basis?: string | null;
  commission_status: string;
  commission_payout_reference?: string | null;
  commission_paid_date?: string | null;
  commission_paid_amount: number;
  commission_note?: string | null;
}

export interface OrthodonticPayoutAllocation {
  ledger_entry: string;
  commission_accrued_amount: number;
  commission_paid_amount: number;
}

export interface OrthodonticPayout {
  payout_id: string;
  case_id: string;
  company?: string | null;
  consultant_id?: string | null;
  consultant_name?: string | null;
  consultant_practitioner?: string | null;
  posting_date?: string | null;
  paid_amount: number;
  payment_mode?: string | null;
  reference_no?: string | null;
  notes?: string | null;
  paid_by?: string | null;
  status: string;
  reversal_notes?: string | null;
  allocations: OrthodonticPayoutAllocation[];
}

export interface OrthodonticPatientSummary {
  case_id: string;
  recent_ledger: OrthodonticLedgerEntry[];
}

export interface OrthodonticSummaryResponse extends OrthodonticCaseSummary {
  recent_ledger: OrthodonticLedgerEntry[];
}

export interface OrthodonticDashboardSummary {
  active_cases: number;
  total_outstanding: number;
  collected_in_period: number;
  new_cases_in_period: number;
  patients_due_this_week: number;
  overdue_cases: number;
  commission_accrued_in_period: number;
  commission_unpaid: number;
  commission_paid_in_period: number;
}

export interface OrthodonticDashboardCaseRow {
  name: string;
  patient: string;
  patient_name: string;
  practitioner: string;
  practitioner_name?: string;
  balance_amount: number;
  next_appointment_date?: string | null;
  last_visit_date?: string | null;
  pending_commission_amount?: number;
}

export interface OrthodonticDashboardResponse {
  filters: {
    clinic?: string | null;
    from_date: string;
    to_date: string;
  };
  summary: OrthodonticDashboardSummary;
  active_cases: OrthodonticDashboardCaseRow[];
  due_this_week: OrthodonticDashboardCaseRow[];
  overdue_cases: OrthodonticDashboardCaseRow[];
}

export interface OrthodonticConsultantSummary {
  consultant_id?: string | null;
  consultant_name?: string | null;
  consultant_practitioner?: string | null;
  case_count: number;
  ledger_count: number;
  total_collected: number;
  total_commission_accrued: number;
  total_commission_paid: number;
  pending_commission: number;
}

export interface OrthodonticConsultantRow {
  ledger_entry_id: string;
  case_id: string;
  visit_date?: string | null;
  consultant_id?: string | null;
  consultant_name?: string | null;
  payment_amount: number;
  commission_amount: number;
  commission_paid_amount: number;
  commission_status: string;
}

export interface OrthodonticConsultantPayoutReport {
  filters: {
    clinic?: string | null;
    consultant_id?: string | null;
  };
  summary: {
    consultant_count: number;
    ledger_count: number;
    total_commission_accrued: number;
    total_commission_paid: number;
    total_pending_commission: number;
  };
  consultants: OrthodonticConsultantSummary[];
  rows: OrthodonticConsultantRow[];
}

export interface CreateOrthodonticCaseRequest {
  patient_id: string;
  practitioner_id?: string;
  consultant_id?: string;
  case_type?: string;
  start_date?: string;
  estimated_duration_months?: number | string;
  package_fee: number | string;
  discount_amount?: number | string;
  discount_percentage?: number | string;
  advance_paid?: number | string;
  advance_payment_mode?: string;
  default_followup_days?: number | string;
  status?: string;
  notes?: string;
  commission_model?: string;
  commission_type?: string;
  commission_value?: number | string;
  commission_basis?: string;
  clinic?: string;
}

export interface AddOrthodonticLedgerEntryRequest {
  case_id: string;
  visit_date?: string;
  visit_notes?: string;
  payment_amount?: number | string;
  payment_mode?: string;
  next_appointment_date?: string;
  create_receipt?: boolean | number;
  commission_override?: boolean | number;
  commission_type?: string;
  commission_value?: number | string;
  commission_basis?: string;
  commission_note?: string;
}

export interface CreateOrthodonticPayoutRequest {
  case_id: string;
  paid_amount: number | string;
  posting_date?: string;
  payment_mode?: string;
  reference_no?: string;
  notes?: string;
}

export const orthodonticService = {
  async getPatientSummary(patientId: string, clinic?: string | null): Promise<OrthodonticSummaryResponse | null> {
    const params = new URLSearchParams({ patient_id: patientId });
    if (clinic) {
      params.append('clinic', clinic);
    }

    const response = await apiClient.get<{ summary: OrthodonticSummaryResponse | null }>(
      `${API_ENDPOINTS.ORTHODONTIC.PATIENT_SUMMARY}?${params.toString()}`
    );
    return response.data?.summary ?? null;
  },

  async createCase(payload: CreateOrthodonticCaseRequest): Promise<{ case: OrthodonticCaseSummary }> {
    const response = await apiClient.post<{ case: OrthodonticCaseSummary }>(
      API_ENDPOINTS.ORTHODONTIC.CREATE_CASE,
      payload
    );
    return response.data!;
  },

  async updateCase(caseId: string, payload: Partial<CreateOrthodonticCaseRequest>): Promise<{ case: OrthodonticCaseSummary }> {
    const response = await apiClient.post<{ case: OrthodonticCaseSummary }>(
      API_ENDPOINTS.ORTHODONTIC.UPDATE_CASE,
      { case_id: caseId, ...payload }
    );
    return response.data!;
  },

  async getLedger(caseId: string): Promise<{ case: OrthodonticCaseSummary; ledger: OrthodonticLedgerEntry[] }> {
    const response = await apiClient.get<{ case: OrthodonticCaseSummary; ledger: OrthodonticLedgerEntry[] }>(
      `${API_ENDPOINTS.ORTHODONTIC.GET_LEDGER}?case_id=${encodeURIComponent(caseId)}`
    );
    return response.data!;
  },

  async addLedgerEntry(payload: AddOrthodonticLedgerEntryRequest): Promise<{ case: OrthodonticCaseSummary; ledger_entry: OrthodonticLedgerEntry }> {
    const response = await apiClient.post<{ case: OrthodonticCaseSummary; ledger_entry: OrthodonticLedgerEntry }>(
      API_ENDPOINTS.ORTHODONTIC.ADD_LEDGER_ENTRY,
      payload
    );
    return response.data!;
  },

  async createPayout(payload: CreateOrthodonticPayoutRequest): Promise<{ case: OrthodonticCaseSummary; payout: OrthodonticPayout }> {
    const response = await apiClient.post<{ case: OrthodonticCaseSummary; payout: OrthodonticPayout }>(
      API_ENDPOINTS.ORTHODONTIC.CREATE_PAYOUT,
      payload
    );
    return response.data!;
  },

  async listPayouts(caseId: string): Promise<{ payouts: OrthodonticPayout[] }> {
    const response = await apiClient.get<{ payouts: OrthodonticPayout[] }>(
      `${API_ENDPOINTS.ORTHODONTIC.LIST_PAYOUTS}?case_id=${encodeURIComponent(caseId)}`
    );
    return response.data!;
  },

  async reversePayout(payoutId: string, notes?: string): Promise<{ case: OrthodonticCaseSummary; payout: OrthodonticPayout }> {
    const response = await apiClient.post<{ case: OrthodonticCaseSummary; payout: OrthodonticPayout }>(
      API_ENDPOINTS.ORTHODONTIC.REVERSE_PAYOUT,
      { payout_id: payoutId, notes }
    );
    return response.data!;
  },

  async getPrintData(caseId: string): Promise<{ case: OrthodonticCaseSummary; patient: any; ledger: OrthodonticLedgerEntry[] }> {
    const response = await apiClient.get<{ case: OrthodonticCaseSummary; patient: any; ledger: OrthodonticLedgerEntry[] }>(
      `${API_ENDPOINTS.ORTHODONTIC.PRINT_DATA}?case_id=${encodeURIComponent(caseId)}`
    );
    return response.data!;
  },

  async getDashboard(params?: {
    clinic?: string | null;
    from_date?: string;
    to_date?: string;
  }): Promise<OrthodonticDashboardResponse> {
    const queryParams = new URLSearchParams();
    if (params?.clinic) queryParams.append('clinic', params.clinic);
    if (params?.from_date) queryParams.append('from_date', params.from_date);
    if (params?.to_date) queryParams.append('to_date', params.to_date);

    const response = await apiClient.get<OrthodonticDashboardResponse>(
      `${API_ENDPOINTS.ORTHODONTIC.DASHBOARD}?${queryParams.toString()}`
    );
    return response.data!;
  },

  async getConsultantPayoutReport(params?: {
    clinic?: string | null;
    consultant_id?: string;
  }): Promise<OrthodonticConsultantPayoutReport> {
    const queryParams = new URLSearchParams();
    if (params?.clinic) queryParams.append('clinic', params.clinic);
    if (params?.consultant_id) queryParams.append('consultant_id', params.consultant_id);

    const response = await apiClient.get<OrthodonticConsultantPayoutReport>(
      `${API_ENDPOINTS.ORTHODONTIC.CONSULTANT_PAYOUT_REPORT}?${queryParams.toString()}`
    );
    return response.data!;
  },
};
