import type { PaginationParams, PaginatedResponse, ApiResponse, ApiError } from './common';

/**
 * API request and response types for FinMatter
 */

// Auth API types (Phone Authentication)
export type SendOTPRequest = {
  phoneNumber: string;
};

export type SendOTPResponse = ApiResponse<{
  success: boolean;
  message: string;
  expiresIn: number; // seconds
}>;

export type VerifyOTPRequest = {
  phoneNumber: string;
  otp: string;
};

export type VerifyOTPResponse = ApiResponse<{
  user: {
    id: string;
    phoneNumber: string;
    isVerified: boolean;
    biometricEnabled: boolean;
    createdAt: string;
    lastLogin?: string;
  };
  session: {
    token: string;
    refreshToken: string;
    expiresAt: string;
  };
}>;

// Legacy email-based auth types (deprecated)
export type LoginRequest = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type LoginResponse = ApiResponse<{
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    avatar?: string;
    role: string;
    status: string;
  };
  session: {
    token: string;
    refreshToken: string;
    expiresAt: string;
  };
}>;

export type SignupRequest = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
};

export type SignupResponse = ApiResponse<{
  user: {
    id: string;
    email: string;
    status: string;
  };
  verificationRequired: boolean;
}>;

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type RefreshTokenResponse = ApiResponse<{
  token: string;
  refreshToken: string;
  expiresAt: string;
}>;

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  token: string;
  password: string;
};

// Cards API types
export type GetCardsRequest = PaginationParams & {
  status?: string;
  bankName?: string;
};

export type GetCardsResponse = PaginatedResponse<{
  id: string;
  bankName: string;
  cardName: string;
  lastFourDigits: string;
  cardType: string;
  network: string;
  rewardType: string;
  annualFee: number;
  status: string;
  benefits: Array<{
    category: string;
    rewardRate: number;
    rewardType: string;
    isActive: boolean;
  }>;
}>;

export type CreateCardRequest = {
  bankName: string;
  cardName: string;
  lastFourDigits: string;
  cardType: string;
  network: string;
  rewardType: string;
  annualFee: number;
  benefits: Array<{
    category: string;
    rewardRate: number;
    rewardType: string;
    rewardCap?: number;
    conditions?: string[];
  }>;
};

export type CreateCardResponse = ApiResponse<{
  id: string;
  bankName: string;
  cardName: string;
  lastFourDigits: string;
}>;

export type UpdateCardRequest = {
  cardName?: string;
  rewardType?: string;
  annualFee?: number;
  status?: string;
  benefits?: Array<{
    id?: string;
    category: string;
    rewardRate: number;
    rewardType: string;
    rewardCap?: number;
    conditions?: string[];
    isActive?: boolean;
  }>;
};

export type DeleteCardResponse = ApiResponse<{
  message: string;
}>;

// Transactions API types
export type GetTransactionsRequest = PaginationParams & {
  cardId?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  amountRange?: {
    min: number;
    max: number;
  };
};

export type GetTransactionsResponse = PaginatedResponse<{
  id: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  merchantName: string;
  category: string;
  subcategory?: string;
  date: string;
  card?: {
    id: string;
    cardName: string;
    lastFourDigits: string;
  };
  tags?: string[];
  notes?: string;
}>;

export type CreateTransactionRequest = {
  cardId?: string;
  amount: number;
  type: string;
  merchantName: string;
  description?: string;
  date: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  notes?: string;
};

export type UpdateTransactionRequest = {
  category?: string;
  subcategory?: string;
  tags?: string[];
  notes?: string;
  merchantName?: string;
  amount?: number;
};

export type TransactionStatsResponse = ApiResponse<{
  totalSpent: number;
  totalEarned: number;
  transactionCount: number;
  averageTransactionValue: number;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    count: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
}>;

// Statements API types
export type UploadStatementRequest = {
  cardId: string;
  bankName: string;
  statementPeriod: {
    startDate: string;
    endDate: string;
  };
  file: File;
};

export type UploadStatementResponse = ApiResponse<{
  statementId: string;
  transactionCount: number;
  status: string;
}>;

export type GetStatementsRequest = PaginationParams & {
  cardId?: string;
  status?: string;
};

export type GetStatementsResponse = PaginatedResponse<{
  id: string;
  cardId: string;
  bankName: string;
  uploadDate: string;
  transactionCount: number;
  status: string;
  statementPeriod: {
    startDate: string;
    endDate: string;
  };
}>;

// Optimizer API types
export type CardOptimizerRequest = {
  amount: number;
  category: string;
  merchantName?: string;
};

export type CardOptimizerResponse = ApiResponse<{
  bestCard: {
    id: string;
    cardName: string;
    bankName: string;
    lastFourDigits: string;
  };
  expectedReward: number;
  rewardType: string;
  reasoning: string;
  confidence: number;
  alternatives: Array<{
    card: {
      id: string;
      cardName: string;
      bankName: string;
      lastFourDigits: string;
    };
    reward: number;
    reasoning: string;
  }>;
}>;

export type BatchOptimizerRequest = {
  transactions: Array<{
    amount: number;
    category: string;
    merchantName?: string;
  }>;
};

export type BatchOptimizerResponse = ApiResponse<{
  recommendations: Array<{
    transaction: {
      amount: number;
      category: string;
      merchantName?: string;
    };
    recommendation: CardOptimizerResponse['data'];
  }>;
}>;

// AI Assistant API types
export type AIChatRequest = {
  message: string;
  conversationId?: string;
  context?: Record<string, any>;
};

export type AIChatResponse = ApiResponse<{
  reply: string;
  conversationId: string;
  confidence: number;
  sources?: string[];
  suggestions?: string[];
}>;

// Goals API types
export type GetGoalsRequest = PaginationParams & {
  type?: string;
  status?: string;
};

export type CreateGoalRequest = {
  goalType: string;
  category?: string;
  targetAmount: number;
  period: string;
  startDate: string;
  endDate: string;
  notificationsEnabled?: boolean;
};

export type UpdateGoalRequest = {
  targetAmount?: number;
  period?: string;
  endDate?: string;
  notificationsEnabled?: boolean;
  isActive?: boolean;
};

// Analytics API types
export type DashboardOverviewResponse = ApiResponse<{
  totalSpending: number;
  topCategory: {
    category: string;
    amount: number;
    percentage: number;
  };
  mostUsedCard: {
    cardId: string;
    cardName: string;
    amount: number;
    percentage: number;
  };
  monthOverMonth: {
    currentMonth: number;
    previousMonth: number;
    change: number;
    changePercentage: number;
  };
  recentTransactions: Array<{
    id: string;
    amount: number;
    merchantName: string;
    category: string;
    date: string;
  }>;
}>;

export type SpendingByCategoryResponse = ApiResponse<{
  categories: Array<{
    category: string;
    amount: number;
    percentage: number;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  totalAmount: number;
  period: {
    startDate: string;
    endDate: string;
  };
}>;

export type CardUsageResponse = ApiResponse<{
  cards: Array<{
    cardId: string;
    cardName: string;
    bankName: string;
    amount: number;
    percentage: number;
    transactionCount: number;
    averageTransactionValue: number;
    rewardsEarned: number;
  }>;
  totalSpending: number;
  totalRewards: number;
}>;

// Error response type
export type ErrorResponse = {
  success: false;
  error: ApiError;
  timestamp: string;
};
