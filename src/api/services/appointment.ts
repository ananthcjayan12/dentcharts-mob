import { apiClient, API_ENDPOINTS } from '../client';
import {
  CreateAppointmentRequest,
  AppointmentResponse,
  UpdateAppointmentRequest,
  CancelAppointmentRequest,
  GetAvailableSlotsParams,
  AvailableSlot,
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

      const response = await apiClient.get<AvailableSlot[]>(
        `${API_ENDPOINTS.APPOINTMENTS.AVAILABLE_SLOTS}?${queryParams.toString()}`
      );

      if (response.data) {
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
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    try {
      const response = await this.getAppointments(
        { limit_page_length: 100 },
        {
          date_from: today.toISOString().split('T')[0],
          date_to: futureDate.toISOString().split('T')[0],
          status: 'Scheduled',
        }
      );

      return response.data || [];
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
        { patient_id: patientId }
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