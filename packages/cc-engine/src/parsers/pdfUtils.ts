/**
 * PDF Utilities for password-protected PDF parsing
 * Uses pdfjs-dist for robust password support
 */

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// Configure pdfjs worker
if (typeof window === 'undefined') {
  // Node.js environment
  pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve(
    'pdfjs-dist/legacy/build/pdf.worker.mjs',
  );
}

export interface PDFParseResult {
  text: string;
  pageCount: number;
  success: boolean;
  error?: string;
}

/**
 * Parse PDF with password support using pdfjs-dist
 * @param pdfBuffer - PDF file buffer
 * @param password - Optional password for encrypted PDFs
 * @returns Promise with parsed text and metadata
 */
export async function parsePDFWithPassword(
  pdfBuffer: Buffer,
  password?: string,
): Promise<PDFParseResult> {
  try {
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: pdfBuffer,
      password: password || '', // Empty string for no password
    });

    const pdfDocument = await loadingTask.promise;
    const pageCount = pdfDocument.numPages;

    let fullText = '';

    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine all text items
      const pageText = textContent.items.map((item: any) => item.str).join(' ');

      fullText += `${pageText}\n`;
    }

    return {
      text: fullText.trim(),
      pageCount,
      success: true,
    };
  } catch (error: any) {
    // Handle password-related errors
    if (error.name === 'PasswordException') {
      return {
        text: '',
        pageCount: 0,
        success: false,
        error:
          'PDF is password protected. Please provide the correct password.',
      };
    }

    // Handle other PDF parsing errors
    if (error.name === 'InvalidPDFException') {
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
 * Check if PDF is password protected without parsing
 * @param pdfBuffer - PDF file buffer
 * @returns Promise indicating if PDF is encrypted
 */
export async function isPDFPasswordProtected(
  pdfBuffer: Buffer,
): Promise<boolean> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: pdfBuffer,
      password: '', // Try without password first
    });

    await loadingTask.promise;
    return false; // No password needed
  } catch (error: any) {
    return error.name === 'PasswordException';
  }
}

/**
 * Try common passwords for bank statements
 * @param pdfBuffer - PDF file buffer
 * @returns Promise with successful password or null
 */
export async function tryCommonPasswords(
  pdfBuffer: Buffer,
): Promise<string | null> {
  const commonPasswords = [
    '', // No password
    '1234',
    '0000',
    '1111',
    '123456',
    'password',
    'user',
    'admin',
  ];

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

  return null;
}
