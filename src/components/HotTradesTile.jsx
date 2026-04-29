import { TrendingUp, TrendingDown, Info, AlertTriangle } from 'lucide-react';
import CircularProgress from './CircularProgress';

export default function HotTradesTile({ item, onEvaluate }) {
  const isBullish  = item.direction === 'BULLISH';
  const score      = item.alpha_score;
  const verified   = item.ticker_verified !== false; // default true for old rows

  return (
    <div
      onClick={() => onEvaluate && onEvaluate(item.ticker)}
      className={`relative bg-slate-900 border rounded-xl p-3 flex flex-col gap-2 cursor-pointer select-none transition-all duration-150 hover:scale-[1.02] hover:shadow-lg active:scale-100 ${
        isBullish
          ? 'border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/5'
          : 'border-rose-500/20 hover:border-rose-500/40 hover:bg-rose-500/5'
      }`}
    >
      {/* Info tooltip */}
      <div
        className="absolute top-2 right-2 group z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="w-4 h-4 rounded-full border border-slate-700 bg-slate-800 hover:border-slate-500 flex items-center justify-center transition-colors"
          tabIndex={-1}
          aria-label="Why this stock?"
        >
          <Info size={9} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
        </button>

        <div
          className="pointer-events-none absolute bottom-full right-0 mb-2 w-60 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 shadow-2xl text-left">
            {item.catalyst_event && (
              <>
                <p className="text-[9px] font-bold text-amber-400 uppercase tracking-wider mb-1">Catalyst</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">{item.catalyst_event}</p>
              </>
            )}
            {item.intraday_thesis && (
              <>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-2 mb-1">Thesis</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">{item.intraday_thesis}</p>
              </>
            )}
            {item.key_risk && (
              <>
                <p className="text-[9px] font-bold text-rose-400 uppercase tracking-wider mt-2 mb-1">Key Risk</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">{item.key_risk}</p>
              </>
            )}
          </div>
          <div className="absolute -bottom-1 right-2 w-2 h-2 bg-slate-800 border-b border-r border-slate-600 rotate-45" />
        </div>
      </div>

      {/* Ticker row */}
      <div className="flex items-center gap-1.5 pr-5 min-w-0">
        {isBullish
          ? <TrendingUp  size={11} className="text-emerald-400 shrink-0" />
          : <TrendingDown size={11} className="text-rose-400 shrink-0" />
        }
        {verified ? (
          <span className="text-sm font-bold font-mono tracking-wider text-slate-100 leading-none truncate">
            {item.ticker}
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-slate-300 leading-tight truncate" title={`Unverified ticker: ${item.ticker}`}>
            {item.company_name || item.ticker}
            <AlertTriangle size={8} className="inline ml-1 text-amber-500 shrink-0" />
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-slate-800" />

      {/* Split: left = indicators, right = circular alpha */}
      <div className="flex items-center gap-2">

        {/* Left - direction + confidence + expected move */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <span className={`self-start text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
            isBullish
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
          }`}>
            {isBullish ? '▲ BULL' : '▼ BEAR'}
          </span>

          {item.confidence && (
            <span className={`self-start text-[8px] font-semibold px-1 py-0.5 rounded border ${
              item.confidence === 'HIGH'
                ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                : item.confidence === 'MEDIUM'
                ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                : 'text-slate-500 bg-slate-800 border-slate-700'
            }`}>
              {item.confidence}
            </span>
          )}

          {item.expected_move_pct != null && (
            <span className={`text-[10px] font-mono tabular-nums font-semibold ${
              isBullish ? 'text-emerald-500' : 'text-rose-500'
            }`}>
              {isBullish ? '+' : ''}{item.expected_move_pct}%
            </span>
          )}
        </div>

        {/* Right - circular alpha score */}
        <div className="shrink-0">
          <CircularProgress score={score ?? 0} size={52} />
        </div>
      </div>
    </div>
  );
}
