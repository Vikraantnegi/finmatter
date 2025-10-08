import {
  BANK_DATABASE,
  CardMetadata,
  BankMetadata,
  getCardById as dbGetCardById,
  getCardsByBank as dbGetCardsByBank,
  getBankById as dbGetBankById,
  searchCards as dbSearchCards,
  getAllBanks as dbGetAllBanks,
  getAllCards as dbGetAllCards
} from '../data/cards';

export class CardSearchService {
  // Get all banks
  getAllBanks(): BankMetadata[] {
    return dbGetAllBanks();
  }

  // Get all cards
  getAllCards(): CardMetadata[] {
    return dbGetAllCards();
  }

  // Get cards by bank
  getCardsByBank(bankId: string): CardMetadata[] {
    return dbGetCardsByBank(bankId);
  }

  // Get specific card
  getCardById(cardId: string): CardMetadata | undefined {
    return dbGetCardById(cardId);
  }

  // Get bank by ID
  getBankById(bankId: string): BankMetadata | undefined {
    return dbGetBankById(bankId);
  }

  // Search cards by name
  searchCards(query: string): CardMetadata[] {
    return dbSearchCards(query);
  }

  // Fuzzy match for card identification (from PDF parsing)
  matchCardFromStatement(bankName: string, cardName?: string): CardMetadata | null {
    // Try to match bank first
    const bank = BANK_DATABASE.find(b =>
      bankName.toLowerCase().includes(b.name.toLowerCase()) ||
      b.name.toLowerCase().includes(bankName.toLowerCase())
    );

    if (!bank) return null;

    // If card name provided, try to match
    if (cardName) {
      const cards = this.getCardsByBank(bank.id);
      return cards.find(c =>
        cardName.toLowerCase().includes(c.cardName.toLowerCase().replace('credit card', '').trim())
      ) || null;
    }

    return null;
  }

  // Get popular cards (for quick add)
  getPopularCards(limit: number = 10): CardMetadata[] {
    // Return first N cards (sorted by popularity - you can add a popularity field later)
    return dbGetAllCards().slice(0, limit);
  }

  // Filter cards by criteria
  filterCards(filters: {
    minIncome?: number;
    maxAnnualFee?: number;
    rewardType?: 'cashback' | 'points' | 'miles';
    network?: 'visa' | 'mastercard' | 'rupay' | 'amex';
  }): CardMetadata[] {
    let cards = dbGetAllCards();

    if (filters.minIncome) {
      cards = cards.filter(c => !c.minIncome || c.minIncome <= filters.minIncome!);
    }

    if (filters.maxAnnualFee !== undefined) {
      cards = cards.filter(c => c.annualFee <= filters.maxAnnualFee!);
    }

    if (filters.rewardType) {
      cards = cards.filter(c => c.rewardType === filters.rewardType);
    }

    if (filters.network) {
      cards = cards.filter(c => c.network === filters.network);
    }

    return cards;
  }

  // Get card count by bank
  getCardCountByBank(bankId: string): number {
    return this.getCardsByBank(bankId).length;
  }

  // Get all banks with card counts
  getBanksWithCardCounts(): Array<BankMetadata & { cardCount: number }> {
    return this.getAllBanks().map(bank => ({
      ...bank,
      cardCount: this.getCardCountByBank(bank.id)
    }));
  }
}

// Export singleton instance
export const cardSearchService = new CardSearchService();

