import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Background refetch settings
      staleTime: 0, // Data is immediately stale — always refetch on mount
      gcTime: 5 * 60 * 1000, // Keep unused data in memory for 5 minutes to avoid re-fetch thrashing during navigation

      // Retry settings
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status_code >= 400 && error?.status_code < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch settings
      refetchOnWindowFocus: false,
      refetchOnMount: 'always', // Always refetch when component mounts
      refetchOnReconnect: true,
    },
    mutations: {
      // Global mutation settings
      retry: false,
    },
  },
});

// Query client provider component
interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
};

// Query keys factory for consistent cache keys
export const queryKeys = {
  // Authentication
  auth: {
    profile: () => ['auth', 'profile'],
  },

  // Patients
  patients: {
    all: () => ['patients'],
    list: (filters?: any) => ['patients', 'list', filters],
    detail: (id: string) => ['patients', 'detail', id],
    search: (term: string) => ['patients', 'search', term],
  },

  // Appointments
  appointments: {
    all: () => ['appointments'],
    list: (filters?: any) => ['appointments', 'list', filters],
    detail: (id: string) => ['appointments', 'detail', id],
    availableSlots: (date: string, duration?: number) => ['appointments', 'slots', date, duration],
    today: () => ['appointments', 'today'],
    upcoming: (days?: number) => ['appointments', 'upcoming', days],
    patient: (patientId: string) => ['appointments', 'patient', patientId],
  },

  // Prescriptions
  prescriptions: {
    all: () => ['prescriptions'],
    list: (filters?: any) => ['prescriptions', 'list', filters],
    detail: (id: string) => ['prescriptions', 'detail', id],
    patient: (patientId: string) => ['prescriptions', 'patient', patientId],
    patientHistory: (patientId: string, params?: any) => ['prescriptions', 'history', patientId, params],
  },

  // Payments
  payments: {
    all: () => ['payments'],
    invoices: (filters?: any) => ['payments', 'invoices', filters],
    invoice: (id: string) => ['payments', 'invoice', id],
    summary: (patientId: string) => ['payments', 'summary', patientId],
    unpaid: (patientId?: string) => ['payments', 'unpaid', patientId],
    overdue: (patientId?: string) => ['payments', 'overdue', patientId],
  },

  // Orthodontic tracker
  orthodontic: {
    all: () => ['orthodontic'],
    patientSummary: (patientId: string, clinicId?: string | null) => ['orthodontic', 'summary', patientId, clinicId],
    case: (caseId: string) => ['orthodontic', 'case', caseId],
    ledger: (caseId: string) => ['orthodontic', 'ledger', caseId],
    payouts: (caseId: string) => ['orthodontic', 'payouts', caseId],
    print: (caseId: string) => ['orthodontic', 'print', caseId],
  },

  // Files
  files: {
    all: () => ['files'],
    list: (filters?: any) => ['files', 'list', filters],
    detail: (id: string) => ['files', 'detail', id],
    categories: () => ['files', 'categories'],
    patient: (patientId: string, category?: string) => ['files', 'patient', patientId, category],
    prescription: (prescriptionId: string, category?: string) => ['files', 'prescription', prescriptionId, category],
  },

  // Dental Chart
  dentalChart: {
    all: () => ['dentalChart'],
    byPatient: (patientId: string) => ['dentalChart', 'patient', patientId],
    summary: (patientId: string) => ['dentalChart', 'summary', patientId],
    progress: (patientId: string) => ['dentalChart', 'progress', patientId],
    timeline: (patientId: string, toothNumber: number, procedureId: string) =>
      ['dentalChart', 'timeline', patientId, toothNumber, procedureId],
    conditionTypes: ['dentalChart', 'conditionTypes'],
    procedureTypes: ['dentalChart', 'procedureTypes'],
    chartTypes: ['dentalChart', 'chartTypes'],
    statusOptions: ['dentalChart', 'statusOptions'],
  },

  // Dashboard
  dashboard: {
    stats: (params?: any) => ['dashboard', 'stats', params],
    collection: (params?: any) => ['dashboard', 'collection', params],
    consultantPayouts: (params?: any) => ['dashboard', 'consultantPayouts', params],
    expenseSheet: (params?: any) => ['dashboard', 'expenseSheet', params],
    expenseBreakdown: (params?: any) => ['dashboard', 'expenseBreakdown', params],
    orthodontic: (params?: any) => ['dashboard', 'orthodontic', params],
    orthodonticConsultants: (params?: any) => ['dashboard', 'orthodonticConsultants', params],
  },
} as const;

// Mutation keys for tracking loading states
export const mutationKeys = {
  auth: {
    login: () => ['auth', 'login'],
    register: () => ['auth', 'register'],
    logout: () => ['auth', 'logout'],
    updateProfile: () => ['auth', 'updateProfile'],
  },

  patients: {
    create: () => ['patients', 'create'],
    update: (id: string) => ['patients', 'update', id],
    delete: (id: string) => ['patients', 'delete', id],
  },

  appointments: {
    create: () => ['appointments', 'create'],
    update: (id: string) => ['appointments', 'update', id],
    cancel: (id: string) => ['appointments', 'cancel', id],
    delete: (id: string) => ['appointments', 'delete', id],
  },

  prescriptions: {
    create: () => ['prescriptions', 'create'],
    update: (id: string) => ['prescriptions', 'update', id],
    share: (id: string) => ['prescriptions', 'share', id],
  },

  payments: {
    createInvoice: () => ['payments', 'createInvoice'],
    recordPayment: (invoiceId: string) => ['payments', 'recordPayment', invoiceId],
    deleteInvoice: (invoiceId: string) => ['payments', 'deleteInvoice', invoiceId],
    sendReminder: (invoiceId: string) => ['payments', 'sendReminder', invoiceId],
  },

  orthodontic: {
    createCase: () => ['orthodontic', 'createCase'],
    updateCase: (caseId: string) => ['orthodontic', 'updateCase', caseId],
    addLedgerEntry: (caseId: string) => ['orthodontic', 'addLedgerEntry', caseId],
    createPayout: (caseId: string) => ['orthodontic', 'createPayout', caseId],
    reversePayout: (payoutId: string) => ['orthodontic', 'reversePayout', payoutId],
  },

  expenseSheet: {
    create: () => ['expenseSheet', 'create'],
    save: () => ['expenseSheet', 'save'],
    updateRule: (ruleId: string) => ['expenseSheet', 'updateRule', ruleId],
    delete: (ruleId: string) => ['expenseSheet', 'delete', ruleId],
  },

  files: {
    upload: () => ['files', 'upload'],
    delete: (id: string) => ['files', 'delete', id],
  },

  dentalChart: {
    save: () => ['dentalChart', 'save'],
    addCondition: () => ['dentalChart', 'addCondition'],
    updateCondition: (conditionId: string) => ['dentalChart', 'updateCondition', conditionId],
    removeCondition: (conditionId: string) => ['dentalChart', 'removeCondition', conditionId],
    addProcedure: () => ['dentalChart', 'addProcedure'],
    updateProcedure: (procedureId: string) => ['dentalChart', 'updateProcedure', procedureId],
    updateProcedureStatus: (procedureId: string) => ['dentalChart', 'updateProcedureStatus', procedureId],
    removeProcedure: (procedureId: string) => ['dentalChart', 'removeProcedure', procedureId],
    export: () => ['dentalChart', 'export'],
  },
} as const;

// Helper function to invalidate related queries
export const invalidateQueriesHelper = {
  // Invalidate all patient-related queries
  invalidatePatients: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.patients.all() });
  },

  // Invalidate all appointment-related queries
  invalidateAppointments: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
  },

  // Invalidate all prescription-related queries
  invalidatePrescriptions: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.all() });
  },

  // Invalidate all payment-related queries
  invalidatePayments: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.payments.all() });
  },

  invalidateOrthodontic: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.orthodontic.all() });
  },

  // Invalidate all file-related queries
  invalidateFiles: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.files.all() });
  },

  // Invalidate all dental chart-related queries
  invalidateDentalCharts: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dentalChart.all() });
  },

  // Invalidate dashboard stats
  invalidateDashboard: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
  },

  invalidateExpenseSheet: () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'expenseSheet'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'expenseBreakdown'] });
  },

  // Invalidate everything (use sparingly)
  invalidateAll: () => {
    queryClient.invalidateQueries();
  },
};
