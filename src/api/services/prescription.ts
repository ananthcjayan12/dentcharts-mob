import { apiClient, API_ENDPOINTS } from '../client';
import {
  CreatePrescriptionRequest,
  PrescriptionResponse,
  UpdatePrescriptionRequest,
  SharePrescriptionRequest,
  PatientHistoryParams,
  PaginationParams,
  PaginatedResponse,
  PrescriptionFilters,
  ApiResponse,
} from '../types';

export class PrescriptionService {
  /**
   * Create a new prescription
   */
  async createPrescription(prescriptionData: CreatePrescriptionRequest): Promise<{ record_id: string }> {
    try {
      const response = await apiClient.post<{ record_id: string }>(
        API_ENDPOINTS.PRESCRIPTIONS.CREATE,
        prescriptionData
      );

      if (response.data && response.message === 'Prescription created successfully') {
        return response.data;
      }

      throw new Error(response.message || 'Failed to create prescription');
    } catch (error) {
      console.error('Create prescription error:', error);
      throw error;
    }
  }

  /**
   * Get prescription by record ID
   */
  async getPrescription(recordId: string): Promise<PrescriptionResponse> {
    try {
      const response = await apiClient.get<PrescriptionResponse>(
        `${API_ENDPOINTS.PRESCRIPTIONS.GET}?record_id=${recordId}`
      );

      if (response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Prescription not found');
    } catch (error) {
      console.error('Get prescription error:', error);
      throw error;
    }
  }

  /**
   * Get list of prescriptions with pagination and filters
   */
  async getPrescriptions(
    pagination: PaginationParams = {},
    filters: PrescriptionFilters = {}
  ): Promise<PaginatedResponse<PrescriptionResponse>> {
    try {
      const params = new URLSearchParams({
        limit_page_length: (pagination.limit_page_length || 20).toString(),
        limit_start: (pagination.limit_start || 0).toString(),
      });

      // Add patient_id filter if provided
      if (filters.patient_id) {
        params.append('patient_id', filters.patient_id);
      }

      const response = await apiClient.get<PaginatedResponse<PrescriptionResponse>>(
        `${API_ENDPOINTS.PRESCRIPTIONS.LIST}?${params.toString()}`
      );

      if (response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to fetch prescriptions');
    } catch (error) {
      console.error('Get prescriptions error:', error);
      throw error;
    }
  }

  /**
   * Update prescription
   */
  async updatePrescription(updateData: UpdatePrescriptionRequest): Promise<PrescriptionResponse> {
    try {
      const response = await apiClient.post<PrescriptionResponse>(
        API_ENDPOINTS.PRESCRIPTIONS.UPDATE,
        updateData
      );

      if (response.data && response.message === 'Prescription updated successfully') {
        return response.data;
      }

      throw new Error(response.message || 'Failed to update prescription');
    } catch (error) {
      console.error('Update prescription error:', error);
      throw error;
    }
  }

  /**
   * Share prescription with patient via email
   */
  async sharePrescription(shareData: SharePrescriptionRequest): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>(
        API_ENDPOINTS.PRESCRIPTIONS.SHARE,
        shareData
      );

      if (response.message === 'Prescription shared successfully') {
        return response;
      }

      throw new Error(response.message || 'Failed to share prescription');
    } catch (error) {
      console.error('Share prescription error:', error);
      throw error;
    }
  }

  /**
   * Get patient medical history
   */
  async getPatientHistory(params: PatientHistoryParams): Promise<PrescriptionResponse[]> {
    try {
      const queryParams = new URLSearchParams({
        patient_id: params.patient_id,
        limit: (params.limit || 10).toString(),
      });

      if (params.from_date) {
        queryParams.append('from_date', params.from_date);
      }

      if (params.to_date) {
        queryParams.append('to_date', params.to_date);
      }

      const response = await apiClient.get<PrescriptionResponse[]>(
        `${API_ENDPOINTS.PRESCRIPTIONS.PATIENT_HISTORY}?${queryParams.toString()}`
      );

      if (response.data) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Get patient history error:', error);
      throw error;
    }
  }

  /**
   * Get recent prescriptions for a patient
   */
  async getRecentPrescriptions(patientId: string, limit: number = 5): Promise<PrescriptionResponse[]> {
    try {
      const response = await this.getPrescriptions(
        { limit_page_length: limit },
        { patient_id: patientId }
      );

      return response.data || [];
    } catch (error) {
      console.error('Get recent prescriptions error:', error);
      throw error;
    }
  }

  /**
   * Get all prescriptions for a specific patient
   */
  async getPatientPrescriptions(patientId: string): Promise<PrescriptionResponse[]> {
    try {
      const response = await this.getPrescriptions(
        { limit_page_length: 100 },
        { patient_id: patientId }
      );

      return response.data || [];
    } catch (error) {
      console.error('Get patient prescriptions error:', error);
      throw error;
    }
  }

  /**
   * Format prescription date for display
   */
  formatPrescriptionDate(prescription: PrescriptionResponse): string {
    try {
      const date = new Date(prescription.posting_date);
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  }

  /**
   * Get medication summary for display
   */
  getMedicationSummary(prescription: PrescriptionResponse): string {
    if (!prescription.medications || prescription.medications.length === 0) {
      return 'No medications prescribed';
    }

    if (prescription.medications.length === 1) {
      return prescription.medications[0].drug_name;
    }

    return `${prescription.medications[0].drug_name} + ${prescription.medications.length - 1} more`;
  }

  /**
   * Get investigation summary for display
   */
  getInvestigationSummary(prescription: PrescriptionResponse): string {
    if (!prescription.investigations || prescription.investigations.length === 0) {
      return 'No investigations ordered';
    }

    if (prescription.investigations.length === 1) {
      return prescription.investigations[0].lab_test_name;
    }

    return `${prescription.investigations[0].lab_test_name} + ${prescription.investigations.length - 1} more`;
  }

  /**
   * Check if prescription is recent (within last 30 days)
   */
  isPrescriptionRecent(prescription: PrescriptionResponse): boolean {
    try {
      const prescriptionDate = new Date(prescription.posting_date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return prescriptionDate >= thirtyDaysAgo;
    } catch {
      return false;
    }
  }

  /**
   * Delete prescription by record ID
   */
  async deletePrescription(recordId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>(
        API_ENDPOINTS.PRESCRIPTIONS.DELETE,
        { record_id: recordId }
      );

      if (response.message === 'Prescription deleted successfully' || response.data) {
        return response;
      }

      throw new Error(response.message || 'Failed to delete prescription');
    } catch (error) {
      console.error('Delete prescription error:', error);
      throw error;
    }
  }

  /**
   * Get prescription status color for UI
   */
  getPrescriptionStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
      case 'in progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Validate prescription data before submission
   */
  validatePrescriptionData(data: CreatePrescriptionRequest): string[] {
    const errors: string[] = [];

    if (!data.patient_id) {
      errors.push('Patient ID is required');
    }

    if (!data.chief_complaint?.trim()) {
      errors.push('Chief complaint is required');
    }

    if (!data.diagnosis?.trim()) {
      errors.push('Diagnosis is required');
    }

    if (!data.medications || data.medications.length === 0) {
      errors.push('At least one medication is required');
    } else {
      data.medications.forEach((med, index) => {
        if (!med.drug_name?.trim()) {
          errors.push(`Medication ${index + 1}: Drug name is required`);
        }
        if (!med.dosage?.trim()) {
          errors.push(`Medication ${index + 1}: Dosage is required`);
        }
      });
    }

    return errors;
  }
}

// Create singleton instance
export const prescriptionService = new PrescriptionService();