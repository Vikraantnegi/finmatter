/**
 * HDFC Bank Statement Parser
 * Updated for Millennia Credit Card format (2025)
 */

import { BaseParser } from './BaseParser';
import type {
  ParseResult,
  ParsedTransaction,
  ParserConfig,
  StatementMetadata,
} from './types';

export class HDFCParser extends BaseParser {
  constructor() {
    super();
  }

  protected getConfig(): ParserConfig {
    return {
      bankName: 'hdfc',
      dateFormats: ['dd/MM/yyyy', 'dd MMM, yyyy'],
      transactionPatterns: [
        // Format: 31/08/2025| 18:41WWW SWIGGY INBANGALORE C 369.00
        /(\d{2}\/\d{2}\/\d{4})\|\s*(\d{2}:\d{2})(.+?)\s+([+]?\s*C\s*[\d,]+\.?\d*)/gi,
      ],
      amountPatterns: [/C\s*[\d,]+\.?\d*/g],
      merchantPatterns: [/[A-Z][A-Za-z0-9\s\-&*.']+/g],
    };
  }

  async parse(pdfText: string): Promise<ParseResult> {
    try {
      const transactions: ParsedTransaction[] = [];
      const metadata = this.extractHDFCMetadata(pdfText);

      // Extract transactions: DD/MM/YYYY| HH:MM + Description + Amount
      const transactionPattern =
        /(\d{2}\/\d{2}\/\d{4})\s*\|\s*(\d{2}:\d{2})(.+?)\s+([+]?\s*C\s*[\d,]+\.?\d*)/g;

      let match;
      while ((match = transactionPattern.exec(pdfText)) !== null) {
        if (!match[1] || !match[2] || !match[3] || !match[4]) continue;

        const dateStr = match[1]; // DD/MM/YYYY
        const description = match[3].trim(); // Merchant + location
        const amountStr = match[4]; // + C 11,333.00 or C 369.00

        const date = this.parseDate(dateStr);
        if (!date) continue;

        // Parse amount
        const isCredit = amountStr.includes('+');
        const amountNum = parseFloat(amountStr.replace(/[+C\s,]/g, ''));
        if (isNaN(amountNum)) continue;

        // Extract reference number if present
        const refMatch = description.match(/\(Ref#\s*([^)]+)\)/g);
        const referenceNumber =
          refMatch && refMatch[1] ? refMatch[1].trim() : undefined;

        // Extract location (usually at the end before ref or amount)
        let location: 'domestic' | 'international' | undefined;
        let merchantName = description;

        // Check if it's international (has USD or other currency indicators)
        if (
          description.includes('USD') ||
          description.includes('NEW YORK') ||
          description.includes('CURSOR')
        ) {
          location = 'international';
        } else if (
          description.includes('BANGALORE') ||
          description.includes('Bangalore') ||
          description.includes('BENGALURU') ||
          description.includes('Bengaluru')
        ) {
          location = 'domestic';
        }

        // Clean merchant name - remove location and ref
        merchantName = merchantName.replace(/\(Ref#[^)]+\)/g, '').trim();
        // Remove common location suffixes
        merchantName = merchantName
          .replace(
            /\s*(BANGALORE|Bangalore|BENGALURU|Bengaluru|NEW YORK)\s*$/i,
            '',
          )
          .trim();

        // Determine transaction type
        let type: 'debit' | 'credit' | 'refund' | 'fee' | 'interest' = 'debit';
        const descLower = description.toLowerCase();

        if (
          isCredit ||
          descLower.includes('payment') ||
          descLower.includes('credit')
        ) {
          type = 'credit';
        } else if (
          descLower.includes('refund') ||
          descLower.includes('reversal')
        ) {
          type = 'refund';
        } else if (
          descLower.includes('igst') ||
          descLower.includes('cgst') ||
          descLower.includes('sgst') ||
          descLower.includes('gst')
        ) {
          type = 'fee';
        } else if (
          descLower.includes('interest') ||
          descLower.includes('finance charge')
        ) {
          type = 'interest';
        } else if (descLower.includes('emi')) {
          type = 'fee';
        }

        // Check for EMI
        const isEMI = descLower.includes('emi');

        // Extract GST amount if it's a GST transaction
        let gstAmount: number | undefined;
        if (
          type === 'fee' &&
          (descLower.includes('gst') || descLower.includes('igst'))
        ) {
          gstAmount = amountNum;
        }

        const transaction: ParsedTransaction = {
          date,
          merchantName,
          amount: isCredit ? -amountNum : amountNum, // Credits are negative
          rawText: match[0],
          type,
        };

        if (location) transaction.location = location;
        if (gstAmount) transaction.gstAmount = gstAmount;
        if (referenceNumber) transaction.referenceNumber = referenceNumber;
        if (isEMI) transaction.isEMI = isEMI;

        transactions.push(transaction);
      }

      if (transactions.length === 0) {
        return this.createFailedResult('No transactions found in statement');
      }

      // Calculate transaction-based metrics
      const domesticTransactions = transactions.filter(
        t => t.location === 'domestic',
      );
      const internationalTransactions = transactions.filter(
        t => t.location === 'international',
      );

      const domesticSpends = domesticTransactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);

      const internationalSpends = internationalTransactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);

      // Update spendsOverview with calculated values
      if (metadata.spendsOverview) {
        metadata.spendsOverview.domesticSpends =
          Math.round(domesticSpends * 100) / 100;
        metadata.spendsOverview.internationalSpends =
          Math.round(internationalSpends * 100) / 100;
        metadata.spendsOverview.numberOfTransactions = transactions.length;
      }

      return this.createResult(transactions, metadata);
    } catch (error) {
      return this.createFailedResult(
        `Error parsing HDFC statement: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Extract HDFC-specific metadata from statement
   */
  private extractHDFCMetadata(pdfText: string): StatementMetadata {
    const metadata: StatementMetadata = {};

    // Card number: 518159XXXXXX5761 (extract from multi-line format)
    const cardPattern = /Credit\s+Card\s+No\.\s*[^\d]*([\d]+X+[\d]+)/i;
    const cardMatch = pdfText.match(cardPattern);
    if (cardMatch && cardMatch[1]) {
      metadata.cardLastFourDigits = cardMatch[1].slice(-4);
    }

    // Statement Date: 17 Sep, 2025
    // Format in text: "Statement Date\n518159XXXXXX5761\n0001013840009165764\n17 Sep, 2025"
    const stmtDatePattern =
      /Statement\s+Date[\s\S]{0,100}?(\d{1,2}\s+\w{3},\s+\d{4})/i;
    const stmtMatch = pdfText.match(stmtDatePattern);
    if (stmtMatch && stmtMatch[1]) {
      const date = this.parseDate(stmtMatch[1]);
      if (date) metadata.statementDate = date;
    }

    // Billing Period: 18 Aug, 2025 - 17 Sep, 2025
    // Format in text: "Billing Period\n518159XXXXXX5761\n0001013840009165764\n17 Sep, 2025\n18 Aug, 2025 - 17 Sep, 2025"
    // Need to look further down to find the actual period
    const periodPattern =
      /Billing\s+Period[\s\S]{0,150}?(\d{1,2}\s+\w{3},\s+\d{4})\s*-\s*(\d{1,2}\s+\w{3},\s+\d{4})/i;
    const periodMatch = pdfText.match(periodPattern);
    if (periodMatch && periodMatch[1] && periodMatch[2]) {
      const start = this.parseDate(periodMatch[1]);
      const end = this.parseDate(periodMatch[2]);
      if (start) metadata.statementPeriodStart = start;
      if (end) metadata.statementPeriodEnd = end;
    }

    // Due Date: 07 Oct, 2025
    // Updated pattern to match inline format: "DUE DATE 07 Oct, 2025"
    const duePattern = /DUE\s+DATE\s+(\d{1,2}\s+\w+,\s+\d{4})/i;
    const dueMatch = pdfText.match(duePattern);
    if (dueMatch && dueMatch[1]) {
      const date = this.parseDate(dueMatch[1]);
      if (date) metadata.dueDate = date;
    }

    // Total Amount Due: C 7,658.00
    // Updated pattern to match inline format: "TOTAL AMOUNT DUE C 7,658.00"
    const totalDuePattern = /TOTAL\s+AMOUNT\s+DUE\s+C\s*([\d,]+\.?\d*)/i;
    const totalMatch = pdfText.match(totalDuePattern);
    if (totalMatch && totalMatch[1]) {
      metadata.totalDue = parseFloat(totalMatch[1].replace(/,/g, ''));
    }

    // Minimum Due: C 2,750.00
    // Updated pattern to match inline format: "MINIMUM DUE C 2,750.00"
    const minPattern = /MINIMUM\s+DUE\s+C\s*([\d,]+\.?\d*)/i;
    const minMatch = pdfText.match(minPattern);
    if (minMatch && minMatch[1]) {
      metadata.minimumPayment = parseFloat(minMatch[1].replace(/,/g, ''));
    }

    // Credit limits are on consecutive lines:
    // TOTAL CREDIT LIMIT (Including Cash)
    // AVAILABLE CREDIT LIMITAVAILABLE CASH LIMIT
    // C97,000C79,460C38,800
    const limitsPattern =
      /TOTAL\s+CREDIT\s+LIMIT[\s\S]*?AVAILABLE\s+CREDIT\s+LIMIT\s*AVAILABLE\s+CASH\s+LIMIT[\s\S]*?C\s*([\d,]+)\s*C\s*([\d,]+)\s*C\s*([\d,]+)/i;
    const limitsMatch = pdfText.match(limitsPattern);
    if (limitsMatch && limitsMatch[1] && limitsMatch[2] && limitsMatch[3]) {
      metadata.creditLimit = parseFloat(limitsMatch[1].replace(/,/g, '')); // Total: 97,000
      metadata.availableCredit = parseFloat(limitsMatch[2].replace(/,/g, '')); // Available: 79,460
      metadata.cashAdvanceLimit = parseFloat(limitsMatch[3].replace(/,/g, '')); // Cash: 38,800
    }

    // Reward Points: 7,934 (Opening Balance: 7,886, Earned: 48)
    const rewardPattern = /Reward\s+Points\s*\n\s*([\d,]+)/i;
    const rewardMatch = pdfText.match(rewardPattern);

    // Fixed pattern: The numbers are concatenated without spaces: "7,8864800"
    // Need to parse as: "7,886" "48" "0" "0"
    const openingPattern =
      /Opening\s*Balance\s*Earned\s*Disbursed\s*Adjusted[/\\]Lapsed\s*\n\s*([\d,]+)/i;
    const openingMatch = pdfText.match(openingPattern);

    let opening = 0,
      earned = 0,
      redeemed = 0,
      expired = 0;

    // Parse the concatenated string: "7,8864800" -> "7,886" "48" "0" "0"
    if (openingMatch && openingMatch[1]) {
      const originalStr = openingMatch[1]; // "7,8864800"

      // Pattern: (number with optional comma)(exactly 2 digits)(exactly 1 digit)(exactly 1 digit)
      // Example: "7,886" + "48" + "0" + "0" = "7,8864800"
      const concatPattern = /([\d,]+)([\d]{2})([\d])([\d])$/;
      const concatMatch = originalStr.match(concatPattern);

      if (
        concatMatch &&
        concatMatch[1] &&
        concatMatch[2] &&
        concatMatch[3] &&
        concatMatch[4]
      ) {
        opening = parseInt(concatMatch[1].replace(/,/g, ''));
        earned = parseInt(concatMatch[2]);
        redeemed = parseInt(concatMatch[3]);
        expired = parseInt(concatMatch[4]);
      }
    }

    const closing =
      rewardMatch && rewardMatch[1]
        ? parseInt(rewardMatch[1].replace(/,/g, ''))
        : 0;

    if (rewardMatch || openingMatch) {
      metadata.rewardPoints = {
        opening,
        earned,
        redeemed,
        expired,
        closing,
      };

      // Extract earned by category (Rewards Program Points Summary)
      const earnedByCategoryPattern =
        /Rewards\s+Program\s+Points\s+Summary[\s\S]*?Total\s*(\d+)\s*pts/i;
      const categoryMatch = pdfText.match(earnedByCategoryPattern);
      if (categoryMatch && categoryMatch[1]) {
        // Extract individual categories if available
        const categoriesPattern =
          /(\d+)%\s+CashBack\s+on\s+other\s+Spends\s*(\d+)\s*pts|EARNED\s+(\d+)%\s+CASHBACK[_\s]+SELECT\s+MERCHANTS\s*(\d+)\s*pts|FCYConversion\s*(\d+)\s*pts/gi;
        const earnedByCategory: Record<string, number> = {};

        let catMatch;
        while ((catMatch = categoriesPattern.exec(pdfText)) !== null) {
          if (catMatch[1] && catMatch[2]) {
            earnedByCategory['other_spends'] = parseInt(catMatch[2]);
          } else if (catMatch[3] && catMatch[4]) {
            earnedByCategory['select_merchants'] = parseInt(catMatch[4]);
          } else if (catMatch[5]) {
            earnedByCategory['fcy_conversion'] = parseInt(catMatch[5]);
          }
        }

        if (Object.keys(earnedByCategory).length > 0) {
          metadata.rewardPoints.earnedByCategory = earnedByCategory;
        }
      }
    }

    // EMI Summary - More comprehensive parsing
    const emiPattern =
      /Smart\s+EMI\s+Loan\s+Summary[\s\S]*?LOAN\s+NUMBER\s*BOOKED\s+DATE\s*AMOUNT\s*LOAN\s+TENURE[\s\S]*?RATE\s+OF\s*\n\s*INTEREST%[\s\S]*?BALANCE\s+PRINCIPAL[\s\S]*?OUTSTANDING[\s\S]*?BALANCE\s+INTEREST[\s\S]*?PAYABLE[\s\S]*?BALANCE\s+TENURE[\s\S]*?(\d+)\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*C\s*([\d,]+\.?\d*)\s*(\d+)\s+Months\s*(\d+\.?\d*)\s*%\s*C\s*([\d,]+\.?\d*)\s*C\s*([\d,]+\.?\d*)\s*(\d+)\s+Months/i;
    const emiMatch = pdfText.match(emiPattern);
    if (emiMatch && emiMatch[1]) {
      const loanNumber = emiMatch[1];
      const interestRate = parseFloat(emiMatch[5] || '0');
      const principalOutstanding = parseFloat(
        (emiMatch[6] || '0').replace(/,/g, ''),
      );
      const interestPayable = parseFloat(
        (emiMatch[7] || '0').replace(/,/g, ''),
      );
      const remainingTenure = parseInt(emiMatch[8] || '0');

      // Calculate EMI amount (approximate)
      const emiAmount =
        remainingTenure > 0
          ? (principalOutstanding + interestPayable) / remainingTenure
          : 0;

      metadata.emiSummary = {
        emiCount: 1,
        totalEMIAmount: principalOutstanding + interestPayable,
        loans: [
          {
            loanNumber,
            principalAmount: principalOutstanding,
            emiAmount: Math.round(emiAmount * 100) / 100,
            remainingTenure,
            interestRate,
          },
        ],
      };
    }

    // Purchase Indicator / Insights (Spends Overview)
    const spendsPattern =
      /Purchase\s+Indicator[^\n]*\n[\s\S]*?l\s+DEPTSTORE\s*\n\s*(\d+)%[\s\S]*?l\s+ELECTRONICS\s*\n\s*(\d+)%[\s\S]*?l\s+GROCERIES\s*\n\s*(\d+)%/i;
    const spendsMatch = pdfText.match(spendsPattern);
    if (spendsMatch && spendsMatch[1] && spendsMatch[2] && spendsMatch[3]) {
      // Get the correct total from PURCHASES/DEBIT section (current billing cycle)
      // Pattern: C11,332.97C11,333.00C7,658.08C0.00
      // Order: PREVIOUS DUES | PAYMENTS/CREDITS | PURCHASES/DEBIT | FINANCE CHARGES
      const purchasesPattern =
        /PREVIOUS\s+STATEMENT\s+DUES[\s\S]*?PAYMENTS[/\s]+CREDITS[\s\S]*?RECEIVED[\s\S]*?PURCHASES[/\s]+DEBIT[\s\S]*?\(Current\s+Billing\s+Cycle\)[\s\S]*?FINANCE\s+CHARGES[\s\S]*?C\s*([\d,]+\.?\d*)\s*C\s*([\d,]+\.?\d*)\s*C\s*([\d,]+\.?\d*)\s*C\s*([\d,]+\.?\d*)/i;
      const purchasesMatch = pdfText.match(purchasesPattern);
      let totalSpends = 0;

      if (purchasesMatch && purchasesMatch[3]) {
        // Third value is PURCHASES/DEBIT
        totalSpends = parseFloat(purchasesMatch[3].replace(/,/g, ''));
      }

      if (totalSpends > 0) {
        const deptStorePercent = parseInt(spendsMatch[1]);
        const electronicsPercent = parseInt(spendsMatch[2]);
        const groceriesPercent = parseInt(spendsMatch[3]);

        const categoryWiseSpends: Record<string, any> = {
          DEPTSTORE: {
            amount:
              Math.round(((totalSpends * deptStorePercent) / 100) * 100) / 100,
            percentage: deptStorePercent,
          },
          ELECTRONICS: {
            amount:
              Math.round(((totalSpends * electronicsPercent) / 100) * 100) /
              100,
            percentage: electronicsPercent,
          },
          GROCERIES: {
            amount:
              Math.round(((totalSpends * groceriesPercent) / 100) * 100) / 100,
            percentage: groceriesPercent,
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

    return metadata;
  }
}
