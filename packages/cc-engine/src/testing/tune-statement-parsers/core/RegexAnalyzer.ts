/**
 * Regex Pattern Analyzer
 *
 * Analyzes failed extractions and suggests improved regex patterns
 */

import type { ParsedTransaction, StatementMetadata } from '../../../types';
import type { ExpectedTransaction, ExpectedMetadata } from './types';

export interface RegexSuggestion {
  pattern: string;
  description: string;
  confidence: number;
  testCases: string[];
  location: string; // File and line where to apply
}

export interface PatternAnalysis {
  field: string;
  currentPattern?: string;
  failures: Array<{
    expected: string;
    extracted: string | null;
    context: string;
  }>;
  suggestions: RegexSuggestion[];
}

export class RegexAnalyzer {
  /**
   * Analyze failed extractions and suggest regex improvements
   */
  analyzeFailures(
    expected: ExpectedTransaction[],
    extracted: ParsedTransaction[],
    metadataExpected?: ExpectedMetadata,
    metadataExtracted?: StatementMetadata,
  ): PatternAnalysis[] {
    const analyses: PatternAnalysis[] = [];

    // Analyze transaction field failures
    analyses.push(...this.analyzeTransactionFields(expected, extracted));

    // Analyze metadata field failures
    if (metadataExpected && metadataExtracted) {
      analyses.push(
        ...this.analyzeMetadataFields(metadataExpected, metadataExtracted),
      );
    }

    return analyses;
  }

  /**
   * Analyze transaction field extraction failures
   */
  private analyzeTransactionFields(
    expected: ExpectedTransaction[],
    extracted: ParsedTransaction[],
  ): PatternAnalysis[] {
    const analyses: PatternAnalysis[] = [];

    // Find missing transactions (not extracted at all)
    const missingTransactions = expected.filter(
      exp => !extracted.some(ext => this.isSimilarTransaction(exp, ext)),
    );

    if (missingTransactions.length > 0) {
      analyses.push({
        field: 'transaction_detection',
        failures: missingTransactions.map(txn => ({
          expected: `${txn.merchantName} - ${txn.amount}`,
          extracted: null,
          context: `Missing transaction: ${txn.merchantName}`,
        })),
        suggestions:
          this.suggestTransactionDetectionPattern(missingTransactions),
      });
    }

    // Analyze merchant name extraction
    const merchantFailures = this.findFieldFailures(
      expected,
      extracted,
      'merchantName',
    );
    if (merchantFailures.length > 0) {
      analyses.push({
        field: 'merchant_name',
        failures: merchantFailures,
        suggestions: this.suggestMerchantNamePattern(merchantFailures),
      });
    }

    // Analyze date extraction
    const dateFailures = this.findFieldFailures(
      expected,
      extracted,
      'transactionDate',
    );
    if (dateFailures.length > 0) {
      analyses.push({
        field: 'transaction_date',
        failures: dateFailures,
        suggestions: this.suggestDatePattern(dateFailures),
      });
    }

    // Analyze amount extraction
    const amountFailures = this.findFieldFailures(
      expected,
      extracted,
      'amount',
    );
    if (amountFailures.length > 0) {
      analyses.push({
        field: 'amount',
        failures: amountFailures,
        suggestions: this.suggestAmountPattern(amountFailures),
      });
    }

    return analyses;
  }

  /**
   * Analyze metadata field extraction failures
   */
  private analyzeMetadataFields(
    expected: ExpectedMetadata,
    extracted: StatementMetadata,
  ): PatternAnalysis[] {
    const analyses: PatternAnalysis[] = [];
    const fields: Array<keyof ExpectedMetadata> = [
      'cardLastFour',
      'statementDate',
      'totalAmount',
      'minimumDue',
      'paymentDueDate',
      'cardName',
      'bankName',
      'creditLimit',
      'availableCredit',
      'rewardPoints',
      'statementPeriodStart',
      'statementPeriodEnd',
      'billingCycleStart',
      'billingCycleEnd',
    ];

    for (const field of fields) {
      const expectedValue = expected[field];
      const extractedValue = extracted[field as keyof StatementMetadata];

      if (
        expectedValue !== undefined &&
        !this.valuesMatch(field, expectedValue, extractedValue)
      ) {
        analyses.push({
          field,
          failures: [
            {
              expected: String(expectedValue),
              extracted: extractedValue ? String(extractedValue) : null,
              context: `Metadata field: ${field}`,
            },
          ],
          suggestions: this.suggestMetadataPattern(
            field,
            expectedValue,
            extractedValue,
          ),
        });
      }
    }

    return analyses;
  }

  /**
   * Find field extraction failures
   */
  private findFieldFailures(
    expected: ExpectedTransaction[],
    extracted: ParsedTransaction[],
    field: keyof ExpectedTransaction,
  ): Array<{ expected: string; extracted: string | null; context: string }> {
    const failures: Array<{
      expected: string;
      extracted: string | null;
      context: string;
    }> = [];

    for (const exp of expected) {
      const matched = extracted.find(ext =>
        this.isSimilarTransaction(exp, ext),
      );
      if (matched) {
        const expValue = String(exp[field] || '');
        const extValue = String((matched as any)[field] || '');

        if (
          expValue !== extValue &&
          !this.valuesMatch(field, expValue, extValue)
        ) {
          failures.push({
            expected: expValue,
            extracted: extValue,
            context: `Transaction: ${exp.merchantName} - ${exp.amount}`,
          });
        }
      }
    }

    return failures;
  }

  /**
   * Check if two transactions are similar (same merchant, similar amount, same date)
   */
  private isSimilarTransaction(
    expected: ExpectedTransaction,
    extracted: ParsedTransaction,
  ): boolean {
    const dateMatch =
      new Date(expected.transactionDate).toDateString() ===
      extracted.transactionDate.toDateString();
    const amountMatch =
      Math.abs(expected.amount - extracted.amount) <
      (expected.amountTolerance || 0.01);
    const merchantMatch = this.merchantNamesMatch(
      expected.merchantName,
      extracted.merchantName,
      expected.merchantNameVariations || [],
    );

    return dateMatch && amountMatch && merchantMatch;
  }

  /**
   * Check if merchant names match
   */
  private merchantNamesMatch(
    expected: string,
    extracted: string,
    variations: string[],
  ): boolean {
    const normalize = (s: string) => s.toLowerCase().trim();
    if (normalize(expected) === normalize(extracted)) return true;
    return variations.some(v => normalize(v) === normalize(extracted));
  }

  /**
   * Check if two values match (with tolerance for numbers/dates)
   */
  private valuesMatch(field: string, expected: any, extracted: any): boolean {
    if (field.includes('Date') || field.includes('date')) {
      const expDate = new Date(expected);
      const extDate =
        extracted instanceof Date ? extracted : new Date(extracted);
      const diff = Math.abs(expDate.getTime() - extDate.getTime());
      return diff < 24 * 60 * 60 * 1000; // ±1 day
    }

    if (typeof expected === 'number' && typeof extracted === 'number') {
      return Math.abs(expected - extracted) < 0.01;
    }

    return String(expected).toLowerCase() === String(extracted).toLowerCase();
  }

  /**
   * Suggest regex pattern for transaction detection
   */
  private suggestTransactionDetectionPattern(
    missing: ExpectedTransaction[],
  ): RegexSuggestion[] {
    // Analyze common patterns in missing transactions
    const suggestions: RegexSuggestion[] = [];

    // Check if transactions are being missed due to table structure
    const hasTableHeaders = missing.some(t => t.merchantName.includes('Date'));

    if (hasTableHeaders) {
      suggestions.push({
        pattern: '/(?:Date|Transaction\\s+Date).*?(?=\\n|$)/i',
        description: 'Improve transaction table header detection',
        confidence: 0.7,
        testCases: missing.slice(0, 3).map(t => t.merchantName),
        location: 'BaseParser.ts - findTransactionStartIndex()',
      });
    }

    return suggestions;
  }

  /**
   * Suggest regex pattern for merchant name extraction
   */
  private suggestMerchantNamePattern(
    failures: Array<{
      expected: string;
      extracted: string | null;
      context: string;
    }>,
  ): RegexSuggestion[] {
    const suggestions: RegexSuggestion[] = [];

    // Analyze common patterns
    const patterns = new Map<string, number>();

    for (const failure of failures) {
      if (failure.extracted) {
        // Find what's being incorrectly captured
        const extractedParts = failure.extracted.split(/\s+/);
        const expectedParts = failure.expected.split(/\s+/);

        // Check if extra text is being captured
        if (extractedParts.length > expectedParts.length) {
          patterns.set('extra_text', (patterns.get('extra_text') || 0) + 1);
        }

        // Check if partial text is being captured
        if (failure.extracted.includes(failure.expected.substring(0, 5))) {
          patterns.set(
            'partial_match',
            (patterns.get('partial_match') || 0) + 1,
          );
        }
      }
    }

    if (
      patterns.get('extra_text') &&
      patterns.get('extra_text')! > failures.length * 0.5
    ) {
      suggestions.push({
        pattern: '/^([A-Z][A-Z0-9\\s]+?)(?:\\s+\\d|$)/',
        description:
          'Capture merchant name before amount/date, stop at first number',
        confidence: 0.8,
        testCases: failures.slice(0, 3).map(f => f.expected),
        location: 'Parser - parseTransactionLine()',
      });
    }

    if (
      patterns.get('partial_match') &&
      patterns.get('partial_match')! > failures.length * 0.5
    ) {
      suggestions.push({
        pattern: '/([A-Z][A-Z0-9\\s]{3,})/',
        description: 'Capture longer merchant names (minimum 3 chars)',
        confidence: 0.75,
        testCases: failures.slice(0, 3).map(f => f.expected),
        location: 'Parser - parseTransactionLine()',
      });
    }

    return suggestions;
  }

  /**
   * Suggest regex pattern for date extraction
   */
  private suggestDatePattern(
    failures: Array<{
      expected: string;
      extracted: string | null;
      context: string;
    }>,
  ): RegexSuggestion[] {
    const suggestions: RegexSuggestion[] = [];

    // Analyze date formats
    const formats = new Map<string, number>();
    for (const failure of failures) {
      const dateStr = failure.expected;
      if (dateStr.includes('/'))
        formats.set('slash', (formats.get('slash') || 0) + 1);
      if (dateStr.includes('-'))
        formats.set('dash', (formats.get('dash') || 0) + 1);
      if (dateStr.includes(' '))
        formats.set('space', (formats.get('space') || 0) + 1);
    }

    const mostCommon = Array.from(formats.entries()).sort(
      (a, b) => b[1] - a[1],
    )[0];

    if (mostCommon) {
      let pattern = '';
      if (mostCommon[0] === 'slash') {
        pattern = '/(\\d{1,2})/(\\d{1,2})/(\\d{2,4})/';
      } else if (mostCommon[0] === 'dash') {
        pattern = '/(\\d{1,2})-(\\d{1,2})-(\\d{2,4})/';
      } else {
        pattern = '/(\\d{1,2})\\s+(\\w{3})\\s+(\\d{4})/';
      }

      suggestions.push({
        pattern,
        description: `Match ${mostCommon[0]} date format: ${mostCommon[1]} occurrences`,
        confidence: 0.85,
        testCases: failures.slice(0, 3).map(f => f.expected),
        location: 'BaseParser.ts - parseDate()',
      });
    }

    return suggestions;
  }

  /**
   * Suggest regex pattern for amount extraction
   */
  private suggestAmountPattern(
    failures: Array<{
      expected: string;
      extracted: string | null;
      context: string;
    }>,
  ): RegexSuggestion[] {
    const suggestions: RegexSuggestion[] = [];

    // Check if amounts have currency symbols or commas
    const hasCurrency = failures.some(
      f => f.expected.includes('₹') || f.expected.includes('Rs'),
    );
    const hasCommas = failures.some(f => f.expected.includes(','));

    if (hasCurrency || hasCommas) {
      suggestions.push({
        pattern: '/[₹Rs]?\\s*([\\d,]+(?:\\.\\d{2})?)/',
        description: 'Extract amount with currency symbol and commas',
        confidence: 0.9,
        testCases: failures.slice(0, 3).map(f => f.expected),
        location: 'BaseParser.ts - parseAmount()',
      });
    }

    return suggestions;
  }

  /**
   * Suggest regex pattern for metadata fields
   */
  private suggestMetadataPattern(
    field: string,
    expected: any,
    _extracted: any,
  ): RegexSuggestion[] {
    const suggestions: RegexSuggestion[] = [];

    if (field.includes('Date') || field.includes('date')) {
      suggestions.push({
        pattern: `/${field.replace(/([A-Z])/g, '\\s+$1')}[:\\s]+(\\d{1,2}[\\s/-]\\w{3}[\\s/-]\\d{4})/i`,
        description: `Extract ${field} with flexible format`,
        confidence: 0.8,
        testCases: [String(expected)],
        location: `Parser - extractMetadata()`,
      });
    } else if (
      field.includes('Amount') ||
      field.includes('amount') ||
      field.includes('Limit') ||
      field.includes('Credit')
    ) {
      // Handle creditLimit, availableCredit, totalAmount, minimumDue, etc.
      const fieldName = field.replace(/([A-Z])/g, ' $1').trim();
      suggestions.push({
        pattern: `/(?:${fieldName}|Credit\\s+Limit|Available\\s+Credit|Total\\s+Amount|Minimum\\s+Due)[:\\s]+[₹Rs]?\\s*([\\d,]+(?:\\.\\d{2})?)/i`,
        description: `Extract ${field} with currency symbol and commas`,
        confidence: 0.9,
        testCases: [String(expected)],
        location: `Parser - extractMetadata()`,
      });
    } else {
      suggestions.push({
        pattern: `/${field.replace(/([A-Z])/g, '\\s+$1')}[:\\s]+(.+?)(?:\\n|$)/i`,
        description: `Extract ${field} value`,
        confidence: 0.7,
        testCases: [String(expected)],
        location: `Parser - extractMetadata()`,
      });
    }

    return suggestions;
  }

  /**
   * Generate code changes based on suggestions
   */
  generateCodeChanges(analyses: PatternAnalysis[]): string {
    let code = '// Auto-generated regex improvements\n\n';

    for (const analysis of analyses) {
      if (analysis.suggestions.length === 0) continue;

      const firstSuggestion = analysis.suggestions[0];
      if (!firstSuggestion) continue;

      code += `// ${analysis.field} improvements\n`;
      code += `// Confidence: ${firstSuggestion.confidence * 100}%\n`;
      code += `// Failures: ${analysis.failures.length}\n\n`;

      for (const suggestion of analysis.suggestions) {
        code += `// ${suggestion.description}\n`;
        code += `// Location: ${suggestion.location}\n`;
        code += `const ${analysis.field.replace(/[^a-zA-Z0-9]/g, '_')}_pattern = ${suggestion.pattern};\n\n`;

        code += '// Test cases:\n';
        for (const testCase of suggestion.testCases) {
          code += `//   "${testCase}"\n`;
        }
        code += '\n';
      }
    }

    return code;
  }
}
