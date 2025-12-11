/**
 * Types for parser testing framework
 */

import type { ParsedTransaction } from '../../../types';

/**
 * Expected transaction data for comparison
 */
export interface ExpectedTransaction {
  transactionDate: string; // ISO date string
  postingDate?: string; // ISO date string
  merchantName: string;
  merchantCategory?: string;
  amount: number;
  type: 'debit' | 'credit' | 'refund';
  currency?: string;
  description?: string;
  // Optional: for fuzzy matching
  merchantNameVariations?: string[];
  amountTolerance?: number; // Allow ±amountTolerance for amount matching
}

/**
 * Expected metadata for comparison
 */
export interface ExpectedMetadata {
  cardLastFour?: string;
  statementPeriodStart?: string; // ISO date string
  statementPeriodEnd?: string; // ISO date string
  billingCycleStart?: string; // ISO date string
  billingCycleEnd?: string; // ISO date string
  totalAmount?: number;
  minimumDue?: number;
  paymentDueDate?: string; // ISO date string
  statementDate?: string; // ISO date string
  cardName?: string;
  bankName?: string;
  rewardPoints?: number;
  creditLimit?: number;
  availableCredit?: number;
  // Add other metadata fields as needed
}

/**
 * Expected result for a test statement
 */
export interface ExpectedResult {
  statementId: string;
  bank: string;
  password?: string;
  expectedTransactionCount: number;
  expectedTransactions: ExpectedTransaction[];
  expectedMetadata: ExpectedMetadata;
  notes?: string; // Any special notes about this test case
}

/**
 * Test result for a single statement
 */
export interface ParserTestResult {
  statementId: string;
  bank: string;
  success: boolean;

  // Transaction metrics
  expectedTransactionCount: number;
  extractedTransactionCount: number;
  matchedTransactionCount: number;
  transactionAccuracy: number; // 0-100

  // Transaction details
  missingTransactions: ExpectedTransaction[];
  extraTransactions: ParsedTransaction[];
  incorrectTransactions: Array<{
    expected: ExpectedTransaction;
    extracted: ParsedTransaction;
    differences: string[];
  }>;

  // Metadata metrics
  metadataAccuracy: number; // 0-100
  metadataDifferences: Array<{
    field: string;
    expected: any;
    extracted: any;
  }>;

  // Overall
  overallAccuracy: number; // Weighted average
  errors: string[];
  warnings: string[];

  // Suggestions
  suggestions: string[];
}

/**
 * Summary of all test results
 */
export interface TestSummary {
  totalStatements: number;
  passedStatements: number;
  failedStatements: number;
  averageAccuracy: number;
  bankResults: Record<
    string,
    {
      total: number;
      passed: number;
      failed: number;
      averageAccuracy: number;
    }
  >;
  commonIssues: Array<{
    issue: string;
    count: number;
    statements: string[];
  }>;
  recommendations: string[];
}
