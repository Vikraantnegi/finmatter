#!/usr/bin/env node
/**
 * Parser Test Runner
 *
 * Usage:
 *   pnpm test:parsers                    # Test all banks
 *   pnpm test:parsers --bank hdfc        # Test specific bank
 *   pnpm test:parsers --generate-expected # Generate expected JSON from actual results
 */

/* eslint-disable no-console */
import { ParserTester } from '../core/ParserTester';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  const args = process.argv.slice(2);
  const bank = args.find(arg => arg.startsWith('--bank='))?.split('=')[1];
  const generateExpected = args.includes('--generate-expected');
  const openaiApiKey = process.env.OPENAI_API_KEY;

  const testDataDir = path.join(__dirname, '../../../../test-data');
  const resultsDir = path.join(__dirname, '../../../../test-results');

  console.log('🧪 Parser Testing Framework');
  console.log('='.repeat(50));
  console.log(`Test Data: ${testDataDir}`);
  console.log(`Results: ${resultsDir}`);
  if (bank) {
    console.log(`Bank: ${bank}`);
  }
  console.log('');

  const tester = new ParserTester(testDataDir, resultsDir, openaiApiKey);

  if (generateExpected) {
    console.log('📝 Generating expected JSON files from actual results...');
    await generateExpectedFiles(tester, bank);
  } else {
    console.log('🚀 Running parser tests...\n');
    const results = await tester.testAllStatements(bank);
    const summary = tester.generateSummary(results);

    // Print summary
    console.log(`\n${'='.repeat(50)}`);
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Statements: ${summary.totalStatements}`);
    console.log(`Passed: ${summary.passedStatements} ✅`);
    console.log(`Failed: ${summary.failedStatements} ❌`);
    console.log(`Average Accuracy: ${summary.averageAccuracy.toFixed(2)}%`);
    console.log('');

    // Bank-wise results
    console.log('Bank-wise Results:');
    for (const [bankName, bankResult] of Object.entries(summary.bankResults)) {
      console.log(
        `  ${bankName.toUpperCase()}: ${bankResult.passed}/${bankResult.total} passed (${bankResult.averageAccuracy.toFixed(2)}% accuracy)`,
      );
    }
    console.log('');

    // Common issues
    if (summary.commonIssues.length > 0) {
      console.log('Top Issues:');
      summary.commonIssues.slice(0, 5).forEach((issue, index) => {
        console.log(
          `  ${index + 1}. ${issue.issue} (${issue.count} occurrences)`,
        );
      });
      console.log('');
    }

    // Recommendations
    if (summary.recommendations.length > 0) {
      console.log('Recommendations:');
      summary.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
      console.log('');
    }

    // Save results
    tester.saveResults(results, summary);

    // Print individual results
    console.log('\n📋 Individual Results:');
    for (const result of results) {
      const status = result.success ? '✅' : '❌';
      console.log(
        `  ${status} ${result.statementId} (${result.bank}): ${result.overallAccuracy.toFixed(2)}% accuracy`,
      );
      if (!result.success && result.suggestions.length > 0) {
        console.log(`     Suggestions: ${result.suggestions[0]}`);
      }
    }
  }
}

/**
 * Generate expected JSON files from actual parsing results
 * Useful for creating initial test data
 */
async function generateExpectedFiles(
  tester: ParserTester,
  bank?: string,
): Promise<void> {
  const testDataDir = path.join(__dirname, '../../../../test-data');
  const banks = bank ? [bank] : ['hdfc', 'icici', 'amex', 'hsbc'];

  for (const bankName of banks) {
    const bankDir = path.join(testDataDir, 'statements', bankName);
    if (!fs.existsSync(bankDir)) {
      console.log(`⚠️  No test data directory for ${bankName}`);
      continue;
    }

    const files = fs.readdirSync(bankDir);
    const pdfFiles = files.filter(f => f.endsWith('.pdf'));

    for (const pdfFile of pdfFiles) {
      const statementId = pdfFile.replace('.pdf', '');
      const statementPath = path.join(bankDir, pdfFile);
      const expectedPath = path.join(bankDir, `${statementId}.expected.json`);

      // Skip if expected file already exists
      if (fs.existsSync(expectedPath)) {
        console.log(`⏭️  Skipping ${statementId} (expected file exists)`);
        continue;
      }

      console.log(`📝 Generating expected for ${statementId}...`);

      try {
        const parseResult = await tester['testStatement'](statementPath, {
          statementId,
          bank: bankName,
          expectedTransactionCount: 0,
          expectedTransactions: [],
          expectedMetadata: {},
        } as any);

        // Convert parse result to expected format
        const cardLastFourDiff = parseResult.metadataDifferences.find(
          d => d.field === 'cardLastFour',
        );
        const statementDateDiff = parseResult.metadataDifferences.find(
          d => d.field === 'statementDate',
        );

        const expectedResult = {
          statementId,
          bank: bankName,
          expectedTransactionCount: parseResult.extractedTransactionCount,
          expectedTransactions: parseResult.extraTransactions.map(txn => ({
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
          })),
          expectedMetadata: {
            ...(cardLastFourDiff?.extracted && {
              cardLastFour: cardLastFourDiff.extracted,
            }),
            ...(statementDateDiff?.extracted &&
              typeof statementDateDiff.extracted === 'string' && {
                statementDate: new Date(statementDateDiff.extracted)
                  .toISOString()
                  .split('T')[0],
              }),
            // Add other metadata fields as needed
          },
          notes:
            'Auto-generated from actual parse result. Review and update as needed.',
        };

        fs.writeFileSync(expectedPath, JSON.stringify(expectedResult, null, 2));
        console.log(`✅ Generated ${expectedPath}`);
      } catch (error) {
        console.error(
          `❌ Failed to generate expected for ${statementId}:`,
          error,
        );
      }
    }
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
