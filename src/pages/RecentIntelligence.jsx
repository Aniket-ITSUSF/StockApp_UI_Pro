import { Fragment, useState, useCallback } from 'react';
import { Brain, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import EvaluationCard from '../components/EvaluationCard';
import AdInFeed from '../components/ads/AdInFeed';
import { getLocalRecentEvaluations } from '../services/localTrading';

const AD_EVERY = 5;

const PAGE_SIZE = 18;

function getEvaluationPage(p = 1) {
  const allEvaluations = getLocalRecentEvaluations();
  const pages = Math.max(Math.ceil(allEvaluations.length / PAGE_SIZE), 1);
  const page = Math.min(Math.max(p, 1), pages);
  const start = (page - 1) * PAGE_SIZE;
  return {
    items: allEvaluations.slice(start, start + PAGE_SIZE),
    page,
    meta: { total: allEvaluations.length, pages },
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

export default function RecentIntelligence() {
  const [snapshot,    setSnapshot]    = useState(() => getEvaluationPage(1));
  const [loading,     setLoading]     = useState(false);

  const evaluations = snapshot.items;
  const page = snapshot.page;
  const meta = snapshot.meta;

  const load = useCallback((p = 1) => {
    setLoading(true);
    setSnapshot(getEvaluationPage(p));
    setLoading(false);
  }, []);

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6 min-h-full">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Brain size={18} className="text-emerald-400" />
            History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your private browser-only committee evaluations · newest first
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
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-500 tabular-nums">
            <span className="text-emerald-400 font-bold">{meta.total}</span> total evaluations
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-500 tabular-nums">
            Page <span className="text-slate-300 font-bold">{page}</span> of {meta.pages}
          </div>
          {evaluations.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-500 tabular-nums">
              <span className="text-emerald-400 font-bold">
                {evaluations.filter(e => e.action_taken === 'BUY' || e.action_taken === 'EXECUTED').length}
              </span>{' '}
              bought · {' '}
              <span className="text-rose-400 font-bold">
                {evaluations.filter(e => e.action_taken !== 'BUY' && e.action_taken !== 'EXECUTED').length}
              </span>{' '}
              rejected
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center gap-2 text-slate-600 text-sm py-20">
          <RefreshCw size={14} className="animate-spin" />
          Loading evaluations…
        </div>
      ) : evaluations.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl py-24 flex flex-col items-center justify-center gap-3">
          <Brain size={32} className="text-slate-700" />
          <p className="text-sm text-slate-600">No evaluations recorded yet.</p>
          <p className="text-xs text-slate-700">Use Analyze to populate this local feed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
          {evaluations.map((ev, idx) => (
            <Fragment key={ev.id ?? idx}>
              <EvaluationCard evaluation={ev} />
              {(idx + 1) % AD_EVERY === 0 && idx !== evaluations.length - 1 && (
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
