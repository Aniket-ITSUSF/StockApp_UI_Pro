import { useState, useEffect } from 'react';
import { Flame, ArrowRight, Clock, Sparkles } from 'lucide-react';
import HotTradesTile from './HotTradesTile';
import { useHotTradesFastEval } from '../hooks/useHotTradesFastEval';

function useNextRunCountdown(nextRunIso) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    if (!nextRunIso) return undefined;
    const update = () => {
      const diff = new Date(nextRunIso) - Date.now();
      if (diff <= 0) { setLabel('any moment'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setLabel(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    const first = setTimeout(update, 0);
    const t = setInterval(update, 30000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [nextRunIso]);
  return nextRunIso ? label : '';
}

export default function HotTradesPanel({ onEvaluate, onNavigate }) {
  const [session, setSession] = useState('US');
  const { items, meta, loading } = useHotTradesFastEval(session);

  const sessionActive  = meta?.session_active ?? false;
  const nextRunCountdown = useNextRunCountdown(!sessionActive ? meta?.next_run_utc : null);

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Flame size={14} className="text-orange-400" />
            AI Suggested Trending Trades
            {/* Live / Stale pill */}
            {!loading && meta && (
              sessionActive ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded-full border bg-emerald-500/10 border-emerald-500/25 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded-full border bg-amber-500/10 border-amber-500/25 text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  PRIOR SESSION
                </span>
              )
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Click tile to evaluate · hover ⓘ for catalyst &amp; thesis
          </p>
          {!loading && !sessionActive && nextRunCountdown && (
            <p className="text-xs text-amber-500/70 mt-0.5 flex items-center gap-1">
              <Clock size={9} />
              Research AI agent runs in <span className="font-semibold text-amber-400 ml-0.5">{nextRunCountdown}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {['US', 'India'].map((s) => (
            <button
              key={s}
              onClick={() => setSession(s)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                session === s
                  ? 'bg-orange-500/15 border-orange-500/30 text-orange-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              {s === 'US' ? '🇺🇸 US' : '🇮🇳 India'}
            </button>
          ))}
          {onNavigate && (
            <button
              onClick={() => onNavigate()}
              className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors ml-1"
            >
              View Source <ArrowRight size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Stale session banner */}
      {!loading && !sessionActive && items.length > 0 && (
        <div className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2 mb-3">
          <Clock size={11} className="text-amber-400 shrink-0" />
          <span className="text-xs text-amber-300/80">
            Showing prior session data — market has closed.
            {nextRunCountdown && (
              <span className="text-amber-500/70 ml-1">
                Fresh data in <span className="font-semibold text-amber-400">{nextRunCountdown}</span>.
              </span>
            )}
          </span>
        </div>
      )}

      {/* Tile grid */}
      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl py-8 flex flex-col items-center justify-center gap-2">
          <Flame size={20} className="text-slate-700" />
          <p className="text-sm text-slate-600">No hot trades for today's {session} session yet.</p>
          <p className="text-xs text-slate-700">
            Auto-generated 1h before market open · or trigger from Intraday's Play.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-2 overflow-visible">
          {items.map((item) => (
            <HotTradesTile
              key={item.id ?? item.ticker}
              item={item}
              onEvaluate={onEvaluate}
            />
          ))}
        </div>
      )}

      {/* AI disclaimer */}
      <p className="text-xs text-slate-700 mt-2 flex items-center gap-1">
        <Sparkles size={9} />
        AI generated trades · AI can make mistakes · not financial advice
      </p>
    </div>
  );
}
