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
export const getPortfolioSummary = () => api.get('/portfolio/summary');
export const evaluateTicker      = (ticker)  => api.post(`/evaluate/${ticker.toUpperCase().trim()}`);
export const getRecentEvaluations = ()       => api.get('/evaluations/recent');
export const getCurrentPrice     = (ticker)  => api.get(`/price/${ticker.toUpperCase().trim()}`);
export const getBatchPrices      = (tickers) => api.post('/prices/batch', { tickers });
export const getShadowPositions  = ()        => api.get('/shadow/positions');

export default api;
