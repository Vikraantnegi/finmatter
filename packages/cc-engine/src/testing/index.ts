/**
 * Parser Testing Framework
 *
 * Exports for testing bank statement parsers
 *
 * Organized in tune-statement-parsers/:
 * - core/ - Core testing utilities
 * - workflows/ - Improvement workflows
 * - agents/ - Background agents
 * - scripts/ - Utility scripts
 * - docs/ - Documentation
 */

export { ParserTester } from './tune-statement-parsers/core/ParserTester';
export { RegexAnalyzer } from './tune-statement-parsers/core/RegexAnalyzer';
export { LLMAccuracyTester } from './tune-statement-parsers/core/LLMAccuracyTester';
export { AutoTuneAgent } from './tune-statement-parsers/agents/auto-tune';
export type {
  ExpectedResult,
  ExpectedTransaction,
  ExpectedMetadata,
  ParserTestResult,
  TestSummary,
} from './tune-statement-parsers/core/types';
export type {
  RegexSuggestion,
  PatternAnalysis,
} from './tune-statement-parsers/core/RegexAnalyzer';
export type {
  LLMTestResult,
  LLMAccuracyReport,
} from './tune-statement-parsers/core/LLMAccuracyTester';
