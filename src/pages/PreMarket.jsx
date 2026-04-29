import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Sunrise, Coffee, Sun, Sunset, Crown, Lock } from 'lucide-react';

import PreMarketRadar from '../components/PreMarketRadar';
import HitRateScoreboard from '../components/HitRateScoreboard';
import SectorRotationWidget from '../components/SectorRotationWidget';
import IntradayAlertsFeed from '../components/IntradayAlertsFeed';
import SessionLockGate from '../components/SessionLockGate';

import { useAuth } from '../hooks/useAuth';
import { US_ENABLED } from '../utils/launch';

// ── Session catalogue ────────────────────────────────────────────────────────
const SESSIONS = [
  {
    id: 'pre_market',
    label: 'Pre-Market',
    timeIST: '8:15 AM IST',
    timeET:  '8:30 AM ET',
    icon: Sunrise,
    accent: 'cyan',
    pitch: "What's set up to move at the open - overnight news, macro shifts, earnings.",
    requiredTier: 'pro',
  },
  {
    id: 'morning',
    label: 'Morning',
    timeIST: '10:15 AM IST',
    timeET:  '10:30 AM ET',
    icon: Sun,
    accent: 'amber',
    pitch: "What confirmed and what faded - first-hour breakouts and post-open news.",
    requiredTier: 'ultra',
  },
  {
    id: 'lunch',
    label: 'Lunch',
    timeIST: '12:15 PM IST',
    timeET:  '12:15 PM ET',
    icon: Coffee,
    accent: 'purple',
    pitch: "Lunch reversals, late-day flag setups, and today's sector rotation read.",
    requiredTier: 'ultra',
  },
  {
    id: 'closing',
    label: 'Closing',
    timeIST: '2:30 PM IST',
    timeET:  '2:30 PM ET',
    icon: Sunset,
    accent: 'rose',
    pitch: "Closing-hour scalps and overnight positioning ahead of post-close catalysts.",
    requiredTier: 'ultra',
  },
];

const MARKET_SESSIONS = [
  { id: 'India', label: 'India · NSE / BSE', enabled: true },
  { id: 'US',    label: 'US · NYSE / NASDAQ', enabled: US_ENABLED },
];

const ACCENT = {
  cyan:   { active: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',     idle: 'text-cyan-700' },
  amber:  { active: 'bg-amber-500/10 border-amber-500/30 text-amber-300',  idle: 'text-amber-700' },
  purple: { active: 'bg-purple-500/10 border-purple-500/30 text-purple-300', idle: 'text-purple-700' },
  rose:   { active: 'bg-rose-500/10 border-rose-500/30 text-rose-300',     idle: 'text-rose-700' },
};


/**
 * /today - Intraday Plays.
 *
 * Four-tab layout with tier-aware lock gates:
 *   - Free user → "Subscribe" CTA on every tab.
 *   - Pro user  → pre-market unlocked; the other three show "Upgrade to Ultra".
 *   - Ultra     → all four tabs render the full radar, hit-rate, sector
 *                 rotation, and live alerts feed.
 */
export default function PreMarket() {
  const navigate = useNavigate();
  // Tier from context - see AuthContext.jsx for why this is the only allowed source.
  const { tier, isUltra } = useAuth();

  const enabledMarkets = MARKET_SESSIONS.filter((m) => m.enabled);
  const [marketSession, setMarketSession] = useState(enabledMarkets[0]?.id ?? 'India');
  const [session, setSession] = useState('pre_market');

  const handleEvaluate = (ticker) => {
    navigate(`/analyze?ticker=${encodeURIComponent(ticker)}&market=${marketSession === 'India' ? 'IN' : 'US'}`);
  };

  const activeSpec = SESSIONS.find((s) => s.id === session) ?? SESSIONS[0];

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-5 min-h-full">

      {/* Page header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Globe size={18} className="text-cyan-400" />
            Intraday's Play
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Four AI sweeps every trading day · each session answers a different question
          </p>
        </div>

        {/* Market session selector - only when more than one is enabled */}
        {enabledMarkets.length > 1 && (
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {enabledMarkets.map((m) => {
              const active = marketSession === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMarketSession(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'bg-slate-800 text-slate-100'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Session tab strip - visible to all users; locked content shown when clicked */}
      <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
        {SESSIONS.map((s) => {
          const Icon = s.icon;
          const active = session === s.id;
          const accent = ACCENT[s.accent] ?? ACCENT.cyan;
          const locked = (
            (tier === 'free') ||
            (tier === 'pro' && s.requiredTier === 'ultra')
          );

          return (
            <button
              key={s.id}
              onClick={() => setSession(s.id)}
              className={`flex-1 min-w-[150px] flex flex-col items-start gap-1 px-3.5 py-2.5 rounded-xl border text-left transition-colors ${
                active
                  ? accent.active
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 w-full">
                <Icon size={13} className={active ? '' : accent.idle} />
                <span className="text-xs font-semibold">{s.label}</span>
                {locked && (
                  s.requiredTier === 'ultra'
                    ? <Crown size={10} className="ml-auto text-yellow-500" />
                    : <Lock size={10} className="ml-auto text-slate-600" />
                )}
              </div>
              <span className={`text-[10px] leading-tight ${active ? '' : 'text-slate-700'}`}>
                {marketSession === 'India' ? s.timeIST : s.timeET}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active session description strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex-1">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
            What this sweep answers
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            {activeSpec.pitch}
          </p>
        </div>
        <p className="text-[10px] text-slate-700 shrink-0">
          Auto-runs Mon–Fri at <span className="font-semibold text-slate-500">
            {marketSession === 'India' ? activeSpec.timeIST : activeSpec.timeET}
          </span>
        </p>
      </div>

      {/* Tier-aware content area */}
      <SessionLockGate session={session}>
        <SessionContent
          session={session}
          marketSession={marketSession}
          onEvaluate={handleEvaluate}
          isUltra={isUltra}
        />
      </SessionLockGate>

    </div>
  );
}


// ── Per-session inner content (only rendered when tier unlocks the tab) ─────

function SessionContent({ session, marketSession, onEvaluate, isUltra }) {
  return (
    <div className="flex flex-col gap-5">

      {/* Hit-rate scoreboard - Ultra only, shown across all sessions for context */}
      {isUltra && (
        <HitRateScoreboard marketSession={marketSession} days={30} />
      )}

      {/* Lunch session - sector rotation widget shown above the hotlist */}
      {session === 'lunch' && isUltra && (
        <SectorRotationWidget marketSession={marketSession} />
      )}

      {/* Active alerts panel - Ultra only */}
      {isUltra && (
        <IntradayAlertsFeed marketSession={marketSession} limit={10} />
      )}

      {/* The actual hotlist (PreMarketRadar already handles loading + run) */}
      <PreMarketRadar
        marketSession={marketSession}
        session={session}
        onEvaluateTicker={onEvaluate}
      />
    </div>
  );
}
