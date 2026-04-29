import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Activity, Radar, Brain, ArrowRight, TrendingUp, Sparkles } from 'lucide-react';
import StatsOverview from '../components/StatsOverview';
import PerformanceChart from '../components/PerformanceChart';
import EvaluationCard from '../components/EvaluationCard';
import DiscoveryCard from '../components/DiscoveryCard';
import HotTradesPanel from '../components/HotTradesPanel';
import HorizontalCarousel from '../components/HorizontalCarousel';
import {
  getPortfolioSummary,
  getRecentEvaluations,
  getRecentDiscoveries,
  refreshPortfolioPrices,
  BACKEND_ORIGIN,
} from '../services/api';
import { useBackend } from '../context/BackendContext';

/**
 * Home (Dashboard) - at-a-glance command center.
 *
 * As of Phase 8a, the live evaluation panel was moved to the dedicated
 * `/analyze` page. This view focuses on:
 *   - Portfolio stats + performance chart
 *   - Hot Trades panel (today's actionable picks)
 *   - AI Radar carousel (top 10 discoveries)
 *   - Recent Intelligence carousel
 *   - A "Analyze with AI" CTA button that routes to /analyze
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const { status: backendStatus, retry: retryConnection } = useBackend();

  const [portfolio,           setPortfolio]           = useState(null);
  const [evaluations,         setEvaluations]         = useState([]);
  const [discoveries,         setDiscoveries]         = useState([]);
  const [loadingPortfolio,    setLoadingPortfolio]    = useState(true);
  const [loadingEvaluations,  setLoadingEvaluations]  = useState(true);
  const [loadingDiscoveries,  setLoadingDiscoveries]  = useState(true);
  const [refreshingPrices,    setRefreshingPrices]    = useState(false);
  const [error,               setError]               = useState(null);
  const [lastUpdated,         setLastUpdated]         = useState(null);

  const fetchPortfolio = useCallback(async () => {
    setLoadingPortfolio(true);
    try {
      const res = await getPortfolioSummary();
      setPortfolio(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ??
        `Cannot reach backend at ${BACKEND_ORIGIN} - check that the server is running and CORS is configured.`,
      );
    } finally {
      setLoadingPortfolio(false);
    }
  }, []);

  const fetchEvaluations = useCallback(async () => {
    setLoadingEvaluations(true);
    try {
      const res = await getRecentEvaluations();
      setEvaluations(res.data);
    } catch { /* non-fatal */ } finally {
      setLoadingEvaluations(false);
    }
  }, []);

  const fetchDiscoveries = useCallback(async () => {
    setLoadingDiscoveries(true);
    try {
      const res = await getRecentDiscoveries();
      setDiscoveries(res.data?.discoveries ?? []);
    } catch { /* non-fatal */ } finally {
      setLoadingDiscoveries(false);
    }
  }, []);

  const handleRefreshPrices = useCallback(async () => {
    setRefreshingPrices(true);
    try {
      await refreshPortfolioPrices();
      await fetchPortfolio();
      setLastUpdated(new Date());
    } catch { /* silent */ } finally {
      setRefreshingPrices(false);
    }
  }, [fetchPortfolio]);

  useEffect(() => {
    setError(null);
    fetchPortfolio();
    fetchEvaluations();
    fetchDiscoveries();
    setLastUpdated(new Date());

    const id = setInterval(() => {
      fetchPortfolio();
      fetchEvaluations();
      fetchDiscoveries();
      setLastUpdated(new Date());
    }, 60_000);
    return () => clearInterval(id);
  }, [fetchPortfolio, fetchEvaluations, fetchDiscoveries]);

  const goAnalyze = (ticker) => {
    if (ticker) navigate(`/analyze?ticker=${encodeURIComponent(ticker)}`);
    else navigate('/analyze');
  };

  const executedCount  = evaluations.filter(e => e.action_taken === 'EXECUTED').length;
  const rejectedCount  = evaluations.length - executedCount;
  const hitRate        = evaluations.length
    ? ((executedCount / evaluations.length) * 100).toFixed(0)
    : null;

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6 min-h-full">

      {/* ── Page header ───────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
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
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => goAnalyze()}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-300 hover:from-emerald-300 hover:to-emerald-200 rounded-lg px-3 py-2 transition-colors shadow-sm shadow-emerald-500/30"
          >
            <Sparkles size={13} />
            Analyze with AI
          </button>
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
            onClick={handleRefreshPrices}
            disabled={refreshingPrices}
            title="Fetch live prices for all positions"
            className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-2 transition-colors disabled:opacity-40"
          >
            <TrendingUp size={13} className={refreshingPrices ? 'animate-pulse' : ''} />
            Refresh Prices
          </button>
          <button
            onClick={() => { fetchPortfolio(); fetchEvaluations(); fetchDiscoveries(); setLastUpdated(new Date()); }}
            disabled={loadingPortfolio && loadingEvaluations && loadingDiscoveries}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-2 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={13} className={(loadingPortfolio || loadingEvaluations || loadingDiscoveries) ? 'animate-spin' : ''} />
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
                Health check passed - this may be a CORS or database issue. Check Railway logs.
              </span>
            )}
            {backendStatus === 'disconnected' && (
              <span className="text-xs text-slate-500">
                Backend health check failed. Use the Retry button in the sidebar.
              </span>
            )}
          </div>
          <button
            onClick={() => { retryConnection(); fetchPortfolio(); fetchEvaluations(); fetchDiscoveries(); }}
            className="shrink-0 flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg px-3 py-1.5 transition-colors"
          >
            <RefreshCw size={11} />
            Retry
          </button>
        </div>
      )}

      {/* ── Stats overview ────────────────────────────────── */}
      <StatsOverview portfolio={portfolio} />

      {/* ── Performance chart (full width now that evaluator moved out) ── */}
      <PerformanceChart evaluations={evaluations} />

      {/* ── Hot Trades - self-contained panel ─────────────────────── */}
      <HotTradesPanel onEvaluate={goAnalyze} onNavigate={() => navigate('/today')} />

      {/* ── AI Radar - top-10 carousel ─────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Radar size={14} className="text-purple-400" />
              Discovery - AI-surfaced opportunities
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Second-order beneficiaries surfaced by the Discovery Agent
            </p>
          </div>
          <button
            onClick={() => navigate('/discovery')}
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            View All <ArrowRight size={11} />
          </button>
        </div>

        {loadingDiscoveries ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[260px] h-36 rounded-xl bg-slate-800 animate-pulse shrink-0" />
            ))}
          </div>
        ) : (
          <HorizontalCarousel
            items={discoveries.slice(0, 10)}
            renderItem={(disc) => (
              <DiscoveryCard disc={disc} onEvaluate={goAnalyze} />
            )}
            emptyNode={
              <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl py-10 flex flex-col items-center justify-center gap-2">
                <Radar size={24} className="text-slate-700" />
                <p className="text-sm text-slate-600">No discoveries yet.</p>
                <p className="text-xs text-slate-700">Evaluate a few tickers to surface second-order opportunities.</p>
              </div>
            }
          />
        )}
      </div>

      {/* ── Recent Intelligence - top-10 carousel ─────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Brain size={14} className="text-emerald-400" />
              Recent History
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest committee evaluations - showing top 10
            </p>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            View All <ArrowRight size={11} />
          </button>
        </div>

        {loadingEvaluations ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[300px] h-44 rounded-xl bg-slate-800 animate-pulse shrink-0" />
            ))}
          </div>
        ) : (
          <HorizontalCarousel
            items={evaluations.slice(0, 10)}
            renderItem={(ev, idx) => <EvaluationCard key={ev.id ?? idx} evaluation={ev} />}
            emptyNode={
              <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl py-20 flex flex-col items-center justify-center gap-2">
                <Activity size={28} className="text-slate-700" />
                <p className="text-sm text-slate-600">No evaluations yet. Try Analyze with AI to begin.</p>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
