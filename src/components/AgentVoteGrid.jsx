import Tooltip from './Tooltip';

/**
 * Agent definitions with full explanations for tooltips.
 * Used by EvaluationCard (dashboard) and ShadowCard (shadow lab).
 */
export const AGENTS = [
  {
    key:   'momentum_vote',
    label: 'M',
    name:  'Momentum',
    tip:   'Votes BUY when price > 8 EMA > 20 SMA and the 8 EMA is rising with strong volume. ' +
           'Signals that the stock is in a confirmed uptrend. SELL when the inverse is true.',
  },
  {
    key:   'mean_reversion_vote',
    label: 'MR',
    name:  'Mean Reversion',
    tip:   'Votes BUY when price is above the 200-day SMA (healthy uptrend) AND RSI < 30 ' +
           '(temporarily oversold). Catches dip-buying opportunities inside existing uptrends. ' +
           'SELL when RSI > 70 (overbought).',
  },
  {
    key:   'support_vote',
    label: 'SR',
    name:  'Support / Resistance',
    tip:   'Identifies key price floors and ceilings from historical data. Votes BUY when ' +
           'price bounces off a proven support level — a zone where buyers have historically ' +
           'stepped in. Avoids chasing breakouts into resistance.',
  },
  {
    key:   'relative_strength_vote',
    label: 'RS',
    name:  'Relative Strength',
    tip:   'Compares the stock\'s performance against its sector. Votes BUY only for ' +
           'sector out-performers — stocks that go up more than peers on up days and fall ' +
           'less on down days. Filters out laggards within a sector.',
  },
  {
    key:   'complex_pullback_vote',
    label: 'CP',
    name:  'Complex Pullback',
    tip:   'Waits for a two-legged (ABCD) pullback pattern before entering. A single ' +
           'shallow dip is often a trap; a second leg down shakes out weak hands and ' +
           'confirms institutional buying interest at the support zone.',
  },
  {
    key:   'stat_arb_vote',
    label: 'SA',
    name:  'Statistical Arb',
    tip:   'Uses a 30-day rolling Z-score to measure how far the stock has deviated from ' +
           'its sector ETF. Votes BUY when Z-score < −2.0 (stock is statistically cheap ' +
           'vs sector) and SELL when Z-score > +2.0. Alpha-hunter — does not count toward ' +
           'the 65% consensus threshold.',
  },
  {
    key:   'failure_test_vote',
    label: 'FT',
    name:  'Failure Test',
    tip:   'Detects failed breakdowns: price briefly dips below a key support, triggering ' +
           'retail stop-losses, then immediately reverses up. This "liquidity trap" is a ' +
           'classic institutional accumulation signal. Alpha-hunter — does not count toward ' +
           'the 65% consensus threshold.',
  },
  {
    key:   'mtf_status',
    label: 'MTF',
    name:  'Multi-Timeframe',
    tip:   'Veto gate — not a vote. Checks that the weekly chart agrees with the daily ' +
           'setup (price must be above the weekly 20 SMA). Prevents buying a short-term ' +
           'daily bounce when the stock is in a weekly downtrend. A FAIL here blocks the ' +
           'trade regardless of consensus score.',
  },
];

const VOTE_STYLE = {
  BUY:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  SELL:    'bg-rose-500/15    text-rose-400    border-rose-500/30',
  HOLD:    'bg-amber-500/15   text-amber-400   border-amber-500/30',
  PASS:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  FAIL:    'bg-rose-500/15    text-rose-400    border-rose-500/30',
  UNKNOWN: 'bg-slate-800      text-slate-500   border-slate-700',
};

export function voteStyle(vote) {
  if (!vote) return VOTE_STYLE.UNKNOWN;
  return VOTE_STYLE[vote.toUpperCase()] ?? VOTE_STYLE.UNKNOWN;
}

/**
 * 4-column grid of agent vote chips with hover tooltips.
 * Pass `evaluation` object with vote keys matching AGENTS[].key.
 */
export default function AgentVoteGrid({ evaluation: ev }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {AGENTS.map(({ key, label, name, tip }) => {
        const vote = ev?.[key];
        return (
          <Tooltip key={key} content={<><strong>{name}</strong><br />{tip}</>} width="w-64">
            <div
              className={`w-full flex flex-col items-center justify-center rounded-lg border py-1.5 cursor-default select-none ${voteStyle(vote)}`}
            >
              <span className="text-xs font-bold">{label}</span>
              <span className="text-[10px] opacity-70 mt-0.5 leading-none">
                {vote ? vote.substring(0, 4).toUpperCase() : 'N/A'}
              </span>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}
