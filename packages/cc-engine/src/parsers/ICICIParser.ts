/**
 * ICICI Bank Statement Parser
 * Enhanced to extract comprehensive metadata and transaction details
 */

import { BaseParser } from './BaseParser';
import type {
  ParseResult,
  ParsedTransaction,
  StatementMetadata,
  ParserConfig,
} from './types';

export class ICICIParser extends BaseParser {
  constructor() {
    super();
  }

  protected getConfig(): ParserConfig {
    return {
      bankName: 'icici',
      dateFormats: [
        'dd MMM yyyy',
        'dd/MM/yyyy',
        'dd-MM-yyyy',
        'dd MMM yy',
        'dd/MM/yy',
      ],
      transactionPatterns: [],
      amountPatterns: [],
      merchantPatterns: [],
    };
  }

  async parse(pdfText: string): Promise<ParseResult> {
    try {
      const transactions: ParsedTransaction[] = [];
      const metadata = this.extractICICIMetadata(pdfText);

      // Extract transactions: DD/MM/YYYY + Serial(11) + Merchant + IN + RewardPoints + Amount
      // Example: 23/08/202511843152554ZOMATO NEW DELHI IN4249.60
      // The amount format is: RewardPoints + Amount (e.g., 4249.60 = 4 points + 249.60 amount)
      const transactionPattern =
        /(\d{2}\/\d{2}\/\d{4})\d{11}(.+? IN)(\d+\.\d{2})(?: CR)?$/gm;

      let match;
      while ((match = transactionPattern.exec(pdfText)) !== null) {
        if (!match[1] || !match[2] || !match[3]) continue;

        const dateStr = match[1]; // DD/MM/YYYY
        let merchantName = match[2].trim(); // Merchant + location (ends with " IN")
        const combinedAmountStr = match[3]; // 4249.60 (includes reward points)

        const date = this.parseDate(dateStr);
        if (!date) continue;

        // Split the combined amount: RewardPoints + Amount
        // 4249.60 -> reward points: 4, amount: 249.60
        const amountParts = combinedAmountStr.split('.');
        const integerPart = amountParts[0]; // "4249"
        const decimalPart = amountParts[1]; // "60"

        let rewardPoints = 0;
        let actualAmountStr = combinedAmountStr;

        if (integerPart && integerPart.length >= 3) {
          // Take first 1-3 digits as reward points, rest as amount
          // 4249 -> 4 (reward) + 249 (amount)
          const rewardDigits = integerPart.slice(0, -3); // "4" from "4249"
          const amountDigits = integerPart.slice(-3); // "249" from "4249"

          if (rewardDigits.length >= 1 && rewardDigits.length <= 3) {
            rewardPoints = parseInt(rewardDigits);
            actualAmountStr = `${amountDigits}.${decimalPart}`; // "249.60"
          } else {
            // Fallback: use first 1-2 digits as reward points
            rewardPoints = parseInt(integerPart.slice(0, 2));
            actualAmountStr = `${integerPart.slice(2)}.${decimalPart}`;
          }
        }

        // Parse amount
        const isCredit = match[0].includes(' CR');
        const amountNum = parseFloat(actualAmountStr.replace(/,/g, ''));
        if (isNaN(amountNum)) continue;

        // Determine location (domestic vs international)
        let location: 'domestic' | 'international' | undefined;
        if (merchantName.includes(' IN')) {
          location = 'domestic';
          merchantName = merchantName.replace(/ IN$/, '').trim();
        }

        // Check for international transactions
        // ICICI marks international transactions with a marker in the statement
        const merchantLower = merchantName.toLowerCase();
        if (merchantLower.includes('intl')) {
          location = 'international';
        }

        // Determine transaction type
        let type: ParsedTransaction['type'] = 'debit';
        if (isCredit) {
          type = 'credit';
        } else if (
          merchantLower.includes('reversal') ||
          merchantLower.includes('refund')
        ) {
          type = 'refund';
        } else if (
          merchantLower.includes('fee') ||
          merchantLower.includes('charge')
        ) {
          type = 'fee';
        } else if (merchantLower.includes('interest')) {
          type = 'interest';
        }

        const transaction: ParsedTransaction = {
          date,
          merchantName: this.cleanMerchantName(merchantName),
          amount: isCredit ? -amountNum : amountNum, // Credits are negative
          rawText: match[0],
          type,
        };

        if (location) transaction.location = location;
        transaction.rewardPoints = rewardPoints;

        transactions.push(transaction);
      }

      if (transactions.length === 0) {
        return this.createFailedResult('No transactions found in statement');
      }

      // Update spendsOverview with calculated domestic/international/total transactions
      if (metadata.spendsOverview) {
        const debitTransactions = transactions.filter(t => t.type === 'debit');
        const domesticDebitTransactions = transactions.filter(
          t => t.location === 'domestic' && t.type === 'debit',
        );
        const internationalDebitTransactions = transactions.filter(
          t => t.location === 'international' && t.type === 'debit',
        );

        // Calculate total spends if not already set (should be sum of all debit transactions)
        if (
          !metadata.spendsOverview.totalSpends ||
          metadata.spendsOverview.totalSpends === 0
        ) {
          metadata.spendsOverview.totalSpends = debitTransactions.reduce(
            (sum, t) => sum + t.amount,
            0,
          );
        }

        metadata.spendsOverview.numberOfTransactions = transactions.length;
        metadata.spendsOverview.domesticSpends =
          domesticDebitTransactions.reduce((sum, t) => sum + t.amount, 0);
        metadata.spendsOverview.internationalSpends =
          internationalDebitTransactions.reduce((sum, t) => sum + t.amount, 0);
      }

      // Calculate reward points from transactions if not already set
      if (!metadata.rewardPoints || !metadata.rewardPoints.earned) {
        const totalRewardPoints = transactions
          .filter(t => t.rewardPoints && t.rewardPoints > 0)
          .reduce((sum, t) => sum + (t.rewardPoints || 0), 0);

        if (totalRewardPoints > 0) {
          metadata.rewardPoints = {
            opening: 0,
            earned: totalRewardPoints,
            redeemed: 0,
            expired: 0,
            closing: totalRewardPoints,
          };
        }
      }

      return this.createResult(transactions, metadata);
    } catch (error) {
      return this.createFailedResult(
        `Error parsing ICICI statement: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Extract ICICI-specific metadata from statement
   */
  private extractICICIMetadata(pdfText: string): StatementMetadata {
    const metadata: StatementMetadata = {};

    // Card number: 4035XXXXXXXX9008
    // Usually appears multiple times in the statement
    const cardPattern = /(\d{4}X+\d{4})/g;
    const cardMatches = pdfText.match(cardPattern);
    if (cardMatches && cardMatches[0]) {
      metadata.cardLastFourDigits = cardMatches[0].slice(-4);
    }

    // Statement Date and Payment Due Date appear together after "T&C apply"
    // Format: "T&C apply\nSeptember 18, 2025\nOctober 6, 2025"
    // First date is statement date, second is payment due date
    const datesPattern =
      /T&C apply[\s\S]{0,50}?(\w+ \d{1,2}, \d{4})[\s\S]{0,50}?(\w+ \d{1,2}, \d{4})/i;
    const datesMatch = pdfText.match(datesPattern);
    if (datesMatch) {
      if (datesMatch[1]) {
        const stmtDate = this.parseDate(datesMatch[1]);
        if (stmtDate) {
          metadata.statementDate = stmtDate;
          // Extract statement day (18th)
          metadata.statementDay = stmtDate.getDate();
        }
      }
      if (datesMatch[2]) {
        const dueDate = this.parseDate(datesMatch[2]);
        if (dueDate) metadata.dueDate = dueDate;
      }
    }

    // Statement Period: August 19, 2025 to September 18, 2025
    // Format: "Statement period : August 19, 2025 to September 18, 2025"
    const periodPattern =
      /Statement period\s*:\s*(\w+ \d{1,2}, \d{4})\s+to\s+(\w+ \d{1,2}, \d{4})/i;
    const periodMatch = pdfText.match(periodPattern);
    if (periodMatch) {
      if (periodMatch[1]) {
        const start = this.parseDate(periodMatch[1]);
        if (start) {
          metadata.statementPeriodStart = start;
          // Extract billing day (19th)
          metadata.billingDay = start.getDate();
        }
      }
      if (periodMatch[2]) {
        const end = this.parseDate(periodMatch[2]);
        if (end) metadata.statementPeriodEnd = end;
      }
    }

    // Amounts appear in the statement summary section
    // Format: "Total Amount due\nMinimum Amount due\n...\n`1,290.00\n`25,711.08"
    // The amounts appear after the labels with backticks, with category percentages in between
    const amountsPattern =
      /`([\d,]+\.?\d*)[\s\S]{0,100}?`([\d,]+\.?\d*)[\s\S]{0,50}?SPENDS OVERVIEW/i;
    const amountsMatch = pdfText.match(amountsPattern);
    if (amountsMatch) {
      if (amountsMatch[1]) {
        metadata.minimumPayment = parseFloat(amountsMatch[1].replace(/,/g, ''));
      }
      if (amountsMatch[2]) {
        metadata.totalDue = parseFloat(amountsMatch[2].replace(/,/g, ''));
      }
    }

    // Credit limits (all four values appear on consecutive line after labels)
    // Format: Credit Limit (Including cash)Available Credit (Including cash)Cash LimitAvailable Cash
    //         `10,70,000.00`10,44,288.92`1,07,000.00`1,07,000.00
    const limitsPattern =
      /Credit Limit[\s\S]{0,200}?`([\d,]+\.?\d*)`([\d,]+\.?\d*)`([\d,]+\.?\d*)`([\d,]+\.?\d*)/i;
    const limitsMatch = pdfText.match(limitsPattern);
    if (
      limitsMatch &&
      limitsMatch[1] &&
      limitsMatch[2] &&
      limitsMatch[3] &&
      limitsMatch[4]
    ) {
      metadata.creditLimit = parseFloat(limitsMatch[1].replace(/,/g, ''));
      metadata.availableCredit = parseFloat(limitsMatch[2].replace(/,/g, ''));
      metadata.cashAdvanceLimit = parseFloat(limitsMatch[3].replace(/,/g, ''));
      // Note: limitsMatch[4] is "Available Cash" which is usually same as cash limit
    }

    // Reward Points appear after the labels
    // Format: "Total Points earned*\nPoints earned on iShop\n...\n476\n0"
    // First number is total points, second is iShop points
    // Look for the pattern after credit limits: `1,07,000.00\n476\n0\nICICI
    const rewardsPattern =
      /`1,07,000\.00`1,07,000\.00[\s\S]{0,20}?(\d+)[\s\S]{0,20}?(\d+)[\s\S]{0,20}?ICICI Bank/i;
    const rewardsMatch = pdfText.match(rewardsPattern);

    if (rewardsMatch && rewardsMatch[1] && rewardsMatch[2]) {
      const closing = parseInt(rewardsMatch[1]);
      const iShopPoints = parseInt(rewardsMatch[2]);

      metadata.rewardPoints = {
        opening: 0, // ICICI doesn't show opening balance in this format
        earned: closing, // Total points are what was earned
        redeemed: 0,
        expired: 0,
        closing,
      };

      if (iShopPoints > 0) {
        metadata.rewardPoints.earnedByCategory = {
          iShop: iShopPoints,
        };
      }
    }

    // Spends Overview
    // Format: Apparel/Grocery-49% Others-11%\nDining-40%
    const spendsPattern =
      /Apparel\/Grocery-(\d+)%.*?Others-(\d+)%[\s\S]{0,50}?Dining-(\d+)%/i;
    const spendsMatch = pdfText.match(spendsPattern);

    if (spendsMatch && spendsMatch[1] && spendsMatch[2] && spendsMatch[3]) {
      // Get total spends from Purchases/Charges
      // Format: Purchases / Charges`27,138.24
      const purchasesPattern = /Purchases\s*\/\s*Charges\s*`([\d,]+\.?\d*)/i;
      const purchasesMatch = pdfText.match(purchasesPattern);
      let totalSpends = 0;

      if (purchasesMatch && purchasesMatch[1]) {
        totalSpends = parseFloat(purchasesMatch[1].replace(/,/g, ''));
      }

      if (totalSpends > 0) {
        const apparelGroceryPercent = parseInt(spendsMatch[1]);
        const othersPercent = parseInt(spendsMatch[2]);
        const diningPercent = parseInt(spendsMatch[3]);

        const categoryWiseSpends: Record<string, any> = {
          'Apparel/Grocery': {
            amount:
              Math.round(((totalSpends * apparelGroceryPercent) / 100) * 100) /
              100,
            percentage: apparelGroceryPercent,
          },
          Dining: {
            amount:
              Math.round(((totalSpends * diningPercent) / 100) * 100) / 100,
            percentage: diningPercent,
          },
          Others: {
            amount:
              Math.round(((totalSpends * othersPercent) / 100) * 100) / 100,
            percentage: othersPercent,
          },
        };

        metadata.spendsOverview = {
          totalSpends,
          domesticSpends: 0, // Calculate from transactions
          internationalSpends: 0, // Calculate from transactions
          atmWithdrawals: 0,
          numberOfTransactions: 0, // Will be set from transaction count
          categoryWiseSpends,
        };
      }
    }

    // Statement Summary: Previous Balance, Purchases/Charges, Cash Advances, Payments/Credits
    // Format: "Previous BalancePurchases / ChargesCash AdvancesPayments / Credits\n`17,923.61`27,138.24`0.00\n`19,350.77"
    const summaryPattern =
      /Previous BalancePurchases \/ ChargesCash AdvancesPayments \/ Credits[\s\S]{0,50}?`([\d,]+\.?\d*)`([\d,]+\.?\d*)`([\d,]+\.?\d*)[\s\S]{0,50}?`([\d,]+\.?\d*)/i;
    const summaryMatch = pdfText.match(summaryPattern);
    if (
      summaryMatch &&
      summaryMatch[1] &&
      summaryMatch[2] &&
      summaryMatch[3] &&
      summaryMatch[4]
    ) {
      metadata.previousBalance = parseFloat(summaryMatch[1].replace(/,/g, ''));
      metadata.purchasesCharges = parseFloat(summaryMatch[2].replace(/,/g, ''));
      metadata.cashAdvances = parseFloat(summaryMatch[3].replace(/,/g, ''));
      metadata.paymentsCredits = parseFloat(summaryMatch[4].replace(/,/g, ''));
    }

    // Interest charges (if any)
    // Format: Interest charges`amount
    const interestPattern = /Interest.*?`([\d,]+\.?\d*)/i;
    const interestMatch = pdfText.match(interestPattern);
    if (interestMatch && interestMatch[1]) {
      metadata.interestCharges = parseFloat(interestMatch[1].replace(/,/g, ''));
    }

    return metadata;
  }
}
