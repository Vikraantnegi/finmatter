import { apiClient } from '@/lib/apiClient';

export interface CardMetadataParams {
  bank?: string;
  search?: string;
  network?: string;
  rewardType?: string;
  minIncome?: number;
  maxAnnualFee?: number;
  limit?: number;
  offset?: number;
}

export interface CardMetadata {
  id: string;
  card_name: string;
  bank_name: string;
  card_type: string;
  network: string;
  reward_type: string;
  annual_fee: number;
  currency: string;
  primary_color: string;
  secondary_color: string;
  card_image_url: string;
  description: string;
  benefits: any[];
  reward_rules: any;
  eligibility_criteria: any[];
  features: any[];
  is_active: boolean;
  launch_date: string;
  validity_period: any;
  created_at: string;
  updated_at: string;
}

export interface CardMetadataResponse {
  cards: CardMetadata[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Card Metadata Service
 * Handles browsing and searching card metadata
 */
export const cardMetadataService = {
  /**
   * Get all available card metadata
   */
  async getMetadata(
    params: CardMetadataParams = {},
  ): Promise<CardMetadataResponse> {
    const queryParams = new URLSearchParams();

    if (params.bank) queryParams.append('bank', params.bank);
    if (params.search) queryParams.append('search', params.search);
    if (params.network) queryParams.append('network', params.network);
    if (params.rewardType) queryParams.append('rewardType', params.rewardType);
    if (params.minIncome)
      queryParams.append('minIncome', params.minIncome.toString());
    if (params.maxAnnualFee)
      queryParams.append('maxAnnualFee', params.maxAnnualFee.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const url = `/api/cards/metadata${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response: any = await apiClient.get(url);

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || 'Failed to fetch card metadata',
      );
    }

    return response.data as CardMetadataResponse;
  },
};
