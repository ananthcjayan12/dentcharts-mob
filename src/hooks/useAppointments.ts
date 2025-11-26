import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '../api/services';
import {
  CreateAppointmentRequest,
  AppointmentResponse,
  UpdateAppointmentRequest,
  CancelAppointmentRequest,
  GetAvailableSlotsParams,
  PaginationParams,
  AppointmentFilters,
} from '../api/types';
import { queryKeys, mutationKeys, invalidateQueriesHelper } from '../api/queryClient';
import toast from 'react-hot-toast';

/**
 * Hook for getting available time slots
 */
export const useAvailableSlots = (params: GetAvailableSlotsParams, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['appointments', 'available-slots', params.date, params.practitioner, params.duration],
    queryFn: () => appointmentService.getAvailableSlots(params),
    enabled: enabled && !!params.date,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for creating a new appointment
 */
export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutationKeys.appointments.create(),
    mutationFn: (appointmentData: CreateAppointmentRequest) =>
      appointmentService.createAppointment(appointmentData),
    onSuccess: (result, variables) => {
      invalidateQueriesHelper.invalidateAppointments();
      invalidateQueriesHelper.invalidateDashboard();
      
      // Invalidate available slots for the appointment date
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.availableSlots(variables.appointment_date),
      });
      
      toast.success('Appointment scheduled successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to schedule appointment');
    },
  });
};

/**
 * Hook for getting a single appointment by ID
 */
export const useAppointment = (appointmentId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.appointments.detail(appointmentId),
    queryFn: () => appointmentService.getAppointment(appointmentId),
    enabled: enabled && !!appointmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for getting list of appointments with pagination and filters
 */
export const useAppointments = (
  pagination: PaginationParams = {},
  filters: AppointmentFilters = {}
) => {
  return useQuery({
    queryKey: queryKeys.appointments.list({ pagination, filters }),
    queryFn: () => appointmentService.getAppointments(pagination, filters),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

/**
 * Hook for getting today's appointments
 */
export const useTodaysAppointments = () => {
  return useQuery({
    queryKey: queryKeys.appointments.today(),
    queryFn: () => appointmentService.getTodaysAppointments(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

/**
 * Hook for getting upcoming appointments
 */
export const useUpcomingAppointments = (days: number = 7) => {
  return useQuery({
    queryKey: queryKeys.appointments.upcoming(days),
    queryFn: () => appointmentService.getUpcomingAppointments(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for getting appointments for a specific patient
 */
export const usePatientAppointments = (patientId: string, limit: number = 10) => {
  return useQuery({
    queryKey: queryKeys.appointments.patient(patientId),
    queryFn: () => appointmentService.getPatientAppointments(patientId, limit),
    enabled: !!patientId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

/**
 * Hook for getting appointments by date
 */
export const useAppointmentsByDate = (date: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.appointments.list({ date }),
    queryFn: () => appointmentService.getAppointmentsByDate(date),
    enabled: enabled && !!date,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook for updating an appointment
 */
export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutationKeys.appointments.update(''),
    mutationFn: (updateData: UpdateAppointmentRequest) =>
      appointmentService.updateAppointment(updateData),
    onSuccess: (updatedAppointment, variables) => {
      // Update specific appointment query
      queryClient.setQueryData(
        queryKeys.appointments.detail(variables.appointment_id),
        updatedAppointment
      );
      
      invalidateQueriesHelper.invalidateAppointments();
      invalidateQueriesHelper.invalidateDashboard();
      
      toast.success('Appointment updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update appointment');
    },
  });
};

/**
 * Hook for cancelling an appointment
 */
export const useCancelAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutationKeys.appointments.cancel(''),
    mutationFn: (cancelData: CancelAppointmentRequest) =>
      appointmentService.cancelAppointment(cancelData),
    onSuccess: (result, variables) => {
      invalidateQueriesHelper.invalidateAppointments();
      invalidateQueriesHelper.invalidateDashboard();
      
      // Invalidate available slots
      queryClient.invalidateQueries({
        queryKey: ['appointments', 'slots'],
      });
      
      toast.success('Appointment cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel appointment');
    },
  });
};

/**
 * Hook for deleting an appointment
 */
export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutationKeys.appointments.delete(''),
    mutationFn: (appointmentId: string) =>
      appointmentService.deleteAppointment(appointmentId),
    onSuccess: (result, appointmentId) => {
      invalidateQueriesHelper.invalidateAppointments();
      invalidateQueriesHelper.invalidateDashboard();
      
      // Invalidate available slots
      queryClient.invalidateQueries({
        queryKey: ['appointments', 'slots'],
      });
      
      toast.success('Appointment deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete appointment');
    },
  });
};

/**
 * Hook for adding patient to today's queue
 */
export const useAddToTodaysQueue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutationKeys.appointments.create(),
    mutationFn: (params: {
      patient_id: string;
      duration?: number;
      chief_complaint?: string;
      notes?: string;
      appointment_type?: string;
      type?: string;
      appointment_for?: string;
      appointment_time?: string;
    }) => appointmentService.addToTodaysQueue(params),
    onSuccess: (result) => {
      invalidateQueriesHelper.invalidateAppointments();
      invalidateQueriesHelper.invalidateDashboard();
      
      // Invalidate today's queue
      queryClient.invalidateQueries({
        queryKey: ['appointments', 'queue'],
      });
      
      toast.success(`Added to queue at position ${result.queue_position}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add to queue');
    },
  });
};

/**
 * Hook for check-in appointment
 */
export const useCheckInAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['appointments', 'check-in'],
    mutationFn: (appointmentId: string) => appointmentService.checkInAppointment(appointmentId),
    onSuccess: () => {
      invalidateQueriesHelper.invalidateAppointments();
      invalidateQueriesHelper.invalidateDashboard();
      toast.success('Patient checked in successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to check in patient');
    },
  });
};

/**
 * Hook for start visit
 */
export const useStartVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['appointments', 'start-visit'],
    mutationFn: (appointmentId: string) => appointmentService.startVisit(appointmentId),
    onSuccess: () => {
      invalidateQueriesHelper.invalidateAppointments();
      invalidateQueriesHelper.invalidateDashboard();
      toast.success('Visit started successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to start visit');
    },
  });
};

/**
 * Hook for complete visit
 */
export const useCompleteVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['appointments', 'complete-visit'],
    mutationFn: (appointmentId: string) => appointmentService.completeVisit(appointmentId),
    onSuccess: () => {
      invalidateQueriesHelper.invalidateAppointments();
      invalidateQueriesHelper.invalidateDashboard();
      toast.success('Visit completed successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to complete visit');
    },
  });
};

/**
 * Hook for updating review request status
 */
export const useUpdateReviewStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['appointments', 'update-review'],
    mutationFn: ({ appointmentId, requested }: { appointmentId: string; requested: boolean }) =>
      appointmentService.updateReviewStatus(appointmentId, requested),
    onSuccess: () => {
      invalidateQueriesHelper.invalidateAppointments();
      toast.success('Review status updated!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update review status');
    },
  });
};

/**
 * Hook for getting today's queue
 */
export const useTodaysQueue = () => {
  return useQuery({
    queryKey: ['appointments', 'queue'],
    queryFn: () => appointmentService.getTodaysQueue(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

/**
 * Hook for appointment actions (create, update, cancel, delete, add to queue)
 */
export const useAppointmentActions = () => {
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const cancelAppointment = useCancelAppointment();
  const deleteAppointment = useDeleteAppointment();
  const addToQueue = useAddToTodaysQueue();

  return {
    // Actions
    createAppointment: createAppointment.mutateAsync,
    updateAppointment: updateAppointment.mutateAsync,
    cancelAppointment: cancelAppointment.mutateAsync,
    deleteAppointment: deleteAppointment.mutateAsync,
    addToTodaysQueue: addToQueue.mutateAsync,

    // Loading states
    isCreating: createAppointment.isPending,
    isUpdating: updateAppointment.isPending,
    isCancelling: cancelAppointment.isPending,
    isDeleting: deleteAppointment.isPending,
    isAddingToQueue: addToQueue.isPending,

    // Error states
    createError: createAppointment.error,
    updateError: updateAppointment.error,
    cancelError: cancelAppointment.error,
    deleteError: deleteAppointment.error,
    addToQueueError: addToQueue.error,
  };
};

/**
 * Hook for appointment statistics
 */
export const useAppointmentStats = () => {
  const todaysAppointments = useTodaysAppointments();
  const upcomingAppointments = useUpcomingAppointments();

  return useQuery({
    queryKey: ['appointments', 'stats'],
    queryFn: async () => {
      const today = todaysAppointments.data || [];
      const upcoming = upcomingAppointments.data || [];
      
      return {
        todayCount: today.length,
        upcomingCount: upcoming.length,
        pendingCount: today.filter(apt => apt.status === 'Scheduled').length,
        confirmedCount: today.filter(apt => apt.status === 'Confirmed').length,
      };
    },
    enabled: todaysAppointments.isSuccess && upcomingAppointments.isSuccess,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook that provides all appointment-related functionality for dashboard
 */
export const useAppointmentsDashboard = () => {
  const todaysAppointments = useTodaysAppointments();
  const upcomingAppointments = useUpcomingAppointments();
  const stats = useAppointmentStats();
  const actions = useAppointmentActions();

  return {
    // Data
    todaysAppointments: todaysAppointments.data || [],
    upcomingAppointments: upcomingAppointments.data || [],
    
    // Stats
    todayCount: stats.data?.todayCount || 0,
    upcomingCount: stats.data?.upcomingCount || 0,
    pendingCount: stats.data?.pendingCount || 0,
    confirmedCount: stats.data?.confirmedCount || 0,
    
    // Loading states
    isLoading: todaysAppointments.isLoading || upcomingAppointments.isLoading,
    
    // Actions
    ...actions,
    
    // Refetch
    refetchTodays: todaysAppointments.refetch,
    refetchUpcoming: upcomingAppointments.refetch,
  };
};

/**
 * Hook for appointment calendar view
 */
export const useAppointmentCalendar = (selectedDate?: string) => {
  const appointmentsByDate = useAppointmentsByDate(selectedDate || '');
  const availableSlots = useAvailableSlots(
    { date: selectedDate || '', duration: 30 },
    !!selectedDate
  );

  return {
    appointments: appointmentsByDate.data || [],
    availableSlots: availableSlots.data || [],
    isLoading: appointmentsByDate.isLoading || availableSlots.isLoading,
    error: appointmentsByDate.error || availableSlots.error,
    refetch: () => {
      appointmentsByDate.refetch();
      availableSlots.refetch();
    },
  };
};