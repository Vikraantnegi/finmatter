/**
 * Base Parser class for credit card statements
 * All bank-specific parsers extend this class
 */

// Simple date parsing without external dependencies
import type {
  ParsedTransaction,
  ParseResult,
  StatementMetadata,
  ParserConfig,
} from './types';

export abstract class BaseParser {
  protected config: ParserConfig;
  protected errors: string[] = [];
  protected warnings: string[] = [];

  constructor() {
    this.config = this.getConfig();
  }

  abstract parse(pdfText: string): Promise<ParseResult>;
  protected abstract getConfig(): ParserConfig;

  // Parse date from text using configured date formats
  // Returns date at noon UTC to avoid timezone shifting issues
  protected parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    const trimmed = dateStr.trim();

    // Try to parse date components directly to avoid timezone issues
    // Format: "17 Sep, 2025" or "September 18, 2025" or "17/09/2025"
    const patterns = [
      // MMMM dd, yyyy (September 18, 2025) - month first
      /(\w{3,})\s+(\d{1,2}),?\s+(\d{4})/i,
      // dd MMMM, yyyy (18 Sep, 2025) - day first
      /(\d{1,2})\s+(\w{3,}),?\s+(\d{4})/i,
      // dd/MM/yyyy (17/09/2025)
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      // dd-MM-yyyy (17-09-2025)
      /(\d{1,2})-(\d{1,2})-(\d{4})/,
    ];

    const monthMap: Record<string, number> = {
      jan: 0,
      january: 0,
      feb: 1,
      february: 1,
      mar: 2,
      march: 2,
      apr: 3,
      april: 3,
      may: 4,
      jun: 5,
      june: 5,
      jul: 6,
      july: 6,
      aug: 7,
      august: 7,
      sep: 8,
      sept: 8,
      september: 8,
      oct: 9,
      october: 9,
      nov: 10,
      november: 10,
      dec: 11,
      december: 11,
    };

    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match && match[1] && match[2] && match[3]) {
        let day: number;
        let month: number;
        let year: number;

        // Check if first group is month name (MMMM dd, yyyy format)
        if (isNaN(parseInt(match[1]))) {
          // Month first: September 18, 2025
          const monthLower = match[1].toLowerCase();
          const monthNum = monthMap[monthLower];
          if (monthNum === undefined) continue;
          month = monthNum;
          day = parseInt(match[2]);
          year = parseInt(match[3]);
        } else {
          // Day first: 18 Sep, 2025 or 18/09/2025
          day = parseInt(match[1]);
          year = parseInt(match[3]);

          if (isNaN(parseInt(match[2]))) {
            // Month name
            const monthLower = match[2].toLowerCase();
            const monthNum = monthMap[monthLower];
            if (monthNum === undefined) continue;
            month = monthNum;
          } else {
            // Month number (1-12)
            month = parseInt(match[2]) - 1; // Convert to 0-indexed
          }
        }

        // Create date in Indian timezone (IST = UTC+5:30)
        // Use local timezone for Indian dates
        const date = new Date(year, month, day, 12, 0, 0, 0);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    // Fallback to simple ISO date parsing
    try {
      const isoDate = new Date(trimmed);
      if (!isNaN(isoDate.getTime())) {
        isoDate.setUTCHours(12, 0, 0, 0);
        return isoDate;
      }
    } catch {
      // Ignore
    }

    this.warnings.push(`Could not parse date: ${dateStr}`);
    return null;
  }

  // Parse amount from text (handles Indian currency format)
  protected parseAmount(amountStr: string): number {
    if (!amountStr) return 0;

    let cleaned = amountStr
      .replace(/[₹$,\s]/g, '')
      .replace(/\s+/g, '')
      .trim();

    const isCr = /cr\.?$/i.test(cleaned);

    cleaned = cleaned.replace(/(?:cr|dr)\.?$/gi, '');

    const amount = parseFloat(cleaned);

    if (isNaN(amount)) {
      this.warnings.push(`Could not parse amount: ${amountStr}`);
      return 0;
    }

    return isCr ? -amount : amount;
  }

  // Clean merchant name
  protected cleanMerchantName(name: string): string {
    if (!name) return 'Unknown Merchant';

    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-&.']/gi, '')
      .slice(0, 100); // Limit length
  }

  // Determine transaction type based on patterns
  protected determineTransactionType(text: string): ParsedTransaction['type'] {
    const lowerText = text.toLowerCase();

    if (
      lowerText.includes('refund') ||
      lowerText.includes('reversal') ||
      lowerText.includes('credit')
    ) {
      return 'refund';
    }

    if (
      lowerText.includes('fee') ||
      lowerText.includes('charge') ||
      lowerText.includes('annual fee')
    ) {
      return 'fee';
    }

    if (
      lowerText.includes('interest') ||
      lowerText.includes('finance charge')
    ) {
      return 'interest';
    }

    return 'debit';
  }

  // Extract card last 4 digits
  protected extractCardNumber(text: string): string | undefined {
    const pattern =
      /(?:xxxx|xxxx[\s-]xxxx[\s-]xxxx[\s-]|\.{4}\s?\.{4}\s?\.{4}\s?)(\d{4})/i;
    const match = text.match(pattern);
    return match ? match[1] : undefined;
  }

  // Split text into lines and clean
  protected splitLines(text: string): string[] {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  // Create a successful parse result
  protected createResult(
    transactions: ParsedTransaction[],
    metadata: StatementMetadata,
  ): ParseResult {
    return {
      transactions,
      metadata,
      success: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  // Create a failed parse result
  protected createFailedResult(error: string): ParseResult {
    this.errors.push(error);
    return {
      transactions: [],
      metadata: {},
      success: false,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  // Validate that minimum required data is present
  protected validate(transactions: ParsedTransaction[]): boolean {
    if (transactions.length === 0) {
      this.errors.push('No transactions found in statement');
      return false;
    }

    const transactionsWithDates = transactions.filter(t => t.date).length;
    const datePercentage = transactionsWithDates / transactions.length;

    if (datePercentage < 0.8) {
      this.errors.push(
        `Only ${Math.round(datePercentage * 100)}% of transactions have valid dates (minimum 80% required)`,
      );
      return false;
    }

    return true;
  }

  /**
   * Extract metadata from PDF text (common across banks)
   * Can be overridden by specific parsers if needed
   */
  protected extractMetadata(pdfText: string): StatementMetadata {
    const metadata: StatementMetadata = {};

    // Card identification
    const cardNumber = this.extractCardNumber(pdfText);
    if (cardNumber) {
      metadata.cardLastFourDigits = cardNumber;
    }

    // Credit limit
    const creditLimitPatterns = [
      /credit\s+limit[:\s]+(?:Rs\.?|INR|₹)?\s*([\d,]+)/i,
      /limit[:\s]+(?:Rs\.?|INR|₹)?\s*([\d,]+)/i,
    ];

    for (const pattern of creditLimitPatterns) {
      const match = pdfText.match(pattern);
      if (match && match[1]) {
        metadata.creditLimit = parseFloat(match[1].replace(/,/g, ''));
        break;
      }
    }

    // Due date
    const dueDatePatterns = [
      /payment\s*due\s*date[:\s\n-]*?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
      /due\s*date[:\s\n-]*?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
      /pay\s*by[:\s\n-]*?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
    ];

    for (const pattern of dueDatePatterns) {
      const match = pdfText.match(pattern);
      if (match && match[1]) {
        const dueDate = this.parseDate(match[1]);
        if (dueDate) {
          metadata.dueDate = dueDate;
          break;
        }
      }
    }

    // Minimum payment
    const minPaymentPatterns = [
      /minimum\s+(?:amount\s+)?due[:\s]+(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
      /minimum\s+payment[:\s]+(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
    ];

    for (const pattern of minPaymentPatterns) {
      const match = pdfText.match(pattern);
      if (match && match[1]) {
        metadata.minimumPayment = parseFloat(match[1].replace(/,/g, ''));
        break;
      }
    }

    // Total amount due
    const totalDuePatterns = [
      /total\s+(?:amount\s+)?due[:\s]+(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
      /amount\s+due[:\s]+(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
    ];

    for (const pattern of totalDuePatterns) {
      const match = pdfText.match(pattern);
      if (match && match[1]) {
        metadata.totalDue = parseFloat(match[1].replace(/,/g, ''));
        break;
      }
    }

    // Available credit
    const availableCreditPatterns = [
      /available\s+credit[:\s]+(?:Rs\.?|INR|₹)?\s*([\d,]+)/i,
      /credit\s+available[:\s]+(?:Rs\.?|INR|₹)?\s*([\d,]+)/i,
    ];

    for (const pattern of availableCreditPatterns) {
      const match = pdfText.match(pattern);
      if (match && match[1]) {
        metadata.availableCredit = parseFloat(match[1].replace(/,/g, ''));
        break;
      }
    }

    // Cash advance limit
    const cashAdvancePatterns = [
      /cash\s+advance\s+limit[:\s]+(?:Rs\.?|INR|₹)?\s*([\d,]+)/i,
      /advance\s+limit[:\s]+(?:Rs\.?|INR|₹)?\s*([\d,]+)/i,
    ];

    for (const pattern of cashAdvancePatterns) {
      const match = pdfText.match(pattern);
      if (match && match[1]) {
        metadata.cashAdvanceLimit = parseFloat(match[1].replace(/,/g, ''));
        break;
      }
    }

    // Late payment fee
    const lateFeePatterns = [
      /late\s+payment\s+(?:fee|charge)[:\s]+(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
      /overdue\s+charges[:\s]+(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
    ];

    for (const pattern of lateFeePatterns) {
      const match = pdfText.match(pattern);
      if (match && match[1]) {
        metadata.latePaymentFee = parseFloat(match[1].replace(/,/g, ''));
        break;
      }
    }

    // Interest charges
    const interestPatterns = [
      /interest\s+charged?[:\s]+(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
      /finance\s+charges[:\s]+(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
    ];

    for (const pattern of interestPatterns) {
      const match = pdfText.match(pattern);
      if (match && match[1]) {
        metadata.interestCharges = parseFloat(match[1].replace(/,/g, ''));
        break;
      }
    }

    return metadata;
  }

  /**
   * Extract reward points information
   * Should be overridden by bank-specific parsers
   */
  protected extractRewardPoints(pdfText: string): any {
    const rewardPoints: any = {
      opening: 0,
      earned: 0,
      redeemed: 0,
      expired: 0,
      closing: 0,
    };

    // Generic patterns - banks should override with specific logic
    const openingPatterns = [
      /opening\s+(?:balance|points)[:\s]+(\d+)/i,
      /previous\s+balance[:\s]+(\d+)/i,
    ];

    const earnedPatterns = [
      /(?:points\s+)?earned[:\s]+(\d+)/i,
      /accrued[:\s]+(\d+)/i,
    ];

    const closingPatterns = [
      /closing\s+(?:balance|points)[:\s]+(\d+)/i,
      /current\s+balance[:\s]+(\d+)/i,
      /available\s+points[:\s]+(\d+)/i,
    ];

    for (const pattern of openingPatterns) {
      const match = pdfText.match(pattern);
      if (match && match[1]) {
        rewardPoints.opening = parseInt(match[1].replace(/,/g, ''));
        break;
      }
    }

    for (const pattern of earnedPatterns) {
      const match = pdfText.match(pattern);
      if (match && match[1]) {
        rewardPoints.earned = parseInt(match[1].replace(/,/g, ''));
        break;
      }
    }

    for (const pattern of closingPatterns) {
      const match = pdfText.match(pattern);
      if (match && match[1]) {
        rewardPoints.closing = parseInt(match[1].replace(/,/g, ''));
        break;
      }
    }

    return rewardPoints;
  }
}
