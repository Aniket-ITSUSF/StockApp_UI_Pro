import { Settings as SettingsIcon, Info, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useBackend } from '../context/BackendContext';

const CONFIG_ROWS = [
  { label: 'Consensus Threshold',  value: '65%' },
  { label: 'Trading Mode',         value: 'Paper Trading Only' },
  { label: 'Auto-refresh interval',value: '60 seconds' },
  { label: 'Max Recent Feed',      value: '20 evaluations' },
];

export default function Settings() {
  const { status, lastChecked, retry } = useBackend();

  const statusMeta = {
    checking:     { Icon: RefreshCw, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Checking…' },
    connected:    { Icon: Wifi,      color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Connected' },
    disconnected: { Icon: WifiOff,   color: 'text-rose-400',   bg: 'bg-rose-500/10 border-rose-500/20',   label: 'Servers are busy' },
  }[status];
  const { Icon: StatusIcon } = statusMeta;

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <SettingsIcon size={18} className="text-slate-400" />
        <div>
          <h1 className="text-xl font-bold text-slate-100">Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">System configuration overview</p>
        </div>
      </div>

      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-start gap-2 text-xs text-emerald-400/80">
        <Info size={13} className="shrink-0 mt-0.5" />
        This application operates in <strong>&nbsp;Paper Trading Mode&nbsp;</strong> only.
        No real capital is ever at risk.
      </div>

      {/* Backend connection status */}
      <div className={`border rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${statusMeta.bg}`}>
        <div className="flex items-center gap-2.5">
          <StatusIcon size={14} className={`shrink-0 ${statusMeta.color} ${status === 'checking' ? 'animate-spin' : ''}`} />
          <div>
            <p className={`text-sm font-semibold ${statusMeta.color}`}>
              {statusMeta.label}
            </p>
            {lastChecked && (
              <p className="text-xs text-slate-600 mt-0.5">
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
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Runtime Configuration</p>
        </div>
        {CONFIG_ROWS.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30 transition-colors">
            <span className="text-sm text-slate-400">{label}</span>
            <span className="text-sm font-mono text-slate-200 bg-slate-800 px-2.5 py-0.5 rounded-md">{value}</span>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Agent Committee</p>
        </div>
        {[
          { id: 'Momentum',          tier: 'Tier 1', desc: 'Upward MA slope + strong volume' },
          { id: 'Mean Reversion',    tier: 'Tier 1', desc: 'Oversold pullbacks in uptrends' },
          { id: 'Support/Resistance',tier: 'Tier 1', desc: 'Bounces off historical floors' },
          { id: 'Relative Strength', tier: 'Tier 1', desc: 'Sector out-performers' },
          { id: 'Complex Pullback',  tier: 'Tier 1', desc: 'ABCD two-legged pullbacks' },
          { id: 'Stat Arb',          tier: 'Tier 2', desc: 'Cointegrated pair trading' },
          { id: 'Failure Test',      tier: 'Tier 2', desc: 'Failed breakdowns (liquidity traps)' },
          { id: 'Multi-Timeframe',   tier: 'Tier 2', desc: 'Higher/Trading/Lower TF alignment' },
          { id: 'Regime Change',     tier: 'Tier 2', desc: 'VIX-driven agent weight adjustments' },
          { id: 'Risk Management',   tier: 'Veto',   desc: 'Capital allocation + stop-loss enforcer' },
        ].map(({ id, tier, desc }) => (
          <div key={id} className="flex items-center justify-between px-5 py-3 border-b border-slate-800/60 last:border-0">
            <div>
              <span className="text-sm text-slate-200 font-medium">{id}</span>
              <span className="text-xs text-slate-500 ml-2">{desc}</span>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
              tier === 'Veto'   ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
              tier === 'Tier 2' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>{tier}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
