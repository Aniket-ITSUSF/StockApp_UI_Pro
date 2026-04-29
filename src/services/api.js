import axios from 'axios';
import { supabase, isSupabaseConfigured } from './supabase';

// Vite bakes this in at build time. Set VITE_API_URL in your deployment platform.
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

// Health endpoint lives at the root - strip /api suffix
export const HEALTH_URL = BASE_URL.replace(/\/api\/?$/, '') + '/health';

// Human-readable backend origin for display in error messages
export const BACKEND_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 90000,
});

// ── Auth interceptor ──────────────────────────────────────────────────────────
// Injects the current Supabase access token on every request. supabase-js
// automatically refreshes the token before it expires, so reading it lazily
// here is safe.
api.interceptors.request.use(async (config) => {
  if (!isSupabaseConfigured) return config;
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getHealth          = () => axios.get(HEALTH_URL, { timeout: 5000 });
export const getPortfolioSummary    = ()  => api.get('/portfolio/summary');
export const refreshPortfolioPrices = ()  => api.post('/portfolio/refresh');
export const evaluateTicker          = (ticker) => api.post(`/evaluate/${ticker.toUpperCase().trim()}`);
export const evaluateTickerFast      = (ticker) => api.post(`/evaluate/${ticker.toUpperCase().trim()}/fast`);
// Atomic sentiment endpoint: cache-first, 402 for free on cache miss.
export const evaluateTickerSentiment = (ticker) => api.post(`/evaluate/${ticker.toUpperCase().trim()}/sentiment`);
// Discovery endpoint: Pro+ only.
export const evaluateTickerDiscovery = (ticker) => api.post(`/evaluate/${ticker.toUpperCase().trim()}/discovery`);
export const getRecentEvaluations = ()       => api.get('/evaluations/recent');
export const getCurrentPrice     = (ticker)  => api.get(`/price/${ticker.toUpperCase().trim()}`);
export const getBatchPrices      = (tickers) => api.post('/prices/batch', { tickers });
export const getShadowPositions    = ()                    => api.get('/shadow/positions');
export const getRecentDiscoveries  = ()                    => api.get('/discoveries/recent');
export const getEvaluationsPaged   = (page = 1, limit = 20) => api.get('/evaluations', { params: { page, limit } });
export const getDiscoveriesPaged   = (page = 1, limit = 20) => api.get('/discoveries', { params: { page, limit } });

// ── Intraday Plays (Phase 8) ──────────────────────────────────────────────
// One canonical hotlist endpoint scoped by both `market_session` (US/India)
// and `session` (pre_market / morning / lunch / closing).
export const getPreMarketHotlist = (marketSession = 'India', session = 'pre_market') =>
  api.get('/v1/research/pre-market/hotlist', {
    params: { market_session: marketSession, session },
  });

export const runPreMarketAgent = (marketSession = 'India', session = 'pre_market') =>
  api.post('/v1/research/pre-market/run', null, {
    params: { market_session: marketSession, session },
  });

// Session-tagged hit-rate scoreboard - Ultra only.
export const getIntradayHitRate = (marketSession = 'India', days = 30) =>
  api.get('/v1/research/intraday/hit-rate', {
    params: { market_session: marketSession, days },
  });

// Live entry/stop/target alerts feed - Ultra only.
export const getIntradayAlerts = (marketSession = 'India', limit = 50) =>
  api.get('/v1/research/intraday/alerts', {
    params: { market_session: marketSession, limit },
  });

// Latest sector rotation snapshot (lunch session) - Ultra only.
export const getSectorRotation = (marketSession = 'India') =>
  api.get('/v1/research/intraday/sector-rotation', {
    params: { market_session: marketSession },
  });

// ── Authenticated user profile (Phase 1) ──────────────────────────────────────
export const getMe                 = () => api.get('/v1/me');
export const updateMe              = (payload) => api.patch('/v1/me', payload);

// ── Agent registry + tier limits (Phase 7) ────────────────────────────────────
// Public endpoint - works for anonymous visitors too. Authenticated callers
// receive their personalised lock/unlock + usage summary.
export const getAgentsCatalogue    = () => api.get('/v1/agents');

// ── Billing (Phase 6) ─────────────────────────────────────────────────────────
// Provider-agnostic billing endpoints. The frontend never imports the
// Razorpay SDK directly through axios - `services/razorpay.js` handles the
// browser-side checkout modal.
export const getBillingTiers       = () => api.get('/v1/billing/tiers');
export const createBillingCheckout = (tier) => api.post('/v1/billing/checkout', { tier });
export const verifyBillingPayment  = (payload) => api.post('/v1/billing/verify', payload);
// Server-side reconciliation against Razorpay's API - used as a safety net
// when the JS handler callback fails to fire after a successful payment.
export const reconcileBillingPayment = (payload) => api.post('/v1/billing/reconcile', payload);

export default api;
