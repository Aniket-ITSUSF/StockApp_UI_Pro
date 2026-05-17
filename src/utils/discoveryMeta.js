/**
 * Display metadata for discovery / linked-share opportunity fields.
 *
 * Shared by DiscoveryCard and LinkedSharesModal so badges, colors, and
 * formatting stay consistent across surfaces.
 *
 * User-facing labels do not reveal internal mechanics (gates, archetypes,
 * recognition windows). Phrasing is plain English for a family-office reader.
 */

export const ARCHETYPE_META = {
  infrastructure_enabler: {
    label: 'Infrastructure',
    cls: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/25',
  },
  niche_supplier: {
    label: 'Niche supplier',
    cls: 'text-violet-300 bg-violet-500/10 border-violet-500/25',
  },
  service_provider: {
    label: 'Service provider',
    cls: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/25',
  },
  geographic_arbitrage: {
    label: 'Geo arbitrage',
    cls: 'text-orange-300 bg-orange-500/10 border-orange-500/25',
  },
  process_enabler: {
    label: 'Process enabler',
    cls: 'text-teal-300 bg-teal-500/10 border-teal-500/25',
  },
};

export function getArchetypeMeta(archetype) {
  if (!archetype) return null;
  return ARCHETYPE_META[archetype] ?? null;
}

/**
 * Color for the 60-day price-move chip. Green when the discount thesis is
 * still wide open, amber as the crowd starts catching on, rose when the move
 * has already happened.
 */
export function moveChipCls(pct) {
  if (pct == null || Number.isNaN(pct)) return 'text-slate-400 bg-slate-800 border-slate-700';
  if (pct < 0) return 'text-sky-300 bg-sky-500/10 border-sky-500/25';
  if (pct < 10) return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25';
  if (pct <= 25) return 'text-amber-300 bg-amber-500/10 border-amber-500/25';
  return 'text-rose-300 bg-rose-500/10 border-rose-500/25';
}

export function formatMovePct(pct) {
  if (pct == null || Number.isNaN(pct)) return null;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

/**
 * Revenue exposure chip color. More green as the company is more directly
 * tied to the primary trend.
 */
export function exposureChipCls(pct) {
  if (pct == null || Number.isNaN(pct)) return 'text-slate-400 bg-slate-800 border-slate-700';
  if (pct >= 25) return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25';
  if (pct >= 10) return 'text-cyan-300 bg-cyan-500/10 border-cyan-500/25';
  return 'text-slate-300 bg-slate-800 border-slate-700';
}

export function formatExposurePct(pct) {
  if (pct == null || Number.isNaN(pct)) return null;
  if (pct >= 10) return `${Math.round(pct)}% revenue`;
  return `${pct.toFixed(1)}% revenue`;
}

const LIQUIDITY_META = {
  UNDER_2M:      { label: 'Thin trading', cls: 'text-rose-300   bg-rose-500/10   border-rose-500/25' },
  '2M_TO_20M':   { label: 'Light volume', cls: 'text-amber-300  bg-amber-500/10  border-amber-500/25' },
  '20M_TO_100M': { label: 'Active',       cls: 'text-cyan-300   bg-cyan-500/10   border-cyan-500/25' },
  OVER_100M:     { label: 'Highly liquid', cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25' },
};

export function getLiquidityMeta(bucket) {
  if (!bucket || bucket === 'UNKNOWN') return null;
  return LIQUIDITY_META[bucket] ?? null;
}

/**
 * Format a YYYY-MM string as "Feb 2025". Returns null on missing or unparseable input.
 */
export function formatEvidenceDate(yyyyMm) {
  if (!yyyyMm || typeof yyyyMm !== 'string') return null;
  const match = yyyyMm.match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${MONTHS[month - 1]} ${year}`;
}
