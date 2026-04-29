/**
 * Locale-aware formatting helpers (currency / percent / number).
 *
 * Pure functions only - the React component lives in `components/Money.jsx`
 * so Fast Refresh keeps working in dev.
 */

const LOCALE_FOR_CURRENCY = {
  USD: 'en-US',
  INR: 'en-IN',
  EUR: 'en-IE',
  GBP: 'en-GB',
};

export function formatMoney(value, currency = 'USD', { compact = false } = {}) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const locale = LOCALE_FOR_CURRENCY[currency] ?? 'en-US';
  return new Intl.NumberFormat(locale, {
    style:                 'currency',
    currency,
    notation:              compact ? 'compact' : 'standard',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value, { decimals = 2, compact = false } = {}) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-US', {
    notation:              compact ? 'compact' : 'standard',
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value, { decimals = 2 } = {}) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}
