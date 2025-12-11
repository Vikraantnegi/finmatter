#!/usr/bin/env node
/**
 * View Test Results and Extracted Data
 *
 * Displays:
 * - Summary of test results
 * - Extracted transactions for each statement
 * - Extracted metadata for each statement
 * - Comparison with expected results
 *
 * Usage:
 *   pnpm view:results
 *   pnpm view:results --latest
 *   pnpm view:results --file test-results-2025-12-11T09-28-10-111Z.json
 */

/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';
import { parseStatement, type BankName } from '../../../index';
import type { ExpectedResult } from '../core/types';

const packageRoot = path.resolve(__dirname, '../../../../');
const testDataDir = path.join(packageRoot, 'test-data');
const resultsDir = path.join(packageRoot, 'test-results');

interface TestResult {
  statementId: string;
  bank: string;
  success: boolean;
  expectedTransactionCount: number;
  extractedTransactionCount: number;
  matchedTransactionCount: number;
  transactionAccuracy: number;
  missingTransactions: any[];
  extraTransactions: any[];
  incorrectTransactions: any[];
  metadataAccuracy: number;
  metadataDifferences: any[];
  overallAccuracy: number;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

function findLatestResultsFile(): string | null {
  if (!fs.existsSync(resultsDir)) {
    return null;
  }

  const files = fs
    .readdirSync(resultsDir)
    .filter(f => f.startsWith('test-results-') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(resultsDir, f),
      time: fs.statSync(path.join(resultsDir, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  return files.length > 0 && files[0] ? files[0].path : null;
}

function loadResults(filePath: string): TestResult[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

async function extractCurrentData(
  statementId: string,
  bank: string,
  password?: string,
): Promise<any> {
  const pdfPath = path.join(
    testDataDir,
    'statements',
    bank,
    `${statementId}.pdf`,
  );
  if (!fs.existsSync(pdfPath)) {
    return null;
  }

  const pdfBuffer = fs.readFileSync(pdfPath);

  const parseOptions: {
    openaiApiKey?: string;
    useLLMFallback?: boolean;
    ollamaBaseUrl?: string;
    llmProvider?: 'openai' | 'ollama';
  } = {
    useLLMFallback: true,
  };

  if (process.env.OLLAMA_BASE_URL || process.env.USE_OLLAMA === 'true') {
    parseOptions.ollamaBaseUrl =
      process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    parseOptions.llmProvider = 'ollama';
  } else if (process.env.OPENAI_API_KEY) {
    parseOptions.openaiApiKey = process.env.OPENAI_API_KEY;
    parseOptions.llmProvider = 'openai';
  }

  try {
    const result = await parseStatement(
      pdfBuffer,
      bank as BankName,
      password,
      parseOptions,
    );
    return result;
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function displayResults(
  results: TestResult[],
  showExtracted: boolean = true,
): void {
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(80));

  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = total - passed;
  const avgAccuracy =
    results.reduce((sum, r) => sum + r.overallAccuracy, 0) / total;

  console.log(`\nOverall:`);
  console.log(`  Total Statements: ${total}`);
  console.log(`  Passed: ${passed} ✅`);
  console.log(`  Failed: ${failed} ❌`);
  console.log(`  Average Accuracy: ${avgAccuracy.toFixed(2)}%`);

  // Group by bank
  const byBank = new Map<string, TestResult[]>();
  for (const result of results) {
    if (!byBank.has(result.bank)) {
      byBank.set(result.bank, []);
    }
    byBank.get(result.bank)!.push(result);
  }

  console.log(`\nBy Bank:`);
  for (const [bank, bankResults] of byBank.entries()) {
    const bankPassed = bankResults.filter(r => r.success).length;
    const bankAvg =
      bankResults.reduce((sum, r) => sum + r.overallAccuracy, 0) /
      bankResults.length;
    console.log(
      `  ${bank.toUpperCase()}: ${bankPassed}/${bankResults.length} passed, ${bankAvg.toFixed(2)}% accuracy`,
    );
  }

  // Detailed view for each statement
  console.log(`\n${'='.repeat(80)}`);
  console.log('📄 DETAILED RESULTS BY STATEMENT');
  console.log('='.repeat(80));

  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    console.log(
      `\n${status} ${result.bank.toUpperCase()} - ${result.statementId}`,
    );
    console.log(`  Overall Accuracy: ${result.overallAccuracy.toFixed(2)}%`);
    console.log(
      `  Transaction Accuracy: ${result.transactionAccuracy.toFixed(2)}% (${result.matchedTransactionCount}/${result.expectedTransactionCount} matched)`,
    );
    console.log(`  Metadata Accuracy: ${result.metadataAccuracy.toFixed(2)}%`);
    console.log(
      `  Extracted: ${result.extractedTransactionCount} transactions`,
    );

    if (result.missingTransactions.length > 0) {
      console.log(
        `\n  ⚠️  Missing Transactions (${result.missingTransactions.length}):`,
      );
      result.missingTransactions.slice(0, 5).forEach((txn, i) => {
        console.log(
          `    ${i + 1}. ${txn.transactionDate} - ${txn.merchantName} - ₹${txn.amount}`,
        );
      });
      if (result.missingTransactions.length > 5) {
        console.log(
          `    ... and ${result.missingTransactions.length - 5} more`,
        );
      }
    }

    if (result.extraTransactions.length > 0) {
      console.log(
        `\n  ➕ Extra Transactions (${result.extraTransactions.length}):`,
      );
      result.extraTransactions.slice(0, 5).forEach((txn, i) => {
        const date =
          txn.transactionDate instanceof Date
            ? txn.transactionDate.toISOString().split('T')[0]
            : txn.transactionDate;
        console.log(
          `    ${i + 1}. ${date} - ${txn.merchantName} - ₹${txn.amount}`,
        );
      });
      if (result.extraTransactions.length > 5) {
        console.log(`    ... and ${result.extraTransactions.length - 5} more`);
      }
    }

    if (result.incorrectTransactions.length > 0) {
      console.log(
        `\n  ⚠️  Incorrect Transactions (${result.incorrectTransactions.length}):`,
      );
      result.incorrectTransactions.slice(0, 3).forEach((item, i) => {
        console.log(
          `    ${i + 1}. Expected: ${item.expected.merchantName} - ₹${item.expected.amount}`,
        );
        console.log(
          `       Got: ${item.extracted.merchantName} - ₹${item.extracted.amount}`,
        );
        if (item.differences.length > 0) {
          console.log(`       Issues: ${item.differences.join(', ')}`);
        }
      });
    }

    if (result.metadataDifferences.length > 0) {
      console.log(`\n  📋 Metadata Differences:`);
      result.metadataDifferences.forEach(diff => {
        console.log(
          `    - ${diff.field}: expected "${diff.expected}", got "${diff.extracted}"`,
        );
      });
    }

    if (result.errors.length > 0) {
      console.log(`\n  ❌ Errors:`);
      result.errors.forEach(err => console.log(`    - ${err}`));
    }

    if (result.warnings.length > 0) {
      console.log(`\n  ⚠️  Warnings:`);
      result.warnings.forEach(warn => console.log(`    - ${warn}`));
    }
  }

  if (showExtracted) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('💾 EXTRACTED DATA (Current Parser Output)');
    console.log('='.repeat(80));
    console.log(
      '\nNote: Re-extracting data to show current parser output...\n',
    );
  }
}

async function displayExtractedData(results: TestResult[]): Promise<void> {
  for (const result of results) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📄 ${result.bank.toUpperCase()} - ${result.statementId}`);
    console.log('─'.repeat(80));

    // Load expected to get password
    const expectedPath = path.join(
      testDataDir,
      'statements',
      result.bank,
      `${result.statementId}.expected.json`,
    );
    let password: string | undefined;
    if (fs.existsSync(expectedPath)) {
      const expected: ExpectedResult = JSON.parse(
        fs.readFileSync(expectedPath, 'utf-8'),
      );
      password = expected.password;
    }

    const extracted = await extractCurrentData(
      result.statementId,
      result.bank,
      password,
    );

    if (extracted && !extracted.error) {
      console.log(`\n✅ Successfully extracted`);
      console.log(`\n📋 Metadata:`);

      // Display metadata in a more readable format, highlighting important fields
      const metadata = extracted.metadata;
      const importantFields = [
        { key: 'cardName', label: 'Card Name' },
        { key: 'cardLastFour', label: 'Card Last 4' },
        { key: 'bankName', label: 'Bank Name' },
        { key: 'statementDate', label: 'Statement Date' },
        { key: 'statementPeriodStart', label: 'Period Start' },
        { key: 'statementPeriodEnd', label: 'Period End' },
        { key: 'billingCycleStart', label: 'Billing Start' },
        { key: 'billingCycleEnd', label: 'Billing End' },
        { key: 'paymentDueDate', label: 'Due Date' },
        { key: 'totalAmount', label: 'Total Amount' },
        { key: 'minimumDue', label: 'Minimum Due' },
        { key: 'creditLimit', label: 'Credit Limit' },
        { key: 'availableCredit', label: 'Available Credit' },
        { key: 'rewardPoints', label: 'Reward Points' },
      ];

      for (const field of importantFields) {
        const value = metadata[field.key as keyof typeof metadata];
        if (value !== undefined && value !== null) {
          let displayValue = value;
          if (value instanceof Date) {
            displayValue = value.toISOString().split('T')[0];
          } else if (typeof value === 'number') {
            displayValue = `₹${value.toLocaleString('en-IN')}`;
          }
          console.log(`  ${field.label}: ${displayValue}`);
        } else {
          console.log(`  ${field.label}: ❌ MISSING`);
        }
      }

      // Show any other metadata fields not in the important list
      const shownKeys = new Set(importantFields.map(f => f.key));
      const otherFields = Object.keys(metadata).filter(k => !shownKeys.has(k));
      if (otherFields.length > 0) {
        console.log(`\n  Other fields:`);
        for (const key of otherFields) {
          const value = metadata[key as keyof typeof metadata];
          console.log(`    ${key}: ${JSON.stringify(value)}`);
        }
      }

      console.log(`\n💳 Transactions (${extracted.transactions.length}):`);
      extracted.transactions.forEach((txn: any, i: number) => {
        const date =
          txn.transactionDate instanceof Date
            ? txn.transactionDate.toISOString().split('T')[0]
            : txn.transactionDate;
        const postingDate =
          txn.postingDate instanceof Date
            ? txn.postingDate.toISOString().split('T')[0]
            : txn.postingDate || 'N/A';
        console.log(
          `  ${i + 1}. ${date}${postingDate !== 'N/A' ? ` (posted: ${postingDate})` : ''} - ${txn.merchantName} - ${txn.type} - ₹${txn.amount}`,
        );
        if (txn.description) {
          console.log(`     Description: ${txn.description}`);
        }
        if (txn.merchantCategory) {
          console.log(`     Category: ${txn.merchantCategory}`);
        }
      });
    } else if (extracted && extracted.error) {
      console.log(`\n❌ Error extracting: ${extracted.error}`);
    } else {
      console.log(`\n⚠️  Could not find PDF file`);
    }
  }
}

async function extractAllStatements(): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log('💾 EXTRACTING DATA FROM ALL STATEMENTS');
  console.log('='.repeat(80));
  console.log('\nExtracting data directly from PDF files...\n');

  const banks = ['hdfc', 'icici', 'amex', 'hsbc'];
  const allStatements: Array<{
    bank: string;
    statementId: string;
    password?: string;
  }> = [];

  // Find all statements
  for (const bank of banks) {
    const bankDir = path.join(testDataDir, 'statements', bank);
    if (!fs.existsSync(bankDir)) continue;

    const files = fs.readdirSync(bankDir);
    const pdfFiles = files.filter(f => f.endsWith('.pdf'));

    for (const pdfFile of pdfFiles) {
      const statementId = pdfFile.replace('.pdf', '');
      const expectedPath = path.join(bankDir, `${statementId}.expected.json`);

      let password: string | undefined;
      if (fs.existsSync(expectedPath)) {
        try {
          const expected: ExpectedResult = JSON.parse(
            fs.readFileSync(expectedPath, 'utf-8'),
          );
          password = expected.password;
        } catch {
          // Ignore errors reading expected file
        }
      }

      allStatements.push({
        bank,
        statementId,
        ...(password && { password }),
      });
    }
  }

  if (allStatements.length === 0) {
    console.error('❌ No PDF statements found');
    console.error(`   Looked in: ${testDataDir}/statements/`);
    process.exit(1);
  }

  // Extract data for each statement
  for (const { bank, statementId, password } of allStatements) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📄 ${bank.toUpperCase()} - ${statementId}`);
    console.log('─'.repeat(80));

    const extracted = await extractCurrentData(statementId, bank, password);

    if (extracted && !extracted.error) {
      console.log(`\n✅ Successfully extracted`);
      console.log(`\n📋 Metadata:`);

      // Display metadata in a more readable format, highlighting important fields
      const metadata = extracted.metadata;
      const importantFields = [
        { key: 'cardName', label: 'Card Name' },
        { key: 'cardLastFour', label: 'Card Last 4' },
        { key: 'bankName', label: 'Bank Name' },
        { key: 'statementDate', label: 'Statement Date' },
        { key: 'statementPeriodStart', label: 'Period Start' },
        { key: 'statementPeriodEnd', label: 'Period End' },
        { key: 'billingCycleStart', label: 'Billing Start' },
        { key: 'billingCycleEnd', label: 'Billing End' },
        { key: 'paymentDueDate', label: 'Due Date' },
        { key: 'totalAmount', label: 'Total Amount' },
        { key: 'minimumDue', label: 'Minimum Due' },
        { key: 'creditLimit', label: 'Credit Limit' },
        { key: 'availableCredit', label: 'Available Credit' },
        { key: 'rewardPoints', label: 'Reward Points' },
      ];

      for (const field of importantFields) {
        const value = metadata[field.key as keyof typeof metadata];
        if (value !== undefined && value !== null) {
          let displayValue = value;
          if (value instanceof Date) {
            displayValue = value.toISOString().split('T')[0];
          } else if (typeof value === 'number') {
            displayValue = `₹${value.toLocaleString('en-IN')}`;
          }
          console.log(`  ${field.label}: ${displayValue}`);
        } else {
          console.log(`  ${field.label}: ❌ MISSING`);
        }
      }

      // Show any other metadata fields not in the important list
      const shownKeys = new Set(importantFields.map(f => f.key));
      const otherFields = Object.keys(metadata).filter(k => !shownKeys.has(k));
      if (otherFields.length > 0) {
        console.log(`\n  Other fields:`);
        for (const key of otherFields) {
          const value = metadata[key as keyof typeof metadata];
          console.log(`    ${key}: ${JSON.stringify(value)}`);
        }
      }

      console.log(`\n💳 Transactions (${extracted.transactions.length}):`);
      extracted.transactions.forEach((txn: any, i: number) => {
        const date =
          txn.transactionDate instanceof Date
            ? txn.transactionDate.toISOString().split('T')[0]
            : txn.transactionDate;
        const postingDate =
          txn.postingDate instanceof Date
            ? txn.postingDate.toISOString().split('T')[0]
            : txn.postingDate || 'N/A';
        console.log(
          `  ${i + 1}. ${date}${postingDate !== 'N/A' ? ` (posted: ${postingDate})` : ''} - ${txn.merchantName} - ${txn.type} - ₹${txn.amount}`,
        );
        if (txn.description) {
          console.log(`     Description: ${txn.description}`);
        }
        if (txn.merchantCategory) {
          console.log(`     Category: ${txn.merchantCategory}`);
        }
      });
    } else if (extracted && extracted.error) {
      console.log(`\n❌ Error extracting: ${extracted.error}`);
    } else {
      console.log(`\n⚠️  Could not find PDF file`);
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const showLatest = args.includes('--latest') || args.length === 0;
  const fileArg = args.find(arg => arg.startsWith('--file='));
  const skipExtracted = args.includes('--skip-extracted');
  const extractAll = args.includes('--all') || args.includes('--extract-all');

  // If --all flag, extract directly from PDFs
  if (extractAll) {
    await extractAllStatements();
    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ Done!');
    console.log('='.repeat(80));
    return;
  }

  let resultsFile: string | null = null;

  if (fileArg) {
    const filePath = fileArg.split('=')[1];
    if (filePath) {
      resultsFile = path.isAbsolute(filePath)
        ? filePath
        : path.join(resultsDir, filePath);
    }
  } else if (showLatest) {
    resultsFile = findLatestResultsFile();
  }

  // If no results file found, offer to extract directly from PDFs
  if (!resultsFile || !fs.existsSync(resultsFile)) {
    console.warn('⚠️  No test results JSON file found');
    console.warn(`   Looked in: ${resultsDir}`);
    console.warn(
      '\n   This usually means results were cleaned up by the workflow.',
    );
    console.warn('   You can extract data directly from PDFs instead:\n');
    console.warn('   Options:');
    console.warn(
      '     pnpm view:results --all              # Extract from all PDFs',
    );
    console.warn(
      '     pnpm view:results --file=filename     # View specific results file',
    );
    console.warn(
      '     pnpm parsers:improve --keep-results    # Run workflow and keep results',
    );
    console.warn('\n   Extracting from all PDFs now...\n');

    await extractAllStatements();
    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ Done!');
    console.log('='.repeat(80));
    return;
  }

  console.log(`📂 Loading results from: ${resultsFile}`);
  const results = loadResults(resultsFile);

  displayResults(results, !skipExtracted);

  if (!skipExtracted) {
    await displayExtractedData(results);
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('✅ Done!');
  console.log('='.repeat(80));
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}
