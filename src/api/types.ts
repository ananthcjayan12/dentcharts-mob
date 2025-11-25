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
  medical_history?: string; // JSON string containing medical history data
}

export interface PatientResponse {
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
}

export interface UpdatePatientRequest {
  patient_id: string;
  email?: string;
  mobile?: string;
  address?: string;
  occupation?: string;
}

export interface PatientSearchParams {
  search_term: string;
  limit?: number;
}

// Appointment related types
export interface AvailableSlot {
  time: string;
  available: boolean;
}

export interface GetAvailableSlotsParams {
  date: string;
  duration?: number;
}

export interface CreateAppointmentRequest {
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  duration?: number;
  notes?: string;
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
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Open';
  appointment_type?: string;
  chief_complaint?: string;
  notes?: string;
  location?: string;
  practitioner?: string;
  invoiced?: number;
  paid_amount?: number;
  booked_via_app?: number;
  can_reschedule?: boolean;
  can_cancel?: boolean;
}

export interface UpdateAppointmentRequest {
  appointment_id: string;
  appointment_date?: string;
  appointment_time?: string;
  duration?: number;
  notes?: string;
}

export interface CancelAppointmentRequest {
  appointment_id: string;
  reason: string;
}

// Prescription related types
export interface Medication {
  drug_code: string;
  drug_name: string;
  dosage: string;
  period: string;
  dosage_form: string;
  interval: string;
  comment?: string;
}

export interface Investigation {
  lab_test_code: string;
  lab_test_name: string;
  lab_test_comment?: string;
}

export interface CreatePrescriptionRequest {
  patient_id: string;
  chief_complaint: string;
  symptoms: string;
  diagnosis: string;
  treatment_plan: string;
  medications: Medication[];
  investigations: Investigation[];
}

export interface PrescriptionResponse {
  name?: string; // Record ID from list API (HLC-ENC-2025-00075)
  record_id: string;
  patient_id: string;
  patient?: string; // Alias for patient_id in list API
  patient_name: string;
  practitioner_id?: string;
  practitioner?: string; // Alias for practitioner_id in list API
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
}

export interface CreateInvoiceRequest {
  patient_id: string;
  items: InvoiceItem[];
  posting_date: string;
  due_date: string;
  remarks?: string;
}

export interface InvoiceResponse {
  invoice_id: string;
  patient_id: string;
  patient_name: string;
  posting_date: string;
  due_date: string;
  grand_total: number;
  outstanding_amount: number;
  status: 'Paid' | 'Unpaid' | 'Partially Paid' | 'Overdue';
  items: InvoiceItem[];
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