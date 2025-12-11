#!/usr/bin/env node
/**
 * Complete Parser Improvement Workflow
 *
 * This script:
 * 1. Runs tests on all statements
 * 2. Generates improvement suggestions
 * 3. Shows feedback and extracted data
 * 4. After improvements, cleans up redundant files
 *
 * Usage:
 *   pnpm workflow:improve
 *   pnpm workflow:improve --keep-results  # Keep test result files
 */

/* eslint-disable no-console */
// Load .env file FIRST before any imports that use process.env
import * as path from 'path';
import * as fs from 'fs';
try {
  // Use require for dotenv since it's a CommonJS module
  const dotenv = require('dotenv');
  const packageRoot = path.resolve(__dirname, '../../../../');
  const envPath = path.join(packageRoot, '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('✅ Loaded .env file from:', envPath);
  }
} catch {
  // dotenv not available or .env doesn't exist - that's okay
}

import { ParserTester } from '../core/ParserTester';
import { RegexAnalyzer } from '../core/RegexAnalyzer';
import { LLMAccuracyTester } from '../core/LLMAccuracyTester';
import { parseStatement, type BankName } from '../../../index';
import type { ExpectedResult } from '../core/types';
import * as readline from 'readline';

const KEEP_RESULTS = process.argv.includes('--keep-results');
const CLEAN_ONLY = process.argv.includes('--clean-only');
const SKIP_APPLY =
  process.argv.includes('--skip-apply') || process.env.SKIP_APPLY === 'true';
const AUTO_APPLY =
  process.argv.includes('--auto-apply') || process.env.AUTO_APPLY === 'true';
const AUTO_APPLY_THRESHOLD = parseFloat(
  process.env.AUTO_APPLY_THRESHOLD ?? '0.85',
); // 85% confidence minimum

class ImprovementWorkflow {
  private tester: ParserTester;
  private regexAnalyzer: RegexAnalyzer;
  private llmTester: LLMAccuracyTester;
  private testDataDir: string;
  private resultsDir: string;
  private openaiApiKey?: string;
  private ollamaBaseUrl?: string;
  private llmProvider?: 'openai' | 'ollama';
  private rl: readline.Interface;

  constructor() {
    // Resolve paths relative to package root (works with both tsx and compiled JS)
    const packageRoot = path.resolve(__dirname, '../../../../');
    this.testDataDir = path.join(packageRoot, 'test-data');
    this.resultsDir = path.join(packageRoot, 'test-results');
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openaiApiKey = apiKey;
    }

    // Debug: Log environment variables (for troubleshooting)
    if (process.env.DEBUG_ENV === 'true') {
      console.log('\n🔍 Environment Variables Debug:');
      console.log(`   USE_OLLAMA: ${process.env.USE_OLLAMA}`);
      console.log(`   OLLAMA_BASE_URL: ${process.env.OLLAMA_BASE_URL}`);
      const apiKeyPreview = this.openaiApiKey
        ? `Set (${this.openaiApiKey.substring(0, 10)}...)`
        : 'Not set';
      console.log(`   OPENAI_API_KEY: ${apiKeyPreview}`);
    }

    // Prefer Ollama if available, fallback to OpenAI
    if (process.env.OLLAMA_BASE_URL || process.env.USE_OLLAMA === 'true') {
      this.ollamaBaseUrl =
        process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      this.llmProvider = 'ollama';
      if (process.env.DEBUG_ENV === 'true') {
        console.log(`   ✅ Using Ollama: ${this.ollamaBaseUrl}`);
      }
    } else if (this.openaiApiKey) {
      this.llmProvider = 'openai';
      if (process.env.DEBUG_ENV === 'true') {
        console.log('   ✅ Using OpenAI');
      }
    } else {
      if (process.env.DEBUG_ENV === 'true') {
        console.log('   ⚠️  No LLM configured - using regex only');
      }
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
    // If clean-only mode, just clean and exit
    if (CLEAN_ONLY) {
      console.log('🧹 Cleaning test results...');
      await this.cleanupAllFiles();
      console.log('✅ Cleanup complete!');
      this.close();
      return;
    }

    console.log('🚀 Parser Improvement Workflow');
    console.log('='.repeat(60));

    // Step 1: Run tests on all statements
    console.log('\n📊 Step 1: Running tests on all statements...');
    const results = await this.tester.testAllStatements();
    const summary = this.tester.generateSummary(results);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.tester.saveResults(results, summary);

    console.log(`\n✅ Test Results:`);
    console.log(`   Total Statements: ${summary.totalStatements}`);
    console.log(`   Passed: ${summary.passedStatements} ✅`);
    console.log(`   Failed: ${summary.failedStatements} ❌`);
    console.log(`   Average Accuracy: ${summary.averageAccuracy.toFixed(2)}%`);

    if (summary.bankResults) {
      console.log(`\n   Bank-wise:`);
      for (const [bank, bankResult] of Object.entries(summary.bankResults)) {
        console.log(
          `     ${bank.toUpperCase()}: ${bankResult.averageAccuracy.toFixed(2)}%`,
        );
      }
    }

    // Step 2: Generate improvement suggestions
    console.log(
      '\n🔍 Step 2: Analyzing failures and generating suggestions...',
    );
    if (this.llmProvider) {
      console.log(
        `   Using LLM: ${this.llmProvider.toUpperCase()}${this.llmProvider === 'ollama' ? ` (${this.ollamaBaseUrl})` : ''}`,
      );
    }
    const suggestions = await this.generateImprovementSuggestions(
      results,
      summary,
      timestamp,
    );

    // Step 3: Show extracted data summary
    console.log('\n📄 Step 3: Extracted Data Summary');
    console.log('='.repeat(60));
    this.showExtractedDataSummary(results);

    // Step 4: Show improvement suggestions
    if (suggestions.length > 0) {
      console.log('\n💡 Step 4: Improvement Suggestions');
      console.log('='.repeat(60));
      this.showSuggestions(suggestions, summary, timestamp);
    } else {
      console.log('\n✅ No improvements needed! All tests passing perfectly.');
    }

    // Step 5: Apply improvements (auto or manual)
    if (suggestions.length > 0) {
      console.log('\n⏳ Step 5: Apply Improvements');
      console.log('='.repeat(60));

      let shouldVerify = false;
      let appliedCount = 0;

      if (AUTO_APPLY) {
        // Auto-apply high-confidence suggestions
        console.log(
          `\n🤖 AI Auto-Apply Mode (confidence >= ${(AUTO_APPLY_THRESHOLD * 100).toFixed(0)}%)...`,
        );
        console.log(
          `   The AI assistant will automatically apply improvements to parser code.`,
        );
        const highConfidence = suggestions.filter(
          s => s.confidence >= AUTO_APPLY_THRESHOLD,
        );

        if (highConfidence.length > 0) {
          console.log(
            `   Found ${highConfidence.length} high-confidence suggestions to apply`,
          );
          appliedCount = await this.applySuggestions(highConfidence);
          if (appliedCount > 0) {
            console.log(
              `   ✅ Generated change plan for ${appliedCount} improvements`,
            );
            console.log(
              `   🤖 AI assistant is now applying these changes to parser files...`,
            );
            // Note: Actual file changes will be applied by the AI assistant
            // The change plan file has been created for the AI to process
            shouldVerify = true; // Will verify after AI applies changes
          }
        } else {
          console.log(
            `   ⚠️  No suggestions meet the confidence threshold (${(AUTO_APPLY_THRESHOLD * 100).toFixed(0)}%)`,
          );
          console.log(
            `   Review suggestions in improvements file and apply manually if needed.`,
          );
        }
      } else if (SKIP_APPLY) {
        console.log('\n⏭️  Skipping apply step (--skip-apply flag set)');
        console.log(
          '   Review the suggestions in the improvements file and apply them manually when ready.',
        );
        shouldVerify = false;
      } else {
        const answer = await this.question(
          '\n🤖 Would you like me to auto-apply high-confidence improvements? (y/n, default=n): ',
        );

        if (answer.toLowerCase().trim() === 'y') {
          const highConfidence = suggestions.filter(
            s => s.confidence >= AUTO_APPLY_THRESHOLD,
          );
          if (highConfidence.length > 0) {
            console.log(
              `\n🤖 AI will auto-apply ${highConfidence.length} improvements (confidence >= ${(AUTO_APPLY_THRESHOLD * 100).toFixed(0)}%)...`,
            );
            appliedCount = await this.applySuggestions(highConfidence);
            if (appliedCount > 0) {
              console.log(
                `   ✅ Generated change plan for ${appliedCount} improvements`,
              );
              console.log(
                `   🤖 AI assistant is now applying these changes...`,
              );
              shouldVerify = true;
            } else {
              console.log(
                `   ⚠️  No suggestions could be queued for application`,
              );
              const manualAnswer = await this.question(
                '\nHave you manually applied the improvements? (y/n, default=n): ',
              );
              shouldVerify = manualAnswer.toLowerCase().trim() === 'y';
            }
          } else {
            console.log(`   ⚠️  No suggestions meet the confidence threshold`);
            const manualAnswer = await this.question(
              '\nHave you manually applied the improvements? (y/n, default=n): ',
            );
            shouldVerify = manualAnswer.toLowerCase().trim() === 'y';
          }
        } else {
          const manualAnswer = await this.question(
            '\nHave you manually applied the improvements? (y/n, default=n): ',
          );
          shouldVerify = manualAnswer.toLowerCase().trim() === 'y';
        }
      }

      if (shouldVerify) {
        // Step 6: Re-run tests to verify
        console.log('\n🔄 Step 6: Re-running tests to verify improvements...');
        const newResults = await this.tester.testAllStatements();
        const newSummary = this.tester.generateSummary(newResults);

        const newTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.tester.saveResults(newResults, newSummary);

        console.log(`\n📈 New Results:`);
        console.log(
          `   Average Accuracy: ${newSummary.averageAccuracy.toFixed(2)}%`,
        );
        const improvement =
          newSummary.averageAccuracy - summary.averageAccuracy;
        if (improvement > 0) {
          console.log(`   Improvement: +${improvement.toFixed(2)}% 🎉`);
        } else if (improvement < 0) {
          console.log(`   Change: ${improvement.toFixed(2)}% ⚠️`);
        } else {
          console.log(`   No change`);
        }

        // Step 7: Clean up redundant files
        console.log('\n🧹 Step 7: Cleaning up redundant files...');
        await this.cleanupFiles(timestamp, newTimestamp);
        console.log('✅ Cleanup complete!');
      } else {
        console.log(
          '\n⏭️  Skipping verification. Run again after applying improvements.',
        );
      }
    } else {
      // Clean up even if no improvements needed
      console.log('\n🧹 Cleaning up redundant files...');
      await this.cleanupFiles(timestamp);
      console.log('✅ Cleanup complete!');
    }

    this.close();
  }

  private async generateImprovementSuggestions(
    results: any[],
    _summary: any,
    _timestamp: string,
  ): Promise<
    Array<{
      field: string;
      description: string;
      confidence: number;
      pattern?: string;
      location: string;
      testCases: string[];
    }>
  > {
    const suggestions: Array<{
      field: string;
      description: string;
      confidence: number;
      pattern?: string;
      location: string;
      testCases: string[];
    }> = [];

    // Analyze all statements, even successful ones with metadata issues
    for (const result of results) {
      // Skip if no issues
      if (
        result.success &&
        result.metadataDifferences.length === 0 &&
        result.incorrectTransactions.length === 0 &&
        result.missingTransactions.length === 0
      ) {
        continue;
      }

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

        const parseOptions: {
          openaiApiKey?: string;
          useLLMFallback?: boolean;
          ollamaBaseUrl?: string;
          provider?: 'openai' | 'ollama';
        } = {
          useLLMFallback: false, // Test regex only
        };
        if (this.llmProvider === 'ollama' && this.ollamaBaseUrl) {
          parseOptions.ollamaBaseUrl = this.ollamaBaseUrl;
          parseOptions.provider = 'ollama';
        } else if (this.llmProvider === 'openai' && this.openaiApiKey) {
          parseOptions.openaiApiKey = this.openaiApiKey;
          parseOptions.provider = 'openai';
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
              field: analysis.field,
              description: suggestion.description,
              confidence: suggestion.confidence,
              pattern: suggestion.pattern,
              location: suggestion.location,
              testCases: suggestion.testCases,
            });
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.warn(
          `   ⚠️  Error analyzing ${result.statementId}: ${errorMessage}`,
        );
        // Continue to next statement
      }
    }

    // Remove duplicates and sort by confidence
    const unique = new Map<string, (typeof suggestions)[0]>();
    for (const s of suggestions) {
      const key = `${s.field}-${s.description}`;
      if (!unique.has(key) || unique.get(key)!.confidence < s.confidence) {
        unique.set(key, s);
      }
    }

    return Array.from(unique.values()).sort(
      (a, b) => b.confidence - a.confidence,
    );
  }

  private showExtractedDataSummary(results: any[]): void {
    const byBank = new Map<string, any[]>();

    for (const result of results) {
      if (!byBank.has(result.bank)) {
        byBank.set(result.bank, []);
      }
      byBank.get(result.bank)!.push(result);
    }

    for (const [bank, bankResults] of byBank.entries()) {
      console.log(`\n${bank.toUpperCase()} Bank:`);
      for (const result of bankResults) {
        console.log(`  📄 ${result.statementId}`);
        console.log(
          `     Transactions: ${result.extractedTransactionCount} (${result.transactionAccuracy.toFixed(1)}% accurate)`,
        );
        console.log(
          `     Metadata: ${result.metadataAccuracy.toFixed(1)}% accurate`,
        );
        if (result.metadataDifferences.length > 0) {
          const missingFields = result.metadataDifferences
            .map((d: any) => d.field)
            .join(', ');
          console.log(`     Missing: ${missingFields}`);
        }
      }
    }
  }

  private showSuggestions(
    suggestions: Array<{
      field: string;
      description: string;
      confidence: number;
      pattern?: string;
      location: string;
      testCases: string[];
    }>,
    summary: any,
    timestamp: string,
  ): void {
    // Group by field
    const byField = new Map<string, typeof suggestions>();
    for (const s of suggestions) {
      if (!byField.has(s.field)) {
        byField.set(s.field, []);
      }
      byField.get(s.field)!.push(s);
    }

    for (const [field, fieldSuggestions] of byField.entries()) {
      console.log(`\n🔧 ${field}:`);
      for (const suggestion of fieldSuggestions) {
        console.log(`\n   ${suggestion.description}`);
        console.log(
          `   Confidence: ${(suggestion.confidence * 100).toFixed(0)}%`,
        );
        console.log(`   Location: ${suggestion.location}`);
        if (suggestion.pattern) {
          console.log(`   Pattern: ${suggestion.pattern}`);
        }
        if (suggestion.testCases.length > 0) {
          console.log(
            `   Test Cases: ${suggestion.testCases.slice(0, 3).join(', ')}`,
          );
        }
      }
    }

    // Save to file
    const suggestionsPath = path.join(
      this.resultsDir,
      `improvements-${timestamp}.md`,
    );

    // Count analyses
    const regexAnalyses = suggestions.filter(s => s.pattern).length;
    const llmReports = suggestions.filter(s =>
      s.description.toLowerCase().includes('llm'),
    ).length;

    let markdown = `# Parser Improvement Suggestions\n\n`;
    markdown += `Generated: ${new Date().toISOString()}\n\n`;
    markdown += `## Summary\n\n`;
    markdown += `- Average Accuracy: ${summary.averageAccuracy.toFixed(2)}%\n`;
    markdown += `- Failed Statements: ${summary.failedStatements}\n`;
    markdown += `- Total Regex Analyses: ${regexAnalyses}\n`;
    markdown += `- LLM Tests Run: ${llmReports}\n`;
    markdown += `- Total Suggestions: ${suggestions.length}\n`;
    markdown += `- Fields to Fix: ${byField.size}\n\n`;

    for (const [field, fieldSuggestions] of byField.entries()) {
      markdown += `## ${field}\n\n`;
      for (const suggestion of fieldSuggestions) {
        markdown += `### ${suggestion.description}\n\n`;
        markdown += `- **Confidence**: ${(suggestion.confidence * 100).toFixed(0)}%\n`;
        markdown += `- **Location**: ${suggestion.location}\n`;
        if (suggestion.pattern) {
          markdown += `- **Pattern**: \`${suggestion.pattern}\`\n`;
        }
        if (suggestion.testCases.length > 0) {
          markdown += `- **Test Cases**:\n`;
          for (const testCase of suggestion.testCases) {
            markdown += `  - ${testCase}\n`;
          }
        }
        markdown += `\n`;
      }
    }

    fs.writeFileSync(suggestionsPath, markdown);
    console.log(`\n💾 Suggestions saved to: ${suggestionsPath}`);
  }

  /**
   * Apply high-confidence suggestions to parser files
   * Returns the number of suggestions successfully applied
   *
   * Note: This generates a detailed change plan. The actual code changes
   * will be applied by the AI assistant using the file editing tools.
   */
  private async applySuggestions(
    suggestions: Array<{
      field: string;
      description: string;
      confidence: number;
      pattern?: string;
      location: string;
      testCases: string[];
    }>,
  ): Promise<number> {
    const packageRoot = path.resolve(__dirname, '../../../../');
    const parsersDir = path.join(packageRoot, 'src', 'parsers');
    const changesPath = path.join(
      this.resultsDir,
      `auto-apply-changes-${Date.now()}.json`,
    );

    // Group suggestions by file
    const byFile = new Map<string, typeof suggestions>();
    for (const suggestion of suggestions) {
      // Parse location: "HDFCParser.ts - parseTransactionLine()" or "BaseParser.ts - parseDate()"
      const match = suggestion.location.match(
        /^([A-Za-z]+Parser\.ts)\s*-\s*(.+)$/,
      );
      if (!match || !suggestion.pattern) {
        console.warn(
          `   ⚠️  Skipping suggestion with unclear location: ${suggestion.location}`,
        );
        continue;
      }

      const filename = match[1];
      if (!filename) continue;
      if (!byFile.has(filename)) {
        byFile.set(filename, []);
      }
      byFile.get(filename)!.push(suggestion);
    }

    // Generate change plan
    const changePlan: Array<{
      file: string;
      field: string;
      description: string;
      pattern: string;
      location: string;
      testCases: string[];
      confidence: number;
    }> = [];

    for (const [filename, fileSuggestions] of byFile.entries()) {
      const filePath = path.join(parsersDir, filename);

      if (!fs.existsSync(filePath)) {
        console.warn(`   ⚠️  Parser file not found: ${filename}`);
        continue;
      }

      for (const suggestion of fileSuggestions) {
        if (suggestion.pattern) {
          changePlan.push({
            file: filename,
            field: suggestion.field,
            description: suggestion.description,
            pattern: suggestion.pattern,
            location: suggestion.location,
            testCases: suggestion.testCases,
            confidence: suggestion.confidence,
          });
          console.log(
            `   📝 Queued: ${filename} - ${suggestion.field} (${(suggestion.confidence * 100).toFixed(0)}% confidence)`,
          );
        }
      }
    }

    // Save change plan for AI assistant to apply
    if (changePlan.length > 0) {
      fs.writeFileSync(changesPath, JSON.stringify(changePlan, null, 2));
      console.log(`\n   💾 Change plan saved to: ${changesPath}`);
      console.log(
        `   🤖 The AI assistant will now apply these ${changePlan.length} improvements...`,
      );

      // Return count - actual application will be done by AI assistant
      return changePlan.length;
    }

    return 0;
  }

  private async cleanupAllFiles(): Promise<void> {
    if (!fs.existsSync(this.resultsDir)) {
      console.log('   No test-results directory found.');
      return;
    }

    const files = fs.readdirSync(this.resultsDir);
    let cleaned = 0;

    for (const file of files) {
      const filePath = path.join(this.resultsDir, file);

      try {
        fs.unlinkSync(filePath);
        cleaned++;
        console.log(`   Deleted: ${file}`);
      } catch (error) {
        console.warn(`   Failed to delete ${file}:`, error);
      }
    }

    console.log(`\n✅ Deleted ${cleaned} files from test-results/`);
  }

  private async cleanupFiles(...timestamps: string[]): Promise<void> {
    if (KEEP_RESULTS) {
      console.log('   (Skipping cleanup - --keep-results flag set)');
      return;
    }

    const files = fs.readdirSync(this.resultsDir);
    let cleaned = 0;

    for (const file of files) {
      const filePath = path.join(this.resultsDir, file);

      // Keep:
      // - agent.log (ongoing log)
      // - improvements-{latest}.md (latest suggestions)
      // - Expected JSON files are in test-data, not test-results

      // Delete:
      // - test-results-*.json (old test results)
      // - test-summary-*.json (old summaries)
      // - code-changes-*.ts (old code changes)
      // - pm2-*.log (PM2 logs, can be regenerated)
      // - improvements-{old}.md (keep only latest)

      if (file === 'agent.log') continue;

      // Keep latest improvements file
      if (file.startsWith('improvements-') && file.endsWith('.md')) {
        const latestTimestamp = timestamps[timestamps.length - 1];
        if (latestTimestamp && file.includes(latestTimestamp)) continue;
      }

      // Delete old result files
      if (file.startsWith('test-results-') && file.endsWith('.json')) {
        fs.unlinkSync(filePath);
        cleaned++;
        continue;
      }

      if (file.startsWith('test-summary-') && file.endsWith('.json')) {
        fs.unlinkSync(filePath);
        cleaned++;
        continue;
      }

      if (file.startsWith('code-changes-') && file.endsWith('.ts')) {
        fs.unlinkSync(filePath);
        cleaned++;
        continue;
      }

      if (file.startsWith('pm2-') && file.endsWith('.log')) {
        fs.unlinkSync(filePath);
        cleaned++;
        continue;
      }
    }

    console.log(`   Deleted ${cleaned} redundant files`);
    if (timestamps.length > 0) {
      console.log(
        `   Kept: agent.log, improvements-${timestamps[timestamps.length - 1]}.md`,
      );
    }
  }
}

// Run if called directly
if (require.main === module) {
  const workflow = new ImprovementWorkflow();
  workflow.run().catch(error => {
    console.error('Error in workflow:', error);
    process.exit(1);
  });
}
