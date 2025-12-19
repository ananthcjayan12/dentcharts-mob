import { apiClient, API_ENDPOINTS } from '../client';
import {
  CreateAppointmentRequest,
  AppointmentResponse,
  UpdateAppointmentRequest,
  CancelAppointmentRequest,
  GetAvailableSlotsParams,
  AvailableSlot,
  AvailableSlotsResponse,
  PaginationParams,
  PaginatedResponse,
  AppointmentFilters,
  ApiResponse,
} from '../types';

export class AppointmentService {
  /**
   * Get available time slots for a specific date
   */
  async getAvailableSlots(params: GetAvailableSlotsParams): Promise<AvailableSlot[]> {
    try {
      const queryParams = new URLSearchParams({
        date: params.date,
        duration: (params.duration || 30).toString(),
      });

      if (params.practitioner) {
        queryParams.append('practitioner', params.practitioner);
      }

      const response = await apiClient.get<any>(
        `${API_ENDPOINTS.APPOINTMENTS.AVAILABLE_SLOTS}?${queryParams.toString()}`
      );

      // Backend returns: { message: { message: "success", data: { slots: [...], ... } } }
      // ApiClient unwraps to: { message: "success", data: { slots: [...], ... } }
      if (response.data && response.data.slots) {
        return response.data.slots;
      }

      // Fallback if data is already the slots array
      if (Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Get available slots error:', error);
      throw error;
    }
  }

  /**
   * Create a new appointment
   */
  async createAppointment(appointmentData: CreateAppointmentRequest): Promise<{ appointment_id: string }> {
    try {
      const response = await apiClient.post<{ appointment_id: string }>(
        API_ENDPOINTS.APPOINTMENTS.CREATE,
        appointmentData
      );

      if (response.data && response.message === 'Appointment created successfully') {
        return response.data;
      }

      throw new Error(response.message || 'Failed to create appointment');
    } catch (error) {
      console.error('Create appointment error:', error);
      throw error;
    }
  }

  /**
   * Get appointment by ID
   */
  async getAppointment(appointmentId: string): Promise<AppointmentResponse> {
    try {
      const response = await apiClient.get<AppointmentResponse>(
        `${API_ENDPOINTS.APPOINTMENTS.GET}?appointment_id=${appointmentId}`
      );

      if (response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Appointment not found');
    } catch (error) {
      console.error('Get appointment error:', error);
      throw error;
    }
  }

  /**
   * Get list of appointments with pagination and filters
   */
  async getAppointments(
    pagination: PaginationParams = {},
    filters: AppointmentFilters = {}
  ): Promise<PaginatedResponse<AppointmentResponse>> {
    try {
      const params = new URLSearchParams({
        limit_page_length: (pagination.limit_page_length || 20).toString(),
        limit_start: (pagination.limit_start || 0).toString(),
      });

      // Add filters if provided
      if (Object.keys(filters).length > 0) {
        params.append('filters', JSON.stringify(filters));
      }

      const response = await apiClient.get<PaginatedResponse<AppointmentResponse>>(
        `${API_ENDPOINTS.APPOINTMENTS.LIST}?${params.toString()}`
      );

      if (response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to fetch appointments');
    } catch (error) {
      console.error('Get appointments error:', error);
      throw error;
    }
  }

  /**
   * Update appointment
   */
  async updateAppointment(updateData: UpdateAppointmentRequest): Promise<AppointmentResponse> {
    try {
      const response = await apiClient.post<AppointmentResponse>(
        API_ENDPOINTS.APPOINTMENTS.UPDATE,
        updateData
      );

      if (response.data && response.message === 'Appointment updated successfully') {
        return response.data;
      }

      throw new Error(response.message || 'Failed to update appointment');
    } catch (error) {
      console.error('Update appointment error:', error);
      throw error;
    }
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(cancelData: CancelAppointmentRequest): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>(
        API_ENDPOINTS.APPOINTMENTS.CANCEL,
        cancelData
      );

      if (response.message === 'Appointment cancelled successfully') {
        return response;
      }

      throw new Error(response.message || 'Failed to cancel appointment');
    } catch (error) {
      console.error('Cancel appointment error:', error);
      throw error;
    }
  }

  /**
   * Delete appointment
   */
  async deleteAppointment(appointmentId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>(
        API_ENDPOINTS.APPOINTMENTS.DELETE,
        { appointment_id: appointmentId }
      );

      if (response.message === 'Appointment deleted successfully' || response.data) {
        return response;
      }

      throw new Error(response.message || 'Failed to delete appointment');
    } catch (error) {
      console.error('Delete appointment error:', error);
      throw error;
    }
  }

  /**
   * Add patient to today's queue
   */
  async addToTodaysQueue(params: {
    patient_id: string;
    duration?: number;
    chief_complaint?: string;
    notes?: string;
    appointment_type?: string;
    type?: string;
    appointment_for?: string;
    appointment_time?: string;
  }): Promise<{
    appointment_id: string;
    queue_position: number;
    appointment_time: string;
  }> {
    try {
      const response = await apiClient.post<{
        appointment_id: string;
        patient_id: string;
        patient_name: string;
        appointment_date: string;
        appointment_time: string;
        status: string;
        queue_position: number;
      }>(
        API_ENDPOINTS.APPOINTMENTS.ADD_TO_QUEUE,
        params
      );

      if (response.data && response.message === 'Patient added to today\'s queue successfully') {
        return {
          appointment_id: response.data.appointment_id,
          queue_position: response.data.queue_position,
          appointment_time: response.data.appointment_time,
        };
      }

      throw new Error(response.message || 'Failed to add to queue');
    } catch (error) {
      console.error('Add to queue error:', error);
      throw error;
    }
  }

  /**
   * Get today's queue
   */
  async getTodaysQueue(): Promise<{
    date: string;
    total_queue: number;
    queue: Array<AppointmentResponse & { queue_position: number; estimated_time: string }>;
  }> {
    try {
      const response = await apiClient.get<{
        date: string;
        total_queue: number;
        queue: Array<AppointmentResponse & { queue_position: number; estimated_time: string }>;
      }>(
        API_ENDPOINTS.APPOINTMENTS.GET_QUEUE
      );

      if (response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to fetch queue');
    } catch (error) {
      console.error('Get queue error:', error);
      throw error;
    }
  }

  /**
   * Get today's appointments
   */
  async getTodaysAppointments(): Promise<AppointmentResponse[]> {
    const today = new Date().toISOString().split('T')[0];

    try {
      const response = await this.getAppointments(
        { limit_page_length: 50 },
        { date_from: today, date_to: today }
      );

      return response.data || [];
    } catch (error) {
      console.error('Get today\'s appointments error:', error);
      throw error;
    }
  }

  /**
   * Get upcoming appointments (next 7 days)
   */
  async getUpcomingAppointments(days: number = 7): Promise<AppointmentResponse[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start from tomorrow
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);

    try {
      const response = await this.getAppointments(
        { limit_page_length: 100 },
        {
          date_from: tomorrow.toISOString().split('T')[0],
          date_to: futureDate.toISOString().split('T')[0],
        }
      );

      // Filter out cancelled/completed appointments on the client side
      const filteredData = (response.data || []).filter(
        apt => apt.status !== 'Cancelled' && apt.status !== 'Completed'
      );

      return filteredData;
    } catch (error) {
      console.error('Get upcoming appointments error:', error);
      throw error;
    }
  }

  /**
   * Get appointments for a specific patient
   */
  async getPatientAppointments(patientId: string, limit: number = 10): Promise<AppointmentResponse[]> {
    try {
      const response = await this.getAppointments(
        { limit_page_length: limit },
        { patient: patientId }  // Use 'patient' field name (matches Frappe doctype field)
      );

      return response.data || [];
    } catch (error) {
      console.error('Get patient appointments error:', error);
      throw error;
    }
  }

  /**
   * Get appointments for a specific date
   */
  async getAppointmentsByDate(date: string): Promise<AppointmentResponse[]> {
    try {
      const response = await this.getAppointments(
        { limit_page_length: 50 },
        { date_from: date, date_to: date }
      );

      return response.data || [];
    } catch (error) {
      console.error('Get appointments by date error:', error);
      throw error;
    }
  }

  /**
   * Format appointment time for display
   */
  formatAppointmentTime(appointment: AppointmentResponse): string {
    try {
      const dateTime = new Date(appointment.appointment_datetime);
      return dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Invalid time';
    }
  }

  /**
   * Check-in appointment
   */
  async checkInAppointment(appointmentId: string): Promise<ApiResponse<AppointmentResponse>> {
    try {
      const response = await apiClient.post<AppointmentResponse>(
        '/api/method/mob_clinic.mob_clinic.api.appointment.check_in_appointment',
        { appointment_id: appointmentId }
      );

      if (response.data) {
        return response;
      }

      throw new Error(response.message || 'Failed to check in appointment');
    } catch (error) {
      console.error('Check-in appointment error:', error);
      throw error;
    }
  }

  /**
   * Start visit for appointment
   */
  async startVisit(appointmentId: string): Promise<ApiResponse<AppointmentResponse>> {
    try {
      const response = await apiClient.post<AppointmentResponse>(
        '/api/method/mob_clinic.mob_clinic.api.appointment.start_visit',
        { appointment_id: appointmentId }
      );

      if (response.data) {
        return response;
      }

      throw new Error(response.message || 'Failed to start visit');
    } catch (error) {
      console.error('Start visit error:', error);
      throw error;
    }
  }

  /**
   * Complete visit for appointment
   */
  async completeVisit(appointmentId: string): Promise<ApiResponse<AppointmentResponse>> {
    try {
      const response = await apiClient.post<AppointmentResponse>(
        '/api/method/mob_clinic.mob_clinic.api.appointment.complete_visit',
        { appointment_id: appointmentId }
      );

      if (response.data) {
        return response;
      }

      throw new Error(response.message || 'Failed to complete visit');
    } catch (error) {
      console.error('Complete visit error:', error);
      throw error;
    }
  }

  /**
   * Update review request status
   */
  async updateReviewStatus(appointmentId: string, requested: boolean): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>(
        '/api/method/mob_clinic.mob_clinic.api.appointment.update_review_status',
        {
          appointment_id: appointmentId,
          review_requested: requested
        }
      );

      if (response.message) {
        return response;
      }

      throw new Error(response.message || 'Failed to update review status');
    } catch (error) {
      console.error('Update review status error:', error);
      throw error;
    }
  }

  /**
   * Format appointment date for display
   */
  formatAppointmentDate(appointment: AppointmentResponse): string {
    try {
      const dateTime = new Date(appointment.appointment_datetime);
      return dateTime.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  }

  /**
   * Check if appointment is today
   */
  isAppointmentToday(appointment: AppointmentResponse): boolean {
    try {
      const appointmentDate = new Date(appointment.appointment_datetime).toDateString();
      const today = new Date().toDateString();
      return appointmentDate === today;
    } catch {
      return false;
    }
  }

  /**
   * Check if appointment is upcoming (in the future)
   */
  isAppointmentUpcoming(appointment: AppointmentResponse): boolean {
    try {
      const appointmentTime = new Date(appointment.appointment_datetime);
      return appointmentTime > new Date();
    } catch {
      return false;
    }
  }

  /**
   * Get appointment status color for UI
   */
  getAppointmentStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}

// Create singleton instance
export const appointmentService = new AppointmentService();