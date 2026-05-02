import { Fragment, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import DiscoveryCard from '../components/DiscoveryCard';
import AdInFeed from '../components/ads/AdInFeed';
import { getLocalRadarDiscoveries } from '../services/localTrading';

const AD_EVERY = 5;

const PAGE_SIZE = 15;

function getDiscoveryPage(p = 1) {
  const allDiscoveries = getLocalRadarDiscoveries();
  const pages = Math.max(Math.ceil(allDiscoveries.length / PAGE_SIZE), 1);
  const page = Math.min(Math.max(p, 1), pages);
  const start = (page - 1) * PAGE_SIZE;
  return {
    items: allDiscoveries.slice(start, start + PAGE_SIZE),
    page,
    meta: { total: allDiscoveries.length, pages },
  };
}

function Pagination({ page, pages, total, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800">
      <p className="text-xs text-slate-500 tabular-nums">
        {total} total · page {page} of {pages}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={page <= 1}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-1.5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft size={13} /> Previous
        </button>
        <button
          onClick={onNext}
          disabled={page >= pages}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-1.5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          Next <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

export default function AiRadar() {
  const navigate = useNavigate();
  const [snapshot,    setSnapshot]    = useState(() => getDiscoveryPage(1));
  const [loading,     setLoading]     = useState(false);

  const discoveries = snapshot.items;
  const page = snapshot.page;
  const meta = snapshot.meta;

  const load = useCallback((p = 1) => {
    setLoading(true);
    setSnapshot(getDiscoveryPage(p));
    setLoading(false);
  }, []);

  const handleEvaluate = (ticker) => {
    navigate(`/analyze?ticker=${encodeURIComponent(ticker)}`);
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6 min-h-full">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Radar size={18} className="text-purple-400" />
            Discovery
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Private second-order opportunities from your browser evaluations · newest first
          </p>
        </div>
        <button
          onClick={() => load(page)}
          disabled={loading}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-2 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats strip */}
      {!loading && (
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-500 tabular-nums">
            <span className="text-purple-400 font-bold">{meta.total}</span> total discoveries
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-500 tabular-nums">
            Page <span className="text-slate-300 font-bold">{page}</span> of {meta.pages}
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center gap-2 text-slate-600 text-sm py-20">
          <RefreshCw size={14} className="animate-spin" />
          Loading discoveries…
        </div>
      ) : discoveries.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl py-24 flex flex-col items-center justify-center gap-3">
          <Radar size={32} className="text-slate-700" />
          <p className="text-sm text-slate-600">No discoveries recorded yet.</p>
          <p className="text-xs text-slate-700">Analyze tickers to populate this private local feed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
          {discoveries.map((disc, idx) => (
            <Fragment key={disc.id ?? `${disc.primary_ticker}-${disc.ticker}`}>
              <DiscoveryCard disc={disc} onEvaluate={handleEvaluate} />
              {(idx + 1) % AD_EVERY === 0 && idx !== discoveries.length - 1 && (
                <div className="col-span-full">
                  <AdInFeed minHeight={120} />
                </div>
              )}
            </Fragment>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && meta.pages > 1 && (
        <Pagination
          page={page}
          pages={meta.pages}
          total={meta.total}
          onPrev={() => load(page - 1)}
          onNext={() => load(page + 1)}
        />
      )}
    </div>
  );
}
