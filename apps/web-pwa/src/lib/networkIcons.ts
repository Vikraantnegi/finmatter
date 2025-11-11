type CardNetworkName =
  | 'visa'
  | 'mastercard'
  | 'rupay'
  | 'amex'
  | 'discover'
  | 'diners';

export type NetworkIconVariant = 'flat-rounded' | 'logo';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  'https://tpiemcfwrodnxbrvjsvx.supabase.co';

const NETWORK_ICON_BASE = `${SUPABASE_URL}/storage/v1/object/public/network`;

const ICON_PATHS: Record<
  NetworkIconVariant,
  Record<CardNetworkName, string>
> = {
  'flat-rounded': {
    visa: `${NETWORK_ICON_BASE}/visa/flat-rounded.svg`,
    mastercard: `${NETWORK_ICON_BASE}/mastercard/flat-rounded.svg`,
    rupay: `${NETWORK_ICON_BASE}/rupay/flat-rounded.png`,
    amex: `${NETWORK_ICON_BASE}/amex/flat-rounded.svg`,
    discover: `${NETWORK_ICON_BASE}/discover/flat-rounded.svg`,
    diners: `${NETWORK_ICON_BASE}/diners/flat-rounded.svg`,
  },
  logo: {
    visa: `${NETWORK_ICON_BASE}/visa/logo.svg`,
    mastercard: `${NETWORK_ICON_BASE}/mastercard/logo.svg`,
    rupay: `${NETWORK_ICON_BASE}/rupay/logo.png`,
    amex: `${NETWORK_ICON_BASE}/amex/logo.svg`,
    discover: `${NETWORK_ICON_BASE}/discover/logo.svg`,
    diners: `${NETWORK_ICON_BASE}/diners/logo.svg`,
  },
};

export const getNetworkIconUrl = (
  network?: string | null,
  variant: NetworkIconVariant = 'flat-rounded',
) => {
  if (!network) return undefined;
  const normalized = network.toLowerCase() as CardNetworkName;
  return ICON_PATHS[variant][normalized];
};
