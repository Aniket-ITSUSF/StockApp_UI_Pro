import { useEffect } from 'react';
import { X, Brain, AlertTriangle, ShieldX, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import AdInFeed from './ads/AdInFeed';

const SIGNAL_META = {
  BULLISH:   { label: 'Bullish',   cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25', Icon: TrendingUp,   bar: 'bg-emerald-500' },
  NEUTRAL:   { label: 'Neutral',   cls: 'text-amber-400   bg-amber-500/10   border-amber-500/25',   Icon: Minus,         bar: 'bg-amber-400'   },
  BEARISH:   { label: 'Bearish',   cls: 'text-rose-400    bg-rose-500/10    border-rose-500/25',    Icon: TrendingDown,  bar: 'bg-rose-500'    },
  HARD_VETO: { label: 'Hard Veto', cls: 'text-rose-300    bg-rose-900/40    border-rose-500/40',    Icon: ShieldX,       bar: 'bg-rose-700'    },
};

function PetersonGauge({ score }) {
  const pct   = Math.max(0, Math.min(100, ((score + 1) / 2) * 100));
  const color = score >= 0.2 ? 'bg-emerald-500' : score <= -0.2 ? 'bg-rose-500' : 'bg-amber-400';
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-mono">
        <span>−1.0 BEARISH</span>
        <span>NEUTRAL 0</span>
        <span>BULLISH +1.0</span>
      </div>
      <div className="relative h-3 rounded-full bg-slate-800 overflow-hidden">
        <div className="absolute inset-0 flex">
          <div className="w-1/2 bg-rose-900/30 rounded-l-full" />
          <div className="w-1/2 bg-emerald-900/20 rounded-r-full" />
        </div>
        <div
          className={`absolute top-0.5 bottom-0.5 w-2.5 rounded-full ${color} shadow-lg transition-all duration-500`}
          style={{ left: `calc(${pct}% - 5px)` }}
        />
      </div>
      <p className="text-center text-xs font-mono font-bold text-slate-300 mt-1.5">
        {score >= 0 ? '+' : ''}{score.toFixed(3)}
      </p>
    </div>
  );
}

export default function SentimentModal({ ev, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!ev) return null;

  const signal = ev.cognitive_signal ?? 'NEUTRAL';
  const meta   = SIGNAL_META[signal] ?? SIGNAL_META.NEUTRAL;
  const { Icon } = meta;
  const score  = ev.sentiment_score ?? 0;
  const bonus  = ev.cognitive_bonus ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 rounded-t-2xl z-10">
          <div className="flex items-center gap-2.5">
            <Brain size={16} className="text-purple-400" />
            <span className="text-sm font-bold text-slate-100">
              Market Sentiment — <span className="font-mono tracking-widest text-purple-300">{ev.ticker}</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg p-1 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-5">

          {/* Signal badge */}
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full border ${meta.cls}`}>
              <Icon size={14} />
              {meta.label}
            </span>
            {ev.crowd_trap_detected && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
                <AlertTriangle size={11} />
                Crowd Trap
              </span>
            )}
          </div>

          {/* Family summary */}
          {ev.family_summary && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">AI Analysis Summary</p>
              <p className="text-sm text-slate-300 leading-relaxed">{ev.family_summary}</p>
            </div>
          )}

          {/* Ad slot — between summary and scores */}
          <AdInFeed minHeight={120} />

          {/* Crowd trap warning */}
          {ev.crowd_trap_detected && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300 leading-relaxed">
                <strong>Crowd Trap Detected:</strong> Herd sentiment is elevated but structural facts are neutral.
                The AI system is discounting this enthusiasm — treat bullish signals with caution.
              </p>
            </div>
          )}

          {/* Veto reason */}
          {ev.veto_reason && (
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <ShieldX size={14} className="text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-300 leading-relaxed">
                <strong>Hard Veto:</strong> {ev.veto_reason}
              </p>
            </div>
          )}

          {/* Scores row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">Peterson Score</p>
              <PetersonGauge score={score} />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 flex flex-col justify-between">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Cognitive Bonus</p>
              <p className={`text-2xl font-bold font-mono tabular-nums ${
                bonus > 0 ? 'text-emerald-400' : bonus < 0 ? 'text-rose-400' : 'text-slate-400'
              }`}>
                {bonus >= 0 ? '+' : ''}{bonus.toFixed(2)}
              </p>
              <p className="text-xs text-slate-600 mt-1">Applied to alpha score (±15 max)</p>
            </div>
          </div>

          {/* Ad slot — between scores and decision path */}
          <AdInFeed minHeight={120} />

          {/* Decision path */}
          {Array.isArray(ev.decision_path) && ev.decision_path.length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">5-Step Decision Path</p>
              <ol className="flex flex-col gap-2.5">
                {ev.decision_path.map((step, i) => (
                  <li key={i} className="flex gap-2.5 items-start">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-400">
                      {i + 1}
                    </span>
                    <p className="text-xs text-slate-400 leading-relaxed pt-0.5">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* What this means */}
          <div className="bg-purple-500/5 border border-purple-500/15 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-purple-400/70 uppercase tracking-widest mb-1">How this affects the trade</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              The Peterson Score measures the factual quality of news coverage on a scale of −1 (verified negative facts) to +1 (verified positive facts).
              The Cognitive Bonus adjusts the committee's alpha score by up to ±15 points based on this signal.
              A Hard Veto overrides any buy signal regardless of the technical alpha score.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
