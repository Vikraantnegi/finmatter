export type DetectedNetwork =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'discover'
  | 'diners'
  | 'rupay'
  | 'maestro';

export function cleanCardNumber(input: string): string {
  return input.replace(/\D/g, '');
}

export function detectNetwork(cardNumber: string): DetectedNetwork | null {
  const cleaned = cleanCardNumber(cardNumber);

  if (/^4\d{0,18}$/.test(cleaned)) return 'visa';
  if (/^3[47]\d{0,13}$/.test(cleaned)) return 'amex';
  if (/^(5[1-5]|22[2-9]|2[3-7])/.test(cleaned)) return 'mastercard';
  if (
    /^(6011|65|64[4-9]|622(?:12[6-9]|1[3-9]\d|[2-8]\d{2}|9[01]\d|92[0-5]))/.test(
      cleaned,
    )
  )
    return 'discover';
  if (/^(36|38|30[0-5])/.test(cleaned)) return 'diners';
  if (/^652[12]/.test(cleaned) || cleaned.startsWith('60')) return 'rupay';
  if (/^(50|56|57|58|67)/.test(cleaned)) return 'maestro';

  return null;
}

export function getExpectedLength(network: DetectedNetwork | null): number[] {
  switch (network) {
    case 'amex':
      return [15];
    case 'diners':
      return [14];
    case 'maestro':
      return [12, 13, 14, 15, 16, 17, 18, 19];
    case 'visa':
      return [13, 16, 19];
    default:
      return [16];
  }
}

export function formatCardNumberDisplay(
  value: string,
  network: DetectedNetwork | null,
): string {
  const cleaned = cleanCardNumber(value).slice(0, 19);
  if (network === 'amex') {
    const part1 = cleaned.substring(0, 4);
    const part2 = cleaned.substring(4, 10);
    const part3 = cleaned.substring(10, 15);
    return [part1, part2, part3].filter(Boolean).join(' ').trim();
  }

  return cleaned.replace(/(.{4})/g, '$1 ').trim();
}

export function luhnCheck(cardNumber: string): boolean {
  const cleaned = cleanCardNumber(cardNumber);
  if (cleaned.length < 12) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = cleaned.length - 1; i >= 0; i -= 1) {
    let digit = parseInt(cleaned.charAt(i), 10);
    if (Number.isNaN(digit)) return false;

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export function getCardNumberError(
  value: string,
  network: DetectedNetwork | null,
): string | null {
  const cleaned = cleanCardNumber(value);
  if (!cleaned) return null;

  const expectedLengths = getExpectedLength(network);
  if (network && !expectedLengths.includes(cleaned.length)) {
    return `${network.toUpperCase()} cards must be ${expectedLengths.join(
      ' / ',
    )} digits`;
  }

  if (cleaned.length >= 13 && !luhnCheck(cleaned)) {
    return 'Card number looks invalid (Luhn check failed)';
  }

  return null;
}

export type SupportedCardNetwork = Exclude<DetectedNetwork, 'maestro'>;

export function toCardNetwork(
  detected: DetectedNetwork | null,
): SupportedCardNetwork | null {
  if (!detected || detected === 'maestro') {
    return null;
  }
  return detected;
}
