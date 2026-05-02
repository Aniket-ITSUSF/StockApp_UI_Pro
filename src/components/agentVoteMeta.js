/**
 * Agent definitions with full explanations for tooltips.
 * Used by EvaluationCard and ShadowCard vote grids.
 */
export const AGENTS = [
  {
    key:   'momentum_vote',
    label: 'M',
    name:  'Momentum',
    tip:   'Looks for stocks already moving up with strong volume. If the short-term trend is strong and healthy, this agent can vote BUY.',
  },
  {
    key:   'mean_reversion_vote',
    label: 'MR',
    name:  'Mean Reversion',
    tip:   'Looks for a good stock that may have fallen too much in the short term. It tries to catch a possible bounce while the bigger trend is still healthy.',
  },
  {
    key:   'support_vote',
    label: 'SR',
    name:  'Support / Resistance',
    tip:   'Checks if the price is near an area where buyers usually step in. It helps avoid buying right below a level where sellers may appear.',
  },
  {
    key:   'relative_strength_vote',
    label: 'RS',
    name:  'Relative Strength',
    tip:   'Compares this stock with similar stocks in its sector. A BUY means it is acting stronger than its peers.',
  },
  {
    key:   'complex_pullback_vote',
    label: 'CP',
    name:  'Complex Pullback',
    tip:   'Looks for a cleaner dip-buying setup. It waits for the stock to pull back in a more stable pattern before calling it attractive.',
  },
  {
    key:   'volume_profile_vote',
    label: 'VP',
    name:  'Volume Profile / VWAP',
    tip:   'Maps 10 days of 5-minute volume by price. A BUY means price is above VWAP and the main VPOC wall with volume expanding.',
  },
  {
    key:   'stat_arb_vote',
    label: 'SA',
    name:  'Statistical Arb',
    tip:   'Checks if the stock has moved unusually far compared with its sector. It looks for prices that may be stretched too low or too high.',
  },
  {
    key:   'failure_test_vote',
    label: 'FT',
    name:  'Failure Test',
    tip:   'Looks for a fake breakdown. If price drops below support and quickly recovers, it may mean sellers got trapped and buyers stepped in.',
  },
  {
    key:   'mtf_status',
    label: 'MTF',
    name:  'Multi-Timeframe',
    tip:   'Checks the bigger weekly trend. If the larger trend is weak, this can block a trade even when the daily chart looks good.',
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
