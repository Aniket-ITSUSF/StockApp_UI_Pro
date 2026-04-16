import { useState, useEffect, useCallback } from 'react';
import { Radar, RefreshCw } from 'lucide-react';
import { getRecentDiscoveries } from '../services/api';
import DiscoveryCard from './DiscoveryCard';

export default function DiscoveryRadar({ onEvaluateTicker }) {
  const [discoveries, setDiscoveries] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await getRecentDiscoveries();
      setDiscoveries(res.data?.discoveries ?? []);
    } catch {
      // silent — section just stays empty
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="py-8 flex items-center justify-center gap-2 text-slate-600 text-sm">
        <RefreshCw size={14} className="animate-spin" />
        Loading AI Radar…
      </div>
    );
  }

  if (discoveries.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl py-12 flex flex-col items-center justify-center gap-2">
        <Radar size={28} className="text-slate-700" />
        <p className="text-sm text-slate-600">No discoveries yet.</p>
        <p className="text-xs text-slate-700">Evaluate a few tickers — the AI will surface second-order opportunities here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Radar size={14} className="text-purple-400" />
            AI Radar — Discovered Opportunities
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Second-order beneficiaries surfaced by the Discovery Agent while the crowd was looking elsewhere
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {discoveries.map((disc) => (
          <DiscoveryCard
            key={disc.id ?? disc.ticker}
            disc={disc}
            onEvaluate={onEvaluateTicker}
          />
        ))}
      </div>

      <p className="text-[11px] text-slate-700 text-right">
        Deduplicated by ticker · most recent evaluation wins · {discoveries.length} unique opportunities
      </p>
    </div>
  );
}
