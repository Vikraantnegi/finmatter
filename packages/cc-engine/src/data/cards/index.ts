// packages/cc-engine/src/data/cards/index.ts
// TOP 20 Most Popular Indian Credit Cards - January 2025

export interface CardMetadata {
  id: string;
  bankId: string;
  cardName: string;
  cardType: 'credit' | 'debit';
  network: 'visa' | 'mastercard' | 'rupay' | 'amex';
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  annualFee: number;
  joiningFee: number;
  rewardType: 'cashback' | 'points' | 'miles' | 'none';
  rewardRules: RewardRule[];
  benefits: string[];
  minIncome?: number;
  isActive: boolean;
  lastUpdated: string;
}

export interface RewardRule {
  category: string;
  rewardRate: number;
  rewardUnit: 'percent' | 'points_per_100' | 'miles_per_100';
  cap?: number;
  capPeriod?: 'monthly' | 'yearly';
  minTransaction?: number;
  conditions?: string[];
}

export interface BankMetadata {
  id: string;
  name: string;
  logoUrl: string;
  primaryColor: string;
  supportEmail?: string;
  supportPhone?: string;
}

export const BANK_DATABASE: BankMetadata[] = [
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    logoUrl: 'https://cdn.finmatter.app/banks/hdfc.png',
    primaryColor: '#004C8F',
    supportEmail: 'customer.service@hdfcbank.com',
    supportPhone: '1800-266-4332',
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    logoUrl: 'https://cdn.finmatter.app/banks/icici.png',
    primaryColor: '#F47920',
    supportEmail: 'customer.care@icicibank.com',
    supportPhone: '1860-120-7777',
  },
  {
    id: 'sbi',
    name: 'SBI Card',
    logoUrl: 'https://cdn.finmatter.app/banks/sbi.png',
    primaryColor: '#0D3C7C',
    supportEmail: 'customer.care@sbicard.com',
    supportPhone: '1860-180-1290',
  },
  {
    id: 'axis',
    name: 'Axis Bank',
    logoUrl: 'https://cdn.finmatter.app/banks/axis.png',
    primaryColor: '#800000',
    supportEmail: 'customer.care@axisbank.com',
    supportPhone: '1860-419-5555',
  },
  {
    id: 'amex',
    name: 'American Express',
    logoUrl: 'https://cdn.finmatter.app/banks/amex.png',
    primaryColor: '#006FCF',
    supportEmail: 'indiaservice@aexp.com',
    supportPhone: '1800-234-2639',
  },
];

export const CARD_DATABASE: CardMetadata[] = [
  // ===== HDFC CARDS (5) =====
  {
    id: 'hdfc-millennia',
    bankId: 'hdfc',
    cardName: 'HDFC Millennia Credit Card',
    cardType: 'credit',
    network: 'visa',
    primaryColor: '#004C8F',
    secondaryColor: '#0066CC',
    annualFee: 1000,
    joiningFee: 1000,
    rewardType: 'cashback',
    rewardRules: [
      {
        category: 'shopping',
        rewardRate: 5,
        rewardUnit: 'percent',
        cap: 1000,
        capPeriod: 'monthly',
        conditions: ['Online purchases only', 'Minimum ₹1000 per transaction'],
      },
      {
        category: 'dining',
        rewardRate: 5,
        rewardUnit: 'percent',
        cap: 1000,
        capPeriod: 'monthly',
      },
      {
        category: 'default',
        rewardRate: 1,
        rewardUnit: 'percent',
      },
    ],
    benefits: [
      '5% cashback on shopping and dining (up to ₹1000/month)',
      '1% cashback on all other spends',
      '4 complimentary airport lounge visits per year',
      '1% fuel surcharge waiver',
      'Annual fee waived on ₹1L annual spend',
    ],
    minIncome: 25000,
    isActive: true,
    lastUpdated: '2025-01-01',
  },
  {
    id: 'hdfc-regalia',
    bankId: 'hdfc',
    cardName: 'HDFC Regalia Credit Card',
    cardType: 'credit',
    network: 'visa',
    primaryColor: '#8B4513',
    secondaryColor: '#D4AF37',
    annualFee: 2500,
    joiningFee: 2500,
    rewardType: 'points',
    rewardRules: [
      {
        category: 'travel',
        rewardRate: 4,
        rewardUnit: 'points_per_100',
      },
      {
        category: 'dining',
        rewardRate: 4,
        rewardUnit: 'points_per_100',
      },
      {
        category: 'default',
        rewardRate: 4,
        rewardUnit: 'points_per_100',
      },
    ],
    benefits: [
      '4 reward points per ₹150 spent',
      'Unlimited domestic airport lounge access',
      '6 international lounge visits per year',
      'Air accident cover of ₹1 crore',
      'Annual fee waived on ₹3L annual spend',
    ],
    minIncome: 100000,
    isActive: true,
    lastUpdated: '2025-01-01',
  },
  {
    id: 'hdfc-moneyback',
    bankId: 'hdfc',
    cardName: 'HDFC MoneyBack+ Credit Card',
    cardType: 'credit',
    network: 'visa',
    primaryColor: '#FF6B35',
    secondaryColor: '#FF8C42',
    annualFee: 500,
    joiningFee: 500,
    rewardType: 'points',
    rewardRules: [
      {
        category: 'online',
        rewardRate: 2,
        rewardUnit: 'points_per_100',
        conditions: ['Online transactions only'],
      },
      {
        category: 'default',
        rewardRate: 1,
        rewardUnit: 'points_per_100',
      },
    ],
    benefits: [
      '2 reward points per ₹150 on online spends',
      '1 reward point per ₹150 on offline spends',
      '1% fuel surcharge waiver',
      'Annual fee waived on ₹50k annual spend',
    ],
    minIncome: 15000,
    isActive: true,
    lastUpdated: '2025-01-01',
  },
  {
    id: 'hdfc-diners-black',
    bankId: 'hdfc',
    cardName: 'HDFC Diners Club Black',
    cardType: 'credit',
    network: 'mastercard',
    primaryColor: '#000000',
    secondaryColor: '#1A1A1A',
    annualFee: 10000,
    joiningFee: 10000,
    rewardType: 'points',
    rewardRules: [
      {
        category: 'default',
        rewardRate: 3.3,
        rewardUnit: 'points_per_100',
      },
    ],
    benefits: [
      '5 reward points per ₹150 spent',
      'Unlimited domestic and international lounge access',
      'Golf privileges - 6 rounds per year',
      'Complimentary Club Marriott membership',
      'Annual fee waived on ₹5L annual spend',
    ],
    minIncome: 200000,
    isActive: true,
    lastUpdated: '2025-01-01',
  },
  {
    id: 'hdfc-infinia',
    bankId: 'hdfc',
    cardName: 'HDFC Infinia Credit Card',
    cardType: 'credit',
    network: 'visa',
    primaryColor: '#4A148C',
    secondaryColor: '#7B1FA2',
    annualFee: 12500,
    joiningFee: 12500,
    rewardType: 'points',
    rewardRules: [
      {
        category: 'default',
        rewardRate: 3.3,
        rewardUnit: 'points_per_100',
      },
    ],
    benefits: [
      '5 reward points per ₹150 spent',
      'Unlimited domestic and international lounge access',
      'Complimentary ITC Hotel vouchers',
      'Priority Pass membership',
      'Concierge services',
    ],
    minIncome: 250000,
    isActive: true,
    lastUpdated: '2025-01-01',
  },
  {
    id: 'hdfc-tata-neu-plus',
    bankId: 'hdfc',
    cardName: 'HDFC Tata Neu Plus Credit Card',
    cardType: 'credit',
    network: 'rupay',
    primaryColor: '#1C4587',
    secondaryColor: '#4A90E2',
    annualFee: 0,
    joiningFee: 0,
    rewardType: 'points',
    rewardRules: [
      {
        category: 'tata',
        rewardRate: 5,
        rewardUnit: 'percent',
        conditions: [
          'Tata brands: BigBasket, 1mg, Croma, Westside, Titan, etc.',
        ],
      },
      {
        category: 'upi',
        rewardRate: 1,
        rewardUnit: 'percent',
        conditions: ['UPI transactions only'],
      },
      {
        category: 'default',
        rewardRate: 0.5,
        rewardUnit: 'percent',
      },
    ],
    benefits: [
      '5% NeuCoins on all Tata brands (BigBasket, 1mg, Croma, Westside, Taj, Air India, etc.)',
      '1% NeuCoins on UPI spends',
      '0.5% NeuCoins on other spends',
      'Lifetime free - no annual fee',
      'UPI enabled credit card',
    ],
    isActive: true,
    lastUpdated: '2025-01-01',
  },

  // ===== ICICI CARDS (5) =====
  {
    id: 'icici-amazon-pay',
    bankId: 'icici',
    cardName: 'ICICI Amazon Pay Credit Card',
    cardType: 'credit',
    network: 'visa',
    primaryColor: '#FF9900',
    secondaryColor: '#232F3E',
    annualFee: 0,
    joiningFee: 0,
    rewardType: 'cashback',
    rewardRules: [
      {
        category: 'amazon',
        rewardRate: 5,
        rewardUnit: 'percent',
        conditions: ['Amazon Prime members only'],
      },
      {
        category: 'amazon',
        rewardRate: 3,
        rewardUnit: 'percent',
        conditions: ['Non-Prime members'],
      },
      {
        category: 'default',
        rewardRate: 1,
        rewardUnit: 'percent',
      },
    ],
    benefits: [
      '5% cashback on Amazon.in (Prime members)',
      '3% cashback on Amazon.in (non-Prime)',
      '2% cashback on dining and Uber',
      '1% cashback everywhere else',
      'Lifetime free - no annual fee',
    ],
    isActive: true,
    lastUpdated: '2025-01-01',
  },
  {
    id: 'icici-platinum',
    bankId: 'icici',
    cardName: 'ICICI Platinum Chip Credit Card',
    cardType: 'credit',
    network: 'visa',
    primaryColor: '#C0C0C0',
    secondaryColor: '#A8A8A8',
    annualFee: 0,
    joiningFee: 0,
    rewardType: 'points',
    rewardRules: [
      {
        category: 'default',
        rewardRate: 2,
        rewardUnit: 'points_per_100',
      },
    ],
    benefits: [
      '2 reward points per ₹100 spent',
      '1% fuel surcharge waiver',
      'Lost card liability cover',
      'Lifetime free card',
    ],
    isActive: true,
    lastUpdated: '2025-01-01',
  },
  {
    id: 'icici-sapphiro',
    bankId: 'icici',
    cardName: 'ICICI Sapphiro Credit Card',
    cardType: 'credit',
    network: 'visa',
    primaryColor: '#0F52BA',
    secondaryColor: '#4169E1',
    annualFee: 3500,
    joiningFee: 3500,
    rewardType: 'points',
    rewardRules: [
      {
        category: 'travel',
        rewardRate: 4,
        rewardUnit: 'points_per_100',
      },
      {
        category: 'default',
        rewardRate: 2,
        rewardUnit: 'points_per_100',
      },
    ],
    benefits: [
      '4 reward points per ₹100 on travel',
      '2 reward points per ₹100 on other spends',
      'Unlimited domestic lounge access',
      '12 international lounge visits per year',
      'Annual fee waived on ₹5L annual spend',
    ],
    minIncome: 80000,
    isActive: true,
    lastUpdated: '2025-01-01',
  },
  {
    id: 'icici-coral',
    bankId: 'icici',
    cardName: 'ICICI Coral Credit Card',
    cardType: 'credit',
    network: 'visa',
    primaryColor: '#FF7F50',
    secondaryColor: '#FF6347',
    annualFee: 500,
    joiningFee: 500,
    rewardType: 'points',
    rewardRules: [
      {
        category: 'dining',
        rewardRate: 2,
        rewardUnit: 'points_per_100',
      },
      {
        category: 'default',
        rewardRate: 1,
        rewardUnit: 'points_per_100',
      },
    ],
    benefits: [
      '2 reward points per ₹100 on dining',
      '1 reward point per ₹100 on other spends',
      '2 complimentary airport lounge visits per year',
      '1% fuel surcharge waiver',
      'Annual fee waived on ₹1L annual spend',
    ],
    minIncome: 25000,
    isActive: true,
    lastUpdated: '2025-01-01',
  },
  {
    id: 'icici-manchester-united',
    bankId: 'icici',
    cardName: 'ICICI Manchester United Credit Card',
    cardType: 'credit',
    network: 'visa',
    primaryColor: '#DA291C',
    secondaryColor: '#FFD700',
    annualFee: 500,
    joiningFee: 500,
    rewardType: 'points',
    rewardRules: [
      {
        category: 'default',
        rewardRate: 2,
        rewardUnit: 'points_per_100',
      },
    ],
    benefits: [
      '2 reward points per ₹100 spent',
      'Exclusive Manchester United merchandise',
      '1% fuel surcharge waiver',
      'Annual fee waived on ₹1L annual spend',
    ],
    minIncome: 25000,
    isActive: true,
    lastUpdated: '2025-01-01',
  },

  // ===== SBI CARDS (4) =====
  {
    id: 'sbi-simplyclick',
    bankId: 'sbi',
    cardName: 'SBI SimplyCLICK Credit Card',
    cardType: 'credit',
    network: 'visa',
    primaryColor: '#0D3C7C',
    secondaryColor: '#4A90E2',
    annualFee: 499,
    joiningFee: 499,
    rewardType: 'points',
    rewardRules: [
      {
        category: 'dining',
        rewardRate: 10,
        rewardUnit: 'points_per_100',
      },
      {
        category: 'movies',
        rewardRate: 10,
        rewardUnit: 'points_per_100',
      },
      {
        category: 'shopping',
        rewardRate: 5,
        rewardUnit: 'points_per_100',
        conditions: ['Online shopping only'],
      },
      {
        category: 'default',
        rewardRate: 1,
        rewardUnit: 'points_per_100',
      },
    ],
    benefits: [
      '10X reward points on dining and movies',
      '5X reward points on online shopping',
      '1% fuel surcharge waiver',
      'Annual fee waived on ₹1L annual spend',
    ],
    minIncome: 20000,
    isActive: true,
    lastUpdated: '2025-01-01',
  },
  {
    id: 'sbi-simplysave',
    bankId: 'sbi',
    cardName: 'SBI SimplySAVE Credit Card',
    cardType: 'credit',
    network: 'visa',
    primaryColor: '#28A745',
    secondaryColor: '#20C997',
    annualFee: 499,
    joiningFee: 499,
    rewardType: 'cashback',
    rewardRules: [
      {
        category: 'dining',
        rewardRate: 10,
        rewardUnit: 'percent',
      },
      {
        category: 'groceries',
        rewardRate: 5,
        rewardUnit: 'percent',
      },
      {
        category: 'default',
        rewardRate: 1,
        rewardUnit: 'percent',
      },
    ],
    benefits: [
      '10% cashback on dining',
      '5% cashback on grocery shopping',
      '1% cashback on other spends',
      '1% fuel surcharge waiver',
      'Annual fee waived on ₹1L annual spend',
    ],
    minIncome: 20000,
    isActive: true,
    lastUpdated: '2025-01-01',
  },
  {
    id: 'sbi-prime',
    bankId: 'sbi',
    cardName: 'SBI Card PRIME',
    cardType: 'credit',
    network: 'visa',
    primaryColor: '#6F42C1',
    secondaryColor: '#9B59B6',
    annualFee: 2999,
    joiningFee: 2999,
    rewardType: 'points',
    rewardRules: [
      {
        category: 'default',
        rewardRate: 10,
        rewardUnit: 'points_per_100',
      },
    ],
    benefits: [
      '10X reward points on all spends',
      'Unlimited domestic airport lounge access',
      '2 international lounge visits per year',
      'Complimentary golf lessons',
      'Annual fee waived on ₹2L annual spend',
    ],
    minIncome: 70000,
    isActive: true,
    lastUpdated: '2025-01-01',
  },
  {
    id: 'sbi-aurum',
    bankId: 'sbi',
    cardName: 'SBI Card Aurum',
    cardType: 'credit',
    network: 'visa',
    primaryColor: '#FFD700',
    secondaryColor: '#FFA500',
    annualFee: 4999,
    joiningFee: 4999,
    rewardType: 'points',
    rewardRules: [
      {
        category: 'default',
        rewardRate: 15,
        rewardUnit: 'points_per_100',
      },
    ],
    benefits: [
      '15X reward points on all spends',
      'Unlimited domestic airport lounge access',
      '6 international lounge visits per year',
      'Golf privileges',
      'Movie ticket discounts',
      'Annual fee waived on ₹3L annual spend',
    ],
    minIncome: 100000,
    isActive: true,
    lastUpdated: '2025-01-01',
  },

  // ===== AXIS CARDS (3) =====
  {
    id: 'axis-magnus',
    bankId: 'axis',
    cardName: 'Axis Bank Magnus Credit Card',
    cardType: 'credit',
    network: 'visa',
    primaryColor: '#800000',
    secondaryColor: '#A52A2A',
    annualFee: 10000,
    joiningFee: 10000,
    rewardType: 'points',
    rewardRules: [
      {
        category: 'travel',
        rewardRate: 25,
        rewardUnit: 'points_per_100',
      },
      {
        category: 'default',
        rewardRate: 12,
        rewardUnit: 'points_per_100',
      },
    ],
    benefits: [
      '25 EDGE reward points per ₹200 on travel',
      '12 EDGE reward points per ₹200 on other spends',
      'Unlimited domestic and international lounge access',
      'Golf privileges',
      'Buy One Get One movie tickets',
      'Annual fee waived on ₹15L annual spend',
    ],
    minIncome: 180000,
    isActive: true,
    lastUpdated: '2025-01-01',
  },
  {
    id: 'axis-vistara',
    bankId: 'axis',
    cardName: 'Axis Vistara Infinite Credit Card',
    cardType: 'credit',
    network: 'visa',
    primaryColor: '#4B0082',
    secondaryColor: '#663399',
    annualFee: 10000,
    joiningFee: 10000,
    rewardType: 'miles',
    rewardRules: [
      {
        category: 'travel',
        rewardRate: 10,
        rewardUnit: 'miles_per_100',
      },
      {
        category: 'default',
        rewardRate: 4,
        rewardUnit: 'miles_per_100',
      },
    ],
    benefits: [
      '10 CV Points per ₹100 on travel bookings',
      '4 CV Points per ₹100 on other spends',
      '2 complimentary Vistara tickets per year',
      'Unlimited airport lounge access',
      'Priority check-in and boarding',
      'Annual fee waived on ₹5L annual spend',
    ],
    minIncome: 180000,
    isActive: true,
    lastUpdated: '2025-01-01',
  },
  {
    id: 'axis-flipkart',
    bankId: 'axis',
    cardName: 'Flipkart Axis Bank Credit Card',
    cardType: 'credit',
    network: 'visa',
    primaryColor: '#2874F0',
    secondaryColor: '#FFE600',
    annualFee: 500,
    joiningFee: 500,
    rewardType: 'cashback',
    rewardRules: [
      {
        category: 'flipkart',
        rewardRate: 5,
        rewardUnit: 'percent',
        conditions: ['Flipkart, Myntra, 2GUD purchases'],
      },
      {
        category: 'dining',
        rewardRate: 4,
        rewardUnit: 'percent',
      },
      {
        category: 'default',
        rewardRate: 1.5,
        rewardUnit: 'percent',
      },
    ],
    benefits: [
      '5% cashback on Flipkart, Myntra, 2GUD',
      '4% cashback on dining and Swiggy/Zomato',
      '1.5% cashback on other spends',
      'Unlimited 1% cashback on bill payments',
      'Annual fee waived on ₹2L annual spend',
    ],
    minIncome: 20000,
    isActive: true,
    lastUpdated: '2025-01-01',
  },

  // ===== AMERICAN EXPRESS (3) =====
  {
    id: 'amex-gold',
    bankId: 'amex',
    cardName: 'American Express Gold Card',
    cardType: 'credit',
    network: 'amex',
    primaryColor: '#D4AF37',
    secondaryColor: '#FFD700',
    annualFee: 4500,
    joiningFee: 1000,
    rewardType: 'points',
    rewardRules: [
      {
        category: 'travel',
        rewardRate: 4,
        rewardUnit: 'points_per_100',
      },
      {
        category: 'dining',
        rewardRate: 4,
        rewardUnit: 'points_per_100',
      },
      {
        category: 'default',
        rewardRate: 1,
        rewardUnit: 'points_per_100',
      },
    ],
    benefits: [
      '4 reward points per ₹50 on travel and dining',
      '1 reward point per ₹50 on other spends',
      '8 complimentary airport lounge visits per year',
      'Taj Epicure membership',
      'Annual Taj hotel voucher worth ₹5000',
    ],
    minIncome: 60000,
    isActive: true,
    lastUpdated: '2025-01-01',
  },
  {
    id: 'amex-platinum-travel',
    bankId: 'amex',
    cardName: 'American Express Platinum Travel Card',
    cardType: 'credit',
    network: 'amex',
    primaryColor: '#C0C0C0',
    secondaryColor: '#E8E8E8',
    annualFee: 3500,
    joiningFee: 3500,
    rewardType: 'points',
    rewardRules: [
      {
        category: 'travel',
        rewardRate: 10,
        rewardUnit: 'points_per_100',
      },
      {
        category: 'default',
        rewardRate: 1,
        rewardUnit: 'points_per_100',
      },
    ],
    benefits: [
      '10 reward points per ₹50 on travel bookings',
      '1 reward point per ₹50 on other spends',
      'Complimentary Priority Pass membership',
      'Unlimited lounge access',
      'Travel insurance up to ₹50 lakhs',
    ],
    minIncome: 60000,
    isActive: true,
    lastUpdated: '2025-01-01',
  },
  {
    id: 'amex-mrcc',
    bankId: 'amex',
    cardName: 'American Express Membership Rewards Card',
    cardType: 'credit',
    network: 'amex',
    primaryColor: '#006FCF',
    secondaryColor: '#0099FF',
    annualFee: 1000,
    joiningFee: 1000,
    rewardType: 'points',
    rewardRules: [
      {
        category: 'default',
        rewardRate: 1,
        rewardUnit: 'points_per_100',
      },
    ],
    benefits: [
      '1 reward point per ₹50 on all spends',
      '1000 bonus points on spending ₹6000 in a month (4 times per year)',
      'Reward points never expire',
      'Convert points to frequent flyer miles',
      'Annual fee waived on ₹1.5L annual spend',
    ],
    minIncome: 30000,
    isActive: true,
    lastUpdated: '2025-01-01',
  },
];

// Helper functions
export function getCardById(cardId: string): CardMetadata | undefined {
  return CARD_DATABASE.find(card => card.id === cardId);
}

export function getCardsByBank(bankId: string): CardMetadata[] {
  return CARD_DATABASE.filter(card => card.bankId === bankId && card.isActive);
}

export function getBankById(bankId: string): BankMetadata | undefined {
  return BANK_DATABASE.find(bank => bank.id === bankId);
}

export function searchCards(query: string): CardMetadata[] {
  const lowerQuery = query.toLowerCase();
  return CARD_DATABASE.filter(
    card =>
      card.cardName.toLowerCase().includes(lowerQuery) ||
      card.bankId.toLowerCase().includes(lowerQuery),
  ).filter(card => card.isActive);
}

export function getAllBanks(): BankMetadata[] {
  return BANK_DATABASE;
}

export function getAllCards(): CardMetadata[] {
  return CARD_DATABASE.filter(card => card.isActive);
}
