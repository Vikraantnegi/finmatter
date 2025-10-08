import { apiClient } from '@/lib/apiClient';
import { Card } from '@finmatter/types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

interface GetCardsResponse {
  cards: Card[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export class CardService {
  async getCards(): Promise<Card[]> {
    try {
      const response =
        await apiClient.get<ApiResponse<GetCardsResponse>>('/api/cards');
      if (response.success && response.data?.cards) {
        return response.data.cards;
      }
      throw new Error(response.error?.message || 'Failed to fetch cards');
    } catch (error) {
      console.error('Get cards error:', error);
      throw error;
    }
  }

  async getCardById(cardId: string): Promise<Card> {
    try {
      const response = await apiClient.get<ApiResponse<{ card: Card }>>(
        `/api/cards/${cardId}`,
      );
      if (response.success && response.data?.card) {
        return response.data.card;
      }
      throw new Error(response.error?.message || 'Failed to fetch card');
    } catch (error) {
      console.error('Get card error:', error);
      throw error;
    }
  }

  async createCard(cardData: any): Promise<Card> {
    try {
      const response = await apiClient.post<ApiResponse<{ card: Card }>>(
        '/api/cards',
        cardData,
      );
      if (response.success && response.data?.card) {
        return response.data.card;
      }
      throw new Error(response.error?.message || 'Failed to create card');
    } catch (error) {
      console.error('Create card error:', error);
      throw error;
    }
  }

  async updateCard(cardId: string, cardData: Partial<Card>): Promise<Card> {
    try {
      const response = await apiClient.put<ApiResponse<{ card: Card }>>(
        `/api/cards/${cardId}`,
        cardData,
      );
      if (response.success && response.data?.card) {
        return response.data.card;
      }
      throw new Error(response.error?.message || 'Failed to update card');
    } catch (error) {
      console.error('Update card error:', error);
      throw error;
    }
  }

  async deleteCard(cardId: string): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(
        `/api/cards/${cardId}`,
      );
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete card');
      }
    } catch (error) {
      console.error('Delete card error:', error);
      throw error;
    }
  }

  async getCardBenefits(cardId: string): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ benefits: any[] }>>(
        `/api/cards/${cardId}/benefits`,
      );
      if (response.success && response.data?.benefits) {
        return response.data.benefits;
      }
      return [];
    } catch (error) {
      console.error('Get card benefits error:', error);
      return [];
    }
  }

  async addCardBenefit(cardId: string, benefit: any): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<{ benefit: any }>>(
        `/api/cards/${cardId}/benefits`,
        benefit,
      );
      if (response.success && response.data?.benefit) {
        return response.data.benefit;
      }
      throw new Error(response.error?.message || 'Failed to add benefit');
    } catch (error) {
      console.error('Add benefit error:', error);
      throw error;
    }
  }
}

export const cardService = new CardService();
