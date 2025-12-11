/**
 * HDFC Bank Statement Parser
 * Handles HDFC credit card statements (Millennia, Tata Neu Plus, etc.)
 */

import { BaseParser } from './BaseParser';
import type {
  ParseResult,
  ParsedTransaction,
  StatementMetadata,
} from '../types';
import { extractMetadataWithLLM } from '../utils/llmExtractor';
import { cleanCardName } from '../utils/formatters';

export class HDFCParser extends BaseParser {
  protected bankName = 'hdfc';

  async parse(
    pdfBuffer: Buffer,
    password?: string,
    options?:
      | {
          openaiApiKey?: string;
          useLLMFallback?: boolean;
          ollamaBaseUrl?: string;
          llmProvider?: 'openai' | 'ollama';
          provider?: 'openai' | 'ollama'; // Alias for llmProvider
        }
      | undefined,
  ): Promise<ParseResult> {
    const text = await this.extractText(pdfBuffer, password);

    // Log full PDF text
    console.log(`\n${'='.repeat(80)}`);
    console.log('📄 FULL PDF TEXT');
    console.log('='.repeat(80));
    console.log(text);
    console.log(`${'='.repeat(80)}\n`);
    // PDF extraction might not preserve line breaks properly
    // Split by newlines first, but also handle cases where everything is in one line
    let lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // If we have very few lines (PDF extraction issue), try splitting by common patterns
    if (lines.length < 10) {
      // Try splitting by "Domestic Transactions" and "International Transactions" markers
      const allText = lines.join(' ');
      const splitPoints = [
        ...Array.from(allText.matchAll(/Domestic Transactions/gi)),
        ...Array.from(allText.matchAll(/International Transactions/gi)),
        ...Array.from(allText.matchAll(/Page \d+ of \d+/gi)),
      ];

      if (splitPoints.length > 0) {
        // Split the text at these points
        const parts: string[] = [];
        let lastIndex = 0;
        for (const match of splitPoints.sort(
          (a, b) => (a.index || 0) - (b.index || 0),
        )) {
          if (match.index && match.index > lastIndex) {
            parts.push(allText.substring(lastIndex, match.index).trim());
            lastIndex = match.index;
          }
        }
        parts.push(allText.substring(lastIndex).trim());
        lines = parts.filter(p => p.length > 0);
      }
    }

    const transactions: ParsedTransaction[] = [];
    const metadata: StatementMetadata = {};
    const errors: string[] = [];

    // Extract metadata (card number, statement period, etc.)
    await this.extractMetadata(lines, metadata, text, options);

    // Extract transactions
    // HDFC statements typically have transaction tables with columns:
    // Date | Description | Amount
    const transactionStartIndex = this.findTransactionStartIndex(lines);

    if (transactionStartIndex === -1) {
      errors.push('Could not locate transaction table in statement');
      return this.validateResult({
        success: false,
        transactions: [],
        metadata,
        errors,
      });
    }

    // Parse transactions from the table
    // HDFC statements have multiple transactions on the same line, separated by 'l'
    // Since PDF extraction might put everything in one line, we need to extract from within lines

    // Extract all transaction text from the relevant lines
    // Look for "Domestic Transactions" and "International Transactions" sections
    let transactionText = '';
    let foundDomestic = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const lowerLine = line.toLowerCase();

      // Find "Domestic Transactions" section (can appear multiple times)
      const domesticIndex = lowerLine.indexOf('domestic transactions');
      if (domesticIndex !== -1) {
        foundDomestic = true;
        // Extract from "Domestic Transactions" onwards
        transactionText += `${line.substring(domesticIndex)} `;
        continue;
      }

      // Find "International Transactions" section
      const internationalIndex = lowerLine.indexOf(
        'international transactions',
      );
      if (internationalIndex !== -1) {
        // Extract from "International Transactions" onwards
        transactionText += `${line.substring(internationalIndex)} `;
        continue;
      }

      // If we've found a transactions section, continue adding lines until we hit a clear break
      if (foundDomestic || transactionText) {
        // Stop at clear section breaks (but allow transactions to continue across pages)
        if (
          (lowerLine.includes('rewards program') &&
            !lowerLine.includes('transaction')) ||
          (lowerLine.includes('smart emi loan') &&
            !lowerLine.includes('transaction')) ||
          (lowerLine.includes('gst summary') &&
            !lowerLine.includes('transaction')) ||
          (lowerLine.includes('bonus neucoins summary') &&
            !lowerLine.includes('transaction')) ||
          (lowerLine.includes('important information') &&
            !lowerLine.includes('transaction')) ||
          (lowerLine.includes('useful links') &&
            !lowerLine.includes('transaction'))
        ) {
          // Check if there are still transactions after this line before breaking
          const hasMoreTransactions = lines
            .slice(i + 1, Math.min(i + 5, lines.length))
            .some(
              nextLine =>
                nextLine &&
                nextLine.match(
                  /\d{1,2}\/\d{1,2}\/\d{2,4}\s*[|]\s*\d{1,2}:\d{2}/,
                ),
            );
          if (!hasMoreTransactions) {
            break;
          }
        }
        // Continue adding if it looks like transaction content
        if (
          line.match(/\d{1,2}\/\d{1,2}\/\d{2,4}\s*[|]/) ||
          lowerLine.includes('transaction') ||
          lowerLine.includes('date & time') ||
          lowerLine.includes('domestic transactions') ||
          lowerLine.includes('international transactions')
        ) {
          transactionText += `${line} `;
        }
      }
    }

    // Now parse transactions from the extracted text
    // Split by 'l' separator to get individual transaction parts
    const transactionParts = transactionText.split(/\s+l\s+/);

    // Parse transactions from the extracted text parts
    for (const part of transactionParts) {
      const trimmedPart = part.trim();
      if (!trimmedPart || trimmedPart.length < 10) continue;

      // Skip header rows (but still check for embedded transactions in them)
      const isHeader =
        trimmedPart.toLowerCase().includes('date') &&
        trimmedPart.toLowerCase().includes('description') &&
        trimmedPart.toLowerCase().includes('amount') &&
        trimmedPart.toLowerCase().includes('transaction');

      // Extract all transaction patterns from this part (might have multiple or be embedded)
      // Pattern: DD/MM/YYYY| HH:MM ... (optional +) C AMOUNT
      // Also handle international: DD/MM/YYYY | HH:MM ... USD AMOUNT C AMOUNT
      const transactionPattern =
        /(\d{1,2}\/\d{1,2}\/\d{2,4}\s*[|]\s*\d{1,2}:\d{2}.*?(?:\+\s*)?C\s+[\d,]+\.?\d*)/g;
      const transactionMatches = Array.from(
        trimmedPart.matchAll(transactionPattern),
      );

      if (transactionMatches.length > 0) {
        for (const match of transactionMatches) {
          if (match[1]) {
            const transactionText = match[1].trim();
            // Skip if it's just part of the header text
            if (isHeader && transactionText.length < 20) continue;

            const transaction = this.parseTransactionLine(transactionText);
            if (transaction) {
              transactions.push(transaction);
            }
          }
        }
      } else if (!isHeader) {
        // Fallback: try parsing the whole part if it's not a header
        const transaction = this.parseTransactionLine(trimmedPart);
        if (transaction) {
          transactions.push(transaction);
        }
      }
    }

    // Also try regex-based extraction as fallback to catch any missed transactions
    const transactionPattern =
      /(\d{1,2}\/\d{1,2}\/\d{2,4}\s*[|]\s*\d{1,2}:\d{2}.*?(?:\+\s*)?C\s+[\d,]+\.?\d*)\s*(?:l|$)/g;
    const transactionMatches = Array.from(
      transactionText.matchAll(transactionPattern),
    );

    // Create a set to track already parsed transactions (by date + amount)
    const parsedKeys = new Set(
      transactions.map(t => `${t.transactionDate.toISOString()}-${t.amount}`),
    );

    for (const match of transactionMatches) {
      const txText = match[1]?.trim();
      if (!txText || txText.length < 10) continue;

      const transaction = this.parseTransactionLine(txText);
      if (transaction) {
        const key = `${transaction.transactionDate.toISOString()}-${transaction.amount}`;
        if (!parsedKeys.has(key)) {
          transactions.push(transaction);
          parsedKeys.add(key);
        }
      }
    }

    // Log metadata
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 FINAL EXTRACTED METADATA');
    console.log('='.repeat(80));
    console.log(
      JSON.stringify(
        metadata,
        (key, value) => {
          // Convert Date objects to ISO strings for better readability
          if (value instanceof Date) {
            return value.toISOString();
          }
          return value;
        },
        2,
      ),
    );
    console.log(`${'='.repeat(80)}\n`);

    // Log transactions
    console.log(`\n${'='.repeat(80)}`);
    console.log(`💳 EXTRACTED TRANSACTIONS (${transactions.length} total)`);
    console.log('='.repeat(80));
    if (transactions.length > 0) {
      transactions.forEach((txn, index) => {
        console.log(`\nTransaction ${index + 1}:`);
        console.log(
          JSON.stringify(
            txn,
            (key, value) => {
              // Convert Date objects to ISO strings for better readability
              if (value instanceof Date) {
                return value.toISOString();
              }
              return value;
            },
            2,
          ),
        );
      });
    } else {
      console.log('No transactions found');
    }
    console.log(`\n${'='.repeat(80)}\n`);

    // Log errors if any
    if (errors.length > 0) {
      console.log(`\n${'='.repeat(80)}`);
      console.log('⚠️ PARSING ERRORS');
      console.log('='.repeat(80));
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
      console.log(`${'='.repeat(80)}\n`);
    }

    const result: ParseResult = {
      success: errors.length === 0,
      transactions,
      metadata,
    };

    if (errors.length > 0) {
      result.errors = errors;
    }

    return this.validateResult(result);
  }

  private async extractMetadata(
    lines: string[],
    metadata: StatementMetadata,
    fullText: string,
    options?: { openaiApiKey?: string; useLLMFallback?: boolean },
  ): Promise<void> {
    const text = fullText || lines.join(' ');

    // Extract card number (last 4 digits) - format: 518159XXXXXX5761
    const cardMatch =
      text.match(/(\d{4})XXXXXX(\d{4})/i) ||
      text.match(/Card\s*No[.:\s]*\*{4,}\s*(\d{4})/i);
    if (cardMatch) {
      const lastFour = cardMatch[2] || cardMatch[1];
      if (lastFour && !metadata.cardLastFour) {
        metadata.cardLastFour = lastFour;
      }
    }

    // Extract card name - format: "Millennia Credit Card" or "Tata Neu Plus HDFC Bank Credit Card Statement"
    // Try pattern with "Statement" suffix first (most reliable)
    let cardName: string | undefined;
    const statementPattern = text.match(
      /([A-Za-z][A-Za-z\s]+?)\s+HDFC\s+Bank\s+Credit\s+Card\s+Statement/i,
    );
    if (statementPattern && statementPattern[1]) {
      const extracted = statementPattern[1].trim();
      // Exclude generic phrases
      if (
        !extracted.match(
          /^(CALCULATION|YOUR|BANK|MITC|MINIMUM|AMOUNT|DUE|MAD)$/i,
        ) &&
        extracted.length > 3
      ) {
        cardName = `${extracted} Credit Card`;
      }
    }

    // Try specific card names if not found yet
    if (!cardName) {
      const specificCardNames = [
        'Tata Neu Plus',
        'Millennia',
        'Regalia',
        'Diners Club',
        'Infinia',
        'Platinum',
        'Gold',
        'Freedom',
        'MoneyBack',
        'Business',
        'Swiggy',
        'Times',
        'IndianOil',
      ];

      for (const name of specificCardNames) {
        // Try with "Credit Card" suffix
        const pattern1 = new RegExp(
          `(${name.replace(/\s+/g, '\\s+')}\\s+Credit\\s+Card)`,
          'i',
        );
        const match1 = text.match(pattern1);
        if (match1 && match1[1]) {
          cardName = match1[1].trim();
          break;
        }
        // Try without suffix (e.g., "HDFC Millennia")
        const pattern2 = new RegExp(
          `(HDFC\\s+${name.replace(/\s+/g, '\\s+')})`,
          'i',
        );
        const match2 = text.match(pattern2);
        if (match2 && match2[1]) {
          cardName = `${match2[1].trim()} Credit Card`;
          break;
        }
      }
    }

    // If no specific card name found, try generic pattern with better exclusions
    if (!cardName) {
      const genericMatch = text.match(
        /([A-Za-z][A-Za-z\s]{2,30}?Credit\s+Card)/i,
      );
      if (genericMatch && genericMatch[1]) {
        const candidate = genericMatch[1].trim();
        // Exclude common false positives
        const excludePatterns = [
          /^BANK\s+Credit\s+Card$/i,
          /CALCULATION/i,
          /YOUR\s+HDFC/i,
          /MINIMUM\s+AMOUNT/i,
          /MITC/i,
        ];
        const shouldExclude = excludePatterns.some(pattern =>
          pattern.test(candidate),
        );
        if (!shouldExclude && candidate.length > 10 && candidate.length < 50) {
          cardName = candidate;
        }
      }
    }

    if (cardName && !metadata.cardName) {
      metadata.cardName = cleanCardName(cardName);
    }

    // Extract bank name - format: "HDFC Bank"
    const bankMatch = text.match(/(HDFC|ICICI|SBI|AXIS|AMEX)\s+Bank/i);
    if (bankMatch && bankMatch[1] && !metadata.bankName) {
      metadata.bankName = `${bankMatch[1].toUpperCase()} Bank`;
    }

    // Extract statement date - format: "Statement Date 17 Sep, 2025" or "Credit Card No. ... Statement Date 17 Sep, 2025"
    // Try multiple patterns to handle different formatting
    const statementDateMatch =
      text.match(/Statement\s+Date[:\s]+(\d{1,2}\s+\w+,\s+\d{4})/i) ||
      text.match(/Statement\s+Date\s+(\d{1,2}\s+\w+,\s+\d{4})/i) ||
      text.match(
        /Credit\s+Card\s+No[.\s]+[^\s]+\s+[^\s]+\s+Statement\s+Date[:\s]+(\d{1,2}\s+\w+,\s+\d{4})/i,
      ) ||
      text.match(/Statement\s+Date\s+(\d{1,2}\s+[A-Za-z]{3},\s+\d{4})/i);
    if (
      statementDateMatch &&
      statementDateMatch[1] &&
      !metadata.statementDate
    ) {
      const date = this.parseDate(statementDateMatch[1]);
      if (date) {
        metadata.statementDate = date;
      }
    }

    // Extract billing period - format: "18 Aug, 2025 - 17 Sep, 2025" or "Billing Period  18 Aug, 2025 - 17 Sep, 2025"
    const billingMatch =
      text.match(
        /Billing\s+Period[:\s]+(\d{1,2}\s+\w+,\s+\d{4})\s*-\s*(\d{1,2}\s+\w+,\s+\d{4})/i,
      ) ||
      text.match(/(\d{1,2}\s+\w+,\s+\d{4})\s*-\s*(\d{1,2}\s+\w+,\s+\d{4})/);
    if (
      billingMatch &&
      billingMatch[1] &&
      billingMatch[2] &&
      !metadata.billingCycleStart
    ) {
      const startDate = this.parseDate(billingMatch[1]);
      const endDate = this.parseDate(billingMatch[2]);
      if (startDate) {
        metadata.billingCycleStart = startDate;
      }
      if (endDate) {
        metadata.billingCycleEnd = endDate;
      }
      // Also set as statement period if not set
      if (!metadata.statementPeriodStart && startDate) {
        metadata.statementPeriodStart = startDate;
      }
      if (!metadata.statementPeriodEnd && endDate) {
        metadata.statementPeriodEnd = endDate;
      }
    }

    // Extract payment due date - format: "DUE DATE  07 Oct, 2025"
    const dueMatch = text.match(/DUE\s+DATE[:\s]+(\d{1,2}\s+\w+,\s+\d{4})/i);
    if (dueMatch && dueMatch[1] && !metadata.paymentDueDate) {
      const dueDate = this.parseDate(dueMatch[1]);
      if (dueDate) {
        metadata.paymentDueDate = dueDate;
      }
    }

    // Extract total amount due - format: "TOTAL AMOUNT DUE  C 7,658.00" (may or may not have "l" after)
    const totalMatch = text.match(
      /TOTAL\s+AMOUNT\s+DUE[:\s]+C\s+([\d,]+\.?\d*)(?:\s*l|\s+MINIMUM|\s+DUE\s+DATE)/i,
    );
    if (totalMatch && totalMatch[1] && !metadata.totalAmount) {
      const amount = this.parseAmount(totalMatch[1]);
      if (amount) {
        metadata.totalAmount = amount;
      }
    }

    // Extract minimum due - format: "MINIMUM DUE  C 2,750.00" (may or may not have "l" after)
    const minDueMatch = text.match(
      /MINIMUM\s+DUE[:\s]+C\s+([\d,]+\.?\d*)(?:\s*l|\s+DUE\s+DATE)/i,
    );
    if (minDueMatch && minDueMatch[1] && !metadata.minimumDue) {
      const amount = this.parseAmount(minDueMatch[1]);
      if (amount) {
        metadata.minimumDue = amount;
      }
    }

    // Extract reward points - format: "Reward Points  7,934"
    const rewardPointsMatch = text.match(/Reward\s+Points[:\s]+([\d,]+)/i);
    if (rewardPointsMatch && rewardPointsMatch[1] && !metadata.rewardPoints) {
      const points = parseInt(rewardPointsMatch[1].replace(/,/g, ''), 10);
      if (!isNaN(points)) {
        metadata.rewardPoints = points;
      }
    }

    // Extract reward points details - format: "Opening Balance   Earned   Disbursed   Adjusted/Lapsed  7,886   48   0   0"
    const rewardDetailsMatch = text.match(
      /Opening\s+Balance[:\s]+Earned[:\s]+Disbursed[:\s]+Adjusted\/Lapsed[:\s]+([\d,]+)[:\s]+([\d,]+)[:\s]+([\d,]+)[:\s]+([\d,]+)/i,
    );
    if (rewardDetailsMatch) {
      if (rewardDetailsMatch[1] && !metadata.rewardPointsOpeningBalance) {
        const points = parseInt(rewardDetailsMatch[1].replace(/,/g, ''), 10);
        if (!isNaN(points)) metadata.rewardPointsOpeningBalance = points;
      }
      if (rewardDetailsMatch[2] && !metadata.rewardPointsEarned) {
        const points = parseInt(rewardDetailsMatch[2].replace(/,/g, ''), 10);
        if (!isNaN(points)) metadata.rewardPointsEarned = points;
      }
      if (rewardDetailsMatch[3] && !metadata.rewardPointsDisbursed) {
        const points = parseInt(rewardDetailsMatch[3].replace(/,/g, ''), 10);
        if (!isNaN(points)) metadata.rewardPointsDisbursed = points;
      }
      if (rewardDetailsMatch[4] && !metadata.rewardPointsAdjustedLapsed) {
        const points = parseInt(rewardDetailsMatch[4].replace(/,/g, ''), 10);
        if (!isNaN(points)) metadata.rewardPointsAdjustedLapsed = points;
      }
    }

    // Extract points expiring - format: "POINTS EXPIRING   IN 30 DAYS   0   IN 60 DAYS   0"
    const pointsExpiringMatch = text.match(
      /POINTS\s+EXPIRING[:\s]+IN\s+30\s+DAYS[:\s]+([\d,]+)[:\s]+IN\s+60\s+DAYS[:\s]+([\d,]+)/i,
    );
    if (pointsExpiringMatch) {
      if (pointsExpiringMatch[1] && !metadata.rewardPointsExpiring30Days) {
        const points = parseInt(pointsExpiringMatch[1].replace(/,/g, ''), 10);
        if (!isNaN(points)) metadata.rewardPointsExpiring30Days = points;
      }
      if (pointsExpiringMatch[2] && !metadata.rewardPointsExpiring60Days) {
        const points = parseInt(pointsExpiringMatch[2].replace(/,/g, ''), 10);
        if (!isNaN(points)) metadata.rewardPointsExpiring60Days = points;
      }
    }

    // Extract spending categories - format: "DEPTSTORE  39%  l   ELECTRONICS  34%  l   GROCERIES  27%"
    const spendingCategories: { category: string; percentage: number }[] = [];
    const categoryMatches = text.matchAll(/(\w+)[:\s]+(\d+)%\s*l/gi);
    for (const match of categoryMatches) {
      const category = match[1];
      const percentageStr = match[2];
      if (category && percentageStr) {
        const percentage = parseInt(percentageStr, 10);
        // Filter out non-category matches (like "IN 30 DAYS")
        if (
          !isNaN(percentage) &&
          !category.match(/^(IN|DAYS|POINTS|EXPIRING)$/i) &&
          percentage > 0 &&
          percentage <= 100
        ) {
          spendingCategories.push({ category, percentage });
        }
      }
    }
    if (spendingCategories.length > 0 && !metadata.spendingCategories) {
      metadata.spendingCategories = spendingCategories;
    }

    // Extract rewards program summary - format: "1% CashBack on other Spends   17 pts"
    const rewardsProgram: { program: string; points: number }[] = [];
    const rewardsMatch = text.match(
      /Rewards\s+Program\s+Points\s+Summary([\s\S]*?)Total[:\s]+(\d+)\s+pts/i,
    );
    if (rewardsMatch && rewardsMatch[1]) {
      const rewardsText = rewardsMatch[1];
      const programMatches = rewardsText.matchAll(
        /(\d+[%]?\s+[^\d]+?)\s+(\d+)\s+pts/gi,
      );
      for (const match of programMatches) {
        const program = match[1]?.trim();
        const pointsStr = match[2];
        if (program && pointsStr) {
          const points = parseInt(pointsStr, 10);
          if (!isNaN(points)) {
            rewardsProgram.push({ program, points });
          }
        }
      }
      const totalPointsStr = rewardsMatch[2];
      if (totalPointsStr) {
        const totalPoints = parseInt(totalPointsStr, 10);
        if (!isNaN(totalPoints)) {
          metadata.rewardsTotalPoints = totalPoints;
        }
      }
    }
    if (rewardsProgram.length > 0 && !metadata.rewardsProgramSummary) {
      metadata.rewardsProgramSummary = rewardsProgram;
    }

    // Extract financial summary - format: "PREVIOUS STATEMENT DUES   PAYMENTS/CREDITS RECEIVED PURCHASES/DEBIT (Current Billing Cycle)   FINANCE CHARGES  C 11,332.97   C 11,333.00   C 7,658.08   C 0.00"
    const financialMatch = text.match(
      /PREVIOUS\s+STATEMENT\s+DUES[:\s]+PAYMENTS\/CREDITS\s+RECEIVED[:\s]+PURCHASES\/DEBIT[:\s]+\(Current\s+Billing\s+Cycle\)[:\s]+FINANCE\s+CHARGES[:\s]+C\s+([\d,]+\.?\d*)[:\s]+C\s+([\d,]+\.?\d*)[:\s]+C\s+([\d,]+\.?\d*)[:\s]+C\s+([\d,]+\.?\d*)/i,
    );
    if (financialMatch) {
      if (financialMatch[1] && !metadata.previousStatementDues) {
        const amount = this.parseAmount(financialMatch[1]);
        if (amount !== null) metadata.previousStatementDues = amount;
      }
      if (financialMatch[2] && !metadata.paymentsCreditsReceived) {
        const amount = this.parseAmount(financialMatch[2]);
        if (amount !== null) metadata.paymentsCreditsReceived = amount;
      }
      if (financialMatch[3] && !metadata.purchasesDebit) {
        const amount = this.parseAmount(financialMatch[3]);
        if (amount !== null) metadata.purchasesDebit = amount;
      }
      if (financialMatch[4] && !metadata.financeCharges) {
        const amount = this.parseAmount(financialMatch[4]);
        if (amount !== null) metadata.financeCharges = amount;
      }
    }

    // Extract credit limits - format: "TOTAL CREDIT LIMIT (Including Cash)   AVAILABLE CREDIT LIMIT   AVAILABLE CASH LIMIT  C 97,000   C 79,460   C 38,800"
    const creditLimitMatch = text.match(
      /TOTAL\s+CREDIT\s+LIMIT[:\s]+\(Including\s+Cash\)[:\s]+AVAILABLE\s+CREDIT\s+LIMIT[:\s]+AVAILABLE\s+CASH\s+LIMIT[:\s]+C\s+([\d,]+\.?\d*)[:\s]+C\s+([\d,]+\.?\d*)[:\s]+C\s+([\d,]+\.?\d*)/i,
    );
    if (creditLimitMatch) {
      if (creditLimitMatch[1] && !metadata.totalCreditLimit) {
        const amount = this.parseAmount(creditLimitMatch[1]);
        if (amount !== null) metadata.totalCreditLimit = amount;
      }
      if (creditLimitMatch[2] && !metadata.availableCreditLimit) {
        const amount = this.parseAmount(creditLimitMatch[2]);
        if (amount !== null) metadata.availableCreditLimit = amount;
      }
      if (creditLimitMatch[3] && !metadata.availableCashLimit) {
        const amount = this.parseAmount(creditLimitMatch[3]);
        if (amount !== null) metadata.availableCashLimit = amount;
      }
    }

    // Extract EMI loans - format: "128251594   14/08/2025   C 14,309.82   6 Months   15 %   C 9,658.82   C 304.00   4 Months"
    const emiLoans: StatementMetadata['emiLoans'] = [];
    const emiSectionMatch = text.match(
      /Smart\s+EMI\s+Loan\s+Summary([\s\S]*?)\*Pre-closure/i,
    );
    if (emiSectionMatch && emiSectionMatch[1]) {
      const emiText = emiSectionMatch[1];
      const emiMatches = emiText.matchAll(
        /(\d+)[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4})[:\s]+C\s+([\d,]+\.?\d*)[:\s]+(\d+\s+Months?)[:\s]+(\d+)\s*%[:\s]+C\s+([\d,]+\.?\d*)[:\s]+C\s+([\d,]+\.?\d*)[:\s]+(\d+\s+Months?)/gi,
      );
      for (const match of emiMatches) {
        const loanNumber = match[1];
        const bookedDateStr = match[2];
        const amountStr = match[3];
        const tenure = match[4];
        const rateStr = match[5];
        const balancePrincipalStr = match[6];
        const interestPayableStr = match[7];
        const balanceTenure = match[8];

        if (
          loanNumber &&
          bookedDateStr &&
          amountStr &&
          tenure &&
          rateStr &&
          balanceTenure
        ) {
          const bookedDate = this.parseDate(bookedDateStr);
          const amount = this.parseAmount(amountStr);
          const rateOfInterest = parseFloat(rateStr);
          const balancePrincipal = balancePrincipalStr
            ? this.parseAmount(balancePrincipalStr) || 0
            : 0;
          const interestPayable = interestPayableStr
            ? this.parseAmount(interestPayableStr) || 0
            : 0;

          if (bookedDate && amount !== null && !isNaN(rateOfInterest)) {
            emiLoans.push({
              loanNumber,
              bookedDate,
              amount,
              tenure,
              rateOfInterest,
              balancePrincipal,
              outstandingBalance: balancePrincipal, // Same as balance principal
              interestPayable,
              balanceTenure,
            });
          }
        }
      }
    }
    if (emiLoans.length > 0 && !metadata.emiLoans) {
      metadata.emiLoans = emiLoans;
    }

    // Extract GST summary - format: "IGST   CGST   SGST   REVERSAL   TOTAL GST  C 35.67   C 0   C 0   C 0   C 35.67"
    const gstMatch = text.match(
      /GST\s+Summary[:\s]+IGST[:\s]+CGST[:\s]+SGST[:\s]+REVERSAL[:\s]+TOTAL\s+GST[:\s]+C\s+([\d,]+\.?\d*)[:\s]+C\s+([\d,]+\.?\d*)[:\s]+C\s+([\d,]+\.?\d*)[:\s]+C\s+([\d,]+\.?\d*)[:\s]+C\s+([\d,]+\.?\d*)/i,
    );
    if (gstMatch && !metadata.gstSummary) {
      const igstStr = gstMatch[1];
      const cgstStr = gstMatch[2];
      const sgstStr = gstMatch[3];
      const reversalStr = gstMatch[4];
      const totalStr = gstMatch[5];

      if (igstStr && cgstStr && sgstStr && reversalStr && totalStr) {
        metadata.gstSummary = {
          igst: this.parseAmount(igstStr) || 0,
          cgst: this.parseAmount(cgstStr) || 0,
          sgst: this.parseAmount(sgstStr) || 0,
          reversal: this.parseAmount(reversalStr) || 0,
          total: this.parseAmount(totalStr) || 0,
        };
      }
    }

    // Log regex extraction results first
    console.log(`\n${'-'.repeat(80)}`);
    console.log('🔍 REGEX EXTRACTION RESULTS');
    console.log('-'.repeat(80));
    console.log('Card Name:', metadata.cardName || 'NOT FOUND');
    console.log('Card Last Four:', metadata.cardLastFour || 'NOT FOUND');
    console.log('Bank Name:', metadata.bankName || 'NOT FOUND');
    console.log(
      'Statement Date:',
      metadata.statementDate?.toISOString() || 'NOT FOUND',
    );
    console.log(
      'Billing Cycle:',
      `${metadata.billingCycleStart?.toISOString() || 'N/A'} to ${metadata.billingCycleEnd?.toISOString() || 'N/A'}`,
    );
    console.log('Total Amount Due:', metadata.totalAmount || 'NOT FOUND');
    console.log('Minimum Due:', metadata.minimumDue || 'NOT FOUND');
    console.log(`${'-'.repeat(80)}\n`);

    // LLM Fallback: Use LLM if regex failed or confidence is low
    const useLLM =
      options?.useLLMFallback !== false && // Default to true if not specified
      options?.openaiApiKey &&
      (!metadata.cardName || // Regex didn't find card name
        metadata.cardName.toLowerCase().includes('calculation') || // Low confidence match
        metadata.cardName.toLowerCase().includes('your')); // Generic match

    const hasLLM =
      options?.openaiApiKey ||
      (options as any)?.ollamaBaseUrl ||
      process.env.USE_OLLAMA === 'true';

    if (useLLM && hasLLM) {
      console.log(
        '🔄 [HDFC Parser] Using LLM fallback for metadata extraction',
      );
      try {
        const llmOptions: any = {};

        if (
          (options as any)?.llmProvider === 'ollama' ||
          process.env.USE_OLLAMA === 'true'
        ) {
          llmOptions.provider = 'ollama';
          llmOptions.ollamaBaseUrl =
            (options as any)?.ollamaBaseUrl ||
            process.env.OLLAMA_BASE_URL ||
            'http://localhost:11434';
        } else if (options?.openaiApiKey) {
          llmOptions.provider = 'openai';
          llmOptions.apiKey = options.openaiApiKey;
        }

        const llmResult = await extractMetadataWithLLM(text, llmOptions);

        if (llmResult) {
          console.log(`\n${'-'.repeat(80)}`);
          console.log('🤖 LLM EXTRACTION RESULTS');
          console.log('-'.repeat(80));
          console.log(JSON.stringify(llmResult, null, 2));
          console.log(`${'-'.repeat(80)}\n`);

          // Merge LLM results with regex results (LLM takes precedence for missing fields)
          if (llmResult.cardName && !metadata.cardName) {
            metadata.cardName = cleanCardName(llmResult.cardName);
            console.log(
              '✅ [HDFC Parser] LLM extracted card name:',
              metadata.cardName,
            );
          }
          if (llmResult.cardLastFour && !metadata.cardLastFour) {
            metadata.cardLastFour = llmResult.cardLastFour;
          }
          if (llmResult.bankName && !metadata.bankName) {
            metadata.bankName = llmResult.bankName;
          }
          if (llmResult.statementDate && !metadata.statementDate) {
            const date = this.parseDate(llmResult.statementDate);
            if (date) metadata.statementDate = date;
          }
          if (
            llmResult.statementPeriodStart &&
            !metadata.statementPeriodStart
          ) {
            const date = this.parseDate(llmResult.statementPeriodStart);
            if (date) metadata.statementPeriodStart = date;
          }
          if (llmResult.statementPeriodEnd && !metadata.statementPeriodEnd) {
            const date = this.parseDate(llmResult.statementPeriodEnd);
            if (date) metadata.statementPeriodEnd = date;
          }
          if (llmResult.billingCycleStart && !metadata.billingCycleStart) {
            const date = this.parseDate(llmResult.billingCycleStart);
            if (date) metadata.billingCycleStart = date;
          }
          if (llmResult.billingCycleEnd && !metadata.billingCycleEnd) {
            const date = this.parseDate(llmResult.billingCycleEnd);
            if (date) metadata.billingCycleEnd = date;
          }
          if (llmResult.paymentDueDate && !metadata.paymentDueDate) {
            const date = this.parseDate(llmResult.paymentDueDate);
            if (date) metadata.paymentDueDate = date;
          }
          if (llmResult.totalAmount !== undefined && !metadata.totalAmount) {
            metadata.totalAmount = llmResult.totalAmount;
          }
          if (llmResult.minimumDue !== undefined && !metadata.minimumDue) {
            metadata.minimumDue = llmResult.minimumDue;
          }
          if (llmResult.rewardPoints !== undefined && !metadata.rewardPoints) {
            metadata.rewardPoints = llmResult.rewardPoints;
          }
          if (
            llmResult.creditLimit !== undefined &&
            !metadata.totalCreditLimit
          ) {
            metadata.totalCreditLimit = llmResult.creditLimit;
          }
          if (
            llmResult.availableCredit !== undefined &&
            !metadata.availableCreditLimit
          ) {
            metadata.availableCreditLimit = llmResult.availableCredit;
          }
        }
      } catch (error) {
        console.warn(
          '⚠️ [HDFC Parser] LLM extraction failed, using regex results only:',
          error,
        );
        // Continue with regex results only
      }
    } else if (options?.useLLMFallback !== false && !options?.openaiApiKey) {
      console.log(
        'ℹ️ [HDFC Parser] LLM fallback enabled but no API key provided, using regex only',
      );
    }
  }

  private findTransactionStartIndex(lines: string[]): number {
    // Look for transaction table header
    // HDFC format: "Domestic Transactions" followed by "DATE & TIME   TRANSACTION DESCRIPTION   AMOUNT   PI"
    // Since PDF extraction might put everything in one line, we need to search within lines too
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const lowerLine = line.toLowerCase();

      // Look for "Domestic Transactions" header - it might be in the middle of a long line
      const domesticIndex = lowerLine.indexOf('domestic transactions');
      if (domesticIndex !== -1) {
        // Found "Domestic Transactions" - look for the transaction pattern after it
        // Transactions start with date pattern: DD/MM/YYYY|
        const afterDomestic = line.substring(domesticIndex);
        const transactionMatch = afterDomestic.match(
          /\d{1,2}\/\d{1,2}\/\d{2,4}\s*[|]\s*\d{1,2}:\d{2}/,
        );
        if (transactionMatch && transactionMatch.index !== undefined) {
          return i; // Return this line index - we'll parse transactions from within it
        }
      }

      // Also check if line starts with "Domestic Transactions"
      if (
        lowerLine.startsWith('domestic transactions') ||
        lowerLine.includes('domestic transactions  date & time')
      ) {
        // Check if this line or next line has transactions
        const transactionMatch = line.match(
          /\d{1,2}\/\d{1,2}\/\d{2,4}\s*[|]\s*\d{1,2}:\d{2}/,
        );
        if (transactionMatch) {
          return i;
        }
        // Check next line
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (
            nextLine &&
            nextLine.match(/\d{1,2}\/\d{1,2}\/\d{2,4}\s*[|]\s*\d{1,2}:\d{2}/)
          ) {
            return i + 1;
          }
        }
      }

      // Fallback: look for transaction pattern directly (date with pipe)
      if (line.match(/\d{1,2}\/\d{1,2}\/\d{2,4}\s*[|]\s*\d{1,2}:\d{2}/)) {
        return i;
      }
    }
    return -1;
  }

  private parseTransactionLine(line: string): ParsedTransaction | null {
    // HDFC transaction line format:
    // DD/MM/YYYY| HH:MM   DESCRIPTION   C   AMOUNT   l
    // or for credits:
    // DD/MM/YYYY| HH:MM   DESCRIPTION   +   C   AMOUNT   l
    // or for international:
    // DD/MM/YYYY | HH:MM   DESCRIPTION   USD AMOUNT   C   AMOUNT_INR   l
    // Note: `C` is the INR currency symbol, `l` is a field separator

    // Remove trailing `l` separator if present
    const cleanLine = line.replace(/\s*l\s*$/, '').trim();

    // Try to match date at the start (with pipe separator)
    // Handle both formats: "DD/MM/YYYY|" and "DD/MM/YYYY |" (with space)
    const dateMatch =
      cleanLine.match(/^(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})\s*[|]\s*/) ||
      cleanLine.match(/^(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})\s+\|\s*/);
    if (!dateMatch || !dateMatch[1]) {
      return null;
    }

    const transactionDate = this.parseDate(dateMatch[1]);
    if (!transactionDate) {
      return null;
    }

    // Extract time (HH:MM after the pipe)
    // Handle both formats: "DD/MM/YYYY| HH:MM" and "DD/MM/YYYY | HH:MM"
    const timeMatch =
      cleanLine.match(
        /\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\s*[|]\s*(\d{1,2}:\d{2})/,
      ) ||
      cleanLine.match(
        /\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\s+\|\s*(\d{1,2}:\d{2})/,
      );
    const dateTimeEnd = timeMatch
      ? (timeMatch.index || 0) + timeMatch[0].length
      : (dateMatch.index || 0) + (dateMatch[0]?.length ?? 0);

    // Check if it's a credit (has + before C)
    const isCredit =
      cleanLine.includes('+') &&
      cleanLine.indexOf('+') < cleanLine.indexOf('C');

    // Extract amount - HDFC format: C   AMOUNT (C is INR currency symbol)
    // Look for pattern: C   followed by number (may have commas and decimals)
    // For international: might have USD amount first, then C   INR amount
    let amountMatch = cleanLine.match(/C\s+([\d,]+\.?\d*)/);

    // If no C found, try to find amount at the end (fallback)
    if (!amountMatch) {
      amountMatch = cleanLine.match(/([\d,]+\.?\d*)\s*$/);
    }

    if (!amountMatch || !amountMatch[1]) {
      return null;
    }

    const amount = this.parseAmount(amountMatch[1]);
    if (amount === null) {
      return null;
    }

    // Extract description (everything between date/time and the amount)
    const amountStart = amountMatch.index ?? cleanLine.length;
    let description = cleanLine.substring(dateTimeEnd, amountStart).trim();

    // Note: Keep the + symbol in description for now, we'll use it to determine type
    // But clean it up from the final description
    const hasPlus = description.includes('+');
    description = description.replace(/^\+\s*/, '').trim();

    // Remove trailing C if it's part of description (shouldn't be, but just in case)
    description = description.replace(/\s+C\s*$/, '').trim();

    // For international transactions, remove USD amount from description
    // Format: DESCRIPTION   USD 20.00   C   AMOUNT
    description = description.replace(/\s+USD\s+[\d,]+\.?\d*\s*$/, '').trim();

    // Try to extract merchant category if present (often in parentheses)
    let merchantCategory: string | undefined;
    const categoryMatch = description.match(/\(([^)]+)\)/);
    if (categoryMatch && categoryMatch[1]) {
      merchantCategory = categoryMatch[1].trim();
      description = description.replace(/\([^)]+\)/g, '').trim();
    }

    // Clean up description
    description = description.replace(/\s+/g, ' ').trim();

    if (!description || description.length < 3) {
      return null;
    }

    const merchantName = this.normalizeMerchantName(description);

    // Determine transaction type
    // The + symbol before C indicates a credit (payment received)
    let type: 'debit' | 'credit' | 'refund' = 'debit';
    if (
      isCredit ||
      hasPlus ||
      description.toLowerCase().includes('payment') ||
      description.toLowerCase().includes('credit')
    ) {
      type = 'credit';
    } else {
      type = this.determineTransactionType(amount, description);
    }

    const transaction: ParsedTransaction = {
      transactionDate,
      merchantName,
      amount: Math.abs(amount), // Store as positive, use type field
      type,
      currency: 'INR',
      description,
      rawText: line,
    };

    if (merchantCategory) {
      transaction.merchantCategory = merchantCategory;
    }

    return transaction;
  }
}
