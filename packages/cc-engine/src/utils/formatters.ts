/**
 * String formatting utilities for parsed data
 * These are simple string manipulation functions, not LLM-based
 */

/**
 * Clean card name by removing common prefixes and suffixes
 * Examples:
 * - "Benefits on your card Tata Neu Plus Credit Card" → "Tata Neu Plus Credit Card"
 * - "Your HDFC Millennia Credit Card Statement" → "HDFC Millennia Credit Card"
 */
export function cleanCardName(cardName: string): string {
  if (!cardName) return cardName;

  // Remove common prefixes
  const prefixes = [
    'Benefits on your card',
    'Calculation on your',
    'Statement for your',
    'Your',
    'On your',
  ];

  let cleaned = cardName.trim();

  for (const prefix of prefixes) {
    if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
      cleaned = cleaned.substring(prefix.length).trim();
      // Remove leading/trailing punctuation
      cleaned = cleaned.replace(/^[:\s-]+|[:\s-]+$/g, '').trim();
    }
  }

  // Remove trailing "Credit Card Statement" if present
  cleaned = cleaned.replace(/\s+Credit\s+Card\s+Statement\s*$/i, '');

  // Ensure it ends with "Credit Card" if it's a card name
  if (cleaned && !cleaned.toLowerCase().includes('credit card')) {
    // Only add if it looks like a card name (has capital letters, not generic text)
    if (
      /^[A-Z]/.test(cleaned) &&
      !cleaned.toLowerCase().includes('calculation')
    ) {
      cleaned = `${cleaned} Credit Card`;
    }
  }

  return cleaned.trim();
}
