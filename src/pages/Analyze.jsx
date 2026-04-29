import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Sparkles, Brain, Radar, Loader2, Lock, LogIn, Crown, Target } from 'lucide-react';

import AnalyzeSearch from '../components/AnalyzeSearch';
import AgentScoreboard from '../components/AgentScoreboard';
import CircularProgress from '../components/CircularProgress';
import LockedCard from '../components/LockedCard';
import SentimentStrip from '../components/SentimentStrip';
import Tooltip from '../components/Tooltip';

import {
  evaluateTickerFast,
  evaluateTickerSentiment,
  evaluateTickerDiscovery,
} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { describeApiError, extractUpgradeHint, DEFAULT_MARKET } from '../utils/launch';

const ACTION_BADGE = {
  EXECUTED:                  { text: 'EXECUTED',       cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
  REJECTED_CONSENSUS:        { text: 'REJECTED',       cls: 'bg-rose-500/10    text-rose-400    border-rose-500/25'    },
  REJECTED_CONSENSUS_REGIME: { text: 'REGIME BLOCK',   cls: 'bg-rose-500/10    text-rose-400    border-rose-500/25'    },
  REJECTED_RISK:             { text: 'RISK BLOCK',     cls: 'bg-rose-500/10    text-rose-400    border-rose-500/25'    },
  REJECTED_MTF:              { text: 'MTF BLOCK',      cls: 'bg-amber-500/10   text-amber-400   border-amber-500/25'   },
  BUY:                       { text: 'BUY',            cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
  HOLD:                      { text: 'HOLD',           cls: 'bg-amber-500/10   text-amber-400   border-amber-500/25'   },
  REJECTED_COGNITIVE:        { text: 'COGNITIVE VETO', cls: 'bg-purple-500/10  text-purple-400  border-purple-500/25'  },
  ANALYZING:                 { text: 'ANALYZING',      cls: 'bg-purple-500/10  text-purple-300  border-purple-500/25'  },
};

function mapFastResult(d, sym) {
  return {
    ...d,
    ticker: sym,
    momentum_vote:          d.votes?.find(v => v.agent_name === 'momentum')?.vote,
    mean_reversion_vote:    d.votes?.find(v => v.agent_name === 'mean_reversion')?.vote,
    support_vote:           d.votes?.find(v => v.agent_name === 'support_resistance')?.vote,
    relative_strength_vote: d.votes?.find(v => v.agent_name === 'relative_strength')?.vote,
    complex_pullback_vote:  d.votes?.find(v => v.agent_name === 'complex_pullback')?.vote,
    stat_arb_vote:          d.stat_arb_vote?.vote,
    failure_test_vote:      d.failure_test_vote?.vote,
    final_alpha_score:      d.final_weighted_alpha_score ?? d.weighted_alpha_score,
    reasoning:              d.reasoning ?? d.decision_reason,
    oracle:                 d.oracle_prediction ?? null,
  };
}

/**
 * Analyze - public route. Guests see the hero; signed-in users get the full
 * 3-stage parallel evaluation: math (fast) → sentiment + discovery in parallel.
 *
 * Stage 1: POST /evaluate/{ticker}/fast   - math only, instant for all tiers.
 * Stage 2: POST /evaluate/{ticker}/sentiment - cache-first; 402 for free on miss.
 * Stage 3: POST /evaluate/{ticker}/discovery - Pro+ only.
 *
 * Stages 2 and 3 fire in parallel after Stage 1. Each has its own loading state
 * so a slow or failed AI call never blocks the math results from showing.
 */
export default function Analyze() {
  const { profile, isAuthenticated, tier, isPro } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const evalUsage = profile?.usage_summary?.usage?.evaluations ?? null;

  // ── Per-stage state ───────────────────────────────────────────────────────
  const [result,          setResult]          = useState(null);  // fast eval (math)
  const [sentiment,       setSentiment]       = useState(null);  // {payload} | {locked,hint} | null
  const [discovery,       setDiscovery]       = useState(null);  // discovery payload | null
  const [loading,         setLoading]         = useState(false); // fast eval loading
  const [sentLoading,     setSentLoading]     = useState(false); // sentiment loading
  const [discoveryLoading,setDiscoveryLoading]= useState(false); // discovery loading
  const [error,           setError]           = useState(null);
  const [pageUpgrade,     setPageUpgrade]     = useState(null);  // page-level upgrade hint

  const initialTicker = searchParams.get('ticker') ?? '';
  const initialMarket = searchParams.get('market') ?? undefined;

  const run = useCallback(async ({ ticker, market }) => {
    if (!isAuthenticated) {
      navigate('/sign-in', { state: { from: `/analyze?ticker=${encodeURIComponent(ticker)}` } });
      return;
    }
    setError(null);
    setPageUpgrade(null);
    setResult(null);
    setSentiment(null);
    setDiscovery(null);
    setLoading(true);
    setSentLoading(false);
    setDiscoveryLoading(false);
    setSearchParams({ ticker, market }, { replace: true });

    // ── Stage 1: math-only fast eval ─────────────────────────────────────────
    let fastData;
    try {
      const res = await evaluateTickerFast(ticker);
      fastData = mapFastResult(res.data, ticker);
      setResult(fastData);
    } catch (err) {
      setError(describeApiError(err, 'Evaluation failed'));
      setLoading(false);
      return;
    } finally {
      setLoading(false);
    }

    // ── Stages 2 & 3: fire in parallel after fast eval ────────────────────────
    // Neither call blocks the other. Failures are handled per-section.
    setSentLoading(true);
    const sentPromise = evaluateTickerSentiment(ticker)
      .then(res => setSentiment({ payload: res.data }))
      .catch(err => {
        const hint = extractUpgradeHint(err);
        if (hint) {
          setSentiment({ locked: true, hint });
        } else {
          setSentiment({ error: describeApiError(err, 'Sentiment unavailable') });
        }
      })
      .finally(() => setSentLoading(false));

    const discPromise = isPro
      ? (() => {
          setDiscoveryLoading(true);
          return evaluateTickerDiscovery(ticker)
            .then(res => setDiscovery({ payload: res.data }))
            .catch(() => setDiscovery({ error: true }))
            .finally(() => setDiscoveryLoading(false));
        })()
      : Promise.resolve();

    await Promise.all([sentPromise, discPromise]);
  }, [isAuthenticated, isPro, navigate, setSearchParams]);

  useEffect(() => {
    if (initialTicker && isAuthenticated && !result && !loading) {
      run({ ticker: initialTicker, market: initialMarket ?? DEFAULT_MARKET });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTicker, isAuthenticated]);

  const showHero = !result && !loading && !error && !pageUpgrade;

  return (
    <div className="min-h-full flex flex-col">
      {showHero ? (
        <Hero
          isAuthenticated={isAuthenticated}
          loading={loading}
          onAnalyze={run}
          quota={isAuthenticated ? evalUsage : null}
          tier={tier}
        />
      ) : (
        <div className="p-4 sm:p-6 flex flex-col gap-6">

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <AnalyzeSearch
              variant="compact"
              loading={loading}
              initialTicker={initialTicker}
              initialMarket={initialMarket}
              onAnalyze={run}
              ctaLabel={isAuthenticated ? 'Analyze with AI' : 'Sign in to analyze'}
            />
          </div>

          {isAuthenticated && evalUsage && (
            <QuotaStrip usage={evalUsage} tier={tier} />
          )}

          {error && (
            <div className="flex items-start gap-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{String(error)}</span>
            </div>
          )}

          {pageUpgrade && (
            <UpgradePrompt hint={pageUpgrade} onDismiss={() => setPageUpgrade(null)} />
          )}

          {loading && !result && (
            <div className="flex items-center justify-center gap-3 text-sm text-slate-400 bg-slate-900 border border-slate-800 rounded-xl px-4 py-12">
              <Loader2 size={18} className="animate-spin text-emerald-400" />
              Running math committee on live market data…
            </div>
          )}

          {result && (
            <AnalyzeResult
              ev={result}
              sentiment={sentiment}
              discovery={discovery}
              sentLoading={sentLoading}
              discoveryLoading={discoveryLoading}
              isPro={isPro}
              tier={tier}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function Hero({ isAuthenticated, loading, onAnalyze, quota, tier }) {
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
          <Sparkles size={18} />
        </span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 text-center tracking-tight">
        Your AI Quant Researcher
      </h1>
      <p className="text-sm sm:text-base text-slate-500 mt-3 mb-8 text-center max-w-lg">
        Enter an Indian stock ticker - our 8-agent committee will run a full technical
        breakdown, news-sentiment analysis, and discovery scan in seconds.
      </p>

      <AnalyzeSearch
        variant="hero"
        loading={loading}
        onAnalyze={onAnalyze}
        ctaLabel={isAuthenticated ? 'Analyze with AI' : 'Sign in to analyze'}
        ctaIcon={isAuthenticated ? Sparkles : LogIn}
      />

      {isAuthenticated && quota && (
        <div className="mt-6">
          <QuotaStrip usage={quota} tier={tier} />
        </div>
      )}

      {!isAuthenticated && (
        <button
          onClick={() => navigate('/sign-up')}
          className="mt-6 text-xs text-slate-500 hover:text-emerald-300 transition-colors"
        >
          New here?{' '}
          <span className="text-emerald-400 font-semibold underline-offset-2 hover:underline">
            Create your free account →
          </span>
        </button>
      )}
    </div>
  );
}

function QuotaStrip({ usage, tier }) {
  const { used = 0, limit } = usage;
  const remaining = limit == null ? Infinity : Math.max(0, limit - used);
  const pct       = limit == null ? 0 : Math.min(100, (used / limit) * 100);
  const exhausted = limit != null && remaining <= 0;
  const low       = limit != null && !exhausted && remaining <= 2;

  return (
    <div
      className={`w-full max-w-2xl mx-auto rounded-xl border px-4 py-2.5 flex items-center gap-3 ${
        exhausted ? 'bg-rose-500/5 border-rose-500/25'
        : low     ? 'bg-amber-500/5 border-amber-500/25'
                  : 'bg-slate-900 border-slate-800'
      }`}
    >
      <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 shrink-0">
        {tier === 'free' ? 'Free plan' : `${tier.toUpperCase()} plan`}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-[11px] font-semibold">
          <span className={exhausted ? 'text-rose-400' : low ? 'text-amber-300' : 'text-slate-300'}>
            {limit == null ? `${used} analyses this month · unlimited`
             : exhausted   ? `0 analyses left - limit reached`
                           : `${remaining} of ${limit} analyses left this month`}
          </span>
        </div>
        {limit != null && (
          <div className="mt-1.5 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${exhausted ? 'bg-rose-500' : low ? 'bg-amber-400' : 'bg-emerald-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function UpgradePrompt({ hint, onDismiss }) {
  const navigate = useNavigate();
  const Icon = hint.kind === 'quota' ? Lock : Sparkles;
  return (
    <div className="rounded-xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 to-amber-500/5 px-4 py-4 flex items-start gap-3">
      <span className="shrink-0 w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
        <Icon size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-200">{hint.message}</p>
        {hint.kind === 'quota' && (
          <p className="text-xs text-slate-400 mt-1">
            Used {hint.used} of {hint.limit} on the {hint.currentTier} plan this month.
          </p>
        )}
        {hint.kind === 'tier' && (
          <p className="text-xs text-slate-400 mt-1">
            This feature requires the <strong className="text-slate-200">{hint.requiredTier}</strong> plan.
          </p>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={onDismiss} className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1.5">
          Dismiss
        </button>
        <button
          onClick={() => navigate('/plans')}
          className="text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-300 to-yellow-300 hover:from-amber-200 rounded-lg px-3 py-1.5 transition-colors shadow-sm"
        >
          See Plans →
        </button>
      </div>
    </div>
  );
}

// ── Options Oracle — compact inline cones (inside verdict card) ──────────────

const CONE_FRAMES = [
  { key: '1_day',  label: '1D', proOnly: false },
  { key: '7_day',  label: '7D', proOnly: true  },
  { key: '30_day', label: '30D', proOnly: true  },
];

function fmt(n) {
  return n == null ? '—' : n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function OracleCones({ oracle, tier }) {
  const navigate = useNavigate();
  if (!oracle?.current_price) return null;

  const isPro = tier === 'pro' || tier === 'ultra';

  return (
    <div className="flex flex-col gap-2.5 border-l border-slate-700/60 pl-4 sm:pl-6 min-w-[190px]">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
        <Target size={10} className="text-cyan-500" />
        Implied Move
      </span>

      {CONE_FRAMES.map(({ key, label, proOnly }) => {
        const frame = oracle[key];
        const locked = (proOnly && !isPro) || frame === 'LOCKED_PRO_TIER';

        if (locked) {
          return (
            <Tooltip
              key={key}
              content="Unlock 7-day and 30-day probability cones with Pro"
              position="top"
            >
              <button
                onClick={() => navigate('/plans')}
                className="flex items-center gap-2.5 group"
              >
                <span className="text-xs font-bold text-slate-600 w-6">{label}</span>
                <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded border bg-amber-500/10 text-amber-500/60 border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                  <Crown size={9} /> Pro
                </span>
              </button>
            </Tooltip>
          );
        }

        if (!frame || typeof frame !== 'object') return null;

        const { upper, lower, move_pct, atm_iv, dte, expiry } = frame;
        const movePct = (move_pct * 100).toFixed(2);
        const pctColor = move_pct * 100 > 3
          ? 'text-rose-400'
          : move_pct * 100 > 1
            ? 'text-amber-400'
            : 'text-emerald-400';

        return (
          <Tooltip
            key={key}
            content={`IV ${(atm_iv * 100).toFixed(1)}% · expires ${expiry} · ${dte} DTE · 68% probability range`}
            position="top"
            width={230}
          >
            <div className="flex items-baseline gap-2 cursor-default">
              <span className="text-xs font-bold text-slate-500 w-6 shrink-0">{label}</span>
              <span className="text-sm font-mono font-semibold text-rose-300">{fmt(lower)}</span>
              <span className="text-xs text-slate-600">→</span>
              <span className="text-sm font-mono font-semibold text-emerald-300">{fmt(upper)}</span>
              <span className={`text-xs font-bold ml-auto tabular-nums ${pctColor}`}>±{movePct}%</span>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}

// ── Regime / VIX label with color coding ────────────────────────────────────

function RegimeLabel({ regime, vix, threshold }) {
  const r = (regime ?? '').toUpperCase();
  const color = r.includes('CALM')
    ? 'text-emerald-400'
    : r.includes('NORMAL')
      ? 'text-amber-400'
      : r.includes('VOLATILE') || r.includes('HIGH')
        ? 'text-rose-400'
        : 'text-slate-400';

  const tooltip = r.includes('CALM')
    ? 'Low volatility - agent weights favour momentum signals.'
    : r.includes('NORMAL')
      ? 'Moderate volatility - balanced agent weighting across all signals.'
      : r.includes('VOLATILE') || r.includes('HIGH')
        ? 'Elevated volatility - weights shift toward risk management and support.'
        : null;

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 text-xs flex-wrap">
        {regime ? (
          <span className={`font-semibold ${color}`}>{regime} regime</span>
        ) : (
          <span className="text-slate-500">Committee verdict</span>
        )}
        {vix != null && (
          <span className={`font-mono font-semibold ${color}`}>· VIX {vix.toFixed(1)}</span>
        )}
        {threshold != null && (
          <span className="text-slate-500">· target {threshold}</span>
        )}
      </div>
      {tooltip && (
        <p className="text-[10px] text-slate-600 leading-tight">{tooltip}</p>
      )}
    </div>
  );
}

// ── Main result layout ───────────────────────────────────────────────────────

function AnalyzeResult({ ev, sentiment, discovery, sentLoading, discoveryLoading, isPro, tier }) {
  const navigate = useNavigate();
  const action  = ev.action_taken ?? 'REJECTED_CONSENSUS';
  const badge   = ACTION_BADGE[action] ?? ACTION_BADGE.REJECTED_CONSENSUS;
  const rawScore   = ev.final_alpha_score ?? ev.total_consensus_score ?? 0;
  const baseAlpha  = rawScore > 1 ? rawScore : rawScore * 100;

  // Merge sentiment payload into ev for SentimentStrip (it reads ev.cognitive_signal etc.)
  const sentimentPayload = sentiment?.payload ?? null;
  const evWithSentiment  = sentimentPayload ? { ...ev, ...sentimentPayload } : ev;

  // Add cognitive_bonus to alpha once sentiment resolves. While still loading,
  // show the math-only score so the gauge doesn't jump unexpectedly.
  const cogBonus = !sentLoading && sentimentPayload ? (sentimentPayload.cognitive_bonus ?? 0) : 0;
  const alpha    = Math.max(0, Math.min(100, baseAlpha + cogBonus));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ── Left column: verdict card + scoreboard ── */}
      <div className="lg:col-span-2 flex flex-col gap-6">

        <div className="bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 flex items-center gap-6 flex-wrap">
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl font-bold tracking-widest text-slate-100 font-mono">
                {ev.ticker}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${badge.cls}`}>
                {action === 'ANALYZING' && <Loader2 size={11} className="animate-spin" />}
                {badge.text}
              </span>
            </div>
            <RegimeLabel regime={ev.regime} vix={ev.vix_level} threshold={ev.required_threshold} />
            {ev.reasoning && (
              <p className="text-sm text-slate-300 leading-relaxed mt-2 max-w-xl">
                {typeof ev.reasoning === 'string' ? ev.reasoning : JSON.stringify(ev.reasoning)}
              </p>
            )}
          </div>

          {ev.oracle && <OracleCones oracle={ev.oracle} tier={tier} />}

          <Tooltip
            content={
              cogBonus !== 0
                ? `Math score ${baseAlpha.toFixed(0)} + AI sentiment bonus ${cogBonus >= 0 ? '+' : ''}${cogBonus.toFixed(1)} = ${alpha.toFixed(0)}. 65+ clears into BUY territory.`
                : "Weighted composite score from all unlocked agent votes (0–100). 65+ clears into BUY territory."
            }
            width={240}
            align="right"
          >
            <div className="flex flex-col items-center cursor-default">
              <CircularProgress score={alpha} size={92} />
              <span className="text-[10px] text-slate-500 mt-1.5 font-semibold tracking-widest uppercase">Alpha</span>
            </div>
          </Tooltip>
        </div>

        <AgentScoreboard evaluation={ev} tier={tier} />
      </div>

      {/* ── Right column: sentiment + discovery ── */}
      <div className="flex flex-col gap-6">

        {/* AI Sentiment */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
            <Brain size={14} className="text-purple-400" />
            <h3 className="text-sm font-bold text-slate-100">AI Sentiment Analysis</h3>
            {isPro && !sentLoading && (
              <span className="ml-auto text-[10px] uppercase tracking-widest text-emerald-300 font-bold">
                Live · Pro
              </span>
            )}
            {!isPro && sentimentPayload && !sentLoading && (
              <span className="ml-auto text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                Cached · Free
              </span>
            )}
          </div>

          {/* Loading (Pro only - free never enters sentLoading) */}
          {sentLoading && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <SentimentStrip ev={ev} loading={true} />
            </div>
          )}

          {/* Sentiment available (cached or live) */}
          {!sentLoading && sentimentPayload && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
              <SentimentStrip ev={evWithSentiment} loading={false} />
              {!isPro && (
                <p className="text-[11px] text-slate-500 px-1 leading-relaxed">
                  Showing cached analysis.{' '}
                  <button
                    onClick={() => navigate('/plans')}
                    className="text-amber-300 hover:underline"
                  >
                    Upgrade to Pro
                  </button>{' '}
                  for live AI sentiment on every evaluation.
                </p>
              )}
            </div>
          )}

          {/* Free user, no cached sentiment → locked */}
          {!sentLoading && !sentimentPayload && sentiment?.locked && (
            <LockedCard
              title="AI hasn't read the news yet"
              description="Upgrade to Pro so the AI scans the latest headlines, earnings reports, and analyst notes - then scores sentiment as BULLISH, NEUTRAL, or BEARISH before you trade."
              ctaLabel="Unlock AI Sentiment"
            />
          )}

          {/* Error or genuinely unavailable */}
          {!sentLoading && !sentimentPayload && !sentiment?.locked && sentiment?.error && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-4 text-xs text-slate-500 text-center">
              {sentiment.error}
            </div>
          )}

          {/* Not yet fired (should not happen after run()) */}
          {!sentLoading && sentiment === null && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-4 text-xs text-slate-500 text-center">
              Sentiment unavailable for this ticker.
            </div>
          )}
        </section>

        {/* AI Radar - Discovery */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
            <Radar size={14} className="text-purple-400" />
            <h3 className="text-sm font-bold text-slate-100">AI Radar - Dependent Shares</h3>
          </div>

          {/* Free → locked */}
          {!isPro && (
            <LockedCard
              title="See what moves with this stock"
              description={`The Discovery agent finds stocks that historically co-move with ${ev.ticker} - second-order plays and correlated sector bets. Takes a few minutes. Results appear in your Discovery page.`}
              ctaLabel="Unlock AI Radar"
            />
          )}

          {/* Pro+: loading */}
          {isPro && discoveryLoading && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-4 flex items-center gap-2 text-xs text-slate-400">
              <Loader2 size={12} className="animate-spin text-purple-400 shrink-0" />
              AI is searching for stocks linked to{' '}
              <span className="font-mono text-slate-200">{ev.ticker}</span>…
            </div>
          )}

          {/* Pro+: discovery results */}
          {isPro && !discoveryLoading && discovery?.payload && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-4 flex flex-col gap-3">
              {(discovery.payload.discovery_opportunities ?? []).slice(0, 3).map((opp, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-100">{opp.ticker}</span>
                    {opp.conviction && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        opp.conviction === 'HIGH'   ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' :
                        opp.conviction === 'MEDIUM' ? 'text-amber-300 bg-amber-500/10 border-amber-500/30'     :
                                                      'text-slate-400 bg-slate-800 border-slate-700'
                      }`}>{opp.conviction}</span>
                    )}
                  </div>
                  {opp.thesis && (
                    <p className="text-[11px] text-slate-500 leading-relaxed">{opp.thesis}</p>
                  )}
                </div>
              ))}
              <button
                onClick={() => navigate('/discovery')}
                className="mt-1 text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors text-left"
              >
                View full list in Discovery →
              </button>
            </div>
          )}

          {/* Pro+: done but no results */}
          {isPro && !discoveryLoading && !discovery?.payload && discovery !== null && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-4 flex flex-col gap-2">
              <p className="text-xs text-slate-400">
                Discovery agent surfaces stocks that historically move with{' '}
                <span className="font-mono text-slate-200">{ev.ticker}</span>. Results take a few minutes - check your Discovery page.
              </p>
              <button
                onClick={() => navigate('/discovery')}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors text-left"
              >
                Go to Discovery →
              </button>
            </div>
          )}

          {/* Pro+: initial state before discovery fires */}
          {isPro && !discoveryLoading && discovery === null && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-4 text-xs text-slate-500 text-center">
              Discovery unavailable for this ticker.
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
