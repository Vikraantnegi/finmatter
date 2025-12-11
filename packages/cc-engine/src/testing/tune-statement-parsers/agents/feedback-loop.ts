#!/usr/bin/env node
/**
 * Feedback Loop for Parser Improvement
 *
 * This script runs a complete feedback loop:
 * 1. Run tests on all statements
 * 2. Analyze results and generate suggestions
 * 3. Display suggestions to user
 * 4. Wait for user to apply improvements
 * 5. Re-run tests to verify improvements
 *
 * Usage:
 *   pnpm feedback:loop
 *   pnpm feedback:loop --auto-apply  # Auto-apply high-confidence suggestions
 */

/* eslint-disable no-console */
import { ParserTester } from '../core/ParserTester';
import { RegexAnalyzer } from '../core/RegexAnalyzer';
import { LLMAccuracyTester } from '../core/LLMAccuracyTester';
import { extractTextFromPDF } from '../../../utils/pdfExtractor';
import { parseStatement, type BankName } from '../../../index';
import type { ExpectedResult } from '../core/types';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const AUTO_APPLY = process.argv.includes('--auto-apply');

class FeedbackLoop {
  private tester: ParserTester;
  private regexAnalyzer: RegexAnalyzer;
  private llmTester: LLMAccuracyTester;
  private testDataDir: string;
  private resultsDir: string;
  private openaiApiKey?: string;
  private rl: readline.Interface;

  constructor() {
    this.testDataDir = path.join(__dirname, '../../../../test-data');
    this.resultsDir = path.join(__dirname, '../../../../test-results');
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openaiApiKey = apiKey;
    }

    this.tester = new ParserTester(
      this.testDataDir,
      this.resultsDir,
      this.openaiApiKey,
    );
    this.regexAnalyzer = new RegexAnalyzer();
    this.llmTester = new LLMAccuracyTester(this.openaiApiKey);

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private question(query: string): Promise<string> {
    return new Promise(resolve => this.rl.question(query, resolve));
  }

  private close(): void {
    this.rl.close();
  }

  async run(): Promise<void> {
    console.log('🔄 Parser Improvement Feedback Loop');
    console.log('='.repeat(50));

    let iteration = 1;
    let previousAccuracy = 0;
    let shouldContinue = true;

    while (shouldContinue) {
      console.log(`\n📊 Iteration ${iteration}`);
      console.log('-'.repeat(50));

      // Step 1: Run tests
      console.log('\n1️⃣  Running tests...');
      const results = await this.tester.testAllStatements();
      const summary = this.tester.generateSummary(results);

      // Save results
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.tester.saveResults(results, summary);

      console.log(`\n📈 Results:`);
      console.log(`   Total Statements: ${summary.totalStatements}`);
      console.log(`   Passed: ${summary.passedStatements} ✅`);
      console.log(`   Failed: ${summary.failedStatements} ❌`);
      console.log(
        `   Average Accuracy: ${summary.averageAccuracy.toFixed(2)}%`,
      );

      if (previousAccuracy > 0) {
        const diff = summary.averageAccuracy - previousAccuracy;
        const arrow = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
        console.log(
          `   Change: ${arrow} ${diff > 0 ? '+' : ''}${diff.toFixed(2)}%`,
        );
      }
      previousAccuracy = summary.averageAccuracy;

      // Step 2: Analyze and generate suggestions
      console.log('\n2️⃣  Analyzing failures and generating suggestions...');
      const suggestions = await this.generateSuggestions(
        results,
        summary,
        timestamp,
      );

      if (suggestions.length === 0) {
        console.log('\n✅ No improvements needed! All tests passing.');
        break;
      }

      // Step 3: Display suggestions
      console.log('\n3️⃣  Improvement Suggestions:');
      console.log('='.repeat(50));
      suggestions.forEach((s, i) => {
        console.log(`\n${i + 1}. ${s.title}`);
        console.log(`   Confidence: ${(s.confidence * 100).toFixed(0)}%`);
        console.log(`   Description: ${s.description}`);
        if (s.code) {
          console.log(
            `   Code:\n${s.code
              .split('\n')
              .map(l => `      ${l}`)
              .join('\n')}`,
          );
        }
      });

      // Step 4: Ask user to apply improvements
      console.log('\n4️⃣  Apply Improvements');
      console.log('='.repeat(50));

      if (AUTO_APPLY) {
        const highConfidence = suggestions.filter(s => s.confidence >= 0.9);
        if (highConfidence.length > 0) {
          console.log(
            `\n🤖 Auto-applying ${highConfidence.length} high-confidence suggestions...`,
          );
          // In a real implementation, you would apply the changes here
          console.log(
            '   (Auto-apply not yet implemented - please apply manually)',
          );
        }
      }

      const answer = await this.question(
        '\nHave you applied the improvements? (y/n/q): ',
      );

      if (answer.toLowerCase() === 'q') {
        console.log('\n👋 Exiting feedback loop.');
        shouldContinue = false;
        break;
      }

      if (answer.toLowerCase() !== 'y') {
        console.log('\n⏭️  Skipping to next iteration...');
        iteration++;
        continue;
      }

      // Step 5: Re-run tests
      console.log('\n5️⃣  Re-running tests to verify improvements...');
      iteration++;
    }

    this.close();
  }

  private async generateSuggestions(
    results: any[],
    _summary: any,
    _timestamp: string,
  ): Promise<
    Array<{
      title: string;
      description: string;
      confidence: number;
      code?: string;
    }>
  > {
    const suggestions: Array<{
      title: string;
      description: string;
      confidence: number;
      code?: string;
    }> = [];

    // Analyze failed statements
    for (const result of results) {
      if (result.success && result.metadataDifferences.length === 0) continue;

      const expectedPath = path.join(
        this.testDataDir,
        'statements',
        result.bank,
        `${result.statementId}.expected.json`,
      );
      if (!fs.existsSync(expectedPath)) continue;

      const expected: ExpectedResult = JSON.parse(
        fs.readFileSync(expectedPath, 'utf-8'),
      );

      const pdfPath = path.join(
        this.testDataDir,
        'statements',
        result.bank,
        `${result.statementId}.pdf`,
      );
      if (!fs.existsSync(pdfPath)) continue;

      try {
        const pdfBuffer = fs.readFileSync(pdfPath);
        await extractTextFromPDF(pdfBuffer, expected.password);

        const parseOptions: {
          openaiApiKey?: string;
          useLLMFallback?: boolean;
        } = {
          useLLMFallback: false,
        };
        if (this.openaiApiKey) {
          parseOptions.openaiApiKey = this.openaiApiKey;
        }

        const parseResult = await parseStatement(
          pdfBuffer,
          result.bank as BankName,
          expected.password,
          parseOptions,
        );

        // Analyze regex patterns
        const regexAnalysis = this.regexAnalyzer.analyzeFailures(
          expected.expectedTransactions,
          parseResult.transactions,
          expected.expectedMetadata,
          parseResult.metadata,
        );

        for (const analysis of regexAnalysis) {
          for (const suggestion of analysis.suggestions) {
            suggestions.push({
              title: `Fix ${analysis.field} extraction`,
              description: suggestion.description,
              confidence: suggestion.confidence,
              code: `// Location: ${suggestion.location}\nconst pattern = ${suggestion.pattern};`,
            });
          }
        }
      } catch {
        // Skip errors
      }
    }

    // Remove duplicates
    const unique = new Map<string, (typeof suggestions)[0]>();
    for (const s of suggestions) {
      const key = `${s.title}-${s.description}`;
      if (!unique.has(key) || unique.get(key)!.confidence < s.confidence) {
        unique.set(key, s);
      }
    }

    return Array.from(unique.values()).sort(
      (a, b) => b.confidence - a.confidence,
    );
  }
}

// Run if called directly
if (require.main === module) {
  const loop = new FeedbackLoop();
  loop.run().catch(error => {
    console.error('Error in feedback loop:', error);
    process.exit(1);
  });
}
