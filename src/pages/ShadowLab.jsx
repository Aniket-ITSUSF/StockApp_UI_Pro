import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FlaskConical, TrendingUp, TrendingDown, Minus,
  RefreshCw, Clock, ShieldX, AlertTriangle, BarChart2, Clock3,
} from 'lucide-react';
import { getShadowPositions, getBatchPrices } from '../services/api';
import { filterOpenMarketTickers, getMarketForTicker, isMarketOpen, marketStatusLabel } from '../utils/marketHours';
import AgentVoteGrid from '../components/AgentVoteGrid';
import CircularProgress from '../components/CircularProgress';
import Tooltip from '../components/Tooltip';

const POLL_INTERVAL_MS = 5 * 60 * 1000;

// ─── Formatting ───────────────────────────────────────────────────────────────

function fmtPrice(n, ticker) {
  if (n == null) return '—';
  const isIndia = getMarketForTicker(ticker) === 'IND';
  return new Intl.NumberFormat(isIndia ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency: isIndia ? 'INR' : 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

// ─── Rejection metadata ───────────────────────────────────────────────────────

const REJECTION_META = {
  REJECTED_CONSENSUS: {
    label: 'Consensus Failed',
    color: 'text-rose-400',
    bg:    'bg-rose-500/10 border-rose-500/20',
    Icon:  ShieldX,
    tip:   'The weighted alpha score from all Tier-1 agents fell below the 65% threshold. ' +
           'Not enough agents agreed on a BUY signal to justify the trade.',
  },
  REJECTED_CONSENSUS_REGIME: {
    label: 'Regime-Adjusted Rejection',
    color: 'text-rose-400',
    bg:    'bg-rose-500/10 border-rose-500/20',
    Icon:  ShieldX,
    tip:   'The alpha score, after being re-weighted by the current market regime, ' +
           'fell below 65%. High-volatility regimes discount momentum signals and ' +
           'raise the effective bar for execution.',
  },
  REJECTED_MTF: {
    label: 'Multi-Timeframe Block',
    color: 'text-amber-400',
    bg:    'bg-amber-500/10 border-amber-500/20',
    Icon:  AlertTriangle,
    tip:   'The weekly chart structure was bearish (price below weekly 20 SMA). ' +
           'The system refuses to buy daily bounces inside weekly downtrends — ' +
           'a critical protection against catching falling knives.',
  },
  REJECTED_RISK: {
    label: 'Risk Management Block',
    color: 'text-rose-400',
    bg:    'bg-rose-500/10 border-rose-500/20',
    Icon:  BarChart2,
    tip:   'The Risk Management agent calculated that the required stop-loss ' +
           '(1.5× 14-day ATR below entry) would expose more than 8% of capital. ' +
           'Capital preservation is paramount — the trade was blocked.',
  },
};

const ALPHA_TIP =
  'Weighted composite of all Tier-1 agent votes (0–100). ' +
  'Needs ≥ 65 to pass to MTF and Risk veto gates. ' +
  'Green ≥ 65 · Amber ≥ 40 · Red < 40.';

const VIX_TIP =
  'Expected 30-day market volatility. VIX > 20 shifts agent weights toward ' +
  'mean-reversion strategies. VIX > 30 (US) / > 25 (India) = HIGH_VOLATILITY regime.';

// ─── Shadow card ──────────────────────────────────────────────────────────────

function ShadowCard({ pos, livePrice }) {
  const price    = livePrice ?? pos.current_price;
  const entry    = pos.entry_price;
  const qty      = pos.quantity ?? 100;
  const pnl      = entry != null ? (price - entry) * qty : null;
  const pct      = entry ? ((price - entry) / entry) * 100 : null;
  const isGain   = pnl != null && pnl > 0;
  const isLoss   = pnl != null && pnl < 0;
  const pnlColor = isGain ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400';
  const PnlIcon  = isGain ? TrendingUp : isLoss ? TrendingDown : Minus;
  const isLive   = livePrice != null;

  const action   = pos.action_taken ?? 'REJECTED_CONSENSUS';
  const meta     = REJECTION_META[action] ?? REJECTION_META.REJECTED_CONSENSUS;
  const { Icon: RejIcon } = meta;

  const rawScore = pos.final_alpha_score ?? 0;
  const alpha    = rawScore > 1 ? rawScore : rawScore * 100;

  const ts = pos.timestamp
    ? new Date(pos.timestamp).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 hover:border-slate-700 transition-colors">

      {/* ── Title row ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl font-bold tracking-widest text-slate-100 font-mono">
              {pos.ticker}
            </span>
            {/* Rejection badge */}
            <Tooltip content={meta.tip} width="w-64">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border cursor-default ${meta.bg} ${meta.color}`}>
                <RejIcon size={11} />
                {meta.label}
              </span>
            </Tooltip>
          </div>
          {ts && (
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
              <Clock3 size={11} />
              Evaluated {ts}
            </div>
          )}
        </div>

        {/* Alpha score */}
        <Tooltip content={ALPHA_TIP} width="w-56">
          <div className="flex flex-col items-center shrink-0 cursor-default">
            <CircularProgress score={alpha} size={64} />
            <span className="text-[10px] text-slate-500 mt-1 font-medium">ALPHA</span>
          </div>
        </Tooltip>
      </div>

      {/* ── "What you would have paid" narrative ───────────────────── */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 flex flex-col gap-2.5">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Hypothetical trade snapshot
        </p>

        <div className="grid grid-cols-3 gap-3">
          {/* Entry price */}
          <div>
            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Would have paid</p>
            <p className="text-sm font-semibold text-slate-300 tabular-nums font-mono">
              {fmtPrice(entry, pos.ticker)}
            </p>
            <p className="text-[10px] text-slate-600">{qty} shares</p>
          </div>

          {/* Current price */}
          <div>
            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Price today</p>
            <p className={`text-sm font-semibold tabular-nums font-mono ${isLive ? 'text-slate-100' : 'text-slate-400'}`}>
              {fmtPrice(price, pos.ticker)}
              {isLive && (
                <span className="ml-1 text-[9px] text-emerald-500 font-semibold not-italic">live</span>
              )}
            </p>
            <p className="text-[10px] text-slate-600">
              {isLive ? 'live price' : 'last close'}
            </p>
          </div>

          {/* Shadow P&L */}
          <div>
            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Would be worth</p>
            <div className={`flex items-center gap-1 text-sm font-semibold tabular-nums font-mono ${pnlColor}`}>
              <PnlIcon size={13} />
              {pnl != null ? fmtPrice(Math.abs(pnl), pos.ticker) : '—'}
            </div>
            {pct != null && (
              <p className={`text-[10px] ${pnlColor}`}>
                {pct > 0 ? '+' : ''}{pct.toFixed(2)}%
              </p>
            )}
          </div>
        </div>

        {/* Summary sentence */}
        {pnl != null && (
          <p className="text-xs text-slate-500 border-t border-slate-800 pt-2 leading-relaxed">
            {isGain
              ? `The system protected you from a missed gain of ${fmtPrice(Math.abs(pnl), pos.ticker)}. `
              : isLoss
              ? `The system saved you from a loss of ${fmtPrice(Math.abs(pnl), pos.ticker)}. `
              : 'This trade would have been roughly flat. '}
            Long-term signals did not align — see agent votes below.
          </p>
        )}
      </div>

      {/* ── Regime + VIX context ───────────────────────────────────── */}
      {(pos.regime || pos.vix_level != null) && (
        <div className="flex items-center gap-2 flex-wrap">
          {pos.regime && (
            <Tooltip content="Current market state at time of evaluation. Determines how agent votes are weighted." width="w-56">
              <span className="cursor-default text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
                {pos.regime}
              </span>
            </Tooltip>
          )}
          {pos.vix_level != null && (
            <Tooltip content={VIX_TIP} width="w-60">
              <span className={`cursor-default text-xs font-medium px-2 py-0.5 rounded-full border ${
                pos.vix_level > 20
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                VIX {pos.vix_level.toFixed(1)}
              </span>
            </Tooltip>
          )}
          {pos.mtf_status && (
            <Tooltip content="Multi-Timeframe filter result. FAIL = weekly trend was bearish at time of evaluation." width="w-56">
              <span className={`cursor-default text-xs font-medium px-2 py-0.5 rounded-full border ${
                pos.mtf_status === 'PASS'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                MTF {pos.mtf_status}
              </span>
            </Tooltip>
          )}
          {pos.required_threshold != null && (
            <Tooltip content={`Alpha score must reach ${pos.required_threshold} to clear the consensus gate. This trade scored ${alpha.toFixed(1)}.`} width="w-56">
              <span className="cursor-default text-xs bg-slate-800 text-slate-500 border border-slate-700 px-2 py-0.5 rounded-full font-mono">
                threshold {pos.required_threshold}
              </span>
            </Tooltip>
          )}
        </div>
      )}

      {/* ── Agent vote grid ────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-2">
          Agent votes at time of evaluation — hover each for explanation
        </p>
        <AgentVoteGrid evaluation={pos} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShadowLab() {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [livePrices, setLivePrices] = useState({});
  const [lastPolled, setLastPolled] = useState(null);
  const [polling,    setPolling]    = useState(false);
  const timerRef = useRef(null);

  // Initial load
  useEffect(() => {
    getShadowPositions()
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.detail ?? 'Failed to load shadow positions'))
      .finally(() => setLoading(false));
  }, []);

  // Poller — same market-hours logic as Portfolio
  const runPoll = useCallback(async (positions) => {
    if (!positions?.length) return;
    const openTickers = filterOpenMarketTickers(positions.map(p => p.ticker));
    if (!openTickers.length) return;

    setPolling(true);
    try {
      const res = await getBatchPrices(openTickers);
      setLivePrices(prev => ({ ...prev, ...(res.data?.prices ?? {}) }));
      setLastPolled(new Date());
    } catch {
      // silent — keep showing last known prices
    } finally {
      setPolling(false);
    }
  }, []);

  useEffect(() => {
    const positions = data?.positions;
    if (!positions) return;
    runPoll(positions);
    timerRef.current = setInterval(() => runPoll(positions), POLL_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [data, runPoll]);

  const positions = data?.positions ?? [];

  // Live-adjusted aggregate P&L
  const totalCost  = positions.reduce((s, p) => s + p.entry_price * (p.quantity ?? 100), 0);
  const totalValue = positions.reduce((s, p) => {
    const price = livePrices[p.ticker] ?? p.current_price;
    return s + price * (p.quantity ?? 100);
  }, 0);
  const totalPnl = totalValue - totalCost;
  const totalPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : null;

  // Market status lines
  const tickers     = positions.map(p => p.ticker);
  const hasIndia    = tickers.some(t => getMarketForTicker(t) === 'IND');
  const hasUS       = tickers.some(t => getMarketForTicker(t) === 'US');
  const marketLines = [
    ...(hasIndia ? [`NSE: ${marketStatusLabel('IND')}`] : []),
    ...(hasUS    ? [`NYSE: ${marketStatusLabel('US')}`]  : []),
  ];

  return (
    <div className="p-6 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <FlaskConical size={20} className="text-amber-400 shrink-0" />
          <div>
            <h1 className="text-xl font-bold text-slate-100">Shadow Lab</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Trades the committee rejected — tracked to measure what the system saved (or missed)
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {marketLines.map(l => (
            <span key={l} className="text-[11px] text-slate-500 font-mono">{l}</span>
          ))}
          {lastPolled && (
            <div className="flex items-center gap-1 text-[11px] text-slate-600">
              {polling
                ? <RefreshCw size={10} className="animate-spin text-amber-500" />
                : <Clock size={10} />}
              <span>
                {polling ? 'Refreshing…' : `Prices as of ${lastPolled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
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

      {/* Info banner */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-400/80 leading-relaxed">
        These positions were <strong>never executed</strong>. The committee blocked them for the reasons shown below.
        Track them over time to validate the system's strictness — and tune agent weights in Settings if needed.
      </div>

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Hypothetical Cost',  value: totalCost,  display: null },
            { label: 'Hypothetical Value', value: totalValue, display: null },
            { label: 'Shadow P&L',         value: totalPnl,   isPnl: true  },
          ].map(({ label, value, isPnl }) => {
            const isIndia = positions.length > 0 && getMarketForTicker(positions[0].ticker) === 'IND';
            const formatted = new Intl.NumberFormat(isIndia ? 'en-IN' : 'en-US', {
              style: 'currency', currency: isIndia ? 'INR' : 'USD', minimumFractionDigits: 2,
            }).format(value);
            const pctStr = isPnl && totalPct != null
              ? ` (${totalPct > 0 ? '+' : ''}${totalPct.toFixed(2)}%)`
              : '';
            return (
              <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{label}</p>
                <p className={`text-2xl font-bold tabular-nums mt-1 ${
                  !isPnl ? 'text-slate-100' : value >= 0 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {formatted}{pctStr}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Cards grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-600 text-sm">Loading shadow positions…</div>
      ) : positions.length === 0 ? (
        <div className="text-center py-16 text-slate-600 text-sm">
          No shadow positions yet. Run some evaluations and the rejected trades will appear here.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {positions.map(pos => (
            <ShadowCard
              key={pos.id}
              pos={pos}
              livePrice={livePrices[pos.ticker] ?? null}
            />
          ))}
        </div>
      )}

      {positions.length > 0 && (
        <p className="text-[11px] text-slate-600 text-right">
          Prices polled from Yahoo Finance every 5 min · market hours only
        </p>
      )}
    </div>
  );
}
