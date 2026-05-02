import { DollarSign, TrendingUp, TrendingDown, Layers } from 'lucide-react';

function fmt(n) {
  if (n == null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n);
}

function fmtPct(n) {
  if (n == null) return '-';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

function StatCard({ title, value, sub, CardIcon, positive }) {
  const accent =
    positive === null  ? 'text-slate-400' :
    positive           ? 'text-emerald-400' :
                         'text-rose-400';
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
        <CardIcon size={18} className={accent} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest truncate">{title}</p>
        <p className={`text-2xl font-bold tabular-nums leading-tight ${accent}`}>{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function StatsOverview({ portfolio }) {
  const real   = portfolio?.real_portfolio;
  const shadow = portfolio?.shadow_portfolio;
  const pnlPct = real?.total_pnl_pct;
  const shadowPnl = shadow?.total_unrealized_pnl;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        title="Total Equity"
        value={fmt(real?.total_market_value)}
        sub={real?.position_count != null ? `${real.position_count} active positions` : 'No positions'}
        CardIcon={DollarSign}
        positive={null}
      />
      <StatCard
        title="Real P&L"
        value={fmtPct(pnlPct)}
        sub={fmt(real?.total_unrealized_pnl)}
        CardIcon={pnlPct == null || pnlPct >= 0 ? TrendingUp : TrendingDown}
        positive={pnlPct == null ? null : pnlPct >= 0}
      />
      <StatCard
        title="Shadow Savings"
        value={fmt(shadowPnl)}
        sub={shadow?.position_count != null ? `${shadow.position_count} shadow positions` : 'No shadow trades'}
        CardIcon={Layers}
        positive={shadowPnl == null ? null : shadowPnl >= 0}
      />
    </div>
  );
}
