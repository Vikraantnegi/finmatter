import { apiClient } from '@/lib/apiClient';

export interface CardRecommendationParams {
  spendingCategories?: Record<string, number>;
  monthlySpend?: number;
  preferredCardType?: 'credit' | 'debit' | 'prepaid';
  bankPreference?: string[];
  maxAnnualFee?: number;
  excludeCardIds?: string[];
}

export interface CardRecommendation {
  card: {
    id: string;
    card_name: string;
    bank_name: string;
    card_type: string;
    network: string;
    reward_type: string;
    annual_fee: number;
    primary_color: string;
    secondary_color: string;
    description: string;
    benefits: any[];
    features: any[];
  };
  score: number;
  estimatedAnnualRewards: number;
  netValue: number;
  benefitCategories: string[];
  eligible: boolean;
  recommendationReason: string;
}

export interface CardRecommendationsResponse {
  recommendations: CardRecommendation[];
  summary: {
    totalCardsEvaluated: number;
    recommendationsGenerated: number;
  };
}

/**
 * Recommendation Service
 * Handles card recommendations and suggestions
 */
export const recommendationService = {
  /**
   * Get personalized card recommendations
   */
  async getRecommendations(
    params: CardRecommendationParams,
  ): Promise<CardRecommendationsResponse> {
    const response: any = await apiClient.post(
      '/api/cards/recommendations',
      params,
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || 'Failed to fetch recommendations',
      );
    }

    return response.data as CardRecommendationsResponse;
  },
};
