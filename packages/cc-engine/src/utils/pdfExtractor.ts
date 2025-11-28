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
      if (typeof window === 'undefined') {
        // Node.js environment - use legacy build for better server compatibility
        // The legacy build works more reliably in server environments
        const pdfjsPath = 'pdfjs-dist/legacy/build/pdf.mjs';
        const pdfjsModule = await import(/* webpackIgnore: true */ pdfjsPath);

        pdfjsLib = pdfjsModule;

        // Configure worker for Node.js environment IMMEDIATELY after import
        // pdfjs-dist requires explicit workerSrc in Node.js/serverless environments
        // Without this, it throws: "Setting up fake worker failed: No GlobalWorkerOptions.workerSrc specified"
        if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
          // For Node.js, we need to provide the worker file path
          // In pnpm monorepos, require.resolve might point to the store, so we need to find the actual file
          try {
            const path = require('path');
            const fs = require('fs');
            let workerPath: string | null = null;

            // Strategy 1: Try require.resolve (works in most cases)
            try {
              workerPath = require.resolve(
                'pdfjs-dist/legacy/build/pdf.worker.mjs',
              );
              if (fs.existsSync(workerPath)) {
                workerPath = path.resolve(workerPath);
              } else {
                workerPath = null;
              }
            } catch {
              // Continue to next strategy
            }

            // Strategy 2: If not found, try constructing from package.json location
            if (!workerPath || !fs.existsSync(workerPath)) {
              try {
                const pdfjsDistPath = require.resolve(
                  'pdfjs-dist/package.json',
                );
                const candidatePath = path.join(
                  path.dirname(pdfjsDistPath),
                  'legacy/build/pdf.worker.mjs',
                );
                if (fs.existsSync(candidatePath)) {
                  workerPath = path.resolve(candidatePath);
                }
              } catch {
                // Continue to next strategy
              }
            }

            // Strategy 3: Try to find it relative to current working directory (for pnpm monorepos)
            if (!workerPath || !fs.existsSync(workerPath)) {
              // Get the actual location where pdfjs-dist was imported from
              // In pnpm, this might be in a different location
              const possiblePaths: string[] = [];

              // Try common pnpm locations
              const cwd = process.cwd();
              possiblePaths.push(
                path.join(
                  cwd,
                  'node_modules',
                  'pdfjs-dist',
                  'legacy',
                  'build',
                  'pdf.worker.mjs',
                ),
                path.join(
                  cwd,
                  '..',
                  'node_modules',
                  'pdfjs-dist',
                  'legacy',
                  'build',
                  'pdf.worker.mjs',
                ),
                path.join(
                  cwd,
                  '..',
                  '..',
                  'node_modules',
                  'pdfjs-dist',
                  'legacy',
                  'build',
                  'pdf.worker.mjs',
                ),
              );

              // Try to find worker relative to where pdfjs was actually imported from
              // This handles pnpm's symlinked modules
              try {
                const pdfjsMainPath = require.resolve(
                  'pdfjs-dist/legacy/build/pdf.mjs',
                );
                const pdfjsDir = path.dirname(pdfjsMainPath);
                // Worker should be in the same directory as the main pdf.mjs file
                possiblePaths.push(path.join(pdfjsDir, 'pdf.worker.mjs'));
                // Also try the legacy/build directory structure
                possiblePaths.push(path.join(pdfjsDir, '..', 'pdf.worker.mjs'));
              } catch {
                // Ignore
              }

              for (const candidate of possiblePaths) {
                const resolved = path.resolve(candidate);
                if (fs.existsSync(resolved)) {
                  workerPath = resolved;
                  break;
                }
              }
            }

            // If we found a valid path, use it
            if (workerPath && fs.existsSync(workerPath)) {
              // On Windows, ESM loader requires file:// URLs, not plain paths
              // Convert Windows path to file:// URL format
              let workerSrc: string;
              if (process.platform === 'win32') {
                // Convert D:\path\to\file to file:///D:/path/to/file
                const normalizedPath = workerPath.replace(/\\/g, '/');
                // Ensure it starts with file://
                if (!normalizedPath.startsWith('file://')) {
                  workerSrc = `file:///${normalizedPath}`;
                } else {
                  workerSrc = normalizedPath;
                }
              } else {
                // On Unix-like systems, use file:// URL
                const normalizedPath = path.resolve(workerPath);
                workerSrc = `file://${normalizedPath}`;
              }
              pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
            } else {
              // Last resort: disable worker (use main thread)
              // This will cause pdfjs-dist to process in the main thread
              pdfjsLib.GlobalWorkerOptions.workerSrc = '';
            }
          } catch (workerError) {
            // If all else fails, disable worker
            console.warn(
              'Failed to configure pdfjs worker, disabling worker (using main thread):',
              workerError,
            );
            pdfjsLib.GlobalWorkerOptions.workerSrc = '';
          }
        }
      } else {
        // Browser environment - use dynamic import
        const pdfjsModule = await import('pdfjs-dist/legacy/build/pdf.mjs');
        pdfjsLib = pdfjsModule;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to load pdfjs-dist. Please ensure pdfjs-dist is installed: npm install pdfjs-dist. ${errorMessage}`,
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

    // Ensure worker is configured BEFORE any operations
    // This must be done every time before getDocument is called
    if (pdfjs && pdfjs.GlobalWorkerOptions) {
      // Re-verify workerSrc is set (it might have been reset)
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        // Re-set worker path if it was cleared
        try {
          const path = require('path');
          const fs = require('fs');
          let workerPath: string;

          try {
            workerPath = require.resolve(
              'pdfjs-dist/legacy/build/pdf.worker.mjs',
            );
          } catch {
            const pdfjsDistPath = require.resolve('pdfjs-dist/package.json');
            workerPath = path.join(
              path.dirname(pdfjsDistPath),
              'legacy/build/pdf.worker.mjs',
            );
          }

          workerPath = path.resolve(workerPath);

          if (fs.existsSync(workerPath)) {
            // On Windows, ESM loader requires file:// URLs
            let workerSrc: string;
            if (process.platform === 'win32') {
              // Convert D:\path\to\file to file:///D:/path/to/file
              const normalizedPath = workerPath.replace(/\\/g, '/');
              workerSrc = `file:///${normalizedPath}`;
            } else {
              // On Unix-like systems, use file:// URL
              workerSrc = `file://${path.resolve(workerPath)}`;
            }
            pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
          } else {
            throw new Error(`Worker file not found at: ${workerPath}`);
          }
        } catch (error) {
          console.warn('Failed to set pdfjs worker path:', error);
          // Don't set to empty - let pdfjs-dist handle the error
        }
      }
    }

    // Load the PDF document
    // pdfjs-dist exports getDocument as a named export
    const getDocument = (pdfjs as any).getDocument;
    if (!getDocument) {
      throw new Error('getDocument not found in pdfjs-dist module');
    }

    // Convert Buffer to Uint8Array (pdfjs-dist requires Uint8Array, not Buffer)
    // Buffer extends Uint8Array but pdfjs-dist does strict type checking
    let uint8Array: Uint8Array;

    // Check if it's a Node.js Buffer
    const isNodeBuffer =
      typeof Buffer !== 'undefined' &&
      typeof (Buffer as any).isBuffer === 'function' &&
      (Buffer as any).isBuffer(pdfBuffer);

    if (isNodeBuffer) {
      // Convert Buffer to Uint8Array by copying bytes
      const buffer = pdfBuffer as any;
      uint8Array = new Uint8Array(buffer.length);
      for (let i = 0; i < buffer.length; i++) {
        uint8Array[i] = buffer[i] ?? 0;
      }
    } else if (pdfBuffer instanceof Uint8Array) {
      // Already a Uint8Array
      uint8Array = pdfBuffer;
    } else {
      // For other types (ArrayBuffer, etc.), create Uint8Array
      const bufferAny = pdfBuffer as any;
      if (bufferAny.buffer instanceof ArrayBuffer) {
        uint8Array = new Uint8Array(
          bufferAny.buffer,
          bufferAny.byteOffset || 0,
          bufferAny.byteLength || bufferAny.length,
        );
      } else {
        uint8Array = new Uint8Array(bufferAny as ArrayLike<number>);
      }
    }

    const loadingTask = getDocument({
      data: uint8Array,
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
