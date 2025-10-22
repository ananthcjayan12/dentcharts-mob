import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '../api/services';
import {
  CreateInvoiceRequest,
  InvoiceResponse,
  UpdatePaymentRequest,
  SendPaymentReminderRequest,
  PaginationParams,
  InvoiceFilters,
} from '../api/types';
import { queryKeys, mutationKeys, invalidateQueriesHelper } from '../api/queryClient';
import toast from 'react-hot-toast';

/**
 * Hook for creating a new invoice
 */
export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutationKeys.payments.createInvoice(),
    mutationFn: (invoiceData: CreateInvoiceRequest) =>
      paymentService.createInvoice(invoiceData),
    onSuccess: (result, variables) => {
      invalidateQueriesHelper.invalidatePayments();
      invalidateQueriesHelper.invalidateDashboard();
      
      // Invalidate patient-specific payment queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.payments.summary(variables.patient_id),
      });
      
      toast.success('Invoice created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create invoice');
    },
  });
};

/**
 * Hook for getting a single invoice by ID
 */
export const useInvoice = (invoiceId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.payments.invoice(invoiceId),
    queryFn: () => paymentService.getInvoice(invoiceId),
    enabled: enabled && !!invoiceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for getting list of invoices with pagination and filters
 */
export const useInvoices = (
  pagination: PaginationParams = {},
  filters: InvoiceFilters = {}
) => {
  return useQuery({
    queryKey: queryKeys.payments.invoices({ pagination, filters }),
    queryFn: () => paymentService.getInvoices(pagination, filters),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

/**
 * Hook for getting payment summary for a patient
 */
export const usePaymentSummary = (patientId: string) => {
  return useQuery({
    queryKey: queryKeys.payments.summary(patientId),
    queryFn: () => paymentService.getPaymentSummary(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for getting unpaid invoices
 */
export const useUnpaidInvoices = (patientId?: string) => {
  return useQuery({
    queryKey: queryKeys.payments.unpaid(patientId),
    queryFn: () => paymentService.getUnpaidInvoices(patientId),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

/**
 * Hook for getting overdue invoices
 */
export const useOverdueInvoices = (patientId?: string) => {
  return useQuery({
    queryKey: queryKeys.payments.overdue(patientId),
    queryFn: () => paymentService.getOverdueInvoices(patientId),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

/**
 * Hook for getting patient invoices
 */
export const usePatientInvoices = (patientId: string, limit: number = 20) => {
  return useQuery({
    queryKey: queryKeys.payments.invoices({ patientId }),
    queryFn: () => paymentService.getPatientInvoices(patientId, limit),
    enabled: !!patientId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

/**
 * Hook for recording payment
 */
export const useRecordPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutationKeys.payments.recordPayment(''),
    mutationFn: (paymentData: UpdatePaymentRequest) =>
      paymentService.recordPayment(paymentData),
    onSuccess: (result, variables) => {
      // Invalidate the specific invoice
      queryClient.invalidateQueries({
        queryKey: queryKeys.payments.invoice(variables.invoice_id),
      });
      
      invalidateQueriesHelper.invalidatePayments();
      invalidateQueriesHelper.invalidateDashboard();
      
      toast.success('Payment recorded successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to record payment');
    },
  });
};

/**
 * Hook for sending payment reminder
 */
export const useSendPaymentReminder = () => {
  return useMutation({
    mutationKey: mutationKeys.payments.sendReminder(''),
    mutationFn: (reminderData: SendPaymentReminderRequest) =>
      paymentService.sendPaymentReminder(reminderData),
    onSuccess: () => {
      toast.success('Payment reminder sent successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send payment reminder');
    },
  });
};

/**
 * Hook for payment actions (create invoice, record payment, send reminder)
 */
export const usePaymentActions = () => {
  const createInvoice = useCreateInvoice();
  const recordPayment = useRecordPayment();
  const sendReminder = useSendPaymentReminder();

  return {
    // Actions
    createInvoice: createInvoice.mutateAsync,
    recordPayment: recordPayment.mutateAsync,
    sendReminder: sendReminder.mutateAsync,

    // Loading states
    isCreatingInvoice: createInvoice.isPending,
    isRecordingPayment: recordPayment.isPending,
    isSendingReminder: sendReminder.isPending,

    // Error states
    createInvoiceError: createInvoice.error,
    recordPaymentError: recordPayment.error,
    sendReminderError: sendReminder.error,
  };
};

/**
 * Hook for payment statistics
 */
export const usePaymentStats = () => {
  const unpaidInvoices = useUnpaidInvoices();
  const overdueInvoices = useOverdueInvoices();

  return useQuery({
    queryKey: ['payments', 'stats'],
    queryFn: async () => {
      const unpaid = unpaidInvoices.data || [];
      const overdue = overdueInvoices.data || [];
      
      const totalUnpaidAmount = unpaid.reduce((sum, invoice) => sum + invoice.outstanding_amount, 0);
      const totalOverdueAmount = overdue.reduce((sum, invoice) => sum + invoice.outstanding_amount, 0);
      
      return {
        totalUnpaid: unpaid.length,
        totalOverdue: overdue.length,
        unpaidAmount: totalUnpaidAmount,
        overdueAmount: totalOverdueAmount,
      };
    },
    enabled: unpaidInvoices.isSuccess && overdueInvoices.isSuccess,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for payment dashboard data
 */
export const usePaymentsDashboard = () => {
  const recentInvoices = useInvoices(
    { limit_page_length: 10 },
    {}
  );
  const unpaidInvoices = useUnpaidInvoices();
  const overdueInvoices = useOverdueInvoices();
  const stats = usePaymentStats();

  return {
    // Data
    recentInvoices: recentInvoices.data?.data || [],
    unpaidInvoices: unpaidInvoices.data || [],
    overdueInvoices: overdueInvoices.data || [],
    
    // Stats
    totalUnpaid: stats.data?.totalUnpaid || 0,
    totalOverdue: stats.data?.totalOverdue || 0,
    unpaidAmount: stats.data?.unpaidAmount || 0,
    overdueAmount: stats.data?.overdueAmount || 0,
    
    // Loading
    isLoading: recentInvoices.isLoading || unpaidInvoices.isLoading || overdueInvoices.isLoading,
    
    // Error
    error: recentInvoices.error || unpaidInvoices.error || overdueInvoices.error,
    
    // Refetch
    refetch: () => {
      recentInvoices.refetch();
      unpaidInvoices.refetch();
      overdueInvoices.refetch();
    },
  };
};

/**
 * Hook that provides all payment-related functionality for patient view
 */
export const usePatientPaymentsComplete = (patientId: string) => {
  const invoices = usePatientInvoices(patientId);
  const paymentSummary = usePaymentSummary(patientId);
  const unpaidInvoices = useUnpaidInvoices(patientId);
  const overdueInvoices = useOverdueInvoices(patientId);
  const actions = usePaymentActions();

  return {
    // Data
    invoices: invoices.data || [],
    paymentSummary: paymentSummary.data,
    unpaidInvoices: unpaidInvoices.data || [],
    overdueInvoices: overdueInvoices.data || [],
    
    // Loading states
    isLoading: invoices.isLoading || paymentSummary.isLoading,
    
    // Error states
    error: invoices.error || paymentSummary.error,
    
    // Actions
    ...actions,
    
    // Refetch
    refetch: () => {
      invoices.refetch();
      paymentSummary.refetch();
      unpaidInvoices.refetch();
      overdueInvoices.refetch();
    },
  };
};

/**
 * Hook for payment form helpers
 */
export const usePaymentHelpers = () => {
  return {
    calculateTotal: paymentService.calculateInvoiceTotal,
    formatCurrency: paymentService.formatCurrency,
    formatDate: paymentService.formatInvoiceDate,
    formatDueDate: paymentService.formatDueDate,
    isOverdue: paymentService.isInvoiceOverdue,
    getDaysUntilDue: paymentService.getDaysUntilDue,
    getStatusColor: paymentService.getInvoiceStatusColor,
    validateInvoice: paymentService.validateInvoiceData,
    generateSummary: paymentService.generateInvoiceSummary,
  };
};

/**
 * Hook for payment validation
 */
export const usePaymentValidation = () => {
  return {
    validateInvoice: (data: CreateInvoiceRequest) => {
      return paymentService.validateInvoiceData(data);
    },
    validatePayment: (data: UpdatePaymentRequest) => {
      const errors: string[] = [];
      
      if (!data.invoice_id) {
        errors.push('Invoice ID is required');
      }
      
      if (!data.paid_amount || data.paid_amount <= 0) {
        errors.push('Payment amount must be greater than 0');
      }
      
      if (!data.mode_of_payment?.trim()) {
        errors.push('Payment mode is required');
      }
      
      if (!data.payment_date) {
        errors.push('Payment date is required');
      }
      
      return errors;
    },
  };
};