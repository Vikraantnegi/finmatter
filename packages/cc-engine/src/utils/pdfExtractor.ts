/**
 * PDF Text Extractor Utility
 * Handles both password-protected and unprotected PDFs
 * Uses pdf-parse for unprotected PDFs and pdfjs-dist for password-protected PDFs
 */

import pdfParse from 'pdf-parse';

// Dynamic import for pdfjs-dist (Node.js compatible)
let pdfjsLib: any = null;

async function getPdfjsLib() {
  if (!pdfjsLib) {
    try {
      // Use dynamic import for Node.js compatibility
      // pdfjs-dist has different builds for Node.js vs browser
      const pdfjsModule = await import('pdfjs-dist/legacy/build/pdf.mjs');
      // pdfjs-dist exports named exports (getDocument, GlobalWorkerOptions, etc.)
      pdfjsLib = pdfjsModule;

      // Configure worker for Node.js environment
      if (typeof window === 'undefined') {
        // In Node.js, we can use the legacy build without a worker
        // or configure it to use the Node.js worker
        try {
          const workerPath = require.resolve(
            'pdfjs-dist/legacy/build/pdf.worker.mjs',
          );
          if (pdfjsLib.GlobalWorkerOptions) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
          }
        } catch {
          // If worker path resolution fails, continue without worker
          // Some Node.js environments don't need the worker
          console.warn(
            'Could not resolve pdfjs worker path, continuing without worker',
          );
        }
      }
    } catch {
      throw new Error(
        'Failed to load pdfjs-dist. Please ensure pdfjs-dist is installed: npm install pdfjs-dist',
      );
    }
  }
  return pdfjsLib;
}

/**
 * Extract text from PDF buffer
 * Tries pdf-parse first (faster), falls back to pdfjs-dist for password-protected PDFs
 */
export async function extractTextFromPDF(
  pdfBuffer: Buffer,
  password?: string,
): Promise<string> {
  // If password is provided, use pdfjs-dist directly
  if (password) {
    return extractTextWithPdfjs(pdfBuffer, password);
  }

  // Try pdf-parse first (faster for unprotected PDFs)
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (parseError) {
    // If pdf-parse fails, it might be password-protected
    // Try pdfjs-dist as fallback
    const errorMessage =
      parseError instanceof Error ? parseError.message : 'Unknown error';

    // Check if error suggests password protection
    if (
      errorMessage.includes('password') ||
      errorMessage.includes('encrypted') ||
      errorMessage.includes('security')
    ) {
      throw new Error(
        'PDF appears to be password-protected. Please provide the password.',
      );
    }

    // Try pdfjs-dist as fallback for other errors
    try {
      return await extractTextWithPdfjs(pdfBuffer);
    } catch {
      throw new Error(
        `PDF parsing failed: ${errorMessage}. If the PDF is password-protected, please provide the password.`,
      );
    }
  }
}

/**
 * Extract text from PDF using pdfjs-dist (supports password-protected PDFs)
 */
async function extractTextWithPdfjs(
  pdfBuffer: Buffer,
  password?: string,
): Promise<string> {
  try {
    const pdfjs = await getPdfjsLib();

    // Load the PDF document
    // pdfjs-dist exports getDocument as a named export
    const getDocument = (pdfjs as any).getDocument;
    if (!getDocument) {
      throw new Error('getDocument not found in pdfjs-dist module');
    }

    const loadingTask = getDocument({
      data: pdfBuffer,
      password: password || '',
      useSystemFonts: true,
      verbosity: 0, // Suppress warnings
    });

    const pdfDocument = await loadingTask.promise;

    // Extract text from all pages
    const textParts: string[] = [];
    const numPages = pdfDocument.numPages;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine text items from the page
      const pageText = textContent.items
        .map((item: any) => {
          // Handle both string and text run objects
          if (typeof item === 'string') {
            return item;
          }
          if (item.str) {
            return item.str;
          }
          return '';
        })
        .join(' ');

      textParts.push(pageText);
    }

    return textParts.join('\n');
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // Check for password-related errors
    if (
      errorMessage.includes('password') ||
      errorMessage.includes('encrypted') ||
      errorMessage.includes('Incorrect password')
    ) {
      throw new Error(
        'PDF is password-protected. Please provide the correct password.',
      );
    }

    throw new Error(`Failed to extract text using pdfjs-dist: ${errorMessage}`);
  }
}
