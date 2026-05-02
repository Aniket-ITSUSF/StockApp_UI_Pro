import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Globe, RefreshCw, Zap, AlertCircle, Clock, Newspaper } from 'lucide-react';
import { getPreMarketHotlist, runPreMarketAgent } from '../services/api';
import AdInFeed from './ads/AdInFeed';

const CONFIDENCE_META = {
  HIGH:   { cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25', dot: 'bg-emerald-400' },
  MEDIUM: { cls: 'text-amber-400 bg-amber-500/10 border-amber-500/25',       dot: 'bg-amber-400'   },
  LOW:    { cls: 'text-slate-400 bg-slate-800 border-slate-700',              dot: 'bg-slate-500'   },
};

const MARKET_BADGE = {
  'US':        { label: 'NYSE/NASDAQ', cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  'India-NSE': { label: 'NSE',         cls: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  'India-BSE': { label: 'BSE',         cls: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
};

function HotlistCard({ item, onEvaluate }) {
  const [expanded, setExpanded] = useState(false);
  const isBullish   = item.direction === 'BULLISH';
  const confidence  = CONFIDENCE_META[item.confidence] ?? CONFIDENCE_META.LOW;
  const marketBadge = MARKET_BADGE[item.market] ?? MARKET_BADGE['US'];

  return (
    <div className={`bg-slate-900 border rounded-xl p-4 flex flex-col gap-3 transition-colors duration-150 h-full ${
      isBullish
        ? 'border-emerald-500/20 hover:border-emerald-500/35'
        : 'border-rose-500/20 hover:border-rose-500/35'
    }`}>

      {/* Direction stripe */}
      <div className={`h-0.5 w-full rounded-full ${isBullish ? 'bg-emerald-500/40' : 'bg-rose-500/40'}`} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isBullish
              ? <TrendingUp size={14} className="text-emerald-400 shrink-0" />
              : <TrendingDown size={14} className="text-rose-400 shrink-0" />
            }
            <span className="text-lg font-bold tracking-widest text-slate-100 font-mono">
              {item.ticker}
            </span>
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded-full border ${confidence.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${confidence.dot}`} />
              {item.confidence}
            </span>
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border ${marketBadge.cls}`}>
              {marketBadge.label}
            </span>
          </div>
          {item.company_name && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{item.company_name}</p>
          )}
        </div>

        {item.expected_move_pct != null && (
          <div className={`shrink-0 flex flex-col items-center rounded-lg px-2.5 py-1.5 border ${
            isBullish
              ? 'bg-emerald-500/10 border-emerald-500/25'
              : 'bg-rose-500/10 border-rose-500/25'
          }`}>
            <span className={`text-sm font-bold tabular-nums leading-none ${isBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isBullish ? '+' : ''}{item.expected_move_pct}%
            </span>
            <span className="text-xs text-slate-600 leading-none mt-0.5">est. move</span>
          </div>
        )}
      </div>

      {/* Direction badge */}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
          isBullish
            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
            : 'text-rose-400 bg-rose-500/10 border-rose-500/25'
        }`}>
          {isBullish ? '▲ BULLISH' : '▼ BEARISH'}
        </span>
        {item.rank && (
          <span className="text-xs text-slate-600 font-mono">#{item.rank}</span>
        )}
      </div>

      {/* Catalyst event */}
      {item.catalyst_event && (
        <div className="flex items-start gap-1.5">
          <Zap size={10} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-200/90 leading-relaxed font-medium">
            {item.catalyst_event}
          </p>
        </div>
      )}

      {/* Intraday thesis */}
      {item.intraday_thesis && (
        <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Intraday Thesis
          </p>
          <p className={`text-sm text-slate-300 leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>
            {item.intraday_thesis}
          </p>
          {item.intraday_thesis.length > 120 && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-xs text-purple-400 hover:text-purple-300 mt-1 transition-colors"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* Evidence source */}
      {item.news_source_evidence && (
        <div className="flex items-start gap-1.5">
          <Newspaper size={10} className="text-slate-600 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-500 leading-relaxed italic">{item.news_source_evidence}</p>
        </div>
      )}

      {/* Key risk */}
      {item.key_risk && (
        <div className="flex items-start gap-1.5">
          <AlertCircle size={10} className="text-rose-400/60 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-500 leading-relaxed">{item.key_risk}</p>
        </div>
      )}

      {/* Evaluate CTA */}
      {onEvaluate && (
        <button
          onClick={() => onEvaluate(item.ticker)}
          className={`mt-auto flex items-center justify-center gap-1.5 w-full text-xs font-semibold rounded-lg px-3 py-2 transition-colors border ${
            isBullish
              ? 'text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/20 hover:border-emerald-500/30'
              : 'text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/15 border-rose-500/20 hover:border-rose-500/30'
          }`}
        >
          Deep Evaluate {item.ticker}
        </button>
      )}
    </div>
  );
}

function useCountdown(targetIso) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    if (!targetIso) return undefined;
    const update = () => {
      const diff = new Date(targetIso) - Date.now();
      if (diff <= 0) { setLabel('now'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setLabel(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    const first = setTimeout(update, 0);
    const timer = setInterval(update, 30000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [targetIso]);
  return targetIso ? label : '';
}

export default function PreMarketRadar({ session = 'US', onEvaluateTicker }) {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [running,   setRunning]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPreMarketHotlist(session);
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { load(); }, [load]);

  const sessionActive = data?.session_active ?? false;
  const closeCountdown    = useCountdown(sessionActive ? data?.valid_until : null);
  const nextRunCountdown  = useCountdown(!sessionActive ? data?.next_run_utc : null);

  const handleRun = async () => {
    setRunning(true);
    try {
      await runPreMarketAgent(session);
      await load();
    } catch {
      // silent
    } finally {
      setRunning(false);
    }
  };

  const hotlist = data?.hotlist ?? [];
  const bullish = hotlist.filter(h => h.direction === 'BULLISH');
  const bearish = hotlist.filter(h => h.direction === 'BEARISH');

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center gap-2 text-slate-600 text-sm">
        <RefreshCw size={14} className="animate-spin" />
        Loading intraday intelligence…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Globe size={14} className="text-cyan-400" />
            Intraday's Play - {session} Session
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Geopolitical &amp; macro news sweep · Daily hotlist · Expires at market close
          </p>
          {data?.run_timestamp && (
            <p className="text-xs text-slate-700 mt-1 flex items-center gap-1">
              <Clock size={9} />
              Last run: {new Date(data.run_timestamp).toLocaleString(undefined, {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
              {sessionActive && closeCountdown && (
                <span className="text-cyan-800 ml-1">· {closeCountdown} until close</span>
              )}
            </p>
          )}
        </div>
        {import.meta.env.DEV && (
          <button
            onClick={handleRun}
            disabled={running || loading}
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 hover:border-cyan-500/30 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={11} className={running ? 'animate-spin' : ''} />
            {running ? 'Running Sweep…' : 'Run Agent Now'}
          </button>
        )}
      </div>

      {/* Stale data / next-run banner */}
      {!sessionActive && data?.hotlist?.length > 0 && (
        <div className="flex items-center gap-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-2.5">
          <Clock size={13} className="text-amber-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-xs text-amber-300/80 font-medium">
              Showing data from a prior session - market has closed.
            </span>
            {nextRunCountdown && (
              <span className="text-xs text-amber-500/70 ml-1.5">
                Research AI agent runs in <span className="font-semibold text-amber-400">{nextRunCountdown}</span>.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Macro context */}
      {data?.macro_context && (
        <div className="bg-slate-900 border border-cyan-500/15 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-cyan-500 uppercase tracking-wider mb-1.5">
            Today's Macro Context
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">{data.macro_context}</p>
          {data.analyst_note && (
            <p className="text-sm text-slate-400 leading-relaxed mt-2 italic">
              {data.analyst_note}
            </p>
          )}
        </div>
      )}

      {/* Stats strip */}
      {hotlist.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-slate-900 border border-emerald-500/15 rounded-lg px-3 py-1.5 text-xs text-slate-500 tabular-nums">
            <span className="text-emerald-400 font-bold">{bullish.length}</span> BULLISH
          </div>
          <div className="bg-slate-900 border border-rose-500/15 rounded-lg px-3 py-1.5 text-xs text-slate-500 tabular-nums">
            <span className="text-rose-400 font-bold">{bearish.length}</span> BEARISH
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-500 tabular-nums">
            <span className="text-slate-300 font-bold">{hotlist.length}</span> total candidates
          </div>
        </div>
      )}

      {/* Empty state */}
      {hotlist.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl py-14 flex flex-col items-center justify-center gap-3">
          <Globe size={28} className="text-slate-700" />
          <p className="text-sm text-slate-600">No hotlist for today's session yet.</p>
          <p className="text-xs text-slate-700">
            Auto-runs at 8:30 AM ET (US) · 8:15 AM IST (India) · or trigger manually above.
          </p>
          {import.meta.env.DEV && (
            <button
              onClick={handleRun}
              disabled={running}
              className="mt-2 flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 rounded-lg px-4 py-2 transition-colors disabled:opacity-40"
            >
              <RefreshCw size={12} className={running ? 'animate-spin' : ''} />
              {running ? 'Running…' : 'Generate Hotlist Now'}
            </button>
          )}
        </div>
      )}

      {/* Hotlist grid */}
      {hotlist.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {hotlist.map(item => (
              <HotlistCard
                key={item.id ?? item.ticker}
                item={item}
                onEvaluate={onEvaluateTicker}
              />
            ))}
          </div>
          <AdInFeed minHeight={120} />
        </>
      )}

      <p className="text-xs text-slate-700 text-right">
        {sessionActive
          ? 'Valid for current trading session only · expires at market close'
          : 'Prior session data · fresh hotlist generated at next market open'}
      </p>
    </div>
  );
}
