import { useQuery } from '@tanstack/react-query';
import { practitionerService } from '../api/services';
import { PractitionerResponse } from '../api/types';

/**
 * Hook to fetch list of practitioners
 */
export const usePractitioners = () => {
  return useQuery({
    queryKey: ['practitioners'],
    queryFn: async () => {
      const response = await practitionerService.getPractitioners();
      return response;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

/**
 * Hook to fetch a single practitioner by ID
 */
export const usePractitioner = (practitionerId: string) => {
  return useQuery({
    queryKey: ['practitioner', practitionerId],
    queryFn: async () => {
      const response = await practitionerService.getPractitioner(practitionerId);
      return response;
    },
    enabled: !!practitionerId,
  });
};
