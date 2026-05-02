const PORTFOLIO_KEY = 'stockapp.localPortfolio.v1';
const SHADOW_KEY = 'stockapp.localShadowLab.v1';
const RECENT_EVALUATIONS_KEY = 'stockapp.localRecentEvaluations.v1';
const RADAR_DISCOVERIES_KEY = 'stockapp.localRadarDiscoveries.v1';
const DEFAULT_QUANTITY = 100;
const BUY_ACTIONS = new Set(['BUY', 'EXECUTED']);
const MAX_LOCAL_FEED_ITEMS = 100;

function readList(key) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(key, rows) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(rows));
}

function scoreOf(ev) {
  const raw = ev?.final_alpha_score ?? ev?.final_weighted_alpha_score ?? ev?.total_consensus_score ?? ev?.weighted_alpha_score;
  if (raw == null) return 0;
  return raw > 1 ? raw : raw * 100;
}

function actionOf(ev) {
  if (ev?.action_taken) return ev.action_taken;
  const score = scoreOf(ev);
  const threshold = ev?.required_threshold ?? 65;
  if (score >= threshold && ev?.mtf_status !== 'VETO') return 'BUY';
  return 'REJECTED_CONSENSUS';
}

function normalizeEvaluationForFeed(ev) {
  const now = new Date().toISOString();
  const ticker = String(ev?.ticker ?? '').toUpperCase();
  if (!ticker) return null;

  return {
    ...ev,
    id: ev?.id ?? `${ticker}-${Date.now()}`,
    ticker,
    action_taken: actionOf(ev),
    final_alpha_score: scoreOf(ev),
    reasoning: ev?.reasoning ?? ev?.decision_reason ?? ev?.risk_reasoning ?? '',
    timestamp: ev?.timestamp ?? now,
    local_only: true,
  };
}

function positionFromEvaluation(ev, action) {
  const now = new Date().toISOString();
  const ticker = String(ev?.ticker ?? '').toUpperCase();
  const entryPrice = Number(ev?.entry_price ?? ev?.current_price ?? ev?.price ?? 0);
  if (!ticker || !Number.isFinite(entryPrice) || entryPrice <= 0) return null;

  return {
    id: `${ticker}-${Date.now()}`,
    ticker,
    quantity: DEFAULT_QUANTITY,
    entry_price: entryPrice,
    current_price: entryPrice,
    stop_loss: ev?.stop_loss ?? entryPrice * 0.95,
    unrealized_pnl: 0,
    action_taken: action,
    timestamp: ev?.timestamp ?? now,
    reasoning: ev?.reasoning ?? ev?.decision_reason ?? ev?.risk_reasoning ?? '',
    final_alpha_score: scoreOf(ev),
    required_threshold: ev?.required_threshold ?? 65,
    mtf_status: ev?.mtf_status,
    vix_level: ev?.vix_level,
    regime: ev?.regime,
    momentum_vote: ev?.momentum_vote,
    mean_reversion_vote: ev?.mean_reversion_vote,
    support_vote: ev?.support_vote,
    relative_strength_vote: ev?.relative_strength_vote,
    complex_pullback_vote: ev?.complex_pullback_vote,
    volume_profile_vote: ev?.volume_profile_vote,
    volume_profile: ev?.volume_profile,
    volume_profile_reasoning: ev?.volume_profile_reasoning,
    stat_arb_vote: ev?.stat_arb_vote,
    failure_test_vote: ev?.failure_test_vote,
  };
}

function upsertByTicker(rows, position) {
  const without = rows.filter((row) => row.ticker !== position.ticker);
  return [position, ...without];
}

function upsertRecentEvaluation(rows, evaluation) {
  const without = rows.filter((row) => row.ticker !== evaluation.ticker);
  return [evaluation, ...without].slice(0, MAX_LOCAL_FEED_ITEMS);
}

function radarDiscoveryFromLinkedShare(linkedShare, ev, index) {
  const ticker = String(linkedShare?.ticker ?? '').toUpperCase();
  const primaryTicker = String(ev?.ticker ?? ev?.primary_ticker ?? '').toUpperCase();
  if (!ticker || !primaryTicker) return null;

  const timestamp = ev?.timestamp ?? new Date().toISOString();
  return {
    ...linkedShare,
    id: `${primaryTicker}-${ticker}`,
    ticker,
    primary_ticker: primaryTicker,
    rank: linkedShare?.rank ?? index + 1,
    evaluation_timestamp: timestamp,
    local_only: true,
  };
}

function upsertRadarDiscoveries(rows, discoveries) {
  const incomingKeys = new Set(discoveries.map((disc) => `${disc.primary_ticker}:${disc.ticker}`));
  const without = rows.filter((row) => !incomingKeys.has(`${row.primary_ticker}:${row.ticker}`));
  return [...discoveries, ...without].slice(0, MAX_LOCAL_FEED_ITEMS);
}

export function getLocalRecentEvaluations() {
  return readList(RECENT_EVALUATIONS_KEY);
}

export function getLocalRadarDiscoveries() {
  return readList(RADAR_DISCOVERIES_KEY);
}

export function getLocalPortfolioPositions() {
  return readList(PORTFOLIO_KEY);
}

export function getLocalShadowPositions() {
  return readList(SHADOW_KEY);
}

export function recordLocalEvaluation(ev) {
  const action = actionOf(ev);
  const feedEvaluation = normalizeEvaluationForFeed(ev);
  if (feedEvaluation) {
    writeList(
      RECENT_EVALUATIONS_KEY,
      upsertRecentEvaluation(readList(RECENT_EVALUATIONS_KEY), feedEvaluation),
    );
  }

  const linkedShares = ev?.linked_shares ?? ev?.discovery_report?.linked_shares ?? ev?.discovery_report?.discovery_opportunities ?? [];
  const radarDiscoveries = Array.isArray(linkedShares)
    ? linkedShares
        .map((linkedShare, index) => radarDiscoveryFromLinkedShare(linkedShare, ev, index))
        .filter(Boolean)
    : [];
  if (radarDiscoveries.length > 0) {
    writeList(
      RADAR_DISCOVERIES_KEY,
      upsertRadarDiscoveries(readList(RADAR_DISCOVERIES_KEY), radarDiscoveries),
    );
  }

  const position = positionFromEvaluation(ev, action);
  if (!position) return null;

  if (BUY_ACTIONS.has(action)) {
    const rows = upsertByTicker(readList(PORTFOLIO_KEY), position);
    writeList(PORTFOLIO_KEY, rows);
    return { bucket: 'portfolio', position };
  }

  const rows = upsertByTicker(readList(SHADOW_KEY), position);
  writeList(SHADOW_KEY, rows);
  return { bucket: 'shadow', position };
}

export function buildPortfolioSummary(realPositions, shadowPositions, livePrices = {}) {
  const aggregate = (positions) => {
    const totalCost = positions.reduce((sum, pos) => sum + pos.entry_price * pos.quantity, 0);
    const totalValue = positions.reduce((sum, pos) => {
      const price = livePrices[pos.ticker] ?? pos.current_price ?? pos.entry_price;
      return sum + price * pos.quantity;
    }, 0);
    const totalPnl = totalValue - totalCost;
    return {
      position_count: positions.length,
      total_cost_basis: totalCost,
      total_market_value: totalValue,
      total_unrealized_pnl: totalPnl,
      total_pnl_pct: totalCost > 0 ? (totalPnl / totalCost) * 100 : null,
      positions,
    };
  };

  return {
    real_portfolio: aggregate(realPositions),
    shadow_portfolio: aggregate(shadowPositions),
  };
}

export function clearLocalPortfolio() {
  writeList(PORTFOLIO_KEY, []);
}

export function clearLocalShadowLab() {
  writeList(SHADOW_KEY, []);
}

export function clearLocalRecentEvaluations() {
  writeList(RECENT_EVALUATIONS_KEY, []);
}

export function clearLocalRadarDiscoveries() {
  writeList(RADAR_DISCOVERIES_KEY, []);
}
