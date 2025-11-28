/**
 * Bank logo utilities
 * Maps bank names to their logo URLs
 */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  'https://tpiemcfwrodnxbrvjsvx.supabase.co';

const BANK_LOGO_BASE = `${SUPABASE_URL}/storage/v1/object/public/banks`;

// Bank name to logo URL mapping
const BANK_LOGOS: Record<string, { symbol: string; logo: string }> = {
  hdfc: {
    symbol: `${BANK_LOGO_BASE}/hdfc/symbol.svg`,
    logo: `${BANK_LOGO_BASE}/hdfc/logo.svg`,
  },
  icici: {
    symbol: `${BANK_LOGO_BASE}/icici/symbol.svg`,
    logo: `${BANK_LOGO_BASE}/icici/logo.svg`,
  },
  sbi: {
    symbol: `${BANK_LOGO_BASE}/sbi/symbol.svg`,
    logo: `${BANK_LOGO_BASE}/sbi/logo.svg`,
  },
  axis: {
    symbol: `${BANK_LOGO_BASE}/axis/symbol.svg`,
    logo: `${BANK_LOGO_BASE}/axis/logo.svg`,
  },
  amex: {
    symbol: `${BANK_LOGO_BASE}/amex/symbol.svg`,
    logo: `${BANK_LOGO_BASE}/amex/logo.svg`,
  },
  hsbc: {
    symbol: `${BANK_LOGO_BASE}/hsbc/symbol.svg`,
    logo: `${BANK_LOGO_BASE}/hsbc/logo.svg`,
  },
  kotak: {
    symbol: `${BANK_LOGO_BASE}/kotak/symbol.svg`,
    logo: `${BANK_LOGO_BASE}/kotak/logo.svg`,
  },
  indusind: {
    symbol: `${BANK_LOGO_BASE}/indusind/symbol.svg`,
    logo: `${BANK_LOGO_BASE}/indusind/logo.svg`,
  },
  yes: {
    symbol: `${BANK_LOGO_BASE}/yes/symbol.svg`,
    logo: `${BANK_LOGO_BASE}/yes/logo.svg`,
  },
  federal: {
    symbol: `${BANK_LOGO_BASE}/federal/symbol.svg`,
    logo: `${BANK_LOGO_BASE}/federal/logo.svg`,
  },
  idfc: {
    symbol: `${BANK_LOGO_BASE}/idfc/symbol.svg`,
    logo: `${BANK_LOGO_BASE}/idfc/logo.svg`,
  },
  rbl: {
    symbol: `${BANK_LOGO_BASE}/rbl/symbol.svg`,
    logo: `${BANK_LOGO_BASE}/rbl/logo.svg`,
  },
  pnb: {
    symbol: `${BANK_LOGO_BASE}/pnb/symbol.svg`,
    logo: `${BANK_LOGO_BASE}/pnb/logo.svg`,
  },
  scb: {
    symbol: `${BANK_LOGO_BASE}/scb/symbol.svg`,
    logo: `${BANK_LOGO_BASE}/scb/logo.svg`,
  },
  csb: {
    symbol: `${BANK_LOGO_BASE}/csb/symbol.svg`,
    logo: `${BANK_LOGO_BASE}/csb/logo.svg`,
  },
  au: {
    symbol: `${BANK_LOGO_BASE}/au/symbol.svg`,
    logo: `${BANK_LOGO_BASE}/au/logo.svg`,
  },
  bob: {
    symbol: `${BANK_LOGO_BASE}/bob/symbol.svg`,
    logo: `${BANK_LOGO_BASE}/bob/logo.svg`,
  },
  union: {
    symbol: `${BANK_LOGO_BASE}/union/symbol.svg`,
    logo: `${BANK_LOGO_BASE}/union/logo.svg`,
  },
};

/**
 * Get bank logo URL from bank name
 */
export const getBankLogoUrl = (
  bankName?: string | null,
  variant: 'symbol' | 'logo' = 'symbol',
): string | undefined => {
  if (!bankName) return undefined;

  // Normalize bank name to lowercase and remove common suffixes
  const normalized = bankName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/bank$/i, '')
    .trim();

  const bankLogo = BANK_LOGOS[normalized];
  if (!bankLogo) return undefined;

  return variant === 'symbol' ? bankLogo.symbol : bankLogo.logo;
};
