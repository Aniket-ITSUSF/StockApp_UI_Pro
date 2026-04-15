import axios from 'axios';

// Vite exposes env vars prefixed with VITE_ at build time.
// Set VITE_API_URL in your deployment platform to point at the Railway backend.
// Falls back to localhost for local dev.
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 90000,
});

export const getPortfolioSummary = () => api.get('/portfolio/summary');
export const evaluateTicker = (ticker) => api.post(`/evaluate/${ticker.toUpperCase().trim()}`);
export const getRecentEvaluations = () => api.get('/evaluations/recent');
export const getCurrentPrice   = (ticker)  => api.get(`/price/${ticker.toUpperCase().trim()}`);
export const getBatchPrices    = (tickers) => api.post('/prices/batch', { tickers });
export const getShadowPositions = ()       => api.get('/shadow/positions');

export default api;
