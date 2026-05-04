import { useState } from 'react';
import { ChevronRight, GitBranch, Loader2 } from 'lucide-react';
import LinkedSharesModal from './LinkedSharesModal';

function getLinkedShares(ev) {
  if (Array.isArray(ev?.linked_shares)) return ev.linked_shares;
  if (Array.isArray(ev?.discovery_report?.linked_shares)) return ev.discovery_report.linked_shares;
  if (Array.isArray(ev?.discovery_report?.discovery_opportunities)) {
    return ev.discovery_report.discovery_opportunities;
  }
  if (ev?.best_discovery) return [ev.best_discovery];
  return [];
}

export default function LinkedSharesStrip({ ev, loading }) {
  const [showModal, setShowModal] = useState(false);
  const linkedShares = getLinkedShares(ev);
  const hasReport = Boolean(ev?.discovery_report);

  if (loading) {
    return (
      <div className="w-full flex items-start gap-2 bg-slate-800/40 border border-dashed border-cyan-500/20 rounded-lg px-3 py-2.5">
        <Loader2 size={12} className="text-cyan-400 animate-spin shrink-0 mt-0.5" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Linked Shares
            </span>
            <span className="text-xs text-cyan-300">Discovery running…</span>
          </div>
          <p className="text-xs text-slate-500 italic mt-0.5">
            Mapping the shares linked to this stock. This can take a few minutes, and findings will also appear in Discovery.
          </p>
        </div>
      </div>
    );
  }

  if (!hasReport && linkedShares.length === 0) return null;

  return (
    <>
      {showModal && (
        <LinkedSharesModal
          ev={ev}
          linkedShares={linkedShares}
          onClose={() => setShowModal(false)}
        />
      )}
      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-between gap-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/40 rounded-lg px-3 py-2 transition-colors group min-w-0"
      >
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <GitBranch size={12} className="text-cyan-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Linked Shares
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded-full border text-cyan-300 bg-cyan-500/10 border-cyan-500/25">
            {linkedShares.length} found
          </span>
          {linkedShares.slice(0, 3).map((share) => (
            <span key={share.ticker} className="hidden min-[520px]:inline text-xs font-mono text-slate-400 max-w-[5.5rem] truncate">
              {share.ticker}
            </span>
          ))}
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-cyan-100 bg-cyan-500/15 group-hover:bg-cyan-500/25 border border-cyan-400/30 group-hover:border-cyan-300/50 rounded-full px-2.5 py-1 transition-all">
          View links
          <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
        </span>
      </button>
    </>
  );
}
