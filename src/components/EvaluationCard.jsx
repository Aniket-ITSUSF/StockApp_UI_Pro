import { useState } from 'react';
import { Activity, BarChart3, Brain, ChevronDown, ChevronUp, Loader2, ShieldCheck } from 'lucide-react';
import CircularProgress from './CircularProgress';
import AgentVoteGrid from './AgentVoteGrid';
import Tooltip from './Tooltip';
import SentimentStrip from './SentimentStrip';
import LinkedSharesStrip from './LinkedSharesStrip';

const ACTION_BADGE = {
  // ── Legacy vote-pipeline actions ──────────────────────────────────────────
  EXECUTED: {
    text: 'EXECUTED',
    cls:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    tip:  'All math agents voted, every risk gate was cleared, and the score beat the threshold. This trade is saved only in your private browser portfolio.',
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
    tip:  'The committee voted to buy. The suggested entry is saved only in your private browser portfolio.',
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

const ORACLE_FRAMES = [
  ['1_day', '1D'],
  ['7_day', '7D'],
  ['30_day', '30D'],
];

function getOracleFrames(oracle) {
  if (!oracle) return [];
  return ORACLE_FRAMES
    .map(([key, label]) => {
      const frame = oracle[key];
      return frame ? { key, label, ...frame } : null;
    })
    .filter(Boolean);
}

function fmtPct(value) {
  return value == null ? 'N/A' : `${(value * 100).toFixed(2)}%`;
}

function fmtPrice(value) {
  return value == null ? 'N/A' : value.toFixed(2);
}

function fmtDisplayPrice(value, ticker) {
  if (value == null) return null;
  const symbol = ticker?.toUpperCase().endsWith('.NS') || ticker?.toUpperCase().endsWith('.BO') ? '₹' : '$';
  return `${symbol}${fmtPrice(value)}`;
}

/**
 * Volume read with plain plus technical labels (VWAP, VPOC). Logic matches VolumeProfileAgent.
 */
function buildVolumeAnalysisNarrative(profile, ticker) {
  const p = Number(profile.price);
  const vwap = Number(profile.vwap);
  const vpoc = Number(profile.vpoc);
  if (![p, vwap, vpoc].every((n) => Number.isFinite(n))) {
    return {
      tone: 'neutral',
      lead: 'No read yet.',
      body: 'We could not load volume data for this stock. Try again in a moment.',
    };
  }

  const priceStr = fmtDisplayPrice(p, ticker);
  const vwapStr = fmtDisplayPrice(vwap, ticker);
  const vpocStr = fmtDisplayPrice(vpoc, ticker);
  const moreSharesThanUsual = Boolean(profile.volume_inclining);

  const volNote = moreSharesThanUsual
    ? ' Current volume is above its short-term average (5-period volume SMA), which adds confirmation.'
    : ' Current volume is below its short-term average (5-period volume SMA), which weakens confirmation.';

  const aboveBoth = p > vwap && p > vpoc;
  const belowBoth = p < vwap && p < vpoc;
  const belowAvgAboveBusy = p < vwap && p > vpoc;
  const aboveAvgBelowBusy = p > vwap && p < vpoc;

  if (aboveBoth && moreSharesThanUsual) {
    return {
      tone: 'bull',
      lead: 'BUY.',
      body:
        `Price is ${priceStr}. Volume Weighted Average Price (VWAP) is ${vwapStr}. VWAP is the average fill price over the window, weighted by how many shares traded at each price, which shows where the market balanced. Price above VWAP points to buyers paying up. Volume Point of Control (VPOC) is ${vpocStr}, the price where the most volume accumulated in our profile. Price above VPOC suggests that heavy area may now act as support. ${volNote.trim()}`,
    };
  }

  if (aboveBoth && !moreSharesThanUsual) {
    return {
      tone: 'hold',
      lead: 'HOLD.',
      body:
        `Price is ${priceStr}. VWAP is ${vwapStr} and VPOC is ${vpocStr}, and price is above both. That placement usually favors bulls, but volume is soft. Without heavier volume, the market can give back a VWAP or VPOC breakout quickly. ${volNote.trim()}`,
    };
  }

  if (belowBoth) {
    const extra = moreSharesThanUsual
      ? ' Volume is elevated while price is under both VWAP and VPOC, so resolve the weakness carefully.'
      : volNote.trim();
    return {
      tone: 'bear',
      lead: 'SELL.',
      body:
        `Price is ${priceStr}. Volume Weighted Average Price (VWAP) is ${vwapStr}. Price below VWAP says sellers are more aggressive on average for this sample. Volume Point of Control (VPOC) is ${vpocStr}. Price below VPOC says we are under the heaviest volume shelf, where trapped longs may sell rallies. ${extra}`,
    };
  }

  if (belowAvgAboveBusy) {
    return {
      tone: 'hold',
      lead: 'HOLD.',
      body:
        `Price is ${priceStr}. VWAP is ${vwapStr} and price is below it, so the volume-weighted tape still leans cautious. VPOC is ${vpocStr} and price is above it, so we have not lost the busiest price level yet. This split between VWAP and VPOC is a mixed tape, not a clean risk-on or risk-off signal. ${volNote.trim()}`,
    };
  }

  if (aboveAvgBelowBusy) {
    return {
      tone: 'hold',
      lead: 'HOLD.',
      body:
        `Price is ${priceStr}. VWAP is ${vwapStr} and price is above it, which helps the bull case on a volume basis. VPOC is ${vpocStr} and price is still under it, and VPOC is where the biggest volume cluster lives. Until price clears VPOC with follow-through, expect chop around that wall. ${volNote.trim()}`,
    };
  }

  return {
    tone: 'hold',
    lead: 'HOLD.',
    body:
      `Price is ${priceStr}. VWAP is ${vwapStr} and VPOC is ${vpocStr}. Price is not giving a clean breakout or breakdown versus both anchors yet, so wait for price to pick a side with volume. ${volNote.trim()}`,
  };
}

function OracleCones({ oracle }) {
  const frames = getOracleFrames(oracle);
  if (!frames.length) return null;

  return (
    <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2">
      <div className="flex flex-col min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between gap-1.5 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-violet-300">
          Options-Based Future Prediction
        </span>
        <span className="text-xs text-slate-500">ATM IV · 68% probability range</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(7.25rem,1fr))] gap-2">
        {frames.map((frame) => {
          const tip = (
            <div className="flex flex-col gap-1.5 text-xs">
              <p className="font-semibold text-slate-100">{frame.label} Implied Move</p>
              <p className="text-slate-300">
                Options imply a <span className="text-violet-300 font-semibold">±{fmtPct(frame.move_pct)}</span> move by {frame.expiry}.
              </p>
              <p className="text-slate-400">
                IV: {fmtPct(frame.atm_iv)} · DTE: {frame.dte} · Move: {fmtPrice(frame.move_abs)}
              </p>
              <p className="text-slate-500">
                Calculated from at-the-money option implied volatility using Price x IV x sqrt(DTE / 365).
              </p>
            </div>
          );

          return (
            <Tooltip key={frame.key} content={tip} width={248} position="bottom">
              <div className="cursor-default rounded-md border border-slate-700 bg-slate-950/60 px-2.5 py-2 hover:border-violet-500/30 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-200">{frame.label}</span>
                  <span className="text-xs font-extrabold text-violet-200">±{fmtPct(frame.move_pct)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 font-mono text-xs font-extrabold">
                  <span className="text-rose-300">{fmtPrice(frame.lower)}</span>
                  <span className="text-slate-600">to</span>
                  <span className="text-emerald-300">{fmtPrice(frame.upper)}</span>
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

function VolumeAnalysisStrip({ profile, ticker }) {
  if (!profile) return null;

  const { tone, lead, body } = buildVolumeAnalysisNarrative(profile, ticker);
  const leadCls =
    tone === 'bull'
      ? 'text-emerald-300'
      : tone === 'bear'
        ? 'text-rose-300'
        : tone === 'neutral'
          ? 'text-slate-400'
          : 'text-amber-200';

  const tip = (
    <div className="flex flex-col gap-1.5 text-xs text-slate-300">
      <p className="font-semibold text-slate-100">Terms</p>
      <p>
        <span className="text-cyan-200 font-semibold">VWAP</span> (Volume Weighted Average Price): average trade price weighted by volume on recent 5-minute bars.
      </p>
      <p>
        <span className="text-cyan-200 font-semibold">VPOC</span> (Volume Point of Control): the price where the most shares traded in our sliced profile (50 equal price bins over the window).
      </p>
      <p className="text-slate-500">Matches the Volume Profile agent on the backend.</p>
    </div>
  );

  return (
    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2">
      <div className="flex flex-col min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between gap-1.5 mb-2">
        <Tooltip content={tip} width={280} position="bottom">
          <span className="cursor-default text-xs font-semibold text-cyan-300 border-b border-dotted border-cyan-500/40">
            Volume Analysis:
          </span>
        </Tooltip>
        <span className="text-xs text-slate-500">10 trading days · 5-minute bars</span>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">
        <span className={`font-semibold ${leadCls}`}>{lead}</span>{' '}
        {body}
      </p>
    </div>
  );
}

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

function ResultSection({ title, eyebrow, children, dataTour, Icon = Activity, className = '' }) {
  return (
    <section data-analyze-tour={dataTour} className={`rounded-xl border border-slate-800 bg-slate-950/45 p-3.5 ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-emerald-300">
            <Icon size={15} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">{eyebrow}</p>
            <h4 className="text-sm font-bold text-slate-100">{title}</h4>
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function EvaluationCard({ evaluation: ev, sentimentLoading = false, discoveryLoading = false }) {
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
  const currentPrice = ev.current_price ?? ev.entry_price ?? oracle?.current_price;

  return (
    <div data-analyze-tour="result-card" className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl shadow-slate-950/20 transition-colors duration-150 hover:border-slate-700 min-w-0">

      {/* Header */}
      <div className="border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-2xl font-black tracking-widest text-slate-100">
                {ev.ticker}
              </span>
              {currentPrice != null && (
                <span className="cursor-default rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-extrabold text-emerald-200 shadow-[0_0_14px_-8px] shadow-emerald-300">
                  Current {fmtDisplayPrice(currentPrice, ev.ticker)}
                </span>
              )}
              <Tooltip content={badge.tip} width={224} position="bottom">
                <span data-analyze-tour="verdict" className={`inline-flex cursor-default items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${badge.cls}`}>
                  {action === 'ANALYZING' && <Loader2 size={10} className="animate-spin" />}
                  {badge.text}
                </span>
              </Tooltip>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Read this card from top to bottom: verdict, alpha score, market context, math agents, then reasoning.
            </p>
            {ts && <span className="mt-2 block text-xs text-slate-500">{ts}</span>}
          </div>

          <Tooltip content={ALPHA_TIP} width={240} align="right">
            <div data-analyze-tour="alpha" className="flex shrink-0 items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 cursor-default sm:flex-col sm:gap-1">
              <CircularProgress score={alpha} size={72} />
              <div className="sm:text-center">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Alpha</span>
                {ev.cognitive_bonus != null && ev.cognitive_bonus !== 0 && (
                  <span className={`block text-xs font-bold font-mono mt-0.5 ${ev.cognitive_bonus > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {ev.cognitive_bonus > 0 ? '+' : ''}{ev.cognitive_bonus.toFixed(1)} AI
                  </span>
                )}
              </div>
            </div>
          </Tooltip>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {(ev.regime || ev.vix_level != null) && (
          <ResultSection title="Market regime and volatility" eyebrow="Risk context" dataTour="market-context" Icon={ShieldCheck}>
            <div className="flex flex-wrap items-center gap-2">
              {ev.regime && (
                <Tooltip content={regimeTip} width={240} position="bottom">
                  <span className="cursor-default rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                    {ev.regime}
                  </span>
                </Tooltip>
              )}
              {ev.vix_level != null && (
                <Tooltip content={VIX_TIP} width={240} position="bottom">
                  <span className={`cursor-default rounded-full border px-2 py-0.5 text-xs font-medium ${
                    ev.vix_level > 20
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    VIX {ev.vix_level.toFixed(1)}
                  </span>
                </Tooltip>
              )}
            </div>
          </ResultSection>
        )}

        <div data-analyze-tour="volume-options" className="grid grid-cols-1 gap-3">
          <OracleCones oracle={oracle} />
          <VolumeAnalysisStrip profile={ev.volume_profile} ticker={ev.ticker} />
        </div>

        <ResultSection title="AI research context" eyebrow="News and discovery" dataTour="ai-research" Icon={Brain}>
          <div className="flex flex-col gap-2">
            <SentimentStrip ev={ev} loading={sentimentLoading} />
            <LinkedSharesStrip ev={ev} loading={discoveryLoading} />
            {!sentimentLoading && !discoveryLoading && !ev?.cognitive_signal && !ev?.discovery_report && (
              <p className="text-xs leading-5 text-slate-500">
                AI sentiment and linked-share research appear here when available.
              </p>
            )}
          </div>
        </ResultSection>

        <ResultSection title="Math agents" eyebrow="Separate calculations" dataTour="math-agents" Icon={BarChart3}>
          <p className="mb-3 text-xs leading-5 text-slate-500">
            Each chip is a separate mathematical agent running its own calculation, then voting on the setup.
          </p>
          <AgentVoteGrid evaluation={ev} />
        </ResultSection>

        <ResultSection title="Decision reasoning" eyebrow="Why it scored this way" dataTour="reasoning" Icon={Activity}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors w-fit"
          >
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {open ? 'Hide reasoning' : 'Show reasoning'}
          </button>
          {open && (
            <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs leading-relaxed text-slate-400">
              {reasoning}
            </div>
          )}
        </ResultSection>
      </div>
    </div>
  );
}
