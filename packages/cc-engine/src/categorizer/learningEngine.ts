/**
 * Learning Engine for Transaction Categorization
 * Learns from user corrections to improve categorization accuracy
 */

import type { TransactionCategory } from '@finmatter/types';

export interface UserCorrection {
  id: string;
  userId: string;
  merchantName: string;
  originalCategory: TransactionCategory;
  correctedCategory: TransactionCategory;
  correctedAt: Date;
  confidence: number; // User's confidence in the correction (0-1)
  source: 'manual' | 'bulk_edit' | 'api';
}

export interface LearningRule {
  id: string;
  merchantPattern: string; // Regex pattern for merchant name matching
  category: TransactionCategory;
  subcategory?: string;
  confidence: number; // 0-1
  source: 'user_correction' | 'system_learned';
  userId?: string; // If learned from specific user
  correctionCount: number; // Number of times this rule was reinforced
  createdAt: Date;
  lastUsedAt?: Date;
  isActive: boolean;
}

export interface CategorizationResult {
  category: TransactionCategory;
  subcategory?: string;
  confidence: number; // 0-1
  reasoning: string;
  learned: boolean; // If learned from user correction
  source:
    | 'merchant_database'
    | 'keyword_matching'
    | 'learning_rule'
    | 'default';
}

/**
 * Learning Engine Class
 * Manages user corrections and generates learning rules
 */
export class LearningEngine {
  private userCorrections: Map<string, UserCorrection[]> = new Map();
  private learningRules: Map<string, LearningRule> = new Map();
  private merchantPatterns: Map<string, RegExp> = new Map();

  constructor() {
    this.loadExistingRules();
  }

  /**
   * Add a user correction to the learning system
   */
  addUserCorrection(correction: Omit<UserCorrection, 'id'>): string {
    const id = this.generateId();
    const userCorrection: UserCorrection = {
      ...correction,
      id,
    };

    // Store correction by user
    const userCorrections = this.userCorrections.get(correction.userId) || [];
    userCorrections.push(userCorrection);
    this.userCorrections.set(correction.userId, userCorrections);

    // Generate or update learning rule
    this.updateLearningRule(userCorrection);

    return id;
  }

  /**
   * Get categorization result using learning rules
   */
  categorizeWithLearning(
    merchantName: string,
    userId?: string,
  ): CategorizationResult | null {
    const normalizedMerchant = merchantName.toUpperCase().trim();

    // Check user-specific learning rules first
    if (userId) {
      const userRule = this.findUserSpecificRule(normalizedMerchant, userId);
      if (userRule) {
        return {
          category: userRule.category,
          subcategory: userRule.subcategory || undefined,
          confidence: userRule.confidence,
          reasoning: `Learned from user corrections (${userRule.correctionCount} times)`,
          learned: true,
          source: 'learning_rule',
        };
      }
    }

    // Check global learning rules
    const globalRule = this.findGlobalRule(normalizedMerchant);
    if (globalRule) {
      return {
        category: globalRule.category,
        subcategory: globalRule.subcategory || undefined,
        confidence: globalRule.confidence,
        reasoning: `Learned from ${globalRule.correctionCount} user corrections`,
        learned: true,
        source: 'learning_rule',
      };
    }

    return null;
  }

  /**
   * Get learning statistics for a user
   */
  getUserLearningStats(userId: string): {
    totalCorrections: number;
    categoriesLearned: Record<TransactionCategory, number>;
    topMerchants: Array<{
      merchant: string;
      corrections: number;
      category: TransactionCategory;
    }>;
    accuracyImprovement: number; // Estimated improvement in accuracy
  } {
    const corrections = this.userCorrections.get(userId) || [];
    const categoriesLearned: Record<TransactionCategory, number> = {
      dining: 0,
      shopping: 0,
      groceries: 0,
      fuel: 0,
      travel: 0,
      entertainment: 0,
      bills: 0,
      healthcare: 0,
      education: 0,
      transport: 0,
      utilities: 0,
      insurance: 0,
      investment: 0,
      others: 0,
    };

    const merchantStats = new Map<
      string,
      {
        corrections: number;
        category: TransactionCategory;
      }
    >();

    corrections.forEach(correction => {
      categoriesLearned[correction.correctedCategory]++;

      const existing = merchantStats.get(correction.merchantName) || {
        corrections: 0,
        category: correction.correctedCategory,
      };
      existing.corrections++;
      merchantStats.set(correction.merchantName, existing);
    });

    const topMerchants = Array.from(merchantStats.entries())
      .map(([merchant, stats]) => ({
        merchant,
        corrections: stats.corrections,
        category: stats.category,
      }))
      .sort((a, b) => b.corrections - a.corrections)
      .slice(0, 10);

    // Estimate accuracy improvement based on correction patterns
    const accuracyImprovement = Math.min(corrections.length * 0.1, 0.3); // Max 30% improvement

    return {
      totalCorrections: corrections.length,
      categoriesLearned,
      topMerchants,
      accuracyImprovement,
    };
  }

  /**
   * Export learning rules for backup or sharing
   */
  exportLearningRules(userId?: string): LearningRule[] {
    if (userId) {
      return Array.from(this.learningRules.values()).filter(
        rule => rule.userId === userId,
      );
    }
    return Array.from(this.learningRules.values());
  }

  /**
   * Import learning rules from backup
   */
  importLearningRules(rules: LearningRule[]): void {
    rules.forEach(rule => {
      this.learningRules.set(rule.id, rule);
      this.compilePattern(rule.merchantPattern);
    });
  }

  /**
   * Get suggestions for improving categorization
   */
  getCategorizationSuggestions(userId: string): Array<{
    merchant: string;
    suggestedCategory: TransactionCategory;
    confidence: number;
    reasoning: string;
  }> {
    const corrections = this.userCorrections.get(userId) || [];
    const suggestions: Array<{
      merchant: string;
      suggestedCategory: TransactionCategory;
      confidence: number;
      reasoning: string;
    }> = [];

    // Find merchants with multiple corrections to the same category
    const merchantCorrections = new Map<
      string,
      Map<TransactionCategory, number>
    >();

    corrections.forEach(correction => {
      if (!merchantCorrections.has(correction.merchantName)) {
        merchantCorrections.set(correction.merchantName, new Map());
      }

      const merchantMap = merchantCorrections.get(correction.merchantName)!;
      const count = merchantMap.get(correction.correctedCategory) || 0;
      merchantMap.set(correction.correctedCategory, count + 1);
    });

    // Generate suggestions for merchants with consistent corrections
    for (const [merchant, categoryMap] of merchantCorrections) {
      const totalCorrections = Array.from(categoryMap.values()).reduce(
        (sum, count) => sum + count,
        0,
      );

      if (totalCorrections >= 3) {
        // Only suggest if user has corrected 3+ times
        const sortedCategories = Array.from(categoryMap.entries()).sort(
          (a, b) => b[1] - a[1],
        );

        const topCategoryEntry = sortedCategories[0];
        if (topCategoryEntry) {
          const [topCategory, topCount] = topCategoryEntry;
          const confidence = topCount / totalCorrections;

          if (confidence >= 0.8) {
            // Only suggest if 80%+ consistent
            suggestions.push({
              merchant,
              suggestedCategory: topCategory,
              confidence,
              reasoning: `User corrected ${topCount}/${totalCorrections} times to ${topCategory}`,
            });
          }
        }
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Private methods
   */
  private updateLearningRule(correction: UserCorrection): void {
    const merchantPattern = this.createMerchantPattern(correction.merchantName);
    const ruleId = `${correction.userId || 'global'}_${merchantPattern}`;

    const existingRule = this.learningRules.get(ruleId);

    if (existingRule) {
      // Update existing rule
      existingRule.correctionCount++;
      existingRule.confidence = Math.min(existingRule.confidence + 0.1, 1.0);
      existingRule.lastUsedAt = new Date();
    } else {
      // Create new rule
      const newRule: LearningRule = {
        id: ruleId,
        merchantPattern,
        category: correction.correctedCategory,
        confidence: correction.confidence,
        source: 'user_correction',
        userId: correction.userId,
        correctionCount: 1,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        isActive: true,
      };

      this.learningRules.set(ruleId, newRule);
      this.compilePattern(merchantPattern);
    }
  }

  private createMerchantPattern(merchantName: string): string {
    // Create a flexible regex pattern from merchant name
    const words = merchantName.split(/\s+/);
    const pattern = words
      .map(word => {
        if (word.length <= 2) return word;
        return `${word.substring(0, 3)}.*`;
      })
      .join('\\s+');

    return `^${pattern}$`;
  }

  private compilePattern(pattern: string): void {
    try {
      this.merchantPatterns.set(pattern, new RegExp(pattern, 'i'));
    } catch (error) {
      console.warn(`Failed to compile pattern: ${pattern}`, error);
    }
  }

  private findUserSpecificRule(
    merchantName: string,
    userId: string,
  ): LearningRule | null {
    for (const [_ruleId, rule] of this.learningRules) {
      if (rule.userId === userId && rule.isActive) {
        const regex = this.merchantPatterns.get(rule.merchantPattern);
        if (regex && regex.test(merchantName)) {
          return rule;
        }
      }
    }
    return null;
  }

  private findGlobalRule(merchantName: string): LearningRule | null {
    for (const [_ruleId, rule] of this.learningRules) {
      if (!rule.userId && rule.isActive) {
        const regex = this.merchantPatterns.get(rule.merchantPattern);
        if (regex && regex.test(merchantName)) {
          return rule;
        }
      }
    }
    return null;
  }

  private loadExistingRules(): void {
    // In a real implementation, this would load from database
    // For now, we'll start with an empty set
  }

  private generateId(): string {
    return `correction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const learningEngine = new LearningEngine();
