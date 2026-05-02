import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, TrendingUp, TrendingDown } from 'lucide-react';
import PreMarketRadar from '../components/PreMarketRadar';
import AdLeaderboard from '../components/ads/AdLeaderboard';

const SESSIONS = [
  { id: 'US',    label: 'US Session',    sublabel: 'NYSE / NASDAQ · 9:30 AM ET',   icon: TrendingUp   },
  { id: 'India', label: 'India Session', sublabel: 'NSE / BSE · 9:15 AM IST',      icon: TrendingDown },
];

export default function PreMarket() {
  const navigate = useNavigate();
  const [session, setSession] = useState('US');

  const handleEvaluate = (ticker) => {
    navigate(`/analyze?ticker=${encodeURIComponent(ticker)}`);
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6 min-h-full">

      {/* Page header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Globe size={18} className="text-cyan-400" />
            Intraday's Play
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Geopolitical news &amp; macro catalyst sweep · Auto-runs 1 hour before market open
          </p>
        </div>
      </div>

      {/* How it works strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1.5">
            What this agent does
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            Sweeps overnight geopolitical events, central bank decisions, commodity moves, and
            scheduled earnings releases before market open. Derives a daily BULLISH / BEARISH hotlist
            of stocks expected to move today based on confirmed news catalysts.
          </p>
        </div>
        <div className="shrink-0 flex flex-col gap-1 justify-center text-xs sm:text-sm text-slate-500">
          <p><span className="text-cyan-500 font-bold">US</span> — runs at 8:30 AM ET (13:30 UTC)</p>
          <p><span className="text-orange-500 font-bold">India</span> — runs at 8:15 AM IST (02:45 UTC)</p>
          <p className="text-slate-700 mt-1">Hotlist expires at market close · Mon–Fri only</p>
        </div>
      </div>

      {/* Session toggle */}
      <div className="flex items-center gap-2">
        {SESSIONS.map(s => {
          const active = session === s.id;
          const Icon   = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setSession(s.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                active
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
              }`}
            >
              <Icon size={13} />
              <span className="flex flex-col items-start text-left">
                <span className="leading-tight">{s.label}</span>
                <span className={`text-xs leading-tight ${active ? 'text-cyan-600' : 'text-slate-700'}`}>
                  {s.sublabel}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Leaderboard between session toggle and radar */}
      <AdLeaderboard />

      {/* Radar component */}
      <PreMarketRadar session={session} onEvaluateTicker={handleEvaluate} />

    </div>
  );
}
