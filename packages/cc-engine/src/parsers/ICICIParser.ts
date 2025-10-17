/**
 * ICICI Bank Statement Parser
 */

import { BaseParser } from './BaseParser';
import type { ParseResult, ParsedTransaction, ParserConfig } from './types';

export class ICICIParser extends BaseParser {
  constructor() {
    super('icici');
  }

  protected getConfig(): ParserConfig {
    return {
      bankName: 'icici',
      dateFormats: ['dd/MM/yyyy', 'dd-MM-yyyy', 'dd MMM yy', 'dd/MM/yy'],
      transactionPatterns: [
        /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})?\s*(.+?)\s+([\d,]+\.\d{2})/gi,
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
        // Detect transaction section
        if (
          line.toLowerCase().includes('transaction') ||
          line.toLowerCase().includes('posting date')
        ) {
          inTransactionSection = true;
          continue;
        }

        // End of transaction section
        if (
          inTransactionSection &&
          (line.toLowerCase().includes('total') ||
            line.toLowerCase().includes('balance'))
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
        return this.createFailedResult('Failed to parse ICICI statement');
      }

      return this.createResult(transactions, metadata);
    } catch (error) {
      return this.createFailedResult(
        `Error parsing ICICI statement: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private parseTransactionLine(line: string): ParsedTransaction | null {
    // ICICI format typically: Trans Date | Post Date | Description | Amount
    const parts = line.split(/\s{2,}|\t+/).filter(p => p.trim());

    if (parts.length < 3) return null;

    // Try first part as date
    const dateStr = parts[0];
    if (!dateStr) return null;
    const date = this.parseDate(dateStr);
    if (!date) return null;

    // Amount is usually last column
    const lastPart = parts[parts.length - 1];
    if (!lastPart) return null;
    const amount = this.parseAmount(lastPart);
    if (amount === 0) return null;

    // Merchant description is in the middle
    const merchantParts = parts.slice(
      parts.length > 3 ? 2 : 1,
      parts.length - 1,
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
