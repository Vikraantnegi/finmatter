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

export class HDFCParser extends BaseParser {
  protected bankName = 'hdfc';

  async parse(pdfBuffer: Buffer, password?: string): Promise<ParseResult> {
    const text = await this.extractText(pdfBuffer, password);
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const transactions: ParsedTransaction[] = [];
    const metadata: StatementMetadata = {};
    const errors: string[] = [];

    // Extract metadata (card number, statement period, etc.)
    this.extractMetadata(lines, metadata);

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
    for (let i = transactionStartIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // Skip header rows and empty lines
      if (
        line.toLowerCase().includes('date') ||
        line.toLowerCase().includes('description') ||
        line.toLowerCase().includes('amount') ||
        line.length < 10
      ) {
        continue;
      }

      // Check if we've reached the end of transactions (summary section)
      if (
        line.toLowerCase().includes('total') ||
        line.toLowerCase().includes('summary') ||
        line.toLowerCase().includes('payment due')
      ) {
        break;
      }

      const transaction = this.parseTransactionLine(line);
      if (transaction) {
        transactions.push(transaction);
      }
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

  private extractMetadata(lines: string[], metadata: StatementMetadata): void {
    for (let i = 0; i < Math.min(50, lines.length); i++) {
      const line = lines[i];
      if (!line) continue;

      // Extract card number (last 4 digits)
      const cardMatch = line.match(/Card\s*No[.:\s]*\*{4,}\s*(\d{4})/i);
      if (cardMatch && cardMatch[1] && !metadata.cardLastFour) {
        metadata.cardLastFour = cardMatch[1];
      }

      // Extract statement period
      const periodMatch = line.match(
        /Statement\s+Period[:\s]+(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})\s+to\s+(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/i,
      );
      if (
        periodMatch &&
        periodMatch[1] &&
        periodMatch[2] &&
        !metadata.statementPeriodStart
      ) {
        const startDate = this.parseDate(periodMatch[1]);
        const endDate = this.parseDate(periodMatch[2]);
        if (startDate) {
          metadata.statementPeriodStart = startDate;
        }
        if (endDate) {
          metadata.statementPeriodEnd = endDate;
        }
      }

      // Extract billing cycle
      const billingMatch = line.match(
        /Billing\s+Cycle[:\s]+(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})\s+to\s+(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/i,
      );
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
      }

      // Extract payment due date
      const dueMatch = line.match(
        /Payment\s+Due\s+Date[:\s]+(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/i,
      );
      if (dueMatch && dueMatch[1] && !metadata.paymentDueDate) {
        const dueDate = this.parseDate(dueMatch[1]);
        if (dueDate) {
          metadata.paymentDueDate = dueDate;
        }
      }

      // Extract total amount
      const totalMatch = line.match(
        /Total\s+Amount[:\s]+[₹]?\s*([\d,]+\.?\d*)/i,
      );
      if (totalMatch && totalMatch[1] && !metadata.totalAmount) {
        const amount = this.parseAmount(totalMatch[1]);
        if (amount) {
          metadata.totalAmount = amount;
        }
      }
    }
  }

  private findTransactionStartIndex(lines: string[]): number {
    // Look for transaction table header
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const lowerLine = line.toLowerCase();
      if (
        (lowerLine.includes('date') &&
          lowerLine.includes('description') &&
          lowerLine.includes('amount')) ||
        (lowerLine.includes('transaction') && lowerLine.includes('date')) ||
        line.match(/^\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}/) // Starts with date pattern
      ) {
        return i;
      }
    }
    return -1;
  }

  private parseTransactionLine(line: string): ParsedTransaction | null {
    // HDFC transaction line format varies, but typically:
    // DD/MM/YYYY Description Amount
    // or
    // DD/MM/YYYY Description Merchant Category Amount

    // Try to match date at the start
    const dateMatch = line.match(/^(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/);
    if (!dateMatch || !dateMatch[1]) {
      return null;
    }

    const transactionDate = this.parseDate(dateMatch[1]);
    if (!transactionDate) {
      return null;
    }

    // Extract amount (usually at the end, may have ₹ symbol)
    const amountMatch = line.match(/[₹]?\s*([\d,]+\.?\d*)\s*$/);
    if (!amountMatch || !amountMatch[1]) {
      return null;
    }

    const amount = this.parseAmount(amountMatch[1]);
    if (amount === null) {
      return null;
    }

    // Extract description (everything between date and amount)
    const dateEnd = dateMatch[0]?.length ?? 0;
    const amountStart = amountMatch[0]
      ? line.lastIndexOf(amountMatch[0])
      : line.length;
    let description = line.substring(dateEnd, amountStart).trim();

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

    const transaction: ParsedTransaction = {
      transactionDate,
      merchantName,
      amount: Math.abs(amount), // Store as positive, use type field
      type: this.determineTransactionType(amount, description),
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
