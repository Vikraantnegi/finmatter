/**
 * SBI (State Bank of India) Statement Parser
 */

import { BaseParser } from './BaseParser';
import type { ParseResult, ParsedTransaction, ParserConfig } from './types';

export class SBIParser extends BaseParser {
  constructor() {
    super('sbi');
  }

  protected getConfig(): ParserConfig {
    return {
      bankName: 'sbi',
      dateFormats: ['dd-MM-yyyy', 'dd/MM/yyyy', 'dd MMM yyyy'],
      transactionPatterns: [
        /(\d{2}-\d{2}-\d{4})\s+(.+?)\s+([\d,]+\.\d{2})\s*(Cr|Dr)?/gi,
      ],
      amountPatterns: [/[\d,]+\.\d{2}/g],
      merchantPatterns: [/[A-Z][A-Za-z0-9\s\-&.']+/g],
    };
  }

  async parse(pdfText: string): Promise<ParseResult> {
    try {
      const lines = this.splitLines(pdfText);
      const transactions: ParsedTransaction[] = [];
      const metadata = this.extractMetadata(pdfText);

      let inTransactionSection = false;

      for (const line of lines) {
        if (
          line.toLowerCase().includes('transaction') ||
          (line.toLowerCase().includes('date') &&
            line.toLowerCase().includes('particulars'))
        ) {
          inTransactionSection = true;
          continue;
        }

        if (
          inTransactionSection &&
          (line.toLowerCase().includes('total') ||
            line.toLowerCase().includes('closing balance'))
        ) {
          break;
        }

        if (inTransactionSection) {
          const transaction = this.parseTransactionLine(line);
          if (transaction) {
            transactions.push(transaction);
          }
        }
      }

      if (!this.validate(transactions)) {
        return this.createFailedResult('Failed to parse SBI statement');
      }

      return this.createResult(transactions, metadata);
    } catch (error) {
      return this.createFailedResult(
        `Error parsing SBI statement: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private parseTransactionLine(line: string): ParsedTransaction | null {
    const parts = line.split(/\s{2,}|\t+/).filter(p => p.trim());

    if (parts.length < 3) return null;

    const dateStr = parts[0];
    if (!dateStr) return null;
    const date = this.parseDate(dateStr);
    if (!date) return null;

    const lastPart = parts[parts.length - 1];
    if (!lastPart) return null;
    let amountStr = lastPart;
    const crDrPattern = /^(Cr|Dr)$/i;

    const secondLastPart = parts[parts.length - 2];
    if (crDrPattern.test(amountStr) && parts.length > 2 && secondLastPart) {
      amountStr = `${secondLastPart} ${amountStr}`;
    }

    const amount = this.parseAmount(amountStr);
    if (amount === 0) return null;

    const merchantParts = parts.slice(
      1,
      parts.length - (crDrPattern.test(lastPart) ? 2 : 1),
    );
    const merchantName = this.cleanMerchantName(merchantParts.join(' '));

    return {
      date,
      merchantName,
      amount,
      rawText: line,
      type: this.determineTransactionType(line),
    };
  }
}
