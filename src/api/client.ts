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
  // In development, use proxy (empty baseURL means same origin)
  // In production, use the full API URL
  baseURL: process.env.NODE_ENV === 'production' 
    ? (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000')
    : '',
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
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
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
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  // POST request
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  // PUT request
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  // PATCH request
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  // DELETE request
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  // File upload with progress
  async upload<T>(
    url: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
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
    SEARCH: '/api/method/mob_clinic.mob_clinic.api.patient.search_patients',
  },

  // Appointment Management
  APPOINTMENTS: {
    CREATE: '/api/method/mob_clinic.mob_clinic.api.appointment.create_appointment',
    GET: '/api/method/mob_clinic.mob_clinic.api.appointment.get_appointment',
    LIST: '/api/method/mob_clinic.mob_clinic.api.appointment.get_appointments',
    UPDATE: '/api/method/mob_clinic.mob_clinic.api.appointment.update_appointment',
    CANCEL: '/api/method/mob_clinic.mob_clinic.api.appointment.cancel_appointment',
    AVAILABLE_SLOTS: '/api/method/mob_clinic.mob_clinic.api.appointment.get_available_slots',
  },

  // Prescription Management
  PRESCRIPTIONS: {
    CREATE: '/api/method/mob_clinic.mob_clinic.api.prescription.create_prescription',
    GET: '/api/method/mob_clinic.mob_clinic.api.prescription.get_prescription',
    LIST: '/api/method/mob_clinic.mob_clinic.api.prescription.get_prescriptions',
    UPDATE: '/api/method/mob_clinic.mob_clinic.api.prescription.update_prescription',
    SHARE: '/api/method/mob_clinic.mob_clinic.api.prescription.share_prescription',
    PATIENT_HISTORY: '/api/method/mob_clinic.mob_clinic.api.prescription.get_patient_history',
  },

  // Payment & Invoice Management
  PAYMENTS: {
    CREATE_INVOICE: '/api/method/mob_clinic.mob_clinic.api.payment.create_invoice',
    GET_INVOICE: '/api/method/mob_clinic.mob_clinic.api.payment.get_invoice',
    LIST_INVOICES: '/api/method/mob_clinic.mob_clinic.api.payment.get_invoices',
    UPDATE_PAYMENT: '/api/method/mob_clinic.mob_clinic.api.payment.update_payment',
    PAYMENT_SUMMARY: '/api/method/mob_clinic.mob_clinic.api.payment.get_payment_summary',
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
} as const;

export default apiClient;