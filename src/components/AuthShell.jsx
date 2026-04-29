import { Link } from 'react-router-dom';
import { AlertCircle, Sparkles, BarChart3, ShieldCheck } from 'lucide-react';
import UpgradeBanner from './UpgradeBanner';

/**
 * Layout used by /sign-in and /sign-up.
 *
 * Two-column on desktop:
 *   left  - branded gradient hero panel with feature highlights
 *   right - the actual form (children)
 *
 * On mobile the hero collapses to a thin top strip and the form becomes the
 * primary view.
 *
 * The gold "Upgrade now" banner from the launch design sits above the whole
 * grid so anonymous visitors see the value-prop before signing in.
 */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">

      {/* ── Top upgrade banner ─────────────────────────────────────── */}
      <div className="px-4 pt-6">
        <UpgradeBanner currency="INR" onCta={() => { window.location.href = '/plans'; }} />
      </div>

      {/* ── Two-column body ───────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 px-4 sm:px-6 lg:px-12 py-8 sm:py-12">

        {/* Left: brand + feature pitch (hidden on small screens) */}
        <aside className="hidden lg:flex flex-col justify-center pr-12">
          <Link to="/sign-in" className="flex items-center gap-3 mb-8 w-fit">
            <span className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <span className="text-emerald-400 text-2xl font-bold leading-none">α</span>
            </span>
            <div>
              <p className="text-2xl font-bold tracking-tight">EquiQuant</p>
              <p className="text-xs text-slate-500">Your AI Quant Researcher</p>
            </div>
          </Link>

          <h2 className="text-3xl xl:text-4xl font-bold leading-tight">
            Institutional-grade research,<br />
            <span className="bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">
              for every retail trader.
            </span>
          </h2>

          <ul className="mt-8 flex flex-col gap-4 max-w-md">
            <Feature
              Icon={Sparkles}
              title="8-agent committee"
              text="Momentum, mean-reversion, statistical-arb and 5 more specialists vote on every trade."
            />
            <Feature
              Icon={BarChart3}
              title="Real news sentiment"
              text="GPT-powered analyst reads earnings, filings, and headlines - flags fraud and earnings collapses before they hit your portfolio."
            />
            <Feature
              Icon={ShieldCheck}
              title="Built for both markets"
              text="One product for both NYSE / NASDAQ and NSE / BSE - pick your home market in settings."
            />
          </ul>
        </aside>

        {/* Right: form card */}
        <main className="flex items-center justify-center">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-7 sm:p-9 shadow-2xl shadow-emerald-500/5">

            {/* Mobile-only logo above title */}
            <div className="lg:hidden flex items-center gap-2.5 mb-5">
              <span className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                <span className="text-emerald-400 text-lg font-bold leading-none">α</span>
              </span>
              <div>
                <p className="text-base font-bold tracking-tight">EquiQuant</p>
                <p className="text-[11px] text-slate-500">AI Quant Researcher</p>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-slate-400 mt-1.5 mb-6">{subtitle}</p>}

            {children}

            {footer && <div className="mt-6 pt-5 border-t border-slate-800">{footer}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}

function Feature({ Icon, title, text }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="shrink-0 w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-emerald-300 flex items-center justify-center">
        <Icon size={16} />
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-100">{title}</p>
        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{text}</p>
      </div>
    </li>
  );
}

// ── Reusable form bits ───────────────────────────────────────────────────────

export function Field({ label, type, value, onChange, ...rest }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none rounded-lg px-3.5 py-2.5 text-sm text-slate-100 transition-colors"
        {...rest}
      />
    </label>
  );
}

export function ErrorBanner({ message }) {
  return (
    <div className="flex items-start gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md px-3 py-2">
      <AlertCircle size={13} className="shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

export function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <span className="flex-1 h-px bg-slate-800" />
      <span className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold">{label}</span>
      <span className="flex-1 h-px bg-slate-800" />
    </div>
  );
}

export function ConfigurationMissing({ message }) {
  return (
    <AuthShell title="Auth not configured" subtitle="Backend & frontend env vars need to be set">
      <ErrorBanner message={message} />
    </AuthShell>
  );
}
