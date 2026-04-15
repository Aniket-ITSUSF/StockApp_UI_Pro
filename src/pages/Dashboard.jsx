import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Activity } from 'lucide-react';
import StatsOverview from '../components/StatsOverview';
import PerformanceChart from '../components/PerformanceChart';
import EvaluationCard from '../components/EvaluationCard';
import TickerEvaluator from '../components/TickerEvaluator';
import { getPortfolioSummary, getRecentEvaluations, BACKEND_ORIGIN } from '../services/api';
import { useBackend } from '../context/BackendContext';

export default function Dashboard() {
  const { status: backendStatus, retry: retryConnection } = useBackend();

  const [portfolio,    setPortfolio]    = useState(null);
  const [evaluations,  setEvaluations]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [lastUpdated,  setLastUpdated]  = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [portRes, evalRes] = await Promise.all([
        getPortfolioSummary(),
        getRecentEvaluations(),
      ]);
      setPortfolio(portRes.data);
      setEvaluations(evalRes.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err.response?.data?.detail ??
        `Cannot reach backend at ${BACKEND_ORIGIN} — check that the server is running and CORS is configured.`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 60_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const handleNewEvaluation = (data) => {
    setEvaluations((prev) => [{ ...data, id: Date.now() }, ...prev.slice(0, 19)]);
  };

  const executedCount  = evaluations.filter(e => e.action_taken === 'EXECUTED').length;
  const rejectedCount  = evaluations.length - executedCount;
  const hitRate        = evaluations.length
    ? ((executedCount / evaluations.length) * 100).toFixed(0)
    : null;

  return (
    <div className="p-6 flex flex-col gap-6 min-h-full">

      {/* ── Page header ───────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Activity size={18} className="text-emerald-400" />
            Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {lastUpdated
              ? `Last refreshed ${lastUpdated.toLocaleTimeString()} · auto-refresh every 60s`
              : 'Connecting to backend…'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hitRate !== null && (
            <div className="text-xs text-slate-500 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 tabular-nums">
              <span className="text-emerald-400 font-bold">{hitRate}%</span> hit rate
              <span className="text-slate-600 mx-1.5">·</span>
              <span className="text-emerald-400">{executedCount} exec</span>
              <span className="text-slate-600 mx-1">/</span>
              <span className="text-rose-400">{rejectedCount} rej</span>
            </div>
          )}
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-2 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Error banner ──────────────────────────────────── */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-sm text-rose-400">⚠ {error}</span>
            {backendStatus === 'connected' && (
              <span className="text-xs text-slate-500">
                Health check passed — this may be a CORS or database issue. Check Railway logs.
              </span>
            )}
            {backendStatus === 'disconnected' && (
              <span className="text-xs text-slate-500">
                Backend health check failed. Use the Retry button in the sidebar.
              </span>
            )}
          </div>
          <button
            onClick={() => { retryConnection(); fetchAll(); }}
            className="shrink-0 flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg px-3 py-1.5 transition-colors"
          >
            <RefreshCw size={11} />
            Retry
          </button>
        </div>
      )}

      {/* ── Stats overview ────────────────────────────────── */}
      <StatsOverview portfolio={portfolio} />

      {/* ── Mid row: chart + evaluator ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <PerformanceChart evaluations={evaluations} />
        </div>
        <div className="lg:col-span-2">
          <TickerEvaluator onNewEvaluation={handleNewEvaluation} />
        </div>
      </div>

      {/* ── Recent Intelligence feed ──────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Recent Intelligence</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Last {evaluations.length} evaluations logged by the committee
            </p>
          </div>
        </div>

        {evaluations.length === 0 && !loading ? (
          <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl py-20 flex flex-col items-center justify-center gap-2">
            <Activity size={28} className="text-slate-700" />
            <p className="text-sm text-slate-600">
              No evaluations yet. Enter a ticker above to begin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {evaluations.map((ev, idx) => (
              <EvaluationCard key={ev.id ?? idx} evaluation={ev} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
