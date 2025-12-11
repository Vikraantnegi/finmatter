/**
 * Credit Card Statement Parser Engine
 * Main entry point for parsing bank statements
 */

import { HDFCParser } from './parsers/HDFCParser';
import { ICICIParser } from './parsers/ICICIParser';
import { AmexParser } from './parsers/AmexParser';
import type { ParseResult, BankName } from './types';

export * from './types';
export * from './parsers';
export * from './utils/cardMetadataExtractor';
export { extractTextFromPDF } from './utils/pdfExtractor';

/**
 * Parse a credit card statement PDF
 * @param pdfBuffer - Buffer containing the PDF file
 * @param bankName - Bank name ('hdfc', 'icici', 'amex')
 * @param password - Optional password for password-protected PDFs
 * @param options - Optional parsing options (openaiApiKey, useLLMFallback)
 * @returns Parsed result with transactions and metadata
 */
export async function parseStatement(
  pdfBuffer: Buffer,
  bankName: BankName,
  password?: string,
  options?: { openaiApiKey?: string; useLLMFallback?: boolean },
): Promise<ParseResult> {
  let parser;

  switch (bankName.toLowerCase()) {
    case 'hdfc':
      parser = new HDFCParser();
      break;
    case 'icici':
      parser = new ICICIParser();
      break;
    case 'amex':
      parser = new AmexParser();
      break;
    default:
      throw new Error(
        `Unsupported bank: ${bankName}. Supported banks: hdfc, icici, amex`,
      );
  }

  return parser.parse(pdfBuffer, password, options);
}
