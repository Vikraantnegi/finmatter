import { apiClient } from '@/lib/apiClient';

export interface CardUsageStats {
  user_id: string;
  card_id: string;
  card_name: string;
  bank_name: string;
  transaction_count: number;
  total_spent: number;
  avg_transaction: number;
  last_used_date: string;
  current_month: string;
  current_month_spent: number;
}

export interface MonthlySpending {
  user_id: string;
  card_id: string;
  month: string;
  category: string;
  transaction_count: number;
  total_amount: number;
  avg_amount: number;
}

export interface TopMerchant {
  user_id: string;
  merchant_name: string;
  category: string;
  transaction_count: number;
  total_spent: number;
  avg_amount: number;
  last_transaction_date: string;
}

export interface GetCardUsageStatsResponse {
  success: boolean;
  data?: {
    usageStats: CardUsageStats[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface GetMonthlySpendingResponse {
  success: boolean;
  data?: {
    monthlySpending: MonthlySpending[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface GetTopMerchantsResponse {
  success: boolean;
  data?: {
    topMerchants: TopMerchant[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export class AnalyticsService {
  async getCardUsageStats(params?: {
    cardId?: string;
    limit?: number;
    offset?: number;
  }): Promise<CardUsageStats[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.cardId) queryParams.append('cardId', params.cardId);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset)
        queryParams.append('offset', params.offset.toString());

      const url = `/api/analytics/card-usage-stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get<GetCardUsageStatsResponse>(url);

      if (response.success && response.data?.usageStats) {
        return response.data.usageStats;
      }
      throw new Error(
        response.error?.message || 'Failed to fetch card usage stats',
      );
    } catch (error) {
      console.error('Get card usage stats error:', error);
      throw error;
    }
  }

  async getMonthlySpending(params?: {
    cardId?: string;
    year?: number;
    month?: number;
    limit?: number;
    offset?: number;
  }): Promise<MonthlySpending[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.cardId) queryParams.append('cardId', params.cardId);
      if (params?.year) queryParams.append('year', params.year.toString());
      if (params?.month) queryParams.append('month', params.month.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset)
        queryParams.append('offset', params.offset.toString());

      const url = `/api/analytics/monthly-spending${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get<GetMonthlySpendingResponse>(url);

      if (response.success && response.data?.monthlySpending) {
        return response.data.monthlySpending;
      }
      throw new Error(
        response.error?.message || 'Failed to fetch monthly spending',
      );
    } catch (error) {
      console.error('Get monthly spending error:', error);
      throw error;
    }
  }

  async getTopMerchants(params?: {
    cardId?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<TopMerchant[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.cardId) queryParams.append('cardId', params.cardId);
      if (params?.category) queryParams.append('category', params.category);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset)
        queryParams.append('offset', params.offset.toString());

      const url = `/api/analytics/top-merchants${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get<GetTopMerchantsResponse>(url);

      if (response.success && response.data?.topMerchants) {
        return response.data.topMerchants;
      }
      throw new Error(
        response.error?.message || 'Failed to fetch top merchants',
      );
    } catch (error) {
      console.error('Get top merchants error:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
