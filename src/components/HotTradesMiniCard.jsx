import { TrendingUp, TrendingDown, Zap } from 'lucide-react';

function scoreColor(score) {
  if (score == null) return 'text-slate-500';
  if (score >= 65)   return 'text-emerald-400';
  if (score >= 45)   return 'text-amber-400';
  return 'text-rose-400';
}

function scoreBg(score) {
  if (score == null) return 'bg-slate-800 border-slate-700';
  if (score >= 65)   return 'bg-emerald-500/10 border-emerald-500/25';
  if (score >= 45)   return 'bg-amber-500/10 border-amber-500/25';
  return 'bg-rose-500/10 border-rose-500/25';
}

const CONFIDENCE_DOT = {
  HIGH:   'bg-emerald-400',
  MEDIUM: 'bg-amber-400',
  LOW:    'bg-slate-500',
};

export default function HotTradesMiniCard({ item, onEvaluate }) {
  const isBullish = item.direction === 'BULLISH';

  return (
    <div
      className={`bg-slate-900 border rounded-xl p-3.5 flex flex-col gap-2.5 h-full cursor-default transition-colors duration-150 ${
        isBullish
          ? 'border-emerald-500/20 hover:border-emerald-500/35'
          : 'border-rose-500/20 hover:border-rose-500/35'
      }`}
    >
      {/* Top row: ticker + direction + alpha score */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isBullish
            ? <TrendingUp  size={13} className="text-emerald-400 shrink-0" />
            : <TrendingDown size={13} className="text-rose-400 shrink-0" />
          }
          <span className="text-base font-bold tracking-widest text-slate-100 font-mono leading-none">
            {item.ticker}
          </span>
          {item.confidence && (
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${CONFIDENCE_DOT[item.confidence] ?? 'bg-slate-500'}`} />
          )}
        </div>

        {/* Alpha score pill */}
        <div className={`shrink-0 flex flex-col items-center rounded-lg px-2 py-1 border ${scoreBg(item.alpha_score)}`}>
          <span className={`text-sm font-bold tabular-nums leading-none ${scoreColor(item.alpha_score)}`}>
            {item.alpha_score != null ? item.alpha_score.toFixed(1) : '—'}
          </span>
          <span className="text-[9px] text-slate-600 leading-none mt-0.5">α</span>
        </div>
      </div>

      {/* Company name */}
      {item.company_name && (
        <p className="text-[10px] text-slate-500 truncate leading-tight">{item.company_name}</p>
      )}

      {/* Direction + expected move */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
          isBullish
            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
        }`}>
          {isBullish ? '▲' : '▼'} {item.direction}
        </span>
        {item.expected_move_pct != null && (
          <span className={`text-[10px] font-mono tabular-nums ${isBullish ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isBullish ? '+' : ''}{item.expected_move_pct}%
          </span>
        )}
        {item.current_price != null && (
          <span className="text-[10px] text-slate-600 font-mono tabular-nums">
            ${item.current_price.toFixed(2)}
          </span>
        )}
      </div>

      {/* Catalyst snippet */}
      {item.catalyst_event && (
        <div className="flex items-start gap-1.5">
          <Zap size={9} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
            {item.catalyst_event}
          </p>
        </div>
      )}

      {/* Evaluate CTA */}
      {onEvaluate && (
        <button
          onClick={() => onEvaluate(item.ticker)}
          className={`mt-auto w-full text-[11px] font-semibold rounded-lg px-2 py-1.5 border transition-colors ${
            isBullish
              ? 'text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/20 hover:border-emerald-500/30'
              : 'text-rose-300 bg-rose-500/10 hover:bg-rose-500/15 border-rose-500/20 hover:border-rose-500/30'
          }`}
        >
          Evaluate {item.ticker}
        </button>
      )}
    </div>
  );
}
