import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, AlertCircle, Zap, ChevronDown } from 'lucide-react';
import {
  evaluateTickerDiscovery,
  evaluateTickerFast,
  evaluateTickerSentiment,
} from '../services/api';
import EvaluationCard from './EvaluationCard';

const QUICK_TICKERS = {
  US:  ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN'],
  IND: ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'WIPRO'],
};

const MARKETS = [
  { value: 'US',  label: 'US',  flag: '🇺🇸' },
  { value: 'IND', label: 'IND', flag: '🇮🇳' },
];

function detectMarket() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  if (tz.startsWith('Asia/Kolkata') || tz.startsWith('Asia/Calcutta')) return 'IND';
  const lang = navigator.language ?? '';
  if (lang === 'en-IN' || lang.endsWith('-IN')) return 'IND';
  return 'US';
}

function deriveAction(d) {
  if (d.action_taken) return d.action_taken;
  const rawScore = d.final_weighted_alpha_score ?? d.final_alpha_score ?? d.weighted_alpha_score ?? d.total_consensus_score;
  const score = rawScore > 1 ? rawScore : rawScore * 100;
  const threshold = d.required_threshold ?? 65;
  if (score >= threshold && d.mtf_status !== 'VETO') return 'BUY';
  return 'REJECTED_CONSENSUS';
}

function mapVotes(d, sym) {
  const statArbVote = typeof d.stat_arb_vote === 'object'
    ? d.stat_arb_vote?.vote
    : d.stat_arb_vote;
  const failureTestVote = typeof d.failure_test_vote === 'object'
    ? d.failure_test_vote?.vote
    : d.failure_test_vote;

  return {
    ...d,
    ticker: sym,
    momentum_vote:          d.votes?.find(v => v.agent_name === 'momentum')?.vote,
    mean_reversion_vote:    d.votes?.find(v => v.agent_name === 'mean_reversion')?.vote,
    support_vote:           d.votes?.find(v => v.agent_name === 'support_resistance')?.vote,
    relative_strength_vote: d.votes?.find(v => v.agent_name === 'relative_strength')?.vote,
    complex_pullback_vote:  d.votes?.find(v => v.agent_name === 'complex_pullback')?.vote,
    volume_profile_vote:    d.votes?.find(v => v.agent_name === 'volume_profile')?.vote ?? d.volume_profile_vote,
    volume_profile_reasoning: d.votes?.find(v => v.agent_name === 'volume_profile')?.reasoning,
    volume_profile:         d.volume_profile ?? null,
    stat_arb_vote:          statArbVote,
    failure_test_vote:      failureTestVote,
    final_alpha_score:      d.final_weighted_alpha_score ?? d.weighted_alpha_score,
    action_taken:           deriveAction(d),
    reasoning:              d.reasoning ?? d.decision_reason,
    sentiment_score:        d.sentiment_score ?? d.peterson_score,
    decision_path:          d.decision_path ?? null,
  };
}

export default function TickerEvaluator({ onNewEvaluation, onActiveChange, prefilledTicker, onPrefilledConsumed }) {
  const [market, setMarket]           = useState(detectMarket);
  const [ticker, setTicker]           = useState('');
  const [loading, setLoading]         = useState(false);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState(null);
  const inputRef = useRef(null);

  // Emit active = (loading OR result present) so parents can adjust layout (e.g. ad slots)
  useEffect(() => {
    if (onActiveChange) onActiveChange(Boolean(loading || result));
  }, [loading, result, onActiveChange]);

  // Reset result/error when market changes
  useEffect(() => {
    setTicker('');
    setResult(null);
    setError(null);
  }, [market]);

  // Accept pre-filled ticker from Discovery Radar
  useEffect(() => {
    if (!prefilledTicker) return;
    const base = prefilledTicker.replace(/\.(NS|BO)$/, '');
    const isIndian = prefilledTicker.endsWith('.NS') || prefilledTicker.endsWith('.BO');
    if (isIndian) setMarket('IND');
    setTicker(base);
    inputRef.current?.focus();
    if (onPrefilledConsumed) onPrefilledConsumed();
  }, [prefilledTicker]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildSym = (raw) => {
    const base = raw.trim().toUpperCase();
    if (!base) return '';
    // Append .NS for Indian market unless already suffixed
    if (market === 'IND' && !base.includes('.')) return `${base}.NS`;
    return base;
  };

  const run = async (t) => {
    const sym = buildSym(t ?? ticker);
    if (!sym) return;
    setLoading(true);
    setSentimentLoading(false);
    setDiscoveryLoading(false);
    setError(null);
    setResult(null);
    try {
      // Stage 1: math-only fast evaluation - show the card immediately.
      const fastRes = await evaluateTickerFast(sym);
      let latest = mapVotes(fastRes.data, sym);
      const mergeLatest = (patch) => {
        latest = mapVotes({ ...latest, ...patch, ticker: sym }, sym);
        setResult(latest);
      };

      const partial = latest;
      setResult(partial);
      if (onNewEvaluation) onNewEvaluation(partial);
      setLoading(false);

      // Stage 2: sentiment and discovery are independent cache-backed calls.
      setSentimentLoading(true);
      setDiscoveryLoading(true);

      const sentimentPromise = evaluateTickerSentiment(sym)
        .then((res) => {
          mergeLatest(res.data);
        })
        .catch((err) => {
          setError(err.response?.data?.detail ?? err.message ?? 'Sentiment unavailable');
        })
        .finally(() => setSentimentLoading(false));

      const discoveryPromise = evaluateTickerDiscovery(sym)
        .then((res) => {
          const bestDiscovery =
            res.data?.best_discovery ??
            res.data?.best_discovery_opportunity ??
            res.data?.discovery_opportunities?.[0] ??
            null;
          mergeLatest({
            best_discovery: bestDiscovery,
            linked_shares: res.data?.linked_shares ?? res.data?.discovery_opportunities ?? [],
            discovery_report: res.data,
          });
        })
        .catch(() => {
          // Discovery is additive. Keep the technical + sentiment result visible.
        })
        .finally(() => setDiscoveryLoading(false));

      await Promise.all([sentimentPromise, discoveryPromise]);
      if (onNewEvaluation) onNewEvaluation(latest);
    } catch (err) {
      setError(err.response?.data?.detail ?? err.message ?? 'Evaluation failed');
      setResult(null);
    } finally {
      setLoading(false);
      setSentimentLoading(false);
      setDiscoveryLoading(false);
    }
  };

  const quickTickers = QUICK_TICKERS[market] ?? QUICK_TICKERS.US;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2">
        <Zap size={14} className="text-emerald-400" />
        <h3 className="text-sm font-semibold text-slate-100">Live Evaluation</h3>
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        {/* Market dropdown */}
        <div className="relative shrink-0">
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            disabled={loading}
            className="appearance-none bg-slate-950 border border-slate-700 rounded-lg pl-3 pr-7 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50 cursor-pointer font-mono"
          >
            {MARKETS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.flag} {m.label}
              </option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && run()}
          placeholder={market === 'IND' ? 'RELIANCE · TCS · INFY' : 'AAPL · TSLA · NIFTY50.NS'}
          disabled={loading}
          className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50"
        />
        <button
          onClick={() => run()}
          disabled={loading || sentimentLoading || discoveryLoading || !ticker.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 border border-emerald-500/30 text-emerald-400 text-sm font-medium rounded-lg transition-colors shrink-0"
        >
          {loading
            ? <Loader2 size={14} className="animate-spin" />
            : <Search size={14} />}
          {(loading || sentimentLoading || discoveryLoading) ? 'Analyzing…' : 'Evaluate'}
        </button>
      </div>

      {/* Quick picks */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-600 font-medium">Quick:</span>
        {quickTickers.map((t) => (
          <button
            key={t}
            onClick={() => { setTicker(t); run(t); }}
            disabled={loading}
            className="text-xs text-slate-500 hover:text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded px-2 py-0.5 transition-colors disabled:opacity-40 font-mono"
          >
            {t}
          </button>
        ))}
        {market === 'IND' && (
          <span className="text-xs text-slate-600 font-mono ml-1">· auto-appends .NS</span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-950 border border-slate-800 rounded-lg px-3 py-3">
          <Loader2 size={14} className="animate-spin text-emerald-400" />
          Fetching market data and running 11-agent committee…
        </div>
      )}

      {/* Result */}
      {result && (
        <EvaluationCard
          evaluation={result}
          sentimentLoading={sentimentLoading}
          discoveryLoading={discoveryLoading}
        />
      )}
    </div>
  );
}
