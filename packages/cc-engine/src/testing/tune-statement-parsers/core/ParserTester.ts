/**
 * Parser Testing Framework
 *
 * Compares extracted transactions and metadata against expected results
 * Generates accuracy metrics and improvement suggestions
 */

import { parseStatement, type BankName } from '../../../index';
import type {
  ParsedTransaction,
  StatementMetadata,
  ParseResult,
} from '../../../types';
import type {
  ExpectedResult,
  ExpectedTransaction,
  ExpectedMetadata,
  ParserTestResult,
  TestSummary,
} from './types';
import * as fs from 'fs';
import * as path from 'path';

export class ParserTester {
  private testDataDir: string;
  private resultsDir: string;
  private openaiApiKey?: string;

  constructor(
    testDataDir?: string,
    resultsDir?: string,
    openaiApiKey?: string,
  ) {
    // Resolve paths relative to package root (works with both tsx and compiled JS)
    const packageRoot = path.resolve(__dirname, '../../../../');
    const defaultTestDataDir = path.join(packageRoot, 'test-data');
    const defaultResultsDir = path.join(packageRoot, 'test-results');
    this.testDataDir = testDataDir || defaultTestDataDir;
    this.resultsDir = resultsDir || defaultResultsDir;
    if (openaiApiKey !== undefined) {
      this.openaiApiKey = openaiApiKey;
    }

    // Ensure results directory exists
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }

  /**
   * Test a single statement against expected results
   */
  async testStatement(
    statementPath: string,
    expectedResult: ExpectedResult,
  ): Promise<ParserTestResult> {
    console.log(
      `\n🧪 Testing: ${expectedResult.statementId} (${expectedResult.bank})`,
    );

    // Read PDF file
    const pdfBuffer = fs.readFileSync(statementPath);

    // Parse statement
    let parseResult: ParseResult;
    try {
      const options: { openaiApiKey?: string; useLLMFallback?: boolean } = {
        useLLMFallback: true,
      };
      if (this.openaiApiKey) {
        options.openaiApiKey = this.openaiApiKey;
      }
      parseResult = await parseStatement(
        pdfBuffer,
        expectedResult.bank as BankName,
        expectedResult.password,
        options,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        statementId: expectedResult.statementId,
        bank: expectedResult.bank,
        success: false,
        expectedTransactionCount: expectedResult.expectedTransactionCount,
        extractedTransactionCount: 0,
        matchedTransactionCount: 0,
        transactionAccuracy: 0,
        missingTransactions: expectedResult.expectedTransactions,
        extraTransactions: [],
        incorrectTransactions: [],
        metadataAccuracy: 0,
        metadataDifferences: [],
        overallAccuracy: 0,
        errors: [`Parser error: ${errorMessage}`],
        warnings: [],
        suggestions: [
          `Fix parser error: ${errorMessage}`,
          'Check PDF format compatibility',
        ],
      };
    }

    // Compare transactions
    const transactionComparison = this.compareTransactions(
      expectedResult.expectedTransactions,
      parseResult.transactions,
    );

    // Compare metadata
    const metadataComparison = this.compareMetadata(
      expectedResult.expectedMetadata,
      parseResult.metadata,
    );

    // Calculate overall accuracy (weighted: 70% transactions, 30% metadata)
    const overallAccuracy =
      transactionComparison.accuracy * 0.7 + metadataComparison.accuracy * 0.3;

    // Generate suggestions
    const suggestions = this.generateSuggestions(
      transactionComparison,
      metadataComparison,
      parseResult,
    );

    const result: ParserTestResult = {
      statementId: expectedResult.statementId,
      bank: expectedResult.bank,
      success: overallAccuracy >= 90, // 90% threshold for success
      expectedTransactionCount: expectedResult.expectedTransactionCount,
      extractedTransactionCount: parseResult.transactions.length,
      matchedTransactionCount: transactionComparison.matchedCount,
      transactionAccuracy: transactionComparison.accuracy,
      missingTransactions: transactionComparison.missing,
      extraTransactions: transactionComparison.extra,
      incorrectTransactions: transactionComparison.incorrect,
      metadataAccuracy: metadataComparison.accuracy,
      metadataDifferences: metadataComparison.differences,
      overallAccuracy,
      errors: parseResult.errors || [],
      warnings: parseResult.warnings || [],
      suggestions,
    };

    return result;
  }

  /**
   * Compare extracted transactions with expected transactions
   */
  private compareTransactions(
    expected: ExpectedTransaction[],
    extracted: ParsedTransaction[],
  ): {
    accuracy: number;
    matchedCount: number;
    missing: ExpectedTransaction[];
    extra: ParsedTransaction[];
    incorrect: Array<{
      expected: ExpectedTransaction;
      extracted: ParsedTransaction;
      differences: string[];
    }>;
  } {
    const matched: Set<number> = new Set();
    const missing: ExpectedTransaction[] = [];
    const extra: ParsedTransaction[] = [...extracted];
    const incorrect: Array<{
      expected: ExpectedTransaction;
      extracted: ParsedTransaction;
      differences: string[];
    }> = [];

    // Try to match each expected transaction
    for (const expectedTxn of expected) {
      let bestMatch: {
        index: number;
        score: number;
        differences: string[];
      } | null = null;

      for (let i = 0; i < extracted.length; i++) {
        if (matched.has(i)) continue;

        const extractedTxn = extracted[i];
        if (!extractedTxn) continue;
        const matchResult = this.matchTransaction(expectedTxn, extractedTxn);

        if (
          !bestMatch ||
          (matchResult.isMatch && matchResult.score > bestMatch.score)
        ) {
          bestMatch = {
            index: i,
            score: matchResult.score,
            differences: matchResult.differences,
          };
        }
      }

      if (bestMatch && bestMatch.score >= 0.8 && bestMatch.index >= 0) {
        // Good match (80%+ similarity)
        matched.add(bestMatch.index);
        const extractedTxn = extracted[bestMatch.index];
        if (extractedTxn) {
          const indexToRemove = extra.findIndex(t => t === extractedTxn);
          if (indexToRemove >= 0) {
            extra.splice(indexToRemove, 1);
          }

          if (bestMatch.score < 1.0) {
            // Matched but has differences
            incorrect.push({
              expected: expectedTxn,
              extracted: extractedTxn,
              differences: bestMatch.differences,
            });
          }
        }
      } else {
        // No good match found
        missing.push(expectedTxn);
      }
    }

    // Calculate accuracy
    const totalExpected = expected.length;
    const matchedCount = matched.size;
    const perfectMatches = matchedCount - incorrect.length;

    // Accuracy formula: (perfect matches / expected) * 100
    const accuracy =
      totalExpected > 0 ? (perfectMatches / totalExpected) * 100 : 0;

    return {
      accuracy: Math.round(accuracy * 100) / 100,
      matchedCount,
      missing,
      extra,
      incorrect,
    };
  }

  /**
   * Match a single expected transaction with extracted transaction
   */
  private matchTransaction(
    expected: ExpectedTransaction,
    extracted: ParsedTransaction,
  ): {
    isMatch: boolean;
    score: number; // 0-1 similarity score
    differences: string[];
  } {
    const differences: string[] = [];
    let score = 1.0;

    // Compare dates (allow ±1 day tolerance)
    const expectedDate = new Date(expected.transactionDate);
    const extractedDate = extracted.transactionDate;
    const dateDiff = Math.abs(expectedDate.getTime() - extractedDate.getTime());
    const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
    if (daysDiff > 1) {
      differences.push(
        `Date mismatch: expected ${expected.transactionDate}, got ${extractedDate.toISOString().split('T')[0]}`,
      );
      score -= 0.2;
    }

    // Compare amounts (with tolerance)
    const amountTolerance = expected.amountTolerance || 0.01;
    const amountDiff = Math.abs(expected.amount - extracted.amount);
    if (amountDiff > amountTolerance) {
      differences.push(
        `Amount mismatch: expected ${expected.amount}, got ${extracted.amount}`,
      );
      score -= 0.3;
    }

    // Compare merchant names (fuzzy matching)
    const merchantMatch = this.matchMerchantName(
      expected.merchantName,
      extracted.merchantName,
      expected.merchantNameVariations || [],
    );
    if (!merchantMatch.isMatch) {
      differences.push(
        `Merchant mismatch: expected "${expected.merchantName}", got "${extracted.merchantName}"`,
      );
      score -= 0.3;
    }

    // Compare type
    if (expected.type !== extracted.type) {
      differences.push(
        `Type mismatch: expected ${expected.type}, got ${extracted.type}`,
      );
      score -= 0.2;
    }

    return {
      isMatch: score >= 0.8,
      score: Math.max(0, score),
      differences,
    };
  }

  /**
   * Fuzzy match merchant names
   */
  private matchMerchantName(
    expected: string,
    extracted: string,
    variations: string[],
  ): { isMatch: boolean; score: number } {
    const normalize = (str: string) =>
      str.toLowerCase().trim().replace(/\s+/g, ' ');

    const expectedNorm = normalize(expected);
    const extractedNorm = normalize(extracted);

    // Exact match
    if (expectedNorm === extractedNorm) {
      return { isMatch: true, score: 1.0 };
    }

    // Check variations
    for (const variation of variations) {
      if (normalize(variation) === extractedNorm) {
        return { isMatch: true, score: 0.95 };
      }
    }

    // Check if one contains the other (for partial matches)
    if (
      expectedNorm.includes(extractedNorm) ||
      extractedNorm.includes(expectedNorm)
    ) {
      return { isMatch: true, score: 0.85 };
    }

    // Levenshtein distance for fuzzy matching
    const similarity = this.calculateSimilarity(expectedNorm, extractedNorm);
    return {
      isMatch: similarity >= 0.7,
      score: similarity,
    };
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: (number | undefined)[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      if (matrix[0]) {
        matrix[0][j] = j;
      }
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        const prevI = i - 1;
        const prevJ = j - 1;
        const prevRow = matrix[prevI];
        const currRow = matrix[i];

        if (!currRow || !prevRow) continue;

        if (str2.charAt(prevI) === str1.charAt(prevJ)) {
          const prevVal = prevRow[prevJ];
          currRow[j] = prevVal !== undefined ? prevVal : 0;
        } else {
          const sub = prevRow[prevJ] !== undefined ? prevRow[prevJ]! + 1 : 1;
          const ins = currRow[prevJ] !== undefined ? currRow[prevJ]! + 1 : 1;
          const del = prevRow[j] !== undefined ? prevRow[j]! + 1 : 1;
          currRow[j] = Math.min(sub, ins, del);
        }
      }
    }

    const finalRow = matrix[str2.length];
    const finalVal = finalRow?.[str1.length];
    return finalVal !== undefined ? finalVal : 0;
  }

  /**
   * Compare extracted metadata with expected metadata
   */
  private compareMetadata(
    expected: ExpectedMetadata,
    extracted: StatementMetadata,
  ): {
    accuracy: number;
    differences: Array<{ field: string; expected: any; extracted: any }>;
  } {
    const differences: Array<{
      field: string;
      expected: any;
      extracted: any;
    }> = [];
    let matchedFields = 0;
    let totalFields = 0;

    const fields: Array<keyof ExpectedMetadata> = [
      'cardLastFour',
      'statementDate',
      'statementPeriodStart',
      'statementPeriodEnd',
      'billingCycleStart',
      'billingCycleEnd',
      'totalAmount',
      'minimumDue',
      'paymentDueDate',
      'cardName',
      'bankName',
      'rewardPoints',
      'creditLimit',
      'availableCredit',
    ];

    for (const field of fields) {
      const expectedValue = expected[field];
      if (expectedValue === undefined) continue; // Skip if not expected

      totalFields++;
      const extractedValue = extracted[field as keyof StatementMetadata];

      if (this.compareFieldValue(field, expectedValue, extractedValue)) {
        matchedFields++;
      } else {
        differences.push({
          field,
          expected: expectedValue,
          extracted: extractedValue,
        });
      }
    }

    const accuracy =
      totalFields > 0 ? (matchedFields / totalFields) * 100 : 100;

    return {
      accuracy: Math.round(accuracy * 100) / 100,
      differences,
    };
  }

  /**
   * Compare a single field value
   */
  private compareFieldValue(
    field: string,
    expected: any,
    extracted: any,
  ): boolean {
    // Handle dates
    if (
      field.includes('Date') ||
      field.includes('Start') ||
      field.includes('End')
    ) {
      if (expected === undefined || extracted === undefined) {
        return expected === extracted;
      }
      try {
        const expectedDate = new Date(expected);
        const extractedDate =
          extracted instanceof Date ? extracted : new Date(extracted);
        if (isNaN(expectedDate.getTime()) || isNaN(extractedDate.getTime())) {
          return false;
        }
        const diff = Math.abs(expectedDate.getTime() - extractedDate.getTime());
        return diff < 24 * 60 * 60 * 1000; // Allow ±1 day
      } catch {
        return false;
      }
    }

    // Handle numbers (with small tolerance)
    if (typeof expected === 'number' && typeof extracted === 'number') {
      return Math.abs(expected - extracted) < 0.01;
    }

    // Handle strings (case-insensitive)
    if (typeof expected === 'string' && typeof extracted === 'string') {
      return expected.toLowerCase().trim() === extracted.toLowerCase().trim();
    }

    // Default comparison
    return expected === extracted;
  }

  /**
   * Generate improvement suggestions based on test results
   */
  private generateSuggestions(
    transactionComparison: ReturnType<typeof this.compareTransactions>,
    metadataComparison: ReturnType<typeof this.compareMetadata>,
    parseResult: ParseResult,
  ): string[] {
    const suggestions: string[] = [];

    // Transaction suggestions
    if (transactionComparison.missing.length > 0) {
      suggestions.push(
        `Fix ${transactionComparison.missing.length} missing transactions - check transaction table detection regex`,
      );
    }

    if (transactionComparison.extra.length > 0) {
      suggestions.push(
        `Remove ${transactionComparison.extra.length} extra transactions - improve end-of-transactions detection`,
      );
    }

    if (transactionComparison.incorrect.length > 0) {
      const commonIssues = this.analyzeCommonIssues(
        transactionComparison.incorrect,
      );
      suggestions.push(...commonIssues);
    }

    // Metadata suggestions
    if (metadataComparison.differences.length > 0) {
      const missingFields = metadataComparison.differences
        .map(d => d.field)
        .join(', ');
      suggestions.push(
        `Fix metadata extraction for: ${missingFields} - update regex patterns or use LLM fallback`,
      );
    }

    // Parser error suggestions
    if (parseResult.errors && parseResult.errors.length > 0) {
      suggestions.push(
        `Address parser errors: ${parseResult.errors.join(', ')}`,
      );
    }

    // LLM suggestions
    if (metadataComparison.accuracy < 80) {
      suggestions.push(
        'Consider using LLM extraction for metadata - current regex patterns may be insufficient',
      );
    }

    return suggestions;
  }

  /**
   * Analyze common issues in incorrect transactions
   */
  private analyzeCommonIssues(
    incorrect: Array<{
      expected: ExpectedTransaction;
      extracted: ParsedTransaction;
      differences: string[];
    }>,
  ): string[] {
    const issues: Record<string, number> = {};

    for (const item of incorrect) {
      for (const diff of item.differences) {
        if (diff.includes('Date')) {
          issues['date_parsing'] = (issues['date_parsing'] || 0) + 1;
        } else if (diff.includes('Amount')) {
          issues['amount_parsing'] = (issues['amount_parsing'] || 0) + 1;
        } else if (diff.includes('Merchant')) {
          issues['merchant_extraction'] =
            (issues['merchant_extraction'] || 0) + 1;
        } else if (diff.includes('Type')) {
          issues['type_detection'] = (issues['type_detection'] || 0) + 1;
        }
      }
    }

    const suggestions: string[] = [];
    if (issues['date_parsing']) {
      suggestions.push(
        `Improve date parsing - ${issues['date_parsing']} transactions have date issues`,
      );
    }
    if (issues['amount_parsing']) {
      suggestions.push(
        `Improve amount parsing - ${issues['amount_parsing']} transactions have amount issues`,
      );
    }
    if (issues['merchant_extraction']) {
      suggestions.push(
        `Improve merchant name extraction - ${issues['merchant_extraction']} transactions have merchant name issues`,
      );
    }
    if (issues['type_detection']) {
      suggestions.push(
        `Improve transaction type detection - ${issues['type_detection']} transactions have type issues`,
      );
    }

    return suggestions;
  }

  /**
   * Test all statements in a directory
   */
  async testAllStatements(bank?: string): Promise<ParserTestResult[]> {
    const results: ParserTestResult[] = [];
    const banks = bank ? [bank] : ['hdfc', 'icici', 'amex', 'hsbc'];

    for (const bankName of banks) {
      const bankDir = path.join(this.testDataDir, 'statements', bankName);
      if (!fs.existsSync(bankDir)) {
        console.log(`⚠️  No test data for ${bankName}`);
        continue;
      }

      const files = fs.readdirSync(bankDir);
      const pdfFiles = files.filter(f => f.endsWith('.pdf'));

      for (const pdfFile of pdfFiles) {
        const statementId = pdfFile.replace('.pdf', '');
        const statementPath = path.join(bankDir, pdfFile);
        const expectedPath = path.join(bankDir, `${statementId}.expected.json`);

        if (!fs.existsSync(expectedPath)) {
          console.log(`⚠️  No expected result for ${statementId}, skipping...`);
          continue;
        }

        const expectedResult: ExpectedResult = JSON.parse(
          fs.readFileSync(expectedPath, 'utf-8'),
        );

        const result = await this.testStatement(statementPath, expectedResult);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Generate test summary
   */
  generateSummary(results: ParserTestResult[]): TestSummary {
    const totalStatements = results.length;
    const passedStatements = results.filter(r => r.success).length;
    const failedStatements = totalStatements - passedStatements;

    const averageAccuracy =
      results.reduce((sum, r) => sum + r.overallAccuracy, 0) / totalStatements;

    // Group by bank
    const bankResults: Record<
      string,
      {
        total: number;
        passed: number;
        failed: number;
        averageAccuracy: number;
      }
    > = {};

    for (const result of results) {
      const bank = result.bank;
      if (!bank) continue;

      if (!bankResults[bank]) {
        bankResults[bank] = {
          total: 0,
          passed: 0,
          failed: 0,
          averageAccuracy: 0,
        };
      }

      const bankResult = bankResults[bank];
      if (bankResult) {
        bankResult.total++;
        if (result.success) {
          bankResult.passed++;
        } else {
          bankResult.failed++;
        }
      }
    }

    // Calculate bank averages
    for (const bank in bankResults) {
      if (bank) {
        const bankTests = results.filter(r => r.bank === bank);
        const bankResult = bankResults[bank];
        if (bankResult && bankTests.length > 0) {
          bankResult.averageAccuracy =
            bankTests.reduce((sum, r) => sum + r.overallAccuracy, 0) /
            bankTests.length;
        }
      }
    }

    // Find common issues
    const issueCounts: Record<string, { count: number; statements: string[] }> =
      {};

    for (const result of results) {
      for (const suggestion of result.suggestions) {
        const key = suggestion.split(' - ')[0]; // Get issue type
        if (!key) continue;

        if (!issueCounts[key]) {
          issueCounts[key] = { count: 0, statements: [] };
        }
        const issueData = issueCounts[key];
        if (issueData) {
          issueData.count++;
          if (!issueData.statements.includes(result.statementId)) {
            issueData.statements.push(result.statementId);
          }
        }
      }
    }

    const commonIssues = Object.entries(issueCounts)
      .map(([issue, data]) => ({
        issue,
        count: data.count,
        statements: data.statements,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 issues

    // Generate recommendations
    const recommendations: string[] = [];
    if (averageAccuracy < 90) {
      recommendations.push(
        'Overall accuracy is below 90% - focus on improving transaction extraction',
      );
    }
    if (failedStatements > 0) {
      recommendations.push(
        `${failedStatements} statements failed - review failed test cases`,
      );
    }
    if (commonIssues.length > 0 && commonIssues[0]) {
      recommendations.push(
        `Address top issue: ${commonIssues[0].issue} (affects ${commonIssues[0].count} cases)`,
      );
    }

    return {
      totalStatements,
      passedStatements,
      failedStatements,
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      bankResults,
      commonIssues,
      recommendations,
    };
  }

  /**
   * Save test results to file
   */
  saveResults(results: ParserTestResult[], summary: TestSummary): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsPath = path.join(
      this.resultsDir,
      `test-results-${timestamp}.json`,
    );
    const summaryPath = path.join(
      this.resultsDir,
      `test-summary-${timestamp}.json`,
    );

    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    console.log(`\n✅ Results saved to:`);
    console.log(`   ${resultsPath}`);
    console.log(`   ${summaryPath}`);
  }
}
