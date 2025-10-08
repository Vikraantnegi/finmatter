import { apiClient } from '@/lib/apiClient';
import { Card, CreateCardResponse, GetCardsResponse } from '@finmatter/types';

export class CardService {
  async getCards(): Promise<Card[]> {
    try {
      const response = await apiClient.get<GetCardsResponse>('/api/cards');
      return (response.data || []) as unknown as Card[];
    } catch (error) {
      console.error('Get cards error:', error);
      throw error;
    }
  }

  async getCard(cardId: string): Promise<Card> {
    try {
      const response = await apiClient.get<{ card: Card }>(`/api/cards/${cardId}`);
      return response.card;
    } catch (error) {
      console.error('Get card error:', error);
      throw error;
    }
  }

  async createCard(cardData: Partial<Card>): Promise<Card> {
    try {
      const response = await apiClient.post<CreateCardResponse>('/api/cards', cardData);
      return response.data as unknown as Card;
    } catch (error) {
      console.error('Create card error:', error);
      throw error;
    }
  }

  async updateCard(cardId: string, cardData: Partial<Card>): Promise<Card> {
    try {
      const response = await apiClient.put<{ card: Card }>(`/api/cards/${cardId}`, cardData);
      return response.card;
    } catch (error) {
      console.error('Update card error:', error);
      throw error;
    }
  }

  async deleteCard(cardId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/cards/${cardId}`);
    } catch (error) {
      console.error('Delete card error:', error);
      throw error;
    }
  }
}

export const cardService = new CardService();
