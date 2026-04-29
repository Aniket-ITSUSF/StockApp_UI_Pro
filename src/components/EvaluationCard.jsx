import { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import CircularProgress from './CircularProgress';
import AgentVoteGrid from './AgentVoteGrid';
import Tooltip from './Tooltip';
import SentimentStrip from './SentimentStrip';

const ACTION_BADGE = {
  // ── Legacy vote-pipeline actions ──────────────────────────────────────────
  EXECUTED: {
    text: 'EXECUTED',
    cls:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    tip:  'All 10 agents voted, every risk gate was cleared, and the score beat the threshold. This trade was opened in the paper portfolio.',
  },
  REJECTED_CONSENSUS: {
    text: 'REJECTED',
    cls:  'bg-rose-500/10 text-rose-400 border-rose-500/25',
    tip:  'The combined agent score was too low to proceed. Not enough agents agreed on a buy signal - the stock was rejected before the AI news analysis even ran.',
  },
  REJECTED_CONSENSUS_REGIME: {
    text: 'REGIME BLOCK',
    cls:  'bg-rose-500/10 text-rose-400 border-rose-500/25',
    tip:  'High market volatility raised the passing bar. The score wasn\'t strong enough to clear the stricter threshold required during turbulent markets.',
  },
  REJECTED_RISK: {
    text: 'RISK BLOCK',
    cls:  'bg-rose-500/10 text-rose-400 border-rose-500/25',
    tip:  'The stock was too volatile to trade safely. The nearest logical stop-loss would have risked more than 8% of capital - the Risk Manager blocked it.',
  },
  REJECTED_MTF: {
    text: 'MTF BLOCK',
    cls:  'bg-amber-500/10 text-amber-400 border-amber-500/25',
    tip:  'The weekly trend was bearish. Even though the daily chart looked interesting, the price was below its weekly moving average - buying here would mean swimming against the bigger tide.',
  },
  // ── Cognitive-wing actions ────────────────────────────────────────────────
  BUY: {
    text: 'BUY',
    cls:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    tip:  'The committee voted to buy. All gates passed, the AI news analysis was positive, and the final score cleared the threshold. A paper position was opened.',
  },
  HOLD: {
    text: 'HOLD',
    cls:  'bg-amber-500/10 text-amber-400 border-amber-500/25',
    tip:  'The committee watched but didn\'t act. All risk gates were cleared but the final score - after the AI news adjustment - still fell short of the buy threshold.',
  },
  REJECTED_COGNITIVE: {
    text: 'COGNITIVE VETO',
    cls:  'bg-purple-500/10 text-purple-400 border-purple-500/25',
    tip:  'The AI news analyst found a verified, serious negative fact - such as a fraud filing, earnings collapse, or regulatory action. The system issued a hard block regardless of the technical score.',
  },
  ANALYZING: {
    text: 'ANALYZING',
    cls:  'bg-purple-500/10 text-purple-300 border-purple-500/25',
    tip:  'Math calculations are complete. The AI committee is now reading the news and computing sentiment - the final verdict is moments away.',
  },
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

export default function EvaluationCard({ evaluation: ev, sentimentLoading = false }) {
  const [open, setOpen] = useState(false);
  if (!ev) return null;

  const action = ev.action_taken ?? 'REJECTED_CONSENSUS';
  const badge  = ACTION_BADGE[action] ?? ACTION_BADGE.REJECTED_CONSENSUS;

  const rawScore = ev.final_alpha_score ?? ev.total_consensus_score ?? 0;
  const alpha    = rawScore > 1 ? rawScore : rawScore * 100;

  const ts = ev.timestamp
    ? new Date(ev.timestamp).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null;

  const reasoning = ev.reasoning ?? buildReasoning(ev);
  const regimeTip = REGIME_TIP[ev.regime] ?? 'Current market state determines agent vote weighting.';

  const oracle = ev.oracle_prediction?.status === 'SUCCESS' ? ev.oracle_prediction.data : null;
  const oracleTip = oracle ? (
    <div className="flex flex-col gap-2">
      <p className="font-semibold text-slate-100 text-[11px] uppercase tracking-wider">Options Market Prediction</p>
      <p className="text-slate-300">
        The options market is "pricing in" an expected move of
        {' '}<span className="text-violet-300 font-semibold">±{(oracle.expected_move_pct * 100).toFixed(2)}%</span>
        {' '}(±${oracle.expected_move_dollar.toFixed(2)}) before {oracle.expiry} ({oracle.dte} days).
      </p>
      <div className="bg-slate-900 rounded-md px-3 py-2 flex flex-col gap-1">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">68% Probability Range</p>
        <div className="flex justify-between font-mono text-xs">
          <span className="text-emerald-400">↑ ${oracle.upper_bound.toFixed(2)}</span>
          <span className="text-rose-400">↓ ${oracle.lower_bound.toFixed(2)}</span>
        </div>
      </div>
      <p className="text-slate-400 text-[11px]">
        <span className="font-semibold text-slate-300">ATM IV:</span> {(oracle.average_atm_iv * 100).toFixed(1)}%
      </p>
      <p className="text-slate-500 text-[11px] border-t border-slate-700 pt-1.5">
        Calculated from options contracts closest to the current price.
        Formula: Expected Move = Price × IV × √(DTE ÷ 365).
        Technical agents use these bounds to veto signals that contradict the market’s forecast.
      </p>
    </div>
  ) : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 hover:border-slate-700 transition-colors duration-150">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold tracking-widest text-slate-100 font-mono">
              {ev.ticker}
            </span>
            <Tooltip content={badge.tip} width={224} position="bottom">
              <span className={`cursor-default text-xs font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${badge.cls}`}>
                {action === 'ANALYZING' && <Loader2 size={10} className="animate-spin" />}
                {badge.text}
              </span>
            </Tooltip>
          </div>
          {ts && <span className="text-xs text-slate-500">{ts}</span>}
        </div>

        {/* Alpha score with tooltip */}
        <Tooltip content={ALPHA_TIP} width={240} align="right">
          <div className="flex flex-col items-center shrink-0 cursor-default">
            <CircularProgress score={alpha} size={68} />
            <span className="text-xs text-slate-400 mt-1 font-medium">ALPHA</span>
            {ev.cognitive_bonus != null && ev.cognitive_bonus !== 0 && (
              <span className={`text-xs font-bold font-mono mt-0.5 ${ev.cognitive_bonus > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {ev.cognitive_bonus > 0 ? '+' : ''}{ev.cognitive_bonus.toFixed(1)} AI
              </span>
            )}
          </div>
        </Tooltip>
      </div>

      {/* Context badges */}
      {(ev.regime || ev.vix_level != null) && (
        <div className="flex items-center gap-2 flex-wrap">
          {ev.regime && (
            <Tooltip content={regimeTip} width={240} position="bottom">
              <span className="cursor-default text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
                {ev.regime}
              </span>
            </Tooltip>
          )}
          {ev.vix_level != null && (
            <Tooltip content={VIX_TIP} width={240} position="bottom">
              <span className={`cursor-default text-xs font-medium px-2 py-0.5 rounded-full border ${
                ev.vix_level > 20
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                VIX {ev.vix_level.toFixed(1)}
              </span>
            </Tooltip>
          )}
          {oracle && (
            <Tooltip content={oracleTip} width={296} position="bottom">
              <span className="cursor-default text-xs font-medium px-2 py-0.5 rounded-full border bg-violet-500/10 text-violet-300 border-violet-500/20">
                Future Prediction: ±{(oracle.expected_move_pct * 100).toFixed(2)}%
              </span>
            </Tooltip>
          )}
        </div>
      )}

      {/* Sentiment strip */}
      <SentimentStrip ev={ev} loading={sentimentLoading} />

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
