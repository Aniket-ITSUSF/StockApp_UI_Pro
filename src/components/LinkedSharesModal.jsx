import { Fragment, useEffect } from 'react';
import { AlertCircle, Clock, GitBranch, X } from 'lucide-react';
import AdInFeed from './ads/AdInFeed';

const CONVICTION_META = {
  HIGH:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
  LOW:    'text-slate-400 bg-slate-800 border-slate-700',
};

export default function LinkedSharesModal({ ev, linkedShares, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const report = ev?.discovery_report ?? {};
  const cache = report?._cache;
  const validUntil = cache?.valid_until
    ? new Date(cache.valid_until).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 rounded-t-2xl z-10">
          <div className="flex items-center gap-2.5">
            <GitBranch size={16} className="text-cyan-400" />
            <span className="text-sm font-bold text-slate-100">
              Linked Shares — <span className="font-mono tracking-widest text-cyan-300">{ev?.ticker}</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg p-1 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-cyan-300/80 uppercase tracking-widest mb-1">
              Discovery Agent
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              These are second-order shares the agent linked to the primary ticker through supply-chain,
              infrastructure, demand, or regulatory relationships. They are cached until the next Monday
              pre-market refresh.
            </p>
            {validUntil && (
              <p className="text-xs text-slate-600 mt-2">
                Cache {cache?.status ?? 'ready'} · refreshes after {validUntil}
              </p>
            )}
          </div>

          {report?.analyst_note && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Discovery Summary
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">{report.analyst_note}</p>
            </div>
          )}

          <AdInFeed minHeight={120} />

          {linkedShares.length === 0 ? (
            <div className="bg-slate-950 border border-slate-800 border-dashed rounded-xl px-4 py-8 text-center">
              <p className="text-sm text-slate-500">No linked shares found for this evaluation.</p>
            </div>
          ) : (
            linkedShares.map((share, index) => {
              const convictionCls = CONVICTION_META[share.conviction] ?? CONVICTION_META.LOW;
              return (
                <Fragment key={`${share.ticker}-${index}`}>
                  {index > 0 && index % 2 === 0 && (
                    <AdInFeed minHeight={120} />
                  )}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-base font-bold tracking-widest text-slate-100">
                            {share.ticker}
                          </span>
                          {share.conviction && (
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full border ${convictionCls}`}>
                              {share.conviction} conviction
                            </span>
                          )}
                          {share.market && (
                            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full border text-blue-300 bg-blue-500/10 border-blue-500/20">
                              {share.market}
                            </span>
                          )}
                        </div>
                        {share.company_name && (
                          <p className="text-xs text-slate-500 mt-0.5">{share.company_name}</p>
                        )}
                      </div>
                      {share.estimated_recognition_lag_weeks != null && (
                        <div className="shrink-0 flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
                          <Clock size={11} className="text-slate-500" />
                          <span className="text-xs text-slate-300 font-mono">
                            May play out in ~{share.estimated_recognition_lag_weeks}w
                          </span>
                        </div>
                      )}
                    </div>

                    {share.causal_chain && (
                      <p className="text-xs text-slate-300 leading-relaxed">{share.causal_chain}</p>
                    )}
                    {share.revenue_exposure_evidence && (
                      <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                          Evidence
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {share.revenue_exposure_evidence}
                        </p>
                      </div>
                    )}
                    {share.risk_caveat && (
                      <div className="flex items-start gap-1.5 text-xs text-rose-300/80">
                        <AlertCircle size={11} className="shrink-0 mt-0.5" />
                        <p className="leading-relaxed">{share.risk_caveat}</p>
                      </div>
                    )}
                  </div>
                </Fragment>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
