import { BarChart2, Briefcase, FlaskConical, Settings } from 'lucide-react';

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',      icon: BarChart2 },
  { id: 'portfolio',  label: 'Real Portfolio',  icon: Briefcase },
  { id: 'shadow-lab', label: 'Shadow Lab',      icon: FlaskConical },
  { id: 'settings',   label: 'Settings',        icon: Settings },
];

export default function Sidebar({ currentPage, onNavigate }) {
  return (
    <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">

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
          const active = currentPage === item.id;
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

      {/* Status footer */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-[11px] text-slate-500">Backend live · :8000</span>
        </div>
      </div>
    </aside>
  );
}
