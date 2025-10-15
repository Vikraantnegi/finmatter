/**
 * Base Parser class for credit card statements
 * All bank-specific parsers extend this class
 */

import { parse as parseDate, isValid } from 'date-fns';
import type {
  ParsedTransaction,
  ParseResult,
  StatementMetadata,
  ParserConfig,
  BankName,
} from './types';

export abstract class BaseParser {
  protected config: ParserConfig;
  protected errors: string[] = [];
  protected warnings: string[] = [];

  constructor(bankName: BankName) {
    this.config = this.getConfig(bankName);
  }

  abstract parse(pdfText: string): Promise<ParseResult>;
  protected abstract getConfig(bankName: BankName): ParserConfig;

  // Parse date from text using configured date formats
  protected parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    for (const format of this.config.dateFormats) {
      try {
        const parsed = parseDate(dateStr.trim(), format, new Date());
        if (isValid(parsed)) {
          return parsed;
        }
      } catch {
        continue;
      }
    }

    const commonFormats = [
      'dd/MM/yyyy',
      'dd-MM-yyyy',
      'dd MMM yyyy',
      'dd-MMM-yyyy',
      'dd/MM/yy',
      'dd-MM-yy',
    ];

    for (const format of commonFormats) {
      try {
        const parsed = parseDate(dateStr.trim(), format, new Date());
        if (isValid(parsed)) {
          this.warnings.push(
            `Date parsed using fallback format: ${format} for ${dateStr}`,
          );
          return parsed;
        }
      } catch {
        continue;
      }
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
}
