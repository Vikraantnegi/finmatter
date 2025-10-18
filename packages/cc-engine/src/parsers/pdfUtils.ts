/**
 * PDF Utilities for PDF parsing
 * Uses pdf-lib for password-protected PDFs and pdf-parse for regular PDFs
 */

import pdf from 'pdf-parse';
// import { PDFDocument } from 'pdf-lib';

export interface PDFParseResult {
  text: string;
  pageCount: number;
  success: boolean;
  error?: string;
}

/**
 * Parse PDF with password support using pdf-lib and pdf-parse
 * @param pdfBuffer - PDF file buffer
 * @param password - Optional password for encrypted PDFs
 * @returns Promise with parsed text and metadata
 */
export async function parsePDFWithPassword(
  pdfBuffer: Buffer,
  password?: string,
): Promise<PDFParseResult> {
  try {
    // First, try with pdf-parse (faster for unprotected PDFs)
    if (!password) {
      try {
        const pdfData = await pdf(pdfBuffer, {
          max: 0, // Parse all pages
        });

        return {
          text: pdfData.text,
          pageCount: pdfData.numpages,
          success: true,
        };
      } catch (error: any) {
        // If pdf-parse fails due to password protection, try pdfjs-dist
        if (
          error.message?.includes('password') ||
          error.message?.includes('encrypted')
        ) {
          return await parsePDFWithPasswordUsingPdfJs(pdfBuffer, password);
        }
        throw error;
      }
    }

    // If password is provided, use pdfjs-dist directly
    return await parsePDFWithPasswordUsingPdfJs(pdfBuffer, password);
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
        error:
          'PDF appears to be password protected. Please provide the correct password.',
      };
    }

    if (error.message?.includes('Invalid PDF')) {
      return {
        text: '',
        pageCount: 0,
        success: false,
        error: 'Invalid PDF file. Please ensure the file is a valid PDF.',
      };
    }

    // Generic error
    return {
      text: '',
      pageCount: 0,
      success: false,
      error: `Failed to parse PDF: ${error.message}`,
    };
  }
}

/**
 * Parse PDF using pdf-parse (password support is limited)
 * @param pdfBuffer - PDF file buffer
 * @param password - Optional password for encrypted PDFs
 * @returns Promise with parsed text and metadata
 */
async function parsePDFWithPasswordUsingPdfJs(
  pdfBuffer: Buffer,
  password?: string,
): Promise<PDFParseResult> {
  try {
    // Try to parse with pdf-parse
    const pdfData = await pdf(pdfBuffer, {
      max: 0, // Parse all pages
    });

    return {
      text: pdfData.text,
      pageCount: pdfData.numpages,
      success: true,
    };
  } catch (error: any) {
    // Check if it's a password-related error
    if (
      error.message?.includes('password') ||
      error.message?.includes('encrypted') ||
      error.message?.includes('Invalid password') ||
      error.message?.includes('password required')
    ) {
      if (password) {
        return {
          text: '',
          pageCount: 0,
          success: false,
          error: `Password-protected PDF detected. We received your password "${password}", but our current PDF parsing library doesn't support password decryption. Please try one of these solutions: 1) Remove the password from your PDF using a PDF editor, 2) Use a different PDF tool to remove the password, or 3) Contact support for assistance.`,
        };
      } else {
        return {
          text: '',
          pageCount: 0,
          success: false,
          error:
            'This PDF is password protected. Please provide the correct password in the upload form.',
        };
      }
    }

    // Other parsing errors
    return {
      text: '',
      pageCount: 0,
      success: false,
      error: `PDF parsing failed: ${error.message}`,
    };
  }
}

/**
 * Check if PDF is password protected without parsing
 * @param pdfBuffer - PDF file buffer
 * @returns Promise indicating if PDF is encrypted
 */
export async function isPDFPasswordProtected(
  pdfBuffer: Buffer,
): Promise<boolean> {
  try {
    // Try to parse with pdf-parse
    await pdf(pdfBuffer, { max: 0 });
    return false; // No password needed
  } catch (error: any) {
    // If parsing fails, it might be password protected
    return (
      error.message?.includes('password') ||
      error.message?.includes('encrypted') ||
      false
    );
  }
}

/**
 * Try common passwords for bank statements
 * @param pdfBuffer - PDF file buffer
 * @param userInfo - Optional user information to generate passwords
 * @returns Promise with successful password or null
 */
export async function tryCommonPasswords(
  pdfBuffer: Buffer,
  userInfo?: {
    cardLastFour?: string;
    dateOfBirth?: string; // DDMMYYYY format
    panLastFour?: string;
    mobileLastFour?: string;
    accountLastFour?: string;
  },
): Promise<string | null> {
  // First try without password
  try {
    const result = await parsePDFWithPassword(pdfBuffer);
    if (result.success) {
      return ''; // No password needed
    }
  } catch {
    // PDF might be password protected
  }

  // If user info is provided, try common password patterns
  if (userInfo) {
    const commonPasswords = generateCommonPasswords(userInfo);

    for (const password of commonPasswords) {
      try {
        const result = await parsePDFWithPassword(pdfBuffer, password);
        if (result.success) {
          return password;
        }
      } catch {
        // Continue to next password
        continue;
      }
    }
  }

  return null; // No password worked
}

/**
 * Generate common password patterns for bank statements
 * @param userInfo - User information to generate passwords from
 * @returns Array of potential passwords
 */
function generateCommonPasswords(userInfo: {
  cardLastFour?: string;
  dateOfBirth?: string;
  panLastFour?: string;
  mobileLastFour?: string;
  accountLastFour?: string;
}): string[] {
  const passwords: string[] = [];

  // Last 4 digits of card
  if (userInfo.cardLastFour) {
    passwords.push(userInfo.cardLastFour);
  }

  // Date of birth in DDMMYYYY format
  if (userInfo.dateOfBirth) {
    passwords.push(userInfo.dateOfBirth);
    // Also try YYYYMMDD format
    if (userInfo.dateOfBirth.length === 8) {
      const day = userInfo.dateOfBirth.substring(0, 2);
      const month = userInfo.dateOfBirth.substring(2, 4);
      const year = userInfo.dateOfBirth.substring(4, 8);
      passwords.push(`${year}${month}${day}`);
    }
  }

  // Last 4 digits of PAN
  if (userInfo.panLastFour) {
    passwords.push(userInfo.panLastFour);
  }

  // Last 4 digits of mobile
  if (userInfo.mobileLastFour) {
    passwords.push(userInfo.mobileLastFour);
  }

  // Last 4 digits of account
  if (userInfo.accountLastFour) {
    passwords.push(userInfo.accountLastFour);
  }

  // Remove duplicates
  return [...new Set(passwords)];
}
