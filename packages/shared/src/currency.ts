/**
 * Currency utilities for FinMatter
 */

/**
 * Currency configuration
 */
export const CURRENCY_CONFIG = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    decimals: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    position: 'before' as const,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    position: 'before' as const,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimals: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    position: 'after' as const,
  },
} as const;

export type CurrencyCode = keyof typeof CURRENCY_CONFIG;

/**
 * Get currency configuration
 */
export const getCurrencyConfig = (currency: CurrencyCode) => {
  return CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.INR;
};

/**
 * Format currency amount
 */
export const formatCurrencyAmount = (
  amount: number,
  currency: CurrencyCode = 'INR',
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    decimals?: number;
    locale?: string;
  } = {},
): string => {
  const {
    showSymbol = true,
    showCode = false,
    decimals,
    locale = 'en-IN',
  } = options;

  const config = getCurrencyConfig(currency);
  const decimalPlaces = decimals !== undefined ? decimals : config.decimals;

  if (typeof amount !== 'number' || isNaN(amount)) {
    amount = 0;
  }

  // Format the number
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(amount);

  // Add currency symbol/code
  if (showSymbol && showCode) {
    return `${config.symbol} ${formattedNumber} ${config.code}`;
  } else if (showSymbol) {
    return `${config.symbol}${formattedNumber}`;
  } else if (showCode) {
    return `${formattedNumber} ${config.code}`;
  } else {
    return formattedNumber;
  }
};

/**
 * Parse currency string to number
 */
export const parseCurrencyAmount = (
  amountString: string,
  currency: CurrencyCode = 'INR',
): number => {
  if (!amountString || typeof amountString !== 'string') {
    return 0;
  }

  const config = getCurrencyConfig(currency);

  // Remove currency symbol and code
  let cleaned = amountString
    .replace(config.symbol, '')
    .replace(config.code, '')
    .trim();

  // Replace thousands separator
  cleaned = cleaned.replace(
    new RegExp(`\\${config.thousandsSeparator}`, 'g'),
    '',
  );

  // Replace decimal separator with dot
  cleaned = cleaned.replace(config.decimalSeparator, '.');

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Convert currency amount (placeholder for future implementation)
 */
export const convertCurrency = (
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  exchangeRate: number,
): number => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  return amount * exchangeRate;
};

/**
 * Calculate percentage of amount
 */
export const calculatePercentage = (
  amount: number,
  percentage: number,
): number => {
  if (
    typeof amount !== 'number' ||
    typeof percentage !== 'number' ||
    isNaN(amount) ||
    isNaN(percentage)
  ) {
    return 0;
  }

  return (amount * percentage) / 100;
};

/**
 * Calculate percentage change
 */
export const calculatePercentageChange = (
  oldAmount: number,
  newAmount: number,
): number => {
  if (
    typeof oldAmount !== 'number' ||
    typeof newAmount !== 'number' ||
    isNaN(oldAmount) ||
    isNaN(newAmount)
  ) {
    return 0;
  }

  if (oldAmount === 0) {
    return newAmount > 0 ? 100 : 0;
  }

  return ((newAmount - oldAmount) / Math.abs(oldAmount)) * 100;
};

/**
 * Calculate compound interest
 */
export const calculateCompoundInterest = (
  principal: number,
  rate: number,
  time: number,
  frequency: number = 1,
): number => {
  if (
    typeof principal !== 'number' ||
    typeof rate !== 'number' ||
    typeof time !== 'number' ||
    isNaN(principal) ||
    isNaN(rate) ||
    isNaN(time)
  ) {
    return 0;
  }

  const amount =
    principal * Math.pow(1 + rate / 100 / frequency, frequency * time);
  return amount - principal;
};

/**
 * Calculate EMI (Equated Monthly Installment)
 */
export const calculateEMI = (
  principal: number,
  rate: number,
  tenure: number,
): number => {
  if (
    typeof principal !== 'number' ||
    typeof rate !== 'number' ||
    typeof tenure !== 'number' ||
    isNaN(principal) ||
    isNaN(rate) ||
    isNaN(tenure)
  ) {
    return 0;
  }

  if (rate === 0) {
    return principal / tenure;
  }

  const monthlyRate = rate / 100 / 12;
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
    (Math.pow(1 + monthlyRate, tenure) - 1);

  return emi;
};

/**
 * Calculate total EMI amount
 */
export const calculateTotalEMIAmount = (
  principal: number,
  rate: number,
  tenure: number,
): { emi: number; totalAmount: number; interest: number } => {
  const emi = calculateEMI(principal, rate, tenure);
  const totalAmount = emi * tenure;
  const interest = totalAmount - principal;

  return {
    emi,
    totalAmount,
    interest,
  };
};

/**
 * Calculate SIP (Systematic Investment Plan) returns
 */
export const calculateSIPReturns = (
  monthlyInvestment: number,
  rate: number,
  tenure: number,
): { totalInvestment: number; returns: number; totalValue: number } => {
  if (
    typeof monthlyInvestment !== 'number' ||
    typeof rate !== 'number' ||
    typeof tenure !== 'number' ||
    isNaN(monthlyInvestment) ||
    isNaN(rate) ||
    isNaN(tenure)
  ) {
    return { totalInvestment: 0, returns: 0, totalValue: 0 };
  }

  const monthlyRate = rate / 100 / 12;
  const totalMonths = tenure * 12;

  const totalValue =
    monthlyInvestment *
    ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) *
    (1 + monthlyRate);

  const totalInvestment = monthlyInvestment * totalMonths;
  const returns = totalValue - totalInvestment;

  return {
    totalInvestment,
    returns,
    totalValue,
  };
};

/**
 * Calculate FD (Fixed Deposit) returns
 */
export const calculateFDReturns = (
  principal: number,
  rate: number,
  tenure: number,
  frequency: 'monthly' | 'quarterly' | 'yearly' = 'yearly',
): { maturityAmount: number; returns: number } => {
  if (
    typeof principal !== 'number' ||
    typeof rate !== 'number' ||
    typeof tenure !== 'number' ||
    isNaN(principal) ||
    isNaN(rate) ||
    isNaN(tenure)
  ) {
    return { maturityAmount: 0, returns: 0 };
  }

  const frequencyMap = {
    monthly: 12,
    quarterly: 4,
    yearly: 1,
  };

  const compoundingFrequency = frequencyMap[frequency];
  const maturityAmount =
    principal *
    Math.pow(
      1 + rate / 100 / compoundingFrequency,
      compoundingFrequency * tenure,
    );
  const returns = maturityAmount - principal;

  return {
    maturityAmount,
    returns,
  };
};

/**
 * Calculate tax on returns
 */
export const calculateTaxOnReturns = (
  returns: number,
  taxRate: number,
): number => {
  if (
    typeof returns !== 'number' ||
    typeof taxRate !== 'number' ||
    isNaN(returns) ||
    isNaN(taxRate)
  ) {
    return 0;
  }

  return (returns * taxRate) / 100;
};

/**
 * Calculate net returns after tax
 */
export const calculateNetReturns = (
  returns: number,
  taxRate: number,
): number => {
  const tax = calculateTaxOnReturns(returns, taxRate);
  return returns - tax;
};

/**
 * Format large numbers with K, M, B suffixes
 */
export const formatLargeNumber = (
  amount: number,
  currency: CurrencyCode = 'INR',
  options: {
    showSymbol?: boolean;
    decimals?: number;
  } = {},
): string => {
  const { showSymbol = true, decimals = 1 } = options;

  if (typeof amount !== 'number' || isNaN(amount)) {
    return formatCurrencyAmount(0, currency, options);
  }

  const config = getCurrencyConfig(currency);
  const absAmount = Math.abs(amount);

  let formatted: string;
  let suffix: string;

  if (absAmount >= 1e12) {
    formatted = (absAmount / 1e12).toFixed(decimals);
    suffix = 'T';
  } else if (absAmount >= 1e9) {
    formatted = (absAmount / 1e9).toFixed(decimals);
    suffix = 'B';
  } else if (absAmount >= 1e6) {
    formatted = (absAmount / 1e6).toFixed(decimals);
    suffix = 'M';
  } else if (absAmount >= 1e3) {
    formatted = (absAmount / 1e3).toFixed(decimals);
    suffix = 'K';
  } else {
    return formatCurrencyAmount(amount, currency, options);
  }

  const sign = amount < 0 ? '-' : '';

  if (showSymbol) {
    return `${sign}${config.symbol}${formatted}${suffix}`;
  } else {
    return `${sign}${formatted}${suffix}`;
  }
};

/**
 * Calculate reward amount based on transaction
 */
export const calculateRewardAmount = (
  transactionAmount: number,
  rewardRate: number,
  rewardType: 'cashback' | 'points' | 'miles',
): number => {
  if (
    typeof transactionAmount !== 'number' ||
    typeof rewardRate !== 'number' ||
    isNaN(transactionAmount) ||
    isNaN(rewardRate)
  ) {
    return 0;
  }

  if (rewardType === 'cashback') {
    return (transactionAmount * rewardRate) / 100;
  } else if (rewardType === 'points') {
    return Math.floor(transactionAmount / 100) * rewardRate;
  } else if (rewardType === 'miles') {
    return Math.floor(transactionAmount / 100) * rewardRate;
  }

  return 0;
};

/**
 * Calculate effective reward rate
 */
export const calculateEffectiveRewardRate = (
  transactionAmount: number,
  rewardAmount: number,
): number => {
  if (
    typeof transactionAmount !== 'number' ||
    typeof rewardAmount !== 'number' ||
    isNaN(transactionAmount) ||
    isNaN(rewardAmount) ||
    transactionAmount === 0
  ) {
    return 0;
  }

  return (rewardAmount / transactionAmount) * 100;
};

/**
 * Compare two amounts
 */
export const compareAmounts = (
  amount1: number,
  amount2: number,
): -1 | 0 | 1 => {
  if (
    typeof amount1 !== 'number' ||
    typeof amount2 !== 'number' ||
    isNaN(amount1) ||
    isNaN(amount2)
  ) {
    return 0;
  }

  if (amount1 < amount2) return -1;
  if (amount1 > amount2) return 1;
  return 0;
};

/**
 * Check if amount is positive
 */
export const isPositiveAmount = (amount: number): boolean => {
  return typeof amount === 'number' && !isNaN(amount) && amount > 0;
};

/**
 * Check if amount is negative
 */
export const isNegativeAmount = (amount: number): boolean => {
  return typeof amount === 'number' && !isNaN(amount) && amount < 0;
};

/**
 * Check if amount is zero
 */
export const isZeroAmount = (amount: number): boolean => {
  return typeof amount === 'number' && !isNaN(amount) && amount === 0;
};

/**
 * Get absolute amount
 */
export const getAbsoluteAmount = (amount: number): number => {
  return Math.abs(amount);
};

/**
 * Round amount to specified decimal places
 */
export const roundAmount = (amount: number, decimals: number = 2): number => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 0;
  }

  return Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Floor amount to specified decimal places
 */
export const floorAmount = (amount: number, decimals: number = 2): number => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 0;
  }

  return Math.floor(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Ceil amount to specified decimal places
 */
export const ceilAmount = (amount: number, decimals: number = 2): number => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 0;
  }

  return Math.ceil(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);
};
