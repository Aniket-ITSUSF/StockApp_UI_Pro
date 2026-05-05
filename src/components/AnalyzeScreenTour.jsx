import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { BarChart3, Brain, Check, ChevronLeft, ChevronRight, GitBranch, Lightbulb, Target, X, Zap } from 'lucide-react';
import { markAnalyzeScreenTourDone } from '../utils/analyzeScreenTourState';

const STEPS = [
  {
    target: 'result-card',
    icon: Target,
    label: 'Result card',
    title: 'This is your full evaluation',
    body: 'After you run Analyze, EquiQuant turns market math, AI context, and risk checks into one structured research card.',
    bullets: [
      'Start from the verdict and alpha score at the top.',
      'Read the agent votes before trusting any signal.',
      'Use this as research support, not financial advice.',
    ],
  },
  {
    target: 'verdict',
    icon: Zap,
    label: 'Verdict',
    title: 'Buy, hold, sell, or rejected signal',
    body: 'The verdict summarizes what the system calculated from the current setup. It is a mathematical output, not a personal recommendation.',
    bullets: [
      'BUY means the setup passed the required checks.',
      'HOLD or rejected means the setup did not clear enough filters.',
      'Always compare the verdict with the risk notes and your own plan.',
    ],
  },
  {
    target: 'alpha',
    icon: BarChart3,
    label: 'Alpha score',
    title: 'Alpha shows signal strength',
    body: 'The alpha score compresses the agent committee output into a 0 to 100 style score so you can compare opportunities quickly.',
    bullets: [
      'Higher is stronger, but never risk-free.',
      'The score needs to clear the required threshold.',
      'Use it to rank ideas, not as a guarantee.',
    ],
  },
  {
    target: 'market-context',
    icon: Brain,
    label: 'Risk context',
    title: 'Check the market regime first',
    body: 'This section shows whether the broader market backdrop is trending, mean-reverting, or volatile. The same stock setup can be treated differently in different regimes.',
    bullets: [
      'Regime tells you how the system weighted the agents.',
      'VIX measures market volatility and can raise the bar for a buy signal.',
      'Use this before judging the stock in isolation.',
    ],
  },
  {
    target: 'volume-options',
    icon: BarChart3,
    label: 'Volume and options',
    title: 'Understand price behavior beyond the headline',
    body: 'Volume analysis studies where shares actually traded, while options cones estimate the market-implied move when options data is available.',
    bullets: [
      'VWAP and VPOC help explain whether buyers or sellers control the tape.',
      'Options ranges show expected movement, not guaranteed movement.',
      'This section helps you understand risk around the current price.',
    ],
  },
  {
    target: 'ai-research',
    icon: Brain,
    label: 'AI research',
    title: 'News sentiment and discovery context',
    body: 'After the fast math result, AI research can add news sentiment and linked-share context so you understand catalysts around the ticker.',
    bullets: [
      'Sentiment reads news and assigns bullish, neutral, bearish, or veto context.',
      'Linked shares appear when discovery has mapped related opportunities.',
      'AI context can adjust the score, but it still is not financial advice.',
    ],
  },
  {
    target: 'math-agents',
    icon: Lightbulb,
    label: 'Math agents',
    title: 'Each chip is a separate calculation',
    body: 'These are the mathematical agents. Each one runs a separate quant-style calculation — momentum, mean reversion, support/resistance, relative strength, volume profile, and more — then casts a vote.',
    bullets: [
      'Green means that agent supports the setup.',
      'Red or amber means that calculation failed, blocked, or is mixed.',
      'The final alpha score combines these separate agent votes with weighting.',
    ],
  },
  {
    target: 'reasoning',
    icon: Brain,
    label: 'Reasoning',
    title: 'Open reasoning for the why',
    body: 'Reasoning gives the compact explanation behind the score and decision path. Use it to understand the setup instead of blindly following a label.',
    bullets: [
      'Look for regime, VIX, score, and threshold context.',
      'If the explanation does not fit your thesis, skip the trade.',
      'This is where you slow down before acting.',
    ],
  },
  {
    target: 'related-trades',
    icon: GitBranch,
    label: 'Optional discovery',
    title: 'Find related trades when you want deeper research',
    body: 'This button runs the heavier AI discovery search. It looks for connected companies, sympathy movers, and second-order opportunities.',
    bullets: [
      'It is optional because web discovery can take longer.',
      'Use it when you want more ideas around the same catalyst.',
      'Evaluate any related ticker before making a decision.',
    ],
  },
];

const accent = {
  iconBg: 'bg-emerald-500/15 border-emerald-500/30',
  iconColor: 'text-emerald-400',
  ring: 'ring-emerald-400/70',
};

function findTarget(key) {
  if (!key) return null;
  return document.querySelector(`[data-analyze-tour="${key}"]`);
}

function useTargetRect(target, tick) {
  const [rect, setRect] = useState(null);

  useLayoutEffect(() => {
    let raf = 0;
    const measure = () => {
      const el = findTarget(target);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    measure();
    const onChange = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    window.addEventListener('resize', onChange);
    window.addEventListener('scroll', onChange, true);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onChange) : null;
    if (ro) ro.observe(document.body);
    return () => {
      window.removeEventListener('resize', onChange);
      window.removeEventListener('scroll', onChange, true);
      if (ro) ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, tick]);

  return rect;
}

export default function AnalyzeScreenTour({ active, onClose }) {
  const [index, setIndex] = useState(0);
  const [tick, setTick] = useState(0);
  const [viewport, setViewport] = useState(() => ({
    w: window.innerWidth,
    h: window.innerHeight,
  }));

  const step = STEPS[index] ?? STEPS[0];
  const Icon = step.icon;
  const rect = useTargetRect(step.target, tick);
  const isMobile = viewport.w < 768;
  const isFirst = index === 0;
  const isLast = index === STEPS.length - 1;

  const close = useCallback(() => {
    markAnalyzeScreenTourDone();
    onClose?.();
  }, [onClose]);

  const next = useCallback(() => {
    if (isLast) { close(); return; }
    setIndex((value) => value + 1);
  }, [close, isLast]);

  const prev = useCallback(() => {
    setIndex((value) => Math.max(0, value - 1));
  }, []);

  useEffect(() => {
    if (!active) return;
    const target = findTarget(step.target);
    if (!target) return;
    const mobile = window.innerWidth < 768;
    target.scrollIntoView({ block: mobile ? 'start' : 'center', inline: 'nearest', behavior: 'smooth' });
    const t = setTimeout(() => setTick((n) => n + 1), 360);
    return () => clearTimeout(t);
  }, [active, step.target]);

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const onKey = (event) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') next();
      if (event.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, close, next, prev]);

  const cardStyle = useMemo(() => {
    const width = isMobile ? Math.min(viewport.w - 16, 400) : 430;
    const desktopMaxHeight = Math.max(320, viewport.h - 32);

    if (isMobile) {
      // Pin the tour card as a bottom sheet so it stays on-screen even when the
      // spotlighted block (e.g. the full result card) is taller than the viewport.
      const cardMaxHeight = Math.min(Math.round(viewport.h * 0.55), 460);
      const left = Math.max(8, Math.min(viewport.w - width - 8, viewport.w / 2 - width / 2));
      return { position: 'fixed', left, bottom: 12, width, maxHeight: cardMaxHeight };
    }

    if (!rect) {
      return { position: 'fixed', top: '50%', left: '50%', width, maxHeight: desktopMaxHeight, transform: 'translate(-50%, -50%)' };
    }

    const left = rect.left + rect.width + width + 16 < viewport.w
      ? rect.left + rect.width + 16
      : Math.max(16, rect.left - width - 16);
    let top = rect.top;
    if (top + desktopMaxHeight > viewport.h - 16) top = 16;
    return { position: 'fixed', left, top, width, maxHeight: desktopMaxHeight };
  }, [isMobile, rect, viewport.h, viewport.w]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[1100]" role="dialog" aria-modal="true" aria-label="Analyze screen tour">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1.5px]" />

      {rect && (
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed rounded-xl ring-4 ${accent.ring} transition-all duration-300`}
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.78)',
          }}
        />
      )}

      <div style={cardStyle}>
        <div className="relative flex max-h-[inherit] flex-col overflow-hidden rounded-3xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-2xl shadow-black/50">
          <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Analyze guide · {index + 1}/{STEPS.length}
              </p>
              <div className="mt-2 flex items-center gap-1.5" aria-label={`Step ${index + 1} of ${STEPS.length}`}>
                {STEPS.map((item, i) => (
                  <span
                    key={item.target}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? 'w-8 bg-emerald-400'
                      : i < index ? 'w-3 bg-emerald-500/60'
                      : 'w-3 bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
            <button type="button" onClick={close} aria-label="Skip analyze guide" className="text-slate-500 hover:text-slate-200 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-5 pt-2">
            <div className="flex items-start gap-3">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${accent.iconBg}`}>
                <Icon size={22} className={accent.iconColor} />
              </div>
              <div className="min-w-0">
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${accent.iconBg} ${accent.iconColor}`}>
                  {step.label}
                </span>
                <h2 className="mt-2 text-xl font-black leading-tight tracking-tight text-slate-100">{step.title}</h2>
              </div>
            </div>

            <div>
              <p className="text-sm leading-7 text-slate-400">{step.body}</p>
              <div className="mt-4 flex flex-col gap-2">
                {step.bullets.map((bullet) => (
                  <div key={bullet} className="flex gap-2.5 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
                    <p className="text-xs leading-5 text-slate-300">{bullet}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-between gap-2 border-t border-slate-800 bg-slate-950/70 px-4 py-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prev}
                disabled={isFirst}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1.5 rounded-lg transition-colors"
              >
                <ChevronLeft size={14} />
                Back
              </button>
              <button type="button" onClick={close} className="text-xs font-medium text-slate-500 hover:text-slate-300 px-2 py-1.5 transition-colors">
                Skip
              </button>
            </div>
            <button
              type="button"
              onClick={next}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                isLast
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400'
                  : 'bg-slate-200 hover:bg-white text-slate-950'
              }`}
            >
              {isLast ? <>Got it <Check size={13} /></> : <>Next <ChevronRight size={13} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
