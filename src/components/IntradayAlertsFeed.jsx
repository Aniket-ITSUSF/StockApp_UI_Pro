import { useState, useEffect } from 'react';
import { Bell, RefreshCw, ArrowUpRight, AlertTriangle, Target } from 'lucide-react';
import { getIntradayAlerts } from '../services/api';

const ALERT_META = {
  entry_hit:  { label: 'Entry hit',  icon: ArrowUpRight,  cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' },
  target_hit: { label: 'Target hit', icon: Target,        cls: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25'         },
  stop_hit:   { label: 'Stop hit',   icon: AlertTriangle, cls: 'text-rose-400 bg-rose-500/10 border-rose-500/25'         },
};

const SESSION_LABELS = {
  pre_market: 'Pre-Market',
  morning:    'Morning',
  lunch:      'Lunch',
  closing:    'Closing',
};

/**
 * Live alerts feed. Polls every 60s while mounted to surface new alerts
 * without forcing the user to refresh. Ultra-only at the API layer; the
 * component renders nothing for non-Ultra users so it stays harmless when
 * embedded in shared shells.
 */
export default function IntradayAlertsFeed({ marketSession = 'India', limit = 20 }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = () => {
      getIntradayAlerts(marketSession, limit)
        .then((res) => { if (alive) { setAlerts(res.data?.alerts ?? []); setError(false); } })
        .catch(() => { if (alive) setError(true); })
        .finally(() => { if (alive) setLoading(false); });
    };

    setLoading(true);
    setError(false);
    load();
    const id = setInterval(load, 60000);

    return () => { alive = false; clearInterval(id); };
  }, [marketSession, limit]);

  if (error) return null;

  return (
    <div className="bg-slate-900 border border-purple-500/20 rounded-xl px-4 py-3 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
          <Bell size={10} />
          Live Alerts
        </p>
        {loading && <RefreshCw size={11} className="animate-spin text-slate-700" />}
      </div>

      {alerts.length === 0 && !loading && (
        <p className="text-[11px] text-slate-700">
          No alerts triggered yet today. The poller checks active picks every 10
          minutes during market hours.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        {alerts.map((a) => {
          const meta = ALERT_META[a.alert_kind] ?? ALERT_META.entry_hit;
          const Icon = meta.icon;
          const triggered = a.triggered_at
            ? new Date(a.triggered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';
          return (
            <div
              key={a.id}
              className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2"
            >
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.cls}`}>
                <Icon size={9} />
                {meta.label}
              </span>
              <span className="text-sm font-bold tracking-wider text-slate-100 font-mono">
                {a.ticker}
              </span>
              <span className="text-[10px] text-slate-600">
                {SESSION_LABELS[a.session] ?? a.session} · {a.direction}
              </span>
              <span className="ml-auto flex items-center gap-2 text-[10px] tabular-nums text-slate-500">
                <span>@ {Number(a.observed_price).toFixed(2)}</span>
                <span className="text-slate-700">vs {Number(a.threshold_price).toFixed(2)}</span>
                <span className="text-slate-700">{triggered}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
