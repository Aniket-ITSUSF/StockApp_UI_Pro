import axios from 'axios';

// Vite bakes this in at build time. Set VITE_API_URL in your deployment platform.
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

// Health endpoint lives at the root — strip /api suffix
export const HEALTH_URL = BASE_URL.replace(/\/api\/?$/, '') + '/health';

// Human-readable backend origin for display in error messages
export const BACKEND_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 90000,
});

export const getHealth          = () => axios.get(HEALTH_URL, { timeout: 5000 });
export const getPortfolioSummary    = ()  => api.get('/portfolio/summary');
export const refreshPortfolioPrices = ()  => api.post('/portfolio/refresh');
export const evaluateTicker      = (ticker)  => api.post(`/evaluate/${ticker.toUpperCase().trim()}`);
export const evaluateTickerFast  = (ticker)  => api.post(`/evaluate/${ticker.toUpperCase().trim()}/fast`);
export const getRecentEvaluations = ()       => api.get('/evaluations/recent');
export const getCurrentPrice     = (ticker)  => api.get(`/price/${ticker.toUpperCase().trim()}`);
export const getBatchPrices      = (tickers) => api.post('/prices/batch', { tickers });
export const getShadowPositions    = ()                    => api.get('/shadow/positions');
export const getRecentDiscoveries  = ()                    => api.get('/discoveries/recent');
export const getEvaluationsPaged   = (page = 1, limit = 20) => api.get('/evaluations', { params: { page, limit } });
export const getDiscoveriesPaged   = (page = 1, limit = 20) => api.get('/discoveries', { params: { page, limit } });

export const getPreMarketHotlist   = (session = 'US') => api.get('/v1/research/pre-market/hotlist', { params: { market_session: session } });
export const runPreMarketAgent     = (session = 'US') => api.post(`/v1/research/pre-market/run?market_session=${session}`);

export default api;
