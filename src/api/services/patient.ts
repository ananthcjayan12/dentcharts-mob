import { apiClient, API_ENDPOINTS } from '../client';
import {
  CreatePatientRequest,
  PatientResponse,
  UpdatePatientRequest,
  PatientSearchParams,
  PaginationParams,
  PaginatedResponse,
  PatientFilters,
  ApiResponse,
} from '../types';

export class PatientService {
  /**
   * Create a new patient
   */
  async createPatient(patientData: CreatePatientRequest): Promise<{ patient_id: string }> {
    try {
      const response = await apiClient.post<{ patient_id: string }>(
        API_ENDPOINTS.PATIENTS.CREATE,
        patientData
      );

      if (response.data && response.message === 'Patient created successfully') {
        return response.data;
      }

      throw new Error(response.message || 'Failed to create patient');
    } catch (error) {
      console.error('Create patient error:', error);
      throw error;
    }
  }

  /**
   * Get patient by ID
   */
  async getPatient(patientId: string): Promise<PatientResponse> {
    try {
      const response = await apiClient.get<PatientResponse>(
        `${API_ENDPOINTS.PATIENTS.GET}?patient_id=${patientId}`
      );

      if (response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Patient not found');
    } catch (error) {
      console.error('Get patient error:', error);
      throw error;
    }
  }

  /**
   * Get list of patients with pagination and filters
   */
  async getPatients(
    pagination: PaginationParams = {},
    filters: PatientFilters = {}
  ): Promise<PaginatedResponse<PatientResponse>> {
    try {
      const params = new URLSearchParams({
        limit_page_length: (pagination.limit_page_length || 20).toString(),
        limit_start: (pagination.limit_start || 0).toString(),
      });

      // Add filters if provided
      if (Object.keys(filters).length > 0) {
        params.append('filters', JSON.stringify(filters));
      }

      const response = await apiClient.get<PaginatedResponse<PatientResponse>>(
        `${API_ENDPOINTS.PATIENTS.LIST}?${params.toString()}`
      );

      if (response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to fetch patients');
    } catch (error) {
      console.error('Get patients error:', error);
      throw error;
    }
  }

  /**
   * Search patients by name, email, or phone
   */
  async searchPatients(searchParams: PatientSearchParams): Promise<PatientResponse[]> {
    try {
      const params = new URLSearchParams({
        search_term: searchParams.search_term,
        limit: (searchParams.limit || 10).toString(),
      });

      const response = await apiClient.get<PatientResponse[]>(
        `${API_ENDPOINTS.PATIENTS.SEARCH}?${params.toString()}`
      );

      if (response.data) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Search patients error:', error);
      throw error;
    }
  }

  /**
   * Update patient information
   */
  async updatePatient(updateData: UpdatePatientRequest): Promise<PatientResponse> {
    try {
      const response = await apiClient.post<PatientResponse>(
        API_ENDPOINTS.PATIENTS.UPDATE,
        updateData
      );

      if (response.data && response.message === 'Patient updated successfully') {
        return response.data;
      }

      throw new Error(response.message || 'Failed to update patient');
    } catch (error) {
      console.error('Update patient error:', error);
      throw error;
    }
  }

  /**
   * Delete patient
   */
  async deletePatient(patientId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>(
        API_ENDPOINTS.PATIENTS.DELETE,
        { patient_id: patientId }
      );

      if (response.message === 'Patient deleted successfully' || response.data) {
        return response;
      }

      throw new Error(response.message || 'Failed to delete patient');
    } catch (error) {
      console.error('Delete patient error:', error);
      throw error;
    }
  }

  /**
   * Get patients with search functionality (combines list and search)
   */
  async getPatientsWithSearch(
    searchTerm?: string,
    pagination: PaginationParams = {},
    filters: PatientFilters = {}
  ): Promise<PaginatedResponse<PatientResponse>> {
    try {
      if (searchTerm && searchTerm.trim()) {
        // Use search endpoint for text-based search
        const searchResults = await this.searchPatients({
          search_term: searchTerm.trim(),
          limit: pagination.limit_page_length || 20,
        });

        return {
          data: searchResults,
          total_count: searchResults.length,
          page_length: pagination.limit_page_length || 20,
          start: pagination.limit_start || 0,
        };
      } else {
        // Use regular list endpoint with filters
        return this.getPatients(pagination, filters);
      }
    } catch (error) {
      console.error('Get patients with search error:', error);
      throw error;
    }
  }

  /**
   * Get patient age from date of birth
   */
  calculateAge(dob: string): number {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Format patient display name
   */
  formatPatientName(patient: PatientResponse): string {
    return patient.patient_name || 'Unknown Patient';
  }

  /**
   * Get patient contact info
   */
  getPatientContact(patient: PatientResponse): { phone?: string; email?: string } {
    return {
      phone: patient.mobile,
      email: patient.email,
    };
  }
}

// Create singleton instance
export const patientService = new PatientService();