// API-specific types based on the Postman collection responses

// Base API response structure
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
  status_code?: number;
}

// Pagination interface
export interface PaginationParams {
  limit_page_length?: number;
  limit_start?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total_count: number;
  page_length: number;
  start: number;
}

// Authentication related types
export interface LoginRequest {
  usr: string;
  pwd: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  clinic_name: string;
}

export interface LoginResponse {
  message: string;
  user: {
    email: string;
    full_name: string;
    mobile: string;
    practitioner_id: string;
    clinic?: {
      name: string;
      description?: string;
      logo?: string;
      working_hours?: any[];
      practitioner_id?: string;
    };
    clinics?: string[];
    active_clinic?: string;
    primary_clinic?: string;
    is_clinic_admin?: boolean;
    allowed_pages?: string[];
    permissions?: {
      is_clinic_admin: boolean;
      allowed_pages: string[];
    };
  };
}

export interface PractitionerProfile {
  name: string;
  practitioner_name: string;
  email: string;
  mobile: string;
  consultation_fee?: number;
  clinic_description?: string;
  online_consultation?: number;
  years_of_experience?: number;
  is_clinic_admin?: boolean;
  allowed_pages?: string[];
  permissions?: {
    is_clinic_admin: boolean;
    allowed_pages: string[];
  };
  start_time?: string;
  end_time?: string;
}

export interface ClinicPractitionerPermission {
  practitioner_id: string;
  practitioner_name: string;
  user_id?: string;
  primary_company: string;
  is_clinic_admin: boolean;
  allowed_pages: string[];
}

export interface ClinicPractitionerPermissionsResponse {
  clinic: string;
  practitioners: ClinicPractitionerPermission[];
}

export interface ClinicPractitionerSchedule {
  practitioner_id: string;
  practitioner_name: string;
  user_id?: string;
  primary_company: string;
  start_time?: string | null;
  end_time?: string | null;
  slot_duration?: number | null;
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

// Practitioner list response type
export interface PractitionerResponse {
  name: string; // Practitioner ID from Frappe
  practitioner_name: string;
  email?: string;
  mobile?: string;
  department?: string;
  designation?: string;
  specialization?: string;
  status?: string;
  available?: boolean;
  appointment_slot_duration?: number | null;
}

// Patient related types
export interface CreatePatientRequest {
  first_name: string;
  last_name: string;
  sex: 'Male' | 'Female' | 'Other';
  mobile: string;
  email?: string;
  dob?: string;
  age?: number;
  address?: string;
  occupation?: string;
  registration_date?: string;
  medical_history?: string; // JSON string containing medical history data
}

export interface PatientResponse {
  registration_date: string | number | Date;
  name: string; // Patient ID/name from Frappe
  patient_id?: string; // Alias for name
  patient_name: string;
  sex: string;
  mobile: string;
  email?: string;
  dob: string;
  address?: string;
  occupation?: string;
  age?: number | null;
  blood_group?: string;
  status?: string;
  image?: string | null;
  avatar?: string | null;
  preferred_language?: string;
  last_visit?: string | null;
  total_visits?: number;
  pending_amount?: number;
  doctor?: string | null;
  doctor_name?: string | null;
  practitioner?: string | null;
  practitioner_name?: string | null;
}

export interface UpdatePatientRequest {
  patient_id: string;
  first_name?: string;
  last_name?: string;
  patient_name?: string;
  email?: string;
  mobile?: string;
  address?: string;
  occupation?: string;
  dob?: string;
  age?: number;
  sex?: 'Male' | 'Female' | 'Other';
  blood_group?: string;
  marital_status?: string;
  profile_image?: string;
  medical_history?: string; // JSON string
  insurance_details?: string;
}

export interface PatientSearchParams {
  search_term: string;
  limit?: number;
}

// Appointment related types
export interface AvailableSlot {
  time: string;
  available: boolean;
  appointment?: AppointmentResponse; // Existing appointment at this time slot (if any)
  // Number of existing appointments/bookings for this slot (if provided by API)
  existing_appointments?: number;
  // Optional occupancy percentage or count returned by some endpoints
  occupancy?: number;
}

export interface AvailableSlotsResponse {
  date: string;
  is_working_day: boolean;
  working_hours: {
    start: string;
    end: string;
  };
  slot_duration: string;
  total_slots: number;
  available_slots: string[];
  slots: AvailableSlot[];
  booked_count: number;
}

export interface GetAvailableSlotsParams {
  date: string;
  practitioner?: string;
  duration?: number;
}

export interface CreateAppointmentRequest {
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  duration?: number;
  notes?: string;
  chief_complaint?: string;
  practitioner?: string;
  appointment_type?: 'Booking' | 'Walk In';
}

export interface AppointmentResponse {
  name?: string; // Frappe appointment ID (HLC-APP-2025-00195)
  appointment_id?: string; // Alias for name
  patient?: string; // Frappe patient ID
  patient_id?: string; // Alias for patient
  patient_name: string;
  patient_mobile?: string;
  patient_email?: string;
  patient_image?: string | null;
  appointment_date?: string;
  appointment_time?: string;
  appointment_datetime: string;
  duration: number;
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Open' | 'Waiting' | 'In Progress' | 'Pending Payment';
  appointment_type?: string;
  chief_complaint?: string;
  notes?: string;
  location?: string;
  practitioner?: string;
  practitioner_name?: string; // Human-readable practitioner name
  invoiced?: number;
  paid_amount?: number;
  booked_via_app?: number;
  can_reschedule?: boolean;
  can_cancel?: boolean;

  // Status flow tracking fields
  check_in_time?: string;
  start_time?: string;
  end_time?: string;
  payment_time?: string;
  review_requested?: boolean;
  review_requested_time?: string;
  invoice_id?: string;
  invoice_status?: 'Unpaid' | 'Paid' | 'Partially Paid';
}

export interface UpdateAppointmentRequest {
  appointment_id: string;
  appointment_date?: string;
  appointment_time?: string;
  duration?: number;
  notes?: string;
  appointment_type?: string;
  type?: string;
  practitioner?: string;
  appointment_for?: string;
}

export interface CancelAppointmentRequest {
  appointment_id: string;
  reason: string;
  appointment_type?: string;
  type?: string;
  practitioner?: string;
  appointment_for?: string;
}

// Prescription related types
export interface Medication {
  drug_code?: string;
  drug_name: string;
  dosage?: string;
  period?: string;
  dosage_form?: string;
  interval?: string;
  comment?: string;
}

export interface Investigation {
  lab_test_code: string;
  lab_test_name: string;
  lab_test_comment?: string;
}

export interface CreatePrescriptionRequest {
  patient_id: string;
  appointment_id?: string;
  practitioner?: string;
  chief_complaint?: string;
  symptoms?: string;
  diagnosis?: string;
  treatment_plan?: string;
  medications?: Medication[];
  investigations?: Investigation[];
}

export interface PrescriptionResponse {
  name?: string; // Record ID from list API (HLC-ENC-2025-00075)
  record_id: string;
  patient_id: string;
  patient?: string; // Alias for patient_id in list API
  patient_name: string;
  practitioner_id?: string;
  practitioner?: string | {
    practitioner_id?: string;
    practitioner_name?: string;
    mobile?: string;
    department?: string;
  };
  practitioner_name?: string;
  posting_date: string;
  encounter_date?: string; // From list API
  encounter_time?: string; // From list API
  creation?: string; // From list API
  chief_complaint: string;
  symptoms: string;
  diagnosis: string;
  treatment_plan: string;
  medications: Medication[];
  investigations: Investigation[];
  status: string;
  medications_count?: number; // From list API
  investigations_count?: number; // From list API
  invoiced?: number; // From list API
  has_attachments?: any; // From list API
  can_edit?: boolean; // From list API
  can_share?: boolean; // From list API
  company?: string; // From list API
  docstatus?: number; // From list API
  medical_department?: string | null; // From list API
  patient_mobile?: string; // From list API
  patient_email?: string | null; // From list API
}

export interface UpdatePrescriptionRequest {
  record_id: string;
  chief_complaint?: string;
  symptoms?: string;
  diagnosis?: string;
  treatment_plan?: string;
  status?: string;
  follow_up_notes?: string;
}

export interface SharePrescriptionRequest {
  record_id: string;
  patient_email: string;
}

export interface PatientHistoryParams {
  patient_id: string;
  limit?: number;
  from_date?: string;
  to_date?: string;
}

// Payment related types
export interface InvoiceItem {
  item_code: string;
  qty: number;
  rate: number;
  description: string;
  consultant?: {
    consultant_id: string;
    commission_type: 'Percentage' | 'Fixed';
    commission_value: number;
    override?: boolean;
  };
  consultant_id?: string;
  consultant_name?: string;
  consultant_type?: string;
  consultant_practitioner?: string | null;
  consultant_commission_type?: string;
  consultant_commission_value?: number;
  consultant_commission_amount?: number;
  consultant_commission_source?: string;
}

export interface CreateInvoiceRequest {
  patient_id: string;
  appointment_id?: string;
  practitioner_id?: string;
  items: InvoiceItem[];
  posting_date: string;
  due_date: string;
  remarks?: string;
  discount_amount?: number;
  tax_amount?: number;
}

export interface InvoiceResponse {
  name: string; // Frappe ID
  invoice_id?: string; // Alias
  patient: string; // Frappe Patient ID
  patient_id?: string; // Alias
  patient_name: string;
  healthcare_practitioner?: string;
  posting_date: string;
  due_date: string;
  grand_total: number;
  outstanding_amount: number;
  paid_amount: number;
  is_overdue: boolean;
  status: string; // 'Paid' | 'Unpaid' | 'Partially Paid' | 'Overdue' logic often dynamic in backend
  items?: InvoiceItem[];
  total_consultant_commission?: number;
}

export interface UpdatePaymentRequest {
  invoice_id: string;
  paid_amount: number;
  mode_of_payment: string;
  payment_date: string;
  reference_no?: string;
  reference_date?: string;
}

export interface PaymentSummary {
  patient_id: string;
  patient_name: string;
  total_invoiced: number;
  total_paid: number;
  total_pending: number;
  invoice_count: number;
  pending_invoices_count: number;
  next_due_date?: string;
  pending_invoices?: Array<{
    invoice_id: string;
    date: string;
    due_date: string;
    amount: number;
    paid: number;
    pending: number;
    is_overdue: boolean;
  }>;
  // Legacy field names for backward compatibility
  paid_amount?: number;
  outstanding_amount?: number;
}

export interface SendPaymentReminderRequest {
  invoice_id: string;
  reminder_type: 'email' | 'sms';
  message?: string;
}

export interface ConsultantPayoutSummaryCard {
  consultant_id: string;
  consultant_name: string;
  consultant_type?: string | null;
  consultant_practitioner?: string | null;
  total_revenue: number;
  total_collected: number;
  total_commission: number;
  invoice_count: number;
  item_count: number;
  override_count: number;
}

export interface ConsultantPayoutRow {
  invoice_id: string;
  date: string;
  patient?: string;
  patient_name: string;
  procedure_name: string;
  item_code?: string;
  qty: number;
  total_invoiced: number;
  amount_received: number;
  consultant_id: string;
  consultant_name: string;
  commission_type: string;
  commission_value: number;
  commission_amount: number;
  commission_source?: string;
  payment_status: 'Paid' | 'Partly Paid' | 'Unpaid' | string;
}

export interface ConsultantPayoutReport {
  clinic?: string;
  from_date: string;
  to_date: string;
  selected_consultant_id?: string;
  summary: {
    total_revenue: number;
    total_collected: number;
    total_commission: number;
    consultant_count: number;
    item_count: number;
    invoice_count: number;
  };
  consultants: ConsultantPayoutSummaryCard[];
  rows: ConsultantPayoutRow[];
}

// File upload related types
export interface FileCategory {
  name: string;
  description: string;
}

export interface UploadFileRequest {
  file_name: string;
  content?: string;
  file_url?: string;
  decode_base64?: boolean;
  file_category: string;
  description?: string;
  reference_doctype?: string;
  reference_name?: string;
  is_private?: number;
}

export interface FileResponse {
  file_id: string;
  file_name: string;
  file_url: string;
  file_category: string;
  description?: string;
  file_size: number;
  creation: string;
  is_private: number;
}

export interface ListFilesParams {
  limit?: number;
  offset?: number;
  file_category?: string;
  reference_doctype?: string;
  reference_name?: string;
  search_term?: string;
}

export interface DeleteFileRequest {
  file_id: string;
}

// Dashboard/Statistics types (inferred from the mobile app)
export interface DashboardStats {
  total_patients: number;
  todays_appointments: number;
  pending_appointments: number;
  total_revenue: number;
  monthly_revenue: number;
  recent_patients: PatientResponse[];
  upcoming_appointments: AppointmentResponse[];
}

// Error types
export interface ApiError {
  message: string;
  status_code: number;
  error_details?: any;
}

// Filter types for list endpoints
export interface PatientFilters {
  sex?: string;
  age_min?: number;
  age_max?: number;
  search?: string;
}

export interface AppointmentFilters {
  status?: string;
  date_from?: string;
  date_to?: string;
  patient_id?: string;
  patient?: string;  // Frappe field name for patient filter
  practitioner?: string;
}

export interface PrescriptionFilters {
  patient_id?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
}

export interface InvoiceFilters {
  patient_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}
