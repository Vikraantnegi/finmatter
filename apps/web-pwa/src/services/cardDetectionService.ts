/**
 * Card Detection Service
 * Identifies card network, bank, and validates card numbers
 */

export interface CardDetectionResult {
  network:
    | 'Visa'
    | 'Mastercard'
    | 'RuPay'
    | 'Amex'
    | 'Discover'
    | 'Diners'
    | 'Unknown';
  bankName?: string;
  cardBrand?: string;
  isValid: boolean;
  formatted: string;
}

/**
 * Luhn Algorithm - Validates credit card numbers
 */
export function validateCardNumber(cardNumber: string): boolean {
  // Remove spaces and non-digits
  const digits = cardNumber.replace(/\D/g, '');

  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  // Loop through values starting from the rightmost digit
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Detect card network from card number
 */
export function detectCardNetwork(
  cardNumber: string,
): CardDetectionResult['network'] {
  const digits = cardNumber.replace(/\D/g, '');

  if (!digits) return 'Unknown';

  // Amex: Starts with 34 or 37
  if (/^3[47]/.test(digits)) {
    return 'Amex';
  }

  // Visa: Starts with 4
  if (/^4/.test(digits)) {
    return 'Visa';
  }

  // Mastercard: Starts with 51-55 or 2221-2720
  if (
    /^5[1-5]/.test(digits) ||
    /^(222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)/.test(digits)
  ) {
    return 'Mastercard';
  }

  // RuPay: Starts with 60, 65, 81, 82, 508
  if (/^(60|65|81|82|508)/.test(digits)) {
    return 'RuPay';
  }

  // Discover: Starts with 6011, 622126-622925, 644-649, 65
  if (
    /^(6011|65|64[4-9]|622(1(2[6-9]|[3-9][0-9])|[2-8][0-9]{2}|9([01][0-9]|2[0-5])))/.test(
      digits,
    )
  ) {
    return 'Discover';
  }

  // Diners: Starts with 36 or 38 or 300-305
  if (/^(36|38|30[0-5])/.test(digits)) {
    return 'Diners';
  }

  return 'Unknown';
}

/**
 * Format card number with spaces
 */
export function formatCardNumber(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');
  const network = detectCardNetwork(digits);

  // Amex: 4-6-5 format
  if (network === 'Amex') {
    return digits
      .slice(0, 15)
      .replace(/(\d{4})(\d{6})?(\d{5})?/, (_, p1, p2, p3) =>
        [p1, p2, p3].filter(Boolean).join(' '),
      );
  }

  // Others: 4-4-4-4 format
  return digits
    .slice(0, 16)
    .replace(/(\d{4})/g, '$1 ')
    .trim();
}

/**
 * Detect bank from BIN (first 6-8 digits)
 * This is a client-side quick detection. For accurate results, use the API.
 */
export function detectBankFromBIN(cardNumber: string): {
  bankName?: string;
  cardBrand?: string;
} {
  const digits = cardNumber.replace(/\D/g, '');
  const bin6 = digits.slice(0, 6);
  const bin8 = digits.slice(0, 8);

  // Quick client-side detection for popular banks
  // For production, this should query the backend API

  // HDFC Bank
  if (
    bin6 === '407823' ||
    bin6 === '437883' ||
    bin8.startsWith('5530') ||
    bin6 === '433911' ||
    bin6 === '523000' ||
    bin8.startsWith('6082') ||
    bin6 === '405330' ||
    bin6 === '422922' ||
    bin8.startsWith('5421') ||
    bin6 === '434123' ||
    bin6 === '457373' ||
    bin8.startsWith('5567')
  ) {
    return { bankName: 'HDFC Bank', cardBrand: 'HDFC Credit Card' };
  }

  // ICICI Bank
  if (
    bin6 === '438979' ||
    bin6 === '408855' ||
    bin8.startsWith('5523') ||
    bin8.startsWith('5184') ||
    bin8.startsWith('6085') ||
    bin6 === '425912' ||
    bin6 === '401187' ||
    bin8.startsWith('5541') ||
    bin6 === '439520' ||
    bin6 === '418824' ||
    bin8.startsWith('5486')
  ) {
    return { bankName: 'ICICI Bank', cardBrand: 'ICICI Credit Card' };
  }

  // Axis Bank
  if (
    bin6 === '426610' ||
    bin6 === '435543' ||
    bin8.startsWith('5550') ||
    bin8.startsWith('5129') ||
    bin8.startsWith('6522') ||
    bin6 === '428671' ||
    bin6 === '437598' ||
    bin8.startsWith('5224') ||
    bin6 === '422371' ||
    bin6 === '463570' ||
    bin8.startsWith('5571') ||
    bin6 === '408903' ||
    bin6 === '456789' ||
    bin8.startsWith('5538') ||
    bin6 === '445566'
  ) {
    return { bankName: 'Axis Bank', cardBrand: 'Axis Credit Card' };
  }

  // SBI Cards
  if (
    bin6 === '405784' ||
    bin6 === '436558' ||
    bin8.startsWith('5277') ||
    bin8.startsWith('5565') ||
    bin8.startsWith('6077') ||
    bin6 === '431422' ||
    bin6 === '437824'
  ) {
    return { bankName: 'State Bank of India', cardBrand: 'SBI Card' };
  }

  // Kotak Mahindra Bank
  if (
    bin6 === '482214' ||
    bin8.startsWith('4168') ||
    bin8.startsWith('5213') ||
    bin8.startsWith('5419')
  ) {
    return { bankName: 'Kotak Mahindra Bank', cardBrand: 'Kotak Credit Card' };
  }

  // IndusInd Bank
  if (
    bin6 === '406237' ||
    bin6 === '462430' ||
    bin8.startsWith('5525') ||
    bin8.startsWith('5182')
  ) {
    return { bankName: 'IndusInd Bank', cardBrand: 'IndusInd Credit Card' };
  }

  // HSBC
  if (
    bin6 === '437216' ||
    bin6 === '401127' ||
    bin8.startsWith('5520') ||
    bin6 === '402345' ||
    bin8.startsWith('5378')
  ) {
    return { bankName: 'HSBC', cardBrand: 'HSBC Credit Card' };
  }

  // American Express
  if (
    bin6.startsWith('3781') ||
    bin6.startsWith('3714') ||
    bin6.startsWith('3758')
  ) {
    return { bankName: 'American Express', cardBrand: 'Amex Card' };
  }

  // Fallback: Detect by first digit only for generic bank name
  // This ensures every card gets at least a generic detection
  const network = detectCardNetwork(digits);
  if (network !== 'Unknown' && digits.length >= 6) {
    return {
      bankName: 'Unknown Bank',
      cardBrand: `${network} Card`,
    };
  }

  return {};
}

/**
 * Full card detection with validation
 */
export function detectCard(cardNumber: string): CardDetectionResult {
  const digits = cardNumber.replace(/\D/g, '');
  const network = detectCardNetwork(digits);
  const isValid = digits.length >= 13 && validateCardNumber(digits);
  const formatted = formatCardNumber(digits);
  const { bankName, cardBrand } = detectBankFromBIN(digits);

  return {
    network,
    bankName,
    cardBrand,
    isValid,
    formatted,
  };
}

/**
 * Get card network logo/icon name
 */
export function getCardNetworkIcon(
  network: CardDetectionResult['network'],
): string {
  const icons = {
    Visa: 'visa',
    Mastercard: 'mastercard',
    RuPay: 'rupay',
    Amex: 'amex',
    Discover: 'discover',
    Diners: 'diners',
    Unknown: 'credit-card',
  };

  return icons[network] || icons.Unknown;
}

/**
 * Mask card number for display (show last 4 digits)
 */
export function maskCardNumber(cardNumber: string, showLast = 4): string {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < showLast) return cardNumber;

  const masked = '•'.repeat(digits.length - showLast);
  const visible = digits.slice(-showLast);

  return formatCardNumber(masked + visible);
}
