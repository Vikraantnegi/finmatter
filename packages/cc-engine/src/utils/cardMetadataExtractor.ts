/**
 * @deprecated This file is deprecated. Use @finmatter/llm-router instead.
 * This file is kept for backward compatibility but will be removed in a future version.
 *
 * LLM-based Card Metadata Extractor
 * Extracts comprehensive card metadata from PDF text and parsed statement data
 */

// Re-export from llm-router for backward compatibility
export { extractCardMetadataWithLLM } from '@finmatter/llm-router';
export type { CardMetadataResult as ExtractedCardMetadata } from '@finmatter/llm-router';
export type { CardMetadataExtractionOptions } from '@finmatter/llm-router';
