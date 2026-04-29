import { useMemo, useState } from 'react';
import {
  Settings as SettingsIcon,
  Info,
  Wifi,
  WifiOff,
  RefreshCw,
  Lock,
  CheckCircle2,
  Sparkles,
  Crown,
  Brain,
  Radar,
  Shield,
  Gauge,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBackend } from '../context/BackendContext';
import { useAuth } from '../hooks/useAuth';
import { updateMe } from '../services/api';

/**
 * Settings - Phase 7
 *
 * Three sections:
 *   1. System status (existing - backend reachability + paper trading badge)
 *   2. Plan + monthly usage meter (new - see what you're consuming this month)
 *   3. Agent committee toggles (new - Pro+ can opt agents on/off; Free sees
 *      every agent listed, with locked ones marked and a single CTA to upgrade)
 *
 * Psychology
 *   - Locked rows still SHOW the description so the user *feels* what they're
 *     missing. Padlock + tier badge make the gap concrete.
 *   - "Upgrade to Pro" CTA appears inline next to each locked agent row, not
 *     hidden behind a tab.
 *   - Usage meter turns amber at 75 % and rose at 95 % to nudge upgrades
 *     before the cap is actually hit.
 */

const BACKEND_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

const CONFIG_ROWS = [
  { label: 'Backend URL',           value: BACKEND_URL },
  { label: 'Consensus Threshold',   value: '65%' },
  { label: 'Trading Mode',          value: 'Paper Trading Only' },
  { label: 'Auto-refresh interval', value: '60 seconds' },
  { label: 'Max Recent Feed',       value: '20 evaluations' },
];

// Silver for Pro, Gold for Ultra - universal medal hierarchy. Free is the
// default muted slate. The `crown` class is used by `TierCrownChip` below.
const TIER_BADGE = {
  free: {
    label: 'Free',
    cls:   'bg-slate-800 text-slate-300 border-slate-700',
    crown: 'text-slate-400',
  },
  pro: {
    label: 'Pro',
    cls:   'bg-slate-400/15 text-slate-100 border-slate-300/40',
    crown: 'text-slate-200',
    crownFilled: false,
  },
  ultra: {
    label: 'Ultra Pro',
    cls:   'bg-amber-500/15 text-amber-200 border-amber-400/40',
    crown: 'text-amber-300',
    crownFilled: true,
  },
};

/** Inline crown + tier label chip. Gold/filled for Ultra, silver/outline for Pro. */
function TierCrownChip({ tier, size = 10 }) {
  const meta = TIER_BADGE[tier] ?? TIER_BADGE.free;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-md border ${meta.cls}`}>
      <Crown
        size={size}
        className={`${meta.crown} ${meta.crownFilled ? 'fill-current' : ''}`}
      />
      {meta.label}
    </span>
  );
}

const QUOTA_META = {
  evaluations:    { label: 'Evaluations',           Icon: Brain,   help: 'Full AI evaluations of a stock.' },
  discoveries:    { label: 'AI Discovery runs',     Icon: Sparkles,help: 'Hidden second-order plays - finds the stocks that always move with the one you searched.' },
  premarket_runs: { label: 'Pre-Market Radar runs', Icon: Radar,   help: 'On-demand overnight news sweeps before the bell.' },
  news_refresh:   { label: 'Live news refreshes',   Icon: RefreshCw,help: 'Force-refresh news sentiment past the 2-hour cache.' },
};

function pctBarColour(used, limit) {
  if (limit === null || limit === undefined) return 'bg-emerald-500';
  if (limit <= 0) return 'bg-slate-700';
  const pct = used / limit;
  if (pct >= 0.95) return 'bg-rose-500';
  if (pct >= 0.75) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function UsageMeter({ namespace, data }) {
  const meta = QUOTA_META[namespace];
  if (!meta) return null;
  const { Icon, label, help } = meta;
  const used = data?.used ?? 0;
  const limit = data?.limit;
  const unlimited = limit === null || limit === undefined;
  const locked = limit === 0;
  const pct = unlimited ? 0 : Math.min(100, Math.round(((used) / Math.max(1, limit)) * 100));

  return (
    <div className="flex flex-col gap-1.5 bg-slate-900/60 border border-slate-800 rounded-xl p-3">
      <div className="flex items-center gap-2">
        <Icon size={13} className="text-slate-400 shrink-0" />
        <span className="text-xs font-semibold text-slate-200">{label}</span>
        <span className="ml-auto text-xs font-mono text-slate-400">
          {locked ? (
            <span className="text-slate-500">Locked</span>
          ) : unlimited ? (
            <span className="text-emerald-300">{used} / ∞</span>
          ) : (
            <>
              {used} <span className="text-slate-600">/ {limit}</span>
            </>
          )}
        </span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            locked ? 'bg-slate-700' : pctBarColour(used, limit)
          }`}
          style={{ width: locked ? '100%' : unlimited ? '12%' : `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-slate-500 leading-snug">{help}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const meta = {
    checking:     { Icon: RefreshCw, color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',     label: 'Checking…' },
    connected:    { Icon: Wifi,      color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Connected' },
    disconnected: { Icon: WifiOff,   color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20',       label: 'Unreachable' },
  }[status];
  return meta;
}

export default function Settings() {
  const navigate = useNavigate();
  const onNavigate = (pageId) => {
    // Backwards-compat shim - old code passed string page IDs.
    const map = { pricing: '/plans', dashboard: '/home', settings: '/settings' };
    navigate(map[pageId] ?? `/${pageId}`);
  };
  const { status, lastChecked, retry } = useBackend();
  const statusMeta = StatusBadge({ status });
  const { Icon: StatusIcon } = statusMeta;
  // Tier authority + agent catalogue come from AuthContext - Settings does
  // NOT do its own /agents fetch any more. That keeps every page (sidebar,
  // analyze, premarket, settings) reading the exact same numbers.
  const {
    profile,
    isAuthenticated,
    refreshProfile,
    tier,
    tierLimits,
    usage,
    agentsCatalogue: catalogue,
  } = useAuth();

  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [actionError, setActionError] = useState(null);

  const tierBadge = TIER_BADGE[tier] ?? TIER_BADGE.free;
  const canToggle = tierLimits?.custom_agent_toggles ?? false;

  const enabledSet = useMemo(() => {
    const list = profile?.enabled_agents ?? [];
    return new Set(list);
  }, [profile?.enabled_agents]);

  const handleToggle = async (agent) => {
    if (!agent.is_unlocked) return;          // locked: do nothing
    if (agent.name === 'risk_manager') return; // veto agent - non-disablable
    if (!canToggle) return;
    if (!isAuthenticated) {
      setActionError('Please sign in to customise your agents.');
      return;
    }

    const next = new Set(enabledSet);
    if (next.has(agent.name)) {
      next.delete(agent.name);
    } else {
      next.add(agent.name);
    }
    next.add('risk_manager'); // backend re-adds anyway, keep client mirror honest

    setBusy(true);
    setActionError(null);
    try {
      await updateMe({ enabled_agents: Array.from(next) });
      await refreshProfile();
      setSavedAt(new Date());
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setActionError(
        (typeof detail === 'string' ? detail : detail?.message)
          || err?.message
          || 'Could not save your agent preferences.',
      );
    } finally {
      setBusy(false);
    }
  };

  const groupedAgents = useMemo(() => {
    const all = catalogue?.agents ?? [];
    return {
      committee: all.filter((a) => a.category === 'committee'),
      cognitive: all.filter((a) => a.category === 'cognitive'),
    };
  }, [catalogue]);

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6 max-w-5xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <SettingsIcon size={18} className="text-slate-400" />
        <div>
          <h1 className="text-xl font-bold text-slate-100">Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">Plan, agents & system configuration</p>
        </div>
      </div>

      {/* ── Plan summary ───────────────────────────────────────────── */}
      {/*
       * Plan badge colour mirrors the Pricing page exactly:
       *   - Free  → muted slate + outline crown
       *   - Pro   → silver metallic + outline crown
       *   - Ultra → gold + filled crown
       * So the user sees the same visual hierarchy on both pages.
       */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
              tier === 'ultra'
                ? 'bg-amber-500/15 border-amber-400/40'
                : tier === 'pro'
                ? 'bg-slate-400/15 border-slate-300/40'
                : 'bg-slate-800 border-slate-700'
            }`}
          >
            <Crown
              size={18}
              className={`${tierBadge.crown} ${tierBadge.crownFilled ? 'fill-current' : ''}`}
            />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest">Current plan</p>
            <p className="text-lg font-semibold text-slate-100 flex items-center gap-2 mt-0.5">
              {tierBadge.label}
              <TierCrownChip tier={tier} size={10} />
            </p>
            {tier === 'free' && (
              <p className="text-[11px] text-slate-500 mt-1">
                You're missing AI Discovery, live news refreshes & the full committee.
              </p>
            )}
          </div>
        </div>
        {tier !== 'ultra' && (
          <button
            type="button"
            onClick={() => onNavigate?.('pricing')}
            className={`shrink-0 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tier === 'free'
                ? 'bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-slate-950'
                : 'bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-slate-950'
            }`}
          >
            <Crown size={14} className="fill-current" />
            {tier === 'free' ? 'Unlock the full plan' : 'Upgrade to Ultra Pro'}
          </button>
        )}
      </div>

      {/* ── Action feedback ────────────────────────────────────────── */}
      {actionError && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl px-4 py-3 flex items-start gap-2 text-xs">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          {actionError}
        </div>
      )}
      {savedAt && !actionError && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl px-4 py-3 flex items-center gap-2 text-xs">
          <CheckCircle2 size={14} />
          Saved {savedAt.toLocaleTimeString()}.
        </div>
      )}

      {/* ── Monthly usage ──────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/50 flex items-center gap-2">
          <Gauge size={13} className="text-slate-500" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Monthly usage · {profile?.usage_summary?.period ?? '—'}
          </p>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.keys(QUOTA_META).map((ns) => (
            <UsageMeter key={ns} namespace={ns} data={usage[ns]} />
          ))}
        </div>
        {tier !== 'ultra' && (
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/30 flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500">
              Caps reset on the 1st of every month. Hit a cap mid-month? Upgrade
              instantly - your remaining usage carries over.
            </p>
            <button
              type="button"
              onClick={() => onNavigate?.('pricing')}
              className="shrink-0 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
            >
              See plans →
            </button>
          </div>
        )}
      </div>

      {/* ── Agent toggle grid ──────────────────────────────────────── */}
      {/*
       * Both sections use the same AgentRow. On the Free tier every locked
       * agent still renders with a disabled toggle (stuck OFF) plus a gold
       * crown - so users can see every capability exists, feel the gap,
       * and tap the crown to go straight to Pricing. There is no hidden
       * "AI features" section for paid users only - both committee and
       * cognitive/AI rows are always visible.
       */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/50 flex items-center gap-2">
          <Brain size={13} className="text-slate-500" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Trading committee
          </p>
          <span className="ml-auto text-[11px] text-slate-500">
            {canToggle
              ? 'Tap an agent to enable/disable'
              : 'Tap the crown to unlock'}
          </span>
        </div>
        {groupedAgents.committee.map((agent) => (
          <AgentRow
            key={agent.name}
            agent={agent}
            enabled={enabledSet.has(agent.name)}
            canToggle={canToggle}
            onToggle={handleToggle}
            onUpgrade={() => onNavigate?.('pricing')}
            busy={busy}
          />
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/50 flex items-center gap-2">
          <Sparkles size={13} className="text-slate-500" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            AI features
          </p>
          <span className="ml-auto text-[11px] text-slate-500">
            {canToggle
              ? 'Tap an agent to enable/disable'
              : 'Tap the crown to unlock'}
          </span>
        </div>
        {groupedAgents.cognitive.map((agent) => (
          <AgentRow
            key={agent.name}
            agent={agent}
            enabled={enabledSet.has(agent.name)}
            canToggle={canToggle}
            onToggle={handleToggle}
            onUpgrade={() => onNavigate?.('pricing')}
            busy={busy}
          />
        ))}
      </div>

      {/* ── System status ──────────────────────────────────────────── */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-start gap-2 text-xs text-emerald-400/80">
        <Info size={13} className="shrink-0 mt-0.5" />
        This application operates in <strong>&nbsp;Paper Trading Mode&nbsp;</strong> only.
        No real capital is ever at risk.
      </div>

      <div className={`border rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${statusMeta.bg}`}>
        <div className="flex items-center gap-2.5">
          <StatusIcon size={14} className={`shrink-0 ${statusMeta.color} ${status === 'checking' ? 'animate-spin' : ''}`} />
          <div>
            <p className={`text-sm font-semibold ${statusMeta.color}`}>
              Backend {statusMeta.label}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{BACKEND_URL}</p>
            {lastChecked && (
              <p className="text-[11px] text-slate-600 mt-0.5">
                Last checked {lastChecked.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={retry}
          disabled={status === 'checking'}
          className="shrink-0 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={11} className={status === 'checking' ? 'animate-spin' : ''} />
          {status === 'checking' ? 'Checking…' : 'Test Connection'}
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Runtime configuration</p>
        </div>
        {CONFIG_ROWS.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30 transition-colors">
            <span className="text-sm text-slate-400">{label}</span>
            <span className="text-sm font-mono text-slate-200 bg-slate-800 px-2.5 py-0.5 rounded-md">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * One agent row in the Settings grid.
 *
 * Visibility rules
 * ----------------
 *   * Every agent (free, pro, ultra) is rendered for every user. We never
 *     hide rows by tier - locked agents are SHOWN so the free user can
 *     see exactly what they're missing.
 *
 * Toggle behaviour
 * ----------------
 *   * Risk Manager  → renders a non-disablable "Always on" pill. No toggle.
 *   * Locked agent  → toggle is rendered but disabled and stuck OFF. A gold
 *                     crown sits next to it - clicking it routes to /pricing.
 *   * Free user     → ALL non-free agents fall into "locked" above. Their
 *                     own free-tier agents still render their toggles, but
 *                     `canToggle === false` so they're disabled too - only
 *                     Pro+ may customise their committee.
 *   * Pro / Ultra   → toggle is fully interactive on every unlocked agent.
 */
function AgentRow({ agent, enabled, canToggle, onToggle, onUpgrade, busy }) {
  const isLocked = !agent.is_unlocked;
  const isVeto = agent.name === 'risk_manager';
  // Locked rows show the *minimum* tier needed to unlock them.
  const lockTier = agent.tier_required;
  const interactive = !isLocked && !isVeto && canToggle;

  const rowClasses = `flex items-start sm:items-center justify-between gap-4 px-5 py-4 border-b border-slate-800/60 last:border-0 ${
    isLocked ? 'bg-slate-950/30' : 'hover:bg-slate-800/20'
  }`;

  return (
    <div className={rowClasses}>
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
            isLocked
              ? 'bg-slate-900 border-slate-800'
              : 'bg-slate-800 border-slate-700'
          }`}
        >
          {isLocked ? (
            <Lock size={13} className="text-slate-600" />
          ) : isVeto ? (
            <Shield size={13} className="text-rose-300" />
          ) : (
            <CheckCircle2 size={13} className="text-emerald-300" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <span className={`text-sm font-semibold ${isLocked ? 'text-slate-400' : 'text-slate-100'}`}>
              {agent.display_name}
            </span>
            <TierCrownChip tier={agent.tier_required} size={10} />
            {isVeto && (
              <span className="text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-md border bg-rose-500/10 text-rose-300 border-rose-500/30">
                Always on
              </span>
            )}
          </div>
          <p className={`text-xs mt-1 leading-relaxed ${isLocked ? 'text-slate-500' : 'text-slate-400'}`}>
            {agent.plain_description}
          </p>
        </div>
      </div>

      {/* Right-hand control cluster.
          Layout: [toggle] [optional gold crown to upgrade].
          The toggle is *always* rendered so the free-user UI matches the
          paid-user UI - same shape, just disabled. The gold crown only
          appears when an upgrade is actually available. */}
      <div className="shrink-0 flex items-center gap-2">
        {isVeto ? (
          <span className="text-[11px] text-slate-500 font-mono px-2 py-1 rounded-md bg-slate-800/50 border border-slate-700/60">
            veto
          </span>
        ) : (
          <>
            <button
              type="button"
              onClick={() => interactive && onToggle(agent)}
              disabled={!interactive || busy}
              aria-pressed={interactive ? enabled : false}
              aria-label={
                isLocked
                  ? `${agent.display_name} - locked, requires ${TIER_BADGE[lockTier]?.label ?? 'upgrade'}`
                  : `Toggle ${agent.display_name}`
              }
              title={
                isLocked
                  ? `Locked - included in ${TIER_BADGE[lockTier]?.label ?? 'a higher plan'}`
                  : ''
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:cursor-not-allowed ${
                interactive
                  ? enabled
                    ? 'bg-emerald-500'
                    : 'bg-slate-700'
                  : 'bg-slate-800 border border-slate-700/60'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                  interactive ? 'bg-white' : 'bg-slate-600'
                } ${
                  interactive && enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            {isLocked && (
              <button
                type="button"
                onClick={onUpgrade}
                title={`Unlock with ${TIER_BADGE[lockTier]?.label ?? 'an upgrade'}`}
                aria-label={`Unlock ${agent.display_name} - opens Pricing`}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 transition-colors group"
              >
                <Crown
                  size={14}
                  className="text-amber-300 fill-amber-300 group-hover:scale-110 transition-transform"
                />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
