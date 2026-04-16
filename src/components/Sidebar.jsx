import { BarChart2, Briefcase, FlaskConical, Settings, RefreshCw, WifiOff, Radar, Brain, Globe } from 'lucide-react';
import { useBackend } from '../context/BackendContext';

const NAV = [
  { id: 'dashboard',    label: 'Dashboard',     icon: BarChart2    },
  { id: 'portfolio',    label: 'Portfolio',      icon: Briefcase    },
  { id: 'shadow-lab',  label: 'Shadow Lab',     icon: FlaskConical },
  { id: 'ai-radar',    label: 'AI Radar',       icon: Radar        },
  { id: 'pre-market',  label: 'Pre-Market',     icon: Globe        },
  { id: 'intelligence', label: 'Intelligence',  icon: Brain        },
  { id: 'settings',    label: 'Settings',       icon: Settings     },
];

function StatusFooter() {
  const { status, lastChecked, retry, url } = useBackend();

  // Shorten the URL for display: strip protocol + trailing slash
  const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');

  const states = {
    checking: {
      dot:   'bg-amber-400',
      label: 'Checking…',
      text:  'text-amber-400',
    },
    connected: {
      dot:   'bg-emerald-400 animate-pulse',
      label: 'Connected',
      text:  'text-emerald-400',
    },
    disconnected: {
      dot:   'bg-rose-500',
      label: 'Unreachable',
      text:  'text-rose-400',
    },
  };

  const s = states[status];

  return (
    <div className="p-3 border-t border-slate-800 flex flex-col gap-2">

      {/* Status row */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50">
        {status === 'checking'
          ? <RefreshCw size={11} className="text-amber-400 animate-spin shrink-0" />
          : <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
        }
        <div className="flex flex-col min-w-0">
          <span className={`text-[11px] font-semibold leading-none ${s.text}`}>
            {s.label}
          </span>
          <span className="text-[10px] text-slate-600 truncate mt-0.5" title={url}>
            {displayUrl}
          </span>
        </div>
      </div>

      {/* Connect button — only shown when disconnected */}
      {status === 'disconnected' && (
        <button
          onClick={retry}
          className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 text-[11px] font-semibold transition-colors"
        >
          <WifiOff size={11} />
          Retry Connection
        </button>
      )}

      {/* Last checked timestamp */}
      {lastChecked && status !== 'checking' && (
        <p className="text-[10px] text-slate-700 text-center">
          Checked {lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      )}
    </div>
  );
}

export function MobileNav({ currentPage, onNavigate }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 flex items-stretch safe-bottom">
      {NAV.map((item) => {
        const active  = currentPage === item.id;
        const NavIcon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors ${
              active ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <NavIcon size={18} className={active ? 'text-emerald-400' : ''} />
            <span className="leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default function Sidebar({ currentPage, onNavigate }) {
  return (
    <aside className="hidden md:flex w-56 bg-slate-900 border-r border-slate-800 flex-col h-full shrink-0">

      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
            <span className="text-emerald-400 text-base font-bold leading-none">α</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100 leading-none tracking-wide">AlphaDesk</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Paper Trading AI</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-2.5 flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active  = currentPage === item.id;
          const NavIcon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-100 w-full text-left ${
                active
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
              }`}
            >
              <NavIcon size={15} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <StatusFooter />
    </aside>
  );
}
