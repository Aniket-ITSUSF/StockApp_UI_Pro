import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
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
