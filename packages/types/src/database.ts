/**
 * Database schema types for FinMatter
 * These types mirror the Supabase database structure
 */

import type { AuditFields } from './common';

// Users table
export interface DatabaseUser extends AuditFields {
  id: string;
  email: string;
  encrypted_password: string;
  email_confirmed_at?: Date;
  phone?: string;
  phone_confirmed_at?: Date;
  confirmation_sent_at?: Date;
  recovery_sent_at?: Date;
  email_change_sent_at?: Date;
  last_sign_in_at?: Date;
  raw_app_meta_data?: Record<string, any>;
  raw_user_meta_data?: Record<string, any>;
  is_super_admin?: boolean;
  created_at: Date;
  updated_at: Date;
  phone_change?: string;
  phone_change_sent_at?: Date;
  email_change?: string;
  email_change_confirm_status?: number;
  banned_until?: Date;
  reauthentication_sent_at?: Date;
  reauthentication_token?: string;
}

// Cards table
export interface DatabaseCard extends AuditFields {
  id: string;
  user_id: string;
  bank_name: string;
  card_name: string;
  last_four_digits: string; // Encrypted
  card_type: 'credit' | 'debit' | 'prepaid';
  network: 'visa' | 'mastercard' | 'rupay' | 'amex' | 'discover';
  reward_type: 'cashback' | 'points' | 'miles' | 'none';
  annual_fee: number;
  currency: string;
  status: 'active' | 'inactive' | 'blocked' | 'expired';
  issue_date?: Date;
  expiry_date?: Date;
  credit_limit?: number;
  available_credit?: number;
}

// Card benefits table
export interface DatabaseCardBenefit {
  id: string;
  card_id: string;
  category: string;
  reward_rate: number;
  reward_type: 'cashback' | 'points' | 'miles';
  reward_cap?: number;
  conditions?: Record<string, any>;
  is_active: boolean;
  valid_from?: Date;
  valid_until?: Date;
  created_at: Date;
  updated_at: Date;
}

// Transactions table
export interface DatabaseTransaction extends AuditFields {
  id: string;
  user_id: string;
  card_id?: string;
  amount: number;
  currency: string;
  type: 'debit' | 'credit' | 'refund' | 'fee' | 'interest';
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  merchant_name: string;
  merchant_category?: string;
  description?: string;
  reference?: string;
  date: Date;
  category: string;
  subcategory?: string;
  tags?: string[];
  notes?: string;
  location?: Record<string, any>;
  is_recurring?: boolean;
  recurring_pattern?: Record<string, any>;
  statement_id?: string;
  email_id?: string;
  is_split?: boolean;
}

// Statements table
export interface DatabaseStatement extends AuditFields {
  id: string;
  user_id: string;
  card_id: string;
  file_path: string;
  upload_date: Date;
  transaction_count: number;
  parsing_status: 'pending' | 'success' | 'failed';
  statement_period_start: Date;
  statement_period_end: Date;
  due_date?: Date;
  minimum_payment?: number;
  total_due?: number;
}

// Goals table
export interface DatabaseGoal extends AuditFields {
  id: string;
  user_id: string;
  goal_type: 'spending_limit' | 'savings_goal' | 'debt_payoff';
  category?: string;
  target_amount: number;
  current_amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  start_date: Date;
  end_date: Date;
  is_active: boolean;
  notifications_enabled: boolean;
}

// AI conversations table
export interface DatabaseAIConversation extends AuditFields {
  id: string;
  user_id: string;
  conversation_id: string;
  message: string;
  reply: string;
  context?: Record<string, any>;
  confidence_score?: number;
  tokens_used?: number;
  cost?: number;
}

// Email connections table
export interface DatabaseEmailConnection extends AuditFields {
  id: string;
  user_id: string;
  email_provider: 'gmail' | 'outlook' | 'yahoo';
  access_token: string; // Encrypted
  refresh_token?: string; // Encrypted
  last_sync: Date;
  is_active: boolean;
  sync_frequency: 'daily' | 'weekly' | 'manual';
}

// Account Aggregator consents table
export interface DatabaseAAConsent extends AuditFields {
  id: string;
  user_id: string;
  consent_id: string;
  fip_id: string;
  account_type: 'savings' | 'current' | 'credit' | 'loan';
  status: 'pending' | 'active' | 'expired' | 'revoked';
  expires_at: Date;
  data_range_start?: Date;
  data_range_end?: Date;
  purpose: string[];
}

// User preferences table
export interface DatabaseUserPreferences extends AuditFields {
  id: string;
  user_id: string;
  currency: string;
  timezone: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: Record<string, any>;
  privacy: Record<string, any>;
  ui: Record<string, any>;
}

// Category corrections table
export interface DatabaseCategoryCorrection extends AuditFields {
  id: string;
  user_id: string;
  merchant_name: string;
  original_category: string;
  corrected_category: string;
  confidence: number;
  is_active: boolean;
}

// Banks table
export interface DatabaseBank extends AuditFields {
  id: string;
  name: string;
  code: string;
  logo?: string;
  website?: string;
  supported_cards: string[];
  supported_networks: string[];
  is_active: boolean;
}

// Popular cards table
export interface DatabasePopularCard extends AuditFields {
  id: string;
  bank_name: string;
  card_name: string;
  card_type: string;
  network: string;
  reward_type: string;
  annual_fee: number;
  highlights: string[];
  benefits: Record<string, any>[];
  eligibility?: Record<string, any>;
  is_recommended: boolean;
  popularity_score: number;
}

// Database schema type
export interface Database {
  public: {
    Tables: {
      users: {
        Row: DatabaseUser;
        Insert: Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>>;
      };
      cards: {
        Row: DatabaseCard;
        Insert: Omit<DatabaseCard, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseCard, 'id' | 'created_at' | 'updated_at'>>;
      };
      card_benefits: {
        Row: DatabaseCardBenefit;
        Insert: Omit<DatabaseCardBenefit, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<
          Omit<DatabaseCardBenefit, 'id' | 'created_at' | 'updated_at'>
        >;
      };
      transactions: {
        Row: DatabaseTransaction;
        Insert: Omit<DatabaseTransaction, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<
          Omit<DatabaseTransaction, 'id' | 'created_at' | 'updated_at'>
        >;
      };
      statements: {
        Row: DatabaseStatement;
        Insert: Omit<DatabaseStatement, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<
          Omit<DatabaseStatement, 'id' | 'created_at' | 'updated_at'>
        >;
      };
      goals: {
        Row: DatabaseGoal;
        Insert: Omit<DatabaseGoal, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseGoal, 'id' | 'created_at' | 'updated_at'>>;
      };
      ai_conversations: {
        Row: DatabaseAIConversation;
        Insert: Omit<
          DatabaseAIConversation,
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<
          Omit<DatabaseAIConversation, 'id' | 'created_at' | 'updated_at'>
        >;
      };
      email_connections: {
        Row: DatabaseEmailConnection;
        Insert: Omit<
          DatabaseEmailConnection,
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<
          Omit<DatabaseEmailConnection, 'id' | 'created_at' | 'updated_at'>
        >;
      };
      aa_consents: {
        Row: DatabaseAAConsent;
        Insert: Omit<DatabaseAAConsent, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<
          Omit<DatabaseAAConsent, 'id' | 'created_at' | 'updated_at'>
        >;
      };
      user_preferences: {
        Row: DatabaseUserPreferences;
        Insert: Omit<
          DatabaseUserPreferences,
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<
          Omit<DatabaseUserPreferences, 'id' | 'created_at' | 'updated_at'>
        >;
      };
      category_corrections: {
        Row: DatabaseCategoryCorrection;
        Insert: Omit<
          DatabaseCategoryCorrection,
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<
          Omit<DatabaseCategoryCorrection, 'id' | 'created_at' | 'updated_at'>
        >;
      };
      banks: {
        Row: DatabaseBank;
        Insert: Omit<DatabaseBank, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseBank, 'id' | 'created_at' | 'updated_at'>>;
      };
      popular_cards: {
        Row: DatabasePopularCard;
        Insert: Omit<DatabasePopularCard, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<
          Omit<DatabasePopularCard, 'id' | 'created_at' | 'updated_at'>
        >;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
