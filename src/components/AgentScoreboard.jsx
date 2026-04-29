import {
  TrendingUp, Repeat, Activity, BarChart3, Layers, Sigma, AlertCircle, Compass, Crown,
} from 'lucide-react';

/**
 * AgentScoreboard - friendly per-agent breakdown shown on the Analyze page.
 *
 * Where AgentVoteGrid is a compact 4×2 chip grid for the dashboard, this
 * component is a vertical list with full agent names, plain-English
 * descriptions, and big BUY / SELL / HOLD chips. Designed for the wide
 * Analyze page where we have room to be explicit.
 */

const AGENT_MIN_TIER = {
  momentum_vote:          'free',
  mean_reversion_vote:    'free',
  support_vote:           'free',
  relative_strength_vote: 'pro',
  complex_pullback_vote:  'pro',
  mtf_status:             'pro',
  stat_arb_vote:          'ultra',
  failure_test_vote:      'ultra',
};

const TIER_RANK = { free: 0, pro: 1, ultra: 2 };

function isAgentLocked(key, tier) {
  const required = AGENT_MIN_TIER[key] ?? 'free';
  return (TIER_RANK[tier] ?? 0) < (TIER_RANK[required] ?? 0);
}

const LOCKED_BADGE = {
  pro:   { cls: 'bg-amber-500/15  text-amber-300  border-amber-500/30',  label: 'Pro'   },
  ultra: { cls: 'bg-purple-500/15 text-purple-300 border-purple-500/30', label: 'Ultra' },
};

const AGENTS = [
  {
    key:   'momentum_vote',
    name:  'Momentum Hunter',
    short: 'Confirms the stock is in a clean uptrend with strong volume.',
    Icon:  TrendingUp,
  },
  {
    key:   'mean_reversion_vote',
    name:  'Dip Buyer',
    short: 'Looks for oversold pullbacks inside healthy uptrends.',
    Icon:  Repeat,
  },
  {
    key:   'support_vote',
    name:  'Support / Resistance',
    short: 'Tracks proven price floors and ceilings from the past 90 days.',
    Icon:  BarChart3,
  },
  {
    key:   'relative_strength_vote',
    name:  'Sector Outperformer',
    short: 'Compares the stock vs its sector - only votes for true leaders.',
    Icon:  Compass,
  },
  {
    key:   'complex_pullback_vote',
    name:  'Pullback Specialist',
    short: 'Waits for a two-legged dip before entering - avoids bull traps.',
    Icon:  Layers,
  },
  {
    key:   'stat_arb_vote',
    name:  'Statistical Arbitrage',
    short: 'Z-score model - flags statistical mispricing vs sector ETF.',
    Icon:  Sigma,
  },
  {
    key:   'failure_test_vote',
    name:  'Failure Test',
    short: 'Catches "fake breakdowns" - shake-outs that immediately reverse.',
    Icon:  AlertCircle,
  },
  {
    key:   'mtf_status',
    name:  'Multi-Timeframe Veto',
    short: 'Blocks trades when the weekly chart disagrees with the daily.',
    Icon:  Activity,
  },
];

const VOTE_STYLE = {
  BUY:     { cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',  label: 'BUY'    },
  SELL:    { cls: 'bg-rose-500/15    text-rose-300    border-rose-500/30',     label: 'SELL'   },
  HOLD:    { cls: 'bg-amber-500/15   text-amber-300   border-amber-500/30',    label: 'HOLD'   },
  PASS:    { cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',  label: 'PASS'   },
  FAIL:    { cls: 'bg-rose-500/15    text-rose-300    border-rose-500/30',     label: 'FAIL'   },
  UNKNOWN: { cls: 'bg-slate-800      text-slate-500   border-slate-700',       label: 'N/A'    },
};

function voteFor(ev, key) {
  const raw = ev?.[key];
  if (!raw) return VOTE_STYLE.UNKNOWN;
  const upper = raw.toString().toUpperCase();
  return VOTE_STYLE[upper] ?? VOTE_STYLE.UNKNOWN;
}

export default function AgentScoreboard({ evaluation: ev, tier = 'free' }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-100">Agent Committee</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            8 specialists vote independently - each contributes to the final alpha score.
          </p>
        </div>
        <span className="text-xs uppercase tracking-widest text-slate-400 hidden sm:inline">
          Vote
        </span>
      </div>

      <ul className="divide-y divide-slate-800">
        {AGENTS.map(({ key, name, short, Icon }) => {
          const locked = isAgentLocked(key, tier);
          const v      = locked ? null : voteFor(ev, key);
          const badge  = locked ? LOCKED_BADGE[AGENT_MIN_TIER[key]] : null;
          return (
            <li key={key} className={`px-5 py-3 flex items-center gap-4 ${locked ? 'opacity-60' : ''}`}>
              <span className="shrink-0 w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <Icon size={15} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-100">{name}</p>
                <p className="text-xs text-slate-400 truncate sm:whitespace-normal sm:line-clamp-1">
                  {short}
                </p>
              </div>
              {locked ? (
                <span
                  className={`shrink-0 inline-flex items-center gap-1 min-w-[64px] justify-center text-xs font-bold tracking-wider px-3 py-1 rounded-md border ${badge.cls}`}
                >
                  <Crown size={10} />
                  {badge.label}
                </span>
              ) : (
                <span
                  className={`shrink-0 inline-flex items-center justify-center min-w-[64px] text-xs font-bold tracking-wider px-3 py-1 rounded-md border ${v.cls}`}
                >
                  {v.label}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
