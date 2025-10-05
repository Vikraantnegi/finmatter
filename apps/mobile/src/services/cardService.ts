/**
 * Card Service
 * Handles all card-related API calls
 */

import { 
  GetCardsResponse, 
  CreateCardRequest, 
  CreateCardResponse,
  Card,
  CardBenefit
} from '@finmatter/types';
import { apiClient } from './apiClient';

export const cardService = {
  /**
   * Get user's cards
   */
  async getCards(params?: {
    status?: 'active' | 'inactive' | 'blocked' | 'expired';
    cardType?: 'credit' | 'debit' | 'prepaid';
    bankName?: string;
    limit?: number;
    offset?: number;
  }): Promise<GetCardsResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.status) queryParams.append('status', params.status);
      if (params?.cardType) queryParams.append('cardType', params.cardType);
      if (params?.bankName) queryParams.append('bankName', params.bankName);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());

      const url = `/api/cards${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get(url);
      
      return response.data;
    } catch (error) {
      console.error('Get cards error:', error);
      throw error;
    }
  },

  /**
   * Get specific card details
   */
  async getCard(cardId: string): Promise<{ success: boolean; data?: { card: Card }; error?: any }> {
    try {
      const response = await apiClient.get(`/api/cards/${cardId}`);
      return response.data;
    } catch (error) {
      console.error('Get card error:', error);
      throw error;
    }
  },

  /**
   * Create a new card
   */
  async createCard(cardData: CreateCardRequest): Promise<CreateCardResponse> {
    try {
      const response = await apiClient.post('/api/cards', cardData);
      return response.data;
    } catch (error) {
      console.error('Create card error:', error);
      throw error;
    }
  },

  /**
   * Update card details
   */
  async updateCard(
    cardId: string, 
    updateData: Partial<CreateCardRequest>
  ): Promise<{ success: boolean; data?: { card: Card }; error?: any }> {
    try {
      const response = await apiClient.put(`/api/cards/${cardId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Update card error:', error);
      throw error;
    }
  },

  /**
   * Delete card (soft delete)
   */
  async deleteCard(cardId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const response = await apiClient.delete(`/api/cards/${cardId}`);
      return response.data;
    } catch (error) {
      console.error('Delete card error:', error);
      throw error;
    }
  },

  /**
   * Get card benefits
   */
  async getCardBenefits(cardId: string): Promise<{ success: boolean; data?: { benefits: CardBenefit[] }; error?: any }> {
    try {
      const response = await apiClient.get(`/api/cards/${cardId}/benefits`);
      return response.data;
    } catch (error) {
      console.error('Get card benefits error:', error);
      throw error;
    }
  },

  /**
   * Add card benefit
   */
  async addCardBenefit(
    cardId: string, 
    benefitData: {
      category: string;
      rewardRate: number;
      rewardCap?: number;
      conditions?: Record<string, any>;
      isActive?: boolean;
    }
  ): Promise<{ success: boolean; data?: { benefit: CardBenefit }; error?: any }> {
    try {
      const response = await apiClient.post(`/api/cards/${cardId}/benefits`, benefitData);
      return response.data;
    } catch (error) {
      console.error('Add card benefit error:', error);
      throw error;
    }
  },

  /**
   * Update card benefit
   */
  async updateCardBenefit(
    cardId: string,
    benefitId: string,
    updateData: {
      category?: string;
      rewardRate?: number;
      rewardCap?: number;
      conditions?: Record<string, any>;
      isActive?: boolean;
    }
  ): Promise<{ success: boolean; data?: { benefit: CardBenefit }; error?: any }> {
    try {
      const response = await apiClient.put(`/api/cards/${cardId}/benefits/${benefitId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Update card benefit error:', error);
      throw error;
    }
  },

  /**
   * Delete card benefit
   */
  async deleteCardBenefit(
    cardId: string,
    benefitId: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const response = await apiClient.delete(`/api/cards/${cardId}/benefits/${benefitId}`);
      return response.data;
    } catch (error) {
      console.error('Delete card benefit error:', error);
      throw error;
    }
  },
};
