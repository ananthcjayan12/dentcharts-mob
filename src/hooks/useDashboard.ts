import { useQuery } from '@tanstack/react-query';
import { dashboardService, DashboardStatsParams, CollectionSummaryParams } from '../api/services/dashboard';
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
        staleTime: 5 * 60 * 1000, // 5 minutes
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
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
