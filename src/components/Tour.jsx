import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Activity, TrendingUp, Radar, FlaskConical, Clock, Briefcase,
  Settings as SettingsIcon, X, ChevronLeft, ChevronRight, Check,
} from 'lucide-react';

const STORAGE_KEY = 'equiquant_tour_completed_v1';

// Each feature step targets a nav button by its data-tour-nav value.
// Items not present in MOBILE_NAV_ROUTES (set in Sidebar.jsx) get filtered
// out on mobile so we never spotlight a missing element.
const STEPS = [
  {
    id: 'welcome',
    icon: Sparkles,
    accent: 'emerald',
    title: 'Welcome to EquiQuant',
    body: "Quick 30 second tour. Each step points to a button in the menu and tells you what that page does.",
  },
  {
    id: 'analyze',
    nav: 'analyze',
    icon: Sparkles,
    accent: 'emerald',
    title: 'Analyze',
    body: 'Search any stock and get an instant AI evaluation. Buy, hold, or sell, with the reasoning behind every call. We run mathematical strategies and AI checks on the stock to back the recommendation.',
  },
  {
    id: 'home',
    nav: 'home',
    icon: Activity,
    accent: 'emerald',
    title: 'Home (Command Center)',
    body: "Your dashboard. Portfolio overview, the AI's daily Hot Trades, and a feed of your recent activity, all in one place.",
  },
  {
    id: 'holdings',
    nav: 'holdings',
    icon: Briefcase,
    accent: 'amber',
    title: 'Holdings',
    body: 'When the Analyze screen suggests a buy, this page assumes you bought the stock at that price and shows how much you would have earned.',
  },
  {
    id: 'today',
    nav: 'today',
    icon: TrendingUp,
    accent: 'rose',
    title: "Intraday's Play",
    body: 'AI reads through news since the last market close and picks stocks with a high probability of moving or swinging. Runs automatically every day before the market opens.',
  },
  {
    id: 'discovery',
    nav: 'discovery',
    icon: Radar,
    accent: 'purple',
    title: 'Discovery',
    body: 'AI researches patterns and dependent shares that move along with the stocks you search, so you find the second order ideas you would have missed and improve your chances of earning.',
  },
  {
    id: 'history',
    nav: 'history',
    icon: Clock,
    accent: 'sky',
    title: 'History',
    body: 'Every stock you have analyzed, kept locally in this browser so you can revisit a past evaluation in one click.',
  },
  {
    id: 'backtest',
    nav: 'backtest',
    icon: FlaskConical,
    accent: 'sky',
    title: 'Backtest',
    body: 'Test any strategy on past market data before risking real capital. See how it would have performed historically.',
  },
  {
    id: 'settings',
    nav: 'settings',
    icon: SettingsIcon,
    accent: 'slate',
    title: 'Settings',
    body: "Tune the AI committee, see system status, and replay this tour anytime.",
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

const TourContext = createContext(null);

export function useTour() {
  return useContext(TourContext);
}

export function isTourCompleted() {
  if (typeof window === 'undefined') return true;
  try { return window.localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return true; }
}

export function clearTourCompleted() {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
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
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Auto-start once per device.
  useEffect(() => {
    if (isTourCompleted()) return;
    const t = setTimeout(() => setActive(true), 700);
    return () => clearTimeout(t);
  }, []);

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
  }, [isMobile, viewport.w, viewport.h]);

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
    if (!rect) {
      // No target. Center the card.
      return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
    const cardW = isMobile ? Math.min(viewport.w - 16, 380) : 360;
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
    const cardHGuess = 240;
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
        <div className="relative rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl shadow-black/50 overflow-hidden">
          {/* Optional left-side arrow toward the highlighted nav item (desktop). */}
          {arrow && (
            <span
              aria-hidden="true"
              className="absolute -left-1.5 w-3 h-3 rotate-45 bg-slate-900 border-l border-b border-slate-700"
              style={{ top: arrow.top }}
            />
          )}

          {/* Header: progress dots + close */}
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
            <div className="flex items-center gap-1.5" aria-label={`Step ${safeIndex + 1} of ${totalDots}`}>
              {visibleSteps.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === safeIndex ? 'w-6 bg-emerald-400'
                    : i < safeIndex ? 'w-1.5 bg-emerald-500/60'
                    : 'w-1.5 bg-slate-700'
                  }`}
                />
              ))}
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
          <div className="px-5 pb-4 pt-1 flex flex-col gap-3">
            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${accent.iconBg}`}>
              <Icon size={20} className={accent.iconColor} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 leading-tight">{step.title}</h2>
              <p className="text-sm text-slate-400 leading-relaxed mt-1.5">{step.body}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between gap-2">
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
              className={`inline-flex items-center gap-1 text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors ${
                isLast
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
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
