// Database types
export * from './database';

// User types
export * from './user';

// Auth types (Phone Authentication)
export * from './auth';

// Card types
export * from './card';

// Transaction types
export * from './transaction';

// Common types
export * from './common';

// API types (excluding duplicate request types)
export type {
  // Phone Auth API
  SendOTPRequest,
  SendOTPResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
  // Legacy email auth API (deprecated)
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  // Cards API
  GetCardsRequest,
  GetCardsResponse,
  CreateCardResponse,
  DeleteCardResponse,
  // Transactions API
  GetTransactionsRequest,
  GetTransactionsResponse,
  TransactionStatsResponse,
  // Statements API
  UploadStatementRequest,
  UploadStatementResponse,
  GetStatementsRequest,
  GetStatementsResponse,
  // Optimizer API
  CardOptimizerRequest,
  CardOptimizerResponse,
  BatchOptimizerRequest,
  BatchOptimizerResponse,
  // AI Assistant API
  AIChatRequest,
  AIChatResponse,
  // Goals API
  GetGoalsRequest,
  CreateGoalRequest,
  UpdateGoalRequest,
  // Analytics API
  DashboardOverviewResponse,
  SpendingByCategoryResponse,
  CardUsageResponse,
  ErrorResponse,
} from './api';
