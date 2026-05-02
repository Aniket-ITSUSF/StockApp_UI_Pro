import { useState } from 'react';
import { Zap, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import Tooltip from './Tooltip';

const CONVICTION_META = {
  HIGH:   { cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25', dot: 'bg-emerald-400' },
  MEDIUM: { cls: 'text-amber-400   bg-amber-500/10   border-amber-500/25',   dot: 'bg-amber-400'   },
  LOW:    { cls: 'text-slate-400   bg-slate-800      border-slate-700',       dot: 'bg-slate-500'   },
};

const MARKET_BADGE = {
  'US':        { label: 'NYSE/NASDAQ', cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  'India-NSE': { label: 'NSE',         cls: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  'India-BSE': { label: 'BSE',         cls: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  'Other':     { label: 'Other',       cls: 'text-slate-400 bg-slate-800 border-slate-700' },
};

export default function DiscoveryCard({ disc, onEvaluate }) {
  const [expanded, setExpanded] = useState(false);
  const conviction = CONVICTION_META[disc.conviction] ?? CONVICTION_META.LOW;
  const market     = MARKET_BADGE[disc.market]     ?? MARKET_BADGE.Other;

  const ts = disc.evaluation_timestamp
    ? new Date(disc.evaluation_timestamp).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 hover:border-slate-700 transition-colors duration-150 h-full">

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold tracking-widest text-slate-100 font-mono">
              {disc.ticker}
            </span>
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded-full border ${conviction.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${conviction.dot}`} />
              {disc.conviction} conviction
            </span>
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border ${market.cls}`}>
              {market.label}
            </span>
          </div>
          {disc.company_name && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{disc.company_name}</p>
          )}
        </div>

        {disc.estimated_recognition_lag_weeks != null && (
          <Tooltip
            width={236}
            align="right"
            content={`AI expects this linked-share idea may take about ${disc.estimated_recognition_lag_weeks} weeks to show up in price action. It is an estimate, not a guarantee.`}
          >
            <div className="shrink-0 flex flex-col items-center bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 cursor-help hover:border-purple-500/30 transition-colors">
              <Clock size={11} className="text-purple-400 mb-0.5" />
              <span className="text-sm font-bold text-slate-100 tabular-nums leading-none">
                {disc.estimated_recognition_lag_weeks}w
              </span>
              <span className="text-xs text-slate-500 leading-none mt-0.5">play out</span>
            </div>
          </Tooltip>
        )}
      </div>

      {/* Catalyst origin */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Zap size={10} className="text-purple-400 shrink-0" />
        <span>Discovered via</span>
        <span className="font-mono font-bold text-purple-300">{disc.primary_ticker}</span>
        {ts && <span className="text-slate-600">· {ts}</span>}
      </div>

      {/* Causal chain */}
      {disc.causal_chain && (
        <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Why AI found this</p>
          <p className={`text-xs text-slate-300 leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>
            {disc.causal_chain}
          </p>
          {disc.causal_chain.length > 120 && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-xs text-purple-400 hover:text-purple-300 mt-1 transition-colors"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* Crowd attention + risk caveat */}
      <div className="flex items-center gap-2 flex-wrap">
        {disc.crowd_attention_level && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
            disc.crowd_attention_level === 'LOW'
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              : disc.crowd_attention_level === 'MEDIUM'
              ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
          }`}>
            {disc.crowd_attention_level} crowd attention
          </span>
        )}
      </div>

      {disc.risk_caveat && (
        <div className="flex items-start gap-1.5">
          <AlertCircle size={10} className="text-rose-400/60 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-400 leading-relaxed">{disc.risk_caveat}</p>
        </div>
      )}

      {/* Evaluate CTA */}
      {onEvaluate && (
        <button
          onClick={() => onEvaluate(disc.ticker)}
          className="mt-auto flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-purple-300 hover:text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/30 rounded-lg px-3 py-2 transition-colors"
        >
          Evaluate {disc.ticker}
          <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
}
