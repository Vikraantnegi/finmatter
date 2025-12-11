/**
 * LLM Extraction Accuracy Tester
 *
 * Tests LLM extraction accuracy and compares with regex extraction
 */

import { extractMetadataWithLLM } from '../../../utils/llmExtractor';
import type { StatementMetadata } from '../../../types';
import type { ExpectedMetadata } from './types';

export interface LLMTestResult {
  field: string;
  regexAccuracy: number;
  llmAccuracy: number;
  improvement: number;
  shouldUseLLM: boolean;
  confidence: number;
}

export interface LLMAccuracyReport {
  overallRegexAccuracy: number;
  overallLLMAccuracy: number;
  improvement: number;
  fieldResults: LLMTestResult[];
  recommendations: string[];
}

export class LLMAccuracyTester {
  private openaiApiKey?: string;

  constructor(openaiApiKey?: string) {
    if (openaiApiKey) {
      this.openaiApiKey = openaiApiKey;
    }
  }

  /**
   * Test LLM extraction accuracy vs regex
   */
  async testLLMAccuracy(
    pdfText: string,
    expectedMetadata: ExpectedMetadata,
    regexExtractedMetadata: StatementMetadata,
  ): Promise<LLMAccuracyReport> {
    if (!this.openaiApiKey) {
      return {
        overallRegexAccuracy: 0,
        overallLLMAccuracy: 0,
        improvement: 0,
        fieldResults: [],
        recommendations: ['OpenAI API key not provided - skipping LLM testing'],
      };
    }

    // Extract with LLM
    const llmExtracted = await extractMetadataWithLLM(pdfText, {
      apiKey: this.openaiApiKey,
    });

    if (!llmExtracted) {
      return {
        overallRegexAccuracy: 0,
        overallLLMAccuracy: 0,
        improvement: 0,
        fieldResults: [],
        recommendations: ['LLM extraction failed'],
      };
    }

    // Compare both with expected
    const fieldResults: LLMTestResult[] = [];
    const fields: Array<keyof ExpectedMetadata> = [
      'cardLastFour',
      'statementDate',
      'statementPeriodStart',
      'statementPeriodEnd',
      'totalAmount',
      'minimumDue',
      'paymentDueDate',
      'cardName',
      'bankName',
      'rewardPoints',
      'creditLimit',
      'availableCredit',
    ];

    let regexCorrect = 0;
    let llmCorrect = 0;
    let totalFields = 0;

    for (const field of fields) {
      const expected = expectedMetadata[field];
      if (expected === undefined) continue;

      totalFields++;

      const regexValue =
        regexExtractedMetadata[field as keyof StatementMetadata];
      const llmValue = llmExtracted[field as keyof typeof llmExtracted];

      const regexMatch = this.valuesMatch(field, expected, regexValue);
      const llmMatch = this.valuesMatch(field, expected, llmValue);

      if (regexMatch) regexCorrect++;
      if (llmMatch) llmCorrect++;

      const improvement =
        llmMatch && !regexMatch ? 1 : !llmMatch && regexMatch ? -1 : 0;
      const shouldUseLLM = llmMatch && !regexMatch;

      fieldResults.push({
        field,
        regexAccuracy: regexMatch ? 100 : 0,
        llmAccuracy: llmMatch ? 100 : 0,
        improvement: improvement * 100,
        shouldUseLLM,
        confidence:
          llmExtracted.confidence === 'high'
            ? 0.9
            : llmExtracted.confidence === 'medium'
              ? 0.7
              : 0.5,
      });
    }

    const overallRegexAccuracy = (regexCorrect / totalFields) * 100;
    const overallLLMAccuracy = (llmCorrect / totalFields) * 100;
    const improvement = overallLLMAccuracy - overallRegexAccuracy;

    // Generate recommendations
    const recommendations: string[] = [];
    if (improvement > 10) {
      recommendations.push(
        'LLM extraction shows significant improvement - consider using LLM as primary method',
      );
    } else if (improvement > 0) {
      recommendations.push(
        'LLM extraction shows slight improvement - consider using LLM as fallback',
      );
    } else {
      recommendations.push(
        'Regex extraction is sufficient - LLM not needed for this statement',
      );
    }

    const fieldsNeedingLLM = fieldResults.filter(f => f.shouldUseLLM);
    if (fieldsNeedingLLM.length > 0) {
      recommendations.push(
        `Use LLM for: ${fieldsNeedingLLM.map(f => f.field).join(', ')}`,
      );
    }

    return {
      overallRegexAccuracy,
      overallLLMAccuracy,
      improvement,
      fieldResults,
      recommendations,
    };
  }

  /**
   * Check if values match (with tolerance)
   */
  private valuesMatch(field: string, expected: any, extracted: any): boolean {
    if (
      expected === undefined ||
      extracted === undefined ||
      extracted === null
    ) {
      return expected === extracted;
    }

    // Handle dates
    if (
      field.includes('Date') ||
      field.includes('Start') ||
      field.includes('End')
    ) {
      try {
        const expDate = new Date(expected);
        const extDate =
          extracted instanceof Date ? extracted : new Date(extracted);
        if (isNaN(expDate.getTime()) || isNaN(extDate.getTime())) return false;
        const diff = Math.abs(expDate.getTime() - extDate.getTime());
        return diff < 24 * 60 * 60 * 1000; // ±1 day
      } catch {
        return false;
      }
    }

    // Handle numbers
    if (typeof expected === 'number' && typeof extracted === 'number') {
      return Math.abs(expected - extracted) < 0.01;
    }

    // Handle strings
    return (
      String(expected).toLowerCase().trim() ===
      String(extracted).toLowerCase().trim()
    );
  }
}
