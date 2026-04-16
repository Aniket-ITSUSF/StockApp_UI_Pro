import { useState } from 'react';
import { ChevronDown, ChevronUp, Brain, TrendingUp, TrendingDown, Minus, ShieldX } from 'lucide-react';
import CircularProgress from './CircularProgress';
import AgentVoteGrid from './AgentVoteGrid';
import Tooltip from './Tooltip';
import SentimentModal from './SentimentModal';

const ACTION_BADGE = {
  // ── Legacy vote-pipeline actions ──────────────────────────────────────────
  EXECUTED:                  { text: 'EXECUTED',        cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
  REJECTED_CONSENSUS:        { text: 'REJECTED',        cls: 'bg-rose-500/10    text-rose-400    border-rose-500/25' },
  REJECTED_CONSENSUS_REGIME: { text: 'REGIME BLOCK',   cls: 'bg-rose-500/10    text-rose-400    border-rose-500/25' },
  REJECTED_RISK:             { text: 'RISK BLOCK',     cls: 'bg-rose-500/10    text-rose-400    border-rose-500/25' },
  REJECTED_MTF:              { text: 'MTF BLOCK',      cls: 'bg-amber-500/10   text-amber-400   border-amber-500/25' },
  // ── Cognitive-wing actions ────────────────────────────────────────────────
  BUY:                       { text: 'BUY',            cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
  HOLD:                      { text: 'BELOW THRESHOLD', cls: 'bg-amber-500/10  text-amber-400   border-amber-500/25' },
  REJECTED_COGNITIVE:        { text: 'COGNITIVE VETO', cls: 'bg-purple-500/10  text-purple-400  border-purple-500/25' },
};

const ALPHA_TIP =
  'Weighted composite score of all Tier-1 agent votes, normalized to 0–100. ' +
  'A score ≥ 65 is required to proceed to the MTF and Risk veto gates. ' +
  'Green ≥ 65 · Amber ≥ 40 · Red < 40.';

const VIX_TIP =
  'The CBOE Volatility Index (^VIX) measures expected 30-day market volatility. ' +
  'VIX > 20 shifts agent weights toward mean-reversion strategies. ' +
  'VIX > 30 (US) or > 25 (India) triggers HIGH_VOLATILITY regime.';

const REGIME_TIP = {
  TRENDING:        'Low volatility, trend-following weights active. Momentum and Complex Pullback agents carry more influence.',
  MEAN_REVERTING:  'Moderate volatility. Mean Reversion agent is up-weighted; momentum signals are discounted.',
  HIGH_VOLATILITY: 'Elevated VIX. System shifts to defensive mean-reversion stance. Fewer trades will clear the threshold.',
};

function buildReasoning(ev) {
  const parts = [];
  if (ev.regime)            parts.push(`Regime: ${ev.regime}`);
  if (ev.vix_level != null) parts.push(`VIX: ${ev.vix_level.toFixed(2)}`);
  if (ev.mtf_status)        parts.push(`MTF: ${ev.mtf_status}`);
  const score = ev.final_alpha_score ?? ev.total_consensus_score;
  if (score != null) {
    const display = score > 1 ? score.toFixed(1) : (score * 100).toFixed(1);
    parts.push(`Alpha Score: ${display}`);
  }
  if (ev.required_threshold) parts.push(`Required: ${ev.required_threshold}`);
  return parts.length ? parts.join(' · ') : 'No additional context available.';
}

const SENTIMENT_META = {
  BULLISH:   { label: 'Bullish',   cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25', Icon: TrendingUp  },
  NEUTRAL:   { label: 'Neutral',   cls: 'text-amber-400   bg-amber-500/10   border-amber-500/25',   Icon: Minus       },
  BEARISH:   { label: 'Bearish',   cls: 'text-rose-400    bg-rose-500/10    border-rose-500/25',    Icon: TrendingDown },
  HARD_VETO: { label: 'Hard Veto', cls: 'text-rose-300    bg-rose-900/40    border-rose-500/40',    Icon: ShieldX     },
};

export default function EvaluationCard({ evaluation: ev }) {
  const [open, setOpen]             = useState(false);
  const [showSentiment, setShowSentiment] = useState(false);
  if (!ev) return null;

  const action = ev.action_taken ?? 'REJECTED_CONSENSUS';
  const badge  = ACTION_BADGE[action] ?? ACTION_BADGE.REJECTED_CONSENSUS;

  const rawScore = ev.final_alpha_score ?? ev.total_consensus_score ?? 0;
  const alpha    = rawScore > 1 ? rawScore : rawScore * 100;

  const ts = ev.timestamp
    ? new Date(ev.timestamp).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null;

  const reasoning = ev.reasoning ?? buildReasoning(ev);
  const regimeTip = REGIME_TIP[ev.regime] ?? 'Current market state determines agent vote weighting.';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 hover:border-slate-700 transition-colors duration-150">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold tracking-widest text-slate-100 font-mono">
              {ev.ticker}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badge.cls}`}>
              {badge.text}
            </span>
          </div>
          {ts && <span className="text-xs text-slate-500">{ts}</span>}
        </div>

        {/* Alpha score with tooltip */}
        <Tooltip content={ALPHA_TIP} width="w-60" align="right">
          <div className="flex flex-col items-center shrink-0 cursor-default">
            <CircularProgress score={alpha} size={68} />
            <span className="text-[10px] text-slate-500 mt-1 font-medium">ALPHA</span>
          </div>
        </Tooltip>
      </div>

      {/* Context badges */}
      {(ev.regime || ev.vix_level != null) && (
        <div className="flex items-center gap-2 flex-wrap">
          {ev.regime && (
            <Tooltip content={regimeTip} width="w-60" position="bottom">
              <span className="cursor-default text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
                {ev.regime}
              </span>
            </Tooltip>
          )}
          {ev.vix_level != null && (
            <Tooltip content={VIX_TIP} width="w-60" position="bottom">
              <span className={`cursor-default text-xs font-medium px-2 py-0.5 rounded-full border ${
                ev.vix_level > 20
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                VIX {ev.vix_level.toFixed(1)}
              </span>
            </Tooltip>
          )}
        </div>
      )}

      {/* Sentiment strip */}
      {ev.cognitive_signal && (
        <>
          {showSentiment && (
            <SentimentModal ev={ev} onClose={() => setShowSentiment(false)} />
          )}
          <button
            onClick={() => setShowSentiment(true)}
            className="w-full flex items-center justify-between gap-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-lg px-3 py-2 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Brain size={12} className="text-purple-400 shrink-0" />
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Sentiment</span>
              {(() => {
                const m = SENTIMENT_META[ev.cognitive_signal] ?? SENTIMENT_META.NEUTRAL;
                const { Icon } = m;
                return (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${m.cls}`}>
                    <Icon size={9} />
                    {m.label}
                  </span>
                );
              })()}
              {ev.sentiment_score != null && (
                <span className="text-[10px] font-mono text-slate-400">
                  {ev.sentiment_score >= 0 ? '+' : ''}{ev.sentiment_score.toFixed(2)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors">View analysis →</span>
          </button>
        </>
      )}

      {/* Agent voting grid */}
      <AgentVoteGrid evaluation={ev} />

      {/* Expandable reasoning */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors w-fit"
      >
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        Reasoning
      </button>
      {open && (
        <div className="bg-slate-950 rounded-lg px-3 py-2.5 text-xs text-slate-400 leading-relaxed border border-slate-800">
          {reasoning}
        </div>
      )}
    </div>
  );
}
