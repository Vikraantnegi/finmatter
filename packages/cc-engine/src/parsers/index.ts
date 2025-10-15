/**
 * PDF Statement Parser - Main Entry Point
 * Handles parsing of credit card statements from various Indian banks
 */

import pdf from 'pdf-parse';
import { HDFCParser } from './HDFCParser';
import { ICICIParser } from './ICICIParser';
import { SBIParser } from './SBIParser';
import { AxisParser } from './AxisParser';
import type { ParseResult, BankName } from './types';

// Export types
export * from './types';
export { BaseParser } from './BaseParser';

/**
 * Main function to parse statement PDF
 * @param pdfBuffer - Buffer containing PDF file data
 * @param bankName - Name of the bank (hdfc, icici, sbi, axis, etc.)
 * @returns ParseResult with transactions and metadata
 */
export async function parseStatement(
  pdfBuffer: Buffer,
  bankName: BankName,
): Promise<ParseResult> {
  try {
    const pdfData = await pdf(pdfBuffer);
    const pdfText = pdfData.text;

    if (!pdfText || pdfText.trim().length === 0) {
      return {
        transactions: [],
        metadata: {},
        success: false,
        errors: ['PDF appears to be empty or could not be parsed'],
        warnings: [],
      };
    }

    let parser;
    switch (bankName.toLowerCase()) {
      case 'hdfc':
        parser = new HDFCParser();
        break;
      case 'icici':
        parser = new ICICIParser();
        break;
      case 'sbi':
        parser = new SBIParser();
        break;
      case 'axis':
        parser = new AxisParser();
        break;
      default:
        return {
          transactions: [],
          metadata: {},
          success: false,
          errors: [
            `Unsupported bank: ${bankName}. Supported banks: HDFC, ICICI, SBI, Axis`,
          ],
          warnings: [],
        };
    }

    return await parser.parse(pdfText);
  } catch (error) {
    return {
      transactions: [],
      metadata: {},
      success: false,
      errors: [
        `Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
      warnings: [],
    };
  }
}

// Detect bank from PDF content (optional helper)
// Attempts to identify the bank from the PDF text
export async function detectBank(pdfBuffer: Buffer): Promise<BankName | null> {
  try {
    const pdfData = await pdf(pdfBuffer);
    const text = pdfData.text.toLowerCase();

    if (text.includes('hdfc') || text.includes('hdfc bank')) return 'hdfc';
    if (text.includes('icici') || text.includes('icici bank')) return 'icici';
    if (text.includes('state bank') || text.includes('sbi')) return 'sbi';
    if (text.includes('axis') || text.includes('axis bank')) return 'axis';

    return null;
  } catch {
    return null;
  }
}
