import { apiClient, API_ENDPOINTS } from '../client';

export interface DashboardStatsParams {
    from_date?: string;
    to_date?: string;
    clinic?: string;
}

export interface CollectionSummaryParams {
    period: 'today' | 'week' | 'month' | 'year';
    clinic?: string;
}

export const dashboardService = {
    getFinancialStats: async (params?: DashboardStatsParams) => {
        const queryParams = new URLSearchParams();
        if (params?.from_date) queryParams.append('from_date', params.from_date);
        if (params?.to_date) queryParams.append('to_date', params.to_date);
        if (params?.clinic) queryParams.append('clinic', params.clinic);

        const response = await apiClient.get<any>(
            `${API_ENDPOINTS.DASHBOARD.GET_STATS}?${queryParams.toString()}`
        );
        return response.data;
    },

    getCollectionSummary: async (params: CollectionSummaryParams) => {
        const queryParams = new URLSearchParams();
        queryParams.append('period', params.period);
        if (params.clinic) queryParams.append('clinic', params.clinic);

        const response = await apiClient.get<any>(
            `${API_ENDPOINTS.DASHBOARD.GET_COLLECTION}?${queryParams.toString()}`
        );
        return response.data;
    },
};
