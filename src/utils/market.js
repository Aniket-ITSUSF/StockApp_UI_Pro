/**
 * Market-preference helpers.
 *
 * Source of truth is `profile.market_preference` from the backend
 * (`US` or `IN`). For anonymous visitors we fall back to localStorage so the
 * app still renders sensible defaults before sign-in.
 *
 * Phase 8a is single-domain (`equiquant.in`) so we do NOT IP-redirect to a
 * `/in` or `/us` URL prefix. The toggle in the sidebar simply persists the
 * choice to the backend (when signed in) or to localStorage (when not).
 */

const KEY = 'sa.market_preference';

export const MARKETS = [
  { value: 'US', label: 'US',    flag: '🇺🇸', currency: 'USD' },
  { value: 'IN', label: 'India', flag: '🇮🇳', currency: 'INR' },
];

export function readLocalMarket() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function writeLocalMarket(value) {
  try {
    if (value) localStorage.setItem(KEY, value);
  } catch {
    /* private mode / quota - silently ignore */
  }
}

export function detectMarket() {
  const local = readLocalMarket();
  if (local === 'US' || local === 'IN') return local;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  if (tz.startsWith('Asia/Kolkata') || tz.startsWith('Asia/Calcutta')) return 'IN';
  const lang = navigator.language ?? '';
  if (lang === 'en-IN' || lang.endsWith('-IN')) return 'IN';
  return 'US';
}

export function currencyForMarket(market) {
  return market === 'IN' ? 'INR' : 'USD';
}

export function marketLabel(market) {
  return MARKETS.find(m => m.value === market)?.label ?? market;
}
