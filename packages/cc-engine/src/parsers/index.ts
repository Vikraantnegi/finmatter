/**
 * PDF Statement Parser - Main Entry Point
 * Handles parsing of credit card statements from various Indian banks
 */

import pdf from 'pdf-parse';
import { HDFCParser } from './HDFCParser';
import { ICICIParser } from './ICICIParser';
import { SBIParser } from './SBIParser';
import { AxisParser } from './AxisParser';
import { parsePDFWithPassword, tryCommonPasswords } from './pdfUtils';
import type { ParseResult, BankName } from './types';

// Export types
export * from './types';
export { BaseParser } from './BaseParser';

// Note: Password-protected PDF support is limited due to library constraints
// Most bank statements use simple passwords like last 4 digits, DOB, or PAN

/**
 * Main function to parse statement PDF
 * @param pdfBuffer - Buffer containing PDF file data
 * @param bankName - Name of the bank (hdfc, icici, sbi, axis, etc.)
 * @returns ParseResult with transactions and metadata
 */
export async function parseStatement(
  pdfBuffer: Buffer,
  bankName: BankName,
  password?: string,
  userInfo?: {
    cardLastFour?: string;
    dateOfBirth?: string;
    panLastFour?: string;
    mobileLastFour?: string;
    accountLastFour?: string;
  },
): Promise<ParseResult> {
  try {
    let pdfText = '';
    let parseError: string | undefined;

    // Try with provided password first
    if (password) {
      console.log(`Trying to parse PDF with provided password: ${password}`);
      const result = await parsePDFWithPassword(pdfBuffer, password);
      if (result.success) {
        pdfText = result.text;
        console.log(
          `PDF parsed successfully with provided password. Text length: ${pdfText.length}`,
        );
      } else {
        parseError =
          result.error || 'Failed to parse PDF with provided password';
        console.log(
          `Failed to parse PDF with provided password: ${parseError}`,
        );
      }
    } else {
      // Try without password first
      const result = await parsePDFWithPassword(pdfBuffer);
      if (result.success) {
        pdfText = result.text;
      } else {
        // If that fails, try common passwords
        console.log('PDF is password protected, trying common passwords...');
        const commonResult = await tryCommonPasswords(pdfBuffer, userInfo);
        if (commonResult.success) {
          pdfText = commonResult.text;
          console.log(
            `PDF parsed successfully with common password. Text length: ${pdfText.length}`,
          );
        } else {
          parseError =
            commonResult.error ||
            'PDF is password protected. Please provide the correct password.';
          console.log(
            `Failed to parse PDF with common passwords: ${parseError}`,
          );
        }
      }
    }

    if (parseError) {
      return {
        transactions: [],
        metadata: {},
        success: false,
        errors: [parseError],
        warnings: [],
        rawText: '',
      };
    }

    if (!pdfText || pdfText.trim().length === 0) {
      return {
        transactions: [],
        metadata: {},
        success: false,
        errors: ['PDF appears to be empty or could not be parsed'],
        warnings: [],
        rawText: '',
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

    const result = await parser.parse(pdfText);

    // Add raw text to result for debugging (first 5000 chars)
    return {
      ...result,
      rawText: pdfText.substring(0, 5000),
    };
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
