import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Loader2, Sparkles } from 'lucide-react';
import { MARKETS, detectMarket } from '../utils/market';
import { US_ENABLED, DEFAULT_MARKET } from '../utils/launch';

const QUICK = {
  US: ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN'],
  IN: ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'WIPRO'],
};

/**
 * AnalyzeSearch - input row used on the Analyze page.
 *
 * Two visual variants share the same logic so the search box can morph from
 * a centered hero into a top-of-page bar after the first analyze:
 *   - variant="hero"     - large, centered, prominent
 *   - variant="compact"  - slim bar at the top of the result view
 *
 * Calls `onAnalyze({ ticker, market })` when the user submits.
 *
 * `ctaLabel` / `ctaIcon` let the parent override the button when the user
 * isn't authenticated yet (e.g. "Sign in to analyze").
 */
export default function AnalyzeSearch({
  variant       = 'hero',
  loading       = false,
  initialTicker = '',
  initialMarket,
  onAnalyze,
  ctaLabel      = 'Analyze with AI',
  ctaIcon: CtaIcon = Sparkles,
}) {
  const [market, setMarket] = useState(() => {
    if (!US_ENABLED) return 'IN';
    return initialMarket ?? detectMarket();
  });
  const [ticker, setTicker] = useState(initialTicker);
  const inputRef = useRef(null);

  useEffect(() => {
    if (initialTicker && initialTicker !== ticker) setTicker(initialTicker);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTicker]);

  useEffect(() => {
    if (US_ENABLED && initialMarket && initialMarket !== market) setMarket(initialMarket);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMarket]);

  const submit = (override) => {
    const raw = (override ?? ticker).trim().toUpperCase();
    if (!raw) return;
    const sym = market === 'IN' && !raw.includes('.') ? `${raw}.NS` : raw;
    onAnalyze?.({ ticker: sym, market });
  };

  const isHero = variant === 'hero';
  const wrapperCls = isHero
    ? 'w-full max-w-2xl flex flex-col gap-4'
    : 'w-full flex flex-col gap-2';
  const inputCls = isHero
    ? 'flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-base text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50'
    : 'flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50';
  const btnCls = isHero
    ? 'shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 text-base font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-colors'
    : 'shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 border border-emerald-500/30 text-emerald-400 text-sm font-medium rounded-lg transition-colors';

  return (
    <div className={wrapperCls}>
      <div className="flex gap-2">
        {/* Market - locked to India during launch unless US_ENABLED */}
        {US_ENABLED ? (
          <div className="relative shrink-0">
            <select
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              disabled={loading}
              className={
                isHero
                  ? 'appearance-none bg-slate-950 border border-slate-700 rounded-xl pl-3 pr-7 py-3.5 text-base text-slate-100 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50 cursor-pointer font-mono'
                  : 'appearance-none bg-slate-950 border border-slate-700 rounded-lg pl-3 pr-7 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50 cursor-pointer font-mono'
              }
            >
              {MARKETS.map((m) => (
                <option key={m.value} value={m.value}>{m.flag} {m.label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        ) : (
          <span
            title="Currently India-only - US support coming soon"
            className={
              isHero
                ? 'shrink-0 inline-flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-base font-mono text-slate-300'
                : 'shrink-0 inline-flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-300'
            }
          >
            🇮🇳 IN
          </span>
        )}

        <input
          ref={inputRef}
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={market === 'IN' ? 'RELIANCE · TCS · INFY' : 'AAPL · TSLA · NVDA'}
          disabled={loading}
          className={inputCls}
          autoFocus={isHero}
        />

        <button
          type="button"
          onClick={() => submit()}
          disabled={loading || !ticker.trim()}
          className={btnCls}
        >
          {loading ? <Loader2 size={isHero ? 18 : 14} className="animate-spin" /> : <CtaIcon size={isHero ? 16 : 14} />}
          {loading ? 'Analyzing…' : ctaLabel}
        </button>
      </div>

      {isHero && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-600 font-medium">Try:</span>
          {(QUICK[market] ?? QUICK[DEFAULT_MARKET]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTicker(t); submit(t); }}
              disabled={loading}
              className="text-xs text-slate-400 hover:text-emerald-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/30 rounded-full px-3 py-1 transition-colors disabled:opacity-40 font-mono"
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
