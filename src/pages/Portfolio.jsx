import { useState, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Clock, Wifi, WifiOff } from 'lucide-react';
import { getPortfolioSummary, getBatchPrices } from '../services/api';
import {
  getMarketForTicker,
  isMarketOpen,
  filterOpenMarketTickers,
  marketStatusLabel,
} from '../utils/marketHours';
import AdLeaderboard from '../components/ads/AdLeaderboard';

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmtUSD(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2,
  }).format(n);
}

function fmtINR(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 2,
  }).format(n);
}

function fmtPrice(n, ticker) {
  if (n == null) return '—';
  return getMarketForTicker(ticker) === 'IND' ? fmtINR(n) : fmtUSD(n);
}

function fmtPnl(n, ticker) {
  return fmtPrice(n, ticker);
}

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Sub-components ───────────────────────────────────────────────────────────

function MarketBadge({ ticker }) {
  const market = getMarketForTicker(ticker);
  const open   = isMarketOpen(market);
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded font-mono ${
      open
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        : 'bg-slate-800 text-slate-500 border border-slate-700'
    }`}>
      {open ? <Wifi size={9} /> : <WifiOff size={9} />}
      {market}
    </span>
  );
}

function PositionRow({ pos, livePrice }) {
  const price  = livePrice ?? pos.current_price;
  const pnl    = pos.entry_price != null ? (price - pos.entry_price) * pos.quantity : (pos.unrealized_pnl ?? 0);
  const pct    = pos.entry_price ? ((price - pos.entry_price) / pos.entry_price) * 100 : null;
  const color  = pnl > 0 ? 'text-emerald-400' : pnl < 0 ? 'text-rose-400' : 'text-slate-400';
  const Icon   = pnl > 0 ? TrendingUp : pnl < 0 ? TrendingDown : Minus;
  const isLive = livePrice != null;

  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-slate-100 text-sm">{pos.ticker}</span>
          <MarketBadge ticker={pos.ticker} />
        </div>
      </td>
      <td className="px-4 py-3 text-slate-400 text-sm tabular-nums">{fmtPrice(pos.entry_price, pos.ticker)}</td>
      <td className="px-4 py-3 text-sm tabular-nums">
        <span className={isLive ? 'text-slate-100' : 'text-slate-400'}>
          {fmtPrice(price, pos.ticker)}
        </span>
        {isLive && (
          <span className="ml-1.5 text-[9px] text-emerald-500 font-semibold uppercase tracking-wide">live</span>
        )}
      </td>
      <td className="px-4 py-3 text-rose-400 text-sm tabular-nums">{fmtPrice(pos.stop_loss, pos.ticker)}</td>
      <td className={`px-4 py-3 text-sm tabular-nums font-semibold ${color}`}>
        <div className="flex items-center gap-1.5">
          <Icon size={13} />
          {fmtPnl(pnl, pos.ticker)}
          {pct != null && (
            <span className="text-xs opacity-70">
              ({pct > 0 ? '+' : ''}{pct.toFixed(2)}%)
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Portfolio() {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  // livePrices: { [ticker]: price } — updated by the poller, not stored in DB
  const [livePrices, setLivePrices] = useState({});
  const [lastPolled, setLastPolled] = useState(null);
  const [polling,    setPolling]    = useState(false);
  const timerRef = useRef(null);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    getPortfolioSummary()
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.detail ?? 'Failed to load portfolio'))
      .finally(() => setLoading(false));
  }, []);

  // ── Poller ──────────────────────────────────────────────────────────────────
  const runPoll = useCallback(async (positions) => {
    if (!positions || positions.length === 0) return;

    const allTickers     = positions.map((p) => p.ticker);
    const openTickers    = filterOpenMarketTickers(allTickers);

    if (openTickers.length === 0) return; // all markets closed — skip

    setPolling(true);
    try {
      const res    = await getBatchPrices(openTickers);
      const prices = res.data?.prices ?? {};
      setLivePrices((prev) => ({ ...prev, ...prices }));
      setLastPolled(new Date());
    } catch {
      // Silent fail — keep showing last known prices
    } finally {
      setPolling(false);
    }
  }, []);

  // Start/restart the polling loop whenever positions are loaded
  useEffect(() => {
    const positions = data?.real_portfolio?.positions;
    if (!positions) return;

    // Run immediately on load
    runPoll(positions);

    timerRef.current = setInterval(() => runPoll(positions), POLL_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [data, runPoll]);

  // ── Derived totals using live prices where available ───────────────────────
  const positions = data?.real_portfolio?.positions ?? [];

  const totalCost  = positions.reduce((s, p) => s + p.entry_price * p.quantity, 0);
  const totalValue = positions.reduce((s, p) => {
    const price = livePrices[p.ticker] ?? p.current_price;
    return s + price * p.quantity;
  }, 0);
  const totalPnl   = totalValue - totalCost;
  const totalPct   = totalCost > 0 ? (totalPnl / totalCost) * 100 : null;

  // ── Detect which markets have open tickers ─────────────────────────────────
  const indTickers = positions.filter((p) => getMarketForTicker(p.ticker) === 'IND');
  const usTickers  = positions.filter((p) => getMarketForTicker(p.ticker) === 'US');
  const marketLines = [];
  if (indTickers.length > 0) marketLines.push(`NSE: ${marketStatusLabel('IND')}`);
  if (usTickers.length  > 0) marketLines.push(`NYSE: ${marketStatusLabel('US')}`);

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Real Portfolio</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Executed paper trades · P&L updates every 5 min during market hours
          </p>
        </div>

        {/* Market status + last-updated */}
        <div className="flex flex-col items-start sm:items-end gap-1">
          {marketLines.map((line) => (
            <span key={line} className="text-[11px] text-slate-500 font-mono">{line}</span>
          ))}
          {lastPolled && (
            <div className="flex items-center gap-1 text-[11px] text-slate-600">
              {polling
                ? <RefreshCw size={10} className="animate-spin text-emerald-500" />
                : <Clock size={10} />}
              <span>
                {polling
                  ? 'Refreshing…'
                  : `Prices as of ${lastPolled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-sm text-rose-400">
          ⚠ {error}
        </div>
      )}

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Cost Basis',    value: fmtUSD(totalCost),  pnl: null },
            { label: 'Market Value',  value: fmtUSD(totalValue), pnl: null },
            {
              label: 'Unrealized P&L',
              value: `${fmtUSD(totalPnl)}${totalPct != null ? ` (${totalPct > 0 ? '+' : ''}${totalPct.toFixed(2)}%)` : ''}`,
              pnl:   totalPnl,
            },
          ].map(({ label, value, pnl }) => (
            <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{label}</p>
              <p className={`text-2xl font-bold tabular-nums mt-1 ${
                pnl == null ? 'text-slate-100' : pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Positions table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/50">
              {['Ticker', 'Entry', 'Current', 'Stop Loss', 'Unrealized P&L'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {positions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-slate-600 text-sm">
                  {loading ? 'Loading positions…' : 'No executed positions yet.'}
                </td>
              </tr>
            ) : (
              positions.map((p) => (
                <PositionRow
                  key={p.id}
                  pos={p}
                  livePrice={livePrices[p.ticker] ?? null}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Polling footnote */}
      {positions.length > 0 && (
        <p className="text-[11px] text-slate-600 text-right">
          Prices polled from Yahoo Finance every 5 min · market hours only ·
          no WebSocket — paper trading does not require sub-minute precision
        </p>
      )}

      {/* Bottom leaderboard */}
      <AdLeaderboard />
    </div>
  );
}
