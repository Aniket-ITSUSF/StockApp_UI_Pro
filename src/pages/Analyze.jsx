import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Brain, Radar, ShieldCheck, Sparkles } from 'lucide-react';
import TickerEvaluator from '../components/TickerEvaluator';
import AdInFeed from '../components/ads/AdInFeed';
import AdLeaderboard from '../components/ads/AdLeaderboard';
import {
  getLocalRadarDiscoveries,
  getLocalRecentEvaluations,
  recordLocalEvaluation,
} from '../services/localTrading';

function LocalHistoryPanel({ evaluations, onAnalyze }) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Brain size={14} className="text-emerald-400" />
        <h2 className="text-sm font-bold text-slate-100">Recently Searched</h2>
      </div>
      {evaluations.length === 0 ? (
        <p className="text-sm text-slate-600 leading-relaxed">
          Your browser-only ticker searches will appear here after you analyze a stock.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {evaluations.slice(0, 5).map((ev) => (
            <button
              key={ev.id ?? ev.ticker}
              type="button"
              onClick={() => onAnalyze(ev.ticker)}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-left hover:border-emerald-500/30 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-mono text-sm font-bold text-slate-100 truncate">{ev.ticker}</p>
                <p className="text-xs text-slate-500 truncate">{ev.action_taken ?? 'Evaluated'}</p>
              </div>
              {ev.final_alpha_score != null && (
                <span className="shrink-0 text-xs font-bold text-emerald-300 tabular-nums">
                  {Number(ev.final_alpha_score).toFixed(0)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function LocalDiscoveryPanel({ discoveries, onAnalyze }) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Radar size={14} className="text-purple-400" />
        <h2 className="text-sm font-bold text-slate-100">Linked AI Finds</h2>
      </div>
      {discoveries.length === 0 ? (
        <p className="text-sm text-slate-600 leading-relaxed">
          AI-discovered linked shares will be saved locally and shown here.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {discoveries.slice(0, 5).map((disc) => (
            <button
              key={disc.id ?? `${disc.primary_ticker}-${disc.ticker}`}
              type="button"
              onClick={() => onAnalyze(disc.ticker)}
              className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-left hover:border-purple-500/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm font-bold text-slate-100">{disc.ticker}</p>
                {disc.conviction && (
                  <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-full px-2 py-0.5">
                    {disc.conviction}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">
                Via {disc.primary_ticker}
              </p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Analyze() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTicker = searchParams.get('ticker') ?? '';
  const [recentEvaluations, setRecentEvaluations] = useState(() => getLocalRecentEvaluations());
  const [radarDiscoveries, setRadarDiscoveries] = useState(() => getLocalRadarDiscoveries());
  const [activeTicker, setActiveTicker] = useState(initialTicker);

  const refreshLocalPanels = () => {
    setRecentEvaluations(getLocalRecentEvaluations());
    setRadarDiscoveries(getLocalRadarDiscoveries());
  };

  const handleNewEvaluation = (data) => {
    recordLocalEvaluation(data);
    if (data?.ticker) {
      setActiveTicker(data.ticker);
      setSearchParams({ ticker: data.ticker }, { replace: true });
    }
    refreshLocalPanels();
  };

  const analyzeTicker = (ticker) => {
    if (!ticker) return;
    setActiveTicker(ticker);
    setSearchParams({ ticker }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6 min-h-full">
      <section className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 px-5 py-6 sm:px-7 sm:py-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 mb-4">
            <Sparkles size={13} />
            Analyze
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-100">
            Your AI Quant Researcher
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed mt-3 max-w-2xl">
            We combine market math, quant strategies, options data, and AI research to give
            you useful stock insights in one place. Our mission is to democratize finance and
            bring the kind of research tools used by large institutions to everyday investors.
          </p>
        </div>
      </section>

      <AdLeaderboard />

      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
        <div className="2xl:col-span-9 flex flex-col gap-6 min-w-0">
          <TickerEvaluator
            prefilledTicker={activeTicker}
            onNewEvaluation={handleNewEvaluation}
            onPrefilledConsumed={() => {}}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <ShieldCheck size={15} className="text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-400 leading-relaxed">
                Your history, Discovery feed, portfolio, and backtest entries are stored in this browser.
                The backend only computes prices, evaluations, and cacheable research.
              </p>
            </div>
            <AdInFeed minHeight={120} />
          </div>
        </div>

        <aside className="2xl:col-span-3 flex flex-col gap-4 min-w-0">
          <AdInFeed minHeight={180} />
          <LocalHistoryPanel evaluations={recentEvaluations} onAnalyze={analyzeTicker} />
          <LocalDiscoveryPanel discoveries={radarDiscoveries} onAnalyze={analyzeTicker} />
          <button
            type="button"
            onClick={() => navigate('/history')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 text-left"
          >
            View full History
          </button>
          <button
            type="button"
            onClick={() => navigate('/discovery')}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 text-left"
          >
            View full Discovery
          </button>
        </aside>
      </div>

      <AdLeaderboard />
    </div>
  );
}
