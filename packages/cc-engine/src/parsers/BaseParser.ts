/**
 * Base Parser Class
 * Provides common functionality for all bank statement parsers
 */

import pdfParse from 'pdf-parse';
import { parse, isValid } from 'date-fns';
import type { ParseResult } from '../types';

export abstract class BaseParser {
  protected abstract bankName: string;

  /**
   * Extract text from PDF buffer
   * Handles both password-protected and unprotected PDFs
   */
  protected async extractText(
    pdfBuffer: Buffer,
    password?: string,
  ): Promise<string> {
    try {
      // Try pdf-parse (note: password-protected PDFs are not currently supported)
      const data = await pdfParse(pdfBuffer);
      return data.text;
    } catch (parseError) {
      // If parsing fails, provide helpful error message
      const errorMessage =
        parseError instanceof Error ? parseError.message : 'Unknown error';
      if (password) {
        throw new Error(
          `Failed to extract text from PDF. Note: Password-protected PDFs are not currently supported. Error: ${errorMessage}`,
        );
      }
      throw new Error(
        `PDF parsing failed. The PDF may be password-protected or corrupted. Error: ${errorMessage}`,
      );
    }
  }

  /**
   * Parse date string to Date object
   * Handles common Indian date formats: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
   */
  protected parseDate(dateStr: string): Date | null {
    if (!dateStr || typeof dateStr !== 'string') {
      return null;
    }

    const cleaned = dateStr.trim();
    if (!cleaned) return null;

    // Common date formats in Indian bank statements
    const formats = [
      'dd/MM/yyyy',
      'dd-MM-yyyy',
      'dd.MM.yyyy',
      'dd/MM/yy',
      'dd-MM-yy',
      'dd.MM.yy',
      'yyyy-MM-dd', // ISO format
    ];

    for (const format of formats) {
      try {
        const parsed = parse(cleaned, format, new Date());
        if (isValid(parsed)) {
          return parsed;
        }
      } catch {
        // Try next format
      }
    }

    // Try native Date parsing as fallback
    const nativeDate = new Date(cleaned);
    if (isValid(nativeDate)) {
      return nativeDate;
    }

    return null;
  }

  /**
   * Parse amount string to number
   * Handles Indian number format with commas: "1,23,456.78"
   */
  protected parseAmount(amountStr: string): number | null {
    if (!amountStr || typeof amountStr !== 'string') {
      return null;
    }

    // Remove currency symbols, spaces, and commas
    const cleaned = amountStr
      .replace(/[₹,\s]/g, '')
      .replace(/[^\d.-]/g, '')
      .trim();

    const amount = parseFloat(cleaned);
    return isNaN(amount) ? null : amount;
  }

  /**
   * Normalize merchant name
   * Removes extra whitespace, converts to uppercase for consistency
   */
  protected normalizeMerchantName(name: string): string {
    return name.trim().replace(/\s+/g, ' ').toUpperCase();
  }

  /**
   * Determine transaction type from amount and description
   * Override in subclasses if needed
   */
  protected determineTransactionType(
    amount: number,
    description: string,
  ): 'debit' | 'credit' | 'refund' {
    const desc = description.toLowerCase();

    // Common refund indicators
    if (
      desc.includes('refund') ||
      desc.includes('reversal') ||
      desc.includes('credit') ||
      desc.includes('cashback')
    ) {
      return 'refund';
    }

    // If amount is negative, it's typically a credit/refund
    if (amount < 0) {
      return 'refund';
    }

    // Default to debit (purchase)
    return 'debit';
  }

  /**
   * Abstract method: Parse the statement
   * Each bank parser must implement this
   * @param pdfBuffer - Buffer containing the PDF file
   * @param password - Optional password for password-protected PDFs
   */
  abstract parse(pdfBuffer: Buffer, password?: string): Promise<ParseResult>;

  /**
   * Validate parse result
   */
  protected validateResult(result: ParseResult): ParseResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!result.transactions || result.transactions.length === 0) {
      warnings.push('No transactions found in statement');
    }

    // Validate each transaction
    result.transactions.forEach((txn, index) => {
      if (!txn.transactionDate) {
        errors.push(`Transaction ${index + 1}: Missing transaction date`);
      }
      if (!txn.merchantName || txn.merchantName.trim() === '') {
        errors.push(`Transaction ${index + 1}: Missing merchant name`);
      }
      if (
        txn.amount === null ||
        txn.amount === undefined ||
        isNaN(txn.amount)
      ) {
        errors.push(`Transaction ${index + 1}: Invalid amount`);
      }
    });

    const validatedResult: ParseResult = {
      ...result,
      success: errors.length === 0,
    };

    if (errors.length > 0) {
      validatedResult.errors = errors;
    }

    if (warnings.length > 0) {
      validatedResult.warnings = warnings;
    }

    return validatedResult;
  }
}
