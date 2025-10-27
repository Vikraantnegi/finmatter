/**
 * Polyfills for Node.js environment to support pdfjs-dist
 * This file must be imported before any modules that use pdfjs-dist
 */

// Apply polyfills for pdfjs-dist
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {
      // Simple polyfill for DOMMatrix
    }
  } as any;
}

if (typeof globalThis.DOMRect === 'undefined') {
  globalThis.DOMRect = class DOMRect {
    constructor() {
      // Simple polyfill for DOMRect
    }
  } as any;
}

if (typeof globalThis.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}

if (typeof globalThis.URL === 'undefined') {
  globalThis.URL = require('url').URL;
}

// Export empty object to make this a module
export {};
