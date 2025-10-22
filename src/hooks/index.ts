// Custom Hooks - Export all hook modules

// Authentication hooks
export * from './useAuth';

// Patient management hooks
export * from './usePatients';

// Appointment management hooks
export * from './useAppointments';

// Prescription management hooks
export * from './usePrescriptions';

// Payment management hooks
export * from './usePayments';

// Re-export React Query client and utilities
export { QueryProvider, queryClient, queryKeys, mutationKeys, invalidateQueriesHelper } from '../api/queryClient';