/**
 * @deprecated This file is deprecated. Use @finmatter/llm-router instead.
 * This file is kept for backward compatibility but will be removed in a future version.
 *
 * LLM-based PDF Metadata Extractor
 * Uses OpenAI or Ollama to extract structured data from PDF text when regex fails
 */

// Re-export from llm-router for backward compatibility
export { extractMetadataWithLLM } from '@finmatter/llm-router';
export type { StatementMetadataResult as LLMExtractedMetadata } from '@finmatter/llm-router';

// Legacy types - kept for backward compatibility
export interface LLMExtractionOptions {
  apiKey?: string;
  model?: string;
  temperature?: number;
  provider?: 'openai' | 'ollama';
  ollamaBaseUrl?: string;
  maxRetries?: number;
  timeout?: number;
}
