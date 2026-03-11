import { useQuery } from '@tanstack/react-query';
import { dashboardService, DashboardStatsParams, CollectionSummaryParams, ConsultantPayoutParams } from '../api/services/dashboard';
import { queryKeys } from '../api/queryClient';

/**
 * Hook for fetching financial dashboard stats
 */
export const useDashboardStats = (
    params: DashboardStatsParams = {},
    enabled: boolean = true
) => {
    return useQuery({
        queryKey: queryKeys.dashboard.stats(params),
        queryFn: () => dashboardService.getFinancialStats(params),
        enabled: enabled,
        staleTime: 0, // Always fetch fresh data - backend has caching with auto-invalidation
        refetchOnWindowFocus: true, // Refetch when user returns to tab
    });
};

/**
 * Hook for fetching quick collection summary
 */
export const useCollectionSummary = (
    params: CollectionSummaryParams,
    enabled: boolean = true
) => {
    return useQuery({
        queryKey: queryKeys.dashboard.collection(params),
        queryFn: () => dashboardService.getCollectionSummary(params),
        enabled: enabled,
        staleTime: 0, // Always fetch fresh data - backend has caching with auto-invalidation
        refetchOnWindowFocus: true,
    });
};

export const useConsultantPayoutReport = (
    params: ConsultantPayoutParams = {},
    enabled: boolean = true
) => {
    return useQuery({
        queryKey: queryKeys.dashboard.consultantPayouts(params),
        queryFn: () => dashboardService.getConsultantPayoutReport(params),
        enabled,
        staleTime: 0,
        refetchOnWindowFocus: true,
    });
};
