import { Lock, Sparkles, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Tier-aware lock screen for an intraday session tab.
 *
 * Three rendering states:
 *   - Free user (any session)        → "Subscribe to unlock" Pro upsell.
 *   - Pro user, non-pre_market tab   → "Upgrade to Ultra Pro" upsell.
 *   - Anyone else                    → renders `children` (the actual content).
 *
 * The wrapper deliberately does NOT call the API; the parent fetches and
 * passes a 402 hint when relevant. This keeps the component pure and
 * testable in isolation.
 */
export default function SessionLockGate({ session, children }) {
  // All tier state comes from AuthContext - single source of truth.
  // Treat anonymous visitors the same as Free: both see the "Subscribe" CTA.
  const { tier, isAuthenticated, isUltra } = useAuth();
  const isFree = !isAuthenticated || tier === 'free';
  const isPro  = tier === 'pro';

  const isPreMarket = session === 'pre_market';

  // Ultra unlocks every session.
  if (isUltra) return children;

  // Pro unlocks pre-market only.
  if (isPro && isPreMarket) return children;

  // Pro on a non-pre-market tab → "Upgrade to Ultra Pro" upsell.
  if (isPro && !isPreMarket) {
    return <UpgradeUltraCard session={session} />;
  }

  // Free / anonymous on any tab → "Subscribe" upsell.
  if (isFree) {
    return <SubscribeCard session={session} isAuthenticated={isAuthenticated} />;
  }

  return children;
}


// ── Free / anonymous → Subscribe to unlock ───────────────────────────────────

function SubscribeCard({ session, isAuthenticated }) {
  const headline = SESSION_FREE_PITCH[session] ?? SESSION_FREE_PITCH.pre_market;
  const cta = isAuthenticated ? '/plans' : '/sign-up';

  return (
    <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-8 flex flex-col items-center text-center gap-4 mt-2">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
        <Sparkles size={26} className="text-amber-400" />
      </div>
      <div className="max-w-lg">
        <h3 className="text-base font-bold text-slate-100">
          Subscribe to get AI-curated stocks for today
        </h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          {headline}
        </p>
      </div>
      <Link
        to={cta}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-400 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-shadow ring-1 ring-amber-300/60"
      >
        <Sparkles size={14} />
        {isAuthenticated ? 'See Plans · from ₹499/mo' : 'Sign up · 7-day free trial'}
      </Link>
      <p className="text-[10px] text-slate-700">
        AI reads the news for you and surfaces the stocks that will be in action today.
      </p>
    </div>
  );
}


// ── Pro on non-pre-market tab → Upgrade to Ultra Pro ─────────────────────────

function UpgradeUltraCard({ session }) {
  const pitch = SESSION_ULTRA_PITCH[session] ?? SESSION_ULTRA_PITCH.morning;

  return (
    <div className="bg-slate-900 border border-yellow-500/30 rounded-2xl p-8 flex flex-col items-center text-center gap-4 mt-2">
      <div className="w-14 h-14 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center">
        <Crown size={26} className="text-yellow-400" />
      </div>
      <div className="max-w-lg">
        <h3 className="text-base font-bold text-slate-100 flex items-center justify-center gap-1.5">
          <Lock size={13} className="text-yellow-400" />
          Ultra Pro unlocks the {SESSION_LABELS[session] ?? session} session
        </h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          {pitch}
        </p>
        <ul className="text-[11px] text-slate-500 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto text-left">
          <li className="flex items-start gap-1.5">
            <span className="text-yellow-400">•</span>
            Three extra AI sweeps every trading day
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-yellow-400">•</span>
            Session-tagged hit-rate scoreboard
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-yellow-400">•</span>
            Live entry / stop / target alerts
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-yellow-400">•</span>
            Lunchtime sector rotation read
          </li>
        </ul>
      </div>
      <Link
        to="/plans"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-yellow-300 via-amber-300 to-yellow-400 text-slate-950 text-sm font-bold shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 transition-shadow ring-1 ring-yellow-300/60"
      >
        <Crown size={14} />
        Upgrade to Ultra Pro · ₹799/mo
      </Link>
      <p className="text-[10px] text-slate-700">
        ₹300 over Pro · cancel anytime · paper trading only
      </p>
    </div>
  );
}


// ── Copy ────────────────────────────────────────────────────────────────────

const SESSION_LABELS = {
  pre_market: 'Pre-Market',
  morning:    'Morning',
  lunch:      'Lunch',
  closing:    'Closing',
};

const SESSION_FREE_PITCH = {
  pre_market: 'Every morning before the bell, our AI reads overnight news - Fed moves, war headlines, oil shocks, earnings - and hands you a ranked list of stocks set to move at the open.',
  morning:    'One hour after the open, the AI returns to call out which morning catalysts the tape actually confirmed and which faded - plus brand-new breakout names that didn\'t exist in the pre-market read.',
  lunch:      'At lunchtime the AI scans for reversal candidates, late-day momentum builds, and writes the day\'s sector rotation theme - which sectors are leading, which are lagging, and what it means.',
  closing:    'In the final hour the AI surfaces closing-hour scalps and overnight positioning ideas - names with post-close earnings, FDA decisions, or persistent late-session momentum.',
};

const SESSION_ULTRA_PITCH = {
  morning: 'The morning sweep is the highest-edge session of the day - it tells you which morning gappers are real and which are about to fade. Available on Ultra Pro.',
  lunch:   'The lunch sweep is the only place you get a full sector rotation read mid-tape, plus the late-day flag setups other tools miss. Available on Ultra Pro.',
  closing: 'The closing sweep is built for last-hour traders: scalps that resolve before the bell and overnight positions ahead of post-close catalysts. Available on Ultra Pro.',
};
