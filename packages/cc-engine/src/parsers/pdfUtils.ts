/**
 * PDF Utilities for PDF parsing
 * Uses pdf-parse for regular PDFs and pdfjs-dist for password-protected PDFs
 */

// Polyfills for Node.js environment (minimal for text extraction)
if (typeof (globalThis as any).DOMMatrix === 'undefined') {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    constructor() {
      // Simple polyfill for DOMMatrix
    }
  } as any;
}

if (typeof (globalThis as any).DOMRect === 'undefined') {
  (globalThis as any).DOMRect = class DOMRect {
    constructor() {
      // Simple polyfill for DOMRect
    }
  } as any;
}

if (typeof (globalThis as any).TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  (globalThis as any).TextEncoder = TextEncoder;
  (globalThis as any).TextDecoder = TextDecoder;
}

if (typeof (globalThis as any).URL === 'undefined') {
  (globalThis as any).URL = require('url').URL;
}

import pdf from 'pdf-parse';

/**
 * Logger utility for development debugging
 */
const logger = {
  log: (message: string) => {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PDF === 'true'
    ) {
      // eslint-disable-next-line no-console
      console.log(message);
    }
  },
  error: (message: string) => {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PDF === 'true'
    ) {
      // eslint-disable-next-line no-console
      console.error(message);
    }
  },
  warn: (message: string) => {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PDF === 'true'
    ) {
      // eslint-disable-next-line no-console
      console.warn(message);
    }
  },
};

/**
 * Result interface for PDF parsing
 */
export interface PDFParseResult {
  text: string;
  pageCount: number;
  success: boolean;
  error?: string;
}

/**
 * Parse PDF with password support using pdf-parse and pdfjs-dist
 * @param pdfBuffer - PDF file buffer
 * @param password - Optional password for encrypted PDFs
 * @returns Promise with parsed text and metadata
 */
export async function parsePDFWithPassword(
  pdfBuffer: Buffer,
  password?: string,
): Promise<PDFParseResult> {
  try {
    logger.log(
      `Starting PDF parsing (password: ${password ? 'provided' : 'none'})`,
    );

    // First, try with pdf-parse (faster for unprotected PDFs)
    if (!password) {
      try {
        const pdfData = await pdf(pdfBuffer, {
          max: 0, // Parse all pages
        });

        logger.log(
          `PDF parsed successfully with pdf-parse. Pages: ${pdfData.numpages}`,
        );
        return {
          text: pdfData.text,
          pageCount: pdfData.numpages,
          success: true,
        };
      } catch (error: any) {
        logger.log(`pdf-parse failed: ${error.message}`);

        // If pdf-parse fails due to password protection, try pdfjs-dist
        if (
          error.message?.includes('password') ||
          error.message?.includes('encrypted') ||
          error.message?.includes('Invalid password')
        ) {
          logger.log('Detected password protection, trying pdfjs-dist...');
          return await parsePDFWithPdfJs(pdfBuffer, password);
        }

        // For other errors, try pdfjs-dist as fallback
        logger.log('Trying pdfjs-dist as fallback...');
        return await parsePDFWithPdfJs(pdfBuffer, password);
      }
    }

    // If password is provided, use pdfjs-dist directly
    logger.log('Password provided, using pdfjs-dist directly...');
    return await parsePDFWithPdfJs(pdfBuffer, password);
  } catch (error: any) {
    // Handle PDF parsing errors
    if (
      error.message?.includes('password') ||
      error.message?.includes('encrypted')
    ) {
      return {
        text: '',
        pageCount: 0,
        success: false,
        error: password
          ? 'Incorrect password provided. Please check and try again.'
          : 'Password-protected PDF detected. Please provide the correct password.',
      };
    }

    return {
      text: '',
      pageCount: 0,
      success: false,
      error: `Failed to parse PDF: ${error.message}`,
    };
  }
}

/**
 * Parse PDF using pdfjs-dist with password support
 * @param pdfBuffer - PDF file buffer
 * @param password - Password for encrypted PDFs
 * @returns Promise with parsed text and metadata
 */
async function parsePDFWithPdfJs(
  pdfBuffer: Buffer,
  password?: string,
): Promise<PDFParseResult> {
  try {
    // Dynamically import pdfjs-dist to avoid module loading issues
    let pdfjsLib;
    try {
      // Use Function constructor to avoid static analysis
      const importPdfJs = new Function(
        'return import("pdfjs-dist/build/pdf.mjs")',
      );
      pdfjsLib = await importPdfJs();
    } catch (importError) {
      logger.error(`Failed to import pdfjs-dist: ${importError}`);
      return {
        text: '',
        pageCount: 0,
        success: false,
        error: 'PDF parsing library not available',
      };
    }

    // Convert buffer to Uint8Array
    const uint8Array = new Uint8Array(pdfBuffer);

    logger.log(
      `Attempting to parse PDF with pdfjs-dist (password: ${password ? 'provided' : 'none'})`,
    );

    // Load the PDF document with password support
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      password: password || '',
      useSystemFonts: true,
      disableFontFace: false,
      disableRange: false,
      disableStream: false,
    });

    const pdfDocument = await loadingTask.promise;
    const pageCount = pdfDocument.numPages;

    logger.log(`PDF loaded successfully. Pages: ${pageCount}`);

    let extractedText = '';

    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine all text items with proper spacing
      const pageText = textContent.items
        .map((item: any) => {
          // Handle different text item types
          if (typeof item === 'string') {
            return item;
          }
          if (item && typeof item === 'object' && 'str' in item) {
            return item.str;
          }
          return '';
        })
        .filter((text: string) => text && text.trim().length > 0)
        .join(' ');

      extractedText += `${pageText}\n`;
    }

    // Clean up
    pdfDocument.destroy();

    logger.log(
      `Text extraction completed. Text length: ${extractedText.length}`,
    );

    return {
      text: extractedText.trim(),
      pageCount,
      success: true,
    };
  } catch (error: any) {
    logger.error(`pdfjs-dist error: ${error.name} - ${error.message}`);

    // Check if it's a password error
    if (
      error.name === 'PasswordException' ||
      error.message?.includes('password')
    ) {
      return {
        text: '',
        pageCount: 0,
        success: false,
        error: password
          ? 'Incorrect password provided. Please check and try again.'
          : 'Password-protected PDF detected. Please provide the correct password.',
      };
    }

    // Check if it's a corrupted PDF
    if (
      error.name === 'InvalidPDFException' ||
      error.message?.includes('Invalid PDF')
    ) {
      return {
        text: '',
        pageCount: 0,
        success: false,
        error:
          'Invalid or corrupted PDF file. Please ensure the file is valid.',
      };
    }

    // Check for encryption errors
    if (
      error.message?.includes('encrypted') ||
      error.message?.includes('security')
    ) {
      return {
        text: '',
        pageCount: 0,
        success: false,
        error: 'PDF is encrypted and requires a password for access.',
      };
    }

    return {
      text: '',
      pageCount: 0,
      success: false,
      error: `PDF parsing failed: ${error.message}`,
    };
  }
}

/**
 * Try common passwords for password-protected PDFs
 * @param pdfBuffer - PDF file buffer
 * @param userInfo - User information for generating common passwords
 * @returns Promise with parsed text and metadata
 */
export async function tryCommonPasswords(
  pdfBuffer: Buffer,
  userInfo?: {
    cardLastFour?: string;
    dateOfBirth?: string;
    panLastFour?: string;
    mobileLastFour?: string;
    accountLastFour?: string;
  },
): Promise<PDFParseResult> {
  logger.log('Attempting to parse with common passwords...');

  const commonPasswords = generateCommonPasswords(userInfo);

  for (const password of commonPasswords) {
    logger.log(`Trying password: ${password}`);

    try {
      const result = await parsePDFWithPdfJs(pdfBuffer, password);
      if (result.success) {
        logger.log(`Successfully parsed with password: ${password}`);
        return result;
      }
    } catch (error: any) {
      logger.log(`Password ${password} failed: ${error.message}`);
    }
  }

  return {
    text: '',
    pageCount: 0,
    success: false,
    error:
      'Unable to parse PDF with common passwords. Please provide the correct password.',
  };
}

/**
 * Generate common passwords based on user information
 * @param userInfo - User information for generating passwords
 * @returns Array of common passwords to try
 */
function generateCommonPasswords(userInfo?: {
  cardLastFour?: string;
  dateOfBirth?: string;
  panLastFour?: string;
  mobileLastFour?: string;
  accountLastFour?: string;
}): string[] {
  const passwords: string[] = [];

  // Common default passwords
  const defaults = ['1234', '0000', '1111', '123456', 'password', '12345678'];
  passwords.push(...defaults);

  if (userInfo) {
    // Card last 4 digits
    if (userInfo.cardLastFour) {
      passwords.push(userInfo.cardLastFour);
    }

    // Date of birth variations
    if (userInfo.dateOfBirth) {
      const dob = userInfo.dateOfBirth.replace(/\D/g, ''); // Remove non-digits
      if (dob.length >= 4) {
        passwords.push(dob.slice(-4)); // Last 4 digits
        passwords.push(dob.slice(0, 4)); // First 4 digits
        if (dob.length >= 6) {
          passwords.push(dob.slice(-6)); // Last 6 digits
        }
      }
    }

    // PAN last 4 digits
    if (userInfo.panLastFour) {
      passwords.push(userInfo.panLastFour);
    }

    // Mobile last 4 digits
    if (userInfo.mobileLastFour) {
      passwords.push(userInfo.mobileLastFour);
    }

    // Account last 4 digits
    if (userInfo.accountLastFour) {
      passwords.push(userInfo.accountLastFour);
    }
  }

  // Remove duplicates and return
  return [...new Set(passwords)];
}

/**
 * Test password-protected PDF parsing with a sample PDF
 * @param pdfPath - Path to the PDF file
 * @param password - Password to test
 * @returns Promise with test results
 */
export async function testPasswordProtectedPDF(
  pdfPath: string,
  password?: string,
): Promise<PDFParseResult> {
  try {
    const fs = require('fs');
    const pdfBuffer = fs.readFileSync(pdfPath);

    logger.log(`Testing PDF: ${pdfPath}`);
    logger.log(`Password: ${password || 'none'}`);

    const result = await parsePDFWithPassword(pdfBuffer, password);

    logger.log(`Test completed. Success: ${result.success}`);
    if (result.success) {
      logger.log(`Pages: ${result.pageCount}`);
      logger.log(`Text length: ${result.text.length}`);
    } else {
      logger.log(`Error: ${result.error}`);
    }

    return result;
  } catch (error: any) {
    logger.error(`Test failed: ${error.message}`);
    return {
      text: '',
      pageCount: 0,
      success: false,
      error: `Test failed: ${error.message}`,
    };
  }
}
