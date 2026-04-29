import { useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  Check,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Crown,
  Zap,
  Lock,
  X,
  Star,
} from 'lucide-react';
import {
  getBillingTiers,
  createBillingCheckout,
  verifyBillingPayment,
  reconcileBillingPayment,
  getAgentsCatalogue,
} from '../services/api';
import { openRazorpayCheckout } from '../services/razorpay';
import { useAuth } from '../hooks/useAuth';

/**
 * Pricing - "Excel-friendly" redesign.
 *
 * Layout order (top to bottom):
 *   1. Hero line + "you are already a premium member" banner (Ultra only).
 *   2. Three compact plan cards - price + one-line promise + single CTA.
 *   3. The big feature-comparison TABLE - every capability on a row, tick
 *      or cross under each plan column. This is the decision-making tool
 *      for users who think in spreadsheets.
 *   4. Trust bar (paper trading, cancel any time, UPI, JWT).
 *
 * Crown psychology
 * ----------------
 * Two paid tiers use the universal medal metaphor: silver (Pro) → gold
 * (Ultra Pro). People instantly recognise this ordering from Olympic
 * medals, loyalty programmes, and airline status tiers. No text needed.
 *
 *   Pro      → slate / silver crown     (₹499)
 *   Ultra    → amber / gold crown       (₹799)
 *
 * Ultra-active handling
 * ---------------------
 * When the signed-in user is already on Ultra, every "Upgrade" CTA is
 * replaced with a "You are a Premium member" chip + gold crown, and the
 * big comparison table loses its per-row upgrade buttons. Nothing on the
 * page tries to sell to a customer who already bought the top plan.
 *
 * No model names are surfaced on this page - the AI side is described
 * by outcomes, not by which OpenAI model is under the hood.
 */

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const TIER_RANK = { free: 0, pro: 1, ultra: 2 };

const TIER_LABEL = {
  free: 'Free',
  pro: 'Pro',
  ultra: 'Ultra Pro',
};

// Silver for Pro, Gold for Ultra - classic medal hierarchy.
const TIER_THEME = {
  free: {
    border: 'border-slate-800',
    chip:   'bg-slate-800 text-slate-300 border border-slate-700',
    button: 'bg-slate-800 text-slate-300 cursor-default',
    glow:   '',
    accent: 'text-slate-300',
    crown:  'text-slate-400',
    crownBg:'bg-slate-800/60 border-slate-700',
  },
  pro: {
    // Silver palette - slate-300 reads as brushed metal on dark backgrounds.
    border: 'border-slate-400/50',
    chip:   'bg-slate-400/15 text-slate-100 border border-slate-300/40',
    button: 'bg-gradient-to-b from-slate-200 to-slate-400 hover:from-slate-100 hover:to-slate-300 text-slate-950',
    glow:   'shadow-[0_0_60px_-15px_rgba(203,213,225,0.45)]',
    accent: 'text-slate-200',
    crown:  'text-slate-200',
    crownBg:'bg-slate-400/15 border-slate-300/40',
  },
  ultra: {
    // Gold palette - amber-300 + yellow-400 reads as 24k gold in dark mode.
    border: 'border-amber-400/60',
    chip:   'bg-amber-500/20 text-amber-200 border border-amber-400/40',
    button: 'bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-slate-950',
    glow:   'shadow-[0_0_80px_-15px_rgba(245,158,11,0.65)]',
    accent: 'text-amber-300',
    crown:  'text-amber-300',
    crownBg:'bg-amber-500/15 border-amber-400/40',
  },
};

// One-line "what it does in a single breath" pitch per tier.
const TIER_OUTCOMES = {
  free: {
    headline: 'Test the waters. No credit card.',
    subhead:  'Three math agents + read cached news sentiment.',
    audience: 'Curious investors',
  },
  pro: {
    headline: 'Trade like a real research desk.',
    subhead:  'Seven agents, AI Discovery, and live news refreshes.',
    audience: 'Active swing traders',
  },
  ultra: {
    headline: 'The full edge - every agent, every market.',
    subhead:  'All 10 agents, 2,000 evaluations, unlimited watchlist.',
    audience: 'Serious portfolio managers',
  },
};

const TIER_BADGE_TEXT = {
  free:  null,
  pro:   'Most picked plan',
  ultra: 'Best value',
};

// ─── Feature comparison table - the "Excel" view ───────────────────────────────
// Human-readable pairs of (Feature, What it does) grouped by section. Columns
// for Free / Pro / Ultra Pro carry either a tick, a cross, or a short cap
// like "25 / mo" - never a model name. Keep descriptions outcome-led so a
// non-technical reader understands the value at a glance.

const TABLE_SECTIONS = [
  {
    title: 'Core trading committee (math-based agents)',
    rows: [
      {
        feature: 'Momentum',
        what: "Spots stocks already moving up on strong volume - 'this train is leaving'.",
        values: { free: true, pro: true, ultra: true },
      },
      {
        feature: 'Mean Reversion',
        what: 'Finds healthy uptrending stocks that just dipped - buy the pullback, not the chase.',
        values: { free: true, pro: true, ultra: true },
      },
      {
        feature: 'Support / Resistance',
        what: "Watches historical price floors and ceilings - the chart's memory.",
        values: { free: true, pro: true, ultra: true },
      },
      {
        feature: 'Risk Manager (always on)',
        what: 'Sets your stop-loss and can veto any trade. Your built-in seatbelt.',
        values: { free: true, pro: true, ultra: true },
      },
      {
        feature: 'Relative Strength',
        what: 'Compares your stock vs its sector. Why hold the slowest horse in the race?',
        values: { free: false, pro: true, ultra: true },
      },
      {
        feature: 'Complex Pullback (ABCD)',
        what: 'Catches the two-leg pullback pattern professional swing traders wait for.',
        values: { free: false, pro: true, ultra: true },
      },
      {
        feature: 'Multi-Timeframe Filter',
        what: 'Forces daily, weekly, and intraday charts to agree before a buy is allowed.',
        values: { free: false, pro: true, ultra: true },
      },
      {
        feature: 'Regime Manager',
        what: 'Reads market fear (VIX) and re-weights every other agent automatically.',
        values: { free: false, pro: true, ultra: true },
      },
      {
        feature: 'Failure Test',
        what: 'Catches bear traps - false breakdowns that shake out weak hands and snap back.',
        values: { free: false, pro: false, ultra: true },
      },
      {
        feature: 'Stat Arb (Pairs)',
        what: 'Trades two related stocks against each other. Works in any market.',
        values: { free: false, pro: false, ultra: true },
      },
    ],
  },
  {
    title: 'AI research wing',
    rows: [
      {
        feature: 'News Sentiment - cached',
        what: 'Separates real facts from Twitter noise on any stock. Cached, zero-cost reads.',
        values: { free: true, pro: true, ultra: true },
      },
      {
        feature: 'News Sentiment - live refresh',
        what: 'Force a fresh analysis past the 2-hour cache. Needed before earnings.',
        values: { free: false, pro: true, ultra: true },
      },
      {
        feature: 'AI Discovery Agent',
        what: 'Finds OTHER stocks that always move with yours but the crowd overlooks.',
        values: { free: false, pro: true, ultra: true },
      },
      {
        feature: 'AI Pre-Market Radar (read)',
        what: "Every morning's ranked hotlist of likely movers - read the cached edition.",
        values: { free: true, pro: true, ultra: true },
      },
      {
        feature: 'AI Pre-Market Radar - manual run',
        what: 'On-demand overnight news sweep. Re-generate the hotlist whenever you want.',
        values: { free: false, pro: true, ultra: true },
      },
      {
        feature: 'Custom pre-market session',
        what: "Pick your own market session window - not just 'US' or 'India'.",
        values: { free: false, pro: false, ultra: true },
      },
      {
        feature: 'Full committee evaluation',
        what: 'Run all enabled agents in one shot and get the weighted verdict.',
        values: { free: false, pro: true, ultra: true },
      },
    ],
  },
  {
    title: 'Quotas & limits',
    rows: [
      { feature: 'Evaluations per month',       what: 'Full AI analyses you can run each month.', values: { free: '25',  pro: '500',   ultra: '2,000' } },
      { feature: 'AI Discovery runs per month', what: 'Hidden-mover searches per month.',          values: { free: '0',   pro: '100',   ultra: '500'   } },
      { feature: 'Pre-Market manual runs',      what: 'On-demand Radar sweeps per month.',         values: { free: '0',   pro: '30',    ultra: '100'   } },
      { feature: 'Live news refreshes',         what: 'Force-refreshes past the 2-hour cache.',    values: { free: '0',   pro: '200',   ultra: '1,000' } },
      { feature: 'Watchlist size',              what: 'Tickers you can keep pinned.',              values: { free: '5',   pro: '50',    ultra: 'Unlimited' } },
      { feature: 'Custom agent on/off toggles', what: 'Decide which agents run in your committee.',values: { free: false, pro: true,    ultra: true    } },
      { feature: 'Priority support',            what: 'Questions answered within one business day.',values:{ free: false, pro: true,    ultra: true    } },
    ],
  },
];

function formatValidUntil(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return null;
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Pricing() {
  // Tier comes from AuthContext (single source of truth). The
  // `subscription_status` / `subscription_valid_until` fields below are
  // read for cosmetic copy only ("active until <date>") - never to
  // gate UI; the gate is `tier`.
  const { profile, refreshProfile, isAuthenticated, tier: currentTier } = useAuth();
  const [catalogue, setCatalogue] = useState(null);
  // The /agents endpoint drives per-agent lock state on the plan cards when
  // we later enrich; for now we keep the call to warm the cache + verify
  // backend connectivity, but the big table is hand-authored above so
  // copy stays in designer control (and survives a cold backend).
  const [, setAgentsCatalogue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [busyTier, setBusyTier] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [successTier, setSuccessTier] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      getBillingTiers().then((r) => r.data),
      getAgentsCatalogue().then((r) => r.data).catch(() => null),
    ])
      .then(([tiers, agents]) => {
        if (!alive) return;
        setCatalogue(tiers);
        setAgentsCatalogue(agents);
        setLoadError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setLoadError(
          err?.response?.data?.detail
            || err?.message
            || 'Failed to load pricing - please retry shortly.',
        );
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  // `currentTier` is destructured from useAuth() above (the canonical tier).
  // We only consult `profile.subscription_status` here for the cosmetic
  // "active until <date>" badge - it must NEVER be used to decide whether
  // to render the unlock UI.
  const isUltraActive =
    currentTier === 'ultra' && profile?.subscription_status === 'active';
  const validUntil = formatValidUntil(profile?.subscription_valid_until);

  const handleUpgrade = async (tierId) => {
    if (!isAuthenticated) {
      setActionError('Please sign in first - the Sign In page is in the sidebar.');
      return;
    }
    if (isUltraActive) return; // defensive: the buttons shouldn't even render
    setBusyTier(tierId);
    setActionError(null);
    setSuccessTier(null);

    let checkout = null;
    let handlerResult = null;
    let handlerError = null;

    try {
      const resp = await createBillingCheckout(tierId);
      checkout = resp.data;
    } catch (err) {
      setActionError(
        err?.response?.data?.detail
          || err?.message
          || 'Could not start checkout - please try again.',
      );
      setBusyTier(null);
      return;
    }

    try {
      handlerResult = await openRazorpayCheckout({
        checkout,
        prefill: { email: profile?.email },
        brandName: 'AlphaDesk',
        themeColor: tierId === 'ultra' ? '#f59e0b' : '#94a3b8',
      });
    } catch (err) {
      handlerError = err;
    }

    if (handlerResult) {
      try {
        await verifyBillingPayment({
          razorpay_payment_id: handlerResult.razorpay_payment_id,
          razorpay_signature: handlerResult.razorpay_signature,
          razorpay_order_id: handlerResult.razorpay_order_id,
          razorpay_subscription_id: handlerResult.razorpay_subscription_id,
          tier: tierId,
        });
        await refreshProfile();
        setSuccessTier(tierId);
        setBusyTier(null);
        return;
      } catch (err) {
        console.warn('[Pricing] /verify failed, falling back to reconcile', err);
      }
    }

    if (checkout?.order_id || checkout?.subscription_id) {
      try {
        const { data: reconcile } = await reconcileBillingPayment({
          order_id: checkout.order_id ?? null,
          subscription_id: checkout.subscription_id ?? null,
          tier: tierId,
        });
        if (reconcile?.activated || reconcile?.subscription_tier === tierId) {
          await refreshProfile();
          setSuccessTier(tierId);
          setBusyTier(null);
          return;
        }
      } catch (err) {
        console.warn('[Pricing] /reconcile failed', err);
        if (!handlerError) handlerError = err;
      }
    }

    if (handlerError?.code === 'CHECKOUT_DISMISSED') {
      setActionError('Checkout was closed before payment completed.');
    } else if (handlerError) {
      setActionError(
        handlerError?.response?.data?.detail
          || handlerError?.razorpay?.description
          || handlerError?.message
          || 'Payment failed - please try again.',
      );
    } else {
      setActionError(
        'Payment was not completed. If you were charged, please refresh in '
        + 'a moment - confirmation can take up to 30 seconds.',
      );
    }
    setBusyTier(null);
  };

  const isTestMode = catalogue?.is_test_mode;

  const sortedTiers = useMemo(() => {
    const tiers = catalogue?.tiers ?? [];
    return [...tiers].sort((a, b) => a.price_paise - b.price_paise);
  }, [catalogue]);

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-8 max-w-6xl mx-auto">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center gap-3 pt-4 sm:pt-6">
        <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold uppercase tracking-widest">
          <Sparkles size={11} />
          Built for India · Priced in INR
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 max-w-2xl">
          Pick the plan that matches how you trade.
        </h1>
        <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
          Every plan ships with a real <strong className="text-slate-200">Risk Manager</strong>{' '}
          that sets your stop-loss before you click buy. Upgrade or cancel any
          time - the plan stays active until the period ends.
        </p>
      </div>

      {/* ── Ultra-active VIP banner ──────────────────────────────────────── */}
      {isUltraActive && (
        <UltraMemberBanner validUntil={validUntil} />
      )}

      {/* ── Test mode ────────────────────────────────────────────────────── */}
      {isTestMode && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl px-4 py-3 flex items-start gap-2 text-xs">
          <ShieldCheck size={14} className="shrink-0 mt-0.5" />
          <div>
            <strong>Test mode active.</strong>{' '}
            No real money is charged. Use Razorpay test cards or UPI ID
            <code className="font-mono bg-amber-500/15 px-1 mx-1 rounded">success@razorpay</code>
            to simulate a successful payment.
          </div>
        </div>
      )}

      {/* ── Current plan chip ────────────────────────────────────────────── */}
      {profile && !isUltraActive && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TierCrown tier={currentTier} size={14} />
            <span className="text-xs text-slate-400">Your current plan:</span>
            <span className="text-sm font-semibold text-slate-100 capitalize">
              {TIER_LABEL[currentTier] ?? currentTier}
            </span>
            <span
              className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                profile.subscription_status === 'active'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {profile.subscription_status}
            </span>
          </div>
          {validUntil && (
            <span className="text-[11px] text-slate-500">
              Renews / expires <span className="text-slate-300">{validUntil}</span>
            </span>
          )}
        </div>
      )}

      {/* ── Action feedback ──────────────────────────────────────────────── */}
      {actionError && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl px-4 py-3 flex items-start gap-2 text-xs">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          {actionError}
        </div>
      )}
      {successTier && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl px-4 py-3 flex items-start gap-2 text-xs">
          <Check size={14} className="shrink-0 mt-0.5" />
          Payment successful. Your <strong className="capitalize px-1">{TIER_LABEL[successTier]}</strong>
          plan is now active.
        </div>
      )}

      {/* ── Plan cards ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500 text-sm gap-2">
          <Loader2 size={16} className="animate-spin" />
          Loading pricing…
        </div>
      ) : loadError ? (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl px-4 py-3 text-sm">
          {loadError}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          {sortedTiers.map((tier) => (
            <PlanCard
              key={tier.id}
              tier={tier}
              currentTier={currentTier}
              isUltraActive={isUltraActive}
              busyTier={busyTier}
              isAuthenticated={isAuthenticated}
              onUpgrade={handleUpgrade}
            />
          ))}
        </div>
      )}

      {/* ── The Excel-style feature comparison ───────────────────────────── */}
      <ComparisonTable
        currentTier={currentTier}
        isUltraActive={isUltraActive}
        busyTier={busyTier}
        onUpgrade={handleUpgrade}
        tiersMeta={sortedTiers}
      />

      {/* ── Trust bar ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center pt-2">
        <TrustItem Icon={ShieldCheck} title="Paper trading only" subtitle="No real capital ever at risk" />
        <TrustItem Icon={Zap}         title="Cancel any time"     subtitle="Plan stays active until period end" />
        <TrustItem Icon={CreditCard}  title="UPI · cards · netbanking" subtitle="Razorpay-secured checkout" />
        <TrustItem Icon={Lock}        title="Bank-grade JWT auth" subtitle="Your data never leaves Railway" />
      </div>

      <p className="text-[11px] text-slate-600 text-center mt-2">
        GST applied at checkout. All prices in Indian Rupees.
      </p>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Tier crown with size + colour baked in. Silver for Pro, Gold for Ultra. */
function TierCrown({ tier, size = 14, withGlow = false }) {
  const theme = TIER_THEME[tier] ?? TIER_THEME.free;
  if (tier === 'free') {
    return <Crown size={size} className={theme.crown} />;
  }
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md border ${theme.crownBg} ${
        withGlow ? 'shadow-[0_0_20px_-5px_currentColor]' : ''
      }`}
      style={{ width: size + 10, height: size + 10 }}
    >
      <Crown
        size={size}
        className={`${theme.crown} ${tier === 'ultra' ? 'fill-current' : ''}`}
        // Filling the Ultra crown makes it read as solid gold vs the
        // outline silver Pro crown - instant visual hierarchy.
      />
    </span>
  );
}

function UltraMemberBanner({ validUntil }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent px-5 py-4 sm:py-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 shadow-[0_0_30px_-5px_rgba(245,158,11,0.6)]">
          <Crown size={22} className="text-amber-300 fill-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-bold text-amber-300">
            Premium member
          </p>
          <p className="text-lg font-semibold text-slate-100">
            You're on Ultra Pro - the top plan.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Every agent unlocked. Every cap set to its highest limit. Thank you
            for supporting AlphaDesk.
            {validUntil && (
              <> Your plan renews on <span className="text-amber-200">{validUntil}</span>.</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  tier,
  currentTier,
  isUltraActive,
  busyTier,
  isAuthenticated,
  onUpgrade,
}) {
  const theme = TIER_THEME[tier.id] ?? TIER_THEME.free;
  const isCurrent = currentTier === tier.id;
  const isBusy = busyTier === tier.id;
  // Never offer an upgrade to a paid user on the same tier, and never sell
  // anything at all to an Ultra-active customer.
  const showUpgrade = tier.is_paid && !isCurrent && !isUltraActive;
  const recommended = tier.id === 'ultra';
  const outcome = TIER_OUTCOMES[tier.id] ?? {};
  const badge = TIER_BADGE_TEXT[tier.id];

  return (
    <div
      className={`relative bg-slate-900/70 border ${theme.border} ${theme.glow} rounded-2xl p-5 flex flex-col gap-4 transition-transform duration-200 ${
        recommended ? 'lg:-mt-3 lg:mb-3 lg:scale-[1.03]' : ''
      }`}
    >
      {badge && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] uppercase tracking-widest font-bold ${theme.chip}`}>
          <Star size={10} className="fill-current" />
          {badge}
        </div>
      )}

      {/* Tier name + crown + current badge */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          <TierCrown tier={tier.id} size={14} withGlow={recommended} />
          <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md ${theme.chip}`}>
            {tier.name}
          </span>
        </div>
        {isCurrent && (
          <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Current
          </span>
        )}
      </div>

      {outcome.audience && (
        <p className={`text-[11px] uppercase tracking-widest font-semibold ${theme.accent}`}>
          {outcome.audience}
        </p>
      )}

      <div>
        <p className="text-base font-semibold text-slate-100 leading-snug">
          {outcome.headline ?? tier.description}
        </p>
        {outcome.subhead && (
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{outcome.subhead}</p>
        )}
      </div>

      {/* Price */}
      <div>
        <p className="text-3xl font-bold text-slate-100">
          {tier.is_paid ? INR.format(tier.price_inr) : 'Free'}
          {tier.is_paid && (
            <span className="text-sm font-normal text-slate-500 ml-1">/ month</span>
          )}
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          {tier.is_paid
            ? `Billed every ${tier.period_days} days · GST extra at checkout`
            : 'Forever free - no card required'}
        </p>
        {tier.id === 'pro' && (
          <p className="text-[11px] text-slate-300/90 mt-1">
            About ₹{Math.round(tier.price_inr / 30)} per day - less than a coffee.
          </p>
        )}
        {tier.id === 'ultra' && (
          <p className="text-[11px] text-amber-300/90 mt-1">
            Just ₹{800 - 500} more than Pro - for 4× the evaluations, every
            agent, and unlimited watchlist.
          </p>
        )}
      </div>

      {/* Short feature headline - the long version lives in the table below */}
      <ul className="flex flex-col gap-2 text-xs text-slate-300">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check size={12} className="text-emerald-400 mt-1 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-auto pt-3">
        {isUltraActive && tier.is_paid ? (
          // Already a paid premium member - replace every sell button with
          // a gold "premium" chip so the page never tries to upsell them.
          <div className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold bg-amber-500/15 text-amber-300 border border-amber-400/40">
            <Crown size={14} className="fill-amber-300" />
            You're a Premium member
          </div>
        ) : showUpgrade ? (
          <button
            onClick={() => onUpgrade(tier.id)}
            disabled={isBusy || !isAuthenticated}
            className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${theme.button}`}
          >
            {isBusy ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Opening checkout…
              </>
            ) : (
              <>
                <CreditCard size={14} />
                {tier.id === 'ultra' ? 'Get Ultra Pro' : `Upgrade to ${tier.name}`}
              </>
            )}
          </button>
        ) : (
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold bg-slate-800 text-slate-500 cursor-default"
          >
            {isCurrent ? 'Active' : 'Included'}
          </button>
        )}
        {showUpgrade && !isAuthenticated && (
          <p className="text-[11px] text-amber-400/80 mt-2 text-center">
            Sign in first to subscribe.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * The Excel-style comparison. Three columns for the three plans; sticky
 * header on desktop so labels stay readable while scanning a long list.
 * Horizontal scroll on narrow screens (we never squish the columns so the
 * tick marks stay readable - a 60-year-old's eyes thank us).
 */
function ComparisonTable({
  currentTier,
  isUltraActive,
  busyTier,
  onUpgrade,
  tiersMeta,
}) {
  // Resolve tier meta objects keyed by id for the footer CTAs.
  const tiersById = useMemo(() => {
    const m = {};
    (tiersMeta ?? []).forEach((t) => { m[t.id] = t; });
    return m;
  }, [tiersMeta]);

  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/40">
        <h2 className="text-lg font-semibold text-slate-100">
          Compare every feature, side by side
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          A tick means "yes, included". A cross means "not included - needs an
          upgrade". Numbers are monthly limits.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <colgroup>
            <col className="w-[34%]" />
            <col className="w-[30%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead className="bg-slate-950/60 sticky top-0 z-10">
            <tr>
              <th className="text-left text-[11px] uppercase tracking-widest font-bold text-slate-400 px-4 py-3 border-b border-slate-800">
                Feature
              </th>
              <th className="text-left text-[11px] uppercase tracking-widest font-bold text-slate-400 px-4 py-3 border-b border-slate-800">
                What it does
              </th>
              <th className="text-center text-[11px] uppercase tracking-widest font-bold text-slate-400 px-3 py-3 border-b border-slate-800">
                <div className="flex items-center justify-center gap-1.5">
                  <TierCrown tier="free" size={12} />
                  Free
                </div>
              </th>
              <th className="text-center text-[11px] uppercase tracking-widest font-bold text-slate-200 px-3 py-3 border-b border-slate-800 bg-slate-400/5">
                <div className="flex items-center justify-center gap-1.5">
                  <TierCrown tier="pro" size={12} />
                  Pro
                </div>
              </th>
              <th className="text-center text-[11px] uppercase tracking-widest font-bold text-amber-300 px-3 py-3 border-b border-slate-800 bg-amber-500/5">
                <div className="flex items-center justify-center gap-1.5">
                  <TierCrown tier="ultra" size={12} />
                  Ultra Pro
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {TABLE_SECTIONS.map((section) => (
              <SectionBlock key={section.title} section={section} />
            ))}
          </tbody>

          {/* Footer CTAs - skipped entirely for Ultra-active users so the
              table never tries to upsell them. */}
          {!isUltraActive && (
            <tfoot>
              <tr>
                <td colSpan={2} className="px-4 py-4 bg-slate-950/40 border-t border-slate-800">
                  <p className="text-xs text-slate-400">
                    Pick your plan and upgrade in one click:
                  </p>
                </td>
                <td className="px-3 py-4 bg-slate-950/40 border-t border-slate-800 text-center">
                  {currentTier === 'free' ? (
                    <span className="text-[11px] text-slate-500">Your plan</span>
                  ) : null}
                </td>
                <td className="px-3 py-4 bg-slate-950/40 border-t border-slate-800 text-center">
                  <TableUpgradeButton
                    tierMeta={tiersById.pro}
                    currentTier={currentTier}
                    busyTier={busyTier}
                    onUpgrade={onUpgrade}
                  />
                </td>
                <td className="px-3 py-4 bg-slate-950/40 border-t border-slate-800 text-center">
                  <TableUpgradeButton
                    tierMeta={tiersById.ultra}
                    currentTier={currentTier}
                    busyTier={busyTier}
                    onUpgrade={onUpgrade}
                  />
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}

function SectionBlock({ section }) {
  return (
    <>
      <tr>
        <td
          colSpan={5}
          className="px-4 py-2 bg-slate-950/50 border-t border-b border-slate-800 text-[11px] uppercase tracking-widest font-bold text-slate-400"
        >
          {section.title}
        </td>
      </tr>
      {section.rows.map((row, idx) => (
        <tr
          key={row.feature}
          className={`border-b border-slate-800/60 ${idx % 2 === 0 ? 'bg-slate-900/20' : 'bg-slate-900/40'} hover:bg-slate-800/30 transition-colors`}
        >
          <td className="px-4 py-3 text-slate-100 font-medium align-top">
            {row.feature}
          </td>
          <td className="px-4 py-3 text-slate-400 text-xs leading-relaxed align-top">
            {row.what}
          </td>
          <td className="px-3 py-3 text-center align-middle">
            <Mark value={row.values.free} />
          </td>
          <td className="px-3 py-3 text-center align-middle bg-slate-400/5">
            <Mark value={row.values.pro} />
          </td>
          <td className="px-3 py-3 text-center align-middle bg-amber-500/5">
            <Mark value={row.values.ultra} />
          </td>
        </tr>
      ))}
    </>
  );
}

/**
 * Renders a tick, cross, or numeric cap in a cell. Numeric values are shown
 * in a bordered pill so the eye reads them as "a measured amount" rather
 * than just a floating number.
 */
function Mark({ value }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30">
        <Check size={13} className="text-emerald-300" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800/60 border border-slate-700">
        <X size={13} className="text-slate-500" />
      </span>
    );
  }
  // Numeric / text cap e.g. "25 / mo", "Unlimited", "5".
  return (
    <span className="inline-block px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-200">
      {value}
    </span>
  );
}

function TableUpgradeButton({ tierMeta, currentTier, busyTier, onUpgrade }) {
  if (!tierMeta) return null;
  const tierId = tierMeta.id;
  const theme = TIER_THEME[tierId] ?? TIER_THEME.free;
  const userRank = TIER_RANK[currentTier] ?? 0;
  const thisRank = TIER_RANK[tierId] ?? 0;
  const isBusy = busyTier === tierId;

  if (thisRank <= userRank) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 font-semibold">
        <Check size={11} /> Included
      </span>
    );
  }
  return (
    <button
      onClick={() => onUpgrade(tierId)}
      disabled={isBusy}
      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${theme.button}`}
    >
      {isBusy ? (
        <Loader2 size={11} className="animate-spin" />
      ) : (
        <Crown size={11} className={tierId === 'ultra' ? 'fill-current' : ''} />
      )}
      {tierId === 'ultra' ? 'Go Ultra' : 'Upgrade'}
    </button>
  );
}

function TrustItem({ Icon, title, subtitle }) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl px-3 py-3 flex flex-col items-center gap-1">
      <Icon size={16} className="text-emerald-400" />
      <p className="text-xs font-semibold text-slate-200">{title}</p>
      <p className="text-[10px] text-slate-500">{subtitle}</p>
    </div>
  );
}
