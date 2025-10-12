import { apiClient } from '@/lib/apiClient';
import type {
  Card,
  CardBenefit,
  GetCardsResponse,
  GetCardResponse,
  CreateCardResponse,
  UpdateCardResponse,
  DeleteCardResponse,
  GetBenefitsResponse,
  CreateBenefitResponse,
} from '@finmatter/types';

export class CardService {
  async getCards(): Promise<Card[]> {
    try {
      const response = await apiClient.get<GetCardsResponse>('/api/cards');
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
      const response = await apiClient.get<GetCardResponse>(
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
      const response = await apiClient.post<CreateCardResponse>(
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
      const response = await apiClient.put<UpdateCardResponse>(
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
      const response = await apiClient.delete<DeleteCardResponse>(
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

  async getCardBenefits(cardId: string): Promise<CardBenefit[]> {
    try {
      const response = await apiClient.get<GetBenefitsResponse>(
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

  async addCardBenefit(cardId: string, benefit: any): Promise<CardBenefit> {
    try {
      const response = await apiClient.post<CreateBenefitResponse>(
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
