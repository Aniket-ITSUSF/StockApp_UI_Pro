import { useState } from 'react';
import { Brain, TrendingUp, TrendingDown, Minus, ShieldX, Loader2, ChevronRight } from 'lucide-react';
import SentimentModal from './SentimentModal';

const SENTIMENT_META = {
  BULLISH:   { label: 'Bullish',   cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25', Icon: TrendingUp  },
  NEUTRAL:   { label: 'Neutral',   cls: 'text-amber-400   bg-amber-500/10   border-amber-500/25',   Icon: Minus       },
  BEARISH:   { label: 'Bearish',   cls: 'text-rose-400    bg-rose-500/10    border-rose-500/25',    Icon: TrendingDown },
  HARD_VETO: { label: 'Hard Veto', cls: 'text-rose-300    bg-rose-900/40    border-rose-500/40',    Icon: ShieldX     },
};

/**
 * Self-contained sentiment section for EvaluationCard.
 *
 * Props:
 *   ev      - evaluation object (needs cognitive_signal, sentiment_score, etc.)
 *   loading - true while the AI sentiment analysis is still running
 */
export default function SentimentStrip({ ev, loading }) {
  const [showModal, setShowModal] = useState(false);

  if (loading) {
    return (
      <div className="w-full flex items-center gap-2 bg-slate-800/40 border border-dashed border-purple-500/20 rounded-lg px-3 py-2.5">
        <Loader2 size={12} className="text-purple-400 animate-spin shrink-0" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">Sentiment</span>
        <span className="text-xs text-slate-500 italic">
          AI is reading the news and finding the sentiment…
        </span>
      </div>
    );
  }

  if (!ev?.cognitive_signal) return null;

  const m = SENTIMENT_META[ev.cognitive_signal] ?? SENTIMENT_META.NEUTRAL;
  const { Icon } = m;

  return (
    <>
      {showModal && <SentimentModal ev={ev} onClose={() => setShowModal(false)} />}
      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-between gap-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-purple-500/40 rounded-lg px-3 py-2 transition-colors group min-w-0"
      >
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <Brain size={12} className="text-purple-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sentiment</span>
          <span className={`inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded-full border ${m.cls}`}>
            <Icon size={9} />
            {m.label}
          </span>
          {ev.cognitive_bonus != null && ev.cognitive_bonus !== 0 && (
            <span className={`hidden min-[430px]:inline text-xs font-mono font-bold ${ev.cognitive_bonus > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {ev.cognitive_bonus > 0 ? '+' : ''}{ev.cognitive_bonus.toFixed(1)}pts
            </span>
          )}
          {ev.sentiment_score != null && (
            <span className="hidden min-[520px]:inline text-xs font-mono text-slate-400">
              P:{ev.sentiment_score >= 0 ? '+' : ''}{ev.sentiment_score.toFixed(2)}
            </span>
          )}
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-purple-200 bg-purple-500/20 group-hover:bg-purple-500/35 border border-purple-400/40 group-hover:border-purple-300/60 rounded-full px-2.5 py-1 shadow-[0_0_12px_-2px] shadow-purple-500/40 group-hover:shadow-purple-400/60 transition-all">
          View analysis
          <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
        </span>
      </button>
    </>
  );
}
