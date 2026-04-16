import { useState, useEffect, useCallback } from 'react';
import { Brain, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import EvaluationCard from '../components/EvaluationCard';
import { getEvaluationsPaged } from '../services/api';

const PAGE_SIZE = 18;

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
  const [evaluations, setEvaluations] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [meta,        setMeta]        = useState({ total: 0, pages: 1 });

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await getEvaluationsPaged(p, PAGE_SIZE);
      setEvaluations(res.data?.items ?? []);
      setMeta({ total: res.data?.total ?? 0, pages: res.data?.pages ?? 1 });
      setPage(p);
    } catch {
      setEvaluations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6 min-h-full">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Brain size={18} className="text-emerald-400" />
            Recent Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            All committee evaluations · newest first · paginated
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
          <p className="text-xs text-slate-700">Use the evaluator on the dashboard to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {evaluations.map((ev, idx) => (
            <EvaluationCard key={ev.id ?? idx} evaluation={ev} />
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
