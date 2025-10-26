/**
 * Transaction Categorization Engine
 * Main entry point for categorizing transactions using merchant database,
 * keyword matching, and learning from user corrections
 */

import type { TransactionCategory } from '@finmatter/types';
import { getMerchantMapping } from './merchantDatabase';
import { categorizeByKeywords } from './keywordMatcher';
import { learningEngine } from './learningEngine';

export interface CategorizationOptions {
  userId?: string; // For user-specific learning
  enableLearning?: boolean; // Whether to use learning engine
  fallbackToKeywords?: boolean; // Whether to fallback to keyword matching
  minConfidence?: number; // Minimum confidence threshold (0-1)
}

export interface CategorizationResponse {
  category: TransactionCategory;
  subcategory?: string;
  confidence: number; // 0-1
  reasoning: string;
  learned: boolean;
  source:
    | 'merchant_database'
    | 'keyword_matching'
    | 'learning_rule'
    | 'default';
  alternatives?: Array<{
    category: TransactionCategory;
    confidence: number;
    reasoning: string;
  }>;
}

/**
 * Main function to categorize a transaction
 */
export function categorizeTransaction(
  merchantName: string,
  options: CategorizationOptions = {},
): CategorizationResponse {
  const {
    userId,
    enableLearning = true,
    fallbackToKeywords = true,
    minConfidence = 0.3,
  } = options;

  // Step 1: Try learning engine first (if enabled and user provided)
  if (enableLearning && userId) {
    const learningResult = learningEngine.categorizeWithLearning(
      merchantName,
      userId,
    );
    if (learningResult && learningResult.confidence >= minConfidence) {
      return {
        category: learningResult.category,
        subcategory: learningResult.subcategory || undefined,
        confidence: learningResult.confidence,
        reasoning: learningResult.reasoning,
        learned: learningResult.learned,
        source: learningResult.source,
      };
    }
  }

  // Step 2: Try merchant database
  const merchantMapping = getMerchantMapping(merchantName);
  if (merchantMapping && merchantMapping.confidence >= minConfidence) {
    return {
      category: merchantMapping.category,
      subcategory: merchantMapping.subcategory || undefined,
      confidence: merchantMapping.confidence,
      reasoning: `Exact match in merchant database`,
      learned: false,
      source: 'merchant_database',
    };
  }

  // Step 3: Try keyword matching (if enabled)
  if (fallbackToKeywords) {
    const keywordResult = categorizeByKeywords(merchantName);
    if (keywordResult && keywordResult.confidence >= minConfidence) {
      return {
        category: keywordResult.category,
        subcategory: keywordResult.subcategory || undefined,
        confidence: keywordResult.confidence,
        reasoning: `Keyword match: ${keywordResult.matchedKeywords.join(', ')}`,
        learned: false,
        source: 'keyword_matching',
      };
    }
  }

  // Step 4: Default fallback
  return {
    category: 'others',
    subcategory: 'uncategorized',
    confidence: 0.1,
    reasoning: 'No specific match found, defaulting to others',
    learned: false,
    source: 'default',
  };
}

/**
 * Categorize multiple transactions in batch
 */
export function categorizeTransactions(
  transactions: Array<{ merchantName: string; id?: string }>,
  options: CategorizationOptions = {},
): Array<CategorizationResponse & { transactionId?: string }> {
  return transactions.map(transaction => ({
    ...categorizeTransaction(transaction.merchantName, options),
    transactionId: transaction.id || undefined,
  }));
}

/**
 * Add user correction to improve future categorization
 */
export function addUserCorrection(
  userId: string,
  merchantName: string,
  originalCategory: TransactionCategory,
  correctedCategory: TransactionCategory,
  confidence: number = 1.0,
  source: 'manual' | 'bulk_edit' | 'api' = 'manual',
): string {
  return learningEngine.addUserCorrection({
    userId,
    merchantName,
    originalCategory,
    correctedCategory,
    correctedAt: new Date(),
    confidence,
    source,
  });
}

/**
 * Get categorization suggestions for a user
 */
export function getCategorizationSuggestions(userId: string) {
  return learningEngine.getCategorizationSuggestions(userId);
}

/**
 * Get user's learning statistics
 */
export function getUserLearningStats(userId: string) {
  return learningEngine.getUserLearningStats(userId);
}

/**
 * Test categorization for debugging
 */
export function testCategorization(
  merchantName: string,
  options: CategorizationOptions = {},
): {
  result: CategorizationResponse;
  debug: {
    merchantMapping: any;
    keywordResult: any;
    learningResult: any;
  };
} {
  const merchantMapping = getMerchantMapping(merchantName);
  const keywordResult = categorizeByKeywords(merchantName);
  const learningResult = options.userId
    ? learningEngine.categorizeWithLearning(merchantName, options.userId)
    : null;

  const result = categorizeTransaction(merchantName, options);

  return {
    result,
    debug: {
      merchantMapping,
      keywordResult,
      learningResult,
    },
  };
}

/**
 * Get category statistics
 */
export function getCategoryStats(): {
  merchantDatabase: Record<TransactionCategory, number>;
  keywordRules: Record<TransactionCategory, number>;
  totalMerchants: number;
  totalKeywords: number;
} {
  const { getCategoryStats: getMerchantStats } = require('./merchantDatabase');
  const { getKeywordCategoryStats } = require('./keywordMatcher');

  return {
    merchantDatabase: getMerchantStats(),
    keywordRules: getKeywordCategoryStats(),
    totalMerchants:
      require('./merchantDatabase').INDIAN_MERCHANT_DATABASE.length,
    totalKeywords: require('./keywordMatcher').KEYWORD_RULES.length,
  };
}

// Re-export types and utilities
export type { CategorizationResult } from './learningEngine';
export type { MerchantMapping } from './merchantDatabase';
export type { KeywordRule } from './keywordMatcher';
export { learningEngine } from './learningEngine';
export {
  INDIAN_MERCHANT_DATABASE,
  getMerchantMapping,
} from './merchantDatabase';
export { KEYWORD_RULES, categorizeByKeywords } from './keywordMatcher';
