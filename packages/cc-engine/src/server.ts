/**
 * Server-only exports for cc-engine
 * These modules use Node.js APIs and cannot be used in the browser
 *
 * Usage:
 * import { parseStatement } from '@finmatter/cc-engine/server';
 */

// Apply polyfills before importing any modules that use pdfjs-dist
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

export * from './parsers';
