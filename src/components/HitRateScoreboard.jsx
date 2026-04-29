import { useState, useEffect } from 'react';
import { Target, RefreshCw } from 'lucide-react';
import { getIntradayHitRate } from '../services/api';

const SESSION_LABELS = {
  pre_market: 'Pre-Market',
  morning:    'Morning',
  lunch:      'Lunch',
  closing:    'Closing',
};

const SESSION_ORDER = ['pre_market', 'morning', 'lunch', 'closing'];

/**
 * Session-tagged hit-rate scoreboard. Reads /research/intraday/hit-rate
 * and renders one card per (session, market_session) bucket.
 *
 * Ultra-only - the API itself returns 402 for lower tiers; this component
 * just renders nothing in that case so it stays harmless when wired into
 * Pro-locked tabs by mistake.
 */
export default function HitRateScoreboard({ marketSession = 'India', days = 30 }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    getIntradayHitRate(marketSession, days)
      .then((res) => { if (alive) setData(res.data); })
      .catch(() => { if (alive) setError(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [marketSession, days]);

  if (loading) {
    return (
      <div className="py-3 flex items-center gap-2 text-xs text-slate-400">
        <RefreshCw size={11} className="animate-spin" />
        Loading hit-rate scoreboard…
      </div>
    );
  }

  if (error || !data) return null;

  // Pivot buckets to session-keyed map for the chosen market.
  const bySession = {};
  for (const b of data.buckets ?? []) {
    if (b.market_session !== marketSession) continue;
    bySession[b.session] = b;
  }

  if (Object.keys(bySession).length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <Target size={10} className="text-purple-400" />
          Session Hit-Rate · last {days} days
        </p>
        <p className="text-xs text-slate-400">
          Not enough scored picks yet - hit-rate appears after the post-close
          evaluator has run on at least one session.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-purple-500/15 rounded-xl px-4 py-3">
      <div className="flex items-center justify-between mb-2.5 flex-wrap gap-1">
        <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
          <Target size={10} />
          Session Hit-Rate · last {days} days
        </p>
        <p className="text-xs text-slate-500">
          Direction-correct moves vs all scored picks · scored 1h after market close
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SESSION_ORDER.map((s) => {
          const b = bySession[s];
          return <Bucket key={s} session={s} bucket={b} />;
        })}
      </div>
    </div>
  );
}

function Bucket({ session, bucket }) {
  if (!bucket || (bucket.green + bucket.red + bucket.flat) === 0) {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {SESSION_LABELS[session] ?? session}
        </p>
        <p className="text-xs text-slate-500 mt-1">No data</p>
      </div>
    );
  }

  const scored = bucket.green + bucket.red + bucket.flat;
  const greenPct = bucket.green_pct ?? 0;
  const tone =
    greenPct >= 60 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
    : greenPct >= 45 ? 'text-amber-400 border-amber-500/30 bg-amber-500/5'
    : 'text-rose-400 border-rose-500/30 bg-rose-500/5';

  return (
    <div className={`rounded-lg px-3 py-2.5 border ${tone} bg-slate-950`}>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {SESSION_LABELS[session] ?? session}
      </p>
      <div className="flex items-baseline gap-1 mt-1">
        <span className={`text-xl font-bold tabular-nums ${tone.split(' ')[0]}`}>
          {greenPct.toFixed(0)}%
        </span>
        <span className="text-xs text-slate-400">green</span>
      </div>
      <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
        {bucket.green}G · {bucket.red}R · {bucket.flat}F
        {bucket.pending > 0 && (
          <span className="text-slate-600"> · {bucket.pending} pending</span>
        )}
      </p>
      {bucket.avg_outcome_pct != null && (
        <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
          avg {bucket.avg_outcome_pct >= 0 ? '+' : ''}{bucket.avg_outcome_pct.toFixed(2)}%
        </p>
      )}
      <p className="text-xs text-slate-500 mt-0.5">
        {scored} pick{scored === 1 ? '' : 's'} scored
      </p>
    </div>
  );
}
