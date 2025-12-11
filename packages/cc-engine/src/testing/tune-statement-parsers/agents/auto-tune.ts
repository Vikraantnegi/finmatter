#!/usr/bin/env node
/**
 * Fully Automated Parser Tuning Agent
 *
 * This agent:
 * 1. Watches for new PDF statements
 * 2. Generates expected JSON automatically
 * 3. Runs tests continuously
 * 4. Auto-fixes parsers when accuracy is low
 * 5. Reports improvements
 *
 * Usage: Run this as a background agent in Cursor
 *
 * User only needs to:
 * - Add PDF files to test-data/statements/{bank}/
 * - Add passwords to test-data/passwords.json (optional)
 *
 * Everything else is automated!
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

interface PasswordConfig {
  statements: Record<string, Record<string, string>>;
}

export class AutoTuneAgent {
  private tester: ParserTester;
  private regexAnalyzer: RegexAnalyzer;
  private llmTester: LLMAccuracyTester;
  private testDataDir: string;
  private passwordsPath: string;
  private resultsDir: string;
  private watchInterval: number = 5 * 60 * 1000; // 5 minutes
  private isRunning: boolean = false;
  private openaiApiKey?: string;
  private autoUpdateThreshold: number = 0.9; // 90% confidence
  private logPath: string;
  private lastAccuracy: number | null = null;
  private processedStatements: Set<string> = new Set();

  constructor(openaiApiKey?: string) {
    if (openaiApiKey) {
      this.openaiApiKey = openaiApiKey;
    }
    // Resolve paths relative to package root (works with both tsx and compiled JS)
    const packageRoot = path.resolve(__dirname, '../../../../');
    this.testDataDir = path.join(packageRoot, 'test-data');
    this.passwordsPath = path.join(this.testDataDir, 'passwords.json');
    this.resultsDir = path.join(packageRoot, 'test-results');
    this.logPath = path.join(this.resultsDir, 'agent.log');

    // Ensure results directory exists
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }

    this.tester = new ParserTester(
      this.testDataDir,
      this.resultsDir,
      openaiApiKey,
    );
    this.regexAnalyzer = new RegexAnalyzer();
    this.llmTester = new LLMAccuracyTester(openaiApiKey);
  }

  /**
   * Log message to both console and file
   */
  private log(
    message: string,
    level: 'info' | 'warn' | 'error' | 'notify' = 'info',
  ): void {
    const timestamp = new Date().toISOString();
    const prefix =
      level === 'notify'
        ? '🔔'
        : level === 'warn'
          ? '⚠️'
          : level === 'error'
            ? '❌'
            : 'ℹ️';
    const logMessage = `[${timestamp}] ${prefix} ${message}`;

    // eslint-disable-next-line no-console
    console.log(logMessage);

    // Append to log file
    try {
      fs.appendFileSync(this.logPath, `${logMessage}\n`, 'utf-8');
    } catch {
      // If logging fails, just continue
    }
  }

  /**
   * Send notification for important events
   */
  private notify(message: string): void {
    this.log(`NOTIFICATION: ${message}`, 'notify');
  }

  /**
   * Load passwords from config file
   */
  private loadPasswords(): PasswordConfig {
    if (!fs.existsSync(this.passwordsPath)) {
      return { statements: {} };
    }
    try {
      return JSON.parse(fs.readFileSync(this.passwordsPath, 'utf-8'));
    } catch {
      return { statements: {} };
    }
  }

  /**
   * Get password for a specific statement
   */
  private getPassword(bank: string, filename: string): string | undefined {
    const passwords = this.loadPasswords();
    return passwords.statements[bank]?.[filename];
  }

  /**
   * Find all PDF files without expected JSON
   */
  private findNewStatements(): Array<{
    bank: string;
    filename: string;
    path: string;
    password?: string;
  }> {
    const newStatements: Array<{
      bank: string;
      filename: string;
      path: string;
      password?: string;
    }> = [];
    const banks = ['hdfc', 'icici', 'amex', 'hsbc'];

    for (const bank of banks) {
      const bankDir = path.join(this.testDataDir, 'statements', bank);
      if (!fs.existsSync(bankDir)) continue;

      const files = fs.readdirSync(bankDir);
      const pdfFiles = files.filter(f => f.endsWith('.pdf'));

      for (const pdfFile of pdfFiles) {
        const statementId = pdfFile.replace('.pdf', '');
        const expectedPath = path.join(bankDir, `${statementId}.expected.json`);

        // If expected JSON doesn't exist, this is a new statement
        if (!fs.existsSync(expectedPath)) {
          const password = this.getPassword(bank, pdfFile);
          newStatements.push({
            bank,
            filename: pdfFile,
            path: path.join(bankDir, pdfFile),
            ...(password && { password }),
          });
        }
      }
    }

    return newStatements;
  }

  /**
   * Generate expected JSON for a statement
   */
  private async generateExpectedForStatement(statement: {
    bank: string;
    filename: string;
    path: string;
    password?: string;
  }): Promise<void> {
    const statementId = statement.filename.replace('.pdf', '');
    const bankDir = path.join(this.testDataDir, 'statements', statement.bank);
    const expectedPath = path.join(bankDir, `${statementId}.expected.json`);

    this.log(
      `Generating expected JSON for ${statement.bank}/${statement.filename}...`,
    );

    try {
      const pdfBuffer = fs.readFileSync(statement.path);

      // Parse the statement
      const { parseStatement } = await import('../../../index');
      const { cleanCardName } = await import('../../../utils/formatters');

      const parseOptions: {
        openaiApiKey?: string;
        useLLMFallback?: boolean;
        ollamaBaseUrl?: string;
        llmProvider?: 'openai' | 'ollama';
      } = {
        useLLMFallback: true,
      };

      // Prefer Ollama if available, fallback to OpenAI
      if (process.env.OLLAMA_BASE_URL || process.env.USE_OLLAMA === 'true') {
        parseOptions.ollamaBaseUrl =
          process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        parseOptions.llmProvider = 'ollama';
      } else if (process.env.OPENAI_API_KEY) {
        parseOptions.openaiApiKey = process.env.OPENAI_API_KEY;
        parseOptions.llmProvider = 'openai';
      }

      const parseResult = await parseStatement(
        pdfBuffer,
        statement.bank as any,
        statement.password,
        parseOptions,
      );

      // Clean card name if extracted
      if (parseResult.metadata.cardName) {
        parseResult.metadata.cardName = cleanCardName(
          parseResult.metadata.cardName,
        );
      }

      // Create expected result
      const expectedResult = {
        statementId,
        bank: statement.bank,
        ...(statement.password && { password: statement.password }),
        expectedTransactionCount: parseResult.transactions.length,
        expectedTransactions: parseResult.transactions.map((txn: any) => ({
          transactionDate: txn.transactionDate.toISOString().split('T')[0],
          postingDate: txn.postingDate
            ? txn.postingDate.toISOString().split('T')[0]
            : undefined,
          merchantName: txn.merchantName,
          merchantCategory: txn.merchantCategory,
          amount: txn.amount,
          type: txn.type,
          currency: txn.currency,
          description: txn.description,
          amountTolerance: 0.01,
        })),
        expectedMetadata: {
          cardLastFour: parseResult.metadata.cardLastFour,
          statementDate: parseResult.metadata.statementDate
            ? parseResult.metadata.statementDate.toISOString().split('T')[0]
            : undefined,
          statementPeriodStart: parseResult.metadata.statementPeriodStart
            ? parseResult.metadata.statementPeriodStart
                .toISOString()
                .split('T')[0]
            : undefined,
          statementPeriodEnd: parseResult.metadata.statementPeriodEnd
            ? parseResult.metadata.statementPeriodEnd
                .toISOString()
                .split('T')[0]
            : undefined,
          billingCycleStart: parseResult.metadata.billingCycleStart
            ? parseResult.metadata.billingCycleStart.toISOString().split('T')[0]
            : undefined,
          billingCycleEnd: parseResult.metadata.billingCycleEnd
            ? parseResult.metadata.billingCycleEnd.toISOString().split('T')[0]
            : undefined,
          totalAmount: parseResult.metadata.totalAmount,
          minimumDue: parseResult.metadata.minimumDue,
          paymentDueDate: parseResult.metadata.paymentDueDate
            ? parseResult.metadata.paymentDueDate.toISOString().split('T')[0]
            : undefined,
          cardName: parseResult.metadata.cardName,
          bankName: parseResult.metadata.bankName,
          rewardPoints: parseResult.metadata.rewardPoints,
          creditLimit: parseResult.metadata.totalCreditLimit,
          availableCredit: parseResult.metadata.availableCreditLimit,
        },
        notes: 'Auto-generated by AutoTuneAgent. Review and update if needed.',
      };

      fs.writeFileSync(expectedPath, JSON.stringify(expectedResult, null, 2));
      this.log(`Generated ${expectedPath}`);

      // Track processed statement
      const statementKey = `${statement.bank}/${statement.filename}`;
      if (!this.processedStatements.has(statementKey)) {
        this.processedStatements.add(statementKey);
        this.notify(`New statement processed: ${statementKey}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.log(
        `Failed to generate expected for ${statement.filename}: ${errorMessage}`,
        'error',
      );
    }
  }

  /**
   * Run tests and analyze results
   */
  private async runTestsAndAnalyze(): Promise<void> {
    this.log('Running parser tests...');
    const results = await this.tester.testAllStatements();
    const summary = this.tester.generateSummary(results);

    // Save results
    this.tester.saveResults(results, summary);

    // Log summary
    this.log(
      `Test Summary: Total=${summary.totalStatements}, Passed=${summary.passedStatements}, Failed=${summary.failedStatements}, Accuracy=${summary.averageAccuracy.toFixed(2)}%`,
    );

    // Track accuracy changes and notify
    const currentAccuracy = summary.averageAccuracy;
    if (this.lastAccuracy !== null) {
      const accuracyDiff = currentAccuracy - this.lastAccuracy;

      if (currentAccuracy < 90 && this.lastAccuracy >= 90) {
        this.notify(
          `Accuracy dropped below 90%: ${currentAccuracy.toFixed(2)}% (was ${this.lastAccuracy.toFixed(2)}%)`,
        );
      } else if (currentAccuracy >= 95 && this.lastAccuracy < 95) {
        this.notify(
          `Accuracy improved above 95%: ${currentAccuracy.toFixed(2)}% (was ${this.lastAccuracy.toFixed(2)}%)`,
        );
      } else if (accuracyDiff > 5) {
        this.notify(
          `Significant accuracy improvement: ${currentAccuracy.toFixed(2)}% (+${accuracyDiff.toFixed(2)}%)`,
        );
      } else if (accuracyDiff < -5) {
        this.notify(
          `Significant accuracy drop: ${currentAccuracy.toFixed(2)}% (${accuracyDiff.toFixed(2)}%)`,
        );
      }
    }
    this.lastAccuracy = currentAccuracy;

    // Generate improvement suggestions if:
    // 1. Accuracy is below 90%, OR
    // 2. There are specific issues (metadata failures, transaction issues), OR
    // 3. There are common issues affecting multiple statements
    const hasIssues =
      summary.commonIssues.length > 0 ||
      results.some(
        r =>
          r.metadataDifferences.length > 0 ||
          r.incorrectTransactions.length > 0,
      );

    if (summary.averageAccuracy < 90 || hasIssues) {
      const reason =
        summary.averageAccuracy < 90
          ? 'Accuracy below 90%'
          : 'Specific issues detected';
      this.log(`${reason} - generating improvement suggestions...`, 'warn');
      await this.generateImprovementSuggestions(results, summary);
    } else {
      this.log('Accuracy is good! No improvements needed.');
    }
  }

  /**
   * Generate improvement suggestions with regex analysis and LLM testing
   */
  private async generateImprovementSuggestions(
    results: any[],
    summary: any,
  ): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const suggestionsPath = path.join(
      this.resultsDir,
      `improvements-${timestamp}.md`,
    );
    const codeChangesPath = path.join(
      this.resultsDir,
      `code-changes-${timestamp}.ts`,
    );

    this.log('Analyzing failures and patterns...');

    // Analyze regex patterns for failed statements
    const regexAnalyses: any[] = [];
    const llmReports: any[] = [];

    for (const result of results) {
      if (result.success) continue; // Skip successful tests

      // Load expected result
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

      // Load PDF to extract text for LLM testing
      const pdfPath = path.join(
        this.testDataDir,
        'statements',
        result.bank,
        `${result.statementId}.pdf`,
      );
      if (!fs.existsSync(pdfPath)) continue;

      try {
        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfText = await extractTextFromPDF(pdfBuffer, expected.password);

        // Parse with current parser to get extracted data
        const parseOptions: {
          openaiApiKey?: string;
          useLLMFallback?: boolean;
        } = {
          useLLMFallback: false, // Test regex only
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
        regexAnalyses.push(...regexAnalysis);

        // Test LLM accuracy
        const llmReport = await this.llmTester.testLLMAccuracy(
          pdfText,
          expected.expectedMetadata,
          parseResult.metadata,
        );
        llmReports.push(llmReport);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.log(
          `Error analyzing ${result.statementId}: ${errorMessage}`,
          'error',
        );
      }
    }

    // Generate improvement report
    let suggestions = `# Parser Improvement Suggestions\n\n`;
    suggestions += `Generated: ${new Date().toISOString()}\n\n`;
    suggestions += `## Summary\n\n`;
    suggestions += `- Average Accuracy: ${summary.averageAccuracy.toFixed(2)}%\n`;
    suggestions += `- Failed Statements: ${summary.failedStatements}\n`;
    suggestions += `- Total Regex Analyses: ${regexAnalyses.length}\n`;
    suggestions += `- LLM Tests Run: ${llmReports.length}\n\n`;

    // Regex pattern suggestions
    if (regexAnalyses.length > 0) {
      suggestions += `## Regex Pattern Improvements\n\n`;

      const groupedByField = new Map<string, any[]>();
      for (const analysis of regexAnalyses) {
        if (!groupedByField.has(analysis.field)) {
          groupedByField.set(analysis.field, []);
        }
        groupedByField.get(analysis.field)!.push(analysis);
      }

      for (const [field, analyses] of groupedByField.entries()) {
        suggestions += `### ${field}\n\n`;
        suggestions += `- Failures: ${analyses.reduce((sum, a) => sum + a.failures.length, 0)}\n\n`;

        // Get best suggestions (highest confidence)
        const allSuggestions = analyses.flatMap(a => a.suggestions);
        const bestSuggestions = allSuggestions
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 3);

        for (const suggestion of bestSuggestions) {
          suggestions += `**Pattern** (${(suggestion.confidence * 100).toFixed(0)}% confidence):\n`;
          suggestions += `\`\`\`\n${suggestion.pattern}\n\`\`\`\n`;
          suggestions += `${suggestion.description}\n`;
          suggestions += `Location: ${suggestion.location}\n\n`;
        }
      }
    }

    // LLM recommendations
    if (llmReports.length > 0) {
      suggestions += `## LLM Extraction Analysis\n\n`;

      const avgLLMAccuracy =
        llmReports.reduce((sum, r) => sum + r.overallLLMAccuracy, 0) /
        llmReports.length;
      const avgRegexAccuracy =
        llmReports.reduce((sum, r) => sum + r.overallRegexAccuracy, 0) /
        llmReports.length;
      const improvement = avgLLMAccuracy - avgRegexAccuracy;

      suggestions += `- Regex Accuracy: ${avgRegexAccuracy.toFixed(2)}%\n`;
      suggestions += `- LLM Accuracy: ${avgLLMAccuracy.toFixed(2)}%\n`;
      suggestions += `- Improvement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(2)}%\n\n`;

      if (improvement > 10) {
        suggestions += `**Recommendation**: Use LLM as primary extraction method\n\n`;
      } else if (improvement > 0) {
        suggestions += `**Recommendation**: Use LLM as fallback for failed regex extractions\n\n`;
      }

      // Fields that benefit from LLM
      const fieldsNeedingLLM = new Set<string>();
      for (const report of llmReports) {
        for (const fieldResult of report.fieldResults) {
          if (fieldResult.shouldUseLLM) {
            fieldsNeedingLLM.add(fieldResult.field);
          }
        }
      }

      if (fieldsNeedingLLM.size > 0) {
        suggestions += `**Fields that benefit from LLM**: ${Array.from(fieldsNeedingLLM).join(', ')}\n\n`;
      }
    }

    // Top issues
    suggestions += `## Top Issues\n\n`;
    summary.commonIssues.slice(0, 10).forEach((issue: any, index: number) => {
      suggestions += `${index + 1}. **${issue.issue}**\n`;
      suggestions += `   - Affects ${issue.count} cases\n`;
      suggestions += `   - Statements: ${issue.statements.join(', ')}\n\n`;
    });

    // Generate code changes
    if (regexAnalyses.length > 0) {
      const codeChanges = this.regexAnalyzer.generateCodeChanges(regexAnalyses);
      fs.writeFileSync(codeChangesPath, codeChanges);
      suggestions += `\n## Auto-Generated Code Changes\n\n`;
      suggestions += `Code changes saved to: \`${codeChangesPath}\`\n\n`;
      suggestions += `Review and apply changes with confidence > ${(this.autoUpdateThreshold * 100).toFixed(0)}%\n\n`;
    }

    suggestions += `## Recommendations\n\n`;
    summary.recommendations.forEach((rec: string, index: number) => {
      suggestions += `${index + 1}. ${rec}\n`;
    });

    // Auto-update suggestions
    const highConfidenceSuggestions = regexAnalyses
      .flatMap(a => a.suggestions)
      .filter(s => s.confidence >= this.autoUpdateThreshold);

    if (highConfidenceSuggestions.length > 0) {
      suggestions += `\n## Auto-Update Recommendations\n\n`;
      suggestions += `The following ${highConfidenceSuggestions.length} suggestions have confidence >= ${(this.autoUpdateThreshold * 100).toFixed(0)}% and can be auto-applied:\n\n`;

      for (const suggestion of highConfidenceSuggestions) {
        suggestions += `- **${suggestion.description}**\n`;
        suggestions += `  - Pattern: \`${suggestion.pattern}\`\n`;
        suggestions += `  - Location: ${suggestion.location}\n`;
        suggestions += `  - Confidence: ${(suggestion.confidence * 100).toFixed(0)}%\n\n`;
      }

      suggestions += `\n**Note**: Review code-changes-${timestamp}.ts and apply manually or use auto-update feature.\n\n`;

      // Notify about high-confidence improvements
      this.notify(
        `High-confidence improvements ready: ${highConfidenceSuggestions.length} suggestions with >= ${(this.autoUpdateThreshold * 100).toFixed(0)}% confidence`,
      );
    }

    fs.writeFileSync(suggestionsPath, suggestions);
    this.log(`Improvement suggestions saved to: ${suggestionsPath}`);
    if (fs.existsSync(codeChangesPath)) {
      this.log(`Code changes saved to: ${codeChangesPath}`);
    }
  }

  /**
   * Main loop - runs continuously
   */
  async start(): Promise<void> {
    this.log('='.repeat(50));
    this.log('AutoTune Agent Started');
    this.log(`Watching: ${this.testDataDir}/statements/`);
    this.log(`Results: ${this.resultsDir}/`);
    this.log(`Log file: ${this.logPath}`);
    this.log(`Check interval: ${this.watchInterval / 1000}s`);
    this.log('='.repeat(50));

    this.isRunning = true;

    // Initial run
    await this.runCycle();

    // Continue running
    while (this.isRunning) {
      await new Promise(resolve => setTimeout(resolve, this.watchInterval));
      if (this.isRunning) {
        await this.runCycle();
      }
    }
  }

  /**
   * Single cycle: check for new statements, generate expected, run tests
   */
  private async runCycle(): Promise<void> {
    this.log(`Cycle started at ${new Date().toISOString()}`);

    // 1. Find new statements
    const newStatements = this.findNewStatements();

    if (newStatements.length > 0) {
      this.log(`Found ${newStatements.length} new statement(s):`);
      newStatements.forEach(s => {
        this.log(`  - ${s.bank}/${s.filename}`);
      });

      // 2. Generate expected JSON for new statements
      for (const statement of newStatements) {
        await this.generateExpectedForStatement(statement);
      }

      this.log('All expected JSON files generated');
    } else {
      this.log('No new statements found');
    }

    // 3. Run tests
    await this.runTestsAndAnalyze();

    this.log(`Cycle completed. Next check in ${this.watchInterval / 1000}s...`);
  }

  // Note: cleanCardName is now imported from formatters.ts, no need for duplicate

  /**
   * Stop the agent
   */
  stop(): void {
    this.log('Stopping AutoTune Agent...');
    this.isRunning = false;
  }
}

// Run if called directly
if (require.main === module) {
  const agent = new AutoTuneAgent(process.env.OPENAI_API_KEY);
  agent.start().catch(console.error);

  // Graceful shutdown
  process.on('SIGINT', () => {
    agent.stop();
    process.exit(0);
  });
}
