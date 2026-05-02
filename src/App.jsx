import { Component } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Analyze from './pages/Analyze';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import ShadowLab from './pages/ShadowLab';
import Settings from './pages/Settings';
import AiRadar from './pages/AiRadar';
import PreMarket from './pages/PreMarket';
import RecentIntelligence from './pages/RecentIntelligence';
import { BackendProvider } from './context/BackendContext';
import { AdProvider } from './components/ads/AdProvider';
import CookieConsent from './components/CookieConsent';
import './App.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, color: '#f43f5e', background: '#020617', fontFamily: 'monospace' }}>
          <h2 style={{ color: '#f43f5e' }}>Render Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#fca5a5', fontSize: 13 }}>
            {this.state.error.toString()}
            {'\n'}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BackendProvider>
        <AdProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Navigate to="/analyze" replace />} />
                <Route path="analyze" element={<Analyze />} />
                <Route path="home" element={<Dashboard />} />
                <Route path="holdings" element={<Portfolio />} />
                <Route path="today" element={<PreMarket />} />
                <Route path="discovery" element={<AiRadar />} />
                <Route path="history" element={<RecentIntelligence />} />
                <Route path="backtest" element={<ShadowLab />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/analyze" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <CookieConsent />
        </AdProvider>
      </BackendProvider>
    </ErrorBoundary>
  );
}
