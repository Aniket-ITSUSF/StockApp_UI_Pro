import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Activity, TrendingUp, Radar, FlaskConical, Clock, Briefcase,
  Settings as SettingsIcon, X, ChevronLeft, ChevronRight, Check, Info,
} from 'lucide-react';
import { useAdContext } from './ads/adContext';
import { TourContext } from './tourContext';

const STORAGE_KEY = 'equiquant_tour_completed_v1_1';

// Each feature step targets a nav button by its data-tour-nav value.
// Items not present in MOBILE_NAV_ROUTES (set in Sidebar.jsx) get filtered
// out on mobile so we never spotlight a missing element.
const STEPS = [
  {
    id: 'welcome',
    icon: Sparkles,
    accent: 'emerald',
    label: 'Start here',
    title: 'Welcome to your AI quant research desk',
    body: 'EquiQuant turns market math, AI research, catalysts, and risk checks into a simple workflow. This short tour shows you where to start and what each section is for.',
    bullets: [
      'Begin with Analyze when you want to research a ticker.',
      'Use Home to review your dashboard and recent activity.',
      'Treat every signal as research support, not financial advice.',
    ],
  },
  {
    id: 'analyze',
    nav: 'analyze',
    icon: Sparkles,
    accent: 'emerald',
    label: 'Step 1',
    title: 'Analyze a stock',
    body: 'Search a ticker to run the math agents and AI research agents together. You get a structured signal, score, agent votes, reasoning, and risk context in one place.',
    bullets: [
      'Enter a symbol like AAPL, TSLA, INFY.NS, or RELIANCE.NS.',
      'Read the alpha score, votes, catalyst summary, and risk notes.',
      'Buy, hold, and sell labels are mathematical outputs, not advice.',
    ],
  },
  {
    id: 'home',
    nav: 'home',
    icon: Activity,
    accent: 'emerald',
    label: 'Command center',
    title: 'Review everything from Home',
    body: 'Home is the control room for your research workflow. It brings together portfolio snapshots, AI-surfaced opportunities, hot trades, and recent intelligence.',
    bullets: [
      'Check your local paper portfolio overview.',
      'Jump back into recent evaluations quickly.',
      'Use Hot Trades and Discovery as idea starters.',
    ],
  },
  {
    id: 'holdings',
    nav: 'holdings',
    icon: Briefcase,
    accent: 'amber',
    label: 'Paper tracking',
    title: 'Track watchlist holdings privately',
    body: 'Holdings helps you follow paper positions and understand how ideas perform after you evaluate them. It is designed for learning and tracking, not live brokerage execution.',
    bullets: [
      'Positions stay in this browser.',
      'Use it to monitor hypothetical performance.',
      'Clear browser data can remove saved holdings.',
    ],
  },
  {
    id: 'today',
    nav: 'today',
    icon: TrendingUp,
    accent: 'rose',
    label: 'Pre-market radar',
    title: "Find today's market movers",
    body: "Intraday's Play scans fresh catalysts before the session and highlights stocks that may move because of news, earnings, guidance, macro events, or unusual sentiment.",
    bullets: [
      'Switch between US and India sessions where available.',
      'Look at catalyst, direction, confidence, and key risk.',
      'Use it to focus research before markets get noisy.',
    ],
  },
  {
    id: 'discovery',
    nav: 'discovery',
    icon: Radar,
    accent: 'purple',
    label: 'Opportunity map',
    title: 'Discover second-order ideas',
    body: 'Discovery looks for related companies, dependent shares, sector links, and follow-on opportunities connected to the tickers you research.',
    bullets: [
      'Find suppliers, competitors, beneficiaries, and sympathy movers.',
      'Use conviction and reasoning to decide what to inspect next.',
      'Evaluate discovered tickers before acting on them.',
    ],
  },
  {
    id: 'history',
    nav: 'history',
    icon: Clock,
    accent: 'sky',
    label: 'Research memory',
    title: 'Revisit your past analysis',
    body: 'History keeps your recent evaluations available locally, so you can compare signals over time and return to tickers you already researched.',
    bullets: [
      'Review previous scores and decisions.',
      'Re-open a ticker when conditions change.',
      'Your history is browser-local for privacy.',
    ],
  },
  {
    id: 'backtest',
    nav: 'backtest',
    icon: FlaskConical,
    accent: 'sky',
    label: 'Strategy lab',
    title: 'Test ideas before trusting them',
    body: 'Backtest lets you pressure-test a strategy against historical behavior so you can understand how an idea may have performed before risking capital.',
    bullets: [
      'Use past data to challenge your assumptions.',
      'Compare wins, losses, and rejected trades.',
      'Remember that past performance never guarantees future results.',
    ],
  },
  {
    id: 'about',
    nav: 'about',
    icon: Info,
    accent: 'emerald',
    label: 'Our mission',
    title: 'Understand what EquiQuant stands for',
    body: 'About explains our mission: bringing quant-firm-style research tools to everyday investors while making the limitations and risk clear.',
    bullets: [
      'Learn how math agents and AI agents work together.',
      'Read the mission, vision, and risk disclaimer.',
      'Share this page with users who want to know what we do.',
    ],
  },
  {
    id: 'settings',
    nav: 'settings',
    icon: SettingsIcon,
    accent: 'slate',
    label: 'Control panel',
    title: 'Adjust settings and replay the tour',
    body: 'Settings shows system status, runtime configuration, agent committee details, and the replay button if you want to see this walkthrough again.',
    bullets: [
      'Check whether the backend is connected.',
      'Review how the agent committee is configured.',
      'Replay this product tour anytime.',
    ],
    final: true,
  },
];

const ACCENT_CLASSES = {
  emerald: { iconBg: 'bg-emerald-500/15 border-emerald-500/30', iconColor: 'text-emerald-400', ring: 'ring-emerald-400/70' },
  sky:     { iconBg: 'bg-sky-500/15 border-sky-500/30',         iconColor: 'text-sky-400',     ring: 'ring-sky-400/70' },
  amber:   { iconBg: 'bg-amber-500/15 border-amber-500/30',     iconColor: 'text-amber-400',   ring: 'ring-amber-400/70' },
  rose:    { iconBg: 'bg-rose-500/15 border-rose-500/30',       iconColor: 'text-rose-400',    ring: 'ring-rose-400/70' },
  purple:  { iconBg: 'bg-purple-500/15 border-purple-500/30',   iconColor: 'text-purple-400',  ring: 'ring-purple-400/70' },
  slate:   { iconBg: 'bg-slate-500/15 border-slate-500/30',     iconColor: 'text-slate-300',   ring: 'ring-slate-300/70' },
};

const MOBILE_BREAKPOINT = 768;

function isTourCompleted() {
  if (typeof window === 'undefined') return true;
  try { return window.localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return true; }
}

function useViewport() {
  const [v, setV] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth  : 1024,
    h: typeof window !== 'undefined' ? window.innerHeight : 768,
  }));
  useEffect(() => {
    const onResize = () => setV({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);
  return v;
}

// Picks the visible element matching [data-tour-nav="key"]. Both the desktop
// sidebar link and the mobile-nav link share the same value, but only one is
// rendered at a time thanks to Tailwind's md:hidden / hidden md:flex.
function findVisibleNavEl(navKey) {
  if (!navKey || typeof document === 'undefined') return null;
  const els = document.querySelectorAll(`[data-tour-nav="${navKey}"]`);
  for (const el of els) {
    if (el.offsetParent !== null) return el;
  }
  return null;
}

function useTargetRect(navKey, tickKey) {
  const [rect, setRect] = useState(null);
  useLayoutEffect(() => {
    if (!navKey) { return; }
    let raf = 0;
    const measure = () => {
      const el = findVisibleNavEl(navKey);
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
  }, [navKey, tickKey]);
  return navKey ? rect : null;
}

export function TourProvider({ children }) {
  const { consentChosen } = useAdContext();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Auto-start once per device.
  useEffect(() => {
    if (!consentChosen) return;
    if (isTourCompleted()) return;
    const t = setTimeout(() => setActive(true), 600);
    return () => clearTimeout(t);
  }, [consentChosen]);

  const start = useCallback(() => {
    setStepIndex(0);
    setActive(true);
  }, []);

  const finish = useCallback(() => {
    setActive(false);
    try { window.localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* ignore */ }
  }, []);

  const value = useMemo(() => ({
    active, stepIndex, setStepIndex, start, finish,
  }), [active, stepIndex, start, finish]);

  return (
    <TourContext.Provider value={value}>
      {children}
      {active && <TourOverlay />}
    </TourContext.Provider>
  );
}

function TourOverlay() {
  const { stepIndex, setStepIndex, finish } = useContext(TourContext);
  const navigate = useNavigate();
  const viewport = useViewport();
  const isMobile = viewport.w < MOBILE_BREAKPOINT;

  // On mobile, drop steps whose target is not in the mobile nav.
  const visibleSteps = useMemo(() => {
    if (!isMobile) return STEPS;
    return STEPS.filter((s) => {
      if (!s.nav) return true; // welcome step has no target
      // Probe the DOM. Mobile nav items only exist when md:hidden is active.
      return findVisibleNavEl(s.nav) !== null;
    });
  }, [isMobile]);

  // Clamp index when the visible set shrinks (e.g. after rotating to mobile).
  useEffect(() => {
    if (stepIndex > visibleSteps.length - 1) {
      setStepIndex(Math.max(0, visibleSteps.length - 1));
    }
  }, [visibleSteps.length, stepIndex, setStepIndex]);

  const safeIndex = Math.min(stepIndex, visibleSteps.length - 1);
  const step = visibleSteps[safeIndex] ?? visibleSteps[0];
  const accent = ACCENT_CLASSES[step.accent] ?? ACCENT_CLASSES.emerald;
  const Icon = step.icon;

  // Re-measure when route/path changes too (we navigate during the tour).
  const [tick, setTick] = useState(0);
  const rect = useTargetRect(step.nav, tick);

  // When the active step targets a nav item, navigate to that route so the user
  // sees the page while the tour explains it. Skip for the welcome step.
  useEffect(() => {
    if (!step.nav) return;
    const el = findVisibleNavEl(step.nav);
    if (!el) return;
    const path = el.getAttribute('href') || el.getAttribute('to');
    if (path && window.location.pathname !== path) {
      navigate(path);
      // Bump tick so rect re-measures after navigation paints.
      setTimeout(() => setTick((n) => n + 1), 50);
    }
  }, [step.nav, navigate]);

  // Lock body scroll while tour is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') finish();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIndex, visibleSteps.length]);

  const goNext = () => {
    if (safeIndex >= visibleSteps.length - 1) { finish(); return; }
    setStepIndex(safeIndex + 1);
  };
  const goPrev = () => {
    setStepIndex(Math.max(0, safeIndex - 1));
  };

  const isFirst = safeIndex === 0;
  const isLast  = safeIndex === visibleSteps.length - 1;

  // Card position. On desktop we anchor next to the spotlight (right of the
  // sidebar item). On mobile we anchor above the bottom nav, near the icon.
  const cardStyle = useMemo(() => {
    const cardW = isMobile ? Math.min(viewport.w - 16, 400) : 430;
    if (!rect) {
      // No target. Center the card.
      return { position: 'fixed', top: '50%', left: '50%', width: cardW, transform: 'translate(-50%, -50%)' };
    }
    if (isMobile) {
      // Place card just above the highlighted icon. Bottom nav sits at very
      // bottom of screen, icon top is ~viewport.h - navHeight + iconY.
      const gap = 12;
      const desiredBottom = (viewport.h - rect.top) + gap;
      const minLeft = 8;
      const maxLeft = viewport.w - cardW - 8;
      const targetCenter = rect.left + rect.width / 2;
      const left = Math.min(maxLeft, Math.max(minLeft, targetCenter - cardW / 2));
      return {
        position: 'fixed',
        bottom: desiredBottom,
        left,
        width: cardW,
      };
    }
    // Desktop: card to the right of the sidebar item.
    const gap = 16;
    let top = rect.top;
    const cardHGuess = 360;
    if (top + cardHGuess > viewport.h - 16) top = Math.max(16, viewport.h - cardHGuess - 16);
    const left = Math.min(viewport.w - cardW - 16, rect.left + rect.width + gap);
    return {
      position: 'fixed',
      top,
      left,
      width: cardW,
    };
  }, [rect, isMobile, viewport.w, viewport.h]);

  // Arrow pointing from card toward spotlight (purely cosmetic).
  const arrow = rect && !isMobile
    ? { side: 'left', top: Math.max(16, rect.top + rect.height / 2 - cardStyle.top - 8) }
    : null;

  const totalDots = visibleSteps.length;

  return (
    <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal="true" aria-label="Product tour">
      {/* Dim backdrop. The spotlight cuts a hole via box-shadow trick below. */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1.5px]" />

      {/* Spotlight ring around the targeted nav button. */}
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

      {/* Tour card */}
      <div style={cardStyle}>
        <div className="relative overflow-hidden rounded-3xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-2xl shadow-black/50">
          {/* Optional left-side arrow toward the highlighted nav item (desktop). */}
          {arrow && (
            <span
              aria-hidden="true"
              className="absolute -left-1.5 w-3 h-3 rotate-45 bg-slate-900 border-l border-b border-slate-700"
              style={{ top: arrow.top }}
            />
          )}

          {/* Header: progress dots + close */}
          <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Product tour · {safeIndex + 1}/{totalDots}
              </p>
              <div className="mt-2 flex items-center gap-1.5" aria-label={`Step ${safeIndex + 1} of ${totalDots}`}>
                {visibleSteps.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === safeIndex ? 'w-8 bg-emerald-400'
                      : i < safeIndex ? 'w-3 bg-emerald-500/60'
                      : 'w-3 bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={finish}
              aria-label="Skip tour"
              className="text-slate-500 hover:text-slate-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-4 px-5 pb-5 pt-2">
            <div className="flex items-start gap-3">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${accent.iconBg}`}>
                <Icon size={22} className={accent.iconColor} />
              </div>
              <div className="min-w-0">
                {step.label && (
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${accent.iconBg} ${accent.iconColor}`}>
                    {step.label}
                  </span>
                )}
                <h2 className="mt-2 text-xl font-black leading-tight tracking-tight text-slate-100">{step.title}</h2>
              </div>
            </div>
            <div>
              <p className="text-sm leading-7 text-slate-400">{step.body}</p>
              {step.bullets?.length > 0 && (
                <div className="mt-4 flex flex-col gap-2">
                  {step.bullets.map((bullet) => (
                    <div key={bullet} className="flex gap-2.5 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
                      <p className="text-xs leading-5 text-slate-300">{bullet}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 border-t border-slate-800 bg-slate-950/70 px-4 py-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goPrev}
                disabled={isFirst}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1.5 rounded-lg transition-colors"
              >
                <ChevronLeft size={14} />
                Back
              </button>
              <button
                type="button"
                onClick={finish}
                className="text-xs font-medium text-slate-500 hover:text-slate-300 px-2 py-1.5 transition-colors"
              >
                Skip
              </button>
            </div>
            <button
              type="button"
              onClick={goNext}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                isLast
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400'
                  : 'bg-slate-200 hover:bg-white text-slate-950'
              }`}
            >
              {isLast ? <>Start using EquiQuant <Check size={13} /></> : <>Next <ChevronRight size={13} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
