import { Sparkles } from 'lucide-react';

/**
 * Gold "Upgrade now" banner shown above the auth screens (and anywhere else
 * we want to nudge free users toward Pro).
 *
 * Pricing is locale-aware via the `currency` prop; defaults to INR since
 * the launch market is India.
 */
export default function UpgradeBanner({ currency = 'INR', onCta }) {
  const price = currency === 'INR' ? '₹499' : '$9';

  return (
    <button
      type="button"
      onClick={onCta}
      className="w-full max-w-2xl mx-auto group flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-shadow ring-1 ring-amber-300/60"
    >
      <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-950/15 ring-1 ring-slate-950/20">
        <Sparkles size={16} />
      </span>
      <span className="flex-1 text-left flex flex-col leading-tight">
        <span className="text-sm sm:text-base tracking-wide uppercase">
          Upgrade now - your own AI Quant Researcher
        </span>
        <span className="text-[11px] sm:text-xs font-semibold opacity-80 mt-0.5 normal-case tracking-normal">
          Unlock live sentiment, AI Radar &amp; pre-market intelligence - starting at <span className="underline underline-offset-2">{price}/mo</span>
        </span>
      </span>
      <span className="shrink-0 hidden sm:inline-block text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-slate-950 text-amber-300">
        SEE PLANS →
      </span>
    </button>
  );
}
