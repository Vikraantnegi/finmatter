import { apiClient } from '@/lib/apiClient';

export interface TransactionAnalysisParams {
  period?: 'week' | 'month' | 'quarter' | 'year';
  cardId?: string;
}

export interface TransactionAnalysisResponse {
  period: string;
  summary: {
    totalAmount: number;
    transactionCount: number;
    averageAmount: number;
    categoryBreakdown: Array<{
      category: string;
      amount: number;
      count: number;
      percentage: number;
    }>;
    cardBreakdown: Array<{
      cardId: string;
      cardName: string;
      amount: number;
      count: number;
      percentage: number;
    }>;
  };
  insights: {
    topCategory: {
      category: string;
      amount: number;
      percentage: number;
    } | null;
    topMerchant: {
      merchant: string;
      amount: number;
    } | null;
    spendingTrend: string;
    rewardOpportunities: Array<{
      type: string;
      priority: string;
      title: string;
      message: string;
      action: string;
      category: string;
    }>;
  };
  recommendations: any[];
}

/**
 * Transaction Service
 * Handles transaction analysis and insights
 */
export const transactionService = {
  /**
   * Get spending analysis
   */
  async getAnalysis(
    params: TransactionAnalysisParams = {},
  ): Promise<TransactionAnalysisResponse> {
    const queryParams = new URLSearchParams();

    if (params.period) {
      queryParams.append('period', params.period);
    }

    if (params.cardId) {
      queryParams.append('cardId', params.cardId);
    }

    const url = `/api/transactions/analysis${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response: any = await apiClient.get(url);

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || 'Failed to fetch transaction analysis',
      );
    }

    return response.data as TransactionAnalysisResponse;
  },
};
