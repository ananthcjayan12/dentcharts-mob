import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getStoredToken, clearStoredToken } from '../utils/storage';

// API Response wrapper interface
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
  status_code?: number;
}

// API Error interface
export interface ApiError {
  message: string;
  status_code: number;
  error_details?: any;
}

// Base API configuration
const API_CONFIG = {
  // IMPORTANT: Use dev2.localhost so cookies work across frontend and backend
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://dev2.localhost:8800',
  timeout: 30000, // 30 seconds
  withCredentials: true, // Send cookies with every request for Frappe session management
  headers: {
    'Content-Type': 'application/json',
  },
};

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create(API_CONFIG);
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token and ensure credentials
    this.client.interceptors.request.use(
      (config) => {
        // CRITICAL: Ensure withCredentials is set for every request
        config.withCredentials = true;

        const token = getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
          console.log(`🍪 Sending cookies:`, document.cookie);
        }

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle common errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        }

        return response;
      },
      (error) => {
        console.error('API Error:', error);

        // Handle network errors
        if (!error.response) {
          return Promise.reject({
            message: 'Network error. Please check your internet connection.',
            status_code: 0,
          } as ApiError);
        }

        const { status, data } = error.response;

        // Handle authentication errors
        if (status === 401) {
          clearStoredToken();
          window.location.href = '/login';
          return Promise.reject({
            message: 'Session expired. Please login again.',
            status_code: 401,
          } as ApiError);
        }

        // Handle other common errors
        const apiError: ApiError = {
          message: data?.message || 'An unexpected error occurred',
          status_code: status,
          error_details: data,
        };

        return Promise.reject(apiError);
      }
    );
  }

  // GET request
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, config);
    const responseData = response.data;

    // Handle Frappe's nested response structure
    if (responseData.message && typeof responseData.message === 'object') {
      const messageObj = responseData.message;

      // Check if this is a paginated response (has data array + pagination fields)
      if (messageObj.data && Array.isArray(messageObj.data) &&
        (messageObj.total_count !== undefined || messageObj.page_length !== undefined)) {
        // Return the entire message object as data (includes data, total_count, page_length, start)
        return {
          message: messageObj.message || 'Success',
          data: messageObj as T,
        };
      }

      // Regular nested response with data field
      if (messageObj.data !== undefined) {
        return {
          message: messageObj.message || 'Success',
          data: messageObj.data,
        };
      }

      // Message object is the data itself
      return {
        message: messageObj.message || 'Success',
        data: messageObj as T,
      };
    }

    // Direct structure
    return {
      message: 'Success',
      data: responseData,
    };
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.post(endpoint, data);

    // Handle Frappe's nested response structure
    // Frappe returns: { message: { message: "...", data: {...} } }
    const responseData = response.data;

    if (responseData.message && typeof responseData.message === 'object') {
      const messageObj = responseData.message;

      // Check if this is a paginated response
      if (messageObj.data && Array.isArray(messageObj.data) &&
        (messageObj.total_count !== undefined || messageObj.page_length !== undefined)) {
        return {
          message: messageObj.message || 'Success',
          data: messageObj as T,
        };
      }

      // Regular nested response with data field
      if (messageObj.data !== undefined) {
        return {
          message: messageObj.message || 'Success',
          data: messageObj.data,
        };
      }

      // Message object is the data itself
      return {
        message: messageObj.message || 'Success',
        data: messageObj as T,
      };
    }

    // Direct structure
    return {
      message: 'Success',
      data: responseData,
    };
  }

  // PUT request
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data, config);
    const responseData = response.data;

    // Handle Frappe's nested response structure
    if (responseData.message && typeof responseData.message === 'object') {
      const messageObj = responseData.message;

      if (messageObj.data !== undefined) {
        return {
          message: messageObj.message || 'Success',
          data: messageObj.data,
        };
      }

      return {
        message: messageObj.message || 'Success',
        data: messageObj as T,
      };
    }

    return {
      message: 'Success',
      data: responseData,
    };
  }

  // PATCH request
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch(url, data, config);
    const responseData = response.data;

    // Handle Frappe's nested response structure
    if (responseData.message && typeof responseData.message === 'object') {
      const messageObj = responseData.message;

      if (messageObj.data !== undefined) {
        return {
          message: messageObj.message || 'Success',
          data: messageObj.data,
        };
      }

      return {
        message: messageObj.message || 'Success',
        data: messageObj as T,
      };
    }

    return {
      message: 'Success',
      data: responseData,
    };
  }

  // DELETE request
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url, config);
    const responseData = response.data;

    // Handle Frappe's nested response structure
    if (responseData.message && typeof responseData.message === 'object') {
      const messageObj = responseData.message;

      if (messageObj.data !== undefined) {
        return {
          message: messageObj.message || 'Success',
          data: messageObj.data,
        };
      }

      return {
        message: messageObj.message || 'Success',
        data: messageObj as T,
      };
    }

    return {
      message: 'Success',
      data: responseData,
    };
  }

  // File upload with progress
  async upload<T>(
    url: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });

    const responseData = response.data;

    // Handle Frappe's nested response structure
    if (responseData.message && typeof responseData.message === 'object') {
      return {
        message: responseData.message.message || 'File uploaded successfully',
        data: responseData.message.data || responseData.message,
      };
    }

    return {
      message: 'File uploaded successfully',
      data: responseData,
    };
  }

  // Get raw axios instance for advanced usage
  getClient(): AxiosInstance {
    return this.client;
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// API endpoints based on Postman collection
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/method/mob_clinic.mob_clinic.api.auth.mobile_login',
    REGISTER: '/api/method/mob_clinic.mob_clinic.api.auth.mobile_register',
    LOGOUT: '/api/method/mob_clinic.mob_clinic.api.auth.mobile_logout',
    PROFILE: '/api/method/mob_clinic.mob_clinic.api.auth.get_practitioner_profile',
    UPDATE_PROFILE: '/api/method/mob_clinic.mob_clinic.api.auth.update_practitioner_profile',
  },

  // Patient Management
  PATIENTS: {
    CREATE: '/api/method/mob_clinic.mob_clinic.api.patient.create_patient',
    GET: '/api/method/mob_clinic.mob_clinic.api.patient.get_patient',
    LIST: '/api/method/mob_clinic.mob_clinic.api.patient.get_patients',
    UPDATE: '/api/method/mob_clinic.mob_clinic.api.patient.update_patient',
    DELETE: '/api/method/mob_clinic.mob_clinic.api.patient.delete_patient',
    SEARCH: '/api/method/mob_clinic.mob_clinic.api.patient.search_patients',
  },

  // Appointment Management
  APPOINTMENTS: {
    CREATE: '/api/method/mob_clinic.mob_clinic.api.appointment.create_appointment',
    GET: '/api/method/mob_clinic.mob_clinic.api.appointment.get_appointment',
    LIST: '/api/method/mob_clinic.mob_clinic.api.appointment.get_appointments',
    UPDATE: '/api/method/mob_clinic.mob_clinic.api.appointment.update_appointment',
    DELETE: '/api/method/mob_clinic.mob_clinic.api.appointment.delete_appointment',
    CANCEL: '/api/method/mob_clinic.mob_clinic.api.appointment.cancel_appointment',
    ADD_TO_QUEUE: '/api/method/mob_clinic.mob_clinic.api.appointment.add_to_todays_queue',
    GET_QUEUE: '/api/method/mob_clinic.mob_clinic.api.appointment.get_todays_queue',
    AVAILABLE_SLOTS: '/api/method/mob_clinic.mob_clinic.api.appointment.get_available_slots',
  },

  // Prescription Management
  PRESCRIPTIONS: {
    CREATE: '/api/method/mob_clinic.mob_clinic.api.prescription.create_prescription',
    GET: '/api/method/mob_clinic.mob_clinic.api.prescription.get_prescription',
    LIST: '/api/method/mob_clinic.mob_clinic.api.prescription.get_prescriptions',
    UPDATE: '/api/method/mob_clinic.mob_clinic.api.prescription.update_prescription',
    DELETE: '/api/method/mob_clinic.mob_clinic.api.prescription.delete_prescription',
    SHARE: '/api/method/mob_clinic.mob_clinic.api.prescription.share_prescription',
    PATIENT_HISTORY: '/api/method/mob_clinic.mob_clinic.api.prescription.get_patient_history',
  },

  // Payment & Invoice Management
  PAYMENTS: {
    CREATE_INVOICE: '/api/method/mob_clinic.mob_clinic.api.payment.create_invoice',
    GET_INVOICE: '/api/method/mob_clinic.mob_clinic.api.payment.get_invoice',
    LIST_INVOICES: '/api/method/mob_clinic.mob_clinic.api.payment.get_invoices',
    UPDATE_PAYMENT: '/api/method/mob_clinic.mob_clinic.api.payment.update_payment',
    DELETE_INVOICE: '/api/method/mob_clinic.mob_clinic.api.payment.delete_invoice',
    PAYMENT_SUMMARY: '/api/method/mob_clinic.mob_clinic.api.payment.get_payment_summary',
    PAY_PENDING: '/api/method/mob_clinic.mob_clinic.api.payment.pay_patient_pending_invoices',
    SEND_REMINDER: '/api/method/mob_clinic.mob_clinic.api.payment.send_payment_reminder',
  },

  // File Upload & Management
  FILES: {
    UPLOAD: '/api/method/mob_clinic.mob_clinic.api.file_upload.upload_file',
    GET: '/api/method/mob_clinic.mob_clinic.api.file_upload.get_file',
    LIST: '/api/method/mob_clinic.mob_clinic.api.file_upload.list_files',
    DELETE: '/api/method/mob_clinic.mob_clinic.api.file_upload.delete_file',
    CATEGORIES: '/api/method/mob_clinic.mob_clinic.api.file_upload.get_file_categories',
  },

  // Dental Chart Management
  DENTAL_CHART: {
    GET: '/api/method/mob_clinic.mob_clinic.api.dental_chart.get_dental_chart',
    SAVE: '/api/method/mob_clinic.mob_clinic.api.dental_chart.save_dental_chart',
    ADD_CONDITION: '/api/method/mob_clinic.mob_clinic.api.dental_chart.add_condition',
    UPDATE_CONDITION: '/api/method/mob_clinic.mob_clinic.api.dental_chart.update_condition',
    REMOVE_CONDITION: '/api/method/mob_clinic.mob_clinic.api.dental_chart.remove_condition',
    GET_CONDITION_HISTORY: '/api/method/mob_clinic.mob_clinic.api.dental_chart.get_condition_history',
    GET_CONDITION_TYPES: '/api/method/mob_clinic.mob_clinic.api.dental_chart.get_condition_types',
    ADD_PROCEDURE: '/api/method/mob_clinic.mob_clinic.api.dental_chart.add_procedure',
    UPDATE_PROCEDURE: '/api/method/mob_clinic.mob_clinic.api.dental_chart.update_procedure',
    REMOVE_PROCEDURE: '/api/method/mob_clinic.mob_clinic.api.dental_chart.remove_procedure',
    GET_PROCEDURE_TIMELINE: '/api/method/mob_clinic.mob_clinic.api.dental_chart.get_procedure_timeline',
    GET_PROCEDURE_TYPES: '/api/method/mob_clinic.mob_clinic.api.dental_chart.get_procedure_types',
    GET_SUMMARY: '/api/method/mob_clinic.mob_clinic.api.dental_chart.get_chart_summary',
    EXPORT: '/api/method/mob_clinic.mob_clinic.api.dental_chart.export_chart',
    GET_TREATMENT_PROGRESS: '/api/method/mob_clinic.mob_clinic.api.dental_chart.get_treatment_progress',
    GET_CHART_TYPES: '/api/method/mob_clinic.mob_clinic.api.dental_chart.get_chart_types',
    GET_TOOTH_STATUS_OPTIONS: '/api/method/mob_clinic.mob_clinic.api.dental_chart.get_tooth_status_options',
  },
  // Clinic Settings & Profile
  CLINIC_PROFILE: {
    GET: '/api/method/mob_clinic.mob_clinic.api.clinic_profile.get_clinic_profile',
    UPDATE_BASIC: '/api/method/mob_clinic.mob_clinic.api.clinic_profile.update_basic_info',
    UPDATE_ADDRESS: '/api/method/mob_clinic.mob_clinic.api.clinic_profile.update_address',
    UPDATE_BRANDING: '/api/method/mob_clinic.mob_clinic.api.clinic_profile.update_branding',
    UPDATE_INVOICE: '/api/method/mob_clinic.mob_clinic.api.clinic_profile.update_invoice_settings',
    UPDATE_NOTIFICATIONS: '/api/method/mob_clinic.mob_clinic.api.clinic_profile.update_notification_templates',
    UPDATE_SOCIAL: '/api/method/mob_clinic.mob_clinic.api.clinic_profile.update_social_media',
    UPDATE_ADDITIONAL: '/api/method/mob_clinic.mob_clinic.api.clinic_profile.update_additional_settings',
    UPLOAD_LOGO: '/api/method/mob_clinic.mob_clinic.api.clinic_profile.upload_logo',
    UPLOAD_DOCUMENT: '/api/method/mob_clinic.mob_clinic.api.clinic_profile.upload_document',
  },

  // Procedures Management
  PROCEDURES: {
    GET: '/api/method/mob_clinic.mob_clinic.api.procedures.get_procedures',
    CREATE_CUSTOM: '/api/method/mob_clinic.mob_clinic.api.procedures.create_custom_procedure',
    UPDATE_CUSTOM: '/api/method/mob_clinic.mob_clinic.api.procedures.update_custom_procedure',
    OVERRIDE_TEMPLATE: '/api/method/mob_clinic.mob_clinic.api.procedures.override_template_procedure',
    DELETE_CUSTOM: '/api/method/mob_clinic.mob_clinic.api.procedures.delete_custom_procedure',
    GET_CATEGORIES: '/api/method/mob_clinic.mob_clinic.api.procedures.get_procedure_categories',
  },

  // Conditions Management
  CONDITIONS: {
    GET: '/api/method/mob_clinic.mob_clinic.api.conditions.get_conditions',
    CREATE_CUSTOM: '/api/method/mob_clinic.mob_clinic.api.conditions.create_custom_condition',
    OVERRIDE_TEMPLATE: '/api/method/mob_clinic.mob_clinic.api.conditions.override_template_condition',
    DELETE_CUSTOM: '/api/method/mob_clinic.mob_clinic.api.conditions.delete_custom_condition',
    GET_CATEGORIES: '/api/method/mob_clinic.mob_clinic.api.conditions.get_condition_categories',
    GET_TYPES: '/api/method/mob_clinic.mob_clinic.api.conditions.get_condition_types',
  },

  // Dashboard Management
  DASHBOARD: {
    GET_STATS: '/api/method/mob_clinic.mob_clinic.api.dashboard.get_financial_stats',
    GET_COLLECTION: '/api/method/mob_clinic.mob_clinic.api.dashboard.get_collection_summary',
  },
} as const;

export default apiClient;