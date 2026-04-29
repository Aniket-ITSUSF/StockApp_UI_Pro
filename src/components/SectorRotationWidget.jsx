import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Layers, RefreshCw } from 'lucide-react';
import { getSectorRotation } from '../services/api';

/**
 * Sector rotation read produced by the lunch-session agent. Renders the top
 * 3 leading and bottom 3 lagging sectors with the strongest in-sector ticker
 * for each.
 *
 * Ultra-only at the API layer; renders nothing on 402 to stay harmless if
 * mounted under a Pro-only tab by mistake.
 */
export default function SectorRotationWidget({ marketSession = 'India' }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    getSectorRotation(marketSession)
      .then((res) => { if (alive) setData(res.data); })
      .catch(() => { if (alive) setError(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [marketSession]);

  if (loading) {
    return (
      <div className="py-3 flex items-center gap-2 text-[11px] text-slate-700">
        <RefreshCw size={11} className="animate-spin" />
        Loading sector rotation read…
      </div>
    );
  }

  if (error || !data) return null;

  const hasContent = (data.leaders?.length ?? 0) + (data.laggards?.length ?? 0) > 0;

  if (!hasContent) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <Layers size={10} className="text-cyan-400" />
          Sector Rotation
        </p>
        <p className="text-[11px] text-slate-700">
          The lunch session has not yet produced a rotation snapshot for today.
          Check back after 12:15 PM IST / 12:15 PM ET.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-cyan-500/20 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <p className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={10} />
            Sector Rotation · today's tape
          </p>
          {data.macro_theme && (
            <p className="text-[11px] text-slate-300 mt-1 font-medium">{data.macro_theme}</p>
          )}
        </div>
        {data.run_timestamp && (
          <p className="text-[10px] text-slate-700">
            {new Date(data.run_timestamp).toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        )}
      </div>

      {data.rotation_summary && (
        <p className="text-xs text-slate-400 leading-relaxed">{data.rotation_summary}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SectorList title="Leaders"  rows={data.leaders ?? []}  positive />
        <SectorList title="Laggards" rows={data.laggards ?? []} positive={false} />
      </div>
    </div>
  );
}


function SectorList({ title, rows, positive }) {
  const Icon = positive ? TrendingUp : TrendingDown;
  const tone = positive
    ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
    : 'text-rose-400 border-rose-500/20 bg-rose-500/5';

  return (
    <div className={`rounded-lg border px-3 py-2.5 ${tone} bg-slate-950/50`}>
      <p className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 mb-1.5 ${tone.split(' ')[0]}`}>
        <Icon size={10} />
        {title}
      </p>
      <div className="flex flex-col gap-1.5">
        {rows.length === 0 && (
          <p className="text-[10px] text-slate-700">No data</p>
        )}
        {rows.map((r, i) => (
          <div key={`${r.sector}-${i}`} className="flex items-start gap-2">
            <span className="text-[11px] font-semibold text-slate-300 flex-1 truncate">
              {r.sector}
            </span>
            {r.pct_change_today != null && (
              <span className={`text-[11px] font-bold tabular-nums ${tone.split(' ')[0]}`}>
                {r.pct_change_today >= 0 ? '+' : ''}
                {Number(r.pct_change_today).toFixed(2)}%
              </span>
            )}
            {Array.isArray(r.lead_tickers) && r.lead_tickers.length > 0 && (
              <span className="text-[10px] font-mono text-slate-500 truncate max-w-[40%]">
                {r.lead_tickers.slice(0, 2).join(' · ')}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
