import { apiClient, API_ENDPOINTS } from '../client';
import { ApiResponse, PractitionerResponse } from '../types';

export const practitionerService = {
  /**
   * Get list of practitioners
   */
  getPractitioners: async (): Promise<ApiResponse<PractitionerResponse[]>> => {
    // For now, we'll assume the API endpoint follows the same pattern as other services
    // This will need to be adjusted based on actual backend API
    return await apiClient.get<PractitionerResponse[]>(
      '/api/method/mob_clinic.mob_clinic.api.practitioner.get_practitioners'
    );
  },

  /**
   * Get practitioner details by ID
   */
  getPractitioner: async (practitionerId: string): Promise<ApiResponse<PractitionerResponse>> => {
    return await apiClient.post<PractitionerResponse>(
      '/api/method/mob_clinic.mob_clinic.api.practitioner.get_practitioner',
      { practitioner_id: practitionerId }
    );
  },
};
