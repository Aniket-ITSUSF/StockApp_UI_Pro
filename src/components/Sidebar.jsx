import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Briefcase, FlaskConical, Settings as SettingsIcon, RefreshCw, WifiOff,
  Radar, Clock, Globe, CreditCard, Sparkles, Lock,
} from 'lucide-react';
import { useBackend } from '../context/BackendContext';
import { useAuth } from '../hooks/useAuth';
import { updateMe } from '../services/api';
import { US_ENABLED } from '../utils/launch';
import AuthBadge from './AuthBadge';

/**
 * NAV - single source of truth for both desktop sidebar and mobile bottom bar.
 *
 * Each entry knows whether it's accessible without auth. /analyze and /plans
 * are public; everything else routes guests to /sign-in via the shell instead
 * of rendering disabled.
 */
const NAV = [
  { to: '/analyze',   label: 'Analyze',         icon: Sparkles,     publicRoute: true  },
  { to: '/home',      label: 'Home',            icon: Home,         publicRoute: false },
  { to: '/holdings',  label: 'Holdings',        icon: Briefcase,    publicRoute: false },
  { to: '/today',     label: "Intraday's Play", icon: Globe,        publicRoute: false },
  { to: '/discovery', label: 'Discovery',       icon: Radar,        publicRoute: false },
  { to: '/history',   label: 'History',         icon: Clock,        publicRoute: false },
  { to: '/backtest',  label: 'Backtest',        icon: FlaskConical, publicRoute: false },
  { to: '/plans',     label: 'Plans',           icon: CreditCard,   publicRoute: true  },
  { to: '/settings',  label: 'Settings',        icon: SettingsIcon, publicRoute: false },
];

const MOBILE_NAV = NAV.filter(({ to }) =>
  ['/analyze', '/home', '/holdings', '/today', '/discovery'].includes(to),
);

// ── Market badge (India-only during launch) ──────────────────────────────────
function MarketIndicator() {
  const { profile, refreshProfile, isAuthenticated } = useAuth();
  const [busy, setBusy] = useState(false);

  // Persist 'IN' to backend on first sign-in so market_preference matches
  // the locked UI state (otherwise old US-tagged accounts stay on US).
  useEffect(() => {
    if (!US_ENABLED && isAuthenticated && profile && profile.market_preference !== 'IN') {
      setBusy(true);
      updateMe({ market_preference: 'IN' })
        .then(refreshProfile)
        .catch(() => { /* non-fatal */ })
        .finally(() => setBusy(false));
    }
  }, [isAuthenticated, profile, refreshProfile]);

  if (US_ENABLED) return null; // existing select dropdown will render instead

  return (
    <div className="px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-800">
      <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
        Market
      </p>
      <p className="text-sm font-semibold text-slate-100 mt-1 flex items-center gap-1.5">
        <span>🇮🇳 India (NSE / BSE)</span>
        {busy && <RefreshCw size={9} className="animate-spin text-slate-400" />}
      </p>
      <p className="text-xs text-slate-400 mt-0.5">
        US support coming soon
      </p>
    </div>
  );
}

// ── Promo banner shown to unauthenticated users ──────────────────────────────
function GuestUpgradePromo() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate('/sign-up')}
      className="block w-full text-left p-3 rounded-xl bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 hover:shadow-amber-500/40 transition-shadow ring-1 ring-amber-300/60"
    >
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="shrink-0" />
        <span className="text-xs uppercase tracking-wider leading-none">
          Upgrade Now
        </span>
      </div>
      <p className="text-sm font-bold leading-snug mt-1.5">
        Your own AI Quant Researcher
      </p>
      <p className="text-xs font-semibold opacity-80 mt-0.5">
        Starting at <span className="underline">₹499/mo</span> →
      </p>
    </button>
  );
}

// ── Backend status footer ────────────────────────────────────────────────────
function StatusFooter() {
  const { status, lastChecked, retry, url } = useBackend();
  const { isAuthenticated } = useAuth();
  const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');

  const states = {
    checking:     { dot: 'bg-amber-400',                 label: 'Checking…',   text: 'text-amber-400'   },
    connected:    { dot: 'bg-emerald-400 animate-pulse', label: 'Connected',   text: 'text-emerald-400' },
    disconnected: { dot: 'bg-rose-500',                  label: 'Unreachable', text: 'text-rose-400'    },
  };
  const s = states[status];

  return (
    <div className="p-3 border-t border-slate-800 flex flex-col gap-2">

      {!isAuthenticated && <GuestUpgradePromo />}

      <MarketIndicator />
      <AuthBadge />

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50">
        {status === 'checking'
          ? <RefreshCw size={11} className="text-amber-400 animate-spin shrink-0" />
          : <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
        }
        <div className="flex flex-col min-w-0">
          <span className={`text-xs font-semibold leading-none ${s.text}`}>{s.label}</span>
          <span className="text-xs text-slate-400 truncate mt-0.5" title={url}>{displayUrl}</span>
        </div>
      </div>

      {status === 'disconnected' && (
        <button
          onClick={retry}
          className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 text-xs font-semibold transition-colors"
        >
          <WifiOff size={11} />
          Retry Connection
        </button>
      )}

      {lastChecked && status !== 'checking' && (
        <p className="text-xs text-slate-500 text-center">
          Checked {lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      )}
    </div>
  );
}

// ── Single nav item - handles locked/unlocked variants ───────────────────────
function NavItem({ to, label, icon: NavIcon, locked, onLockedClick }) {
  if (locked) {
    return (
      <button
        type="button"
        onClick={onLockedClick}
        title="Sign in to access"
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-400 hover:bg-slate-800/40 border border-transparent w-full text-left transition-colors"
      >
        <NavIcon size={15} />
        <span className="flex-1">{label}</span>
        <Lock size={11} className="text-slate-700" />
      </button>
    );
  }
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-100 w-full text-left ${
        isActive
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
      }`}
    >
      <NavIcon size={15} />
      {label}
    </NavLink>
  );
}

// ── Mobile bottom navigation bar ─────────────────────────────────────────────
export function MobileNav() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 flex items-stretch safe-bottom">
      {MOBILE_NAV.map(({ to, label, icon: NavIcon, publicRoute }) => {
        const locked = !publicRoute && !isAuthenticated;
        if (locked) {
          return (
            <button
              key={to}
              onClick={() => navigate('/sign-in', { state: { from: location.pathname } })}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              <NavIcon size={18} />
              <span className="leading-none flex items-center gap-1">
                {label} <Lock size={8} />
              </span>
            </button>
          );
        }
        return (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors ${
              isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <NavIcon size={18} />
            <span className="leading-none">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

// ── Desktop sidebar ──────────────────────────────────────────────────────────
export default function Sidebar() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLockedClick = () => {
    navigate('/sign-in', { state: { from: location.pathname + location.search } });
  };

  return (
    <aside className="hidden md:flex w-56 bg-slate-900 border-r border-slate-800 flex-col h-full shrink-0">

      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-800">
        <NavLink to="/analyze" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
            <span className="text-emerald-400 text-base font-bold leading-none">α</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100 leading-none tracking-wide">EquiQuant</p>
            <p className="text-xs text-slate-400 mt-0.5">AI Quant Researcher</p>
          </div>
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2.5 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const locked = !item.publicRoute && !isAuthenticated;
          return (
            <NavItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              locked={locked}
              onLockedClick={handleLockedClick}
            />
          );
        })}
      </nav>

      <StatusFooter />
    </aside>
  );
}
