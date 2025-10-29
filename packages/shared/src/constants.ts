/**
 * Application constants for FinMatter
 */

// App configuration
export const APP_CONFIG = {
  name: 'FinMatter',
  version: '1.0.0',
  description:
    'Your Smartest Financial Move - The personal finance super app to optimize credit cards, track spending, and get AI-powered insights.',
  website: 'https://finmatter.app',
  supportEmail: 'support@finmatter.app',
} as const;

// API configuration
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
} as const;

// Pagination defaults
export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
} as const;

// Transaction categories
export const TRANSACTION_CATEGORIES = [
  'dining',
  'shopping',
  'groceries',
  'fuel',
  'travel',
  'entertainment',
  'bills',
  'healthcare',
  'education',
  'transport',
  'utilities',
  'insurance',
  'investment',
  'others',
] as const;

// Card networks
export const CARD_NETWORKS = [
  'visa',
  'mastercard',
  'rupay',
  'amex',
  'discover',
] as const;

// Card types
export const CARD_TYPES = ['credit', 'debit', 'prepaid'] as const;

// Reward types
export const REWARD_TYPES = ['cashback', 'points', 'miles', 'none'] as const;

// Indian banks
export const INDIAN_BANKS = [
  { name: 'HDFC Bank', code: 'HDFC', logo: 'hdfc.png' },
  { name: 'ICICI Bank', code: 'ICICI', logo: 'icici.png' },
  { name: 'State Bank of India', code: 'SBI', logo: 'sbi.png' },
  { name: 'Axis Bank', code: 'AXIS', logo: 'axis.png' },
  { name: 'Kotak Mahindra Bank', code: 'KOTAK', logo: 'kotak.png' },
  { name: 'IndusInd Bank', code: 'INDUSIND', logo: 'indusind.png' },
  { name: 'Yes Bank', code: 'YES', logo: 'yes.png' },
  { name: 'Federal Bank', code: 'FEDERAL', logo: 'federal.png' },
  { name: 'IDFC First Bank', code: 'IDFC', logo: 'idfc.png' },
  { name: 'RBL Bank', code: 'RBL', logo: 'rbl.png' },
] as const;

// Popular credit cards (for quick setup)
export const POPULAR_CARDS = [
  {
    bankName: 'HDFC Bank',
    cardName: 'Millennia Credit Card',
    rewardType: 'cashback',
    annualFee: 1000,
    benefits: [
      { category: 'shopping', rewardRate: 5, rewardType: 'cashback' },
      { category: 'dining', rewardRate: 5, rewardType: 'cashback' },
      { category: 'others', rewardRate: 1, rewardType: 'cashback' },
    ],
  },
  {
    bankName: 'ICICI Bank',
    cardName: 'Amazon Pay Credit Card',
    rewardType: 'cashback',
    annualFee: 0,
    benefits: [
      {
        category: 'shopping',
        rewardRate: 5,
        rewardType: 'cashback',
        conditions: ['amazon'],
      },
      { category: 'others', rewardRate: 2, rewardType: 'cashback' },
    ],
  },
  {
    bankName: 'SBI',
    cardName: 'SimplyCLICK Credit Card',
    rewardType: 'points',
    annualFee: 500,
    benefits: [
      { category: 'dining', rewardRate: 10, rewardType: 'points' },
      { category: 'entertainment', rewardRate: 10, rewardType: 'points' },
      { category: 'others', rewardRate: 5, rewardType: 'points' },
    ],
  },
  {
    bankName: 'Axis Bank',
    cardName: 'Magnus Credit Card',
    rewardType: 'points',
    annualFee: 10000,
    benefits: [
      {
        category: 'travel',
        rewardRate: 25,
        rewardType: 'points',
        conditions: ['min_200'],
      },
      { category: 'others', rewardRate: 12, rewardType: 'points' },
    ],
  },
] as const;

// Date formats
export const DATE_FORMATS = {
  display: 'MMM dd, yyyy',
  short: 'dd/MM/yyyy',
  long: 'EEEE, MMMM dd, yyyy',
  time: 'HH:mm',
  datetime: 'MMM dd, yyyy HH:mm',
  iso: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

// Currency configuration
export const CURRENCY_CONFIG = {
  default: 'INR',
  symbol: '₹',
  decimals: 2,
  thousandsSeparator: ',',
  decimalSeparator: '.',
} as const;

// File upload limits
export const FILE_LIMITS = {
  pdf: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['application/pdf'],
  },
  image: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  transaction: 'transaction',
  goal: 'goal',
  recommendation: 'recommendation',
  security: 'security',
  system: 'system',
} as const;

// AI Assistant configuration
export const AI_CONFIG = {
  model: 'gpt-4o-mini',
  maxTokens: 1000,
  temperature: 0.7,
  maxContextLength: 4000,
  rateLimit: {
    free: 10, // queries per day
    premium: 100, // queries per day
  },
} as const;

// Goal types
export const GOAL_TYPES = [
  'spending_limit',
  'savings_goal',
  'debt_payoff',
  'investment_target',
] as const;

// Goal periods
export const GOAL_PERIODS = [
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
] as const;

// Theme configuration
export const THEME_CONFIG = {
  colors: {
    primary: '#13a4ec', // Updated brand color
    secondary: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4',
    backgroundLight: '#f6f7f8',
    backgroundDark: '#101c22',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
} as const;

// Validation rules
export const VALIDATION_RULES = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[6-9]\d{9}$/,
  cardNumber: /^\d{4}$/,
  amount: /^\d+(\.\d{1,2})?$/,
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
} as const;

// Cache keys
export const CACHE_KEYS = {
  user: (id: string) => `user:${id}`,
  cards: (userId: string) => `cards:${userId}`,
  transactions: (userId: string) => `transactions:${userId}`,
  goals: (userId: string) => `goals:${userId}`,
  recommendations: (userId: string, amount: number, category: string) =>
    `recommendations:${userId}:${amount}:${category}`,
  aiConversation: (conversationId: string) =>
    `ai:conversation:${conversationId}`,
} as const;

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  PDF_PARSING_ERROR: 'PDF_PARSING_ERROR',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
} as const;

// Tutorial slides configuration
export const TUTORIAL_SLIDES = [
  {
    image: '/images/tutorial/card-optimizer.svg',
    icon: 'credit_card',
    title: 'Maximize Your Rewards',
    subtitle:
      'Get intelligent card recommendations for every purchase. Never miss out on cashback, points, or miles again.',
  },
  {
    image: '/images/tutorial/auto-categorize.svg',
    icon: 'category',
    title: 'Smart Transaction Sorting',
    subtitle:
      'Automatically categorize all your spending. Understand exactly where your money goes with zero manual effort.',
  },
  {
    image: '/images/tutorial/compare-cards.svg',
    icon: 'compare_arrows',
    title: 'Compare Cards Side-by-Side',
    subtitle:
      'Make informed decisions by comparing rewards, fees, and benefits. Find the perfect card for your spending style.',
  },
  {
    image: '/images/tutorial/goals-budgets.svg',
    icon: 'track_changes',
    title: 'Achieve Your Financial Goals',
    subtitle:
      'Set spending limits and savings targets. Track progress in real-time and stay on course with personalized insights.',
  },
  {
    image: '/images/tutorial/ai-assistant.svg',
    icon: 'smart_toy',
    title: 'Your AI Financial Advisor',
    subtitle:
      'Ask questions, get instant insights, and navigate your financial journey with ease. Available 24/7 to help you make smarter money decisions.',
  },
] as const;

// Tutorial CTA buttons
export const TUTORIAL_CTA = {
  getStarted: 'Join Finmatter today!',
  signIn: 'Welcome back, Sign In',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  CARD_ADDED: 'Card added successfully',
  CARD_UPDATED: 'Card updated successfully',
  CARD_DELETED: 'Card deleted successfully',
  TRANSACTION_ADDED: 'Transaction added successfully',
  TRANSACTION_UPDATED: 'Transaction updated successfully',
  STATEMENT_UPLOADED: 'Statement uploaded successfully',
  GOAL_CREATED: 'Goal created successfully',
  GOAL_UPDATED: 'Goal updated successfully',
  GOAL_DELETED: 'Goal deleted successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  EMAIL_VERIFIED: 'Email verified successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
} as const;
