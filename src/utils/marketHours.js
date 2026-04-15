/**
 * Market hours utilities for the P&L polling system.
 *
 * Rules (no holiday handling — weekday + time window is sufficient for paper trading):
 *   India (NSE/BSE)  — Asia/Kolkata   — Mon-Fri  09:15 – 15:30 IST
 *   US (NYSE/NASDAQ) — America/New_York — Mon-Fri  09:30 – 16:00 ET
 */

const INDIA_SUFFIXES = ['.NS', '.BO'];

/** Derive market from ticker suffix. */
export function getMarketForTicker(ticker) {
  const upper = ticker.toUpperCase();
  return INDIA_SUFFIXES.some((s) => upper.endsWith(s)) ? 'IND' : 'US';
}

/**
 * Returns true if the given market is currently open.
 * Uses the browser's Intl API — no external dependency.
 */
export function isMarketOpen(market) {
  const now = new Date();
  const tz   = market === 'IND' ? 'Asia/Kolkata' : 'America/New_York';

  // Get local time parts in the target timezone
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    hour:    'numeric',
    minute:  'numeric',
    hour12:  false,
  }).formatToParts(now);

  const get = (type) => parts.find((p) => p.type === type)?.value;
  const weekday = get('weekday'); // 'Mon' … 'Sun'
  const hour    = parseInt(get('hour'),   10);
  const minute  = parseInt(get('minute'), 10);

  if (['Sat', 'Sun'].includes(weekday)) return false;

  const totalMin = hour * 60 + minute;

  if (market === 'IND') {
    // 09:15 – 15:30 IST
    return totalMin >= 9 * 60 + 15 && totalMin < 15 * 60 + 30;
  }

  // US: 09:30 – 16:00 ET
  return totalMin >= 9 * 60 + 30 && totalMin < 16 * 60;
}

/**
 * Given a list of position tickers, return only those whose market is
 * currently open. If no positions are in an open market the poller skips.
 */
export function filterOpenMarketTickers(tickers) {
  return tickers.filter((t) => isMarketOpen(getMarketForTicker(t)));
}

/** Human-readable market status string for the UI badge. */
export function marketStatusLabel(market) {
  if (isMarketOpen(market)) return 'OPEN';
  const tz      = market === 'IND' ? 'Asia/Kolkata' : 'America/New_York';
  const label   = market === 'IND' ? 'IST' : 'ET';
  const timeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(new Date());
  return `CLOSED · ${timeStr} ${label}`;
}
